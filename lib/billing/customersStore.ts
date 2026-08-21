/**
 * Rechnungskunden.
 *
 * Diese Tabelle ergänzt das bestehende `crm_organizations`: Kunden brauchen
 * für die Rechnung mehr Felder (Anschrift, Buyer-Reference, Leitweg-ID,
 * USt-ID). Sie wird nicht mit dem CRM verschmolzen, um dort keine Pflicht-
 * Adresspflege zu erzeugen. Über `org_id` bleibt der Bezug bestehen.
 */

import { db } from "@/lib/pg";
import type { Tx } from "@/lib/db/migrationRunner";
import { writeAuditTx, type AuditActor } from "@/lib/audit/auditLog";
import type { CustomerRef, PostalAddress } from "./model";

interface CustomerRow {
  id: string;
  org_id: string | null;
  name: string;
  contact_person: string | null;
  address: PostalAddress;
  email: string | null;
  buyer_reference: string | null;
  leitweg_id: string | null;
  vat_id: string | null;
  customer_number: string | null;
  created_at: Date;
  updated_at: Date;
}

function rowToCustomer(row: CustomerRow): CustomerRef & { orgId: string | null; createdAt: string; updatedAt: string } {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    address: row.address,
    email: row.email,
    buyerReference: row.buyer_reference,
    leitwegId: row.leitweg_id,
    vatId: row.vat_id,
    customerNumber: row.customer_number,
    orgId: row.org_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export type BillingCustomer = ReturnType<typeof rowToCustomer>;

const CUSTOMER_SELECT = `
  SELECT id, org_id, name, contact_person, address, email,
         buyer_reference, leitweg_id, vat_id, customer_number,
         created_at, updated_at
  FROM billing_customers
`;

export async function listCustomers(search?: string): Promise<BillingCustomer[]> {
  const sql = await db();
  if (!sql) return [];
  const term = search?.trim() ? `%${search.trim().toLowerCase()}%` : null;
  const rows = await sql<CustomerRow[]>`
    ${sql.unsafe(CUSTOMER_SELECT)}
    WHERE ${term}::text IS NULL OR lower(name) LIKE ${term}
    ORDER BY name ASC
    LIMIT 200
  `;
  return rows.map(rowToCustomer);
}

export async function getCustomer(id: string): Promise<BillingCustomer | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<CustomerRow[]>`
    ${sql.unsafe(CUSTOMER_SELECT)}
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToCustomer(rows[0]) : null;
}

export async function getCustomerTx(tx: Tx, id: string): Promise<BillingCustomer | null> {
  const rows = await tx<CustomerRow[]>`
    ${tx.unsafe(CUSTOMER_SELECT)}
    WHERE id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowToCustomer(rows[0]) : null;
}

export interface CustomerInput {
  name: string;
  contactPerson?: string | null;
  address: PostalAddress;
  email?: string | null;
  buyerReference?: string | null;
  leitwegId?: string | null;
  vatId?: string | null;
  customerNumber?: string | null;
  orgId?: string | null;
}

function customerId(name: string): string {
  const slug = name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 8);
  return `cust_${slug || "unbenannt"}_${suffix}`;
}

export async function createCustomer(
  input: CustomerInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<BillingCustomer | null> {
  const sql = await db();
  if (!sql) return null;

  const name = input.name.trim();
  if (!name) throw new Error("Name darf nicht leer sein");
  if (!input.address?.line1 || !input.address?.city || !input.address?.postalCode) {
    throw new Error("Anschrift muss Straße, PLZ und Ort enthalten.");
  }

  const id = customerId(name);

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO billing_customers (
        id, org_id, name, contact_person, address, email,
        buyer_reference, leitweg_id, vat_id, customer_number
      ) VALUES (
        ${id}, ${input.orgId ?? null}, ${name}, ${input.contactPerson ?? null},
        ${JSON.stringify(input.address)}::jsonb, ${input.email ?? null},
        ${input.buyerReference ?? null}, ${input.leitwegId ?? null},
        ${input.vatId ?? null}, ${input.customerNumber ?? null}
      )
    `;
    await writeAuditTx(tx, {
      actor,
      action: "billing.customer.created",
      entityType: "billing_customer",
      entityId: id,
      after: { name },
      ...meta,
    });
  });

  return getCustomer(id);
}

export async function updateCustomer(
  id: string,
  input: Partial<CustomerInput>,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<BillingCustomer | null> {
  const sql = await db();
  if (!sql) return null;
  await sql.begin(async (tx) => {
    const current = await getCustomerTx(tx, id);
    if (!current) throw new Error("Kunde nicht gefunden");
    await tx`
      UPDATE billing_customers SET
        org_id          = ${input.orgId === undefined ? sql`org_id` : input.orgId},
        name            = COALESCE(${input.name?.trim() ?? null}, name),
        contact_person  = ${input.contactPerson === undefined ? sql`contact_person` : input.contactPerson},
        address         = COALESCE(${input.address ? JSON.stringify(input.address) : null}::jsonb, address),
        email           = ${input.email === undefined ? sql`email` : input.email},
        buyer_reference = ${input.buyerReference === undefined ? sql`buyer_reference` : input.buyerReference},
        leitweg_id      = ${input.leitwegId === undefined ? sql`leitweg_id` : input.leitwegId},
        vat_id          = ${input.vatId === undefined ? sql`vat_id` : input.vatId},
        customer_number = ${input.customerNumber === undefined ? sql`customer_number` : input.customerNumber},
        updated_at      = NOW()
      WHERE id = ${id}
    `;
    await writeAuditTx(tx, {
      actor,
      action: "billing.customer.updated",
      entityType: "billing_customer",
      entityId: id,
      before: current as unknown as Record<string, unknown>,
      after: input as Record<string, unknown>,
      ...meta,
    });
  });
  return getCustomer(id);
}
