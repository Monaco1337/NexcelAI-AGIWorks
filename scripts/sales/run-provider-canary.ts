import { db, jsonParam } from "../../lib/pg";
import { buildSegments, NRW_SCOPE } from "../../lib/sales/targets/catalog/scope";
import { bulkIngestCompanies } from "../../lib/sales/targets/catalog/bulkIngest";
import {
  completeCoverageRunForSearchJob,
  createCoverageRunForSearchJob,
  ensureCoveragePartitions,
} from "../../lib/sales/targets/coverage/store";
import { executeDiscoveryFailover } from "../../lib/sales/targets/providers/failover";
import { getConfiguredDiscoveryProviders } from "../../lib/sales/targets/providers/registry";
import { runEnrichmentWorker } from "../../lib/sales/targets/jobs/workerRunner";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const runId = `canary_${Date.now().toString(36)}`;
  const partitionLimit = boundedEnv("CANARY_PARTITIONS", 6, 1, 24);
  const companyLimit = boundedEnv("CANARY_COMPANIES_PER_PARTITION", 5, 1, 50);
  const maxCostCents = boundedEnv("CANARY_MAX_COST_CENTS", 500, 0, 10_000);
  await ensureCoveragePartitions(NRW_SCOPE);
  const allSegments = buildSegments(NRW_SCOPE);
  const axes = [...new Set(allSegments.map((segment) => segment.tagAxis))].slice(0, partitionLimit);
  const segments = axes.map((axis, index) => {
    const candidates = allSegments.filter((segment) => segment.tagAxis === axis);
    const row = 2 + (index % 4);
    const col = 2 + ((index * 2) % 4);
    return candidates.find((segment) => segment.row === row && segment.col === col)
      ?? candidates[Math.floor(candidates.length / 2)];
  });
  const providers = getConfiguredDiscoveryProviders();
  if (providers.length === 0) throw new Error("No configured discovery provider");
  const jobIds: string[] = [];
  const partitionResults: Array<Record<string, unknown>> = [];
  let raw = 0;
  let canonicalNew = 0;
  let duplicates = 0;
  let providerFailures = 0;
  let requestCount = 0;
  const latencies: number[] = [];
  const targetIds = new Set<string>();
  let consecutiveSliceFailures = 0;
  let cumulativeCostCents = 0;

  for (let index = 0; index < segments.length; index++) {
    const segment = segments[index];
    const jobId = `${runId}_${index}`;
    jobIds.push(jobId);
    await sql`
      INSERT INTO sales_target_search_jobs (
        id, label, region, country, filters, limit_count
      ) VALUES (
        ${jobId}, ${`RC canary ${segment.tagAxis} r${segment.row}c${segment.col}`},
        'Nordrhein-Westfalen', 'DE',
        ${sql.json(jsonParam({ catalogSegment: segment.key, bbox: segment.bbox, tagAxis: segment.tagAxis }))},
        ${companyLimit}
      )
    `;
    await createCoverageRunForSearchJob({
      scopeKey: NRW_SCOPE.key,
      partitionKey: segment.key,
      searchJobId: jobId,
    });
    const response = await executeDiscoveryFailover(providers, {
      city: null,
      country: "DE",
      centerLat: null,
      centerLng: null,
      radiusKm: 0,
      industries: [],
      categories: [],
      limit: companyLimit,
      depth: "QUICK",
      bbox: segment.bbox,
      tagAxis: segment.tagAxis,
    }, {
      searchJobId: jobId,
      attempt: 1,
      correlationId: `${runId}:${index}`,
    });
    requestCount += response.providerLogs.length;
    providerFailures += response.providerLogs.filter((log) => !log.ok).length;
    cumulativeCostCents += response.actualCostCents;
    response.providerLogs.forEach((log) => latencies.push(log.latencyMs));
    const successfulLog = response.providerLogs.find((log) => log.ok);
    const sliceSucceeded = Boolean(successfulLog && response.companies.length > 0);
    consecutiveSliceFailures = sliceSucceeded ? 0 : consecutiveSliceFailures + 1;
    const ingest = await bulkIngestCompanies(response.companies, {
      searchJobId: jobId,
      region: "Nordrhein-Westfalen",
    });
    raw += ingest.received;
    canonicalNew += ingest.inserted;
    duplicates += ingest.duplicates;
    const ids = await sql<{ id: string }[]>`
      SELECT id FROM sales_target_companies WHERE origin_search_job_id = ${jobId}
    `;
    ids.forEach((row) => targetIds.add(row.id));
    await completeCoverageRunForSearchJob({
      searchJobId: jobId,
      status: sliceSucceeded ? "completed" : "failed",
      observations: response.providerObservedCount ?? ingest.received,
      candidates: ingest.received,
      newTargets: ingest.inserted,
      matchedTargets: ingest.duplicates,
      estimatedCostCents: response.estimatedCostCents,
      actualCostCents: response.actualCostCents,
      providersAttempted: [...new Set(response.providerLogs.map((log) => log.provider))],
      requestCount: response.providerLogs.length,
      error: sliceSucceeded
        ? null
        : response.providerLogs.find((log) => !log.ok)?.error ?? "NO_PROVIDER_YIELD",
    });
    partitionResults.push({
      partition: segment.key,
      axis: segment.tagAxis,
      row: segment.row,
      column: segment.col,
      raw: ingest.received,
      canonicalNew: ingest.inserted,
      duplicates: ingest.duplicates,
      latencyMs: successfulLog?.latencyMs ?? null,
      providerOk: sliceSucceeded,
      providers: response.providerLogs.map((log) => ({
        provider: log.provider,
        ok: log.ok,
        latencyMs: log.latencyMs,
        error: log.error ?? null,
      })),
    });
    if (cumulativeCostCents > maxCostCents) {
      throw new Error(`CANARY_STOP_COST_LIMIT: ${cumulativeCostCents} > ${maxCostCents}`);
    }
    if (consecutiveSliceFailures >= 3) {
      throw new Error("CANARY_STOP_PROVIDER_FAILURES: three consecutive slices failed");
    }
  }

  for (let cycle = 0; cycle < 20; cycle++) {
    const result = await runEnrichmentWorker({
      batch: 200,
      maxMs: 240_000,
      workerId: `${runId}:worker:${cycle}`,
    });
    if (result.outcomes.length === 0) break;
  }

  const ids = [...targetIds];
  const traces = ids.length > 0
    ? await sql<Record<string, unknown>[]>`
        SELECT target.id, target.name, target.website, target.phone, target.email,
               target.address_line, target.city, target.enrichment_status,
               score.total_score, score.priority_class,
               qualification.decision AS qualification_decision,
               qualification.reason_codes AS qualification_reasons,
               qualification.confidence AS qualification_confidence
        FROM sales_target_companies target
        LEFT JOIN LATERAL (
          SELECT total_score, priority_class
          FROM sales_target_lead_scores
          WHERE target_id = target.id AND is_current = TRUE
          ORDER BY (score_version = 'v2') DESC, calculated_at DESC LIMIT 1
        ) score ON TRUE
        LEFT JOIN LATERAL (
          SELECT decision, reason_codes, confidence
          FROM sales_target_qualification_decisions
          WHERE target_id = target.id ORDER BY decided_at DESC LIMIT 1
        ) qualification ON TRUE
        WHERE target.id = ANY(${ids})
        ORDER BY target.name
      `
    : [];
  const qualified = traces.filter((row) => row.qualification_decision === "QUALIFIED").length;
  const salesReady = traces.filter((row) => row.enrichment_status === "READY").length;
  const rejected = traces.filter((row) => row.qualification_decision === "DISQUALIFIED").length;
  const review = traces.filter((row) => row.qualification_decision === "REVIEW_REQUIRED").length;
  const unknown = traces.filter((row) =>
    row.qualification_decision === "UNKNOWN" || row.qualification_decision === null
  ).length;
  const requests = await sql<Record<string, unknown>[]>`
    SELECT COUNT(*)::int AS requests,
           COALESCE(SUM(estimated_cost_cents), 0)::bigint AS estimated_cost,
           COALESCE(SUM(cost_cents), 0)::bigint AS actual_cost
    FROM sales_target_provider_requests
    WHERE search_job_id = ANY(${jobIds}) OR target_id = ANY(${ids})
  `;
  latencies.sort((a, b) => a - b);
  const qualificationInterval = wilson(qualified, Math.max(1, traces.length));
  const netNewInterval = wilson(canonicalNew, Math.max(1, raw));
  console.log(JSON.stringify({
    runId,
    timeSlices: 1,
    geographies: segments.map((segment) => `r${segment.row}c${segment.col}`),
    categories: axes,
    partitions: partitionResults,
    requestCount,
    persistedRequestCount: Number(requests[0]?.requests ?? 0),
    raw,
    canonicalNew,
    duplicates,
    rejected,
    review,
    unknown,
    qualified,
    salesReady,
    providerFailures,
    latencyMs: {
      p50: percentile(latencies, 0.5),
      p95: percentile(latencies, 0.95),
    },
    estimatedCostCents: Number(requests[0]?.estimated_cost ?? 0),
    actualCostCents: Number(requests[0]?.actual_cost ?? 0),
    uncertainty95Percent: {
      qualificationRate: qualificationInterval,
      canonicalNewRate: netNewInterval,
    },
    traces,
  }));
  await sql.end({ timeout: 5 });
}

function boundedEnv(name: string, fallback: number, minimum: number, maximum: number): number {
  const value = Number(process.env[name] ?? fallback);
  return Math.max(minimum, Math.min(maximum, Number.isFinite(value) ? Math.floor(value) : fallback));
}

function percentile(values: number[], quantile: number): number | null {
  if (values.length === 0) return null;
  return values[Math.min(values.length - 1, Math.ceil(values.length * quantile) - 1)];
}

function wilson(successes: number, trials: number, z = 1.96) {
  const p = successes / trials;
  const denominator = 1 + z * z / trials;
  const centre = p + z * z / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p) + z * z / (4 * trials)) / trials);
  return {
    low: Math.max(0, (centre - margin) / denominator),
    high: Math.min(1, (centre + margin) / denominator),
  };
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
