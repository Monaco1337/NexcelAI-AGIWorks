/**
 * Steuerlogik.
 *
 * Deutschland kennt zurzeit drei relevante Fälle für unsere Rechnungen:
 *  - Regelbesteuerung mit 19 % oder ermäßigt 7 %
 *  - Kleinunternehmer nach § 19 UStG — keine ausgewiesene USt, mit
 *    Befreiungshinweis
 *  - Reverse Charge — keine USt, Hinweis auf Steuerschuldnerschaft
 *
 * Die Kategorie ist nicht dasselbe wie ein Nullsteuersatz. „Kleinunternehmer"
 * entspricht in EN 16931 der Kategorie `E` mit Befreiungsgrund; „0 % USt"
 * wäre Kategorie `Z`. Wer beides verwechselt, produziert eine ungültige
 * XRechnung.
 */

import type { BillingIssuer, IssuerSnapshot, TaxCategory, TaxRegime } from "./model";

export interface TaxTreatment {
  category: TaxCategory;
  ratePercentMilli: number;
  exemptionReason?: string;
  exemptionCode?: string;
}

/** Wählt die passende Steuerbehandlung anhand des Aussteller-Regimes. */
export function defaultTaxTreatment(
  issuer: BillingIssuer | IssuerSnapshot
): TaxTreatment {
  switch (issuer.taxRegime) {
    case "kleinunternehmer":
      return {
        category: "E",
        ratePercentMilli: 0,
        exemptionReason:
          issuer.smallBusinessNote ||
          "Steuerbefreit gemäß § 19 Abs. 1 UStG (Kleinunternehmer).",
        exemptionCode: "VATEX-EU-D",
      };
    case "reverse_charge":
      return {
        category: "K",
        ratePercentMilli: 0,
        exemptionReason: "Steuerschuldnerschaft des Leistungsempfängers.",
        exemptionCode: "VATEX-EU-AE",
      };
    case "tax_free":
      return {
        category: "Z",
        ratePercentMilli: 0,
        exemptionReason: "Steuerfreie Leistung.",
      };
    case "regelbesteuerung":
    default:
      return { category: "S", ratePercentMilli: 19_000 };
  }
}

/** Menschlich lesbare Prozentanzeige, z. B. „19 %" oder „7,5 %". */
export function formatRate(ratePercentMilli: number): string {
  if (ratePercentMilli === 0) return "0 %";
  const whole = Math.floor(ratePercentMilli / 1000);
  const frac = ratePercentMilli % 1000;
  if (frac === 0) return `${whole} %`;
  return `${whole},${String(frac).padStart(3, "0").replace(/0+$/, "")} %`;
}

/** Regeln, ob USt separat ausgewiesen werden muss. */
export function requiresTaxLine(regime: TaxRegime): boolean {
  return regime === "regelbesteuerung";
}

/**
 * Liefert die Steuerbefreiungsgründe pro Kategorie, die für den Steuer-
 * ausweis einer Rechnung des angegebenen Ausstellers verwendet werden.
 * XRechnung fordert diese Begründung für die Kategorien `E`, `K`, `Z`
 * und `G`; die Regel gilt genauso für den PDF-Ausweis.
 */
export function exemptionsForIssuer(
  issuer: BillingIssuer | IssuerSnapshot
): Partial<Record<TaxCategory, { reason: string; code?: string | undefined }>> {
  const treatment = defaultTaxTreatment(issuer);
  if (!treatment.exemptionReason) return {};
  return {
    [treatment.category]: {
      reason: treatment.exemptionReason,
      code: treatment.exemptionCode,
    },
  };
}

/** Standardhinweis für den Kleinunternehmer, wenn im Aussteller keiner hinterlegt ist. */
export const DEFAULT_SMALL_BUSINESS_NOTE =
  "Gemäß § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet (Kleinunternehmer).";
