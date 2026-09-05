import { performance } from "node:perf_hooks";
import { db } from "../../lib/pg";
import { listTargets } from "../../lib/sales/targets/store";

const FIXTURE_SIZE = 100_000;
const SAMPLES = 60;
const P95_BUDGET_MS = 300;

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");

  await sql`
    INSERT INTO sales_target_companies (
      id, name, industry, city, country, fingerprint, enrichment_status,
      is_chain, pre_score, pre_score_class, created_at, updated_at
    )
    SELECT
      'perf_target_' || value,
      'Firma ' || value,
      CASE value % 3 WHEN 0 THEN 'Immobilien' WHEN 1 THEN 'Handwerk' ELSE 'Beratung' END,
      CASE value % 4 WHEN 0 THEN 'Köln' WHEN 1 THEN 'Düsseldorf' WHEN 2 THEN 'Bonn' ELSE 'Essen' END,
      'DE',
      'perf:fingerprint:' || value,
      'DISCOVERED',
      FALSE,
      (value % 100)::integer,
      CASE value % 3 WHEN 0 THEN 'A' WHEN 1 THEN 'B' ELSE 'C' END,
      NOW() - (value || ' milliseconds')::interval,
      NOW() - (value || ' milliseconds')::interval
    FROM generate_series(1, ${FIXTURE_SIZE}::integer) AS series(value)
    ON CONFLICT (id) DO NOTHING
  `;
  await sql`
    INSERT INTO sales_target_company_summaries (
      target_id, canonical_name, canonical_city, canonical_industry,
      enrichment_state, total_score, priority_class, updated_at
    )
    SELECT
      id, name, city, industry, lower(enrichment_status),
      pre_score, pre_score_class, updated_at
    FROM sales_target_companies
    WHERE id LIKE 'perf_target_%'
    ON CONFLICT (target_id) DO UPDATE SET
      total_score = EXCLUDED.total_score,
      priority_class = EXCLUDED.priority_class,
      updated_at = EXCLUDED.updated_at
  `;
  await sql`ANALYZE sales_target_companies`;
  await sql`ANALYZE sales_target_company_summaries`;

  const unfiltered = await sample(() => listTargets({ limit: 100 }));
  const filtered = await sample(() =>
    listTargets({ search: "Firma 999", limit: 100 }),
  );
  const countRows = await sql<{ count: number }[]>`
    SELECT COUNT(*)::integer AS count
    FROM sales_target_companies
    WHERE id LIKE 'perf_target_%'
  `;
  const pass =
    countRows[0]?.count === FIXTURE_SIZE &&
    unfiltered.p95Ms <= P95_BUDGET_MS &&
    filtered.p95Ms <= P95_BUDGET_MS;

  console.log(JSON.stringify({
    fixtureCompanies: countRows[0]?.count ?? 0,
    samples: SAMPLES,
    budgetP95Ms: P95_BUDGET_MS,
    unfiltered,
    filtered,
    pass,
  }));
  await sql.end({ timeout: 5 });
  if (!pass) process.exitCode = 1;
}

async function sample(operation: () => Promise<unknown>) {
  for (let index = 0; index < 5; index++) await operation();
  const values: number[] = [];
  for (let index = 0; index < SAMPLES; index++) {
    const started = performance.now();
    await operation();
    values.push(performance.now() - started);
  }
  values.sort((a, b) => a - b);
  return {
    p50Ms: percentile(values, 0.5),
    p95Ms: percentile(values, 0.95),
    p99Ms: percentile(values, 0.99),
    maxMs: values.at(-1) ?? 0,
  };
}

function percentile(values: number[], quantile: number) {
  return values[Math.min(values.length - 1, Math.ceil(values.length * quantile) - 1)];
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
