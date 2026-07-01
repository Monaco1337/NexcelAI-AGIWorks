import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getAllReferences,
  createReference,
  updateSortOrders,
} from "@/lib/references-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const refs = await getAllReferences();
    return NextResponse.json({ references: refs });
  } catch (err) {
    console.error("[API] GET /api/admin/references:", err);
    return NextResponse.json({ error: "Fehler beim Laden" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const id = `ref_${randomUUID().replace(/-/g, "").slice(0, 12)}`;

    // Generate slug from title
    const slug =
      body.slug ||
      (body.title as string)
        .toLowerCase()
        .replace(/[äöü]/g, (c: string) => ({ ä: "ae", ö: "oe", ü: "ue" }[c] || c))
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    const refs = await getAllReferences();
    const maxOrder = refs.reduce((m, r) => Math.max(m, r.sortOrder), 0);

    await createReference({
      id,
      slug,
      title: body.title || "",
      clientName: body.clientName || "",
      shortDescription: body.shortDescription || "",
      fullDescription: body.fullDescription || "",
      type: body.type || "",
      tags: body.tags ?? [],
      modules: body.modules ?? [],
      websiteUrl: body.websiteUrl || undefined,
      status: body.status || "live",
      coverImage: body.coverImage || "",
      sortOrder: body.sortOrder ?? maxOrder + 1,
      isPublished: body.isPublished ?? true,
    });

    return NextResponse.json({ id, slug });
  } catch (err) {
    console.error("[API] POST /api/admin/references:", err);
    return NextResponse.json({ error: "Fehler beim Erstellen" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    // Reorder: [{ id, sortOrder }]
    if (Array.isArray(body.order)) {
      await updateSortOrders(body.order);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "Ungültige Anfrage" }, { status: 400 });
  } catch (err) {
    console.error("[API] PATCH /api/admin/references:", err);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}
