import { NextRequest, NextResponse } from "next/server";
import {
  getReferenceById,
  updateReference,
  deleteReference,
} from "@/lib/references-store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const ref = await getReferenceById(params.id);
  if (!ref) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ reference: ref });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    await updateReference(params.id, {
      title: body.title,
      clientName: body.clientName,
      shortDescription: body.shortDescription,
      fullDescription: body.fullDescription,
      type: body.type,
      tags: body.tags,
      modules: body.modules,
      websiteUrl: body.websiteUrl,
      status: body.status,
      coverImage: body.coverImage,
      sortOrder: body.sortOrder,
      isPublished: body.isPublished,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] PUT /api/admin/references/[id]:", err);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await deleteReference(params.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] DELETE /api/admin/references/[id]:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
