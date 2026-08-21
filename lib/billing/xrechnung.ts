/**
 * XRechnung 3.0.2 (Universal Business Language 2.1, EN 16931 CIUS).
 *
 * Wir erzeugen das XML aus dem Domain-Modell direkt und ohne selbst
 * erfundene Tags — jeder Feldname stammt aus der UBL-Spezifikation und dem
 * XRechnung-Anwendungshandbuch. Elemente sind bewusst in derselben
 * Reihenfolge gebaut, die die Spezifikation vorschreibt; abweichende
 * Reihenfolgen werden vom KoSIT-Validator zurückgewiesen.
 *
 * Die Steuerlogik unterscheidet klar zwischen:
 *  - S: Standardsatz mit Prozent
 *  - AA: Ermäßigter Satz mit Prozent
 *  - Z: Nullsatz
 *  - E: Steuerbefreiung (Kleinunternehmer § 19 UStG) mit Reason und
 *       ExemptionReasonCode
 *  - K: Reverse Charge (Steuerschuldnerschaft des Leistungsempfängers)
 *  - G: Ausfuhr
 * Wer einen Kleinunternehmer als "0 % USt" schreibt, produziert ungültige
 * Belege — das ist hier bewusst nicht möglich.
 */

import type { InvoiceDomain, TaxCategory } from "./model";
import { INVOICE_TYPE_CODE } from "./model";
import { centsToDecimal, formatQty } from "./money";

const CUSTOMIZATION_ID =
  "urn:cen.eu:en16931:2017#compliant#urn:xoev-de:kosit:standard:xrechnung_3.0";
const PROFILE_ID = "urn:fdc:peppol.eu:2017:poacc:billing:01:1.0";

export const XRECHNUNG_SPEC_VERSION = "XRechnung 3.0.2";

interface TaxBucket {
  category: TaxCategory;
  ratePercentMilli: number;
  baseCents: number;
  taxCents: number;
  exemptionReason?: string;
}

function xmlEscape(input: string | number | null | undefined): string {
  if (input == null) return "";
  const s = typeof input === "string" ? input : String(input);
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Prozent (× 1000) → "19.00", "7.00", "0.00". */
function ratePercent(ratePercentMilli: number): string {
  const dec = ratePercentMilli / 1000;
  return dec.toFixed(2);
}

function money(cents: number): string {
  return centsToDecimal(cents);
}

function isoDate(d: string): string {
  return d.slice(0, 10);
}

function exemptionReasonCode(category: TaxCategory): string | undefined {
  switch (category) {
    case "E": return "VATEX-EU-D"; // Kleinunternehmerregelung
    case "K": return "VATEX-EU-AE"; // Reverse Charge
    case "Z": return undefined;
    case "G": return "VATEX-EU-G";
    default: return undefined;
  }
}

/** Beleg → XRechnung XML als String. */
export function renderXRechnung(invoice: InvoiceDomain): string {
  if (!invoice.invoiceNumber || !invoice.numericNumber) {
    throw new Error("Nur finalisierte Rechnungen können als XRechnung ausgegeben werden.");
  }

  const issuer = invoice.issuer;
  const customer = invoice.customer;
  const currency = invoice.currency || "EUR";

  const typeCode = INVOICE_TYPE_CODE[invoice.type] ?? "380";
  const buyerReference =
    invoice.references?.buyerReference?.trim() ||
    customer.customerNumber?.trim() ||
    invoice.invoiceNumber;

  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push(
    '<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" ' +
      'xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" ' +
      'xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2">'
  );
  lines.push(`  <cbc:CustomizationID>${CUSTOMIZATION_ID}</cbc:CustomizationID>`);
  lines.push(`  <cbc:ProfileID>${PROFILE_ID}</cbc:ProfileID>`);
  lines.push(`  <cbc:ID>${xmlEscape(invoice.invoiceNumber)}</cbc:ID>`);
  lines.push(`  <cbc:IssueDate>${isoDate(invoice.invoiceDate)}</cbc:IssueDate>`);
  lines.push(`  <cbc:DueDate>${isoDate(invoice.dueDate)}</cbc:DueDate>`);
  lines.push(`  <cbc:InvoiceTypeCode>${typeCode}</cbc:InvoiceTypeCode>`);
  const noteBits = [invoice.texts?.intro, invoice.texts?.outro, invoice.texts?.customerNote].filter(Boolean);
  for (const note of noteBits) {
    lines.push(`  <cbc:Note>${xmlEscape(note!)}</cbc:Note>`);
  }
  if (invoice.type === "correction" && invoice.references?.originalInvoiceNumber) {
    lines.push(
      `  <cbc:Note>Korrektur zu Rechnung ${xmlEscape(invoice.references.originalInvoiceNumber)}. ${xmlEscape(invoice.references.correctionReason ?? "")}</cbc:Note>`
    );
  }
  lines.push(`  <cbc:DocumentCurrencyCode>${currency}</cbc:DocumentCurrencyCode>`);
  lines.push(`  <cbc:BuyerReference>${xmlEscape(buyerReference)}</cbc:BuyerReference>`);

  if (invoice.references?.originalInvoiceNumber) {
    lines.push("  <cac:BillingReference>");
    lines.push("    <cac:InvoiceDocumentReference>");
    lines.push(`      <cbc:ID>${xmlEscape(invoice.references.originalInvoiceNumber)}</cbc:ID>`);
    lines.push("    </cac:InvoiceDocumentReference>");
    lines.push("  </cac:BillingReference>");
  }

  // Leistungszeitraum als Rechnungs-Ebene.
  if (invoice.servicePeriod.start && invoice.servicePeriod.end) {
    lines.push("  <cac:InvoicePeriod>");
    lines.push(`    <cbc:StartDate>${isoDate(invoice.servicePeriod.start)}</cbc:StartDate>`);
    lines.push(`    <cbc:EndDate>${isoDate(invoice.servicePeriod.end)}</cbc:EndDate>`);
    lines.push("  </cac:InvoicePeriod>");
  }

  // Aussteller.
  lines.push("  <cac:AccountingSupplierParty>");
  lines.push("    <cac:Party>");
  if (issuer.contact?.website) {
    lines.push("      <cac:PartyIdentification>");
    lines.push(`        <cbc:ID>${xmlEscape(issuer.contact.website)}</cbc:ID>`);
    lines.push("      </cac:PartyIdentification>");
  }
  lines.push("      <cac:PartyName>");
  lines.push(`        <cbc:Name>${xmlEscape(issuer.brandLabel)}</cbc:Name>`);
  lines.push("      </cac:PartyName>");
  lines.push("      <cac:PostalAddress>");
  lines.push(`        <cbc:StreetName>${xmlEscape(issuer.address.line1)}</cbc:StreetName>`);
  if (issuer.address.line2) lines.push(`        <cbc:AdditionalStreetName>${xmlEscape(issuer.address.line2)}</cbc:AdditionalStreetName>`);
  lines.push(`        <cbc:CityName>${xmlEscape(issuer.address.city)}</cbc:CityName>`);
  lines.push(`        <cbc:PostalZone>${xmlEscape(issuer.address.postalCode)}</cbc:PostalZone>`);
  lines.push(`        <cac:Country><cbc:IdentificationCode>${xmlEscape(issuer.address.country || "DE")}</cbc:IdentificationCode></cac:Country>`);
  lines.push("      </cac:PostalAddress>");
  if (issuer.vatId) {
    lines.push("      <cac:PartyTaxScheme>");
    lines.push(`        <cbc:CompanyID>${xmlEscape(issuer.vatId)}</cbc:CompanyID>`);
    lines.push('        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>');
    lines.push("      </cac:PartyTaxScheme>");
  }
  if (issuer.taxNumber) {
    lines.push("      <cac:PartyTaxScheme>");
    lines.push(`        <cbc:CompanyID>${xmlEscape(issuer.taxNumber)}</cbc:CompanyID>`);
    lines.push('        <cac:TaxScheme><cbc:ID>FC</cbc:ID></cac:TaxScheme>');
    lines.push("      </cac:PartyTaxScheme>");
  }
  lines.push("      <cac:PartyLegalEntity>");
  lines.push(`        <cbc:RegistrationName>${xmlEscape(issuer.legalName)}</cbc:RegistrationName>`);
  lines.push("      </cac:PartyLegalEntity>");
  lines.push("      <cac:Contact>");
  lines.push(`        <cbc:Name>${xmlEscape(issuer.owner)}</cbc:Name>`);
  if (issuer.contact?.phone) lines.push(`        <cbc:Telephone>${xmlEscape(issuer.contact.phone)}</cbc:Telephone>`);
  lines.push(`        <cbc:ElectronicMail>${xmlEscape(issuer.contact?.email ?? "")}</cbc:ElectronicMail>`);
  lines.push("      </cac:Contact>");
  lines.push("    </cac:Party>");
  lines.push("  </cac:AccountingSupplierParty>");

  // Kunde.
  lines.push("  <cac:AccountingCustomerParty>");
  lines.push("    <cac:Party>");
  lines.push("      <cac:PartyName>");
  lines.push(`        <cbc:Name>${xmlEscape(customer.name)}</cbc:Name>`);
  lines.push("      </cac:PartyName>");
  lines.push("      <cac:PostalAddress>");
  lines.push(`        <cbc:StreetName>${xmlEscape(customer.address.line1)}</cbc:StreetName>`);
  if (customer.address.line2) lines.push(`        <cbc:AdditionalStreetName>${xmlEscape(customer.address.line2)}</cbc:AdditionalStreetName>`);
  lines.push(`        <cbc:CityName>${xmlEscape(customer.address.city)}</cbc:CityName>`);
  lines.push(`        <cbc:PostalZone>${xmlEscape(customer.address.postalCode)}</cbc:PostalZone>`);
  lines.push(`        <cac:Country><cbc:IdentificationCode>${xmlEscape(customer.address.country || "DE")}</cbc:IdentificationCode></cac:Country>`);
  lines.push("      </cac:PostalAddress>");
  if (customer.vatId) {
    lines.push("      <cac:PartyTaxScheme>");
    lines.push(`        <cbc:CompanyID>${xmlEscape(customer.vatId)}</cbc:CompanyID>`);
    lines.push('        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>');
    lines.push("      </cac:PartyTaxScheme>");
  }
  lines.push("      <cac:PartyLegalEntity>");
  lines.push(`        <cbc:RegistrationName>${xmlEscape(customer.name)}</cbc:RegistrationName>`);
  lines.push("      </cac:PartyLegalEntity>");
  if (customer.email) {
    lines.push("      <cac:Contact>");
    if (customer.contactPerson) lines.push(`        <cbc:Name>${xmlEscape(customer.contactPerson)}</cbc:Name>`);
    lines.push(`        <cbc:ElectronicMail>${xmlEscape(customer.email)}</cbc:ElectronicMail>`);
    lines.push("      </cac:Contact>");
  }
  lines.push("    </cac:Party>");
  lines.push("  </cac:AccountingCustomerParty>");

  // Zahlungsmittel — SEPA-Überweisung mit IBAN.
  const bank = invoice.payment.bank;
  lines.push("  <cac:PaymentMeans>");
  lines.push('    <cbc:PaymentMeansCode>58</cbc:PaymentMeansCode>');
  if (invoice.payment.paymentReference) {
    lines.push(`    <cbc:PaymentID>${xmlEscape(invoice.payment.paymentReference)}</cbc:PaymentID>`);
  } else {
    lines.push(`    <cbc:PaymentID>${xmlEscape(invoice.invoiceNumber)}</cbc:PaymentID>`);
  }
  lines.push("    <cac:PayeeFinancialAccount>");
  lines.push(`      <cbc:ID>${xmlEscape(bank.iban.replace(/\s/g, ""))}</cbc:ID>`);
  if (bank.bankName) lines.push(`      <cbc:Name>${xmlEscape(bank.bankName)}</cbc:Name>`);
  lines.push("      <cac:FinancialInstitutionBranch>");
  lines.push(`        <cbc:ID>${xmlEscape(bank.bic)}</cbc:ID>`);
  lines.push("      </cac:FinancialInstitutionBranch>");
  lines.push("    </cac:PayeeFinancialAccount>");
  lines.push("  </cac:PaymentMeans>");

  lines.push("  <cac:PaymentTerms>");
  lines.push(
    `    <cbc:Note>Zahlbar bis ${isoDate(invoice.dueDate)} ohne Abzug.</cbc:Note>`
  );
  lines.push("  </cac:PaymentTerms>");

  // Steueraufschlüsselung. Die Beträge stammen aus dem Snapshot der Rechnung
  // — nicht neu berechnet.
  const buckets = normalizeBuckets(invoice.totals.taxBreakdown);
  const totalTax = buckets.reduce((s, b) => s + b.taxCents, 0);
  lines.push("  <cac:TaxTotal>");
  lines.push(`    <cbc:TaxAmount currencyID="${currency}">${money(totalTax)}</cbc:TaxAmount>`);
  for (const b of buckets) {
    lines.push("    <cac:TaxSubtotal>");
    lines.push(`      <cbc:TaxableAmount currencyID="${currency}">${money(b.baseCents)}</cbc:TaxableAmount>`);
    lines.push(`      <cbc:TaxAmount currencyID="${currency}">${money(b.taxCents)}</cbc:TaxAmount>`);
    lines.push("      <cac:TaxCategory>");
    lines.push(`        <cbc:ID>${b.category}</cbc:ID>`);
    lines.push(`        <cbc:Percent>${ratePercent(b.ratePercentMilli)}</cbc:Percent>`);
    const reasonCode = exemptionReasonCode(b.category);
    if (reasonCode) lines.push(`        <cbc:TaxExemptionReasonCode>${reasonCode}</cbc:TaxExemptionReasonCode>`);
    if (b.exemptionReason) lines.push(`        <cbc:TaxExemptionReason>${xmlEscape(b.exemptionReason)}</cbc:TaxExemptionReason>`);
    lines.push('        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>');
    lines.push("      </cac:TaxCategory>");
    lines.push("    </cac:TaxSubtotal>");
  }
  lines.push("  </cac:TaxTotal>");

  // Summenblock.
  lines.push("  <cac:LegalMonetaryTotal>");
  lines.push(`    <cbc:LineExtensionAmount currencyID="${currency}">${money(invoice.totals.netCents)}</cbc:LineExtensionAmount>`);
  lines.push(`    <cbc:TaxExclusiveAmount currencyID="${currency}">${money(invoice.totals.netCents)}</cbc:TaxExclusiveAmount>`);
  lines.push(`    <cbc:TaxInclusiveAmount currencyID="${currency}">${money(invoice.totals.grossCents)}</cbc:TaxInclusiveAmount>`);
  lines.push(`    <cbc:PayableAmount currencyID="${currency}">${money(invoice.totals.grossCents)}</cbc:PayableAmount>`);
  lines.push("  </cac:LegalMonetaryTotal>");

  // Positionen.
  for (const item of invoice.items) {
    lines.push(`  <cac:InvoiceLine>`);
    lines.push(`    <cbc:ID>${item.position}</cbc:ID>`);
    lines.push(`    <cbc:InvoicedQuantity unitCode="${xmlEscape(unitToUnCode(item.unit))}">${formatQty(item.quantityMilli).replace(",", ".")}</cbc:InvoicedQuantity>`);
    lines.push(`    <cbc:LineExtensionAmount currencyID="${currency}">${money(item.lineNetCents)}</cbc:LineExtensionAmount>`);
    if (invoice.servicePeriod?.start && invoice.servicePeriod?.end) {
      lines.push("    <cac:InvoicePeriod>");
      lines.push(`      <cbc:StartDate>${isoDate(invoice.servicePeriod.start)}</cbc:StartDate>`);
      lines.push(`      <cbc:EndDate>${isoDate(invoice.servicePeriod.end)}</cbc:EndDate>`);
      lines.push("    </cac:InvoicePeriod>");
    }
    lines.push("    <cac:Item>");
    if (item.description) lines.push(`      <cbc:Description>${xmlEscape(item.description)}</cbc:Description>`);
    lines.push(`      <cbc:Name>${xmlEscape(item.title)}</cbc:Name>`);
    lines.push("      <cac:ClassifiedTaxCategory>");
    lines.push(`        <cbc:ID>${item.taxCategory}</cbc:ID>`);
    lines.push(`        <cbc:Percent>${ratePercent(item.taxRatePercentMilli)}</cbc:Percent>`);
    lines.push('        <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>');
    lines.push("      </cac:ClassifiedTaxCategory>");
    lines.push("    </cac:Item>");
    lines.push("    <cac:Price>");
    lines.push(`      <cbc:PriceAmount currencyID="${currency}">${money(item.unitPriceCents)}</cbc:PriceAmount>`);
    lines.push("    </cac:Price>");
    lines.push("  </cac:InvoiceLine>");
  }

  lines.push("</Invoice>");
  return lines.join("\n");
}

/** UNECE Rec. 20 Common Codes für gängige Einheiten. */
function unitToUnCode(unit: string): string {
  const u = unit.trim().toLowerCase();
  const map: Record<string, string> = {
    "stk": "C62",
    "stk.": "C62",
    "stück": "C62",
    "monat": "MON",
    "monate": "MON",
    "monatlich": "MON",
    "std": "HUR",
    "std.": "HUR",
    "stunde": "HUR",
    "stunden": "HUR",
    "h": "HUR",
    "tag": "DAY",
    "tage": "DAY",
    "kg": "KGM",
    "kilogramm": "KGM",
    "m": "MTR",
    "meter": "MTR",
    "l": "LTR",
    "liter": "LTR",
    "pauschal": "LS",
    "pauschale": "LS",
  };
  return map[u] || "C62";
}

function normalizeBuckets(input: InvoiceDomain["totals"]["taxBreakdown"]): TaxBucket[] {
  if (!input?.length) return [];
  return input.map((b) => ({
    category: b.category,
    ratePercentMilli: b.ratePercentMilli,
    baseCents: b.baseCents,
    taxCents: b.taxCents,
    exemptionReason: b.exemptionReason,
  }));
}
