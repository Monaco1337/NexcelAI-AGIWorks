/** Wiederherstellen aus dem Papierkorb und Archivieren/Entarchivieren. */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  archiveTicket,
  restoreTicket,
  unarchiveTicket,
  TicketValidationError,
} from "@/lib/tickets/ticketsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    /* Ohne Rumpf gilt die Voreinstellung: wiederherstellen. */
  }

  const action = typeof body.action === "string" ? body.action : "restore";
  const permission = action === "restore" ? "ticket.restore" : "ticket.archive";

  const gate = await authorize(permission);
  if (!gate.ok) return gate.response;

  const actor = actorFrom(gate.auth);
  const meta = await requestMeta();

  try {
    const ticket =
      action === "restore"
        ? await restoreTicket(id, actor, meta)
        : action === "archive"
          ? await archiveTicket(id, actor, meta)
          : action === "unarchive"
            ? await unarchiveTicket(id, actor, meta)
            : null;

    if (!ticket) return NextResponse.json({ error: "invalid_action" }, { status: 400 });
    return NextResponse.json({ ticket });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    console.error("[TICKETS] Lebenszyklus-Aktion fehlgeschlagen:", error);
    return NextResponse.json({ error: "action_failed" }, { status: 500 });
  }
}
