import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const INTAKES_FILE = path.join(DATA_DIR, "systemanalyse-intakes.json");

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadIntakes(): unknown[] {
  ensureDataDir();
  if (!fs.existsSync(INTAKES_FILE)) return [];
  try {
    const raw = fs.readFileSync(INTAKES_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      brandId?: string;
      payload?: Record<string, unknown>;
    };

    if (!body.payload || typeof body.payload !== "object") {
      return NextResponse.json({ error: "Ungültige Nutzdaten." }, { status: 400 });
    }

    const record = {
      id: `sa_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
      createdAt: new Date().toISOString(),
      brandId: typeof body.brandId === "string" ? body.brandId : "unknown",
      payload: body.payload,
    };

    const intakes = loadIntakes();
    intakes.push(record);
    ensureDataDir();
    fs.writeFileSync(INTAKES_FILE, JSON.stringify(intakes, null, 2), "utf-8");

    return NextResponse.json({ ok: true, id: record.id });
  } catch {
    return NextResponse.json(
      { error: "Serverfehler bei der Übermittlung." },
      { status: 500 }
    );
  }
}
