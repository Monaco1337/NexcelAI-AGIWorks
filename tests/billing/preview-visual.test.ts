/**
 * Rendert die Referenz-Rechnung Nr. 16 mit dem fixed-layout Renderer
 * und schreibt sie nach /tmp/rechnung16_render.pdf für den Visual-Diff.
 */

import { writeFileSync } from "node:fs";
import { renderInvoicePdf } from "../../lib/billing/pdf";
import type { InvoiceDomain } from "../../lib/billing/model";

const invoice: InvoiceDomain = {
  id: "inv_reference_16",
  status: "finalized",
  type: "invoice",
  invoiceNumber: "16",
  numericNumber: 16,
  issuer: {
    key: "agiworks",
    brandLabel: "AGI Works",
    legalName: "AGI Works",
    owner: "Kevin Blazevic",
    headerTagline: "Dienstleister im Bereich Marketing und Werbung",
    address: {
      line1: "Hansastra\u00dfe 34",
      postalCode: "59425",
      city: "Unna",
      country: "DE",
      countryLabel: "Deutschland",
    },
    contact: {
      email: "info@agiworks.de",
      phone: "+2303 3349877",
      mobile: "+49 176 23250935",
      website: "https://www.agiworks.de",
    },
    taxNumber: "316/5024/3564",
    vatId: null,
    taxRegime: "kleinunternehmer",
    smallBusinessNote:
      "Als Kleinunternehmer im Sinne von \u00a7 19 Abs. 1 UStG wird keine Umsatzsteuer berechnen.",
    bank: {
      bankName: "Sparkasse UnnaKamen",
      iban: "DE26 4435 0060 1000 7538 79",
      bic: "WELADE1UNN",
    },
    defaultCurrency: "EUR",
    defaultPaymentTerms: 14,
    defaultIntro:
      "die Rechnung zur der im Rahmen unserer Zusammenarbeit eingesetzten technischen Infrastruktur und Tools.",
    defaultOutro:
      "Wir bedanken uns f\u00fcr die Zusammenarbeit und stehen Ihnen bei weiteren Anliegen gerne zur Verf\u00fcgung.",
    defaultFooter: "Mit freundlichen Gr\u00fc\u00dfen",
    accentColor: "#00A3DA",
    logoPath: null,
    templateKey: "reference16",
    numberFormat: "numeric",
    numberPrefix: "",
    numberPadding: 0,
  },
  customer: {
    id: "cust_weissleder",
    name: "Weissleder Immobilien",
    contactPerson: null,
    address: {
      line1: "Sch\u00fctzenhof 1",
      postalCode: "59423",
      city: "Unna",
      country: "DE",
    },
  },
  project: null,
  invoiceDate: "2026-07-27",
  dueDate: "2026-08-10",
  servicePeriod: { start: "2026-07-01", end: "2026-07-31", label: "Juli 2026" },
  currency: "EUR",
  items: [
    {
      id: "itm_ref_16_1",
      position: 1,
      title:
        "Monatliche Betriebs- und Sicherungspauschale f\u00fcr \u201eWeissleder Immobilien \u201c \u2013 Leistungszeitraum Juli 2026",
      description:
        "Serverbetrieb, technische Bereitstellung, regelm\u00e4\u00dfige Backups, Datensicherung und Systemerhalt f\u00fcr den laufenden Website- und Admin-Panel-Betrieb.",
      quantityMilli: 1000,
      unit: "Monat",
      unitPriceCents: 2900,
      discountPercentMilli: 0,
      taxCategory: "E",
      taxRatePercentMilli: 0,
      lineNetCents: 2900,
      lineTaxCents: 0,
      lineGrossCents: 2900,
    },
  ],
  texts: {
    salutation: "Sehr geehrter Herr ,",
    intro:
      "die Rechnung zur der im Rahmen unserer Zusammenarbeit eingesetzten technischen Infrastruktur und Tools.",
    outro:
      "Wir bedanken uns f\u00fcr die Zusammenarbeit und stehen Ihnen bei weiteren Anliegen gerne zur Verf\u00fcgung.",
    smallBusinessNote:
      "Als Kleinunternehmer im Sinne von \u00a7 19 Abs. 1 UStG wird keine Umsatzsteuer berechnen.",
  },
  payment: {
    bank: {
      bankName: "Sparkasse UnnaKamen",
      iban: "DE26 4435 0060 1000 7538 79",
      bic: "WELADE1UNN",
    },
    paymentTermsDays: 14,
  },
  references: {},
  totals: {
    netCents: 2900,
    taxCents: 0,
    grossCents: 2900,
    currency: "EUR",
    taxBreakdown: [
      {
        category: "E",
        ratePercentMilli: 0,
        baseCents: 2900,
        taxCents: 0,
        exemptionReason: "Steuerbefreit gem\u00e4\u00df \u00a7 19 Abs. 1 UStG.",
      },
    ],
  },
  templateKey: "reference16",
  isSnapshot: true,
};

async function main() {
  const bytes = await renderInvoicePdf(invoice);
  writeFileSync("/tmp/rechnung16_render.pdf", bytes);
  console.log("OK", bytes.length);
}

main().catch((e) => {
  console.error("FAIL", e);
  process.exit(1);
});
