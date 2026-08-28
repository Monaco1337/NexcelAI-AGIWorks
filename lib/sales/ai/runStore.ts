/**
 * Persistiert AI-Runs (`sales_ai_runs`) — Input-Snapshot, Output, Modell,
 * Kosten, Reviewer, Status.
 *
 * Ein Run ist immer AUSFÜHRBAR: einmal geschrieben, ändert er sich nur
 * über explizite Review-Vorgänge (approve, reject, supersede).
 */

import { db } from "@/lib/pg";
import { SalesError, newId, type BrandContext } from "../model";
import type { SalesPromptKey } from "./promptSeeds";

export type RunBrand = BrandContext | "any";

export type RunStatus =
  | "QUEUED"
  | "PROCESSING"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED"
  | "FAILED";

export type RunEntity = "company" | "opportunity" | "lead_query";

export interface SalesAiRun {
  id: string;
  promptKey: SalesPromptKey;
  promptVersion: number;
  brandContext: RunBrand;
  entityType: RunEntity;
  entityId: string | null;
  status: RunStatus;
  inputSnapshot: Record<string, unknown>;
  output: Record<string, unknown> | null;
  outputText: string | null;
  model: string;
  temperature: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  provider: string;
  error: string | null;
  actorId: string | null;
  actorName: string | null;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

interface Row {
  id: string;
  prompt_key: string;
  prompt_version: number;
  brand_context: string;
  entity_type: string;
  entity_id: string | null;
  status: string;
  input_snapshot: Record<string, unknown>;
  output: Record<string, unknown> | null;
  output_text: string | null;
  model: string;
  temperature: string | null;
  tokens_in: number | null;
  tokens_out: number | null;
  provider: string;
  error: string | null;
  actor_id: string | null;
  actor_name: string | null;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewed_at: Date | null;
  review_note: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  created_at: Date;
}

function rowTo(row: Row): SalesAiRun {
  return {
    id: row.id,
    promptKey: row.prompt_key as SalesPromptKey,
    promptVersion: row.prompt_version,
    brandContext: row.brand_context as RunBrand,
    entityType: row.entity_type as RunEntity,
    entityId: row.entity_id,
    status: row.status as RunStatus,
    inputSnapshot: row.input_snapshot,
    output: row.output,
    outputText: row.output_text,
    model: row.model,
    temperature: row.temperature == null ? null : Number(row.temperature),
    tokensIn: row.tokens_in,
    tokensOut: row.tokens_out,
    provider: row.provider,
    error: row.error,
    actorId: row.actor_id,
    actorName: row.actor_name,
    reviewerId: row.reviewer_id,
    reviewerName: row.reviewer_name,
    reviewedAt: row.reviewed_at ? row.reviewed_at.toISOString() : null,
    reviewNote: row.review_note,
    startedAt: row.started_at ? row.started_at.toISOString() : null,
    finishedAt: row.finished_at ? row.finished_at.toISOString() : null,
    createdAt: row.created_at.toISOString(),
  };
}

const SELECT_COLUMNS = `
  r.id, r.prompt_key, r.prompt_version, r.brand_context,
  r.entity_type, r.entity_id, r.status, r.input_snapshot, r.output, r.output_text,
  r.model, r.temperature, r.tokens_in, r.tokens_out, r.provider, r.error,
  r.actor_id, COALESCE(ua.name, ua.email) AS actor_name,
  r.reviewer_id, COALESCE(ur.name, ur.email) AS reviewer_name,
  r.reviewed_at, r.review_note, r.started_at, r.finished_at, r.created_at
`;

const JOINS = `
  LEFT JOIN crm_users ua ON ua.id = r.actor_id
  LEFT JOIN crm_users ur ON ur.id = r.reviewer_id
`;

export interface CreateRunInput {
  promptKey: SalesPromptKey;
  promptVersion: number;
  brandContext: RunBrand;
  entityType: RunEntity;
  entityId?: string | null;
  inputSnapshot: Record<string, unknown>;
  model: string;
  temperature: number;
  actorId?: string | null;
  status?: RunStatus;
}

export async function createRun(input: CreateRunInput): Promise<SalesAiRun> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  const id = newId("srun");
  await sql`
    INSERT INTO sales_ai_runs (
      id, prompt_key, prompt_version, brand_context, entity_type, entity_id,
      status, input_snapshot, model, temperature, provider, actor_id, started_at
    ) VALUES (
      ${id}, ${input.promptKey}, ${input.promptVersion}, ${input.brandContext},
      ${input.entityType}, ${input.entityId ?? null},
      ${input.status ?? "PROCESSING"},
      ${JSON.stringify(input.inputSnapshot)}::jsonb,
      ${input.model}, ${input.temperature}, 'openai',
      ${input.actorId ?? null}, NOW()
    )
  `;
  const run = await getRun(id);
  if (!run) throw new SalesError("Run konnte nicht angelegt werden", "insert_failed", 500);
  return run;
}

export interface FinishRunInput {
  runId: string;
  status: RunStatus;
  output?: Record<string, unknown> | null;
  outputText?: string | null;
  tokensIn?: number | null;
  tokensOut?: number | null;
  provider?: string;
  error?: string | null;
}

export async function finishRun(input: FinishRunInput): Promise<SalesAiRun> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`
    UPDATE sales_ai_runs SET
      status      = ${input.status},
      output      = ${input.output === undefined ? sql`output` : sql`${JSON.stringify(input.output ?? null)}::jsonb`},
      output_text = ${input.outputText === undefined ? sql`output_text` : input.outputText},
      tokens_in   = ${input.tokensIn ?? null},
      tokens_out  = ${input.tokensOut ?? null},
      provider    = COALESCE(${input.provider ?? null}, provider),
      error       = ${input.error === undefined ? sql`error` : input.error},
      finished_at = NOW()
    WHERE id = ${input.runId}
  `;
  const run = await getRun(input.runId);
  if (!run) throw new SalesError("Run nicht gefunden", "not_found", 404);
  return run;
}

export async function getRun(id: string): Promise<SalesAiRun | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Row[]>`
    SELECT ${sql.unsafe(SELECT_COLUMNS)}
    FROM sales_ai_runs r
    ${sql.unsafe(JOINS)}
    WHERE r.id = ${id}
    LIMIT 1
  `;
  return rows[0] ? rowTo(rows[0]) : null;
}

export interface RunQuery {
  entityType?: RunEntity;
  entityId?: string;
  promptKey?: SalesPromptKey;
  status?: RunStatus[];
  limit?: number;
}

export async function listRuns(query: RunQuery = {}): Promise<SalesAiRun[]> {
  const sql = await db();
  if (!sql) return [];
  const limit = Math.min(query.limit ?? 50, 200);
  const status = query.status && query.status.length > 0 ? query.status : null;
  const rows = await sql<Row[]>`
    SELECT ${sql.unsafe(SELECT_COLUMNS)}
    FROM sales_ai_runs r
    ${sql.unsafe(JOINS)}
    WHERE (${query.entityType ?? null}::text IS NULL OR r.entity_type = ${query.entityType ?? null})
      AND (${query.entityId ?? null}::text IS NULL OR r.entity_id = ${query.entityId ?? null})
      AND (${query.promptKey ?? null}::text IS NULL OR r.prompt_key = ${query.promptKey ?? null})
      AND (${status}::text[] IS NULL OR r.status = ANY(${status}::text[]))
    ORDER BY r.created_at DESC
    LIMIT ${limit}
  `;
  return rows.map(rowTo);
}

export async function reviewRun(
  id: string,
  reviewerId: string | null,
  status: RunStatus,
  note?: string
): Promise<SalesAiRun> {
  const sql = await db();
  if (!sql) throw new SalesError("Datenbank nicht verfügbar", "db_unavailable", 503);
  await sql`
    UPDATE sales_ai_runs SET
      status      = ${status},
      reviewer_id = ${reviewerId},
      review_note = ${note ?? null},
      reviewed_at = NOW()
    WHERE id = ${id}
  `;
  const run = await getRun(id);
  if (!run) throw new SalesError("Run nicht gefunden", "not_found", 404);
  return run;
}
