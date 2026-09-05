import { performance } from "node:perf_hooks";
import os from "node:os";
import { db } from "../../lib/pg";
import { listTargets } from "../../lib/sales/targets/store";
import { computeDataQualityMetrics } from "../../lib/sales/targets/hardening/storeAdditions";
import { getOperationalKpis } from "../../lib/sales/targets/metrics/operational";
import { listCoveragePartitions } from "../../lib/sales/targets/coverage/store";
import { allocatePartitions } from "../../lib/sales/targets/coverage/planner";
import {
  reconcileProviderCall,
  reserveProviderCall,
} from "../../lib/sales/targets/providers/policyStore";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  process.env.SALES_TARGET_PROVIDER_MAX_CONCURRENCY = "10";
  process.env.SALES_TARGET_MAX_CONCURRENCY = "20";
  process.env.SALES_TARGET_PROVIDER_REQUESTS_PER_DAY = "10000";
  process.env.SALES_TARGET_GLOBAL_REQUESTS_PER_DAY = "10000";
  process.env.SALES_TARGET_PROVIDER_DAILY_BUDGET_CENTS = "1000000";
  process.env.SALES_TARGET_DAILY_BUDGET_CENTS = "1000000";
  const results: Record<string, unknown> = {};
  const fixture = await sql<Record<string, unknown>[]>`
    SELECT
      (SELECT COUNT(*) FROM sales_target_companies) AS companies,
      (SELECT COUNT(*) FROM sales_target_lead_scores) AS scores,
      (SELECT COUNT(*) FROM sales_target_contacts) AS contacts,
      (SELECT COUNT(*) FROM sales_target_decision_makers) AS decision_makers,
      (SELECT COUNT(*) FROM sales_target_enrichment_jobs) AS jobs,
      (SELECT COUNT(*) FROM sales_target_raw_observations) AS observations,
      current_setting('server_version') AS postgres_version
  `;

  results.productionList = await sample(async () => {
    await listTargets({ limit: 100 });
  });
  results.filteredFts = await sample(async () => {
    await listTargets({ search: "Firma 999", limit: 100 });
  });
  results.exactDedupLookup = await sample(async () => {
    await sql`SELECT id FROM sales_target_companies WHERE fingerprint = 'perf:fingerprint:50000' LIMIT 1`;
  });
  results.observationIdempotencyLookup = await sample(async () => {
    await sql`
      SELECT id FROM sales_target_raw_observations
      WHERE idempotency_key = md5('idempotency:500000') LIMIT 1
    `;
  });
  results.skipLockedCandidate = await sample(async () => {
    await sql.begin(async (tx) => {
      await tx`
        SELECT id FROM sales_target_enrichment_jobs
        WHERE status = 'queued' AND next_attempt_at <= NOW()
        ORDER BY priority ASC, created_at ASC
        FOR UPDATE SKIP LOCKED LIMIT 1
      `;
    });
  });
  results.dashboardAggregation = await sample(() => computeDataQualityMetrics());
  results.kpiAggregation = await sample(() => getOperationalKpis(24));
  results.coveragePlannerSelection = await sample(async () => {
    const partitions = await listCoveragePartitions("de-nrw");
    allocatePartitions(partitions, { limit: 100 });
  });
  const provider = `benchmark_reservation_${Date.now().toString(36)}`;
  results.providerBudgetReservation = await sample(async (index) => {
    const reservation = await reserveProviderCall({
      provider,
      endpoint: "benchmark",
      idempotencyKey: `${provider}:${index}`,
      estimatedCostCents: 0,
    });
    await reconcileProviderCall({
      reservation,
      actualCostCents: 0,
      success: true,
      outcome: { benchmark: true },
    });
  });
  console.log(JSON.stringify({
    methodology: {
      samplesPerQuery: 40,
      warmupsPerQuery: 3,
      runtime: process.version,
      platform: `${os.platform()} ${os.release()} ${os.arch()}`,
      cpu: os.cpus()[0]?.model ?? "unknown",
      logicalCpus: os.cpus().length,
      memoryBytes: os.totalmem(),
      fixture: fixture[0],
    },
    results,
  }));
  await sql.end({ timeout: 5 });
}

async function sample(operation: (index: number) => Promise<unknown>) {
  for (let index = 0; index < 3; index++) await operation(-index - 1);
  const values: number[] = [];
  for (let index = 0; index < 40; index++) {
    const started = performance.now();
    await operation(index);
    values.push(performance.now() - started);
  }
  values.sort((a, b) => a - b);
  return {
    p50Ms: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    p99Ms: percentile(values, 0.99),
    minMs: values[0],
    maxMs: values.at(-1),
  };
}

function percentile(values: number[], quantile: number) {
  return values[Math.min(values.length - 1, Math.ceil(values.length * quantile) - 1)];
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
