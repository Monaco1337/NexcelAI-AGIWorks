import { db, jsonParam } from "../../lib/pg";
import { buildSegments, NRW_SCOPE } from "../../lib/sales/targets/catalog/scope";
import { bulkIngestCompanies } from "../../lib/sales/targets/catalog/bulkIngest";
import {
  completeCoverageRunForSearchJob,
  createCoverageRunForSearchJob,
  ensureCoveragePartitions,
  listCoveragePartitions,
} from "../../lib/sales/targets/coverage/store";
import { allocatePartitions } from "../../lib/sales/targets/coverage/planner";
import type { DiscoveredCompanyStub } from "../../lib/sales/targets/providers/types";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  await ensureCoveragePartitions(NRW_SCOPE);
  const [highSegment, duplicateSegment] = buildSegments(NRW_SCOPE);
  const suffix = Date.now().toString(36);
  const before = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM sales_target_companies
  `;
  const high = stubs(`High ${suffix}`, 20, highSegment.tagAxis);
  const duplicateUnique = stubs(`Duplicate ${suffix}`, 20, duplicateSegment.tagAxis);
  const duplicateSlice = Array.from({ length: 100 }, (_, index) => duplicateUnique[index % 20]);
  const highJob = `dup_high_${suffix}`;
  const duplicateJob = `dup_slice_${suffix}`;
  for (const [jobId, segment] of [[highJob, highSegment], [duplicateJob, duplicateSegment]] as const) {
    await sql`
      INSERT INTO sales_target_search_jobs (id, label, country, filters, limit_count)
      VALUES (
        ${jobId}, ${jobId}, 'DE',
        ${sql.json(jsonParam({ catalogSegment: segment.key }))}, 100
      )
    `;
    await createCoverageRunForSearchJob({
      scopeKey: NRW_SCOPE.key,
      partitionKey: segment.key,
      searchJobId: jobId,
    });
  }
  const highResult = await bulkIngestCompanies(high, { searchJobId: highJob, region: "NRW" });
  await completeCoverageRunForSearchJob({
    searchJobId: highJob,
    status: "completed",
    observations: highResult.received,
    candidates: highResult.received,
    newTargets: highResult.inserted,
    matchedTargets: highResult.duplicates,
    estimatedCostCents: 0,
    actualCostCents: 0,
  });
  const duplicateResult = await bulkIngestCompanies(duplicateSlice, {
    searchJobId: duplicateJob,
    region: "NRW",
  });
  await completeCoverageRunForSearchJob({
    searchJobId: duplicateJob,
    status: "completed",
    observations: duplicateResult.received,
    candidates: duplicateResult.received,
    newTargets: duplicateResult.inserted,
    matchedTargets: duplicateResult.duplicates,
    estimatedCostCents: 0,
    actualCostCents: 0,
  });
  const partitions = await listCoveragePartitions(NRW_SCOPE.key);
  const allocation = allocatePartitions(partitions, {
    limit: partitions.length,
    explorationFraction: 0,
    now: new Date(Date.now() + 2 * 60 * 60 * 1000),
  });
  const highPartitionId = partitions.find((item) => item.geographyKey === highSegment.key)?.id;
  const duplicatePartitionId = partitions.find((item) => item.geographyKey === duplicateSegment.key)?.id;
  const highAllocation = allocation.find((item) => item.partitionId === highPartitionId);
  const duplicateAllocation = allocation.find((item) => item.partitionId === duplicatePartitionId);
  const highScore = highAllocation?.score ?? 0;
  const duplicateScore = duplicateAllocation?.score ?? 0;
  const after = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM sales_target_companies
  `;
  assert(duplicateResult.received === 100, "duplicate fixture did not contain 100 observations");
  assert(duplicateResult.duplicates === 80, `expected 80 duplicates, got ${duplicateResult.duplicates}`);
  assert(Number(after[0].count) - Number(before[0].count) === 40, "canonical table contains duplicate side effects");
  assert(
    highAllocation && duplicateAllocation
      && duplicateScore < highScore
      && duplicateAllocation.rank > highAllocation.rank,
    "planner did not reduce allocation for duplicate-heavy slice",
  );
  console.log(JSON.stringify({
    duplicateRate: duplicateResult.duplicates / duplicateResult.received,
    canonicalAdded: Number(after[0].count) - Number(before[0].count),
    highYieldAllocation: { rank: highAllocation.rank, score: highScore },
    duplicateHeavyAllocation: { rank: duplicateAllocation.rank, score: duplicateScore },
    plannerReducedAllocation: true,
  }));
  await sql.end({ timeout: 5 });
}

function stubs(prefix: string, count: number, category: string): DiscoveredCompanyStub[] {
  return Array.from({ length: count }, (_, index) => ({
    name: `${prefix} ${index} GmbH`,
    city: "Dortmund",
    country: "DE",
    addressLine: `Teststraße ${index + 1}`,
    postalCode: "44135",
    provider: "controlled_import",
    providerRawId: `${prefix}:${index}`,
    providerSourceUrl: "urn:nexcel:acceptance:duplicate-slice",
    confidence: 0.9,
    subIndustry: category,
    signals: [],
  }));
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
