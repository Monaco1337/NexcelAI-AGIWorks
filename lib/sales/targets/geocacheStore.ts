/**
 * Postgres-Persistenz für Geocode-Cache + Area-Scan-Runs.
 *
 * Alles, was das Zielkunden-Cockpit an externen Auflösungen macht,
 * landet hier — analog zu allen anderen Datenpfaden des Systems.
 * Damit ist der Cache über Deployments hinweg stabil und wir belasten
 * keine öffentlichen Endpoints unnötig.
 */

import { db } from "@/lib/pg";

export interface GeocodeCacheEntry {
  queryNorm: string;
  lat: number;
  lng: number;
  displayName: string;
  country: string | null;
  source: string;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AreaScanRow {
  id: string;
  correlationId: string;
  city: string;
  country: string;
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  tileRadiusKm: number;
  industries: string[];
  depth: string;
  limitPerTile: number;
  maxTiles: number;
  totalTiles: number;
  jobIds: string[];
  status: "running" | "completed" | "failed";
  discoveredCount: number;
  actualCostCents: number;
  providerSummary: Record<string, unknown>;
  firstError: string | null;
  createdBy: string | null;
  startedAt: string;
  finishedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/*  Geocode-Cache                                                              */
/* -------------------------------------------------------------------------- */

function normalizeQuery(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function getGeocodeFromCache(query: string): Promise<GeocodeCacheEntry | null> {
  const sql = await db();
  if (!sql) return null;
  const norm = normalizeQuery(query);
  const rows = await sql<Record<string, unknown>[]>`
    UPDATE sales_target_geocode_cache
       SET hit_count = hit_count + 1,
           updated_at = NOW()
     WHERE query_norm = ${norm}
     RETURNING query_norm, lat, lng, display_name, country, source, hit_count, created_at, updated_at
  `;
  if (rows.length === 0) return null;
  return mapGeocodeRow(rows[0]);
}

export async function putGeocodeToCache(entry: {
  query: string;
  lat: number;
  lng: number;
  displayName: string;
  country: string | null;
  source: string;
}): Promise<GeocodeCacheEntry> {
  const sql = await db();
  if (!sql) throw new Error("Datenbank nicht verfügbar");
  const norm = normalizeQuery(entry.query);
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_geocode_cache (query_norm, lat, lng, display_name, country, source)
    VALUES (${norm}, ${entry.lat}, ${entry.lng}, ${entry.displayName}, ${entry.country}, ${entry.source})
    ON CONFLICT (query_norm) DO UPDATE
      SET lat = EXCLUDED.lat,
          lng = EXCLUDED.lng,
          display_name = EXCLUDED.display_name,
          country = COALESCE(EXCLUDED.country, sales_target_geocode_cache.country),
          source = EXCLUDED.source,
          updated_at = NOW()
    RETURNING query_norm, lat, lng, display_name, country, source, hit_count, created_at, updated_at
  `;
  return mapGeocodeRow(rows[0]);
}

function mapGeocodeRow(row: Record<string, unknown>): GeocodeCacheEntry {
  return {
    queryNorm: row.query_norm as string,
    lat: Number(row.lat),
    lng: Number(row.lng),
    displayName: row.display_name as string,
    country: (row.country as string | null) ?? null,
    source: row.source as string,
    hitCount: Number(row.hit_count ?? 1),
    createdAt: new Date(row.created_at as string).toISOString(),
    updatedAt: new Date(row.updated_at as string).toISOString(),
  };
}

/* -------------------------------------------------------------------------- */
/*  Area-Scans                                                                 */
/* -------------------------------------------------------------------------- */

export async function createAreaScan(input: Omit<AreaScanRow, "startedAt" | "finishedAt" | "status" | "discoveredCount" | "actualCostCents" | "providerSummary" | "firstError">): Promise<AreaScanRow> {
  const sql = await db();
  if (!sql) throw new Error("Datenbank nicht verfügbar");
  const rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_area_scans (
      id, correlation_id, city, country, center_lat, center_lng, radius_km,
      tile_radius_km, industries, depth, limit_per_tile, max_tiles,
      total_tiles, job_ids, created_by
    ) VALUES (
      ${input.id}, ${input.correlationId}, ${input.city}, ${input.country},
      ${input.centerLat}, ${input.centerLng}, ${input.radiusKm},
      ${input.tileRadiusKm}, ${input.industries}, ${input.depth},
      ${input.limitPerTile}, ${input.maxTiles}, ${input.totalTiles},
      ${input.jobIds}, ${input.createdBy}
    )
    RETURNING *
  `;
  return mapAreaScanRow(rows[0]);
}

export async function updateAreaScan(id: string, patch: Partial<Pick<AreaScanRow, "status" | "discoveredCount" | "actualCostCents" | "providerSummary" | "firstError" | "finishedAt">>): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_area_scans
       SET status            = COALESCE(${patch.status ?? null}, status),
           discovered_count  = COALESCE(${patch.discoveredCount ?? null}::int, discovered_count),
           actual_cost_cents = COALESCE(${patch.actualCostCents ?? null}::bigint, actual_cost_cents),
           provider_summary  = COALESCE(${patch.providerSummary ? JSON.stringify(patch.providerSummary) : null}::jsonb, provider_summary),
           first_error       = ${patch.firstError === undefined ? sql`first_error` : patch.firstError},
           finished_at       = COALESCE(${patch.finishedAt ?? null}::timestamptz, finished_at)
     WHERE id = ${id}
  `;
}

export async function getLatestAreaScanForRegion(city: string, radiusKm: number): Promise<AreaScanRow | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT * FROM sales_target_area_scans
    WHERE lower(city) = lower(${city}) AND radius_km >= ${radiusKm}
    ORDER BY started_at DESC LIMIT 1
  `;
  return rows[0] ? mapAreaScanRow(rows[0]) : null;
}

function mapAreaScanRow(row: Record<string, unknown>): AreaScanRow {
  return {
    id: row.id as string,
    correlationId: row.correlation_id as string,
    city: row.city as string,
    country: row.country as string,
    centerLat: Number(row.center_lat),
    centerLng: Number(row.center_lng),
    radiusKm: Number(row.radius_km),
    tileRadiusKm: Number(row.tile_radius_km),
    industries: (row.industries as string[] | null) ?? [],
    depth: (row.depth as string) ?? "STANDARD",
    limitPerTile: Number(row.limit_per_tile ?? 50),
    maxTiles: Number(row.max_tiles ?? 60),
    totalTiles: Number(row.total_tiles ?? 0),
    jobIds: (row.job_ids as string[] | null) ?? [],
    status: (row.status as AreaScanRow["status"]) ?? "running",
    discoveredCount: Number(row.discovered_count ?? 0),
    actualCostCents: Number(row.actual_cost_cents ?? 0),
    providerSummary: (row.provider_summary as Record<string, unknown>) ?? {},
    firstError: (row.first_error as string | null) ?? null,
    createdBy: (row.created_by as string | null) ?? null,
    startedAt: new Date(row.started_at as string).toISOString(),
    finishedAt: row.finished_at ? new Date(row.finished_at as string).toISOString() : null,
  };
}

/* -------------------------------------------------------------------------- */
/*  External IDs                                                               */
/* -------------------------------------------------------------------------- */

export async function upsertExternalId(input: {
  targetId: string;
  namespace: string;
  externalId: string;
  confidence?: number;
  sourceUrl?: string | null;
}): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    INSERT INTO sales_target_external_ids (target_id, namespace, external_id, confidence, source_url)
    VALUES (${input.targetId}, ${input.namespace}, ${input.externalId}, ${input.confidence ?? 0.9}, ${input.sourceUrl ?? null})
    ON CONFLICT (namespace, external_id) DO UPDATE
      SET target_id = EXCLUDED.target_id,
          confidence = GREATEST(sales_target_external_ids.confidence, EXCLUDED.confidence),
          source_url = COALESCE(EXCLUDED.source_url, sales_target_external_ids.source_url)
  `;
}

export async function findTargetIdByExternalId(namespace: string, externalId: string): Promise<string | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<Record<string, unknown>[]>`
    SELECT target_id FROM sales_target_external_ids
    WHERE namespace = ${namespace} AND external_id = ${externalId}
    LIMIT 1
  `;
  return rows[0] ? (rows[0].target_id as string) : null;
}
