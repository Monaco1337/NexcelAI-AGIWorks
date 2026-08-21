/**
 * Gemeinsame UI-Bausteine der Rechnungsansicht.
 *
 * Enthält nur die Typen, die die API tatsächlich liefert — bewusst keine
 * Persistenz-Imports, damit der Postgres-Client nicht ins Client-Bundle
 * gerät.
 */

import type {
  BillingFrequency,
  InvoiceStatus,
  TaxCategory,
} from "@/lib/billing/uiModel";

export interface IssuerInfo {
  id: string;
  key: string;
  label: string;
  accent: string;
  taxRegime: string;
  currency: string;
  templateKey: string;
  nextNumber: number;
  lastNumber: number;
  configWarnings: string[];
}

export interface ProjectOption {
  id: string;
  name: string;
  slug: string;
  color: string;
  status: string;
}

export interface InvoiceStats {
  open: number;
  overdue: number;
  paid: number;
  drafts: number;
  currentMonthRevenueCents: number;
}

export interface StatsResponse {
  stats: InvoiceStats;
  issuers: IssuerInfo[];
  projects: ProjectOption[];
}

export interface InvoiceSummary {
  id: string;
  status: InvoiceStatus;
  type: string;
  invoiceNumber: string | null;
  numericNumber: number | null;
  invoiceDate: string;
  dueDate: string;
  servicePeriod: { start: string; end: string; label: string };
  issuer: { id: string; key: string; label: string; accent: string };
  customer: { id: string | null; name: string };
  project: { id: string | null; name: string | null; color: string | null; slug: string | null };
  totals: { netCents: number; taxCents: number; grossCents: number; currency: string };
  paymentStatus: string;
  paidAt: string | null;
  sentAt: string | null;
  hasEInvoice: boolean;
  eInvoiceStatus: "unchecked" | "valid" | "invalid" | "missing" | "warnings";
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  position: number;
  title: string;
  description: string;
  quantityMilli: number;
  unit: string;
  unitPriceCents: number;
  discountPercentMilli: number;
  taxCategory: TaxCategory;
  taxRatePercentMilli: number;
  lineNetCents: number;
  lineTaxCents: number;
  lineGrossCents: number;
}

export interface InvoiceDetail {
  id: string;
  status: InvoiceStatus;
  type: string;
  invoiceNumber: string | null;
  numericNumber: number | null;
  issuer: {
    id?: string;
    key?: string;
    brandLabel: string;
    legalName: string;
    owner: string;
    headerTagline: string;
    address: {
      line1: string;
      line2?: string | null;
      postalCode: string;
      city: string;
      country: string;
      countryLabel?: string;
    };
    contact: { email: string; phone?: string | null; mobile?: string | null; website?: string | null };
    taxNumber: string | null;
    vatId: string | null;
    taxRegime: string;
    smallBusinessNote: string;
    bank: { bankName: string; iban: string; bic: string };
    accentColor: string;
    templateKey: string;
    logoPath?: string | null;
  };
  customer: {
    id: string | null;
    name: string;
    contactPerson?: string | null;
    address: { line1: string; line2?: string | null; postalCode: string; city: string; country: string };
    email?: string | null;
    buyerReference?: string | null;
  };
  project: { id: string | null; slug: string | null; name: string; color: string | null } | null;
  invoiceDate: string;
  dueDate: string;
  servicePeriod: { start: string; end: string; label: string };
  currency: string;
  items: InvoiceItem[];
  texts: {
    salutation?: string;
    intro?: string;
    outro?: string;
    customerNote?: string;
    internalNote?: string;
    smallBusinessNote?: string;
  };
  payment: {
    bank: { bankName: string; iban: string; bic: string };
    paymentTermsDays: number;
    paymentReference?: string | null;
  };
  references: {
    buyerReference?: string | null;
    originalInvoiceNumber?: string | null;
    correctionReason?: string | null;
  };
  totals: {
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
  };
  templateKey: string;
  isSnapshot: boolean;
}

export interface InvoiceDocument {
  id: string;
  kind: string;
  mimeType: string;
  filename: string;
  byteSize: number;
  sha256: string;
  specVersion: string | null;
  validationStatus: string;
  validationReport: {
    validator?: string;
    validatorVersion?: string;
    ruleSet?: string;
    status?: string;
    errors?: { rule: string; message: string }[];
    warnings?: { rule: string; message: string }[];
  };
  createdAt: string;
}

export interface QueueEntry {
  projectId: string;
  projectName: string;
  projectColor: string | null;
  projectSlug: string;
  issuerId: string | null;
  issuerLabel: string | null;
  customerId: string | null;
  customerName: string | null;
  billingEnabled: boolean;
  billingFrequency: BillingFrequency;
  billingDay: number | null;
  billingTerms: number;
  defaultCurrency: string;
  servicePeriodStrategy: string;
  defaultItems: unknown[];
  billingOrder: number;
  lastBilledPeriodEnd: string | null;
  nextBillingDate: string | null;
  lastInvoiceId: string | null;
  lastInvoiceNumber: string | null;
  lastInvoicePeriodLabel: string | null;
  lastInvoiceStatus: string | null;
}
