import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getAllSystems, createSystem, updateSystemSortOrders } from "@/lib/systems-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const systems = await getAllSystems();
    return NextResponse.json({ systems });
  } catch (err) {
    console.error("[API] GET /api/admin/systems:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = `sys_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    const slug =
      body.slug ||
      (body.title as string)
        .toLowerCase()
        .replace(/[äöüÄÖÜ]/g, (c: string) =>
          ({ ä: "ae", ö: "oe", ü: "ue", Ä: "Ae", Ö: "Oe", Ü: "Ue" }[c] ?? c),
        )
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const systems = await getAllSystems();
    const maxOrder = systems.reduce((m, s) => Math.max(m, s.sortOrder), 0);

    await createSystem(id, {
      slug,
      category: body.category || "unternehmen",
      title: body.title || "",
      tagline: body.tagline || "",
      desc: body.desc || "",
      longDesc: body.longDesc || "",
      bullets: body.bullets ?? [],
      details: body.details ?? [],
      image: body.image || "",
      alt: body.alt || "",
      sortOrder: body.sortOrder ?? maxOrder + 1,
      isPublished: body.isPublished ?? true,
    });

    return NextResponse.json({ id, slug });
  } catch (err) {
    console.error("[API] POST /api/admin/systems:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (Array.isArray(body.order)) {
      await updateSystemSortOrders(body.order);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  } catch (err) {
    console.error("[API] PATCH /api/admin/systems:", err);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
