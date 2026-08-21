/**
 * Ausliefern eines archivierten Dokumentes einer Rechnung.
 *
 * Die Route ist doppelt gesichert:
 *  - `authorize("billing.read")` prüft die Sitzung.
 *  - Das Dokument wird nur mit passender `invoice_id` geladen; damit ist
 *    ein Zugriff über eine fremde `docId` ausgeschlossen (IDOR-Schutz).
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getInvoiceDocumentContent } from "@/lib/billing/invoicesStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string; docId: string }> }
) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id, docId } = await ctx.params;

  try {
    const doc = await getInvoiceDocumentContent(id, docId);
    if (!doc) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return new NextResponse(new Uint8Array(doc.content), {
      status: 200,
      headers: {
        "Content-Type": doc.mimeType,
        "Content-Disposition": `attachment; filename="${doc.filename}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[BILLING] Dokumentabruf fehlgeschlagen:", error);
    return NextResponse.json({ error: "document_failed" }, { status: 500 });
  }
}
