/**
 * Massenvorgänge über mehrere Tickets.
 *
 * Antwortet auch bei Teilerfolg mit 200 und einer genauen Aufstellung: bei
 * 40 markierten Tickets darf ein einzelner unzulässiger Statuswechsel nicht
 * die übrigen 39 verwerfen.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { bulkUpdate } from "@/lib/tickets/ticketsStore";
import { isTicketPriority, isTicketStatus } from "@/lib/tickets/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const gate = await authorize("ticket.bulk");
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
  if (ids.length === 0) {
    return NextResponse.json({ error: "ids_required" }, { status: 400 });
  }

  const kind = body.operation;
  let operation: Parameters<typeof bulkUpdate>[1];

  // Jeder Vorgang wird gegen das Recht geprüft, das auch die Einzelaktion
  // verlangt — sonst wäre der Massenweg ein Umweg um die Berechtigungen.
  switch (kind) {
    case "status":
      if (!isTicketStatus(body.status)) {
        return NextResponse.json({ error: "invalid_status" }, { status: 400 });
      }
      if (!gate.auth.can("ticket.transition")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      operation = { kind: "status", status: body.status };
      break;

    case "assign":
      if (!gate.auth.can("ticket.assign")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      operation = {
        kind: "assign",
        assigneeId:
          typeof body.assigneeId === "string" && body.assigneeId ? body.assigneeId : null,
      };
      break;

    case "priority":
      if (!isTicketPriority(body.priority)) {
        return NextResponse.json({ error: "invalid_priority" }, { status: 400 });
      }
      if (!gate.auth.can("ticket.update")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      operation = { kind: "priority", priority: body.priority };
      break;

    case "archive":
      if (!gate.auth.can("ticket.archive")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      operation = { kind: "archive" };
      break;

    case "delete":
      if (!gate.auth.can("ticket.delete")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      operation = { kind: "delete" };
      break;

    default:
      return NextResponse.json({ error: "invalid_operation" }, { status: 400 });
  }

  try {
    const result = await bulkUpdate(ids, operation, actorFrom(gate.auth), await requestMeta());
    return NextResponse.json(result);
  } catch (error) {
    console.error("[TICKETS] Massenvorgang fehlgeschlagen:", error);
    return NextResponse.json({ error: "bulk_failed" }, { status: 500 });
  }
}
