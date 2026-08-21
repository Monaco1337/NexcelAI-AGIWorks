/**
 * Persistenz für Rechnungen.
 *
 * Die Datei bündelt bewusst den kompletten Schreib-Zugang. Es gibt genau eine
 * Stelle, an der eine Nummer vergeben wird (`allocateInvoiceNumber` innerhalb
 * einer Transaktion mit `SELECT … FOR UPDATE`), genau eine Stelle, an der
 * eine Rechnung finalisiert wird, und genau eine Stelle, an der die
 * unveränderlichen Snapshots erzeugt werden. Das ist die einzige Chance,
 * Rechnungsnummern-Duplikate und heimliche Änderungen an finalisierten
 * Belegen wirklich auszuschließen.
 *
 * Beträge liegen in der Datenbank als BigInt-Cent. Wir konvertieren am Rand
 * der API in Dezimalstrings — kein Fließkomma zwischen Berechnung und
 * Persistenz.
 */

import { db } from "@/lib/pg";
import type { Tx } from "@/lib/db/migrationRunner";
import { writeAuditTx, type AuditActor } from "@/lib/audit/auditLog";

import { buildItems, computeTotals } from "./calc";
import { getIssuer, getIssuerTx, toIssuerSnapshot } from "./issuersStore";
import { getCustomer, getCustomerTx } from "./customersStore";
import { defaultTaxTreatment, exemptionsForIssuer } from "./tax";
import { addDays, buildPeriod, formatDeDate, todayIso } from "./period";
import type {
  CustomerRef,
  CustomerSnapshot,
  InvoiceDomain,
  InvoiceItem,
  InvoiceItemInput,
  InvoicePaymentInfo,
  InvoiceReferences,
  InvoiceStatus,
  InvoiceTexts,
  InvoiceTotals,
  InvoiceType,
  IssuerSnapshot,
  ProjectRef,
  ServicePeriod,
  TaxCategory,
} from "./model";
import { INVOICE_STATUSES, INVOICE_TYPES } from "./model";

/* ── Fehler ─────────────────────────────────────────────────────────── */

export class InvoiceError extends Error {
  constructor(
    message: string,
    readonly code:
      | "not_found"
      | "not_editable"
      | "validation"
      | "duplicate_period"
      | "sequence_conflict"
      | "concurrent_finalize" = "validation"
  ) {
    super(message);
    this.name = "InvoiceError";
  }
}

/* ── Rohtypen ───────────────────────────────────────────────────────── */

interface InvoiceRow {
  id: string;
  status: string;
  type: string;
  issuer_id: string;
  customer_id: string | null;
  project_id: string | null;
  invoice_number: string | null;
  numeric_number: number | null;
  sequence_year: number | null;
  invoice_date: Date;
  due_date: Date;
  service_period_start: Date;
  service_period_end: Date;
  service_period_label: string;
  currency: string;
  payment_terms_days: number;
  totals_net_cents: string;
  totals_tax_cents: string;
  totals_gross_cents: string;
  tax_breakdown: unknown;
  salutation: string;
  intro_text: string;
  outro_text: string;
  customer_note: string;
  internal_note: string;
  small_business_note: string;
  buyer_reference: string | null;
  leitweg_id: string | null;
  purchase_order: string | null;
  original_invoice_id: string | null;
  original_invoice_number: string | null;
  correction_reason: string | null;
  template_key: string;
  payment_status: string;
  paid_at: Date | null;
  payment_reference: string | null;
  sent_at: Date | null;
  sent_recipient: string | null;
  sent_message_id: string | null;
  version: number;
  finalized_at: Date | null;
  cancelled_at: Date | null;
  issuer_snapshot: unknown;
  customer_snapshot: unknown;
  project_snapshot: unknown;
  payment_snapshot: unknown;
  created_at: Date;
  updated_at: Date;
}

interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  position: number;
  title: string;
  description: string;
  quantity_milli: string;
  unit: string;
  unit_price_cents: string;
  discount_percent_milli: number;
  tax_category: string;
  tax_rate_percent_milli: number;
  line_net_cents: string;
  line_tax_cents: string;
  line_gross_cents: string;
}

interface InvoiceJoinRow extends InvoiceRow {
  issuer_key: string;
  issuer_brand_label: string;
  issuer_accent: string;
  customer_name: string | null;
  project_name: string | null;
  project_color: string | null;
  project_slug: string | null;
}

const INVOICE_SELECT = `
  SELECT
    i.id, i.status, i.type, i.issuer_id, i.customer_id, i.project_id,
    i.invoice_number, i.numeric_number, i.sequence_year,
    i.invoice_date, i.due_date,
    i.service_period_start, i.service_period_end, i.service_period_label,
    i.currency, i.payment_terms_days,
    i.totals_net_cents, i.totals_tax_cents, i.totals_gross_cents, i.tax_breakdown,
    i.salutation, i.intro_text, i.outro_text,
    i.customer_note, i.internal_note, i.small_business_note,
    i.buyer_reference, i.leitweg_id, i.purchase_order,
    i.original_invoice_id, i.original_invoice_number, i.correction_reason,
    i.template_key, i.payment_status, i.paid_at, i.payment_reference,
    i.sent_at, i.sent_recipient, i.sent_message_id,
    i.version, i.finalized_at, i.cancelled_at,
    i.issuer_snapshot, i.customer_snapshot, i.project_snapshot, i.payment_snapshot,
    i.created_at, i.updated_at,
    iss.key AS issuer_key, iss.brand_label AS issuer_brand_label,
    iss.accent_color AS issuer_accent,
    cust.name AS customer_name,
    proj.name AS project_name, proj.color AS project_color, proj.slug AS project_slug
  FROM invoices i
  JOIN billing_issuers iss ON iss.id = i.issuer_id
  LEFT JOIN billing_customers cust ON cust.id = i.customer_id
  LEFT JOIN crm_projects proj ON proj.id = i.project_id
`;

/* ── Zusammenfassung für Listen ─────────────────────────────────────── */

export interface InvoiceSummary {
  id: string;
  status: InvoiceStatus;
  type: InvoiceType;
  invoiceNumber: string | null;
  numericNumber: number | null;
  invoiceDate: string;
  dueDate: string;
  servicePeriod: ServicePeriod;
  issuer: { id: string; key: string; label: string; accent: string };
  customer: { id: string | null; name: string };
  project: { id: string | null; name: string | null; color: string | null; slug: string | null };
  totals: { netCents: number; taxCents: number; grossCents: number; currency: string };
  paymentStatus: string;
  paidAt: string | null;
  sentAt: string | null;
  hasEInvoice: boolean;
  eInvoiceStatus: "unchecked" | "valid" | "invalid" | "missing";
  createdAt: string;
  updatedAt: string;
}

function rowToSummary(
  row: InvoiceJoinRow,
  einvoice: { has: boolean; status: InvoiceSummary["eInvoiceStatus"] }
): InvoiceSummary {
  return {
    id: row.id,
    status: row.status as InvoiceStatus,
    type: row.type as InvoiceType,
    invoiceNumber: row.invoice_number,
    numericNumber: row.numeric_number,
    invoiceDate: row.invoice_date.toISOString().slice(0, 10),
    dueDate: row.due_date.toISOString().slice(0, 10),
    servicePeriod: buildPeriod(
      row.service_period_start.toISOString().slice(0, 10),
      row.service_period_end.toISOString().slice(0, 10)
    ),
    issuer: {
      id: row.issuer_id,
      key: row.issuer_key,
      label: row.issuer_brand_label,
      accent: row.issuer_accent,
    },
    customer: {
      id: row.customer_id,
      name: row.customer_name || (row.customer_snapshot as CustomerSnapshot | null)?.name || "",
    },
    project: {
      id: row.project_id,
      name: row.project_name,
      color: row.project_color,
      slug: row.project_slug,
    },
    totals: {
      netCents: Number(row.totals_net_cents),
      taxCents: Number(row.totals_tax_cents),
      grossCents: Number(row.totals_gross_cents),
      currency: row.currency,
    },
    paymentStatus: row.payment_status,
    paidAt: row.paid_at?.toISOString() ?? null,
    sentAt: row.sent_at?.toISOString() ?? null,
    hasEInvoice: einvoice.has,
    eInvoiceStatus: einvoice.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

/* ── Filter ─────────────────────────────────────────────────────────── */

export interface InvoiceFilter {
  issuerId?: string;
  projectId?: string | null;
  customerId?: string;
  status?: InvoiceStatus[];
  from?: string;
  to?: string;
  search?: string;
  limit?: number;
  cursor?: string;
}

export async function listInvoices(filter: InvoiceFilter = {}): Promise<{
  entries: InvoiceSummary[];
  nextCursor: string | null;
}> {
  const sql = await db();
  if (!sql) return { entries: [], nextCursor: null };

  const limit = Math.min(filter.limit ?? 50, 200);
  const term = filter.search?.trim() ? `%${filter.search.trim().toLowerCase()}%` : null;
  const statuses = filter.status?.length ? filter.status : null;

  const rows = await sql<InvoiceJoinRow[]>`
    ${sql.unsafe(INVOICE_SELECT)}
    WHERE (${filter.issuerId ?? null}::text IS NULL OR i.issuer_id = ${filter.issuerId ?? null})
      AND (${filter.projectId === undefined ? null : filter.projectId}::text IS NULL
           OR i.project_id = ${filter.projectId ?? null})
      AND (${filter.customerId ?? null}::text IS NULL OR i.customer_id = ${filter.customerId ?? null})
      AND (${statuses}::text[] IS NULL OR i.status = ANY(${statuses}::text[]))
      AND (${filter.from ?? null}::date IS NULL OR i.invoice_date >= ${filter.from ?? null}::date)
      AND (${filter.to ?? null}::date IS NULL OR i.invoice_date <= ${filter.to ?? null}::date)
      AND (${term}::text IS NULL OR (
        lower(COALESCE(i.invoice_number,'')) LIKE ${term}
        OR lower(COALESCE(cust.name,'')) LIKE ${term}
        OR lower(COALESCE(proj.name,'')) LIKE ${term}
      ))
      AND (${filter.cursor ?? null}::timestamptz IS NULL OR i.created_at < ${filter.cursor ?? null}::timestamptz)
    ORDER BY i.created_at DESC
    LIMIT ${limit + 1}
  `;

  const hasMore = rows.length > limit;
  const chunk = rows.slice(0, limit);

  const ids = chunk.map((r) => r.id);
  const docStatuses = new Map<string, { has: boolean; status: InvoiceSummary["eInvoiceStatus"] }>();
  if (ids.length > 0) {
    const docs = await sql<
      { invoice_id: string; kind: string; validation_status: string }[]
    >`
      SELECT invoice_id, kind, validation_status
      FROM invoice_documents
      WHERE invoice_id = ANY(${ids}::text[]) AND kind IN ('xrechnung','zugferd')
    `;
    for (const id of ids) docStatuses.set(id, { has: false, status: "missing" });
    for (const doc of docs) {
      const current = docStatuses.get(doc.invoice_id) || { has: false, status: "missing" as const };
      current.has = true;
      if (doc.validation_status === "valid") current.status = "valid";
      else if (doc.validation_status === "invalid" && current.status !== "valid") current.status = "invalid";
      else if (current.status === "missing") current.status = "unchecked";
      docStatuses.set(doc.invoice_id, current);
    }
  }

  const entries = chunk.map((r) => rowToSummary(r, docStatuses.get(r.id) || { has: false, status: "missing" }));
  return {
    entries,
    nextCursor: hasMore ? entries[entries.length - 1].createdAt : null,
  };
}

/* ── KPI ────────────────────────────────────────────────────────────── */

export interface InvoiceStats {
  open: number;
  overdue: number;
  paid: number;
  drafts: number;
  currentMonthRevenueCents: number;
}

export async function getInvoiceStats(): Promise<InvoiceStats> {
  const sql = await db();
  if (!sql) {
    return { open: 0, overdue: 0, paid: 0, drafts: 0, currentMonthRevenueCents: 0 };
  }
  const [row] = await sql<
    {
      open: string;
      overdue: string;
      paid: string;
      drafts: string;
      revenue: string;
    }[]
  >`
    SELECT
      COUNT(*) FILTER (WHERE status IN ('finalized','sent','overdue','partially_paid')) AS open,
      COUNT(*) FILTER (WHERE due_date < CURRENT_DATE
                        AND status IN ('finalized','sent','partially_paid','overdue')) AS overdue,
      COUNT(*) FILTER (WHERE status = 'paid') AS paid,
      COUNT(*) FILTER (WHERE status IN ('draft','ready_for_review')) AS drafts,
      COALESCE(SUM(totals_gross_cents) FILTER (
        WHERE finalized_at >= date_trunc('month', CURRENT_DATE)
      ), 0) AS revenue
    FROM invoices
  `;
  return {
    open: Number(row?.open ?? 0),
    overdue: Number(row?.overdue ?? 0),
    paid: Number(row?.paid ?? 0),
    drafts: Number(row?.drafts ?? 0),
    currentMonthRevenueCents: Number(row?.revenue ?? 0),
  };
}

/* ── Ein Beleg als Domain-Objekt ───────────────────────────────────── */

function itemRowToItem(row: InvoiceItemRow): InvoiceItem {
  const quantityMilli = Number(row.quantity_milli);
  const unitPriceCents = Number(row.unit_price_cents);
  return {
    id: row.id,
    position: row.position,
    title: row.title,
    description: row.description,
    quantityMilli,
    unit: row.unit,
    unitPriceCents,
    discountPercentMilli: row.discount_percent_milli,
    taxCategory: row.tax_category as TaxCategory,
    taxRatePercentMilli: row.tax_rate_percent_milli,
    lineNetCents: Number(row.line_net_cents),
    lineTaxCents: Number(row.line_tax_cents),
    lineGrossCents: Number(row.line_gross_cents),
  };
}

async function loadItems(tx: Tx, invoiceId: string): Promise<InvoiceItem[]> {
  const rows = await tx<InvoiceItemRow[]>`
    SELECT id, invoice_id, position, title, description, quantity_milli,
           unit, unit_price_cents, discount_percent_milli, tax_category,
           tax_rate_percent_milli, line_net_cents, line_tax_cents, line_gross_cents
    FROM invoice_items WHERE invoice_id = ${invoiceId}
    ORDER BY position ASC
  `;
  return rows.map(itemRowToItem);
}

async function loadItemsSql(invoiceId: string): Promise<InvoiceItem[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<InvoiceItemRow[]>`
    SELECT id, invoice_id, position, title, description, quantity_milli,
           unit, unit_price_cents, discount_percent_milli, tax_category,
           tax_rate_percent_milli, line_net_cents, line_tax_cents, line_gross_cents
    FROM invoice_items WHERE invoice_id = ${invoiceId}
    ORDER BY position ASC
  `;
  return rows.map(itemRowToItem);
}

/**
 * Beim historischen Import wurde der Issuer-Snapshot mit `to_jsonb(i)`
 * gespeichert — d.h. mit Postgres-Spaltennamen im Snake-Case. Die restliche
 * Codebasis erwartet aber die Domain-Struktur (`brandLabel`, `taxRegime`,
 * `smallBusinessNote`, …). Ohne diese Normalisierung greift der Renderer auf
 * `undefined`-Werte zu und die Vorschau bricht mit `preview_failed` ab.
 *
 * Wir akzeptieren beide Formate und liefern einen sauber typisierten Snapshot
 * zurück; unbekannte Zusatzfelder werden verworfen.
 */
function normalizeIssuerSnapshot(raw: unknown): IssuerSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const g = <T>(...keys: string[]): T | undefined => {
    for (const key of keys) {
      const v = r[key];
      if (v !== undefined && v !== null) return v as T;
    }
    return undefined;
  };
  const address = g<Record<string, unknown>>("address") ?? {};
  const contact = g<Record<string, unknown>>("contact") ?? {};
  const bank = g<Record<string, unknown>>("bank") ?? {};
  return {
    key: g<string>("key") ?? "",
    brandLabel: g<string>("brandLabel", "brand_label") ?? "",
    legalName: g<string>("legalName", "legal_name") ?? "",
    owner: g<string>("owner") ?? "",
    headerTagline: g<string>("headerTagline", "header_tagline") ?? "",
    address: {
      line1: (address.line1 as string) ?? "",
      line2: (address.line2 as string | null | undefined) ?? null,
      postalCode: (address.postalCode as string) ?? (address.postal_code as string) ?? "",
      city: (address.city as string) ?? "",
      country: (address.country as string) ?? "DE",
      countryLabel: (address.countryLabel as string | undefined) ?? (address.country_label as string | undefined),
    },
    contact: {
      email: (contact.email as string) ?? "",
      phone: (contact.phone as string | null | undefined) ?? null,
      mobile: (contact.mobile as string | null | undefined) ?? null,
      website: (contact.website as string | null | undefined) ?? null,
    },
    taxNumber: g<string | null>("taxNumber", "tax_number") ?? null,
    vatId: g<string | null>("vatId", "vat_id") ?? null,
    taxRegime: (g<string>("taxRegime", "tax_regime") as IssuerSnapshot["taxRegime"]) ?? "regelbesteuerung",
    smallBusinessNote: g<string>("smallBusinessNote", "small_business_note") ?? "",
    bank: {
      bankName: (bank.bankName as string) ?? (bank.bank_name as string) ?? "",
      iban: (bank.iban as string) ?? "",
      bic: (bank.bic as string) ?? "",
    },
    defaultCurrency: g<string>("defaultCurrency", "default_currency") ?? "EUR",
    defaultPaymentTerms: Number(g<number | string>("defaultPaymentTerms", "default_payment_terms") ?? 14),
    defaultIntro: g<string>("defaultIntro", "default_intro") ?? "",
    defaultOutro: g<string>("defaultOutro", "default_outro") ?? "",
    defaultFooter: g<string>("defaultFooter", "default_footer") ?? "",
    accentColor: g<string>("accentColor", "accent_color") ?? "#1F6DD8",
    logoPath: g<string | null>("logoPath", "logo_path") ?? null,
    templateKey: g<string>("templateKey", "template_key") ?? "agiworks_classic",
    numberFormat: g<string>("numberFormat", "number_format") ?? "numeric",
    numberPrefix: g<string>("numberPrefix", "number_prefix") ?? "",
    numberPadding: Number(g<number | string>("numberPadding", "number_padding") ?? 0),
  };
}

function normalizeCustomerSnapshot(raw: unknown): CustomerSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const address = (r.address as Record<string, unknown>) ?? {};
  return {
    id: (r.id as string | null | undefined) ?? null,
    name: (r.name as string) ?? "",
    contactPerson: (r.contactPerson as string | null | undefined) ?? (r.contact_person as string | null | undefined) ?? null,
    address: {
      line1: (address.line1 as string) ?? "",
      line2: (address.line2 as string | null | undefined) ?? null,
      postalCode: (address.postalCode as string) ?? (address.postal_code as string) ?? "",
      city: (address.city as string) ?? "",
      country: (address.country as string) ?? "DE",
      countryLabel: (address.countryLabel as string | undefined) ?? (address.country_label as string | undefined),
    },
    email: (r.email as string | null | undefined) ?? null,
    buyerReference: (r.buyerReference as string | null | undefined) ?? (r.buyer_reference as string | null | undefined) ?? null,
    leitwegId: (r.leitwegId as string | null | undefined) ?? (r.leitweg_id as string | null | undefined) ?? null,
    vatId: (r.vatId as string | null | undefined) ?? (r.vat_id as string | null | undefined) ?? null,
    customerNumber: (r.customerNumber as string | null | undefined) ?? (r.customer_number as string | null | undefined) ?? null,
  };
}

function rowToInvoice(
  row: InvoiceJoinRow,
  items: InvoiceItem[],
  liveIssuer?: IssuerSnapshot | null,
  liveCustomer?: CustomerSnapshot | null
): InvoiceDomain {
  const issuerSnapshot = normalizeIssuerSnapshot(row.issuer_snapshot);
  const customerSnapshot = normalizeCustomerSnapshot(row.customer_snapshot);
  const paymentSnapshot = row.payment_snapshot as InvoicePaymentInfo | null;
  const isSnapshot = !!issuerSnapshot && !!customerSnapshot;

  // Finalisierte Rechnungen: bevorzugt den (jetzt normalisierten) Snapshot.
  // Drafts: nutzen die aktuellen Stammdaten aus dem Live-Issuer.
  const issuer: IssuerSnapshot | undefined = issuerSnapshot ?? liveIssuer ?? undefined;
  const currency = row.currency;

  const totals: InvoiceTotals = {
    netCents: Number(row.totals_net_cents),
    taxCents: Number(row.totals_tax_cents),
    grossCents: Number(row.totals_gross_cents),
    currency,
    taxBreakdown: Array.isArray(row.tax_breakdown)
      ? (row.tax_breakdown as InvoiceTotals["taxBreakdown"])
      : [],
  };

  const texts: InvoiceTexts = {
    salutation: row.salutation,
    intro: row.intro_text,
    outro: row.outro_text,
    customerNote: row.customer_note,
    internalNote: row.internal_note,
    smallBusinessNote: row.small_business_note,
  };

  const references: InvoiceReferences = {
    buyerReference: row.buyer_reference,
    leitwegId: row.leitweg_id,
    purchaseOrder: row.purchase_order,
    originalInvoiceId: row.original_invoice_id,
    originalInvoiceNumber: row.original_invoice_number,
    correctionReason: row.correction_reason,
  };

  const payment: InvoicePaymentInfo = paymentSnapshot ?? {
    bank: issuer?.bank ?? { bankName: "", iban: "", bic: "" },
    paymentReference: row.payment_reference,
    paymentTermsDays: row.payment_terms_days,
  };

  const customer: CustomerRef =
    customerSnapshot ??
    liveCustomer ?? {
      id: row.customer_id,
      name: row.customer_name || "",
      address: { line1: "", postalCode: "", city: "", country: "DE" },
    };

  const project: ProjectRef | null = row.project_id
    ? {
        id: row.project_id,
        slug: row.project_slug,
        name: row.project_name ?? "",
        color: row.project_color,
      }
    : null;

  return {
    id: row.id,
    status: row.status as InvoiceStatus,
    type: row.type as InvoiceType,
    invoiceNumber: row.invoice_number,
    numericNumber: row.numeric_number,
    issuer: (issuer as IssuerSnapshot) ?? {
      // Sicherheitsnetz: sollte für finalisierte Belege nie greifen.
      key: "unknown",
      brandLabel: "Unbekannter Aussteller",
      legalName: "",
      owner: "",
      headerTagline: "",
      address: { line1: "", postalCode: "", city: "", country: "DE" },
      contact: { email: "" },
      taxNumber: null,
      vatId: null,
      taxRegime: "regelbesteuerung",
      smallBusinessNote: "",
      bank: { bankName: "", iban: "", bic: "" },
      defaultCurrency: "EUR",
      defaultPaymentTerms: 14,
      defaultIntro: "",
      defaultOutro: "",
      defaultFooter: "",
      accentColor: "#1F6DD8",
      logoPath: null,
      templateKey: "agiworks_classic",
      numberFormat: "numeric",
      numberPrefix: "",
      numberPadding: 0,
    },
    customer,
    project,
    invoiceDate: row.invoice_date.toISOString().slice(0, 10),
    dueDate: row.due_date.toISOString().slice(0, 10),
    servicePeriod: buildPeriod(
      row.service_period_start.toISOString().slice(0, 10),
      row.service_period_end.toISOString().slice(0, 10)
    ),
    currency,
    items,
    texts,
    payment,
    references,
    totals,
    templateKey: row.template_key,
    isSnapshot,
  };
}

async function loadInvoiceRow(id: string): Promise<InvoiceJoinRow | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<InvoiceJoinRow[]>`
    ${sql.unsafe(INVOICE_SELECT)}
    WHERE i.id = ${id}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

export async function getInvoice(id: string): Promise<InvoiceDomain | null> {
  const row = await loadInvoiceRow(id);
  if (!row) return null;
  const items = await loadItemsSql(id);

  // Fallback-Stammdaten für Drafts (der Snapshot wird erst bei der Finalisierung
  // eingefroren). So kann die Live-Vorschau ohne Datenverlust rendern.
  let liveIssuer: IssuerSnapshot | null = null;
  let liveCustomer: CustomerSnapshot | null = null;
  try {
    const iss = await getIssuer(row.issuer_id);
    if (iss) liveIssuer = toIssuerSnapshot(iss);
  } catch {
    // best-effort
  }
  if (row.customer_id) {
    try {
      const cust = await getCustomer(row.customer_id);
      if (cust) {
        liveCustomer = {
          id: cust.id,
          name: cust.name,
          contactPerson: cust.contactPerson ?? null,
          address: cust.address,
          email: cust.email ?? null,
          buyerReference: cust.buyerReference ?? null,
          leitwegId: cust.leitwegId ?? null,
          vatId: cust.vatId ?? null,
          customerNumber: cust.customerNumber ?? null,
        };
      }
    } catch {
      // best-effort
    }
  }
  return rowToInvoice(row, items, liveIssuer, liveCustomer);
}

/* ── Draft anlegen ──────────────────────────────────────────────────── */

export interface CreateInvoiceInput {
  issuerId: string;
  customerId?: string | null;
  projectId?: string | null;
  type?: InvoiceType;
  invoiceDate?: string;
  dueDate?: string;
  servicePeriod?: { start: string; end: string };
  currency?: string;
  paymentTermsDays?: number;
  texts?: InvoiceTexts;
  references?: InvoiceReferences;
  items: InvoiceItemInput[];
  templateKey?: string;
}

function draftId(): string {
  return `inv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export async function createInvoiceDraft(
  input: CreateInvoiceInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<InvoiceDomain | null> {
  const sql = await db();
  if (!sql) return null;

  if (!input.items?.length) {
    throw new InvoiceError("Mindestens eine Position ist erforderlich.");
  }

  const id = draftId();
  const type = input.type ?? "invoice";
  if (!INVOICE_TYPES.includes(type)) throw new InvoiceError("Unbekannte Rechnungsart.");

  await sql.begin(async (tx) => {
    const issuer = await getIssuerTx(tx, input.issuerId);
    if (!issuer) throw new InvoiceError("Aussteller nicht gefunden.", "not_found");

    const customer = input.customerId ? await getCustomerTx(tx, input.customerId) : null;
    const currency = input.currency ?? issuer.defaultCurrency;

    const invoiceDate = input.invoiceDate ?? todayIso();
    const paymentTerms = input.paymentTermsDays ?? issuer.defaultPaymentTerms;
    const dueDate = input.dueDate ?? addDays(invoiceDate, paymentTerms);
    const period = input.servicePeriod
      ? buildPeriod(input.servicePeriod.start, input.servicePeriod.end)
      : buildPeriod(invoiceDate, invoiceDate);

    // Steuerkategorie ergänzen, falls Vorlage nur reine Werte übergibt.
    const treatment = defaultTaxTreatment(issuer);
    const items = buildItems(
      input.items.map((it) => ({
        ...it,
        taxCategory: it.taxCategory ?? treatment.category,
        taxRatePercentMilli:
          it.taxRatePercentMilli ?? treatment.ratePercentMilli,
      }))
    );

    const totals = computeTotals(items, currency, {
      exemptions: exemptionsForIssuer(issuer),
    });

    await tx`
      INSERT INTO invoices (
        id, status, type, issuer_id, customer_id, project_id,
        invoice_date, due_date,
        service_period_start, service_period_end, service_period_label,
        currency, payment_terms_days,
        totals_net_cents, totals_tax_cents, totals_gross_cents, tax_breakdown,
        salutation, intro_text, outro_text, customer_note, internal_note,
        small_business_note,
        buyer_reference, leitweg_id, purchase_order,
        original_invoice_id, original_invoice_number, correction_reason,
        template_key,
        version, created_by, updated_by
      ) VALUES (
        ${id}, 'draft', ${type}, ${input.issuerId}, ${input.customerId ?? null},
        ${input.projectId ?? null},
        ${invoiceDate}::date, ${dueDate}::date,
        ${period.start}::date, ${period.end}::date, ${period.label},
        ${currency}, ${paymentTerms},
        ${totals.netCents}, ${totals.taxCents}, ${totals.grossCents},
        ${JSON.stringify(totals.taxBreakdown)}::jsonb,
        ${input.texts?.salutation ?? ""}, ${input.texts?.intro ?? issuer.defaultIntro},
        ${input.texts?.outro ?? issuer.defaultOutro},
        ${input.texts?.customerNote ?? ""}, ${input.texts?.internalNote ?? ""},
        ${issuer.taxRegime === "kleinunternehmer" ? issuer.smallBusinessNote : ""},
        ${input.references?.buyerReference ?? customer?.buyerReference ?? null},
        ${input.references?.leitwegId ?? customer?.leitwegId ?? null},
        ${input.references?.purchaseOrder ?? null},
        ${input.references?.originalInvoiceId ?? null},
        ${input.references?.originalInvoiceNumber ?? null},
        ${input.references?.correctionReason ?? null},
        ${input.templateKey ?? issuer.templateKey},
        0, ${actor.id}, ${actor.id}
      )
    `;

    for (const item of items) {
      await insertItem(tx, id, item);
    }

    await writeAuditTx(tx, {
      actor,
      action: "billing.invoice.draft_created",
      entityType: "invoice",
      entityId: id,
      after: {
        issuerId: input.issuerId,
        customerId: input.customerId ?? null,
        projectId: input.projectId ?? null,
      },
      ...meta,
    });
  });

  return getInvoice(id);
}

async function insertItem(tx: Tx, invoiceId: string, item: InvoiceItem): Promise<void> {
  await tx`
    INSERT INTO invoice_items (
      id, invoice_id, position, title, description,
      quantity_milli, unit, unit_price_cents,
      discount_percent_milli, tax_category, tax_rate_percent_milli,
      line_net_cents, line_tax_cents, line_gross_cents
    ) VALUES (
      ${`itm_${invoiceId.slice(4)}_${item.position}_${Math.random().toString(36).slice(2, 6)}`},
      ${invoiceId}, ${item.position}, ${item.title}, ${item.description ?? ""},
      ${item.quantityMilli}, ${item.unit}, ${item.unitPriceCents},
      ${item.discountPercentMilli}, ${item.taxCategory}, ${item.taxRatePercentMilli},
      ${item.lineNetCents}, ${item.lineTaxCents}, ${item.lineGrossCents}
    )
  `;
}

/* ── Draft aktualisieren ────────────────────────────────────────────── */

export interface UpdateInvoiceInput {
  version: number;
  customerId?: string | null;
  projectId?: string | null;
  invoiceDate?: string;
  dueDate?: string;
  servicePeriod?: { start: string; end: string };
  currency?: string;
  paymentTermsDays?: number;
  texts?: InvoiceTexts;
  references?: InvoiceReferences;
  items?: InvoiceItemInput[];
}

export async function updateInvoiceDraft(
  id: string,
  input: UpdateInvoiceInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<InvoiceDomain | null> {
  const sql = await db();
  if (!sql) return null;

  await sql.begin(async (tx) => {
    const [row] = await tx<InvoiceRow[]>`
      SELECT * FROM invoices WHERE id = ${id} FOR UPDATE
    `;
    if (!row) throw new InvoiceError("Rechnung nicht gefunden.", "not_found");
    if (row.status !== "draft" && row.status !== "ready_for_review") {
      throw new InvoiceError(
        "Finalisierte Rechnungen dürfen nicht mehr verändert werden. Nutzen Sie eine Korrektur.",
        "not_editable"
      );
    }
    if (row.version !== input.version) {
      throw new InvoiceError(
        "Die Rechnung wurde zwischenzeitlich verändert. Bitte neu laden.",
        "concurrent_finalize"
      );
    }

    const issuer = await getIssuerTx(tx, row.issuer_id);
    if (!issuer) throw new InvoiceError("Aussteller nicht gefunden.", "not_found");

    const invoiceDate = input.invoiceDate ?? row.invoice_date.toISOString().slice(0, 10);
    const paymentTerms = input.paymentTermsDays ?? row.payment_terms_days;
    const dueDate = input.dueDate ?? addDays(invoiceDate, paymentTerms);
    const period = input.servicePeriod
      ? buildPeriod(input.servicePeriod.start, input.servicePeriod.end)
      : buildPeriod(
          row.service_period_start.toISOString().slice(0, 10),
          row.service_period_end.toISOString().slice(0, 10)
        );
    const currency = input.currency ?? row.currency;

    let items: InvoiceItem[];
    if (input.items) {
      if (input.items.length === 0) {
        throw new InvoiceError("Mindestens eine Position ist erforderlich.");
      }
      items = buildItems(input.items);
      await tx`DELETE FROM invoice_items WHERE invoice_id = ${id}`;
      for (const item of items) await insertItem(tx, id, item);
    } else {
      items = await loadItems(tx, id);
    }
    const totals = computeTotals(items, currency, {
      exemptions: exemptionsForIssuer(issuer),
    });

    await tx`
      UPDATE invoices SET
        customer_id           = ${input.customerId === undefined ? sql`customer_id` : input.customerId},
        project_id            = ${input.projectId === undefined ? sql`project_id` : input.projectId},
        invoice_date          = ${invoiceDate}::date,
        due_date              = ${dueDate}::date,
        service_period_start  = ${period.start}::date,
        service_period_end    = ${period.end}::date,
        service_period_label  = ${period.label},
        currency              = ${currency},
        payment_terms_days    = ${paymentTerms},
        totals_net_cents      = ${totals.netCents},
        totals_tax_cents      = ${totals.taxCents},
        totals_gross_cents    = ${totals.grossCents},
        tax_breakdown         = ${JSON.stringify(totals.taxBreakdown)}::jsonb,
        salutation            = COALESCE(${input.texts?.salutation ?? null}, salutation),
        intro_text            = COALESCE(${input.texts?.intro ?? null}, intro_text),
        outro_text            = COALESCE(${input.texts?.outro ?? null}, outro_text),
        customer_note         = COALESCE(${input.texts?.customerNote ?? null}, customer_note),
        internal_note         = COALESCE(${input.texts?.internalNote ?? null}, internal_note),
        buyer_reference       = ${input.references?.buyerReference === undefined ? sql`buyer_reference` : input.references.buyerReference},
        leitweg_id            = ${input.references?.leitwegId === undefined ? sql`leitweg_id` : input.references.leitwegId},
        purchase_order        = ${input.references?.purchaseOrder === undefined ? sql`purchase_order` : input.references.purchaseOrder},
        updated_by            = ${actor.id},
        updated_at            = NOW(),
        version               = version + 1
      WHERE id = ${id}
    `;

    await writeAuditTx(tx, {
      actor,
      action: "billing.invoice.draft_updated",
      entityType: "invoice",
      entityId: id,
      after: { grossCents: totals.grossCents },
      ...meta,
    });
  });

  return getInvoice(id);
}

/* ── Finalisieren ───────────────────────────────────────────────────── */

/**
 * Prüft und finalisiert einen Draft.
 *
 * Kern der Operation ist die atomare Nummernvergabe:
 *   SELECT last_number … FOR UPDATE
 *   UPDATE invoice_sequences SET last_number = last_number + 1
 * innerhalb einer Transaktion. Damit können zwei parallele Requests
 * niemals dieselbe Nummer erhalten — der zweite wartet, bekommt den neuen
 * Stand und weiter geht es mit last+1.
 *
 * `expectedVersion` sichert zusätzlich gegen doppelte Klicks aus derselben
 * Oberfläche: der zweite Klick findet die Version bereits erhöht vor und
 * bricht ab.
 */
export interface FinalizeResult {
  invoice: InvoiceDomain;
  numericNumber: number;
  invoiceNumber: string;
}

export async function finalizeInvoice(
  id: string,
  expectedVersion: number,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<FinalizeResult> {
  const sql = await db();
  if (!sql) throw new InvoiceError("Datenbank nicht verfügbar.", "sequence_conflict");

  let numericNumber = 0;
  let invoiceNumber = "";

  await sql.begin(async (tx) => {
    const [row] = await tx<InvoiceRow[]>`
      SELECT * FROM invoices WHERE id = ${id} FOR UPDATE
    `;
    if (!row) throw new InvoiceError("Rechnung nicht gefunden.", "not_found");
    if (row.status !== "draft" && row.status !== "ready_for_review") {
      throw new InvoiceError(
        "Diese Rechnung wurde bereits finalisiert.",
        "not_editable"
      );
    }
    if (row.version !== expectedVersion) {
      throw new InvoiceError(
        "Die Rechnung wurde zwischenzeitlich verändert. Bitte neu laden.",
        "concurrent_finalize"
      );
    }

    const items = await loadItems(tx, id);
    if (items.length === 0) {
      throw new InvoiceError("Mindestens eine Position ist erforderlich.");
    }

    const issuer = await getIssuerTx(tx, row.issuer_id);
    if (!issuer) throw new InvoiceError("Aussteller nicht gefunden.", "not_found");
    if (issuer.taxRegime === "regelbesteuerung" && !issuer.taxNumber && !issuer.vatId) {
      throw new InvoiceError(
        "Für die Regelbesteuerung muss Steuernummer oder USt-IdNr. im Aussteller hinterlegt sein."
      );
    }

    const customer = row.customer_id ? await getCustomerTx(tx, row.customer_id) : null;
    if (!customer) throw new InvoiceError("Kunde ist verpflichtend.");
    if (!customer.address.line1 || !customer.address.city || !customer.address.postalCode) {
      throw new InvoiceError("Kundenadresse muss vollständig sein (Straße, PLZ, Ort).");
    }

    // Duplikat auf Anwendungsebene, zusätzlich zum partiellen Unique-Index.
    if (row.project_id) {
      const [dupe] = await tx<{ id: string; invoice_number: string | null }[]>`
        SELECT id, invoice_number FROM invoices
        WHERE issuer_id = ${row.issuer_id}
          AND project_id = ${row.project_id}
          AND type = ${row.type}
          AND service_period_start = ${row.service_period_start}
          AND service_period_end   = ${row.service_period_end}
          AND status IN ('finalized','sent','paid','partially_paid','overdue')
          AND id <> ${id}
        LIMIT 1
      `;
      if (dupe) {
        throw new InvoiceError(
          `Für dieses Projekt existiert bereits Rechnung ${dupe.invoice_number ?? "(ohne Nummer)"} im gleichen Leistungszeitraum.`,
          "duplicate_period"
        );
      }
    }

    // Atomare Nummernvergabe.
    const [seqExisting] = await tx<{ last_number: number }[]>`
      SELECT last_number FROM invoice_sequences
      WHERE issuer_id = ${row.issuer_id} AND year = 0
      FOR UPDATE
    `;
    const nextNumber = (seqExisting?.last_number ?? 0) + 1;
    if (seqExisting) {
      await tx`
        UPDATE invoice_sequences SET last_number = ${nextNumber}
        WHERE issuer_id = ${row.issuer_id} AND year = 0
      `;
    } else {
      await tx`
        INSERT INTO invoice_sequences (issuer_id, year, last_number)
        VALUES (${row.issuer_id}, 0, ${nextNumber})
      `;
    }

    const invoiceNumberFormatted = formatInvoiceNumber(
      nextNumber,
      issuer.numberPrefix,
      issuer.numberPadding
    );

    // Snapshots einfrieren.
    const issuerSnap = toIssuerSnapshot(issuer);
    const customerSnap: CustomerSnapshot = {
      id: customer.id,
      name: customer.name,
      contactPerson: customer.contactPerson,
      address: customer.address,
      email: customer.email,
      buyerReference: customer.buyerReference,
      leitwegId: customer.leitwegId,
      vatId: customer.vatId,
      customerNumber: customer.customerNumber,
    };
    const paymentSnap: InvoicePaymentInfo = {
      bank: issuer.bank,
      paymentReference: row.payment_reference,
      paymentTermsDays: row.payment_terms_days,
    };

    await tx`
      UPDATE invoices SET
        status                = 'finalized',
        invoice_number        = ${invoiceNumberFormatted},
        numeric_number        = ${nextNumber},
        sequence_year         = 0,
        issuer_snapshot       = ${JSON.stringify(issuerSnap)}::jsonb,
        customer_snapshot     = ${JSON.stringify(customerSnap)}::jsonb,
        payment_snapshot      = ${JSON.stringify(paymentSnap)}::jsonb,
        small_business_note   = ${issuer.taxRegime === "kleinunternehmer" ? issuer.smallBusinessNote : ""},
        version               = version + 1,
        finalized_at          = NOW(),
        updated_at            = NOW(),
        updated_by            = ${actor.id}
      WHERE id = ${id}
    `;

    await tx`
      INSERT INTO invoice_events (id, invoice_id, action, actor_id, actor_email, payload)
      VALUES (
        ${`evt_${id.slice(4)}_${Date.now().toString(36)}`}, ${id},
        'invoice.finalized', ${actor.id}, ${actor.email},
        ${JSON.stringify({ invoiceNumber: invoiceNumberFormatted, numeric: nextNumber })}::jsonb
      )
    `;

    await writeAuditTx(tx, {
      actor,
      action: "billing.invoice.finalized",
      entityType: "invoice",
      entityId: id,
      after: { invoiceNumber: invoiceNumberFormatted, numeric: nextNumber },
      ...meta,
    });

    numericNumber = nextNumber;
    invoiceNumber = invoiceNumberFormatted;

    // Update the project's billing schedule after successful finalization.
    if (row.project_id) {
      await tx`
        UPDATE project_billing_config
        SET last_billed_period_end = ${row.service_period_end},
            next_billing_date = (
              CASE
                WHEN billing_frequency = 'monthly'   THEN (${row.service_period_end}::date + INTERVAL '1 day')::date
                WHEN billing_frequency = 'quarterly' THEN (${row.service_period_end}::date + INTERVAL '1 day')::date
                WHEN billing_frequency = 'yearly'    THEN (${row.service_period_end}::date + INTERVAL '1 day')::date
                ELSE next_billing_date
              END
            ),
            updated_at = NOW()
        WHERE project_id = ${row.project_id}
      `;
    }
  });

  const invoice = await getInvoice(id);
  if (!invoice) throw new InvoiceError("Rechnung konnte nach Finalisierung nicht geladen werden.", "not_found");
  return { invoice, numericNumber, invoiceNumber };
}

export function formatInvoiceNumber(
  numeric: number,
  prefix: string,
  padding: number
): string {
  const base = padding > 0 ? String(numeric).padStart(padding, "0") : String(numeric);
  return prefix ? `${prefix}${base}` : base;
}

/* ── Bezahlung / Status ─────────────────────────────────────────────── */

export async function markPaid(
  id: string,
  actor: AuditActor,
  paidAtIso: string | null,
  reference: string | null,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<InvoiceDomain | null> {
  const sql = await db();
  if (!sql) return null;
  await sql.begin(async (tx) => {
    const [row] = await tx<InvoiceRow[]>`SELECT status FROM invoices WHERE id = ${id} FOR UPDATE`;
    if (!row) throw new InvoiceError("Rechnung nicht gefunden.", "not_found");
    if (!["finalized", "sent", "overdue", "partially_paid"].includes(row.status)) {
      throw new InvoiceError("Nur finalisierte Rechnungen können bezahlt werden.");
    }
    await tx`
      UPDATE invoices SET
        status = 'paid',
        payment_status = 'paid',
        paid_at = COALESCE(${paidAtIso ?? null}::timestamptz, NOW()),
        payment_reference = ${reference},
        updated_at = NOW(),
        updated_by = ${actor.id}
      WHERE id = ${id}
    `;
    await tx`
      INSERT INTO invoice_events (id, invoice_id, action, actor_id, actor_email, payload)
      VALUES (
        ${`evt_${id.slice(4)}_${Date.now().toString(36)}`}, ${id},
        'invoice.paid', ${actor.id}, ${actor.email},
        ${JSON.stringify({ reference })}::jsonb
      )
    `;
    await writeAuditTx(tx, {
      actor,
      action: "billing.invoice.paid",
      entityType: "invoice",
      entityId: id,
      after: { paidAt: paidAtIso, reference },
      ...meta,
    });
  });
  return getInvoice(id);
}

export async function cancelInvoice(
  id: string,
  actor: AuditActor,
  reason: string,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<InvoiceDomain | null> {
  const sql = await db();
  if (!sql) return null;
  await sql.begin(async (tx) => {
    const [row] = await tx<InvoiceRow[]>`SELECT status FROM invoices WHERE id = ${id} FOR UPDATE`;
    if (!row) throw new InvoiceError("Rechnung nicht gefunden.", "not_found");
    if (row.status === "cancelled") return;
    await tx`
      UPDATE invoices SET
        status = 'cancelled',
        cancelled_at = NOW(),
        updated_at = NOW(),
        updated_by = ${actor.id}
      WHERE id = ${id}
    `;
    await tx`
      INSERT INTO invoice_events (id, invoice_id, action, actor_id, actor_email, payload)
      VALUES (
        ${`evt_${id.slice(4)}_${Date.now().toString(36)}`}, ${id},
        'invoice.cancelled', ${actor.id}, ${actor.email},
        ${JSON.stringify({ reason })}::jsonb
      )
    `;
    await writeAuditTx(tx, {
      actor,
      action: "billing.invoice.cancelled",
      entityType: "invoice",
      entityId: id,
      after: { reason },
      ...meta,
    });
  });
  return getInvoice(id);
}

/* ── Draft löschen ──────────────────────────────────────────────────── */

export async function deleteDraft(
  id: string,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  let removed = false;
  await sql.begin(async (tx) => {
    const [row] = await tx<InvoiceRow[]>`SELECT status FROM invoices WHERE id = ${id} FOR UPDATE`;
    if (!row) throw new InvoiceError("Rechnung nicht gefunden.", "not_found");
    if (row.status !== "draft") {
      throw new InvoiceError("Nur Entwürfe können gelöscht werden.");
    }
    await tx`DELETE FROM invoices WHERE id = ${id}`;
    await writeAuditTx(tx, {
      actor,
      action: "billing.invoice.draft_deleted",
      entityType: "invoice",
      entityId: id,
      ...meta,
    });
    removed = true;
  });
  return removed;
}

/* ── Ereignisverlauf ────────────────────────────────────────────────── */

export interface InvoiceEvent {
  id: string;
  action: string;
  actorEmail: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export async function listInvoiceEvents(id: string): Promise<InvoiceEvent[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<
    { id: string; action: string; actor_email: string; payload: Record<string, unknown>; created_at: Date }[]
  >`
    SELECT id, action, actor_email, payload, created_at
    FROM invoice_events WHERE invoice_id = ${id}
    ORDER BY created_at DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    actorEmail: r.actor_email,
    payload: r.payload,
    createdAt: r.created_at.toISOString(),
  }));
}

/* ── Dokumente ──────────────────────────────────────────────────────── */

export interface InvoiceDocumentInfo {
  id: string;
  kind: string;
  mimeType: string;
  filename: string;
  byteSize: number;
  sha256: string;
  generator: string;
  generatorVersion: string;
  specVersion: string | null;
  templateVersion: string | null;
  validationStatus: string;
  validationReport: Record<string, unknown>;
  createdAt: string;
}

export async function listInvoiceDocuments(id: string): Promise<InvoiceDocumentInfo[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<
    {
      id: string; kind: string; mime_type: string; filename: string;
      byte_size: number; sha256: string; generator: string;
      generator_version: string; spec_version: string | null;
      template_version: string | null; validation_status: string;
      validation_report: Record<string, unknown>; created_at: Date;
    }[]
  >`
    SELECT id, kind, mime_type, filename, byte_size, sha256, generator,
           generator_version, spec_version, template_version,
           validation_status, validation_report, created_at
    FROM invoice_documents WHERE invoice_id = ${id}
    ORDER BY created_at ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    mimeType: r.mime_type,
    filename: r.filename,
    byteSize: Number(r.byte_size),
    sha256: r.sha256,
    generator: r.generator,
    generatorVersion: r.generator_version,
    specVersion: r.spec_version,
    templateVersion: r.template_version,
    validationStatus: r.validation_status,
    validationReport: r.validation_report ?? {},
    createdAt: r.created_at.toISOString(),
  }));
}

export async function loadInvoiceDocumentContent(
  documentId: string
): Promise<{ mimeType: string; filename: string; content: Buffer } | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<
    { mime_type: string; filename: string; content: Buffer }[]
  >`
    SELECT mime_type, filename, content
    FROM invoice_documents WHERE id = ${documentId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return {
    mimeType: rows[0].mime_type,
    filename: rows[0].filename,
    content: Buffer.isBuffer(rows[0].content) ? rows[0].content : Buffer.from(rows[0].content),
  };
}

export async function getInvoiceDocumentContent(
  invoiceId: string,
  documentId: string
): Promise<{ mimeType: string; filename: string; content: Buffer } | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<
    { mime_type: string; filename: string; content: Buffer }[]
  >`
    SELECT mime_type, filename, content
    FROM invoice_documents WHERE id = ${documentId} AND invoice_id = ${invoiceId}
    LIMIT 1
  `;
  if (!rows[0]) return null;
  return {
    mimeType: rows[0].mime_type,
    filename: rows[0].filename,
    content: Buffer.isBuffer(rows[0].content) ? rows[0].content : Buffer.from(rows[0].content),
  };
}

export async function storeInvoiceDocument(
  invoiceId: string,
  doc: Omit<InvoiceDocumentInfo, "id" | "createdAt"> & { content: Buffer }
): Promise<InvoiceDocumentInfo> {
  const sql = await db();
  if (!sql) throw new InvoiceError("Datenbank nicht verfügbar.");
  const id = `doc_${invoiceId.slice(4)}_${doc.kind}_${Date.now().toString(36)}`;
  await sql`
    INSERT INTO invoice_documents (
      id, invoice_id, kind, mime_type, filename, byte_size, sha256,
      generator, generator_version, spec_version, template_version,
      validation_status, validation_report, content
    ) VALUES (
      ${id}, ${invoiceId}, ${doc.kind}, ${doc.mimeType}, ${doc.filename},
      ${doc.byteSize}, ${doc.sha256}, ${doc.generator}, ${doc.generatorVersion},
      ${doc.specVersion}, ${doc.templateVersion},
      ${doc.validationStatus}, ${JSON.stringify(doc.validationReport)}::jsonb,
      ${doc.content}
    )
  `;
  return { id, createdAt: new Date().toISOString(), ...doc };
}

/* ── Zusatzhelfer für UI ────────────────────────────────────────────── */

export function isInvoiceStatus(value: string): value is InvoiceStatus {
  return (INVOICE_STATUSES as readonly string[]).includes(value);
}

export { formatDeDate };
