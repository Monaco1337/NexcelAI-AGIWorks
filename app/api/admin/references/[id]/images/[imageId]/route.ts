import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/pg";
import { deleteReferenceImage } from "@/lib/references-store";

export const dynamic = "force-dynamic";

/** Serve an additional reference image */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string; imageId: string } },
) {
  const client = await db();
  if (!client) return NextResponse.json({ error: "Keine DB" }, { status: 503 });
  const rows = await client<{ image_data: Buffer; content_type: string }[]>`
    SELECT image_data, content_type FROM reference_images
    WHERE id = ${params.imageId} AND reference_id = ${params.id}
    LIMIT 1
  `;
  if (!rows.length) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return new NextResponse(rows[0].image_data as unknown as BodyInit, {
    headers: {
      "Content-Type": rows[0].content_type,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}

/** Delete an additional reference image */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; imageId: string } },
) {
  try {
    await deleteReferenceImage(params.imageId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] DELETE image:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
