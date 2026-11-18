import { NextRequest, NextResponse } from "next/server";
import { availableSlots } from "@/lib/consultations/store";
import { CONSULTATION_TZ, CONSULTATION_DURATION_MINUTES } from "@/lib/consultations/slots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    const slots = await availableSlots();
    if (!slots) return NextResponse.json({ error: "Terminverwaltung nicht verfügbar" }, { status: 503, headers: { "Cache-Control": "no-store" } });
    return NextResponse.json({ slots, timeZone: CONSULTATION_TZ, durationMinutes: CONSULTATION_DURATION_MINUTES }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("[consultation slots] failed");
    return NextResponse.json({ error: "Termine derzeit nicht verfügbar" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
