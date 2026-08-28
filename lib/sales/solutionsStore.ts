/**
 * Vertriebsmodul — Solution Scope Snapshots.
 *
 * Der Solution Scope ist das Ergebnis des SOLUTION_SCOPE-Workflows plus
 * menschliche Verfeinerung. Er ist der ANGEBOTS-GATE: erst wenn er
 * freigegeben ist (`approved_at IS NOT NULL`), darf ein Angebot generiert
 * werden. Das Erzeugen eines Angebots kopiert den Scope-Snapshot in die
 * Proposal-Version und friert ihn dort ein.
 */

import { db } from "@/lib/pg";
import { SalesError, newId, type QualityGate } from "./model";

export interface SalesSolution {
  id: string;
  opportunityId: string;
  structured: Record<string, unknown>;
  challengeMode: Record<string, unknown>;
  qualityGate: QualityGate | null;
  qualityGateNote: string | null;
  runId: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

interface Row {
  id: string;
  opportunity_id: string;
  structured: Record<string, unknown> | null;
  challenge_mode: Record<string, unknown> | null;
  quality_gate: string | null;
  quality_gate_note: string | null;
  run_id: string | null;
  approved_at: Date | null;
  approved_by: string | null;
  approved_by_name: string | null;
  created_at: Date;
  updated_at: Date;
  version: number;
}

function rowTo(row: Row): SalesSolution {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    structured: row.structured ?? {},
    challengeMode: row.challenge_mode ?? {},
    qualityGate: (row.quality_gate as QualityGate | null) ?? null,
    qualityGateNote: row.quality_gate_note,
    runId: row.run_id,
    approvedAt: row.approved_at ? row.approved_at.toISOString() : null,
    approvedBy: row.approved_by,
    approvedByName: row.approved_by_name,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    version: row.version,
  };
}

const SELECT_COLUMNS = `
  s.id, s.opportunity_id, s.structured, s.challenge_mode,
  s.quality_gate, s.quality_gate_note, s.run_id,
  s.approved_at, s.approved_by, COALESCE(u.name, u.email) AS approved_by_name,
  s.created_at, s.updated_at, s.version
`;

export async function getLatestSolution(opportunityId: string): Promise<SalesSolution | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT ${sql.unsafe(SELECT_COLUMNS)}
    FROM sales_solutions s
    LEFT JOIN crm_users u ON u.id = s.approved_by
    WHERE s.opportunity_id = ${opportunityId}
    ORDER BY s.updated_at DESC
    LIMIT 1
  `;
  return rows[0] ? rowTo(rows[0]) : null;
}

export async function getSolution(id: string): Promise<SalesSolution | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT ${sql.unsafe(SELECT_COLUMNS)}
    FROM sales_solutions s
    LEFT JOIN crm_users u ON u.id = s.approved_by
    WHERE s.id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowTo(rows[0]) : null;
}

export interface UpsertSolutionInput {
  opportunityId: string;
  structured?: Record<string, unknown>;
  challengeMode?: Record<string, unknown>;
  qualityGate?: QualityGate | null;
  qualityGateNote?: string | null;
  runId?: string | null;
  updatedBy?: string | null;
}

export async function upsertSolution(input: UpsertSolutionInput): Promise<SalesSolution> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);

  const existing = await getLatestSolution(input.opportunityId);
  if (existing && !existing.approvedAt) {
    // Bestehenden Entwurf weiter pflegen — kein neuer Datensatz pro Bearbeitung.
    await sql`
      UPDATE sales_solutions SET
        structured        = ${input.structured === undefined ? sql`structured` : sql`${JSON.stringify(input.structured ?? {})}::jsonb`},
        challenge_mode    = ${input.challengeMode === undefined ? sql`challenge_mode` : sql`${JSON.stringify(input.challengeMode ?? {})}::jsonb`},
        quality_gate      = ${input.qualityGate === undefined ? sql`quality_gate` : input.qualityGate},
        quality_gate_note = ${input.qualityGateNote === undefined ? sql`quality_gate_note` : input.qualityGateNote},
        run_id            = ${input.runId === undefined ? sql`run_id` : input.runId},
        updated_by        = ${input.updatedBy ?? null},
        updated_at        = NOW(),
        version           = version + 1
      WHERE id = ${existing.id}
    `;
    const updated = await getSolution(existing.id);
    if (!updated) throw new SalesError("Solution nicht gefunden", "not_found", 404);
    return updated;
  }

  // Frischer Datensatz: entweder es gibt noch keinen ODER der letzte ist freigegeben
  // (dann startet dessen Nachfolger als neue Version).
  const id = newId("ssol");
  await sql`
    INSERT INTO sales_solutions (
      id, opportunity_id, structured, challenge_mode,
      quality_gate, quality_gate_note, run_id, updated_by, created_by
    ) VALUES (
      ${id}, ${input.opportunityId},
      ${JSON.stringify(input.structured ?? {})}::jsonb,
      ${JSON.stringify(input.challengeMode ?? {})}::jsonb,
      ${input.qualityGate ?? null}, ${input.qualityGateNote ?? null},
      ${input.runId ?? null}, ${input.updatedBy ?? null}, ${input.updatedBy ?? null}
    )
  `;
  const created = await getSolution(id);
  if (!created) throw new SalesError("Solution konnte nicht angelegt werden", "insert_failed", 500);
  return created;
}

export async function approveSolution(id: string, approverId: string | null): Promise<SalesSolution> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const rows = await sql`
    UPDATE sales_solutions
    SET approved_at = NOW(), approved_by = ${approverId}, updated_at = NOW()
    WHERE id = ${id} AND approved_at IS NULL
    RETURNING id
  `;
  if (rows.length === 0) {
    const existing = await getSolution(id);
    if (!existing) throw new SalesError("Solution nicht gefunden", "not_found", 404);
    return existing;
  }
  const result = await getSolution(id);
  if (!result) throw new SalesError("Solution nicht gefunden", "not_found", 404);
  return result;
}
