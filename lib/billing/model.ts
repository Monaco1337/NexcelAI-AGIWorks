/**
 * Rechnungs-Domain-Modell.
 *
 * Bewusst frei von Datenbank- oder React-Abhängigkeiten: dieselben Typen
 * werden im Editor, in der API, im PDF-Renderer und im XRechnung-Adapter
 * verwendet, damit PDF und XML garantiert dieselben Werte tragen.
 *
 * Immutability nach Finalisierung ist nicht durch die Typen erzwungen (der
 * Server hätte nichts vom `readonly` in einer JSON-Antwort), sondern durch
 * den Store: eine finalisierte Rechnung wird für Schreiboperationen
 * abgewiesen.
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

/**
 * Steuerregime des Ausstellers. Der Kleinunternehmer ist bewusst NICHT
 * derselbe Fall wie „0 % USt“: EN 16931 verlangt eine eigene Steuerkategorie
 * mit Befreiungsgrund. Wer beides gleich behandelt, produziert ungültige
 * E-Rechnungen.
 */
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

/**
 * EN-16931-Steuerkategorien der Positionsebene.
 *  - S = Standard rate (19 %)
 *  - AA = Lower rate (7 %)
 *  - Z = Zero rated
 *  - E = Exempt (Kleinunternehmer)
 *  - K = VAT reverse charge
 *  - G = Free export item
 */
export const TAX_CATEGORIES = ["S", "AA", "Z", "E", "K", "G"] as const;
export type TaxCategory = (typeof TAX_CATEGORIES)[number];

export const TAX_CATEGORY_LABEL: Record<TaxCategory, string> = {
  S: "USt (Regelsatz)",
  AA: "USt (ermäßigt)",
  Z: "Nullsatz",
  E: "Steuerbefreit",
  K: "Reverse Charge",
  G: "Ausfuhr",
};

export const INVOICE_TYPES = [
  "invoice",
  "correction",
  "credit_note",
  "advance",
  "final",
] as const;
export type InvoiceType = (typeof INVOICE_TYPES)[number];

export const INVOICE_TYPE_LABEL: Record<InvoiceType, string> = {
  invoice: "Rechnung",
  correction: "Korrekturrechnung",
  credit_note: "Gutschrift",
  advance: "Abschlagsrechnung",
  final: "Schlussrechnung",
};

/** UNTDID 1001 Codes für die XRechnung. */
export const INVOICE_TYPE_CODE: Record<InvoiceType, string> = {
  invoice: "380",
  correction: "384",
  credit_note: "381",
  advance: "386",
  final: "389",
};

export const BILLING_FREQUENCIES = ["once", "monthly", "quarterly", "yearly"] as const;
export type BillingFrequency = (typeof BILLING_FREQUENCIES)[number];

export const SERVICE_PERIOD_STRATEGIES = [
  "manual",
  "previous_month",
  "current_month",
  "previous_quarter",
  "previous_year",
] as const;
export type ServicePeriodStrategy = (typeof SERVICE_PERIOD_STRATEGIES)[number];

/* ── Adress- und Bankstrukturen ─────────────────────────────────────── */

export interface PostalAddress {
  line1: string;
  line2?: string | null;
  postalCode: string;
  city: string;
  country: string; // ISO-3166-1 alpha-2, z. B. "DE"
  countryLabel?: string;
}

export interface ContactChannel {
  email: string;
  phone?: string | null;
  mobile?: string | null;
  website?: string | null;
}

export interface BankAccount {
  bankName: string;
  iban: string;
  bic: string;
}

/* ── Aussteller ─────────────────────────────────────────────────────── */

export interface BillingIssuer {
  id: string;
  key: "agiworks" | "nexcel" | string;
  brandLabel: string;
  legalName: string;
  owner: string;
  headerTagline: string;
  address: PostalAddress;
  contact: ContactChannel;
  taxNumber: string | null;
  vatId: string | null;
  taxRegime: TaxRegime;
  smallBusinessNote: string;
  bank: BankAccount;
  defaultCurrency: string;
  defaultPaymentTerms: number;
  defaultIntro: string;
  defaultOutro: string;
  defaultFooter: string;
  accentColor: string;
  logoPath: string | null;
  templateKey: string;
  numberFormat: string;
  numberPrefix: string;
  numberPadding: number;
  active: boolean;
  configWarnings: string[];
  createdAt: string;
  updatedAt: string;
}

export type IssuerSnapshot = Omit<
  BillingIssuer,
  "id" | "active" | "createdAt" | "updatedAt" | "configWarnings"
>;

/* ── Kunde ──────────────────────────────────────────────────────────── */

export interface CustomerRef {
  id: string | null;
  name: string;
  contactPerson?: string | null;
  address: PostalAddress;
  email?: string | null;
  buyerReference?: string | null;
  leitwegId?: string | null;
  vatId?: string | null;
  customerNumber?: string | null;
}

export type CustomerSnapshot = CustomerRef;

/* ── Projekt ────────────────────────────────────────────────────────── */

export interface ProjectRef {
  id: string | null;
  slug: string | null;
  name: string;
  color: string | null;
}

/* ── Positionen ─────────────────────────────────────────────────────── */

/**
 * Positionswerte werden IM DOMAIN-MODELL als Minor Units geführt.
 * Serialisierte Antworten der API konvertieren zurück in Dezimaldarstellung,
 * damit die Oberfläche direkt formatieren kann.
 */
export interface InvoiceItemInput {
  title: string;
  description?: string;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  discountPercentMilli: number;
  taxCategory: TaxCategory;
  /** Prozentwert × 1000. 19 % = 19000. */
  taxRatePercentMilli: number;
}

export interface InvoiceItem extends InvoiceItemInput {
  id: string;
  position: number;
  lineNetCents: number;
  lineTaxCents: number;
  lineGrossCents: number;
}

/* ── Rechnung ───────────────────────────────────────────────────────── */

export interface InvoicePaymentInfo {
  bank: BankAccount;
  paymentReference?: string | null;
  paymentTermsDays: number;
}

export interface InvoiceTotals {
  netCents: number;
  taxCents: number;
  grossCents: number;
  currency: string;
  taxBreakdown: {
    category: TaxCategory;
    ratePercentMilli: number;
    baseCents: number;
    taxCents: number;
    exemptionReason?: string;
  }[];
}

export interface InvoiceTexts {
  salutation?: string;
  intro?: string;
  outro?: string;
  customerNote?: string;
  internalNote?: string;
  smallBusinessNote?: string;
}

export interface InvoiceReferences {
  buyerReference?: string | null;
  leitwegId?: string | null;
  purchaseOrder?: string | null;
  originalInvoiceId?: string | null;
  originalInvoiceNumber?: string | null;
  correctionReason?: string | null;
}

export interface ServicePeriod {
  start: string; // ISO date
  end: string;   // ISO date
  /** Menschlich lesbar, aus dem Datum berechnet, z. B. "Juli 2026". */
  label: string;
}

export interface InvoiceDomain {
  id: string;
  status: InvoiceStatus;
  type: InvoiceType;
  invoiceNumber: string | null;
  numericNumber: number | null;
  issuer: BillingIssuer | IssuerSnapshot;
  customer: CustomerRef | CustomerSnapshot;
  project: ProjectRef | null;
  invoiceDate: string; // ISO date
  dueDate: string;     // ISO date
  servicePeriod: ServicePeriod;
  currency: string;
  items: InvoiceItem[];
  texts: InvoiceTexts;
  payment: InvoicePaymentInfo;
  references: InvoiceReferences;
  totals: InvoiceTotals;
  templateKey: string;
  isSnapshot: boolean;
}
