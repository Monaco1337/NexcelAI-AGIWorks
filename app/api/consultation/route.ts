import { NextRequest, NextResponse } from "next/server";
import { createBooking } from "@/lib/consultations/store";
import { recordInboundLead } from "@/lib/sales/inboundIntake";
import { resolveAttribution } from "@/lib/seo/leadAttribution";
import { rateLimit, rateLimitKey } from "@/lib/security/rateLimit";
import type { ConsultationBrand } from "@/lib/consultations/slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES = new Set(["ki-agenten", "automatisierung", "eigene-llms", "softwareentwicklung", "crm-erp", "web-app", "anderes"]);
const TIMEFRAMES = new Set(["sofort", "1-3-monate", "3-6-monate", "offen"]);
const BUDGETS = new Set(["offen", "unter-5000", "5000-20000", "ueber-20000"]);
function str(value: unknown, max: number, min = 0): string | null {
  if (typeof value !== "string" || value.length > max) return null;
  const text = value.trim();
  return text.length >= min ? text : null;
}
const reply = (body: object, status: number) => NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req: NextRequest) {
  const length = Number(req.headers.get("content-length") || "0");
  if (length > 10_000) return reply({ error: "Anfrage zu groß" }, 413);
  if (!req.headers.get("content-type")?.startsWith("application/json")) return reply({ error: "JSON erwartet" }, 415);
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.nextUrl.host) return reply({ error: "Origin nicht erlaubt" }, 403);
    } catch { return reply({ error: "Ungültiger Origin" }, 403); }
  }
  const limit = rateLimit(rateLimitKey("consultation", req.headers), { windowMs: 10 * 60_000, max: 5 });
  if (!limit.allowed) return reply({ error: "Zu viele Versuche. Bitte später erneut versuchen." }, 429);
  let data: Record<string, unknown>;
  try {
    const value: unknown = await req.json();
    if (!value || typeof value !== "object" || Array.isArray(value)) return reply({ error: "Ungültige Anfrage" }, 400);
    data = value as Record<string, unknown>;
  } catch { return reply({ error: "Ungültiges JSON" }, 400); }
  if (JSON.stringify(data).length > 10_000) return reply({ error: "Anfrage zu groß" }, 413);
  if (data.website) return reply({ error: "Anfrage konnte nicht verarbeitet werden" }, 400);
  if (data.privacyAcknowledged !== true) return reply({ error: "Bitte Datenschutzhinweise bestätigen" }, 400);
  const brand = data.brand;
  if (brand !== "nexcel" && brand !== "agiworks") return reply({ error: "Ungültige Marke" }, 400);
  const host = req.nextUrl.hostname.toLowerCase();
  // Production host is authoritative. Preview/local can serve either internal route.
  if (host.endsWith("nexcelai.de") && brand !== "nexcel") return reply({ error: "Falsche Marke" }, 400);
  if (host.endsWith("agiworks.de") && brand !== "agiworks") return reply({ error: "Falsche Marke" }, 400);
  const name = str(data.name, 150, 2);
  const email = str(data.email, 254, 5)?.toLowerCase();
  const company = str(data.company, 150, 2);
  const projectType = str(data.projectType, 80);
  const projectGoal = str(data.projectGoal, 2000, 20);
  const timeframe = str(data.timeframe, 40);
  const budgetRange = str(data.budgetRange, 40);
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !company || !projectType || !TYPES.has(projectType) || !projectGoal || !timeframe || !TIMEFRAMES.has(timeframe) || !budgetRange || !BUDGETS.has(budgetRange) || typeof data.startsAt !== "string") {
    return reply({ error: "Bitte Eingaben prüfen" }, 400);
  }
  const raw = data.attribution && typeof data.attribution === "object" && !Array.isArray(data.attribution)
    ? data.attribution as { landingPath?: string; referrer?: string; utm?: Record<string, string>; firstSeenAt?: string }
    : {};
  const attribution = resolveAttribution({
    host: req.headers.get("host"), fallbackBrand: brand as ConsultationBrand,
    landingPath: typeof raw.landingPath === "string" ? raw.landingPath : null,
    referrer: typeof raw.referrer === "string" ? raw.referrer.slice(0, 2000) : null,
    utm: raw.utm && typeof raw.utm === "object" && !Array.isArray(raw.utm) ? raw.utm : null,
    firstSeenAt: typeof raw.firstSeenAt === "string" ? raw.firstSeenAt : null,
  });
  // AI search attribution is evidence-based: only recognized referrer hosts count.
  // Referrers may be stripped by the originating app; do not infer AI traffic.
  const observedHost = (attribution.referrerHost ?? "").replace(/^www\./, "");
  const aiReferral = new Set([
    "chatgpt.com", "chat.openai.com", "perplexity.ai", "claude.ai",
    "gemini.google.com", "copilot.microsoft.com", "you.com",
  ]).has(observedHost);
  const bookingAttribution: Record<string, unknown> = { ...attribution, observedAiReferral: aiReferral };
  try {
    const result = await createBooking({ brand: brand as ConsultationBrand, startsAt: data.startsAt, name, email, company, projectType, projectGoal, timeframe, budgetRange, attribution: bookingAttribution });
    if (result.status === "unavailable") return reply({ error: "Buchungssystem momentan nicht verfügbar" }, 503);
    if (result.status === "occupied") return reply({ error: "Termin nicht mehr verfügbar. Bitte anderen Termin wählen." }, 409);
    if (result.status === "limit") return reply({ error: "Es bestehen bereits zwei neue Buchungen für diese E-Mail-Adresse." }, 429);
    // Idempotent CRM sync; protected cron reconciles it when this operation fails.
    try {
      await recordInboundLead({
        sourceType: "booking", sourceId: result.id, brand: brand as ConsultationBrand,
        name, email, company, subject: `Terminanfrage: ${projectType}`, message: projectGoal,
        details: { startsAt: result.slot.startsAt, endsAt: result.slot.endsAt, timeframe, budgetRange },
        attribution: { ...bookingAttribution, origin: "consultation-booking" },
      });
    } catch { console.error("[consultation] CRM sync queued for recovery"); }
    return reply({ requested: true, bookingId: result.id, slot: result.slot }, 201);
  } catch {
    console.error("[consultation] reservation failed");
    return reply({ error: "Buchung derzeit nicht möglich" }, 503);
  }
}
