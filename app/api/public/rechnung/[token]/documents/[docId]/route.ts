/**
 * Öffentlicher Dokument-Download (ZUGFeRD / XRechnung / etc.) für den
 * geteilten Link. Wir prüfen, dass das Dokument tatsächlich zur Rechnung
 * hinter dem Token gehört — sonst könnte man mit einem gültigen Token
 * fremde Rechnungen greifen.
 */

import { NextResponse, type NextRequest } from "next/server";
import { consumeShareToken } from "@/lib/billing/shareStore";
import {
  listInvoiceDocuments,
  loadInvoiceDocumentContent,
} from "@/lib/billing/invoicesStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ token: string; docId: string }> }
) {
  const { token, docId } = await ctx.params;
  const share = await consumeShareToken(token);
  if (!share || !share.allowDownloads) {
    return NextResponse.json({ error: "not_found_or_expired" }, { status: 404 });
  }
  const docs = await listInvoiceDocuments(share.invoiceId);
  const meta = docs.find((d) => d.id === docId);
  if (!meta) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const raw = await loadInvoiceDocumentContent(docId);
  if (!raw) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(new Uint8Array(raw.content), {
    headers: {
      "Content-Type": raw.mimeType,
      "Content-Disposition": `attachment; filename="${meta.filename}"`,
      "Cache-Control": "private, max-age=60",
    },
  });
}
