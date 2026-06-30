import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { isDbEnabled } from "@/lib/pg";
import { reorderLogos } from "@/lib/logos-store";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const session = await verifySession();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Keine Datenbank verbunden." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const ids = body?.ids;
    if (!Array.isArray(ids) || ids.some((x) => typeof x !== "string")) {
      return NextResponse.json({ error: "ids[] erforderlich." }, { status: 400 });
    }
    const ok = await reorderLogos(ids);
    if (!ok) return NextResponse.json({ error: "Sortierung fehlgeschlagen." }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("❌ [API/admin/logos/reorder] POST:", error);
    return NextResponse.json({ error: "Sortierung fehlgeschlagen." }, { status: 500 });
  }
}
