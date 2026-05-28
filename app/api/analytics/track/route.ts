import { NextRequest, NextResponse } from "next/server";
import {
  recordEvent,
  deviceFromUA,
  brandFromHost,
  hashIp,
  generateId,
  type AnalyticsEvent,
  type AnalyticsEventType,
} from "@/lib/analytics-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const ALLOWED_TYPES: AnalyticsEventType[] = [
  "page_view",
  "scroll_depth",
  "dwell",
  "outbound_click",
  "visibility_change",
  "contact_submit",
  "demo_request",
  "lead_submit",
  "pricing_start",
  "pricing_step",
  "pricing_quote",
  "pricing_submit",
  "pricing_abandon",
  "upload_start",
  "upload_complete",
  "upload_fail",
  "click",
  "event",
];

interface ClientPayload {
  type: string;
  sessionId?: string;
  visitorId?: string;
  page?: string;
  referrer?: string;
  brand?: "agiworks" | "nexcel";
  viewport?: { w: number; h: number };
  value?: number;
  meta?: Record<string, unknown>;
  events?: ClientPayload[];
}

function parseBody(raw: string | null): ClientPayload | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ClientPayload;
  } catch {
    return null;
  }
}

function ingestOne(payload: ClientPayload, ctx: {
  host: string;
  ua: string;
  ip: string | null;
  fallbackBrand: "agiworks" | "nexcel";
}) {
  const type = ALLOWED_TYPES.includes(payload.type as AnalyticsEventType)
    ? (payload.type as AnalyticsEventType)
    : "event";
  const ev: AnalyticsEvent = {
    id: generateId(type === "page_view" ? "pv" : type === "scroll_depth" ? "sd" : "ev"),
    type,
    ts: new Date().toISOString(),
    sessionId: typeof payload.sessionId === "string" && payload.sessionId.length > 4
      ? payload.sessionId
      : `s_anon_${Date.now()}`,
    visitorId: typeof payload.visitorId === "string" && payload.visitorId.length > 4
      ? payload.visitorId
      : `v_anon_${Date.now()}`,
    brand: payload.brand === "agiworks" || payload.brand === "nexcel"
      ? payload.brand
      : ctx.fallbackBrand,
    page: typeof payload.page === "string" ? payload.page.slice(0, 256) : "/",
    referrer: typeof payload.referrer === "string" ? payload.referrer.slice(0, 512) : undefined,
    host: ctx.host || undefined,
    ipHash: hashIp(ctx.ip),
    ua: ctx.ua.slice(0, 256) || undefined,
    device: deviceFromUA(ctx.ua),
    viewport:
      payload.viewport &&
      typeof payload.viewport.w === "number" &&
      typeof payload.viewport.h === "number"
        ? { w: Math.round(payload.viewport.w), h: Math.round(payload.viewport.h) }
        : undefined,
    value: typeof payload.value === "number" ? payload.value : undefined,
    meta: payload.meta && typeof payload.meta === "object" ? payload.meta : undefined,
  };
  recordEvent(ev);
  return ev;
}

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    const body = parseBody(text);
    if (!body) {
      return NextResponse.json({ ok: false, error: "invalid payload" }, { status: 400 });
    }

    const headers = req.headers;
    const host =
      headers.get("x-forwarded-host") ||
      headers.get("host") ||
      "";
    const ua = headers.get("user-agent") || "";
    const ip =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      headers.get("x-real-ip") ||
      null;
    const fallbackBrand = brandFromHost(host);
    const ctx = { host, ua, ip, fallbackBrand };

    let count = 0;
    if (Array.isArray(body.events)) {
      for (const item of body.events) {
        if (item && typeof item === "object") {
          ingestOne(item, ctx);
          count++;
        }
      }
    } else {
      ingestOne(body, ctx);
      count = 1;
    }

    return NextResponse.json(
      { ok: true, count },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (err) {
    console.error("[analytics/track]", err);
    return NextResponse.json({ ok: true, count: 0 }, { status: 200 });
  }
}
