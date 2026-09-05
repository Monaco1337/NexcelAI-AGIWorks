import { db } from "../../lib/pg";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const runId = process.env.CANARY_RUN_ID;
  if (!runId) throw new Error("CANARY_RUN_ID is required");
  const jobs = await sql<{ id: string; label: string; filters: Record<string, unknown> }[]>`
    SELECT id, label, filters FROM sales_target_search_jobs
    WHERE id LIKE ${`${runId}_%`} ORDER BY created_at
  `;
  if (jobs.length === 0) throw new Error(`No jobs found for ${runId}`);
  const jobIds = jobs.map((job) => job.id);
  const targets = await sql<Record<string, unknown>[]>`
    SELECT target.id, target.name, target.website, target.phone, target.email,
           target.address_line, target.city, target.enrichment_status,
           score.total_score, score.priority_class,
           qualification.decision AS qualification_decision,
           qualification.reason_codes AS qualification_reasons,
           qualification.confidence AS qualification_confidence
    FROM sales_target_companies target
    LEFT JOIN LATERAL (
      SELECT total_score, priority_class FROM sales_target_lead_scores
      WHERE target_id = target.id AND is_current = TRUE
      ORDER BY (score_version = 'v2') DESC, calculated_at DESC LIMIT 1
    ) score ON TRUE
    LEFT JOIN LATERAL (
      SELECT decision, reason_codes, confidence
      FROM sales_target_qualification_decisions
      WHERE target_id = target.id ORDER BY decided_at DESC LIMIT 1
    ) qualification ON TRUE
    WHERE target.origin_search_job_id = ANY(${jobIds})
    ORDER BY target.name
  `;
  const targetIds = targets.map((target) => String(target.id));
  const coverage = await sql<Record<string, unknown>[]>`
    SELECT search_job_id, partition_id, observation_count, new_target_count,
           matched_target_count, estimated_cost_cents, actual_cost_cents
    FROM sales_target_coverage_runs WHERE search_job_id = ANY(${jobIds})
    ORDER BY created_at
  `;
  const requests = await sql<Record<string, unknown>[]>`
    SELECT provider, latency_ms, error, estimated_cost_cents, cost_cents
    FROM sales_target_provider_requests
    WHERE search_job_id = ANY(${jobIds}) OR target_id = ANY(${targetIds})
    ORDER BY created_at
  `;
  const discovery = requests.filter((row) => row.provider === "overpass_osm");
  const latencies = discovery.map((row) => Number(row.latency_ms)).filter(Number.isFinite).sort((a, b) => a - b);
  const raw = coverage.reduce((sum, row) => sum + Number(row.observation_count ?? 0), 0);
  const canonicalNew = coverage.reduce((sum, row) => sum + Number(row.new_target_count ?? 0), 0);
  const duplicates = coverage.reduce((sum, row) => sum + Number(row.matched_target_count ?? 0), 0);
  const qualified = targets.filter((row) => row.qualification_decision === "QUALIFIED").length;
  const result = {
    runId,
    timeSlices: 1,
    geographies: jobs.map((job) => `${job.filters?.catalogSegment ?? "unknown"}`),
    categories: [...new Set(jobs.map((job) => String(job.filters?.tagAxis ?? "unknown")))],
    sampleSize: targets.length,
    requests: discovery.length,
    raw,
    canonicalNew,
    duplicates,
    qualification: {
      qualified,
      disqualified: targets.filter((row) => row.qualification_decision === "DISQUALIFIED").length,
      reviewRequired: targets.filter((row) => row.qualification_decision === "REVIEW_REQUIRED").length,
      deferredOrMissing: targets.filter((row) =>
        row.qualification_decision === "DEFERRED" || !row.qualification_decision
      ).length,
      uncertainty95Percent: wilson(qualified, Math.max(1, targets.length)),
    },
    salesReady: targets.filter((row) => row.enrichment_status === "READY").length,
    providerFailures: discovery.filter((row) => Boolean(row.error)).length,
    latencyMs: { p50: percentile(latencies, 0.5), p95: percentile(latencies, 0.95) },
    estimatedCostCents: requests.reduce((sum, row) => sum + Number(row.estimated_cost_cents ?? 0), 0),
    actualCostCents: requests.reduce((sum, row) => sum + Number(row.cost_cents ?? 0), 0),
    traces: targets,
  };
  console.log(JSON.stringify(result));
  await sql.end({ timeout: 5 });
}

function percentile(values: number[], quantile: number): number | null {
  return values.length
    ? values[Math.min(values.length - 1, Math.ceil(values.length * quantile) - 1)]
    : null;
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
