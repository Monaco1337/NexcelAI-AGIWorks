/** Kommentare und interne Notizen zu einem Ticket. */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { addComment, listComments, TicketValidationError } from "@/lib/tickets/ticketsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  const comments = await listComments(id, {
    includeInternal: gate.auth.can("ticket.comment.internal"),
  });
  return NextResponse.json({ comments });
}

export async function POST(request: NextRequest, { params }: Params) {
  const gate = await authorize("ticket.comment");
  if (!gate.ok) return gate.response;

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // Wer keine internen Notizen schreiben darf, dessen Beiträge sind immer
  // sichtbar — der Wunsch aus dem Aufruf wird hier bewusst überstimmt.
  const isInternal = gate.auth.can("ticket.comment.internal")
    ? body.isInternal !== false
    : false;

  try {
    const comment = await addComment(
      id,
      typeof body.body === "string" ? body.body : "",
      isInternal,
      actorFrom(gate.auth),
      await requestMeta()
    );
    if (!comment) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    if (error instanceof TicketValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[TICKETS] Kommentar fehlgeschlagen:", error);
    return NextResponse.json({ error: "comment_failed" }, { status: 500 });
  }
}
