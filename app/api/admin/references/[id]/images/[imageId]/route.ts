import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/pg";
import { deleteReferenceImage } from "@/lib/references-store";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { writeAudit, actorFrom } from "@/lib/audit/auditLog";

export const dynamic = "force-dynamic";

/**
 * Liefert ein Zusatzbild einer Referenz.
 *
 * BEWUSST OHNE AUTHENTIFIZIERUNG: Bildquelle in der öffentlichen
 * Projektgalerie. Die Abfrage bindet `reference_id` mit ein, damit sich fremde
 * Bilder nicht über eine geratene Bild-ID abrufen lassen.
 */
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

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; imageId: string } },
) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  try {
    await deleteReferenceImage(params.imageId);

    const meta = await requestMeta();
    await writeAudit({
      actor: actorFrom(gate.auth),
      action: "reference.image_deleted",
      entityType: "reference",
      entityId: params.id,
      before: { imageId: params.imageId },
      ...meta,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] DELETE image:", err);
    return NextResponse.json({ error: "Fehler" }, { status: 500 });
  }
}
