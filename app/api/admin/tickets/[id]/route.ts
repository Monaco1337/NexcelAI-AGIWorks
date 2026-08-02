/**
 * Einzelnes Ticket.
 *
 * GET    — Ticket samt Kommentaren, Anhängen, Beziehungen und Verlauf
 * PATCH  — Felder ändern (mit optimistischer Sperre)
 * DELETE — weiches Löschen, wiederherstellbar
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom, getEntityHistory } from "@/lib/audit/auditLog";
import {
  getTicket,
  listAttachments,
  listComments,
  listRelations,
  softDeleteTicket,
  updateTicket,
  TicketConflictError,
  TicketValidationError,
} from "@/lib/tickets/ticketsStore";
import {
  isTicketPriority,
  isTicketSeverity,
  isTicketType,
  isTicketVisibility,
} from "@/lib/tickets/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  const ticket = await getTicket(id);
  if (!ticket) return NextResponse.json({ error: "not_found" }, { status: 404 });

  // Die vier Zusatzabfragen laufen parallel — nacheinander wären es vier
  // volle Roundtrips zur Datenbank für eine einzige Detailansicht.
  const [comments, attachments, relations, history] = await Promise.all([
    listComments(id, { includeInternal: gate.auth.can("ticket.comment.internal") }),
    listAttachments(id),
    listRelations(id),
    gate.auth.can("audit.read")
      ? getEntityHistory("ticket", id, 100)
      : Promise.resolve([]),
  ]);

  return NextResponse.json({ ticket, comments, attachments, relations, history });
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const gate = await authorize("ticket.update");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Zuweisung braucht ein eigenes Recht, deshalb wird sie getrennt geprüft
  // und nicht einfach mit den übrigen Feldern durchgereicht.
  if ("assigneeId" in body && !gate.auth.can("ticket.assign")) {
    return NextResponse.json({ error: "forbidden_assign" }, { status: 403 });
  }

  try {
    const ticket = await updateTicket(
      id,
      {
        title: typeof body.title === "string" ? body.title : undefined,
        description: typeof body.description === "string" ? body.description : undefined,
        type: isTicketType(body.type) ? body.type : undefined,
        priority: isTicketPriority(body.priority) ? body.priority : undefined,
        severity:
          "severity" in body
            ? isTicketSeverity(body.severity)
              ? body.severity
              : null
            : undefined,
        assigneeId:
          "assigneeId" in body
            ? typeof body.assigneeId === "string" && body.assigneeId
              ? body.assigneeId
              : null
            : undefined,
        orgId:
          "orgId" in body
            ? typeof body.orgId === "string" && body.orgId
              ? body.orgId
              : null
            : undefined,
        labels: Array.isArray(body.labels)
          ? body.labels.filter((l): l is string => typeof l === "string").slice(0, 20)
          : undefined,
        visibility: isTicketVisibility(body.visibility) ? body.visibility : undefined,
        dueAt:
          "dueAt" in body
            ? typeof body.dueAt === "string" && body.dueAt
              ? body.dueAt
              : null
            : undefined,
        expectedVersion:
          typeof body.version === "number" ? body.version : undefined,
      },
      actorFrom(gate.auth),
      await requestMeta()
    );

    if (!ticket) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof TicketConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[TICKETS] Änderung fehlgeschlagen:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const gate = await authorize("ticket.delete");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  try {
    const ticket = await softDeleteTicket(id, actorFrom(gate.auth), await requestMeta());
    if (!ticket) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[TICKETS] Löschen fehlgeschlagen:", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
