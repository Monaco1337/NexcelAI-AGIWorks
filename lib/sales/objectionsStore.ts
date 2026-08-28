/**
 * Vertriebsmodul — Einwände (Objections).
 *
 * Zu jeder Opportunity werden Einwände typisiert erfasst und
 * (idealerweise) mit einer Auflösung versehen. Nützlich für spätere
 * Playbook-Erweiterung.
 */

import { db } from "@/lib/pg";
import { SalesError, newId, type ObjectionType } from "./model";

export interface SalesObjection {
  id: string;
  opportunityId: string;
  type: ObjectionType;
  body: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  opportunity_id: string;
  type: string;
  body: string;
  resolution: string | null;
  resolved_at: Date | null;
  created_by: string | null;
  created_by_name: string | null;
  created_at: Date;
}

function rowTo(row: Row): SalesObjection {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    type: row.type as ObjectionType,
    body: row.body,
    resolution: row.resolution,
    resolvedAt: row.resolved_at ? row.resolved_at.toISOString() : null,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listObjections(opportunityId: string): Promise<SalesObjection[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT o.id, o.opportunity_id, o.type, o.body, o.resolution, o.resolved_at,
           o.created_by, COALESCE(u.name, u.email) AS created_by_name, o.created_at
    FROM sales_objections o
    LEFT JOIN crm_users u ON u.id = o.created_by
    WHERE o.opportunity_id = ${opportunityId}
    ORDER BY o.created_at DESC
  `;
  return rows.map(rowTo);
}

export interface CreateObjectionInput {
  opportunityId: string;
  type: ObjectionType;
  body: string;
  createdBy?: string | null;
}

export async function createObjection(input: CreateObjectionInput): Promise<SalesObjection> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newId("sobj");
  await sql`
    INSERT INTO sales_objections (id, opportunity_id, type, body, created_by)
    VALUES (${id}, ${input.opportunityId}, ${input.type}, ${input.body}, ${input.createdBy ?? null})
  `;
  const list = await listObjections(input.opportunityId);
  const created = list.find((o) => o.id === id);
  if (!created) throw new SalesError("Einwand konnte nicht angelegt werden", "insert_failed", 500);
  return created;
}

export async function resolveObjection(id: string, resolution: string): Promise<SalesObjection> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const rows = await sql<{ opportunity_id: string }[]>`
    UPDATE sales_objections
    SET resolution = ${resolution}, resolved_at = NOW()
    WHERE id = ${id}
    RETURNING opportunity_id
  `;
  if (rows.length === 0) throw new SalesError("Einwand nicht gefunden", "not_found", 404);
  const list = await listObjections(rows[0].opportunity_id);
  const found = list.find((o) => o.id === id);
  if (!found) throw new SalesError("Einwand nicht gefunden", "not_found", 404);
  return found;
}
