import { createHash } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import type { CatalogScope } from "../catalog/scope";
import { buildSegments } from "../catalog/scope";
import type { AcquisitionDecision, AcquisitionSnapshot, CoveragePartition } from "./types";

export async function createCoverageRunForSearchJob(input: {
  scopeKey: string;
  partitionKey: string;
  searchJobId: string;
  areaScanId?: string | null;
}): Promise<string | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<{ id: string }[]>`
    INSERT INTO sales_target_coverage_runs (
      id, partition_id, search_job_id, area_scan_id, status,
      idempotency_key, controller_version, config_snapshot
    )
    SELECT
      ${`covrun_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`},
      p.id, ${input.searchJobId}, ${input.areaScanId ?? null}, 'queued',
      ${`search-job:${input.searchJobId}`}, 'v1',
      ${sql.json(jsonParam({ partitionKey: input.partitionKey }))}
    FROM sales_target_coverage_partitions p
    WHERE p.scope_key = ${input.scopeKey} AND p.partition_key = ${input.partitionKey}
    ON CONFLICT (idempotency_key) WHERE idempotency_key IS NOT NULL
    DO UPDATE SET updated_at = sales_target_coverage_runs.updated_at
    RETURNING id
  `;
  return rows[0]?.id ?? null;
}

export async function completeCoverageRunForSearchJob(input: {
  searchJobId: string;
  status: "completed" | "partial" | "failed";
  observations?: number;
  candidates?: number;
  newTargets?: number;
  matchedTargets?: number;
  estimatedCostCents?: number;
  actualCostCents?: number;
  providersAttempted?: string[];
  requestCount?: number;
  errorCode?: string | null;
  error?: string | null;
}): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_coverage_runs
    SET status = ${input.status},
        observation_count = ${input.observations ?? 0},
        candidate_count = ${input.candidates ?? 0},
        new_target_count = ${input.newTargets ?? 0},
        matched_target_count = ${input.matchedTargets ?? 0},
        estimated_cost_cents = ${input.estimatedCostCents ?? 0},
        actual_cost_cents = ${input.actualCostCents ?? 0},
        providers_attempted = ${input.providersAttempted ?? []},
        request_count = ${input.requestCount ?? 0},
        error_code = ${input.errorCode ?? null},
        error = ${input.error ?? null},
        started_at = COALESCE(started_at, NOW()),
        finished_at = NOW(),
        updated_at = NOW()
    WHERE search_job_id = ${input.searchJobId}
  `;
  await sql`
    UPDATE sales_target_coverage_partitions p
    SET discovered_entities = p.discovered_entities + ${input.newTargets ?? 0},
        coverage_ratio = CASE
          WHEN p.expected_entities IS NOT NULL AND p.expected_entities > 0
            THEN LEAST(
              1,
              (p.discovered_entities + ${input.newTargets ?? 0})::numeric
                / p.expected_entities
            )
          ELSE p.coverage_ratio
        END,
        status = CASE
          WHEN ${input.status} = 'failed' THEN 'failed'
          WHEN ${input.newTargets ?? 0} = 0 AND (
            SELECT COUNT(*)
            FROM sales_target_coverage_runs attempts
            WHERE attempts.partition_id = p.id
              AND attempts.status IN ('completed', 'partial')
          ) >= 3 THEN 'retired'
          ELSE 'covered'
        END,
        last_covered_at = NOW(),
        next_coverage_at = CASE
          WHEN ${input.status} = 'failed' THEN NOW() + INTERVAL '15 minutes'
          WHEN ${input.newTargets ?? 0} = 0 THEN NOW() + INTERVAL '24 hours'
          ELSE NOW() + INTERVAL '1 hour'
        END,
        updated_at = NOW()
    FROM sales_target_coverage_runs r
    WHERE r.search_job_id = ${input.searchJobId} AND r.partition_id = p.id
  `;
}

export async function ensureCoveragePartitions(scope: CatalogScope): Promise<number> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const segments = buildSegments(scope);
  const values: Array<Record<string, unknown>> = segments.map((segment) => ({
    id: stableId(segment.key),
    scope_key: scope.key,
    partition_key: segment.key,
    partition_kind: "bbox",
    country: scope.country,
    region: scope.region,
    bbox: segment.bbox,
    status: "pending",
    provider_cursor: { provider: "portfolio", categoryAxis: segment.tagAxis },
  }));
  const rows = await sql<{ id: string }[]>`
    INSERT INTO sales_target_coverage_partitions ${sql(
      values,
      "id", "scope_key", "partition_key", "partition_kind", "country",
      "region", "bbox", "status", "provider_cursor"
    )}
    ON CONFLICT (scope_key, partition_key) DO NOTHING
    RETURNING id
  `;
  return rows.length;
}

export async function listCoveragePartitions(scopeKey: string): Promise<CoveragePartition[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<Record<string, unknown>[]>`
    SELECT p.*,
           pcs.enabled AS provider_enabled,
           pcs.state AS provider_runtime_state,
           ph.state AS provider_health_state,
           ph.cooldown_until AS provider_cooldown_until,
           COALESCE(r.attempts, 0) AS attempts,
           COALESCE(r.raw_count, 0) AS raw_count,
           COALESCE(r.valid_count, 0) AS valid_count,
           COALESCE(r.new_count, 0) AS new_count,
           COALESCE(r.duplicate_count, 0) AS duplicate_count,
           COALESCE(r.failure_count, 0) AS failure_count,
           COALESCE(r.cost_cents, 0) AS cost_cents,
           COALESCE(r.latency_ms, 0) AS latency_ms,
           COALESCE(m.qualified_count, 0) AS qualified_count,
           COALESCE(m.sales_ready_count, 0) AS sales_ready_count
    FROM sales_target_coverage_partitions p
    LEFT JOIN sales_target_provider_config_state pcs
      ON pcs.provider = p.provider_cursor->>'provider'
    LEFT JOIN sales_target_provider_health ph
      ON ph.provider = p.provider_cursor->>'provider'
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS attempts,
             COALESCE(SUM(observation_count), 0)::bigint AS raw_count,
             COALESCE(SUM(candidate_count), 0)::bigint AS valid_count,
             COALESCE(SUM(new_target_count), 0)::bigint AS new_count,
             COALESCE(SUM(matched_target_count), 0)::bigint AS duplicate_count,
             COUNT(*) FILTER (WHERE status = 'failed')::int AS failure_count,
             COALESCE(SUM(actual_cost_cents), 0)::bigint AS cost_cents,
             COALESCE(SUM(EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000), 0)::bigint AS latency_ms
      FROM sales_target_coverage_runs
      WHERE partition_id = p.id
    ) r ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*) FILTER (WHERE me.metric_key = 'FIRST_QUALIFIED')::int AS qualified_count,
             COUNT(*) FILTER (WHERE me.metric_key = 'FIRST_SALES_READY')::int AS sales_ready_count
      FROM sales_target_metric_events me
      JOIN sales_target_coverage_runs cr ON cr.id = me.coverage_run_id
      WHERE cr.partition_id = p.id
    ) m ON TRUE
    WHERE p.scope_key = ${scopeKey}
  `;
  return rows.map(mapPartition);
}

export async function listActiveCoveragePartitionIds(): Promise<Set<string>> {
  const sql = await db();
  if (!sql) return new Set();
  const rows = await sql<{ partition_id: string }[]>`
    SELECT DISTINCT run.partition_id
    FROM sales_target_coverage_runs run
    JOIN sales_target_search_jobs job ON job.id = run.search_job_id
    WHERE run.partition_id IS NOT NULL
      AND job.status IN ('queued', 'running')
  `;
  return new Set(rows.map((row) => row.partition_id));
}

export async function retireCoveragePartitions(ids: string[]): Promise<number> {
  if (ids.length === 0) return 0;
  const sql = await db();
  if (!sql) return 0;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_coverage_partitions
    SET status = 'retired', next_coverage_at = NULL, updated_at = NOW()
    WHERE id = ANY(${ids}) AND status <> 'retired'
    RETURNING id
  `;
  return rows.length;
}

export async function claimCoveragePartitions(ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const sql = await db();
  if (!sql) return new Set();
  await sql`
    UPDATE sales_target_coverage_partitions partition
    SET status = 'failed', next_coverage_at = NOW(), updated_at = NOW()
    WHERE status = 'running'
      AND updated_at < NOW() - INTERVAL '10 minutes'
      AND NOT EXISTS (
        SELECT 1
        FROM sales_target_coverage_runs run
        JOIN sales_target_search_jobs job ON job.id = run.search_job_id
        WHERE run.partition_id = partition.id AND job.status IN ('queued', 'running')
      )
  `;
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_coverage_partitions partition
    SET status = 'running', updated_at = NOW()
    WHERE id = ANY(${ids})
      AND status IN ('pending', 'covered', 'partial', 'failed')
      AND (next_coverage_at IS NULL OR next_coverage_at <= NOW())
      AND NOT EXISTS (
        SELECT 1
        FROM sales_target_coverage_runs run
        JOIN sales_target_search_jobs job ON job.id = run.search_job_id
        WHERE run.partition_id = partition.id AND job.status IN ('queued', 'running')
      )
    RETURNING id
  `;
  return new Set(rows.map((row) => row.id));
}

export async function failCoveragePartitionClaim(id: string): Promise<void> {
  const sql = await db();
  if (!sql) return;
  await sql`
    UPDATE sales_target_coverage_partitions
    SET status = 'failed', next_coverage_at = NOW() + INTERVAL '15 minutes', updated_at = NOW()
    WHERE id = ${id} AND status = 'running'
  `;
}

export async function subdivideCoveragePartitionForSearchJob(
  searchJobId: string,
  maxDepth = 2,
): Promise<number> {
  const sql = await db();
  if (!sql) return 0;
  return sql.begin(async (tx) => {
    const rows = await tx<Record<string, unknown>[]>`
      SELECT p.*, r.area_scan_id
      FROM sales_target_coverage_partitions p
      JOIN sales_target_coverage_runs r ON r.partition_id = p.id
      WHERE r.search_job_id = ${searchJobId}
      FOR UPDATE OF p
    `;
    const parent = rows[0];
    const bbox = asBbox(parent?.bbox);
    const depth = Number(parent?.depth ?? 0);
    if (!parent || !bbox || depth >= maxDepth || String(parent.status) === "retired") return 0;
    const latMid = round6((bbox.south + bbox.north) / 2);
    const lngMid = round6((bbox.west + bbox.east) / 2);
    const boxes = [
      { south: bbox.south, west: bbox.west, north: latMid, east: lngMid },
      { south: bbox.south, west: lngMid, north: latMid, east: bbox.east },
      { south: latMid, west: bbox.west, north: bbox.north, east: lngMid },
      { south: latMid, west: lngMid, north: bbox.north, east: bbox.east },
    ];
    const partitionKey = String(parent.partition_key);
    const inserted: Array<{ id: string }> = [];
    for (const [index, child] of boxes.entries()) {
      const rows = await tx<{ id: string }[]>`
        INSERT INTO sales_target_coverage_partitions (
          id, parent_partition_id, scope_key, partition_key, partition_kind,
          country, region, bbox, depth, status, expected_entities, provider_cursor
        ) VALUES (
          ${stableId(`${partitionKey}/q${index}`)}, ${String(parent.id)},
          ${String(parent.scope_key)}, ${`${partitionKey}/q${index}`}, 'bbox',
          ${String(parent.country)}, ${parent.region ? String(parent.region) : null},
          ${tx.json(jsonParam(child))}, ${depth + 1}, 'pending',
          ${parent.expected_entities
            ? Math.max(1, Math.ceil(Number(parent.expected_entities) / 4))
            : null},
          ${tx.json(jsonParam(parent.provider_cursor ?? {}))}
        )
        ON CONFLICT (scope_key, partition_key) DO NOTHING
        RETURNING id
      `;
      inserted.push(...rows);
    }
    if (inserted.length > 0) {
      await tx`
        UPDATE sales_target_coverage_partitions
        SET status = 'retired', next_coverage_at = NULL, updated_at = NOW()
        WHERE id = ${String(parent.id)}
      `;
      if (parent.area_scan_id) {
        await tx`
          UPDATE sales_target_area_scans
          SET total_tiles = total_tiles + ${inserted.length - 1}
          WHERE id = ${String(parent.area_scan_id)}
        `;
      }
    }
    return inserted.length;
  });
}

export async function saveControllerSnapshot(input: {
  controllerKey: string;
  controllerVersion: string;
  sequenceNo: number;
  observed: AcquisitionSnapshot;
  decision: AcquisitionDecision;
  issuedWork?: unknown[];
  budgetState?: Record<string, unknown>;
  correlationId?: string | null;
}): Promise<string> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const id = `ctl_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
  await sql`
    INSERT INTO sales_target_controller_snapshots (
      id, controller_key, controller_version, sequence_no, observed_state,
      decision, issued_work, budget_state, correlation_id
    ) VALUES (
      ${id}, ${input.controllerKey}, ${input.controllerVersion}, ${input.sequenceNo},
      ${sql.json(jsonParam(input.observed))}, ${sql.json(jsonParam(input.decision))},
      ${sql.json(jsonParam(input.issuedWork ?? []))},
      ${sql.json(jsonParam(input.budgetState ?? {}))}, ${input.correlationId ?? null}
    )
  `;
  return id;
}

function mapPartition(row: Record<string, unknown>): CoveragePartition {
  const cursor = (row.provider_cursor as Record<string, unknown> | null) ?? {};
  const provider = String(cursor.provider ?? "unknown");
  const status = String(row.status);
  const providerDisabled = (
    row.provider_enabled === false ||
    ["paused", "disabled"].includes(String(row.provider_runtime_state ?? ""))
  );
  const providerCoolingDown = provider !== "portfolio" &&
    ["RATE_LIMITED", "CIRCUIT_OPEN", "UNAVAILABLE", "DEGRADED", "MISCONFIGURED"].includes(
      String(row.provider_health_state ?? ""),
    ) &&
    (
      row.provider_cooldown_until === null ||
      row.provider_cooldown_until === undefined ||
      new Date(String(row.provider_cooldown_until)).getTime() > Date.now()
    );
  return {
    id: String(row.id),
    parentPartitionId: row.parent_partition_id ? String(row.parent_partition_id) : null,
    depth: Number(row.depth ?? 0),
    geographyKey: String(row.partition_key),
    geographyVersion: String(row.version ?? 1),
    provider,
    categoryAxis: String(cursor.categoryAxis ?? "unknown"),
    strategy: String(row.partition_kind ?? "bbox"),
    bbox: asBbox(row.bbox),
    state: providerDisabled || providerCoolingDown
      ? "DISABLED"
      : status === "paused"
        ? "PAUSED"
        : status === "retired"
          ? "EXHAUSTED"
          : "ACTIVE",
    nextEligibleAt: asIso(row.next_coverage_at),
    attempts: Number(row.attempts ?? 0),
    rawCount: Number(row.raw_count ?? 0),
    validCount: Number(row.valid_count ?? 0),
    canonicalNewCount: Number(row.new_count ?? 0),
    qualifiedCount: Number(row.qualified_count ?? 0),
    salesReadyCount: Number(row.sales_ready_count ?? 0),
    duplicateCount: Number(row.duplicate_count ?? 0),
    failureCount: Number(row.failure_count ?? 0),
    totalCostCents: Number(row.cost_cents ?? 0),
    totalLatencyMs: Number(row.latency_ms ?? 0),
  };
}

function stableId(key: string): string {
  return `cov_${createHash("sha256").update(key).digest("hex").slice(0, 20)}`;
}

function asIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function asBbox(value: unknown): CoveragePartition["bbox"] {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const south = Number(input.south);
  const west = Number(input.west);
  const north = Number(input.north);
  const east = Number(input.east);
  return [south, west, north, east].every(Number.isFinite)
    ? { south, west, north, east }
    : null;
}

function round6(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

