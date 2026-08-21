/**
 * Öffentliche Metadaten einer geteilten Rechnung.
 *
 * Kein Login; ausschließlich Token-Autorisierung. Wir geben so wenige Daten
 * zurück wie möglich (keine internen Notizen, keine Aussteller-Bankdaten,
 * keine Preisstruktur pro Position außer dem Bruttoendpreis) — nur was der
 * Kunde für Sichtprüfung und Bezahlung braucht.
 */

import { NextResponse, type NextRequest } from "next/server";
import { consumeShareToken } from "@/lib/billing/shareStore";
import { getInvoice, listInvoiceDocuments } from "@/lib/billing/invoicesStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const { token } = await ctx.params;
  const share = await consumeShareToken(token);
  if (!share) return NextResponse.json({ error: "not_found_or_expired" }, { status: 404 });

  const invoice = await getInvoice(share.invoiceId);
  if (!invoice) return NextResponse.json({ error: "not_found_or_expired" }, { status: 404 });

  const documents = await listInvoiceDocuments(invoice.id);
  return NextResponse.json({
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      status: invoice.status,
      type: invoice.type,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      servicePeriod: invoice.servicePeriod,
      totals: {
        grossCents: invoice.totals.grossCents,
        currency: invoice.totals.currency,
      },
      issuer: {
        brandLabel: invoice.issuer.brandLabel,
        legalName: invoice.issuer.legalName,
        contact: {
          email: invoice.issuer.contact?.email ?? null,
          website: invoice.issuer.contact?.website ?? null,
        },
        accentColor: invoice.issuer.accentColor,
      },
      customer: {
        name: invoice.customer.name,
      },
      payment: {
        bank: {
          bankName: invoice.payment.bank.bankName,
          iban: invoice.payment.bank.iban,
          bic: invoice.payment.bank.bic,
        },
      },
    },
    documents: documents.map((d) => ({
      id: d.id,
      kind: d.kind,
      filename: d.filename,
      byteSize: d.byteSize,
    })),
    allowDownloads: share.allowDownloads,
  });
}
