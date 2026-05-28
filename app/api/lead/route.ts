import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.json");

type LeadBrand = "agiworks" | "nexcel";

interface LeadBody {
  name: string;
  email: string;
  company?: string;
  message?: string;
  state?: Record<string, unknown>;
  quote?: { min: number; max: number; weeksMin: number; weeksMax: number } | null;
  brand?: LeadBrand;
}

function detectBrandFromHost(host: string | null | undefined): LeadBrand {
  if (!host) return "nexcel";
  return host.toLowerCase().includes("agiworks") ? "agiworks" : "nexcel";
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

type StoredLead = LeadBody & {
  id: string;
  createdAt: string;
  brand?: LeadBrand;
  sourceHost?: string;
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
    const body = (await req.json()) as LeadBody;
    const { name, email, company, message, state, quote } = body;

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

    const host = req.headers.get("host") || req.headers.get("x-forwarded-host");
    const brand: LeadBrand = body.brand ?? detectBrandFromHost(host);

    const lead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      createdAt: new Date().toISOString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      company: company?.trim() || undefined,
      message: message?.trim() || undefined,
      state: state ?? undefined,
      quote: quote ?? undefined,
      brand,
      sourceHost: host ?? undefined,
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
