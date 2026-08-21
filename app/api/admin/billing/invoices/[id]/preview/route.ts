/**
 * PDF-Vorschau für einen Draft oder finalisierten Beleg.
 *
 * Bei Drafts wird die A4 aus den Live-Daten erzeugt und mit einem sichtbaren
 * „Entwurf"-Hinweis versehen (im Renderer selbst über den Zustand der
 * Rechnung entschieden). Es wird NICHT archiviert und verbraucht keine
 * Nummer.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getInvoice } from "@/lib/billing/invoicesStore";
import { renderPreviewPdf, renderErrorPdf } from "@/lib/billing/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  try {
    const invoice = await getInvoice(id);
    if (!invoice) {
      const errPdf = await renderErrorPdf(
        "Rechnung nicht gefunden",
        "Die angeforderte Rechnung existiert nicht mehr oder wurde entfernt."
      );
      return pdfResponse(errPdf, `not-found-${id}.pdf`, 200);
    }
    const buf = await renderPreviewPdf(invoice);
    return pdfResponse(buf, `preview-${id}.pdf`, 200);
  } catch (error) {
    const msg = (error as Error)?.message || "Unbekannter Fehler beim Rendern der Vorschau.";
    // Kein JSON — der iframe würde nur „Quelltextformatierung" zeigen. Wir
    // liefern stattdessen ein PDF mit der klaren Fehlermeldung, damit der
    // Admin sofort sieht, was schiefläuft.
    const errPdf = await renderErrorPdf("Vorschau konnte nicht erzeugt werden", msg);
    return pdfResponse(errPdf, `preview-error-${id}.pdf`, 200);
  }
}

function pdfResponse(buf: Buffer, filename: string, status: number): NextResponse {
  return new NextResponse(new Uint8Array(buf), {
    status,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
