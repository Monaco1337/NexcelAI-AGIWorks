/**
 * Vertriebsmodul — Aktivitäts-Timeline.
 *
 * Die Aktivitäten sind die menschlich lesbare Chronik des Vorgangs.
 * Wahrheitsquelle für Compliance-Zwecke bleibt das bestehende `audit_log`;
 * `sales_activities` ist die kuratierte Sicht darauf, die das UI zeigt.
 */

import { db } from "@/lib/pg";
import { newId, type ActivityKind } from "./model";

export interface SalesActivity {
  id: string;
  entityType: "company" | "opportunity" | "contact" | "proposal";
  entityId: string;
  companyId: string | null;
  kind: ActivityKind;
  summary: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  occurredAt: string;
}

interface Row {
  id: string;
  entity_type: string;
  entity_id: string;
  company_id: string | null;
  kind: string;
  summary: string;
  payload: Record<string, unknown> | null;
  actor_id: string | null;
  actor_email: string | null;
  actor_name: string | null;
  occurred_at: Date;
}

function rowTo(row: Row): SalesActivity {
  return {
    id: row.id,
    entityType: row.entity_type as SalesActivity["entityType"],
    entityId: row.entity_id,
    companyId: row.company_id,
    kind: row.kind as ActivityKind,
    summary: row.summary,
    payload: row.payload ?? {},
    actorId: row.actor_id,
    actorEmail: row.actor_email,
    actorName: row.actor_name,
    occurredAt: row.occurred_at.toISOString(),
  };
}

export interface CreateActivityInput {
  entityType: SalesActivity["entityType"];
  entityId: string;
  companyId?: string | null;
  kind: ActivityKind;
  summary: string;
  payload?: Record<string, unknown>;
  actorId?: string | null;
  actorEmail?: string | null;
  occurredAt?: string;
}

export async function logActivity(input: CreateActivityInput): Promise<SalesActivity | null> {
  const sql = await db();
  if (!sql) return null;
  const id = newId("sact");
  await sql`
    INSERT INTO sales_activities (
      id, entity_type, entity_id, company_id, kind, summary, payload,
      actor_id, actor_email, occurred_at
    ) VALUES (
      ${id}, ${input.entityType}, ${input.entityId}, ${input.companyId ?? null},
      ${input.kind}, ${input.summary}, ${JSON.stringify(input.payload ?? {})}::jsonb,
      ${input.actorId ?? null}, ${input.actorEmail ?? null},
      ${input.occurredAt ?? new Date().toISOString()}
    )
  `;
  return {
    id,
    entityType: input.entityType,
    entityId: input.entityId,
    companyId: input.companyId ?? null,
    kind: input.kind,
    summary: input.summary,
    payload: input.payload ?? {},
    actorId: input.actorId ?? null,
    actorEmail: input.actorEmail ?? null,
    actorName: null,
    occurredAt: input.occurredAt ?? new Date().toISOString(),
  };
}

export async function listActivitiesForEntity(
  entityType: SalesActivity["entityType"],
  entityId: string,
  limit = 200
): Promise<SalesActivity[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT a.id, a.entity_type, a.entity_id, a.company_id, a.kind, a.summary,
           a.payload, a.actor_id, a.actor_email,
           COALESCE(u.name, u.email, a.actor_email) AS actor_name,
           a.occurred_at
    FROM sales_activities a
    LEFT JOIN crm_users u ON u.id = a.actor_id
    WHERE a.entity_type = ${entityType} AND a.entity_id = ${entityId}
    ORDER BY a.occurred_at DESC
    LIMIT ${Math.min(limit, 500)}
  `;
  return rows.map(rowTo);
}

export async function listActivitiesForCompany(
  companyId: string,
  limit = 200
): Promise<SalesActivity[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Row[]>`
    SELECT a.id, a.entity_type, a.entity_id, a.company_id, a.kind, a.summary,
           a.payload, a.actor_id, a.actor_email,
           COALESCE(u.name, u.email, a.actor_email) AS actor_name,
           a.occurred_at
    FROM sales_activities a
    LEFT JOIN crm_users u ON u.id = a.actor_id
    WHERE a.company_id = ${companyId}
    ORDER BY a.occurred_at DESC
    LIMIT ${Math.min(limit, 500)}
  `;
  return rows.map(rowTo);
}
