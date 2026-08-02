/**
 * Statuswechsel. Getrennt von PATCH, weil ein Wechsel eigene Regeln hat:
 * er ist nur entlang erlaubter Übergänge möglich, braucht ein eigenes Recht
 * und erzeugt einen eigenen Eintrag im Verlauf.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  transitionTicket,
  TicketConflictError,
  TicketValidationError,
} from "@/lib/tickets/ticketsStore";
import { isTicketStatus } from "@/lib/tickets/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await authorize("ticket.transition");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isTicketStatus(body.status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }

  try {
    const ticket = await transitionTicket(
      id,
      body.status,
      actorFrom(gate.auth),
      {
        reason: typeof body.reason === "string" ? body.reason.trim() : undefined,
        expectedVersion: typeof body.version === "number" ? body.version : undefined,
      },
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
    console.error("[TICKETS] Statuswechsel fehlgeschlagen:", error);
    return NextResponse.json({ error: "transition_failed" }, { status: 500 });
  }
}
