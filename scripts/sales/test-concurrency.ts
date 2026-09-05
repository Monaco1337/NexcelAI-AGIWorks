import { db } from "../../lib/pg";
import { bulkIngestCompanies } from "../../lib/sales/targets/catalog/bulkIngest";
import {
  completeEnrichmentJob,
  enqueueEnrichment,
  reclaimExpiredEnrichmentJobs,
  takeNextEnrichmentJob,
} from "../../lib/sales/targets/store";
import type { DiscoveredCompanyStub } from "../../lib/sales/targets/providers/types";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const suffix = Date.now().toString(36);
  const externalRecordId = `concurrency-company-${suffix}`;
  const stub: DiscoveredCompanyStub = {
    name: `Concurrency Canonical ${suffix} GmbH`,
    website: `https://concurrency-${suffix}.example`,
    domain: `concurrency-${suffix}.example`,
    phone: "+49 231 5550199",
    addressLine: "Parallelstraße 1",
    postalCode: "44135",
    city: "Dortmund",
    country: "DE",
    provider: "controlled_import",
    providerRawId: externalRecordId,
    providerSourceUrl: `import://${suffix}/${externalRecordId}`,
    confidence: 0.95,
  };
  const ingests = await Promise.all(
    Array.from({ length: 12 }, () =>
      bulkIngestCompanies([stub], { searchJobId: null, region: "NRW" }),
    ),
  );
  const evidence = await sql<{
    observations: number;
    candidates: number;
    decisions: number;
    targets: number;
  }[]>`
    WITH observation AS (
      SELECT id, target_id
      FROM sales_target_raw_observations
      WHERE provider = 'controlled_import' AND external_record_id = ${externalRecordId}
    )
    SELECT
      (SELECT COUNT(*)::int FROM observation) AS observations,
      (SELECT COUNT(*)::int FROM sales_target_normalized_candidates candidate
       WHERE candidate.observation_id IN (SELECT id FROM observation)) AS candidates,
      (SELECT COUNT(*)::int FROM sales_target_resolution_decisions decision
       WHERE decision.candidate_id IN (
         SELECT id FROM sales_target_normalized_candidates
         WHERE observation_id IN (SELECT id FROM observation)
       )) AS decisions,
      (SELECT COUNT(DISTINCT target_id)::int FROM observation WHERE target_id IS NOT NULL) AS targets
  `;
  assert(ingests.reduce((sum, result) => sum + result.inserted, 0) === 1, "exactly one canonical insert");
  assert(evidence[0]?.observations === 1, "observation idempotency");
  assert(evidence[0]?.candidates === 1, "candidate idempotency");
  assert(evidence[0]?.decisions === 1, "resolution decision idempotency");
  assert(evidence[0]?.targets === 1, "canonical target uniqueness");

  const jobTargets = Array.from({ length: 12 }, (_, index) => `concurrency_job_target_${suffix}_${index}`);
  await sql`
    INSERT INTO sales_target_companies (id, name, fingerprint)
    SELECT value, 'Concurrent Job ' || ordinal || ' GmbH', 'concurrency:job:' || value
    FROM unnest(${jobTargets}::text[]) WITH ORDINALITY AS item(value, ordinal)
  `;
  await sql`
    INSERT INTO sales_target_enrichment_jobs (
      id, target_id, phase, status, priority, next_attempt_at
    )
    SELECT 'concurrency_job_' || ordinal || '_' || ${suffix},
           value, 'website_contact', 'queued', -10000, NOW()
    FROM unnest(${jobTargets}::text[]) WITH ORDINALITY AS item(value, ordinal)
  `;
  const claims = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      takeNextEnrichmentJob({ workerId: `concurrency-worker-${suffix}-${index}` }),
    ),
  );
  const claimed = claims.filter((claim): claim is NonNullable<typeof claim> => Boolean(claim));
  assert(claimed.length === 12, "twelve workers must claim twelve jobs");
  assert(new Set(claimed.map((claim) => claim.id)).size === claimed.length, "SKIP LOCKED distinct claims");

  const interrupted = claimed[0];
  for (const claim of claimed.slice(1)) {
    assert(
      claim.workerToken && await completeEnrichmentJob(claim.id, claim.workerToken),
      `complete non-interrupted claim ${claim.id}`,
    );
  }
  await sql`
    UPDATE sales_target_enrichment_jobs
    SET lease_expires_at = NOW() - INTERVAL '1 second'
    WHERE id = ${interrupted.id}
  `;
  assert(await reclaimExpiredEnrichmentJobs() >= 1, "expired lease reclaimed");
  await sql`
    UPDATE sales_target_enrichment_jobs SET next_attempt_at = NOW()
    WHERE id = ${interrupted.id}
  `;
  const reclaimed = await takeNextEnrichmentJob({ workerId: `replacement-${suffix}` });
  assert(reclaimed?.id === interrupted.id && reclaimed.workerToken, "interrupted job reclaimed");
  assert(
    !await completeEnrichmentJob(interrupted.id, interrupted.workerToken as string),
    "stale lease token rejected",
  );
  assert(
    await completeEnrichmentJob(reclaimed.id, reclaimed.workerToken),
    "replacement lease completes",
  );

  const enqueueTarget = jobTargets[11];
  await sql`
    UPDATE sales_target_enrichment_jobs
    SET status = 'done', finished_at = NOW()
    WHERE target_id = ${enqueueTarget}
  `;
  await Promise.all(
    Array.from({ length: 10 }, () =>
      enqueueEnrichment(enqueueTarget, "lead_score", { priority: 9999 }),
    ),
  );
  const activeEnqueues = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM sales_target_enrichment_jobs
    WHERE target_id = ${enqueueTarget} AND phase = 'lead_score'
      AND status IN ('queued', 'running')
  `;
  assert(Number(activeEnqueues[0]?.count) === 1, "same-phase concurrent enqueue deduplicated");

  console.log(JSON.stringify({
    canonicalWorkers: ingests.length,
    canonicalInserted: 1,
    observations: evidence[0]?.observations,
    candidates: evidence[0]?.candidates,
    resolutionDecisions: evidence[0]?.decisions,
    distinctJobClaims: claimed.length,
    leaseReclaimed: true,
    staleTokenRejected: true,
    samePhaseActiveJobs: Number(activeEnqueues[0]?.count),
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
