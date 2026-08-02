import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/pg";
import { updateReferenceCoverImage } from "@/lib/references-store";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { writeAudit, actorFrom } from "@/lib/audit/auditLog";
import { validateImageUpload } from "@/lib/uploads/imageUpload";

export const dynamic = "force-dynamic";

/**
 * Liefert das in der Datenbank gespeicherte Coverbild.
 *
 * BEWUSST OHNE AUTHENTIFIZIERUNG: `references_store` hinterlegt diesen Pfad als
 * `coverImage`, und die Referenzen werden öffentlich auf der Website
 * dargestellt. Eine Absicherung würde die Projektbilder für Besucher entfernen.
 */
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

/** Neues Coverbild hochladen. */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    const problem = validateImageUpload(file);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    const buffer = Buffer.from(await file!.arrayBuffer());
    const contentType = file!.type || "image/png";
    await updateReferenceCoverImage(params.id, buffer, contentType);

    const meta = await requestMeta();
    await writeAudit({
      actor: actorFrom(gate.auth),
      action: "reference.cover_replaced",
      entityType: "reference",
      entityId: params.id,
      after: { contentType, bytes: buffer.byteLength },
      ...meta,
    });

    return NextResponse.json({ url: `/api/admin/references/${params.id}/cover` });
  } catch (err) {
    console.error("[API] POST cover:", err);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
