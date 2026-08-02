/**
 * Projektübersicht und Anlage.
 *
 * Projekte sind der Ordnungsrahmen für Tickets, deshalb gilt hier dasselbe
 * Leserecht wie für Tickets. Angelegt und geändert werden dürfen sie nur mit
 * Inhaltsverwaltungsrecht.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  createProject,
  isProjectStatus,
  listProjects,
  reorderProjects,
  ProjectValidationError,
} from "@/lib/projects/projectsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;

  const params = request.nextUrl.searchParams;
  try {
    const projects = await listProjects({
      includeArchived: params.get("archived") === "1",
      search: params.get("q") ?? undefined,
    });
    return NextResponse.json({ projects });
  } catch (error) {
    console.error("[PROJECTS] Liste fehlgeschlagen:", error);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  try {
    const project = await createProject(
      {
        name,
        slug: typeof body.slug === "string" ? body.slug : undefined,
        description: typeof body.description === "string" ? body.description : "",
        productionUrl: typeof body.productionUrl === "string" ? body.productionUrl : null,
        repo: typeof body.repo === "string" ? body.repo : null,
        brand: typeof body.brand === "string" && body.brand ? body.brand : null,
        color: typeof body.color === "string" ? body.color : undefined,
        status: isProjectStatus(body.status) ? body.status : "active",
      },
      actorFrom(gate.auth),
      await requestMeta()
    );
    if (!project) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    return NextResponse.json({ project }, { status: 201 });
  } catch (error) {
    if (error instanceof ProjectValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[PROJECTS] Anlage fehlgeschlagen:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}

/** Reihenfolge der Übersicht. */
export async function PATCH(request: NextRequest) {
  const gate = await authorize("crm.content.manage");
  if (!gate.ok) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.filter((v): v is string => typeof v === "string")
    : [];
  if (ids.length === 0) return NextResponse.json({ error: "ids_required" }, { status: 400 });

  await reorderProjects(ids, actorFrom(gate.auth), await requestMeta());
  return NextResponse.json({ ok: true });
}
