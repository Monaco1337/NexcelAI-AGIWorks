/**
 * Ticketliste und Anlage.
 *
 * GET  /api/admin/tickets   — gefilterte, cursorbasierte Liste
 * POST /api/admin/tickets   — neues Ticket
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  createTicket,
  listTickets,
  TicketValidationError,
  type TicketFilter,
} from "@/lib/tickets/ticketsStore";
import {
  isTicketPriority,
  isTicketSeverity,
  isTicketType,
  isTicketVisibility,
  severityRequired,
  type TicketPriority,
  type TicketStatus,
  type TicketType,
} from "@/lib/tickets/model";
import { isTicketStatus } from "@/lib/tickets/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Mehrfachwerte kommen als `?status=new&status=triage` oder kommagetrennt. */
function multi(params: URLSearchParams, key: string): string[] | undefined {
  const all = params.getAll(key).flatMap((v) => v.split(",")).map((v) => v.trim()).filter(Boolean);
  return all.length > 0 ? all : undefined;
}

export async function GET(request: NextRequest) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;

  const params = request.nextUrl.searchParams;

  const filter: TicketFilter = {
    status: multi(params, "status")?.filter(isTicketStatus) as TicketStatus[] | undefined,
    type: multi(params, "type")?.filter(isTicketType) as TicketType[] | undefined,
    priority: multi(params, "priority")?.filter(isTicketPriority) as TicketPriority[] | undefined,
    labels: multi(params, "label"),
    search: params.get("q") ?? undefined,
    brand: params.get("brand") ?? undefined,
    orgId: params.get("orgId") ?? undefined,
    includeArchived: params.get("archived") === "1",
    onlyDeleted: params.get("deleted") === "1",
    openOnly: params.get("open") === "1",
  };

  // "unassigned" ist ein eigener Wert, weil ein leerer Parameter sonst nicht
  // von "kein Filter gesetzt" zu unterscheiden wäre.
  const assignee = params.get("assignee");
  if (assignee === "unassigned") filter.assigneeId = null;
  else if (assignee === "me") filter.assigneeId = gate.auth.userId;
  else if (assignee) filter.assigneeId = assignee;

  const project = params.get("project");
  if (project === "none") filter.projectId = null;
  else if (project) filter.projectId = project;

  const limit = Number.parseInt(params.get("limit") ?? "50", 10);

  try {
    const page = await listTickets(filter, {
      limit: Number.isFinite(limit) ? limit : 50,
      cursor: params.get("cursor") ?? undefined,
    });
    return NextResponse.json(page);
  } catch (error) {
    console.error("[TICKETS] Liste fehlgeschlagen:", error);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const gate = await authorize("ticket.create");
  if (!gate.ok) return gate.response;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const type = isTicketType(body.type) ? body.type : "support";
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (!title) {
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  }

  const severity = isTicketSeverity(body.severity) ? body.severity : null;
  if (severityRequired(type) && !severity) {
    return NextResponse.json({ error: "severity_required" }, { status: 400 });
  }

  // Zuweisen ist ein eigenes Recht: wer nur anlegen darf, darf nicht zugleich
  // fremde Arbeit verteilen.
  const assigneeId =
    typeof body.assigneeId === "string" && body.assigneeId
      ? gate.auth.can("ticket.assign")
        ? body.assigneeId
        : null
      : null;

  try {
    const ticket = await createTicket(
      {
        type,
        title,
        description: typeof body.description === "string" ? body.description : "",
        priority: isTicketPriority(body.priority) ? body.priority : "normal",
        severity,
        brand: typeof body.brand === "string" ? body.brand : gate.auth.brand ?? "nexcel",
        orgId: typeof body.orgId === "string" && body.orgId ? body.orgId : null,
        projectId: typeof body.projectId === "string" && body.projectId ? body.projectId : null,
        requesterId:
          typeof body.requesterId === "string" && body.requesterId
            ? body.requesterId
            : gate.auth.userId,
        assigneeId,
        labels: Array.isArray(body.labels)
          ? body.labels.filter((l): l is string => typeof l === "string").slice(0, 20)
          : [],
        visibility: isTicketVisibility(body.visibility) ? body.visibility : "internal",
        dueAt: typeof body.dueAt === "string" && body.dueAt ? body.dueAt : null,
        source: "manual",
      },
      actorFrom(gate.auth),
      await requestMeta()
    );

    if (!ticket) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ ticket }, { status: 201 });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[TICKETS] Anlage fehlgeschlagen:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
