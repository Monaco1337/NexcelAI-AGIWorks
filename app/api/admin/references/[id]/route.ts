import { NextRequest, NextResponse } from "next/server";
import {
  getReferenceById,
  updateReference,
  deleteReference,
} from "@/lib/references-store";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { writeAudit, actorFrom, diffStates } from "@/lib/audit/auditLog";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  const ref = await getReferenceById(params.id);
  if (!ref) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ reference: ref });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    const before = await getReferenceById(params.id);

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

    const after = await getReferenceById(params.id);
    const changes = diffStates(
      before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>
    );
    if (changes) {
      const meta = await requestMeta();
      await writeAudit({
        actor: actorFrom(gate.auth),
        action: "reference.updated",
        entityType: "reference",
        entityId: params.id,
        before: changes.before,
        after: changes.after,
        ...meta,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] PUT /api/admin/references/[id]:", err);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  try {
    const before = await getReferenceById(params.id);
    await deleteReference(params.id);

    const meta = await requestMeta();
    await writeAudit({
      actor: actorFrom(gate.auth),
      action: "reference.deleted",
      entityType: "reference",
      entityId: params.id,
      before: before as unknown as Record<string, unknown>,
      ...meta,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] DELETE /api/admin/references/[id]:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
