import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { rateLimit, rateLimitKey } from "@/lib/security/rateLimit";
import { checkHoneypot, HONEYPOT_FIELD, HONEYPOT_TIME_FIELD } from "@/lib/security/honeypot";
import {
  resolveAttribution,
  type LeadAttribution,
} from "@/lib/seo/leadAttribution";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

// Public form → conservative per-IP quota (per server instance).
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
  /** Honeypot field (must be empty for humans). */
  [HONEYPOT_FIELD]?: unknown;
  /** Client render timestamp for optional timing check. */
  [HONEYPOT_TIME_FIELD]?: unknown;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

type StoredLead = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  company?: string;
  message?: string;
  state?: Record<string, unknown>;
  quote?: LeadBody["quote"];
  brand: LeadBrand;
  sourceHost?: string;
  attribution: LeadAttribution;
};

function loadLeads(): StoredLead[] {
  ensureDataDir();
  if (!fs.existsSync(LEADS_FILE)) return [];
  try {
    const raw = fs.readFileSync(LEADS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveLead(lead: StoredLead) {
  const leads = loadLeads();
  leads.push(lead);
  ensureDataDir();
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
}

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limit (per IP, per server instance).
    const limit = rateLimit(rateLimitKey("lead", req.headers), RATE_LIMIT);
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "Zu viele Anfragen. Bitte versuchen Sie es später erneut." },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } }
      );
    }

    const body = (await req.json()) as LeadBody;
    const { name, email, company, message, state, quote } = body;

    // 2. Honeypot: silently accept (200) but never store bot submissions, so we
    //    do not reveal the trap. Timing check stays off (renderedAt only).
    const hp = checkHoneypot({ value: body[HONEYPOT_FIELD] });
    if (hp.bot) {
      return NextResponse.json({
        success: true,
        message: "Anfrage wurde gespeichert. Wir melden uns zeitnah.",
      });
    }

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json(
        { error: "Name ist erforderlich." },
        { status: 400 }
      );
    }
    if (!email || typeof email !== "string" || !email.trim()) {
      return NextResponse.json(
        { error: "E-Mail ist erforderlich." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { error: "Ungültige E-Mail-Adresse." },
        { status: 400 }
      );
    }

    // 3. Attribution — brand is ALWAYS server-derived from the host, never
    //    trusted from the client. Client only supplies non-PII first-touch hints.
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const attribution = resolveAttribution({
      host,
      landingPath: body.attribution?.landingPath,
      referrer: body.attribution?.referrer ?? null,
      utm: body.attribution?.utm ?? null,
      firstSeenAt: body.attribution?.firstSeenAt,
      fallbackBrand: body.brand,
    });

    const lead: StoredLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || undefined,
      message: message?.trim() || undefined,
      state: state ?? undefined,
      quote: quote ?? undefined,
      brand: attribution.brand,
      sourceHost: host ?? undefined,
      attribution,
    };

    saveLead(lead);

    return NextResponse.json({
      success: true,
      message: "Anfrage wurde gespeichert. Wir melden uns zeitnah.",
    });
  } catch (err) {
    console.error("[API lead]", err);
    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut." },
      { status: 500 }
    );
  }
}
