import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/pg";
import { updateReferenceCoverImage } from "@/lib/references-store";

export const dynamic = "force-dynamic";

/** Serve the cover image stored in DB */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const client = await db();
  if (!client) return NextResponse.json({ error: "Keine DB" }, { status: 503 });
  const rows = await client<{ cover_image_data: Buffer | null; cover_content_type: string }[]>`
    SELECT cover_image_data, cover_content_type FROM references_projects WHERE id = ${params.id} LIMIT 1
  `;
  if (!rows.length || !rows[0].cover_image_data) {
    return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  }
  return new NextResponse(rows[0].cover_image_data as unknown as BodyInit, {
    headers: {
      "Content-Type": rows[0].cover_content_type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** Upload a new cover image */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "Keine Datei" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/png";
    await updateReferenceCoverImage(params.id, buffer, contentType);
    return NextResponse.json({ url: `/api/admin/references/${params.id}/cover` });
  } catch (err) {
    console.error("[API] POST cover:", err);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
