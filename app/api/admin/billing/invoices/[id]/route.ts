/**
 * Einzelne Rechnung.
 *
 * GET    /api/admin/billing/invoices/[id]
 * PATCH  /api/admin/billing/invoices/[id]  — Draft aktualisieren
 * DELETE /api/admin/billing/invoices/[id]  — nur Drafts
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { db } from "@/lib/pg";
import {
  deleteDraft,
  getCorrectionsFor,
  getInvoice,
  InvoiceError,
  listInvoiceDocuments,
  listInvoiceEvents,
  updateInvoiceDraft,
  type UpdateInvoiceInput,
} from "@/lib/billing/invoicesStore";

/** Ergänzt das Invoice-Payload um die Optimistic-Locking-Version. */
async function versionOf(id: string): Promise<number> {
  const sql = await db();
  if (!sql) return 0;
  const rows = await sql<{ version: number }[]>`SELECT version FROM invoices WHERE id = ${id}`;
  return rows[0]?.version ?? 0;
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  try {
    const [invoice, documents, events, version, corrections] = await Promise.all([
      getInvoice(id),
      listInvoiceDocuments(id),
      listInvoiceEvents(id),
      versionOf(id),
      getCorrectionsFor(id),
    ]);
    if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });

    // Referenz auf das Original (falls diese Rechnung selbst eine Korrektur ist).
    let original: unknown = null;
    if (invoice.references.originalInvoiceId) {
      const origRaw = await getInvoice(invoice.references.originalInvoiceId);
      if (origRaw) {
        original = {
          id: origRaw.id,
          invoiceNumber: origRaw.invoiceNumber,
          status: origRaw.status,
          type: origRaw.type,
          invoiceDate: origRaw.invoiceDate,
          grossCents: origRaw.totals.grossCents,
          currency: origRaw.totals.currency,
        };
      }
    }

    return NextResponse.json({
      invoice: { ...invoice, version },
      documents,
      events,
      relations: {
        original,
        corrections,
      },
    });
  } catch (error) {
    console.error("[BILLING] Detail fehlgeschlagen:", error);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  let body: UpdateInvoiceInput;
  try {
    body = (await request.json()) as UpdateInvoiceInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.version !== "number") {
    return NextResponse.json({ error: "version_required" }, { status: 400 });
  }

  try {
    const invoice = await updateInvoiceDraft(id, body, actorFrom(gate.auth), await requestMeta());
    if (!invoice) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch (error) {
    if (error instanceof InvoiceError) {
      const status = error.code === "not_found" ? 404 : error.code === "concurrent_finalize" ? 409 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error("[BILLING] Update fehlgeschlagen:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  try {
    const removed = await deleteDraft(id, actorFrom(gate.auth), await requestMeta());
    return NextResponse.json({ removed });
  } catch (error) {
    if (error instanceof InvoiceError) {
      const status = error.code === "not_found" ? 404 : 400;
      return NextResponse.json({ error: error.message, code: error.code }, { status });
    }
    console.error("[BILLING] Löschung fehlgeschlagen:", error);
    return NextResponse.json({ error: "delete_failed" }, { status: 500 });
  }
}
