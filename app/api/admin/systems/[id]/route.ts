import { NextRequest, NextResponse } from "next/server";
import { getSystemById, updateSystem, deleteSystem } from "@/lib/systems-store";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { writeAudit, actorFrom, diffStates } from "@/lib/audit/auditLog";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  const sys = await getSystemById(params.id);
  if (!sys) return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
  return NextResponse.json({ system: sys });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  try {
    const body = await req.json();
    // Vorher-Zustand lesen, damit das Audit-Log nur die geänderten Felder führt.
    const before = await getSystemById(params.id);

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

    const after = await getSystemById(params.id);
    const changes = diffStates(
      before as unknown as Record<string, unknown>,
      after as unknown as Record<string, unknown>
    );
    if (changes) {
      const meta = await requestMeta();
      await writeAudit({
        actor: actorFrom(gate.auth),
        action: "system_card.updated",
        entityType: "system_card",
        entityId: params.id,
        before: changes.before,
        after: changes.after,
        ...meta,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] PUT /api/admin/systems/[id]:", err);
    return NextResponse.json({ error: "Fehler beim Speichern" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  try {
    const before = await getSystemById(params.id);
    await deleteSystem(params.id);

    const meta = await requestMeta();
    await writeAudit({
      actor: actorFrom(gate.auth),
      action: "system_card.deleted",
      entityType: "system_card",
      entityId: params.id,
      // Vollständiger Zustand: die Zeile ist danach weg, das Log ist die
      // einzige verbleibende Spur.
      before: before as unknown as Record<string, unknown>,
      ...meta,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[API] DELETE /api/admin/systems/[id]:", err);
    return NextResponse.json({ error: "Fehler beim Löschen" }, { status: 500 });
  }
}
