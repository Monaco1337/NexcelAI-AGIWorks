/**
 * Rendert eine ANDERE Rechnung (nicht die Referenz Nr. 16), um zu
 * validieren dass der fixed-layout Renderer auch mit dynamischen
 * Business-Daten sauber arbeitet.
 */

import { writeFileSync } from "node:fs";
import { renderInvoicePdf } from "../../lib/billing/pdf";
import type { InvoiceDomain } from "../../lib/billing/model";

const invoice: InvoiceDomain = {
  id: "inv_dyn_42",
  status: "finalized",
  type: "invoice",
  invoiceNumber: "42",
  numericNumber: 42,
  issuer: {
    key: "agiworks",
    brandLabel: "AGI Works",
    legalName: "AGI Works",
    owner: "Kevin Blazevic",
    headerTagline: "Dienstleister im Bereich Marketing und Werbung",
    address: { line1: "Hansastra\u00dfe 34", postalCode: "59425", city: "Unna", country: "DE", countryLabel: "Deutschland" },
    contact: { email: "info@agiworks.de", phone: "+2303 3349877", mobile: "+49 176 23250935", website: "https://www.agiworks.de" },
    taxNumber: "316/5024/3564",
    vatId: null,
    taxRegime: "kleinunternehmer",
    smallBusinessNote: "Als Kleinunternehmer im Sinne von \u00a7 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
    bank: { bankName: "Sparkasse UnnaKamen", iban: "DE26 4435 0060 1000 7538 79", bic: "WELADE1UNN" },
    defaultCurrency: "EUR",
    defaultPaymentTerms: 14,
    defaultIntro: "hiermit \u00fcbermitteln wir Ihnen die Rechnung f\u00fcr die vereinbarten Leistungen.",
    defaultOutro: "Wir bedanken uns f\u00fcr Ihr Vertrauen und die angenehme Zusammenarbeit.",
    defaultFooter: "Mit freundlichen Gr\u00fc\u00dfen",
    accentColor: "#00A3DA",
    logoPath: null,
    templateKey: "reference16",
    numberFormat: "numeric",
    numberPrefix: "",
    numberPadding: 0,
  },
  customer: {
    id: "cust_muster",
    name: "Mustermann GmbH",
    contactPerson: "Herr Max Mustermann",
    address: { line1: "Musterstra\u00dfe 12", postalCode: "44135", city: "Dortmund", country: "DE" },
  },
  project: null,
  invoiceDate: "2026-08-21",
  dueDate: "2026-09-04",
  servicePeriod: { start: "2026-08-01", end: "2026-08-31", label: "August 2026" },
  currency: "EUR",
  items: [
    { id: "i1", position: 1, title: "Website-Betreuung", description: "Monatliche Wartung, Backups und Updates.", quantityMilli: 1000, unit: "Monat", unitPriceCents: 15000, discountPercentMilli: 0, taxCategory: "E", taxRatePercentMilli: 0, lineNetCents: 15000, lineTaxCents: 0, lineGrossCents: 15000 },
  ],
  texts: {
    salutation: "Sehr geehrter Herr Mustermann,",
    intro: "hiermit \u00fcbermitteln wir Ihnen die Rechnung f\u00fcr die vereinbarten Leistungen im August 2026.",
    outro: "Wir bedanken uns f\u00fcr Ihr Vertrauen und die angenehme Zusammenarbeit.",
    smallBusinessNote: "Als Kleinunternehmer im Sinne von \u00a7 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet.",
  },
  payment: { bank: { bankName: "Sparkasse UnnaKamen", iban: "DE26 4435 0060 1000 7538 79", bic: "WELADE1UNN" }, paymentTermsDays: 14 },
  references: {},
  totals: { netCents: 15000, taxCents: 0, grossCents: 15000, currency: "EUR", taxBreakdown: [{ category: "E", ratePercentMilli: 0, baseCents: 15000, taxCents: 0, exemptionReason: "Kleinunternehmer" }] },
  templateKey: "reference16",
  isSnapshot: true,
};

async function main() {
  const bytes = await renderInvoicePdf(invoice);
  writeFileSync("/tmp/rechnung42_dynamic.pdf", bytes);
  console.log("OK", bytes.length);
}

main().catch((e) => { console.error("FAIL", e); process.exit(1); });
