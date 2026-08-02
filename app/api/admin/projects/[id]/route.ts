/** Einzelnes Projekt: lesen, ändern, löschen. */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  deleteProject,
  getProject,
  isProjectStatus,
  updateProject,
  ProjectValidationError,
} from "@/lib/projects/projectsStore";
import { listTickets } from "@/lib/tickets/ticketsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const project = await getProject(id);
  if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Die jüngsten Tickets kommen gleich mit — die Projektansicht zeigt sie
  // unmittelbar, ein zweiter Aufruf wäre reine Wartezeit.
  const page = await listTickets({ projectId: id }, { limit: 25 });
  return NextResponse.json({ project, tickets: page.tickets, total: page.total });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const project = await updateProject(
      id,
      {
        name: typeof body.name === "string" ? body.name : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        productionUrl:
          "productionUrl" in body
            ? typeof body.productionUrl === "string"
              ? body.productionUrl
              : null
            : undefined,
        repo: "repo" in body ? (typeof body.repo === "string" ? body.repo : null) : undefined,
        brand: "brand" in body ? (typeof body.brand === "string" ? body.brand : null) : undefined,
        color: typeof body.color === "string" ? body.color : undefined,
        status: isProjectStatus(body.status) ? body.status : undefined,
      },
      actorFrom(gate.auth),
      await requestMeta()
    );
    if (!project) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (error) {
    if (error instanceof ProjectValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[PROJECTS] Änderung fehlgeschlagen:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const ok = await deleteProject(id, actorFrom(gate.auth), await requestMeta());
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
