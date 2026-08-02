/**
 * Auslieferung und Löschen von Ticket-Anhängen.
 *
 * Anders als bei den Titelbildern der Website ist GET hier NICHT öffentlich:
 * Anhänge können Protokolle, Bildschirmfotos oder Kundendaten enthalten.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { deleteAttachment, getAttachmentData } from "@/lib/tickets/ticketsStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ attachmentId: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;

  const { attachmentId } = await params;
  const file = await getAttachmentData(attachmentId);
  if (!file) return NextResponse.json({ error: "not_found" }, { status: 404 });

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": file.contentType,
      // Anzeigen statt erzwungenem Download, aber nie als HTML im
      // Seitenkontext ausführen lassen.
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.filename)}"`,
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; sandbox",
      "Cache-Control": "private, max-age=300",
    },
  });
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const gate = await authorize("ticket.attachment.delete");
  if (!gate.ok) return gate.response;

  const { attachmentId } = await params;
  const ok = await deleteAttachment(attachmentId, actorFrom(gate.auth), await requestMeta());
  if (!ok) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
