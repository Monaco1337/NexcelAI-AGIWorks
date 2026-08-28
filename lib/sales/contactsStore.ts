/**
 * Vertriebsmodul — Kontakte an einer Firma.
 */

import { db } from "@/lib/pg";
import { SalesError, newId, type ContactRole } from "./model";

export interface SalesContact {
  id: string;
  companyId: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  phone: string | null;
  email: string | null;
  role: ContactRole;
  isPrimary: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface Row {
  id: string;
  company_id: string;
  first_name: string | null;
  last_name: string | null;
  position: string | null;
  phone: string | null;
  email: string | null;
  role: string;
  is_primary: boolean;
  notes: string;
  created_at: Date;
  updated_at: Date;
}

function rowTo(row: Row): SalesContact {
  return {
    id: row.id,
    companyId: row.company_id,
    firstName: row.first_name,
    lastName: row.last_name,
    position: row.position,
    phone: row.phone,
    email: row.email,
    role: (row.role as ContactRole) ?? "unbekannt",
    isPrimary: row.is_primary,
    notes: row.notes ?? "",
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function listContacts(companyId: string): Promise<SalesContact[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT id, company_id, first_name, last_name, position, phone, email, role,
           is_primary, notes, created_at, updated_at
    FROM sales_contacts
    WHERE company_id = ${companyId} AND deleted_at IS NULL
    ORDER BY is_primary DESC, last_name ASC NULLS LAST, first_name ASC NULLS LAST
  `;
  return rows.map(rowTo);
}

export interface CreateContactInput {
  companyId: string;
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: ContactRole;
  isPrimary?: boolean;
  notes?: string;
  createdBy?: string | null;
}

export async function createContact(input: CreateContactInput): Promise<SalesContact> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newId("scont");

  await sql.begin(async (tx) => {
    if (input.isPrimary) {
      await tx`UPDATE sales_contacts SET is_primary = FALSE WHERE company_id = ${input.companyId}`;
    }
    await tx`
      INSERT INTO sales_contacts (
        id, company_id, first_name, last_name, position, phone, email, role,
        is_primary, notes, created_by, updated_by
      ) VALUES (
        ${id}, ${input.companyId}, ${input.firstName ?? null}, ${input.lastName ?? null},
        ${input.position ?? null}, ${input.phone ?? null}, ${input.email ?? null},
        ${input.role ?? "unbekannt"}, ${input.isPrimary ?? false}, ${input.notes ?? ""},
        ${input.createdBy ?? null}, ${input.createdBy ?? null}
      )
    `;
  });

  const list = await listContacts(input.companyId);
  const created = list.find((c) => c.id === id);
  if (!created) throw new SalesError("Kontakt konnte nicht angelegt werden", "insert_failed", 500);
  return created;
}

export interface UpdateContactInput {
  firstName?: string | null;
  lastName?: string | null;
  position?: string | null;
  phone?: string | null;
  email?: string | null;
  role?: ContactRole;
  isPrimary?: boolean;
  notes?: string;
  updatedBy?: string | null;
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<SalesContact> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const currentRows = await sql<{ company_id: string }[]>`
    SELECT company_id FROM sales_contacts WHERE id = ${id} AND deleted_at IS NULL LIMIT 1
  `;
  const current = currentRows[0];
  if (!current) throw new SalesError("Kontakt nicht gefunden", "not_found", 404);

  await sql.begin(async (tx) => {
    if (input.isPrimary === true) {
      await tx`UPDATE sales_contacts SET is_primary = FALSE WHERE company_id = ${current.company_id}`;
    }
    await tx`
      UPDATE sales_contacts SET
        first_name = ${input.firstName === undefined ? tx`first_name` : input.firstName},
        last_name  = ${input.lastName === undefined ? tx`last_name` : input.lastName},
        position   = ${input.position === undefined ? tx`position` : input.position},
        phone      = ${input.phone === undefined ? tx`phone` : input.phone},
        email      = ${input.email === undefined ? tx`email` : input.email},
        role       = COALESCE(${input.role ?? null}, role),
        is_primary = COALESCE(${input.isPrimary ?? null}, is_primary),
        notes      = COALESCE(${input.notes ?? null}, notes),
        updated_by = ${input.updatedBy ?? null},
        updated_at = NOW()
      WHERE id = ${id}
    `;
  });

  const list = await listContacts(current.company_id);
  const updated = list.find((c) => c.id === id);
  if (!updated) throw new SalesError("Kontakt nicht gefunden", "not_found", 404);
  return updated;
}

export async function deleteContact(id: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`UPDATE sales_contacts SET deleted_at = NOW() WHERE id = ${id} AND deleted_at IS NULL`;
}
