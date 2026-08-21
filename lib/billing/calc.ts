/**
 * Positions- und Gesamtsummenberechnung.
 *
 * Alle Summen entstehen genau hier — nicht im PDF-Renderer, nicht im XML-
 * Adapter, nicht im React-Editor. Damit steht sicher, dass die drei Ausgaben
 * denselben Betrag zeigen.
 *
 * Rundung:
 *  - Positionssumme (Menge × Einzelpreis, minus Rabatt) wird auf ganze Cent
 *    kaufmännisch gerundet.
 *  - USt-Betrag pro Steuerkategorie ergibt sich aus der Summe der bereits
 *    gerundeten Netto-Positionen dieser Kategorie. Damit stimmen Positions-
 *    und Steuerausweise überein — auch wenn die Einzelrundungen minimale
 *    Differenzen erzeugen.
 */

import {
  applyPercentDiscount,
  lineTotalCents,
  sumCents,
  taxAmountCents,
} from "./money";
import type {
  InvoiceItem,
  InvoiceItemInput,
  InvoiceTotals,
  TaxCategory,
} from "./model";

function itemId(index: number): string {
  return `pos-${(index + 1).toString().padStart(3, "0")}`;
}

/** Ergänzt die eingegebenen Positionen um IDs und Zwischensummen. */
export function buildItems(inputs: InvoiceItemInput[]): InvoiceItem[] {
  return inputs.map((input, i) => {
    const gross = lineTotalCents(input.quantityMilli, input.unitPriceCents);
    const net = applyPercentDiscount(gross, input.discountPercentMilli);
    const tax = taxAmountCents(net, input.taxRatePercentMilli);
    return {
      ...input,
      id: itemId(i),
      position: i + 1,
      lineNetCents: net,
      lineTaxCents: tax,
      lineGrossCents: net + tax,
    };
  });
}

/**
 * Optionaler Kontext für die Summenbildung — enthält die Befreiungsgründe
 * pro Steuerkategorie, die EN 16931 für die Kategorien `E`, `K`, `Z` und `G`
 * verlangt. Wir tragen sie im Steuerausweis nach, damit XRechnung und PDF
 * exakt dieselbe Begründung führen.
 */
export interface ComputeTotalsOptions {
  exemptions?: Partial<
    Record<TaxCategory, { reason: string; code?: string | undefined }>
  >;
}

/**
 * Bildet die Gesamtsummen inklusive Steueraufschlüsselung. Steuersumme
 * entsteht durch Summierung der gerundeten Positionen einer Kategorie —
 * so ist der Ausweis mit dem Rechnungslauf konsistent.
 */
export function computeTotals(
  items: InvoiceItem[],
  currency: string,
  options: ComputeTotalsOptions = {}
): InvoiceTotals {
  const groups = new Map<
    string,
    {
      category: TaxCategory;
      ratePercentMilli: number;
      baseCents: number;
      taxCents: number;
      exemptionReason?: string;
      exemptionCode?: string;
    }
  >();

  for (const item of items) {
    const key = `${item.taxCategory}:${item.taxRatePercentMilli}`;
    const existing = groups.get(key);
    if (existing) {
      existing.baseCents += item.lineNetCents;
      existing.taxCents += item.lineTaxCents;
    } else {
      const exemption = options.exemptions?.[item.taxCategory];
      groups.set(key, {
        category: item.taxCategory,
        ratePercentMilli: item.taxRatePercentMilli,
        baseCents: item.lineNetCents,
        taxCents: item.lineTaxCents,
        exemptionReason: exemption?.reason,
        exemptionCode: exemption?.code,
      });
    }
  }

  const netCents = sumCents(items.map((i) => i.lineNetCents));
  const taxCents = sumCents([...groups.values()].map((g) => g.taxCents));

  return {
    netCents,
    taxCents,
    grossCents: netCents + taxCents,
    currency,
    taxBreakdown: [...groups.values()].map((g) => ({
      category: g.category,
      ratePercentMilli: g.ratePercentMilli,
      baseCents: g.baseCents,
      taxCents: g.taxCents,
      ...(g.exemptionReason ? { exemptionReason: g.exemptionReason } : {}),
    })),
  };
}
