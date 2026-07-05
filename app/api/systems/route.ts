import { NextResponse } from "next/server";
import { getPublishedSystems } from "@/lib/systems-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const systems = await getPublishedSystems();
    return NextResponse.json({ systems });
  } catch (err) {
    console.error("[API] GET /api/systems:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}
