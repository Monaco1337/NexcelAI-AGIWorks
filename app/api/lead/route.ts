import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { rateLimit, rateLimitKey } from "@/lib/security/rateLimit";
import { checkHoneypot, HONEYPOT_FIELD, HONEYPOT_TIME_FIELD } from "@/lib/security/honeypot";
import { resolveAttribution } from "@/lib/seo/leadAttribution";
import { recordInboundLead } from "@/lib/sales/inboundIntake";

export const runtime = "nodejs";

// This instance-local guard complements validation and database idempotency;
// it is not a substitute for an edge/distributed rate limit or bot protection.
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 6 };

type LeadBrand = "agiworks" | "nexcel";

interface ClientAttribution {
  landingPath?: string;
  referrer?: string | null;
  utm?: Record<string, string | undefined | null>;
  firstSeenAt?: string;
}
interface LeadBody {
  name: string;
  email: string;
  company?: string;
  message?: string;
  state?: Record<string, unknown>;
  quote?: { min: number; max: number; weeksMin: number; weeksMax: number } | null;
  brand?: LeadBrand;
  attribution?: ClientAttribution;
  [HONEYPOT_FIELD]?: unknown;
  [HONEYPOT_TIME_FIELD]?: unknown;
}

const json = (body: object, status = 200) =>
  NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  try {
    const length = Number(req.headers.get("content-length") || 0);
    if (length > 20_000) return json({ error: "Anfrage ist zu umfangreich." }, 413);
    const limit = rateLimit(rateLimitKey("lead", req.headers), RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json({ error: "Zu viele Anfragen." }, {
        status: 429, headers: { "Retry-After": String(limit.retryAfter), "Cache-Control": "no-store" },
      });
    }

    const body: LeadBody = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "Ungültige Daten." }, 400);
    const hp = checkHoneypot({ value: body[HONEYPOT_FIELD] });
    if (hp.bot) {
      // Maintain the existing non-disclosure behavior for honeypot submissions.
      return json({ success: true, message: "Anfrage wurde gespeichert. Wir melden uns zeitnah." });
    }
    if (typeof body.name !== "string" || !body.name.trim() || body.name.length > 160) return json({ error: "Ungültiger Name." }, 400);
    if (typeof body.email !== "string" || body.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) return json({ error: "Ungültige E-Mail-Adresse." }, 400);
    if (body.company !== undefined && (typeof body.company !== "string" || body.company.length > 160)) return json({ error: "Ungültiges Unternehmen." }, 400);
    if (body.message !== undefined && (typeof body.message !== "string" || body.message.length > 6000)) return json({ error: "Ungültige Nachricht." }, 400);
    const state = body.state && typeof body.state === "object" && !Array.isArray(body.state) ? body.state : {};
    const quote = body.quote ?? null;
    if (JSON.stringify({ state, quote }).length > 10_000) return json({ error: "Zu viele Formulardaten." }, 413);

    // Brand comes from the real host; a client-provided brand never overrides it.
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const attribution = resolveAttribution({
      host,
      landingPath: body.attribution?.landingPath,
      referrer: body.attribution?.referrer ?? null,
      utm: body.attribution?.utm ?? null,
      firstSeenAt: body.attribution?.firstSeenAt,
      fallbackBrand: body.brand,
    });
    const email = body.email.trim().toLowerCase();
    const company = body.company?.trim() ?? "";
    const message = body.message?.trim() ?? "";
    // Double-click / network-retry dedupe only inside a 15-minute window.
    const windowId = Math.floor(Date.now() / (15 * 60 * 1000));
    const sourceId = createHash("sha256")
      .update(`${attribution.brand}\n${email}\n${company}\n${message}\n${windowId}`)
      .digest("hex");
    const result = await recordInboundLead({
      sourceType: "calculator",
      sourceId,
      brand: attribution.brand,
      name: body.name,
      email,
      company,
      subject: "Anfrage aus dem Preiskalkulator",
      message,
      attribution: attribution as unknown as Record<string, unknown>,
      details: { state, quote },
    });
    if (result === "unavailable") return json({ error: "Speicherung nicht verfügbar. Bitte erneut versuchen." }, 503);
    return json({ success: true, message: "Anfrage wurde gespeichert. Wir melden uns zeitnah." });
  } catch (error) {
    // Keep payload/PII out of the logs.
    console.error("[API lead] intake failed:", error instanceof Error ? error.name : "unknown");
    return json({ error: "Speicherung fehlgeschlagen. Bitte erneut versuchen." }, 500);
  }
}
