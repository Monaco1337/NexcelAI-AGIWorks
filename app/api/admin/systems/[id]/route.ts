import { NextRequest, NextResponse } from "next/server";
import { getSystemById, updateSystem, deleteSystem } from "@/lib/systems-store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const sys = await getSystemById(params.id);
  if (!sys) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ system: sys });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await updateSystem(params.id, {
      slug: body.slug,
      category: body.category,
      title: body.title,
      tagline: body.tagline,
      desc: body.desc,
      longDesc: body.longDesc,
      bullets: body.bullets,
      details: body.details,
      image: body.image,
      alt: body.alt,
      sortOrder: body.sortOrder,
      isPublished: body.isPublished,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] PUT /api/admin/systems/[id]:", err);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteSystem(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] DELETE /api/admin/systems/[id]:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
