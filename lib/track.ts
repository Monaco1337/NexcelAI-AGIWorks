/**
 * Client-side tracking helper.
 *
 * Exposes a single function `track(type, data?)` that the rest of the
 * frontend can call to fire custom analytics events (pricing wizard
 * steps, file uploads, button clicks, ...).
 *
 * Usage:
 *   import { track } from "@/lib/track";
 *   track("pricing_start", { projectType: "saas" });
 *
 * Identity:
 *   We persist `nx_visitor_id` (long-lived) and `nx_session_id`
 *   (30 min sliding window) in localStorage. The session id is
 *   regenerated when the user returns after >30 min of inactivity.
 *
 * Transport:
 *   navigator.sendBeacon when available (survives page unload),
 *   fetch keepalive as fallback. Errors are silently ignored — we never
 *   want analytics to break user flows.
 */

const VISITOR_KEY = "nx_visitor_id";
const SESSION_KEY = "nx_session_id";
const SESSION_TS_KEY = "nx_session_ts";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min

function rid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function safeRead(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

export function getVisitorId(): string {
  let id = safeRead(VISITOR_KEY);
  if (!id) {
    id = rid("v");
    safeWrite(VISITOR_KEY, id);
  }
  return id;
}

export function getSessionId(): string {
  const now = Date.now();
  const lastTsRaw = safeRead(SESSION_TS_KEY);
  const lastTs = lastTsRaw ? parseInt(lastTsRaw, 10) : 0;
  const stored = safeRead(SESSION_KEY);
  let sid = stored;
  if (!sid || !lastTs || now - lastTs > SESSION_TTL_MS) {
    sid = rid("s");
    safeWrite(SESSION_KEY, sid);
  }
  safeWrite(SESSION_TS_KEY, String(now));
  return sid;
}

function detectBrand(): "agiworks" | "nexcel" {
  if (typeof window === "undefined") return "nexcel";
  const host = window.location.hostname.toLowerCase();
  const path = window.location.pathname || "/";
  if (host.includes("agiworks")) return "agiworks";
  if (path === "/agiworks" || path.startsWith("/agiworks/")) return "agiworks";
  return "nexcel";
}

export interface TrackPayload {
  type: string;
  page?: string;
  value?: number;
  meta?: Record<string, unknown>;
}

export function track(type: string, data: Omit<TrackPayload, "type"> = {}): void {
  if (typeof window === "undefined") return;
  try {
    const body = {
      type,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      brand: detectBrand(),
      page: data.page ?? window.location.pathname + window.location.search,
      referrer: document.referrer || undefined,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      value: data.value,
      meta: data.meta,
    };
    const blob = new Blob([JSON.stringify(body)], { type: "application/json" });
    const url = "/api/analytics/track";
    if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
  } catch {
    /* swallow */
  }
}

/* Convenience: dispatch a batch (used on unload to flush dwell+scroll). */
export function trackBatch(events: TrackPayload[]): void {
  if (typeof window === "undefined" || events.length === 0) return;
  try {
    const session = getSessionId();
    const visitor = getVisitorId();
    const brand = detectBrand();
    const enriched = events.map((e) => ({
      ...e,
      sessionId: session,
      visitorId: visitor,
      brand,
      page: e.page ?? window.location.pathname + window.location.search,
      referrer: document.referrer || undefined,
      viewport: { w: window.innerWidth, h: window.innerHeight },
    }));
    const blob = new Blob([JSON.stringify({ events: enriched, type: "_batch" })], {
      type: "application/json",
    });
    const url = "/api/analytics/track";
    if (navigator.sendBeacon && navigator.sendBeacon(url, blob)) return;
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: enriched, type: "_batch" }),
      keepalive: true,
    }).catch(() => {
      /* swallow */
    });
  } catch {
    /* swallow */
  }
}

/* Make available on window so non-React code (or quick tests) can fire too. */
if (typeof window !== "undefined") {
  (window as unknown as { __nxtrack?: typeof track }).__nxtrack = track;
}
