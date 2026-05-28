/**
 * Analytics Store
 *
 * Persistente Event-Pipeline für High-End Tracking auf Web + Admin.
 *
 * Drei Speicher-Layer in dieser Reihenfolge:
 *  1. In-Memory Ring-Buffer (globalThis) — sofortige Reads, überlebt warme Lambdas
 *  2. /tmp NDJSON Append-Log — Persistenz innerhalb einer Lambda-Instanz
 *  3. (optional) Upstash Redis Sorted Set — echte Cross-Lambda-Persistenz,
 *     aktiviert wenn UPSTASH_REDIS_REST_URL gesetzt ist.
 *
 * Schema: jedes Event ist ein flaches JSON-Objekt mit Pflichtfeldern:
 *   id          — eindeutig
 *   type        — Event-Typ (siehe AnalyticsEventType)
 *   ts          — ISO-Timestamp
 *   sessionId   — Session-Bucket (anonym, vom Client gestellt)
 *   visitorId   — Visitor-Bucket (anonym, langlebig)
 *   brand       — "agiworks" | "nexcel"
 *   page        — pathname zum Event-Zeitpunkt
 *
 * Optionale Felder: referrer, host, ip, ua, device, viewport, country, value, meta
 */

import fs from "fs";
import path from "path";

export type AnalyticsBrand = "agiworks" | "nexcel";

export type AnalyticsEventType =
  // Navigation / Page
  | "page_view"
  | "scroll_depth"
  | "dwell"
  | "outbound_click"
  | "visibility_change"
  // Forms / Conversions
  | "contact_submit"
  | "demo_request"
  | "lead_submit"
  // Pricing-Wizard
  | "pricing_start"
  | "pricing_step"
  | "pricing_quote"
  | "pricing_submit"
  | "pricing_abandon"
  // Uploads
  | "upload_start"
  | "upload_complete"
  | "upload_fail"
  // Generic / Custom
  | "click"
  | "event";

export interface AnalyticsEvent {
  id: string;
  type: AnalyticsEventType;
  ts: string;
  sessionId: string;
  visitorId: string;
  brand: AnalyticsBrand;
  page: string;
  referrer?: string;
  host?: string;
  ipHash?: string;
  ua?: string;
  device?: "mobile" | "tablet" | "desktop";
  viewport?: { w: number; h: number };
  value?: number;
  meta?: Record<string, unknown>;
}

const IS_SERVERLESS =
  process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
const STORE_DIR = IS_SERVERLESS ? "/tmp/nx-analytics" : path.join(process.cwd(), "data");
const STORE_FILE = path.join(STORE_DIR, "analytics-events.ndjson");
const MAX_MEMORY_EVENTS = 5000;
const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB rotating log
const REDIS_KEY = "nx:analytics:events";
const REDIS_MAX_EVENTS = 50_000;

declare global {
  // eslint-disable-next-line no-var
  var __nxAnalytics:
    | {
        events: AnalyticsEvent[];
        loadedFromFile: boolean;
        loadedFromRedis: number; // timestamp of last full pull
      }
    | undefined;
}

function getStore() {
  if (!globalThis.__nxAnalytics) {
    globalThis.__nxAnalytics = { events: [], loadedFromFile: false, loadedFromRedis: 0 };
  }
  return globalThis.__nxAnalytics;
}

/* ───────────────────────── Upstash Redis (optional) ──────────────── */

let redisClientPromise: Promise<unknown> | null = null;
function redisAvailable(): boolean {
  return (
    !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN
  ) || (
    !!process.env.KV_REST_API_URL && !!process.env.KV_REST_API_TOKEN
  );
}

async function getRedis(): Promise<any | null> {
  if (!redisAvailable()) return null;
  if (!redisClientPromise) {
    redisClientPromise = (async () => {
      try {
        const mod = await import("@upstash/redis");
        const url =
          process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL!;
        const token =
          process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN!;
        const r = new mod.Redis({ url, token });
        return r;
      } catch (err) {
        console.warn("[analytics-store] @upstash/redis init failed:", err);
        return null;
      }
    })();
  }
  return redisClientPromise as Promise<any | null>;
}

async function pushToRedis(ev: AnalyticsEvent): Promise<void> {
  try {
    const r = await getRedis();
    if (!r) return;
    const score = new Date(ev.ts).getTime();
    // Use sorted set: score = ts, member = JSON. Allows efficient range queries.
    await r.zadd(REDIS_KEY, { score, member: JSON.stringify(ev) });
    // Trim to last N entries
    const count = await r.zcard(REDIS_KEY);
    if (typeof count === "number" && count > REDIS_MAX_EVENTS) {
      const excess = count - REDIS_MAX_EVENTS;
      await r.zremrangebyrank(REDIS_KEY, 0, excess - 1);
    }
  } catch (err) {
    console.warn("[analytics-store] redis push failed:", err);
  }
}

async function pullFromRedis(): Promise<AnalyticsEvent[]> {
  try {
    const r = await getRedis();
    if (!r) return [];
    // Highest-scored first → newest first → reverse to chronological
    const raw = (await r.zrange(REDIS_KEY, 0, MAX_MEMORY_EVENTS - 1, {
      rev: true,
    })) as unknown[];
    const events: AnalyticsEvent[] = [];
    for (const item of raw) {
      try {
        const parsed = typeof item === "string" ? JSON.parse(item) : (item as any);
        if (parsed && parsed.id) events.push(parsed as AnalyticsEvent);
      } catch {
        /* skip */
      }
    }
    return events.reverse(); // chronological
  } catch (err) {
    console.warn("[analytics-store] redis pull failed:", err);
    return [];
  }
}

async function syncFromRedisIfStale(maxStaleMs = 1500): Promise<void> {
  const store = getStore();
  if (!redisAvailable()) return;
  if (Date.now() - store.loadedFromRedis < maxStaleMs) return;
  const events = await pullFromRedis();
  if (events.length === 0) {
    store.loadedFromRedis = Date.now();
    return;
  }
  const seen = new Set(store.events.map((e) => e.id));
  for (const e of events) if (!seen.has(e.id)) store.events.push(e);
  store.events.sort((a, b) => a.ts.localeCompare(b.ts));
  if (store.events.length > MAX_MEMORY_EVENTS) {
    store.events = store.events.slice(-MAX_MEMORY_EVENTS);
  }
  store.loadedFromRedis = Date.now();
}

function ensureDir() {
  try {
    if (!fs.existsSync(STORE_DIR)) {
      fs.mkdirSync(STORE_DIR, { recursive: true });
    }
  } catch {
    /* ignore */
  }
}

function rotateIfNeeded() {
  try {
    if (!fs.existsSync(STORE_FILE)) return;
    const { size } = fs.statSync(STORE_FILE);
    if (size > MAX_FILE_BYTES) {
      const backup = `${STORE_FILE}.1`;
      try {
        fs.renameSync(STORE_FILE, backup);
      } catch {
        fs.unlinkSync(STORE_FILE);
      }
    }
  } catch {
    /* ignore */
  }
}

function loadFromFileOnce() {
  const store = getStore();
  if (store.loadedFromFile) return;
  store.loadedFromFile = true;
  try {
    if (!fs.existsSync(STORE_FILE)) return;
    const raw = fs.readFileSync(STORE_FILE, "utf-8");
    const lines = raw.split("\n").filter(Boolean);
    const events: AnalyticsEvent[] = [];
    for (const line of lines) {
      try {
        const ev = JSON.parse(line) as AnalyticsEvent;
        if (ev && ev.id && ev.type && ev.ts) events.push(ev);
      } catch {
        /* skip malformed */
      }
    }
    // Merge file-events into memory, dedupe by id, keep newest MAX
    const seen = new Set(store.events.map((e) => e.id));
    for (const e of events) if (!seen.has(e.id)) store.events.push(e);
    store.events.sort((a, b) => a.ts.localeCompare(b.ts));
    if (store.events.length > MAX_MEMORY_EVENTS) {
      store.events = store.events.slice(-MAX_MEMORY_EVENTS);
    }
  } catch (err) {
    console.warn("[analytics-store] file load failed:", err);
  }
}

function appendToFile(ev: AnalyticsEvent) {
  try {
    ensureDir();
    rotateIfNeeded();
    fs.appendFileSync(STORE_FILE, JSON.stringify(ev) + "\n", "utf-8");
  } catch (err) {
    console.warn("[analytics-store] file append failed:", err);
  }
}

/* ------------------------------------------------------------------ *
 * Public API
 * ------------------------------------------------------------------ */

export async function recordEvent(ev: AnalyticsEvent): Promise<void> {
  const store = getStore();
  loadFromFileOnce();
  // Avoid double inserts
  if (store.events.some((e) => e.id === ev.id)) return;
  store.events.push(ev);
  if (store.events.length > MAX_MEMORY_EVENTS) {
    store.events = store.events.slice(-MAX_MEMORY_EVENTS);
  }
  appendToFile(ev);
  // Best-effort persist to redis. Awaiting keeps the lambda warm long
  // enough for the write to complete on Vercel.
  await pushToRedis(ev);
}

export interface AnalyticsQuery {
  brand?: AnalyticsBrand | "all";
  since?: Date;
  limit?: number;
  types?: AnalyticsEventType[];
}

export async function listEvents(q: AnalyticsQuery = {}): Promise<AnalyticsEvent[]> {
  const store = getStore();
  loadFromFileOnce();
  await syncFromRedisIfStale();
  const sinceMs = q.since ? q.since.getTime() : 0;
  const filtered = store.events.filter((e) => {
    if (q.brand && q.brand !== "all" && e.brand !== q.brand) return false;
    if (sinceMs && new Date(e.ts).getTime() < sinceMs) return false;
    if (q.types && !q.types.includes(e.type)) return false;
    return true;
  });
  // newest first
  const sorted = filtered.slice().sort((a, b) => b.ts.localeCompare(a.ts));
  return q.limit ? sorted.slice(0, q.limit) : sorted;
}

export interface AnalyticsSnapshot {
  totals: {
    events: number;
    pageViews: number;
    sessions: number;
    visitors: number;
    contacts: number;
    demos: number;
    pricingStarts: number;
    pricingQuotes: number;
    pricingSubmits: number;
    uploads: number;
  };
  liveVisitors: number; // sessions active in last 90s
  buckets: {
    last24h: BucketStats;
    last7d: BucketStats;
    last30d: BucketStats;
  };
  funnel: FunnelStats;
  topPages: Array<{ page: string; views: number; avgScroll: number; avgDwellSec: number }>;
  topReferrers: Array<{ referrer: string; count: number }>;
  deviceMix: Array<{ device: string; count: number }>;
  brandSplit: Array<{ brand: AnalyticsBrand; count: number }>;
  scrollDepthHistogram: Array<{ bucket: string; count: number }>;
  recentSessions: SessionSummary[];
  recentEvents: AnalyticsEvent[];
}

interface BucketStats {
  pageViews: number;
  sessions: number;
  contacts: number;
  demos: number;
  pricingStarts: number;
  uploads: number;
}

interface FunnelStats {
  pageView: number;
  pricingStart: number;
  pricingQuote: number;
  pricingSubmit: number;
  contactSubmit: number;
}

export interface SessionSummary {
  sessionId: string;
  visitorId: string;
  brand: AnalyticsBrand;
  firstSeen: string;
  lastSeen: string;
  pageViews: number;
  events: number;
  device?: string;
  ua?: string;
  referrer?: string;
  durationSec: number;
  maxScroll: number;
  converted: boolean;
}

export async function getSnapshot(
  brand: AnalyticsBrand | "all" = "all",
): Promise<AnalyticsSnapshot> {
  const store = getStore();
  loadFromFileOnce();
  await syncFromRedisIfStale();
  const all = store.events.filter((e) =>
    brand === "all" ? true : e.brand === brand,
  );

  const now = Date.now();
  const since = (mins: number) => now - mins * 60 * 1000;
  const ms24h = since(60 * 24);
  const ms7d = since(60 * 24 * 7);
  const ms30d = since(60 * 24 * 30);
  const liveCutoff = since(1.5);

  const inRange = (ev: AnalyticsEvent, start: number) =>
    new Date(ev.ts).getTime() >= start;

  const bucket = (start: number): BucketStats => {
    const evs = all.filter((e) => inRange(e, start));
    const sessionSet = new Set(evs.map((e) => e.sessionId));
    return {
      pageViews: evs.filter((e) => e.type === "page_view").length,
      sessions: sessionSet.size,
      contacts: evs.filter((e) => e.type === "contact_submit").length,
      demos: evs.filter((e) => e.type === "demo_request").length,
      pricingStarts: evs.filter((e) => e.type === "pricing_start").length,
      uploads: evs.filter((e) => e.type === "upload_complete").length,
    };
  };

  const liveSessions = new Set(
    all.filter((e) => new Date(e.ts).getTime() >= liveCutoff).map((e) => e.sessionId),
  );

  // Per-page aggregation
  const pageMap = new Map<
    string,
    { views: number; scrolls: number[]; dwells: number[] }
  >();
  for (const ev of all) {
    if (!pageMap.has(ev.page)) pageMap.set(ev.page, { views: 0, scrolls: [], dwells: [] });
    const p = pageMap.get(ev.page)!;
    if (ev.type === "page_view") p.views += 1;
    if (ev.type === "scroll_depth" && typeof ev.value === "number") p.scrolls.push(ev.value);
    if (ev.type === "dwell" && typeof ev.value === "number") p.dwells.push(ev.value);
  }
  const topPages = Array.from(pageMap.entries())
    .map(([page, v]) => ({
      page,
      views: v.views,
      avgScroll: v.scrolls.length
        ? Math.round(v.scrolls.reduce((a, b) => a + b, 0) / v.scrolls.length)
        : 0,
      avgDwellSec: v.dwells.length
        ? Math.round(v.dwells.reduce((a, b) => a + b, 0) / v.dwells.length)
        : 0,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 12);

  // Referrers
  const refMap = new Map<string, number>();
  for (const ev of all) {
    if (ev.type !== "page_view") continue;
    let ref = (ev.referrer ?? "").trim();
    if (!ref || ref === "-") ref = "Direct";
    else {
      try {
        const u = new URL(ref);
        ref = u.hostname || ref;
      } catch {
        /* keep raw */
      }
    }
    refMap.set(ref, (refMap.get(ref) ?? 0) + 1);
  }
  const topReferrers = Array.from(refMap.entries())
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Device mix
  const devMap = new Map<string, number>();
  for (const ev of all) {
    if (ev.type !== "page_view") continue;
    const d = ev.device ?? "unknown";
    devMap.set(d, (devMap.get(d) ?? 0) + 1);
  }
  const deviceMix = Array.from(devMap.entries())
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);

  // Brand split
  const brandMap = new Map<AnalyticsBrand, number>();
  for (const ev of all) {
    if (ev.type !== "page_view") continue;
    brandMap.set(ev.brand, (brandMap.get(ev.brand) ?? 0) + 1);
  }
  const brandSplit = Array.from(brandMap.entries())
    .map(([b, count]) => ({ brand: b, count }))
    .sort((a, b) => b.count - a.count);

  // Scroll depth histogram
  const buckets = ["0-25", "26-50", "51-75", "76-99", "100"];
  const scrollCounts = new Map(buckets.map((b) => [b, 0] as [string, number]));
  for (const ev of all) {
    if (ev.type !== "scroll_depth" || typeof ev.value !== "number") continue;
    const v = Math.min(100, Math.max(0, ev.value));
    let key = "0-25";
    if (v >= 100) key = "100";
    else if (v >= 76) key = "76-99";
    else if (v >= 51) key = "51-75";
    else if (v >= 26) key = "26-50";
    scrollCounts.set(key, (scrollCounts.get(key) ?? 0) + 1);
  }
  const scrollDepthHistogram = Array.from(scrollCounts.entries()).map(([b, c]) => ({
    bucket: b,
    count: c,
  }));

  // Sessions
  const sessionMap = new Map<string, AnalyticsEvent[]>();
  for (const ev of all) {
    if (!sessionMap.has(ev.sessionId)) sessionMap.set(ev.sessionId, []);
    sessionMap.get(ev.sessionId)!.push(ev);
  }
  const sessions: SessionSummary[] = Array.from(sessionMap.entries()).map(
    ([sessionId, evs]) => {
      evs.sort((a, b) => a.ts.localeCompare(b.ts));
      const first = evs[0];
      const last = evs[evs.length - 1];
      const pageViews = evs.filter((e) => e.type === "page_view").length;
      const scrolls = evs
        .filter((e) => e.type === "scroll_depth")
        .map((e) => e.value ?? 0);
      const maxScroll = scrolls.length ? Math.max(...scrolls) : 0;
      const converted = evs.some(
        (e) =>
          e.type === "contact_submit" ||
          e.type === "demo_request" ||
          e.type === "pricing_submit" ||
          e.type === "lead_submit",
      );
      return {
        sessionId,
        visitorId: first.visitorId,
        brand: first.brand,
        firstSeen: first.ts,
        lastSeen: last.ts,
        pageViews,
        events: evs.length,
        device: first.device,
        ua: first.ua,
        referrer: first.referrer,
        durationSec: Math.max(
          0,
          Math.round((new Date(last.ts).getTime() - new Date(first.ts).getTime()) / 1000),
        ),
        maxScroll,
        converted,
      };
    },
  );
  sessions.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  const recentSessions = sessions.slice(0, 25);

  const totals = {
    events: all.length,
    pageViews: all.filter((e) => e.type === "page_view").length,
    sessions: sessionMap.size,
    visitors: new Set(all.map((e) => e.visitorId)).size,
    contacts: all.filter((e) => e.type === "contact_submit").length,
    demos: all.filter((e) => e.type === "demo_request").length,
    pricingStarts: all.filter((e) => e.type === "pricing_start").length,
    pricingQuotes: all.filter((e) => e.type === "pricing_quote").length,
    pricingSubmits: all.filter((e) => e.type === "pricing_submit").length,
    uploads: all.filter((e) => e.type === "upload_complete").length,
  };

  const funnel: FunnelStats = {
    pageView: totals.pageViews,
    pricingStart: totals.pricingStarts,
    pricingQuote: totals.pricingQuotes,
    pricingSubmit: totals.pricingSubmits,
    contactSubmit: totals.contacts,
  };

  const recentEvents = all
    .slice()
    .sort((a, b) => b.ts.localeCompare(a.ts))
    .slice(0, 80);

  return {
    totals,
    liveVisitors: liveSessions.size,
    buckets: {
      last24h: bucket(ms24h),
      last7d: bucket(ms7d),
      last30d: bucket(ms30d),
    },
    funnel,
    topPages,
    topReferrers,
    deviceMix,
    brandSplit,
    scrollDepthHistogram,
    recentSessions,
    recentEvents,
  };
}

export async function getSessionDetail(
  sessionId: string,
): Promise<{
  session: SessionSummary | null;
  events: AnalyticsEvent[];
}> {
  const store = getStore();
  loadFromFileOnce();
  await syncFromRedisIfStale();
  const evs = store.events
    .filter((e) => e.sessionId === sessionId)
    .sort((a, b) => a.ts.localeCompare(b.ts));
  if (evs.length === 0) return { session: null, events: [] };
  const first = evs[0];
  const last = evs[evs.length - 1];
  const scrolls = evs.filter((e) => e.type === "scroll_depth").map((e) => e.value ?? 0);
  const session: SessionSummary = {
    sessionId,
    visitorId: first.visitorId,
    brand: first.brand,
    firstSeen: first.ts,
    lastSeen: last.ts,
    pageViews: evs.filter((e) => e.type === "page_view").length,
    events: evs.length,
    device: first.device,
    ua: first.ua,
    referrer: first.referrer,
    durationSec: Math.max(
      0,
      Math.round((new Date(last.ts).getTime() - new Date(first.ts).getTime()) / 1000),
    ),
    maxScroll: scrolls.length ? Math.max(...scrolls) : 0,
    converted: evs.some(
      (e) =>
        e.type === "contact_submit" ||
        e.type === "demo_request" ||
        e.type === "pricing_submit",
    ),
  };
  return { session, events: evs };
}

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

export function deviceFromUA(ua: string | undefined): "mobile" | "tablet" | "desktop" {
  const u = (ua || "").toLowerCase();
  if (/ipad|tablet/.test(u)) return "tablet";
  if (/mobi|iphone|android.*mobile/.test(u)) return "mobile";
  return "desktop";
}

export function brandFromHost(host: string | undefined | null): AnalyticsBrand {
  if (!host) return "nexcel";
  return host.toLowerCase().includes("agiworks") ? "agiworks" : "nexcel";
}

export function hashIp(ip: string | undefined | null): string | undefined {
  if (!ip) return undefined;
  // Lightweight FNV-1a — enough for k-anonymity bucketing
  let hash = 2166136261;
  for (let i = 0; i < ip.length; i++) {
    hash ^= ip.charCodeAt(i);
    hash = (hash * 16777619) >>> 0;
  }
  return hash.toString(36);
}

export function generateId(prefix = "ev"): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
