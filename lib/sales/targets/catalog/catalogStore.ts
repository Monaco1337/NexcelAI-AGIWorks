/**
 * Persistenz des Katalog-Runs.
 *
 * Ein Katalog-Run ist ein `sales_target_area_scans`-Datensatz mit
 * gesetztem `scope_key`. Die Tabelle war bereits der Batch-Run-Record
 * für Radius-Scans; Migration 0013 hat sie um Publish-State,
 * Quality-Report und Checkpoint erweitert. Es gibt daher bewusst keine
 * eigene Katalogtabelle.
 */

import { db } from "@/lib/pg";
import { newTargetId } from "../model";

export type PublishState = "DRAFT" | "PUBLISHED" | "FAILED";

export interface CatalogRun {
  id: string;
  correlationId: string;
  scopeKey: string;
  label: string;
  country: string;
  region: string | null;
  bbox: { south: number; west: number; north: number; east: number } | null;
  publishState: PublishState;
  status: string;
  totalSegments: number;
  discoveredCount: number;
  targetCount: number;
  qualityReport: Record<string, unknown>;
  checkpoint: { doneSegments?: string[] } & Record<string, unknown>;
  firstError: string | null;
  startedAt: string;
  finishedAt: string | null;
  publishedAt: string | null;
}

export async function findActiveCatalogRun(scopeKey: string): Promise<CatalogRun | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_area_scans
     WHERE scope_key = ${scopeKey} AND publish_state = 'DRAFT'
     ORDER BY started_at DESC LIMIT 1
  `;
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function findPublishedCatalogRun(scopeKey: string): Promise<CatalogRun | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_area_scans
     WHERE scope_key = ${scopeKey} AND publish_state = 'PUBLISHED'
     ORDER BY published_at DESC LIMIT 1
  `;
  return rows[0] ? mapRun(rows[0]) : null;
}

export async function getCatalogRun(id: string): Promise<CatalogRun | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_area_scans WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? mapRun(rows[0]) : null;
}

export interface CreateCatalogRunInput {
  correlationId: string;
  scopeKey: string;
  label: string;
  country: string;
  region: string;
  bbox: { south: number; west: number; north: number; east: number };
  totalSegments: number;
  createdBy: string | null;
}

/**
 * Legt einen Katalog-Run an. Der partielle Unique-Index auf
 * `(scope_key) WHERE publish_state='DRAFT'` macht das idempotent: bei
 * einem parallelen zweiten Aufruf gewinnt der erste, der zweite bekommt
 * den bestehenden Run zurück.
 */
export async function createCatalogRun(input: CreateCatalogRunInput): Promise<CatalogRun> {
  const sql = await db();
  if (!sql) throw new Error("Datenbank nicht verfügbar");
  const id = newTargetId("cat");
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_area_scans (
      id, correlation_id, city, country, radius_km, tile_radius_km,
      industries, depth, limit_per_tile, max_tiles, total_tiles, job_ids,
      status, publish_state, scope_key, bbox, created_by
    ) VALUES (
      ${id}, ${input.correlationId}, ${input.label}, ${input.country},
      NULL, 0, ARRAY[]::text[], 'STANDARD', 0, ${input.totalSegments},
      ${input.totalSegments}, ARRAY[]::text[],
      'running', 'DRAFT', ${input.scopeKey},
      ${JSON.stringify(input.bbox)}::jsonb, ${input.createdBy}
    )
    ON CONFLICT (scope_key) WHERE publish_state = 'DRAFT' DO NOTHING
    RETURNING *
  `;
  if (rows[0]) return mapRun(rows[0]);
  const existing = await findActiveCatalogRun(input.scopeKey);
  if (!existing) throw new Error("Katalog-Run konnte nicht angelegt werden");
  return existing;
}

export async function updateCatalogRun(
  id: string,
  patch: {
    discoveredCount?: number;
    targetCount?: number;
    status?: string;
    firstError?: string | null;
    qualityReport?: Record<string, unknown>;
    checkpoint?: Record<string, unknown>;
  }
): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_area_scans
       SET discovered_count = COALESCE(${patch.discoveredCount ?? null}::int, discovered_count),
           target_count     = COALESCE(${patch.targetCount ?? null}::int, target_count),
           status           = COALESCE(${patch.status ?? null}, status),
           first_error      = ${patch.firstError === undefined ? sql`first_error` : patch.firstError},
           quality_report   = COALESCE(${patch.qualityReport ? JSON.stringify(patch.qualityReport) : null}::jsonb, quality_report),
           checkpoint       = COALESCE(${patch.checkpoint ? JSON.stringify(patch.checkpoint) : null}::jsonb, checkpoint)
     WHERE id = ${id}
  `;
}

/**
 * Atomarer Publish. Setzt in einer Anweisung Publish-State, Zeitstempel
 * und Quality-Report — und nur, solange der Run noch DRAFT ist. Ein
 * zweiter, gleichzeitiger Publish-Versuch trifft null Zeilen.
 */
export async function publishCatalogRun(
  id: string,
  qualityReport: Record<string, unknown>,
  targetCount: number
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_area_scans
       SET publish_state  = 'PUBLISHED',
           published_at   = NOW(),
           finished_at    = NOW(),
           status         = 'completed',
           target_count   = ${targetCount},
           quality_report = ${JSON.stringify(qualityReport)}::jsonb
     WHERE id = ${id} AND publish_state = 'DRAFT'
    RETURNING id
  `;
  return rows.length > 0;
}

export async function markCatalogRunFailed(id: string, report: Record<string, unknown>): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_area_scans
       SET publish_state  = 'FAILED',
           status         = 'failed',
           finished_at    = NOW(),
           quality_report = ${JSON.stringify(report)}::jsonb
     WHERE id = ${id} AND publish_state = 'DRAFT'
  `;
}

function mapRun(row: Record<string, unknown>): CatalogRun {
  const checkpoint = (row.checkpoint as Record<string, unknown> | null) ?? {};
  return {
    id: row.id as string,
    correlationId: row.correlation_id as string,
    scopeKey: (row.scope_key as string | null) ?? "",
    label: row.city as string,
    country: (row.country as string) ?? "DE",
    region: (row.region as string | null) ?? null,
    bbox: (row.bbox as CatalogRun["bbox"]) ?? null,
    publishState: ((row.publish_state as string) ?? "DRAFT") as PublishState,
    status: (row.status as string) ?? "running",
    totalSegments: Number(row.total_tiles ?? 0),
    discoveredCount: Number(row.discovered_count ?? 0),
    targetCount: Number(row.target_count ?? 0),
    qualityReport: (row.quality_report as Record<string, unknown>) ?? {},
    checkpoint,
    firstError: (row.first_error as string | null) ?? null,
    startedAt: new Date(row.started_at as string).toISOString(),
    finishedAt: row.finished_at ? new Date(row.finished_at as string).toISOString() : null,
    publishedAt: row.published_at ? new Date(row.published_at as string).toISOString() : null,
  };
}
