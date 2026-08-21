/**
 * Projektbezogenes Rechnungsprofil.
 *
 * Trennt die Frage „Welches Projekt wird als Nächstes abgerechnet?"
 * (Reihenfolge in der Billing Queue) von der Frage „Welche Nummer bekommt
 * die nächste Rechnung?" (Aussteller-Sequenz). Beide sind bewusst zwei
 * verschiedene Zahlen — dieselbe Reihenfolge wäre bei mehreren Ausstellern
 * unmittelbar Unsinn.
 */

import { db } from "@/lib/pg";
import { writeAuditTx, type AuditActor } from "@/lib/audit/auditLog";
import type { InvoiceItemInput } from "./model";
import type { BillingFrequency, ServicePeriodStrategy } from "./model";

export interface ProjectBillingConfig {
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
  servicePeriodStrategy: ServicePeriodStrategy;
  defaultItems: InvoiceItemInput[];
  defaultIntro: string | null;
  defaultOutro: string | null;
  billingOrder: number;
  lastBilledPeriodEnd: string | null;
  nextBillingDate: string | null;
  lastInvoiceId: string | null;
  lastInvoiceNumber: string | null;
  lastInvoicePeriodLabel: string | null;
  lastInvoiceStatus: string | null;
  updatedAt: string;
}

interface Row {
  project_id: string;
  project_name: string;
  project_color: string | null;
  project_slug: string;
  issuer_id: string | null;
  issuer_label: string | null;
  customer_id: string | null;
  customer_name: string | null;
  billing_enabled: boolean;
  billing_frequency: string;
  billing_day: number | null;
  billing_terms: number;
  default_currency: string;
  service_period_strategy: string;
  default_items: unknown;
  default_intro: string | null;
  default_outro: string | null;
  billing_order: number;
  last_billed_period_end: Date | null;
  next_billing_date: Date | null;
  updated_at: Date;
  last_invoice_id: string | null;
  last_invoice_number: string | null;
  last_invoice_period_label: string | null;
  last_invoice_status: string | null;
}

const QUERY = `
  SELECT
    p.id AS project_id, p.name AS project_name, p.color AS project_color, p.slug AS project_slug,
    b.issuer_id, iss.brand_label AS issuer_label,
    b.customer_id, cust.name AS customer_name,
    COALESCE(b.billing_enabled, TRUE)               AS billing_enabled,
    COALESCE(b.billing_frequency, 'monthly')        AS billing_frequency,
    b.billing_day,
    COALESCE(b.billing_terms, 14)                   AS billing_terms,
    COALESCE(b.default_currency, 'EUR')             AS default_currency,
    COALESCE(b.service_period_strategy, 'previous_month') AS service_period_strategy,
    COALESCE(b.default_items, '[]'::jsonb)          AS default_items,
    b.default_intro, b.default_outro,
    COALESCE(b.billing_order, p.sort_order)          AS billing_order,
    b.last_billed_period_end,
    b.next_billing_date,
    COALESCE(b.updated_at, p.updated_at)             AS updated_at,
    l.id AS last_invoice_id, l.invoice_number AS last_invoice_number,
    l.service_period_label AS last_invoice_period_label,
    l.status AS last_invoice_status
  FROM crm_projects p
  LEFT JOIN project_billing_config b ON b.project_id = p.id
  LEFT JOIN billing_issuers iss ON iss.id = b.issuer_id
  LEFT JOIN billing_customers cust ON cust.id = b.customer_id
  LEFT JOIN LATERAL (
    SELECT id, invoice_number, service_period_label, status
    FROM invoices
    WHERE project_id = p.id
    ORDER BY invoice_date DESC, created_at DESC
    LIMIT 1
  ) l ON TRUE
  WHERE p.deleted_at IS NULL
`;

function rowToConfig(r: Row): ProjectBillingConfig {
  const raw = Array.isArray(r.default_items) ? (r.default_items as unknown[]) : [];
  const items: InvoiceItemInput[] = raw.map((v) => v as InvoiceItemInput);
  return {
    projectId: r.project_id,
    projectName: r.project_name,
    projectColor: r.project_color,
    projectSlug: r.project_slug,
    issuerId: r.issuer_id,
    issuerLabel: r.issuer_label,
    customerId: r.customer_id,
    customerName: r.customer_name,
    billingEnabled: r.billing_enabled,
    billingFrequency: r.billing_frequency as BillingFrequency,
    billingDay: r.billing_day,
    billingTerms: Number(r.billing_terms ?? 14),
    defaultCurrency: r.default_currency,
    servicePeriodStrategy: r.service_period_strategy as ServicePeriodStrategy,
    defaultItems: items,
    defaultIntro: r.default_intro,
    defaultOutro: r.default_outro,
    billingOrder: Number(r.billing_order ?? 0),
    lastBilledPeriodEnd: r.last_billed_period_end?.toISOString().slice(0, 10) ?? null,
    nextBillingDate: r.next_billing_date?.toISOString().slice(0, 10) ?? null,
    lastInvoiceId: r.last_invoice_id,
    lastInvoiceNumber: r.last_invoice_number,
    lastInvoicePeriodLabel: r.last_invoice_period_label,
    lastInvoiceStatus: r.last_invoice_status,
    updatedAt: r.updated_at?.toISOString() ?? new Date().toISOString(),
  };
}

export async function listBillingQueue(): Promise<ProjectBillingConfig[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    ${sql.unsafe(QUERY)}
    ORDER BY billing_enabled DESC, billing_order ASC, p.name ASC
  `;
  return rows.map(rowToConfig);
}

export async function getBillingConfig(projectId: string): Promise<ProjectBillingConfig | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    ${sql.unsafe(QUERY)}
    AND p.id = ${projectId}
    LIMIT 1
  `;
  return rows[0] ? rowToConfig(rows[0]) : null;
}

export interface UpdateBillingConfigInput {
  issuerId?: string | null;
  customerId?: string | null;
  billingEnabled?: boolean;
  billingFrequency?: BillingFrequency;
  billingDay?: number | null;
  billingTerms?: number;
  defaultCurrency?: string;
  servicePeriodStrategy?: ServicePeriodStrategy;
  defaultItems?: InvoiceItemInput[];
  defaultIntro?: string | null;
  defaultOutro?: string | null;
}

export async function upsertBillingConfig(
  projectId: string,
  input: UpdateBillingConfigInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<ProjectBillingConfig | null> {
  const sql = await db();
  if (!sql) return null;

  await sql.begin(async (tx) => {
    const [existing] = await tx<{ project_id: string }[]>`
      SELECT project_id FROM project_billing_config WHERE project_id = ${projectId}
    `;

    if (existing) {
      await tx`
        UPDATE project_billing_config SET
          issuer_id               = ${input.issuerId === undefined ? sql`issuer_id` : input.issuerId},
          customer_id             = ${input.customerId === undefined ? sql`customer_id` : input.customerId},
          billing_enabled         = COALESCE(${input.billingEnabled ?? null}, billing_enabled),
          billing_frequency       = COALESCE(${input.billingFrequency ?? null}, billing_frequency),
          billing_day             = ${input.billingDay === undefined ? sql`billing_day` : input.billingDay},
          billing_terms           = COALESCE(${input.billingTerms ?? null}, billing_terms),
          default_currency        = COALESCE(${input.defaultCurrency ?? null}, default_currency),
          service_period_strategy = COALESCE(${input.servicePeriodStrategy ?? null}, service_period_strategy),
          default_items           = COALESCE(${input.defaultItems ? JSON.stringify(input.defaultItems) : null}::jsonb, default_items),
          default_intro           = ${input.defaultIntro === undefined ? sql`default_intro` : input.defaultIntro},
          default_outro           = ${input.defaultOutro === undefined ? sql`default_outro` : input.defaultOutro},
          updated_at              = NOW()
        WHERE project_id = ${projectId}
      `;
    } else {
      await tx`
        INSERT INTO project_billing_config (
          project_id, issuer_id, customer_id, billing_enabled, billing_frequency,
          billing_day, billing_terms, default_currency, service_period_strategy,
          default_items, default_intro, default_outro, billing_order
        ) VALUES (
          ${projectId}, ${input.issuerId ?? null}, ${input.customerId ?? null},
          ${input.billingEnabled ?? true}, ${input.billingFrequency ?? "monthly"},
          ${input.billingDay ?? null}, ${input.billingTerms ?? 14},
          ${input.defaultCurrency ?? "EUR"},
          ${input.servicePeriodStrategy ?? "previous_month"},
          ${JSON.stringify(input.defaultItems ?? [])}::jsonb,
          ${input.defaultIntro ?? null}, ${input.defaultOutro ?? null},
          COALESCE((SELECT MAX(billing_order) FROM project_billing_config), 0) + 10
        )
      `;
    }

    await writeAuditTx(tx, {
      actor,
      action: "billing.project_config.upserted",
      entityType: "project_billing_config",
      entityId: projectId,
      after: input as Record<string, unknown>,
      ...meta,
    });
  });

  return getBillingConfig(projectId);
}

export async function reorderBillingQueue(
  projectIds: string[],
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql.begin(async (tx) => {
    for (let i = 0; i < projectIds.length; i++) {
      const order = (i + 1) * 10;
      await tx`
        INSERT INTO project_billing_config (project_id, billing_order, updated_at)
        VALUES (${projectIds[i]}, ${order}, NOW())
        ON CONFLICT (project_id) DO UPDATE SET
          billing_order = EXCLUDED.billing_order,
          updated_at    = NOW()
      `;
    }
    await writeAuditTx(tx, {
      actor,
      action: "billing.queue.reordered",
      entityType: "billing_queue",
      entityId: "collection",
      after: { count: projectIds.length },
      ...meta,
    });
  });
}

/**
 * Wählt das Projekt aus, das als Nächstes abgerechnet werden soll.
 * Reihenfolge in der Billing Queue vor Wichtigkeit — deshalb nehmen wir das
 * aktivierte, kleinste `billing_order` und fallen erst dann auf das Datum
 * der zuletzt gestellten Rechnung zurück.
 */
export async function pickNextBillableProject(): Promise<ProjectBillingConfig | null> {
  const list = await listBillingQueue();
  return list.find((p) => p.billingEnabled && p.issuerId && p.customerId) ?? null;
}
