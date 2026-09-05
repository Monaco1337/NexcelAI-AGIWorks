// Server-side HTML fetcher for the on-device scanner.
// IMPORTANT: this is the ONLY server hop — we just resolve CORS by
// fetching the page on the server. No external AI APIs are called.

import { NextRequest, NextResponse } from "next/server";
import { normalizeUrl, safeFetch } from "@/lib/sales/targets/security/safeFetch";
import { rateLimitDistributed, rateLimitKey } from "@/lib/security/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2_500_000;

export async function POST(req: NextRequest) {
  const limit = await rateLimitDistributed(rateLimitKey("scanner-fetch", req.headers), {
    windowMs: 10 * 60_000,
    max: 10,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: limit.reason === "backend_unavailable" ? "Schutzdienst nicht verfügbar" : "Zu viele Anfragen" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let url: string;
  try {
    const body = await req.json();
    url = String(body?.url || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  const normalized = normalizeUrl(url);
  if (!normalized) return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });

  const result = await safeFetch(normalized, {
    timeoutMs: 12_000,
    maxBytes: MAX_BYTES,
    userAgent: "Mozilla/5.0 (compatible; NexcelScanner/1.0; +https://nexcel.ai)",
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? `HTTP ${result.status}` }, { status: 502 });
  }
  const exposedHeaders = Object.fromEntries(
    ["content-type", "content-length", "cache-control", "last-modified"]
      .filter((key) => result.headers[key])
      .map((key) => [key, result.headers[key]]),
  );
  return NextResponse.json({
    url: normalized,
    finalUrl: result.finalUrl,
    status: result.status,
    headers: exposedHeaders,
    html: result.bodyText,
    bytes: result.bytesRead,
    fetchedAt: Date.now(),
    durationMs: result.latencyMs,
  });
}
