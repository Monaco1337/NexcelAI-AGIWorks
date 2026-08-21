/**
 * Automatisierte Prüfungen der zentralen Rechnungspipeline.
 *
 * Wir bauen einen synthetischen Referenzbeleg, der 1:1 dem Layout der
 * historischen Rechnung Nr. 16 entspricht (Kleinunternehmer, monatliche
 * Betriebs- und Sicherungspauschale, 29,00 €), erzeugen PDF, XRechnung und
 * ZUGFeRD-PDF und prüfen die Invarianten, die im echten Betrieb wehtun:
 *
 *  - Positionssumme = 29,00 €
 *  - Gesamtsumme = 29,00 € (Kleinunternehmer, keine USt)
 *  - PDF-Header enthält %PDF- und Rechnungsnummer 17
 *  - XRechnung enthält Rechnungsnummer 17, Buyer-Reference,
 *    Kleinunternehmer-Kategorie E mit Befreiungsgrund
 *  - Validierung ist gültig
 *  - PDF/A-3-Anhang bringt die Nummer 17 als text/xml-Anhang unter dem
 *    Dateinamen `factur-x.xml` unter
 *
 * Ausführung: `npx tsx tests/billing/render.test.ts`
 */

import { PDFDocument } from "pdf-lib";
import { renderInvoicePdf } from "../../lib/billing/pdf";
import { renderXRechnung } from "../../lib/billing/xrechnung";
import { attachXRechnungToPdf } from "../../lib/billing/zugferd";
import { validateInvoice } from "../../lib/billing/validate";
import { buildItems, computeTotals } from "../../lib/billing/calc";
import { toCents } from "../../lib/billing/money";
import type { InvoiceDomain } from "../../lib/billing/model";

async function main(): Promise<void> {
  const items = buildItems([
    {
      title:
        'Monatliche Betriebs- und Sicherungspauschale für „Weissleder Immobilien" – Leistungszeitraum Juli 2026',
      description:
        "Serverbetrieb, technische Bereitstellung, regelmäßige Backups, Datensicherung und Systemerhalt für den laufenden Website- und Admin-Panel-Betrieb.",
      quantityMilli: 1000,
      unit: "Monat",
      unitPriceCents: toCents("29,00"),
      discountPercentMilli: 0,
      taxCategory: "E",
      taxRatePercentMilli: 0,
    },
  ]);

  assert(items[0].lineNetCents === 2900, "Position muss 29,00 € netto ergeben");
  const totals = computeTotals(items, "EUR", {
    exemptions: {
      E: {
        reason:
          "Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmer).",
        code: "VATEX-EU-D",
      },
    },
  });
  assert(totals.grossCents === 2900, "Bruttosumme muss 29,00 € sein");
  assert(totals.taxCents === 0, "Kleinunternehmer -> keine USt");

  const invoice: InvoiceDomain = {
    id: "test",
    status: "finalized",
    type: "invoice",
    invoiceNumber: "17",
    numericNumber: 17,
    issuer: {
      key: "agiworks",
      brandLabel: "AGI Works",
      legalName: "AGI Works",
      owner: "Kevin Blazevic",
      headerTagline: "Dienstleister im Bereich Marketing und Werbung",
      address: {
        line1: "Hansastraße 34",
        postalCode: "59425",
        city: "Unna",
        country: "DE",
        countryLabel: "Deutschland",
      },
      contact: {
        email: "info@agiworks.de",
        phone: "+49 2303 3349877",
        mobile: "+49 176 23250935",
        website: "https://www.agiworks.de",
      },
      taxNumber: "316/5024/3564",
      vatId: null,
      taxRegime: "kleinunternehmer",
      smallBusinessNote:
        "Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmer).",
      bank: {
        bankName: "Sparkasse UnnaKamen",
        iban: "DE26 4435 0060 1000 7538 79",
        bic: "WELADE1UNN",
      },
      defaultCurrency: "EUR",
      defaultPaymentTerms: 14,
      defaultIntro: "die Rechnung zur der im Rahmen unserer Zusammenarbeit eingesetzten technischen Infrastruktur und Tools.",
      defaultOutro: "Wir bedanken uns für die Zusammenarbeit.",
      defaultFooter: "Mit freundlichen Grüßen",
      accentColor: "#1F6DD8",
      logoPath: null,
      templateKey: "agiworks_classic",
      numberFormat: "numeric",
      numberPrefix: "",
      numberPadding: 0,
    },
    customer: {
      id: "cust_weissleder",
      name: "Weissleder Immobilien",
      address: {
        line1: "Schützenhof 1",
        postalCode: "59423",
        city: "Unna",
        country: "DE",
      },
    },
    project: null,
    invoiceDate: "2026-08-01",
    dueDate: "2026-08-15",
    servicePeriod: { start: "2026-07-01", end: "2026-07-31", label: "Juli 2026" },
    currency: "EUR",
    items,
    texts: {
      intro:
        "die Rechnung zur der im Rahmen unserer Zusammenarbeit eingesetzten technischen Infrastruktur und Tools.",
      outro:
        "Wir bedanken uns für die Zusammenarbeit und stehen Ihnen bei weiteren Anliegen gerne zur Verfügung.",
      smallBusinessNote:
        "Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmer).",
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
    totals,
    templateKey: "agiworks_classic",
    isSnapshot: true,
  };

  const pdfBytes = await renderInvoicePdf(invoice);
  const pdfHead = Buffer.from(pdfBytes).slice(0, 8).toString("utf8");
  assert(pdfHead.startsWith("%PDF-"), "PDF-Header fehlt");
  // Content-Streams komprimiert pdf-lib per Default. Wir prüfen deshalb die
  // ausgelesenen PDF-Metadaten statt der rohen Byte-Stream-Payload.
  const loaded = await PDFDocument.load(pdfBytes);
  const title = loaded.getTitle() ?? "";
  const subject = loaded.getSubject() ?? "";
  assert(title.includes("17"), "PDF-Titel muss Nummer 17 enthalten: " + title);
  assert(
    subject.includes("Weissleder Immobilien"),
    "PDF-Subject muss Kunde enthalten: " + subject
  );
  assert(loaded.getPageCount() >= 1, "PDF muss mindestens eine Seite haben");

  const xml = renderXRechnung(invoice);
  assert(xml.includes("<cbc:ID>17</cbc:ID>"), "XRechnung muss ID 17 tragen");
  assert(xml.includes("<cbc:BuyerReference>17</cbc:BuyerReference>"), "BuyerReference erforderlich");
  assert(xml.includes("<cbc:ID>E</cbc:ID>"), "Steuerkategorie E erforderlich");
  assert(xml.includes("VATEX-EU-D"), "Kleinunternehmer-Befreiungscode fehlt");

  const validation = validateInvoice(invoice, xml);
  assert(
    validation.status !== "invalid",
    "Validierung schlägt fehl: " + JSON.stringify(validation.errors, null, 2)
  );

  const zug = await attachXRechnungToPdf(invoice, pdfBytes);
  const zugText = Buffer.from(zug.pdf).toString("latin1");
  assert(zugText.includes("factur-x.xml"), "ZUGFeRD-PDF muss factur-x.xml einbetten");
  const zugLoaded = await PDFDocument.load(zug.pdf);
  const zugTitle = zugLoaded.getTitle() ?? "";
  assert(zugTitle.includes("17"), "ZUGFeRD-Titel muss Nummer 17 enthalten");
  assert(zug.xml === xml, "ZUGFeRD und XRechnung müssen dieselbe XML tragen");

  console.log("✅ Alle Prüfungen bestanden");
  console.log("   PDF-Größe:", pdfBytes.length, "Bytes");
  console.log("   XML-Zeichen:", xml.length);
  console.log("   ZUGFeRD-Größe:", zug.pdf.length, "Bytes");
  console.log("   Validator:", validation.validator, validation.validatorVersion);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

main().catch((error) => {
  console.error("❌", error);
  process.exit(1);
});
