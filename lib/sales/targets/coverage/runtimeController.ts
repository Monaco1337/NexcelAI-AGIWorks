import { db } from "@/lib/pg";
import { decideAcquisition } from "./controller";
import type { AcquisitionSnapshot } from "./types";

export async function evaluateRuntimeAcquisition(): Promise<{
  snapshot: AcquisitionSnapshot;
  decision: ReturnType<typeof decideAcquisition>;
}> {
  const targetQualified = positiveInt(process.env.SALES_TARGET_QUALIFIED_PER_24H, 500);
  const maxConcurrency = positiveInt(process.env.SALES_TARGET_MAX_CONCURRENCY, 4);
  const budget = positiveInt(process.env.SALES_TARGET_DAILY_BUDGET_CENTS, 1_000_000_000);
  const sql = await db();
  const windowHours = 24;
  const windowEndedAt = new Date();
  const windowStartedAt = new Date(windowEndedAt.getTime() - windowHours * 3_600_000);
  let snapshot: AcquisitionSnapshot;
  if (!sql) {
    snapshot = {
      targetQualified,
      rollingQualified: 0,
      elapsedFraction: new Date().getUTCHours() / 24,
      recentQualifiedPerHour: null,
      healthyRequestCapacityPerHour: 0,
      backlogOldestAgeSeconds: 0,
      globalBudgetRemainingCents: budget,
      maxConcurrency,
      capacitySource: "SYNTHETIC_FALLBACK",
      capacityStatus: "INSUFFICIENT_EVIDENCE",
      capacityEvidence: emptyEvidence(windowHours, windowStartedAt, windowEndedAt, [
        "database",
        "providerRequestSuccessRate",
        "requestLatency",
        "acceptedRawYield",
        "validRate",
        "canonicalNewYield",
        "qualificationRate",
        "salesReadyRate",
        "duplicateRate",
        "providerThroughput",
        "workerCapacity",
      ]),
      configuredLimits: { maxConcurrency, dailyBudgetCents: budget },
    };
  } else {
    const rows = await sql<Record<string, unknown>[]>`
      WITH selected_runs AS (
        SELECT run.*
        FROM sales_target_coverage_runs run
        WHERE COALESCE(run.finished_at, run.created_at) >= NOW() - INTERVAL '24 hours'
          AND EXISTS (
            SELECT 1 FROM sales_target_provider_requests request
            WHERE request.search_job_id = run.search_job_id
              AND request.created_at >= NOW() - INTERVAL '24 hours'
          )
      ),
      provider AS (
        SELECT
          COUNT(*)::int AS request_count,
          COUNT(*) FILTER (
            WHERE error IS NULL
              AND (response_status IS NULL OR response_status BETWEEN 200 AND 299)
          )::int AS successful_request_count,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms)
            FILTER (WHERE latency_ms IS NOT NULL) AS latency_p50,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)
            FILTER (WHERE latency_ms IS NOT NULL) AS latency_p95,
          COUNT(*) FILTER (
            WHERE error ILIKE '%rate%limit%' OR response_status = 429
          )::int AS rate_limited_count,
          MAX(COALESCE(completed_at, created_at)) AS latest_observation_at
        FROM sales_target_provider_requests
        WHERE created_at >= NOW() - INTERVAL '24 hours'
          AND search_job_id IN (SELECT search_job_id FROM selected_runs)
      ),
      coverage AS (
        SELECT
          COALESCE(SUM(observation_count), 0)::numeric AS raw_count,
          COALESCE(SUM(candidate_count), 0)::numeric AS valid_count,
          COALESCE(SUM(new_target_count), 0)::numeric AS canonical_new_count,
          COALESCE(SUM(matched_target_count), 0)::numeric AS duplicate_count
        FROM selected_runs
      ),
      funnel AS (
        SELECT
          COUNT(*) FILTER (
            WHERE metric_key = 'FIRST_QUALIFIED'
              AND occurred_at >= NOW() - INTERVAL '24 hours'
              AND coverage_run_id IN (SELECT id FROM selected_runs)
          )::int AS rolling_qualified,
          COUNT(*) FILTER (
            WHERE metric_key = 'FIRST_QUALIFIED'
              AND occurred_at >= NOW() - INTERVAL '6 hours'
              AND coverage_run_id IN (SELECT id FROM selected_runs)
          )::numeric / 6 AS recent_per_hour,
          COUNT(*) FILTER (
            WHERE metric_key = 'FIRST_SALES_READY'
              AND occurred_at >= NOW() - INTERVAL '24 hours'
              AND coverage_run_id IN (SELECT id FROM selected_runs)
          )::int AS rolling_sales_ready
        FROM sales_target_metric_events
      ),
      worker AS (
        SELECT COUNT(*)::numeric / 24 AS completions_per_hour
        FROM sales_target_enrichment_jobs
        WHERE status = 'done' AND finished_at >= NOW() - INTERVAL '24 hours'
      )
      SELECT provider.*, coverage.*, funnel.*, worker.completions_per_hour,
        COALESCE((
          SELECT EXTRACT(EPOCH FROM (NOW() - MIN(created_at)))
          FROM sales_target_enrichment_jobs WHERE status = 'queued'
        ), 0) AS backlog_age,
        COALESCE((
          SELECT SUM(spent_cents + reserved_cents)
          FROM sales_target_provider_budgets
          WHERE provider = '*'
            AND period_start <= NOW() AND period_end > NOW()
        ), 0) AS committed_cents
      FROM provider CROSS JOIN coverage CROSS JOIN funnel CROSS JOIN worker
    `;
    const row = rows[0] ?? {};
    const requestCount = Number(row.request_count ?? 0);
    const successfulRequestCount = Number(row.successful_request_count ?? 0);
    const rawCount = Number(row.raw_count ?? 0);
    const canonicalNewCount = Number(row.canonical_new_count ?? 0);
    const duplicateCount = Number(row.duplicate_count ?? 0);
    const rollingQualified = Number(row.rolling_qualified ?? 0);
    const rollingSalesReady = Number(row.rolling_sales_ready ?? 0);
    const validCount = Number(row.valid_count ?? 0);
    const latestObservationAt = asIso(row.latest_observation_at);
    const freshnessSeconds = latestObservationAt
      ? Math.max(0, (Date.now() - Date.parse(latestObservationAt)) / 1000)
      : null;
    const requestSuccessRate = ratio(successfulRequestCount, requestCount);
    const acceptedRawPerRequest = ratio(rawCount, requestCount);
    const validRate = ratio(validCount, rawCount);
    const canonicalNewRate = ratio(canonicalNewCount, validCount);
    const qualificationRate = ratio(rollingQualified, canonicalNewCount);
    const salesReadyRate = ratio(rollingSalesReady, rollingQualified);
    const duplicateRate = ratio(duplicateCount, validCount);
    const requestThroughputPerHour = requestCount > 0 ? requestCount / windowHours : null;
    const coverageCountsConsistent =
      rawCount >= validCount &&
      validCount >= canonicalNewCount + duplicateCount &&
      canonicalNewCount >= rollingQualified &&
      rollingQualified >= rollingSalesReady;
    const unknownInputs = [
      requestSuccessRate === null ? "providerRequestSuccessRate" : null,
      row.latency_p50 === null ? "requestLatency" : null,
      acceptedRawPerRequest === null ? "acceptedRawYield" : null,
      validRate === null ? "validRate" : null,
      canonicalNewRate === null ? "canonicalNewYield" : null,
      qualificationRate === null ? "qualificationRate" : null,
      salesReadyRate === null ? "salesReadyRate" : null,
      duplicateRate === null ? "duplicateRate" : null,
      requestThroughputPerHour === null ? "providerThroughput" : null,
      row.completions_per_hour === null ? "workerCapacity" : null,
      !coverageCountsConsistent ? "coverageCohortConsistency" : null,
    ].filter((value): value is string => value !== null);
    const sufficientlyObserved =
      requestCount >= 10 &&
      successfulRequestCount > 0 &&
      freshnessSeconds !== null &&
      freshnessSeconds <= 6 * 3_600 &&
      unknownInputs.length === 0;
    const capacitySource: AcquisitionSnapshot["capacitySource"] =
      requestCount === 0
        ? "SYNTHETIC_FALLBACK"
        : sufficientlyObserved
          ? "OBSERVED"
          : "PARTIALLY_OBSERVED";
    const measuredQualifiedCapacity =
      sufficientlyObserved &&
      requestThroughputPerHour !== null &&
      acceptedRawPerRequest !== null &&
      validRate !== null &&
      canonicalNewRate !== null &&
      qualificationRate !== null
        ? requestThroughputPerHour * acceptedRawPerRequest * validRate *
          canonicalNewRate * qualificationRate
        : 0;
    const measuredSalesReadyCapacity =
      sufficientlyObserved && salesReadyRate !== null
        ? measuredQualifiedCapacity * salesReadyRate
        : 0;
    const recent = sufficientlyObserved ? Number(row.recent_per_hour) : Number.NaN;
    snapshot = {
      targetQualified,
      rollingQualified,
      elapsedFraction: new Date().getUTCHours() / 24,
      recentQualifiedPerHour: Number.isFinite(recent) ? recent : null,
      healthyRequestCapacityPerHour: measuredQualifiedCapacity,
      backlogOldestAgeSeconds: Number(row.backlog_age ?? 0),
      globalBudgetRemainingCents: Math.max(0, budget - Number(row.committed_cents ?? 0)),
      maxConcurrency,
      capacitySource,
      capacityStatus: sufficientlyObserved ? "MEASURED" : "INSUFFICIENT_EVIDENCE",
      capacityEvidence: {
        sampleCount: requestCount,
        successfulRequestCount,
        observationWindowHours: windowHours,
        windowStartedAt: windowStartedAt.toISOString(),
        windowEndedAt: windowEndedAt.toISOString(),
        latestObservationAt,
        freshnessSeconds,
        requestSuccessRate,
        requestLatencyP50Ms: nullableNumber(row.latency_p50),
        requestLatencyP95Ms: nullableNumber(row.latency_p95),
        acceptedRawPerRequest,
        validRate,
        canonicalNewRate,
        qualificationRate,
        salesReadyRate,
        duplicateRate,
        rateLimitedCount: Number(row.rate_limited_count ?? 0),
        recentRequestThroughputPerHour: requestThroughputPerHour,
        workerCompletionsPerHour: nullableNumber(row.completions_per_hour),
        measuredQualifiedPerHour: sufficientlyObserved ? measuredQualifiedCapacity : null,
        measuredSalesReadyPerHour: sufficientlyObserved ? measuredSalesReadyCapacity : null,
        qualificationRate95Percent: qualificationRate === null
          ? null
          : wilsonInterval(rollingQualified, canonicalNewCount),
        unknownInputs,
      },
      configuredLimits: { maxConcurrency, dailyBudgetCents: budget },
    };
  }
  return { snapshot, decision: decideAcquisition(snapshot) };
}

function positiveInt(raw: string | undefined, fallback: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function emptyEvidence(
  windowHours: number,
  windowStartedAt: Date,
  windowEndedAt: Date,
  unknownInputs: string[],
): AcquisitionSnapshot["capacityEvidence"] {
  return {
    sampleCount: 0,
    successfulRequestCount: 0,
    observationWindowHours: windowHours,
    windowStartedAt: windowStartedAt.toISOString(),
    windowEndedAt: windowEndedAt.toISOString(),
    latestObservationAt: null,
    freshnessSeconds: null,
    requestSuccessRate: null,
    requestLatencyP50Ms: null,
    requestLatencyP95Ms: null,
    acceptedRawPerRequest: null,
    validRate: null,
    canonicalNewRate: null,
    qualificationRate: null,
    salesReadyRate: null,
    duplicateRate: null,
    rateLimitedCount: 0,
    recentRequestThroughputPerHour: null,
    workerCompletionsPerHour: null,
    measuredQualifiedPerHour: null,
    measuredSalesReadyPerHour: null,
    qualificationRate95Percent: null,
    unknownInputs,
  };
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function asIso(value: unknown): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : null;
}

function wilsonInterval(successes: number, trials: number, z = 1.96): { low: number; high: number } | null {
  if (trials <= 0) return null;
  const boundedSuccesses = Math.max(0, Math.min(trials, successes));
  const p = boundedSuccesses / trials;
  const denominator = 1 + (z * z) / trials;
  const centre = p + (z * z) / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * trials)) / trials);
  return {
    low: Math.max(0, (centre - margin) / denominator),
    high: Math.min(1, (centre + margin) / denominator),
  };
}

