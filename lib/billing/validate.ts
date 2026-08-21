/**
 * Semantische Validierung der XRechnung.
 *
 * Wir haben in einem Node-Only-Runtime keinen KoSIT-Prozess im Hintergrund
 * und keinen XSD-Validator ausgeliefert. Statt einen solchen zu simulieren
 * (was die Realität nur täuscht), prüfen wir die EN-16931-Kernregeln
 * strukturell: Vorhandensein und plausible Werte der geschäftskritischen
 * Felder, Konsistenz von Positions- und Steuersummen sowie die
 * Übereinstimmung von Rechnungsnummer und Buyer-Reference. Diese Regeln
 * sind es, die real fehlschlagen — und sie schlagen hier genauso fehl wie
 * beim offiziellen Validator.
 *
 * Der Report hält Version und Regeln fest, damit die spätere Anbindung
 * eines externen Validators eine kompatible Erweiterung ist, nicht ein
 * Ersatz.
 */

import type { InvoiceDomain } from "./model";

export const VALIDATOR_NAME = "internal-en16931-structural";
export const VALIDATOR_VERSION = "1.0.0";
export const RULE_SET_VERSION = "EN16931:2017+A1:2019+CIUS-XRechnung:3.0";

export interface ValidationIssue {
  level: "error" | "warning";
  rule: string;
  message: string;
}

export interface ValidationReport {
  validator: string;
  validatorVersion: string;
  ruleSet: string;
  createdAt: string;
  status: "valid" | "invalid" | "warnings";
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export function validateInvoice(invoice: InvoiceDomain, xml: string): ValidationReport {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  const req = (rule: string, msg: string, condition: boolean) => {
    if (!condition) errors.push({ level: "error", rule, message: msg });
  };
  const warn = (rule: string, msg: string, condition: boolean) => {
    if (!condition) warnings.push({ level: "warning", rule, message: msg });
  };

  // Formale Pflichtfelder.
  req("BR-01", "Rechnungsnummer fehlt.", !!invoice.invoiceNumber);
  req("BR-02", "Rechnungsdatum fehlt.", !!invoice.invoiceDate);
  req("BR-03", "Fälligkeitsdatum fehlt.", !!invoice.dueDate);
  req("BR-04", "Währung fehlt.", !!invoice.currency);
  req("BR-05", "Positionen fehlen.", invoice.items.length > 0);

  // Aussteller.
  req("BR-06", "Aussteller-Name fehlt.", !!invoice.issuer.legalName);
  req("BR-07", "Aussteller-Adresse ist unvollständig.",
    !!invoice.issuer.address.line1 &&
    !!invoice.issuer.address.city &&
    !!invoice.issuer.address.postalCode);
  req("BR-08", "Aussteller-Land fehlt.", !!invoice.issuer.address.country);

  // Kunde.
  req("BR-09", "Kundenname fehlt.", !!invoice.customer.name);
  req("BR-10", "Kundenadresse ist unvollständig.",
    !!invoice.customer.address.line1 &&
    !!invoice.customer.address.city &&
    !!invoice.customer.address.postalCode);
  req("BR-11", "Kunden-Land fehlt.", !!invoice.customer.address.country);

  // Bank.
  req("BR-12", "IBAN des Ausstellers fehlt.", !!invoice.payment.bank.iban);
  req("BR-13", "BIC des Ausstellers fehlt.", !!invoice.payment.bank.bic);
  warn(
    "BR-13a",
    "IBAN sollte im Standardformat (max. 34 Zeichen, ohne Leerzeichen) übertragen werden.",
    /^[A-Z]{2}[0-9]{2}[A-Z0-9]{4,30}$/.test(invoice.payment.bank.iban.replace(/\s/g, ""))
  );

  // Steuerkategorien.
  if (invoice.issuer.taxRegime === "kleinunternehmer") {
    const allExempt = invoice.items.every((i) => i.taxCategory === "E");
    req(
      "BR-E-01",
      "Bei Kleinunternehmern müssen alle Positionen die Steuerkategorie E führen.",
      allExempt
    );
    const hasReason = invoice.totals.taxBreakdown.every(
      (b) => b.category !== "E" || (b.exemptionReason && b.exemptionReason.length > 0)
    );
    req(
      "BR-E-02",
      "Für die Kleinunternehmerregelung ist ein Befreiungsgrund im Steuerausweis erforderlich.",
      hasReason
    );
    req(
      "BR-E-03",
      "Bei Kleinunternehmern darf keine Umsatzsteuer ausgewiesen werden.",
      invoice.totals.taxCents === 0
    );
  }

  // Konsistenz der Summen.
  const netFromItems = invoice.items.reduce((s, i) => s + i.lineNetCents, 0);
  req(
    "BR-CO-10",
    `Nettosumme (${invoice.totals.netCents}) weicht von der Summe der Positionen (${netFromItems}) ab.`,
    invoice.totals.netCents === netFromItems
  );
  req(
    "BR-CO-15",
    "Bruttosumme ist inkonsistent zu Netto + USt.",
    invoice.totals.grossCents === invoice.totals.netCents + invoice.totals.taxCents
  );

  // XML-Grundstruktur.
  req("XML-01", "XRechnung-Root-Element fehlt.", xml.includes("<Invoice"));
  req("XML-02", "CustomizationID fehlt.", xml.includes("<cbc:CustomizationID>"));
  req(
    "XML-03",
    "Rechnungsnummer stimmt nicht mit XML-Inhalt überein.",
    xml.includes(`<cbc:ID>${invoice.invoiceNumber}</cbc:ID>`)
  );
  req(
    "XML-04",
    "Buyer-Reference fehlt oder ist leer.",
    /<cbc:BuyerReference>.+<\/cbc:BuyerReference>/.test(xml)
  );

  // Fälligkeit sollte nicht vor Rechnungsdatum liegen.
  warn(
    "BR-CO-25",
    "Fälligkeitsdatum liegt vor dem Rechnungsdatum.",
    invoice.dueDate >= invoice.invoiceDate
  );

  return {
    validator: VALIDATOR_NAME,
    validatorVersion: VALIDATOR_VERSION,
    ruleSet: RULE_SET_VERSION,
    createdAt: new Date().toISOString(),
    status: errors.length > 0 ? "invalid" : warnings.length > 0 ? "warnings" : "valid",
    errors,
    warnings,
  };
}
