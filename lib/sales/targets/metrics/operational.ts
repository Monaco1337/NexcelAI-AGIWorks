import { db } from "@/lib/pg";

export interface OperationalKpis {
  windowHours: number;
  provider: Array<{
    provider: string;
    requests: number;
    successes: number;
    errors: number;
    successRate: number | null;
    errorRate: number | null;
    latencyP50Ms: number | null;
    latencyP95Ms: number | null;
    rawYield: number;
    rawPerRequest: number | null;
    providerObserved: number;
    contractRejected: number;
    contractAcceptanceRate: number | null;
    estimatedCostCents: number;
    actualCostCents: number;
    state: string;
    failureRate1h: number | null;
    failureRate24h: number | null;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    nextProbeAt: string | null;
  }>;
  budgets: Array<{
    provider: string;
    scopeKind: string;
    scopeKey: string;
    limitCents: number;
    reservedCents: number;
    spentCents: number;
    utilization: number | null;
  }>;
  economics: {
    actualCostCents: number;
    canonicalNew: number;
    qualifiedNew: number;
    costPerCanonicalNewCents: number | null;
    costPerQualifiedCents: number | null;
  };
  funnel: {
    rawObservations: number;
    canonicalNew: number;
    qualifiedNew: number;
    salesReady: number;
    duplicateRate: number | null;
    qualificationRate: number | null;
  };
  qualityFunnel: {
    canonical: number;
    geoValid: number;
    websiteDiscovered: number;
    websiteAudited: number;
    verifiedContactable: number;
    decisionMakerFound: number;
    qualified: number;
    salesReady: number;
    humanReviewedAccepted: number;
  };
  backlog: { count: number; oldestAgeSeconds: number };
  leaseReclaims: number;
  terminalFailures: number;
  coverage: {
    observations: number;
    canonicalNew: number;
    duplicates: number;
    marginalNewYield: number | null;
    duplicateRate: number | null;
  };
  controller: {
    capacitySource: string | null;
    capacityStatus: string | null;
    sampleCount: number | null;
    forecastConfidence: { low: number; high: number } | null;
    observedAt: string | null;
  };
  generatedAt: string;
}

export async function getOperationalKpis(windowHours = 24): Promise<OperationalKpis> {
  const sql = await db();
  if (!sql) return empty(windowHours);
  const intervalHours = Math.max(1, Math.min(24 * 30, Math.floor(windowHours)));
  const [providers, budgets, totals, jobs, coverage, controller, quality] = await Promise.all([
    sql<Record<string, unknown>[]>`
      WITH request AS (
        SELECT provider,
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
          )::int AS requests,
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
              AND error IS NULL
              AND (response_status IS NULL OR response_status BETWEEN 200 AND 299)
          )::int AS successes,
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
              AND (
                error IS NOT NULL
                OR (response_status IS NOT NULL AND response_status NOT BETWEEN 200 AND 299)
              )
          )::int AS errors,
          percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms)
            FILTER (
              WHERE latency_ms IS NOT NULL
                AND created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
            ) AS latency_p50,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms)
            FILTER (
              WHERE latency_ms IS NOT NULL
                AND created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
            ) AS latency_p95,
          COALESCE(SUM(estimated_cost_cents) FILTER (
            WHERE created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
          ), 0)::bigint AS estimated_cost,
          COALESCE(SUM(cost_cents) FILTER (
            WHERE created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
          ), 0)::bigint AS actual_cost,
          COALESCE(SUM(provider_observed_count) FILTER (
            WHERE created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
          ), 0)::bigint AS provider_observed,
          COALESCE(SUM(contract_rejected_count) FILTER (
            WHERE created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
          ), 0)::bigint AS contract_rejected,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '1 hour')::int AS requests_1h,
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - INTERVAL '1 hour'
              AND (error IS NOT NULL OR response_status NOT BETWEEN 200 AND 299)
          )::int AS failures_1h,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours')::int AS requests_24h,
          COUNT(*) FILTER (
            WHERE created_at >= NOW() - INTERVAL '24 hours'
              AND (error IS NOT NULL OR response_status NOT BETWEEN 200 AND 299)
          )::int AS failures_24h
        FROM sales_target_provider_requests
        WHERE created_at >= NOW() - (GREATEST(${intervalHours}, 24) * INTERVAL '1 hour')
        GROUP BY provider
      ),
      raw AS (
        SELECT dimensions->>'provider' AS provider, COALESCE(SUM(value), 0)::bigint AS raw_yield
        FROM sales_target_metric_events
        WHERE metric_key = 'RAW_OBSERVED'
          AND occurred_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
        GROUP BY dimensions->>'provider'
      )
      SELECT request.*, COALESCE(raw.raw_yield, 0)::bigint AS raw_yield,
             COALESCE(health.state, 'UNKNOWN') AS provider_state,
             health.last_success_at, health.last_failure_at, health.cooldown_until
      FROM request
      LEFT JOIN raw ON raw.provider = request.provider
      LEFT JOIN sales_target_provider_health health ON health.provider = request.provider
      ORDER BY request.provider
    `,
    sql<Record<string, unknown>[]>`
      SELECT provider, scope_kind, scope_key, limit_cents, reserved_cents, spent_cents
      FROM sales_target_provider_budgets
      WHERE period_start <= NOW() AND period_end > NOW()
      ORDER BY provider, scope_kind, scope_key
    `,
    sql<Record<string, unknown>[]>`
      SELECT
        COALESCE((SELECT SUM(cost_cents) FROM sales_target_provider_requests
          WHERE created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')), 0)::bigint AS actual_cost,
        COALESCE((SELECT SUM(value) FROM sales_target_metric_events
          WHERE metric_key = 'CANONICAL_CREATED'
            AND occurred_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')), 0)::bigint AS canonical_new,
        COALESCE((SELECT SUM(value) FROM sales_target_metric_events
          WHERE metric_key = 'FIRST_QUALIFIED'
            AND occurred_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')), 0)::bigint AS qualified_new,
        COALESCE((SELECT SUM(value) FROM sales_target_metric_events
          WHERE metric_key = 'RAW_OBSERVED'
            AND occurred_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')), 0)::bigint AS raw_observations,
        COALESCE((SELECT SUM(value) FROM sales_target_metric_events
          WHERE metric_key = 'FIRST_SALES_READY'
            AND occurred_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')), 0)::bigint AS sales_ready
    `,
    sql<Record<string, unknown>[]>`
      SELECT
        COUNT(*) FILTER (WHERE status = 'queued')::int AS backlog_count,
        COALESCE(EXTRACT(EPOCH FROM (
          NOW() - MIN(created_at) FILTER (WHERE status = 'queued')
        )), 0) AS backlog_age,
        COUNT(*) FILTER (
          WHERE last_error_code = 'LEASE_EXPIRED'
            AND updated_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
        )::int AS lease_reclaims,
        COUNT(*) FILTER (
          WHERE status = 'failed' AND dead_lettered_at IS NOT NULL
            AND updated_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
        )::int AS terminal_failures
      FROM sales_target_enrichment_jobs
    `,
    sql<Record<string, unknown>[]>`
      SELECT COALESCE(SUM(observation_count), 0)::bigint AS observations,
             COALESCE(SUM(new_target_count), 0)::bigint AS canonical_new,
             COALESCE(SUM(matched_target_count), 0)::bigint AS duplicates
      FROM sales_target_coverage_runs
      WHERE COALESCE(finished_at, created_at) >= NOW() - (${intervalHours} * INTERVAL '1 hour')
    `,
    sql<Record<string, unknown>[]>`
      SELECT observed_state->>'capacitySource' AS capacity_source,
             observed_state->>'capacityStatus' AS capacity_status,
             observed_state->'capacityEvidence'->>'sampleCount' AS sample_count,
             observed_state->'capacityEvidence'->'qualificationRate95Percent' AS confidence,
             created_at
      FROM sales_target_controller_snapshots
      ORDER BY created_at DESC
      LIMIT 1
    `,
    sql<Record<string, unknown>[]>`
      WITH cohort AS (
        SELECT id, website, latitude, longitude
        FROM sales_target_companies
        WHERE deleted_at IS NULL
          AND created_at >= NOW() - (${intervalHours} * INTERVAL '1 hour')
      )
      SELECT
        COUNT(*)::int AS canonical,
        COUNT(*) FILTER (
          WHERE latitude BETWEEN 50.32 AND 52.53
            AND longitude BETWEEN 5.87 AND 9.46
        )::int AS geo_valid,
        COUNT(*) FILTER (
          WHERE website IS NOT NULL
            OR EXISTS (
              SELECT 1 FROM sales_target_contacts contact
              WHERE contact.target_id = cohort.id
                AND contact.deleted_at IS NULL AND contact.kind = 'website'
            )
        )::int AS website_discovered,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM sales_target_website_audits audit
            WHERE audit.target_id = cohort.id AND audit.error IS NULL
          )
        )::int AS website_audited,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM sales_target_contacts contact
            WHERE contact.target_id = cohort.id AND contact.deleted_at IS NULL
              AND contact.kind IN ('phone','mobile','email')
              AND contact.verification_status IN ('verified','high')
          )
        )::int AS verified_contactable,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM sales_target_decision_makers maker
            WHERE maker.target_id = cohort.id AND maker.deleted_at IS NULL
              AND maker.confidence >= 0.6
          )
        )::int AS decision_maker_found,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM sales_target_metric_events metric
            WHERE metric.target_id = cohort.id AND metric.metric_key = 'FIRST_QUALIFIED'
          )
        )::int AS qualified,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM sales_target_metric_events metric
            WHERE metric.target_id = cohort.id AND metric.metric_key = 'FIRST_SALES_READY'
          )
        )::int AS sales_ready,
        COUNT(*) FILTER (
          WHERE EXISTS (
            SELECT 1 FROM sales_target_evaluations evaluation
            WHERE evaluation.target_id = cohort.id AND evaluation.would_contact = TRUE
          )
        )::int AS human_reviewed_accepted
      FROM cohort
    `,
  ]);
  const total = totals[0] ?? {};
  const actualCost = Number(total.actual_cost ?? 0);
  const canonicalNew = Number(total.canonical_new ?? 0);
  const qualifiedNew = Number(total.qualified_new ?? 0);
  const coverageRow = coverage[0] ?? {};
  const observations = Number(coverageRow.observations ?? 0);
  const coverageNew = Number(coverageRow.canonical_new ?? 0);
  const duplicates = Number(coverageRow.duplicates ?? 0);
  const controllerRow = controller[0] ?? {};
  const qualityRow = quality[0] ?? {};
  return {
    windowHours: intervalHours,
    provider: providers.map((row) => {
      const requests = Number(row.requests ?? 0);
      const successes = Number(row.successes ?? 0);
      const errors = Number(row.errors ?? 0);
      const rawYield = Number(row.raw_yield ?? 0);
      const providerObserved = Number(row.provider_observed ?? 0);
      const contractRejected = Number(row.contract_rejected ?? 0);
      return {
        provider: String(row.provider),
        requests,
        successes,
        errors,
        successRate: ratio(successes, requests),
        errorRate: ratio(errors, requests),
        latencyP50Ms: nullable(row.latency_p50),
        latencyP95Ms: nullable(row.latency_p95),
        rawYield,
        rawPerRequest: ratio(rawYield, requests),
        providerObserved,
        contractRejected,
        contractAcceptanceRate: ratio(providerObserved - contractRejected, providerObserved),
        estimatedCostCents: Number(row.estimated_cost ?? 0),
        actualCostCents: Number(row.actual_cost ?? 0),
        state: String(row.provider_state ?? "UNKNOWN"),
        failureRate1h: ratio(Number(row.failures_1h ?? 0), Number(row.requests_1h ?? 0)),
        failureRate24h: ratio(Number(row.failures_24h ?? 0), Number(row.requests_24h ?? 0)),
        lastSuccessAt: isoOrNull(row.last_success_at),
        lastFailureAt: isoOrNull(row.last_failure_at),
        nextProbeAt: isoOrNull(row.cooldown_until),
      };
    }),
    budgets: budgets.map((row) => ({
      provider: String(row.provider),
      scopeKind: String(row.scope_kind),
      scopeKey: String(row.scope_key),
      limitCents: Number(row.limit_cents),
      reservedCents: Number(row.reserved_cents),
      spentCents: Number(row.spent_cents),
      utilization: ratio(
        Number(row.reserved_cents ?? 0) + Number(row.spent_cents ?? 0),
        Number(row.limit_cents ?? 0),
      ),
    })),
    economics: {
      actualCostCents: actualCost,
      canonicalNew,
      qualifiedNew,
      costPerCanonicalNewCents: ratio(actualCost, canonicalNew),
      costPerQualifiedCents: ratio(actualCost, qualifiedNew),
    },
    funnel: {
      rawObservations: Number(total.raw_observations ?? 0),
      canonicalNew,
      qualifiedNew,
      salesReady: Number(total.sales_ready ?? 0),
      duplicateRate: ratio(duplicates, observations),
      qualificationRate: ratio(qualifiedNew, canonicalNew),
    },
    qualityFunnel: {
      canonical: Number(qualityRow.canonical ?? 0),
      geoValid: Number(qualityRow.geo_valid ?? 0),
      websiteDiscovered: Number(qualityRow.website_discovered ?? 0),
      websiteAudited: Number(qualityRow.website_audited ?? 0),
      verifiedContactable: Number(qualityRow.verified_contactable ?? 0),
      decisionMakerFound: Number(qualityRow.decision_maker_found ?? 0),
      qualified: Number(qualityRow.qualified ?? 0),
      salesReady: Number(qualityRow.sales_ready ?? 0),
      humanReviewedAccepted: Number(qualityRow.human_reviewed_accepted ?? 0),
    },
    backlog: {
      count: Number(jobs[0]?.backlog_count ?? 0),
      oldestAgeSeconds: Number(jobs[0]?.backlog_age ?? 0),
    },
    leaseReclaims: Number(jobs[0]?.lease_reclaims ?? 0),
    terminalFailures: Number(jobs[0]?.terminal_failures ?? 0),
    coverage: {
      observations,
      canonicalNew: coverageNew,
      duplicates,
      marginalNewYield: ratio(coverageNew, observations),
      duplicateRate: ratio(duplicates, observations),
    },
    controller: {
      capacitySource: stringOrNull(controllerRow.capacity_source),
      capacityStatus: stringOrNull(controllerRow.capacity_status),
      sampleCount: nullable(controllerRow.sample_count),
      forecastConfidence: asConfidence(controllerRow.confidence),
      observedAt: controllerRow.created_at instanceof Date
        ? controllerRow.created_at.toISOString()
        : stringOrNull(controllerRow.created_at),
    },
    generatedAt: new Date().toISOString(),
  };
}

function empty(windowHours: number): OperationalKpis {
  return {
    windowHours, provider: [], budgets: [],
    economics: {
      actualCostCents: 0, canonicalNew: 0, qualifiedNew: 0,
      costPerCanonicalNewCents: null, costPerQualifiedCents: null,
    },
    funnel: {
      rawObservations: 0, canonicalNew: 0, qualifiedNew: 0, salesReady: 0,
      duplicateRate: null, qualificationRate: null,
    },
    qualityFunnel: {
      canonical: 0, geoValid: 0, websiteDiscovered: 0, websiteAudited: 0,
      verifiedContactable: 0, decisionMakerFound: 0, qualified: 0,
      salesReady: 0, humanReviewedAccepted: 0,
    },
    backlog: { count: 0, oldestAgeSeconds: 0 },
    leaseReclaims: 0, terminalFailures: 0,
    coverage: {
      observations: 0, canonicalNew: 0, duplicates: 0,
      marginalNewYield: null, duplicateRate: null,
    },
    controller: {
      capacitySource: null, capacityStatus: "INSUFFICIENT_EVIDENCE",
      sampleCount: null, forecastConfidence: null, observedAt: null,
    },
    generatedAt: new Date().toISOString(),
  };
}

function ratio(numerator: number, denominator: number): number | null {
  return denominator > 0 ? numerator / denominator : null;
}

function nullable(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function isoOrNull(value: unknown): string | null {
  if (value instanceof Date) return value.toISOString();
  const text = stringOrNull(value);
  if (!text || !Number.isFinite(Date.parse(text))) return null;
  return new Date(text).toISOString();
}

function asConfidence(value: unknown): { low: number; high: number } | null {
  if (!value || typeof value !== "object") return null;
  const confidence = value as Record<string, unknown>;
  const low = nullable(confidence.low);
  const high = nullable(confidence.high);
  return low === null || high === null ? null : { low, high };
}
