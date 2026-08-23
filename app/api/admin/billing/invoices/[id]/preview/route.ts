/**
 * PDF-Vorschau für einen Draft oder finalisierten Beleg.
 *
 * GET:  Rendert die Preview aus dem aktuellen DB-Stand.
 *
 * POST: Rendert die Preview aus dem DB-Stand + optionalen In-Flight-
 *       Overrides (Empfänger-Adresse, Rechnungsdaten, Positionen,
 *       Texte, Referenzen). Der Editor nutzt diesen Modus, um dem User
 *       eine echte "Live-Vorschau" zu bieten, die BEIM TIPPEN reagiert
 *       — ohne auf den 500-ms-Autosave-Roundtrip warten zu müssen.
 *
 * Es wird NICHT archiviert und verbraucht keine Nummer.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getInvoice } from "@/lib/billing/invoicesStore";
import { renderPreviewPdf, renderErrorPdf } from "@/lib/billing/documents";
import type {
  CustomerRef,
  InvoiceDomain,
  InvoiceItem,
  InvoiceReferences,
  InvoiceTexts,
  PostalAddress,
} from "@/lib/billing/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  return renderFor(id, null);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  let overrides: PreviewOverrides | null = null;
  try {
    overrides = (await request.json()) as PreviewOverrides;
  } catch {
    // ohne Body wie GET behandeln
  }
  return renderFor(id, overrides);
}

/* ────────────────────────────────────────────────────────────────────── */

interface PreviewOverrides {
  customer?: Partial<CustomerRef> & { address?: Partial<PostalAddress> };
  invoiceDate?: string;
  dueDate?: string;
  servicePeriod?: { start: string; end: string };
  currency?: string;
  paymentTermsDays?: number;
  texts?: Partial<InvoiceTexts>;
  references?: Partial<InvoiceReferences>;
  items?: PreviewItemInput[];
}

interface PreviewItemInput {
  title: string;
  description?: string;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  discountPercentMilli: number;
  taxCategory: string;
  taxRatePercentMilli: number;
}

async function renderFor(id: string, overrides: PreviewOverrides | null): Promise<NextResponse> {
  try {
    const invoice = await getInvoice(id);
    if (!invoice) {
      const errPdf = await renderErrorPdf(
        "Rechnung nicht gefunden",
        "Die angeforderte Rechnung existiert nicht mehr oder wurde entfernt."
      );
      return pdfResponse(errPdf, `not-found-${id}.pdf`, 200);
    }
    const merged = overrides ? applyOverrides(invoice, overrides) : invoice;
    const buf = await renderPreviewPdf(merged);
    return pdfResponse(buf, `preview-${id}.pdf`, 200);
  } catch (error) {
    const msg = (error as Error)?.message || "Unbekannter Fehler beim Rendern der Vorschau.";
    const errPdf = await renderErrorPdf("Vorschau konnte nicht erzeugt werden", msg);
    return pdfResponse(errPdf, `preview-error-${id}.pdf`, 200);
  }
}

/**
 * Overlay der lokalen Editor-Dirty-Werte auf die Server-Rechnung, damit
 * die Preview ohne Autosave-Roundtrip die Live-Eingabe des Users zeigt.
 * Alle Overrides sind rein visuell — sie werden nicht persistiert.
 */
function applyOverrides(invoice: InvoiceDomain, o: PreviewOverrides): InvoiceDomain {
  const cust = o.customer
    ? {
        ...invoice.customer,
        ...o.customer,
        address: {
          ...invoice.customer.address,
          ...(o.customer.address ?? {}),
        },
      }
    : invoice.customer;

  const texts: InvoiceTexts = o.texts
    ? {
        salutation: o.texts.salutation ?? invoice.texts.salutation,
        intro: o.texts.intro ?? invoice.texts.intro,
        outro: o.texts.outro ?? invoice.texts.outro,
        customerNote: o.texts.customerNote ?? invoice.texts.customerNote,
        internalNote: o.texts.internalNote ?? invoice.texts.internalNote,
        smallBusinessNote: o.texts.smallBusinessNote ?? invoice.texts.smallBusinessNote,
      }
    : invoice.texts;

  const references: InvoiceReferences = o.references
    ? {
        buyerReference:
          o.references.buyerReference !== undefined
            ? o.references.buyerReference
            : invoice.references.buyerReference,
        leitwegId:
          o.references.leitwegId !== undefined
            ? o.references.leitwegId
            : invoice.references.leitwegId,
        purchaseOrder:
          o.references.purchaseOrder !== undefined
            ? o.references.purchaseOrder
            : invoice.references.purchaseOrder,
        originalInvoiceId: invoice.references.originalInvoiceId,
        originalInvoiceNumber: invoice.references.originalInvoiceNumber,
        correctionReason: invoice.references.correctionReason,
      }
    : invoice.references;

  const items: InvoiceItem[] = o.items ? o.items.map((it, idx) => buildPreviewItem(it, idx)) : invoice.items;

  // Preview-Totals grob nachrechnen. Für die Anzeige reicht die einfache
  // Summierung; die endgültige Rechnung durchläuft die serverseitige
  // Steuermaschine (computeTotals) beim Autosave. Der User sieht so
  // sofort in etwa den korrekten Betrag, statt "0 €" bis der Server
  // geantwortet hat.
  const netCents = items.reduce((sum, it) => sum + it.lineNetCents, 0);
  const taxCents = items.reduce((sum, it) => sum + it.lineTaxCents, 0);
  const grossCents = netCents + taxCents;

  return {
    ...invoice,
    customer: cust,
    invoiceDate: o.invoiceDate ?? invoice.invoiceDate,
    dueDate: o.dueDate ?? invoice.dueDate,
    servicePeriod: o.servicePeriod
      ? {
          start: o.servicePeriod.start,
          end: o.servicePeriod.end,
          label: invoice.servicePeriod.label,
        }
      : invoice.servicePeriod,
    currency: o.currency ?? invoice.currency,
    payment: {
      ...invoice.payment,
      paymentTermsDays: o.paymentTermsDays ?? invoice.payment.paymentTermsDays,
    },
    texts,
    references,
    items,
    totals: {
      netCents,
      taxCents,
      grossCents,
      currency: o.currency ?? invoice.currency,
      taxBreakdown: invoice.totals.taxBreakdown,
    },
  };
}

function buildPreviewItem(input: PreviewItemInput, idx: number): InvoiceItem {
  const gross = Math.round((input.quantityMilli * input.unitPriceCents) / 1000);
  const discount = Math.round((gross * input.discountPercentMilli) / 100_000);
  const net = gross - discount;
  const tax = Math.round((net * input.taxRatePercentMilli) / 100_000);
  return {
    id: `preview_${idx + 1}`,
    position: idx + 1,
    title: input.title,
    description: input.description ?? "",
    quantityMilli: input.quantityMilli,
    unit: input.unit,
    unitPriceCents: input.unitPriceCents,
    discountPercentMilli: input.discountPercentMilli,
    taxCategory: input.taxCategory as InvoiceItem["taxCategory"],
    taxRatePercentMilli: input.taxRatePercentMilli,
    lineNetCents: net,
    lineTaxCents: tax,
    lineGrossCents: net + tax,
  };
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
