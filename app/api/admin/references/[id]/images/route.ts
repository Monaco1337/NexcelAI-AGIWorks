import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getReferenceImages,
  addReferenceImage,
} from "@/lib/references-store";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { writeAudit, actorFrom } from "@/lib/audit/auditLog";
import { validateImageUpload } from "@/lib/uploads/imageUpload";

export const dynamic = "force-dynamic";

/**
 * Metadaten der Zusatzbilder einer Referenz.
 *
 * BEWUSST OHNE AUTHENTIFIZIERUNG: Die Galerie einer Referenz wird öffentlich
 * dargestellt und lädt diese Liste, um die Bild-URLs aufzubauen. Ausgegeben
 * werden ausschließlich ID, Alt-Text und Sortierung — keine Binärdaten und
 * keine internen Felder.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const images = await getReferenceImages(params.id);
  return NextResponse.json({ images });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const alt = (formData.get("alt") as string) || "";
    const parsedOrder = parseInt((formData.get("sortOrder") as string) || "0", 10);
    const sortOrder = Number.isFinite(parsedOrder) ? parsedOrder : 0;

    const problem = validateImageUpload(file);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });

    const id = `ri_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const buffer = Buffer.from(await file!.arrayBuffer());
    const contentType = file!.type || "image/png";

    await addReferenceImage(id, params.id, buffer, contentType, alt, sortOrder);

    const meta = await requestMeta();
    await writeAudit({
      actor: actorFrom(gate.auth),
      action: "reference.image_added",
      entityType: "reference",
      entityId: params.id,
      after: { imageId: id, alt, sortOrder, bytes: buffer.byteLength },
      ...meta,
    });

    return NextResponse.json({
      id,
      url: `/api/admin/references/${params.id}/images/${id}`,
      alt,
      sortOrder,
    });
  } catch (err) {
    console.error("[API] POST images:", err);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
