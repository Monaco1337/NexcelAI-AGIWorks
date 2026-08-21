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
import { renderPreviewPdf } from "@/lib/billing/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  try {
    const invoice = await getInvoice(id);
    if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const buf = await renderPreviewPdf(invoice);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="preview-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("[BILLING] Preview fehlgeschlagen:", error);
    return NextResponse.json({ error: "preview_failed" }, { status: 500 });
  }
}
