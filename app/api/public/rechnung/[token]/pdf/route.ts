/**
 * Öffentlicher PDF-Stream einer geteilten Rechnung.
 *
 * - Bei einer finalisierten Rechnung wird das archivierte PDF ausgeliefert
 *   (bit-identisch, mit Hash-Nachweis).
 * - Fehlt das archivierte PDF (Draft-Freigabe oder Migration ohne
 *   Dokumentenlauf), rendern wir eine identische Live-Vorschau — der
 *   Renderer ist die Single Source of Truth, damit bleiben Werte konsistent.
 */

import { NextResponse, type NextRequest } from "next/server";
import { consumeShareToken } from "@/lib/billing/shareStore";
import {
  getInvoice,
  listInvoiceDocuments,
  loadInvoiceDocumentContent,
} from "@/lib/billing/invoicesStore";
import { renderPreviewPdf } from "@/lib/billing/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const share = await consumeShareToken(token);
  if (!share || !share.allowDownloads) {
    return NextResponse.json({ error: "not_found_or_expired" }, { status: 404 });
  }
  const invoice = await getInvoice(share.invoiceId);
  if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const docs = await listInvoiceDocuments(invoice.id);
  const pdfDoc = docs.find((d) => d.kind === "pdf") ?? null;
  const suggested = `Rechnung-${invoice.invoiceNumber ?? invoice.id}.pdf`;
  if (pdfDoc) {
    const raw = await loadInvoiceDocumentContent(pdfDoc.id);
    if (raw) {
      return new NextResponse(new Uint8Array(raw.content), {
        headers: {
          "Content-Type": raw.mimeType,
          "Content-Disposition": `inline; filename="${pdfDoc.filename || suggested}"`,
          "Cache-Control": "private, max-age=60",
        },
      });
    }
  }
  const preview = await renderPreviewPdf(invoice);
  return new NextResponse(new Uint8Array(preview), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${suggested}"`,
      "Cache-Control": "no-store",
    },
  });
}
