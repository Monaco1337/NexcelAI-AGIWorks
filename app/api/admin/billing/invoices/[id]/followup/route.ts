/**
 * Folgerechnung aus einer bestehenden (finalisierten) Rechnung erzeugen.
 *
 * POST /api/admin/billing/invoices/[id]/followup
 *
 * Übernimmt Aussteller, Kunde, Projekt, Positionen, Preise, Texte und
 * Zahlungsbedingungen unverändert und schiebt den Leistungszeitraum um
 * eine Periode weiter (monatlich +1 Monat, quartalsweise +3 Monate,
 * jährlich +1 Jahr, sonst +1 Monat als sicherer Default). Ein frischer
 * DRAFT wird angelegt — keine Nummer wird belegt, bis der Nutzer den
 * neuen Draft explizit finalisiert.
 */

import { NextResponse } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { createInvoiceDraft, getInvoice, getInvoiceRefIds, InvoiceError } from "@/lib/billing/invoicesStore";
import { addDays, buildPeriod } from "@/lib/billing/period";
import type { InvoiceItemInput } from "@/lib/billing/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function shiftPeriod(startIso: string, endIso: string): { start: string; end: string } {
  const start = new Date(startIso + "T00:00:00Z");
  const end = new Date(endIso + "T00:00:00Z");
  const durationMs = end.getTime() - start.getTime();
  // Heuristik: <=32 Tage → monatlich, <=100 → Quartal, sonst Jahr.
  const days = Math.round(durationMs / 86_400_000) + 1;
  const nextStart = new Date(start);
  if (days <= 32) {
    nextStart.setUTCMonth(nextStart.getUTCMonth() + 1);
  } else if (days <= 100) {
    nextStart.setUTCMonth(nextStart.getUTCMonth() + 3);
  } else if (days <= 400) {
    nextStart.setUTCFullYear(nextStart.getUTCFullYear() + 1);
  } else {
    nextStart.setUTCMonth(nextStart.getUTCMonth() + 1);
  }
  const nextEnd = new Date(nextStart);
  nextEnd.setUTCMilliseconds(nextEnd.getUTCMilliseconds() + durationMs);
  return {
    start: nextStart.toISOString().slice(0, 10),
    end: nextEnd.toISOString().slice(0, 10),
  };
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;

  const { id } = await params;
  try {
    const source = await getInvoice(id);
    if (!source) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const refIds = await getInvoiceRefIds(id);
    if (!refIds) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }

    const period = shiftPeriod(source.servicePeriod.start, source.servicePeriod.end);
    const today = new Date().toISOString().slice(0, 10);
    const paymentTerms = source.payment?.paymentTermsDays ?? source.issuer.defaultPaymentTerms ?? 14;

    const items: InvoiceItemInput[] = source.items.map((it) => ({
      title: it.title,
      description: it.description ?? "",
      quantityMilli: it.quantityMilli,
      unit: it.unit,
      unitPriceCents: it.unitPriceCents,
      discountPercentMilli: it.discountPercentMilli ?? 0,
      taxCategory: it.taxCategory,
      taxRatePercentMilli: it.taxRatePercentMilli,
    }));

    // Wenn der Leistungszeitraum monatlich ist, ergänzen wir die neue
    // Periode als Label direkt im Titel — das ist die Konvention aus
    // Rechnung Nr. 16 ("Leistungszeitraum Juli 2026").
    const monthLabel = formatMonthLabel(period.start, period.end);
    if (monthLabel) {
      items.forEach((it) => {
        it.title = it.title.replace(/Leistungszeitraum\s+[A-Za-zÄÖÜäöü]+\s+\d{4}/i, `Leistungszeitraum ${monthLabel}`);
      });
    }

    const draft = await createInvoiceDraft(
      {
        issuerId: refIds.issuerId,
        customerId: refIds.customerId,
        projectId: refIds.projectId,
        invoiceDate: today,
        dueDate: addDays(today, paymentTerms),
        servicePeriod: period,
        currency: source.currency,
        paymentTermsDays: paymentTerms,
        texts: {
          salutation: source.texts.salutation ?? "",
          intro: source.texts.intro ?? "",
          outro: source.texts.outro ?? "",
          customerNote: source.texts.customerNote ?? "",
          internalNote: "",
          smallBusinessNote: source.texts.smallBusinessNote ?? "",
        },
        references: {
          buyerReference: source.references.buyerReference ?? null,
        },
        items,
      },
      actorFrom(gate.auth),
      await requestMeta()
    );

    if (!draft) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }

    // Persist den Leistungszeitraum wirklich (createInvoiceDraft nutzt
    // buildPeriod hinter dem Vorhang bereits).
    void buildPeriod;

    return NextResponse.json({ invoice: draft }, { status: 201 });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("[BILLING] Folgerechnung fehlgeschlagen:", error);
    return NextResponse.json({ error: "followup_failed" }, { status: 500 });
  }
}

function formatMonthLabel(startIso: string, endIso: string): string | null {
  const start = new Date(startIso + "T00:00:00Z");
  const end = new Date(endIso + "T00:00:00Z");
  const days = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days < 27 || days > 32) return null;
  if (start.getUTCMonth() !== end.getUTCMonth()) return null;
  const months = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
  ];
  return `${months[start.getUTCMonth()]} ${start.getUTCFullYear()}`;
}
