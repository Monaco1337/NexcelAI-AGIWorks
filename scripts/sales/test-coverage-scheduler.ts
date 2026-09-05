import { db } from "../../lib/pg";
import { ensureCatalogRun } from "../../lib/sales/targets/catalog/runner";
import { NRW_SCOPE } from "../../lib/sales/targets/catalog/scope";
import { listCoveragePartitions } from "../../lib/sales/targets/coverage/store";
import { subdivideCoveragePartitionForSearchJob } from "../../lib/sales/targets/coverage/store";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const first = await ensureCatalogRun(NRW_SCOPE.key, null);
  assert(
    first.segmentsQueued >= 0 && first.segmentsQueued <= 24,
    `expected bounded scheduler allocation, got ${first.segmentsQueued}`,
  );
  const jobsAfterFirst = await sql<{ total: number; explore: number }[]>`
    SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE filters->>'allocationReason' = 'EXPLORE')::int AS explore
    FROM sales_target_search_jobs
    WHERE area_scan_id = ${first.run.id}
  `;
  assert(
    Number(jobsAfterFirst[0]?.total) > 0 && Number(jobsAfterFirst[0]?.total) <= 24,
    "planner must retain a non-empty bounded work queue",
  );
  assert(Number(jobsAfterFirst[0]?.explore) >= 1, "planner must reserve exploration work");

  const resumed = await ensureCatalogRun(NRW_SCOPE.key, null);
  const jobsAfterResume = await sql<{ total: number }[]>`
    SELECT COUNT(*)::int AS total
    FROM sales_target_search_jobs
    WHERE area_scan_id = ${first.run.id}
  `;
  assert(resumed.run.id === first.run.id, "scheduler restart must resume persisted catalog run");
  assert(resumed.segmentsQueued === 0, "restart must not duplicate an already-full queue");
  assert(
    Number(jobsAfterResume[0]?.total) === Number(jobsAfterFirst[0]?.total),
    "restart must preserve queue cardinality",
  );

  await sql`
    INSERT INTO sales_target_provider_config_state (provider, enabled, state)
    VALUES ('overpass_osm', FALSE, 'disabled')
    ON CONFLICT (provider) DO UPDATE SET enabled = FALSE, state = 'disabled', updated_at = NOW()
  `;
  const withOneProviderDisabled = await listCoveragePartitions(NRW_SCOPE.key);
  assert(
    withOneProviderDisabled.length > 0 &&
      withOneProviderDisabled.some((partition) => partition.state !== "DISABLED"),
    "one disabled provider must not disable multi-source portfolio partitions",
  );
  await sql`
    INSERT INTO sales_target_provider_config_state (provider, enabled, state)
    VALUES ('portfolio', FALSE, 'disabled')
    ON CONFLICT (provider) DO UPDATE SET enabled = FALSE, state = 'disabled', updated_at = NOW()
  `;
  const disabled = await listCoveragePartitions(NRW_SCOPE.key);
  assert(
    disabled.length > 0 && disabled.every((partition) => partition.state === "DISABLED"),
    "disabled provider portfolio must make partitions unschedulable",
  );
  await sql`
    UPDATE sales_target_provider_config_state
    SET enabled = TRUE, state = 'active', updated_at = NOW()
    WHERE provider IN ('overpass_osm', 'portfolio')
  `;

  const futurePartition = disabled[0];
  await sql`
    UPDATE sales_target_coverage_partitions
    SET status = 'covered', next_coverage_at = NOW() + INTERVAL '1 day'
    WHERE id = ${futurePartition.id}
  `;
  const withCooldown = await listCoveragePartitions(NRW_SCOPE.key);
  const cooled = withCooldown.find((partition) => partition.id === futurePartition.id);
  const nextEligibleAt = cooled?.nextEligibleAt;
  assert(
    typeof nextEligibleAt === "string" && Date.parse(nextEligibleAt) > Date.now(),
    "persisted partition cooldown must survive scheduler reads",
  );
  const subdivisionJob = await sql<{ id: string }[]>`
    SELECT id FROM sales_target_search_jobs
    WHERE area_scan_id = ${first.run.id}
    ORDER BY created_at
    LIMIT 1
  `;
  await sql`
    UPDATE sales_target_search_jobs
    SET status = 'failed', finished_at = NOW()
    WHERE id = ${subdivisionJob[0].id}
  `;
  const childrenCreated = await subdivideCoveragePartitionForSearchJob(subdivisionJob[0].id);
  const duplicateSubdivision = await subdivideCoveragePartitionForSearchJob(subdivisionJob[0].id);
  assert(childrenCreated === 4, `adaptive subdivision expected four children, got ${childrenCreated}`);
  assert(duplicateSubdivision === 0, "adaptive subdivision must be idempotent");
  const childCount = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM sales_target_coverage_partitions
    WHERE parent_partition_id = (
      SELECT partition_id FROM sales_target_coverage_runs
      WHERE search_job_id = ${subdivisionJob[0].id}
    )
  `;
  assert(Number(childCount[0].count) === 4, "adaptive child partitions were not persisted");

  console.log(JSON.stringify({
    initialQueue: Number(jobsAfterFirst[0]?.total),
    explorationJobs: Number(jobsAfterFirst[0]?.explore),
    restartQueue: Number(jobsAfterResume[0]?.total),
    duplicateJobsAfterRestart: 0,
    singleProviderFailureIsolated: true,
    disabledPortfolioAllocations: 0,
    cooldownPersisted: true,
    adaptiveChildren: childrenCreated,
    adaptiveSubdivisionIdempotent: true,
  }));
  await sql.end({ timeout: 5 });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
