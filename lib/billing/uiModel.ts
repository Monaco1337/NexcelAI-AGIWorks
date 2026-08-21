/**
 * UI-Kopien der Rechnungs-Modelltypen.
 *
 * Dieselben Konstanten wie in `model.ts`, aber ohne einen einzigen Import,
 * der zum Server-Bundle führen könnte. Damit können React-Komponenten die
 * Beschriftungen und Farben verwenden, ohne den Postgres-Client im Client-
 * Bundle zu landen.
 */

export const INVOICE_STATUSES = [
  "draft",
  "ready_for_review",
  "finalized",
  "sent",
  "paid",
  "partially_paid",
  "overdue",
  "cancelled",
  "credited",
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  draft: "Entwurf",
  ready_for_review: "Zur Freigabe",
  finalized: "Finalisiert",
  sent: "Versendet",
  paid: "Bezahlt",
  partially_paid: "Teilbezahlt",
  overdue: "Überfällig",
  cancelled: "Storniert",
  credited: "Gutgeschrieben",
};

export const INVOICE_STATUS_COLOR: Record<InvoiceStatus, string> = {
  draft: "#94A3B8",
  ready_for_review: "#F59E0B",
  finalized: "#5BB8FF",
  sent: "#A45CFF",
  paid: "#22C55E",
  partially_paid: "#EAB308",
  overdue: "#EF4444",
  cancelled: "#71717A",
  credited: "#F472B6",
};

export const TAX_REGIMES = [
  "kleinunternehmer",
  "regelbesteuerung",
  "reverse_charge",
  "tax_free",
] as const;
export type TaxRegime = (typeof TAX_REGIMES)[number];

export const TAX_REGIME_LABEL: Record<TaxRegime, string> = {
  kleinunternehmer: "Kleinunternehmer (§ 19 UStG)",
  regelbesteuerung: "Regelbesteuerung",
  reverse_charge: "Reverse Charge",
  tax_free: "Steuerfrei",
};

export const TAX_CATEGORIES = ["S", "AA", "Z", "E", "K", "G"] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];

export const TAX_CATEGORY_LABEL: Record<TaxCategory, string> = {
  S: "USt Regelsatz",
  AA: "USt ermäßigt",
  Z: "Nullsatz",
  E: "Steuerbefreit",
  K: "Reverse Charge",
  G: "Ausfuhr",
};

export const BILLING_FREQUENCIES = ["once", "monthly", "quarterly", "yearly"] as const;
export type BillingFrequency = (typeof BILLING_FREQUENCIES)[number];

export const BILLING_FREQUENCY_LABEL: Record<BillingFrequency, string> = {
  once: "Einmalig",
  monthly: "Monatlich",
  quarterly: "Quartalsweise",
  yearly: "Jährlich",
};

/** Formatiert einen Cent-Betrag deutsch. */
export function formatEUR(cents: number, currency = "EUR"): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = abs % 100;
  const wholeStr = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const symbol = currency === "EUR" ? "€" : currency;
  return `${sign}${wholeStr},${String(frac).padStart(2, "0")} ${symbol}`;
}

export function parseEuroInput(input: string): number {
  const normalized = input.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) throw new RangeError("Betrag ungültig");
  const [whole, frac = ""] = normalized.split(".");
  const paddedFrac = (frac + "00").slice(0, 2);
  const sign = whole.startsWith("-") ? -1 : 1;
  const wholeAbs = whole.replace("-", "");
  return sign * (Number(wholeAbs) * 100 + Number(paddedFrac));
}

export function parseQtyInput(input: string): number {
  const normalized = input.trim().replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) throw new RangeError("Menge ungültig");
  const [whole, frac = ""] = normalized.split(".");
  const paddedFrac = (frac + "000").slice(0, 3);
  const sign = whole.startsWith("-") ? -1 : 1;
  const wholeAbs = whole.replace("-", "");
  return sign * (Number(wholeAbs) * 1000 + Number(paddedFrac));
}

export function formatQty(qtyMilli: number): string {
  const sign = qtyMilli < 0 ? "-" : "";
  const abs = Math.abs(qtyMilli);
  const whole = Math.floor(abs / 1000);
  const frac = abs % 1000;
  const fracStr = String(frac).padStart(3, "0").replace(/0+$/, "");
  return fracStr.length === 0 ? `${sign}${whole}` : `${sign}${whole},${fracStr}`;
}

export function formatDeDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}.${m}.${y}`;
}
