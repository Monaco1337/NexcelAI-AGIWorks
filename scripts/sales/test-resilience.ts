import { db } from "../../lib/pg";
import { bulkIngestCompanies } from "../../lib/sales/targets/catalog/bulkIngest";
import { mergeCanonicalTargets, splitCanonicalTargets } from "../../lib/sales/targets/resolution/mergeService";
import {
  completeEnrichmentJob,
  reclaimExpiredEnrichmentJobs,
  replayDeadLetterEnrichmentJob,
  takeNextEnrichmentJob,
} from "../../lib/sales/targets/store";
import type { DiscoveredCompanyStub } from "../../lib/sales/targets/providers/types";
import { spawnSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import { runEnrichmentWorker } from "../../lib/sales/targets/jobs/workerRunner";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const suffix = Date.now().toString(36);

  const outageTarget = `resilience_outage_target_${suffix}`;
  const outageJob = `resilience_outage_job_${suffix}`;
  await sql`
    INSERT INTO sales_target_companies (id, name, fingerprint)
    VALUES (${outageTarget}, 'Database Outage Recovery GmbH', ${`resilience:outage:${suffix}`})
  `;
  await sql`
    INSERT INTO sales_target_enrichment_jobs (
      id, target_id, phase, status, priority, next_attempt_at
    ) VALUES (${outageJob}, ${outageTarget}, 'website_contact', 'queued', -2000000, NOW())
  `;
  const outageStarted = performance.now();
  const outage = spawnSync(
    process.execPath,
    ["--import", "tsx", "scripts/sales/test-db-outage-child.ts"],
    {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: "postgres://postgres:postgres@127.0.0.1:1/unavailable",
        POSTGRES_URL: "",
      },
      encoding: "utf8",
      timeout: 25_000,
    },
  );
  const outageElapsedMs = performance.now() - outageStarted;
  assert(outage.status === 1, `DB outage must fail in a bounded way: ${outage.stderr}`);
  assert(outageElapsedMs < 25_000, `DB outage exceeded bound: ${outageElapsedMs}ms`);
  const unchanged = await sql<{ status: string }[]>`
    SELECT status FROM sales_target_enrichment_jobs WHERE id = ${outageJob}
  `;
  assert(unchanged[0]?.status === "queued", "DB outage must not corrupt queued job");
  const recovered = await runEnrichmentWorker({
    batch: 1,
    maxMs: 10_000,
    workerId: `outage-recovery-${suffix}`,
  });
  assert(
    recovered.outcomes[0]?.jobId === outageJob && recovered.outcomes[0]?.success,
    "worker must recover after database restoration",
  );

  const replayTarget = `resilience_replay_target_${suffix}`;
  const replayJob = `resilience_replay_job_${suffix}`;
  await sql`
    INSERT INTO sales_target_companies (id, name, fingerprint)
    VALUES (${replayTarget}, 'Replay Test GmbH', ${`resilience:replay:${suffix}`})
  `;
  await sql`
    INSERT INTO sales_target_enrichment_jobs (
      id, target_id, phase, status, attempts, max_attempts,
      dead_lettered_at, error, priority, next_attempt_at
    ) VALUES (
      ${replayJob}, ${replayTarget}, 'website_contact', 'failed', 3, 3,
      NOW(), 'terminal test failure', -2000100, NOW()
    )
  `;
  assert(await replayDeadLetterEnrichmentJob(replayJob), "dead-letter job must replay once");
  assert(!await replayDeadLetterEnrichmentJob(replayJob), "dead-letter replay must be idempotent");
  const replayClaim = await takeNextEnrichmentJob({ workerId: `replay-worker-${suffix}` });
  assert(replayClaim?.id === replayJob && replayClaim.workerToken, "replayed job must be reclaimable");
  assert(await completeEnrichmentJob(replayJob, replayClaim.workerToken), "replayed job completion");
  assert(!await completeEnrichmentJob(replayJob, replayClaim.workerToken), "completion side effect must be idempotent");

  const interruptedTarget = `resilience_interrupt_target_${suffix}`;
  const interruptedJob = `resilience_interrupt_job_${suffix}`;
  await sql`
    INSERT INTO sales_target_companies (id, name, fingerprint)
    VALUES (${interruptedTarget}, 'Interrupted Worker GmbH', ${`resilience:interrupt:${suffix}`})
  `;
  await sql`
    INSERT INTO sales_target_enrichment_jobs (
      id, target_id, phase, status, priority, next_attempt_at
    ) VALUES (${interruptedJob}, ${interruptedTarget}, 'website_contact', 'queued', -2000200, NOW())
  `;
  const interruptedClaim = await takeNextEnrichmentJob({ workerId: `worker-a-${suffix}` });
  assert(interruptedClaim?.id === interruptedJob && interruptedClaim.workerToken, "worker A claim");
  await sql`
    UPDATE sales_target_enrichment_jobs SET lease_expires_at = NOW() - INTERVAL '1 second'
    WHERE id = ${interruptedJob}
  `;
  assert(await reclaimExpiredEnrichmentJobs() >= 1, "expired worker lease must be reclaimed");
  await sql`
    UPDATE sales_target_enrichment_jobs SET next_attempt_at = NOW()
    WHERE id = ${interruptedJob}
  `;
  const replacementClaim = await takeNextEnrichmentJob({ workerId: `worker-b-${suffix}` });
  assert(replacementClaim?.id === interruptedJob && replacementClaim.workerToken, "worker B reclaim");
  assert(
    !await completeEnrichmentJob(interruptedJob, interruptedClaim.workerToken),
    "stale worker token must not complete reclaimed job",
  );
  assert(
    await completeEnrichmentJob(interruptedJob, replacementClaim.workerToken),
    "replacement worker must complete job",
  );

  const primaryId = `resilience_primary_${suffix}`;
  const duplicateId = `resilience_duplicate_${suffix}`;
  const sourceId = `resilience_source_${suffix}`;
  const contactId = `resilience_contact_${suffix}`;
  const scoreId = `resilience_score_${suffix}`;
  await sql`
    INSERT INTO sales_target_companies (id, name, fingerprint)
    VALUES
      (${primaryId}, 'Canonical Primary GmbH', ${`resilience:primary:${suffix}`}),
      (${duplicateId}, 'Canonical Duplicate GmbH', ${`resilience:duplicate:${suffix}`})
  `;
  await sql`
    INSERT INTO sales_target_sources (id, target_id, field, value, provider, value_hash)
    VALUES (
      ${sourceId}, ${duplicateId}, 'phone', '+492311234', 'controlled_import',
      md5('phone|+492311234|controlled_import')
    )
  `;
  await sql`
    INSERT INTO sales_target_contacts (id, target_id, kind, value, source_id)
    VALUES (${contactId}, ${duplicateId}, 'phone', '+492311234', ${sourceId})
  `;
  await sql`
    INSERT INTO sales_target_lead_scores (
      id, target_id, total_score, priority_class, score_version, is_current
    ) VALUES (${scoreId}, ${duplicateId}, 70, 'A', 'v2', TRUE)
  `;
  const merge = await mergeCanonicalTargets({ primaryId, duplicateId });
  const merged = await sql<{ target_id: string; deleted: boolean; ledger_status: string }[]>`
    SELECT source.target_id, duplicate.deleted_at IS NOT NULL AS deleted,
           ledger.operation AS ledger_status
    FROM sales_target_sources source
    JOIN sales_target_companies duplicate ON duplicate.id = ${duplicateId}
    JOIN sales_target_merge_ledger ledger ON ledger.id = ${merge.ledgerId}
    WHERE source.id = ${sourceId}
  `;
  assert(
    merged[0]?.target_id === primaryId && merged[0]?.deleted && merged[0]?.ledger_status === "MERGE",
    "merge must move evidence and persist active ledger",
  );
  await splitCanonicalTargets({ primaryId, duplicateId });
  const restored = await sql<{
    source_target: string;
    contact_target: string;
    score_target: string;
    score_current: boolean;
    duplicate_active: boolean;
    reverted: boolean;
  }[]>`
    SELECT source.target_id AS source_target, contact.target_id AS contact_target,
           score.target_id AS score_target, score.is_current AS score_current,
           duplicate.deleted_at IS NULL AS duplicate_active,
           EXISTS (
             SELECT 1 FROM sales_target_merge_ledger reversal
             WHERE reversal.operation = 'UNMERGE' AND reversal.reverses_ledger_id = ledger.id
           ) AS reverted
    FROM sales_target_sources source
    JOIN sales_target_contacts contact ON contact.id = ${contactId}
    JOIN sales_target_lead_scores score ON score.id = ${scoreId}
    JOIN sales_target_companies duplicate ON duplicate.id = ${duplicateId}
    JOIN sales_target_merge_ledger ledger ON ledger.id = ${merge.ledgerId}
    WHERE source.id = ${sourceId}
  `;
  assert(
    restored[0]?.source_target === duplicateId &&
      restored[0]?.contact_target === duplicateId &&
      restored[0]?.score_target === duplicateId &&
      restored[0]?.score_current &&
      restored[0]?.duplicate_active &&
      restored[0]?.reverted,
    "split must restore exact evidence ownership and score state",
  );

  const duplicateStubs: DiscoveredCompanyStub[] = [];
  for (let unique = 0; unique < 20; unique++) {
    const stub: DiscoveredCompanyStub = {
      name: `Duplicate Slice ${suffix} ${unique} GmbH`,
      city: "Dortmund",
      postalCode: `44${String(unique).padStart(3, "0")}`,
      addressLine: `Teststraße ${unique}`,
      provider: "controlled_import",
      providerRawId: `${suffix}:${unique}`,
      confidence: 0.9,
    };
    duplicateStubs.push(...Array.from({ length: 5 }, () => ({ ...stub })));
  }
  const duplicateSlice = await bulkIngestCompanies(duplicateStubs, {
    searchJobId: null,
    region: "NRW",
  });
  const canonicalSlice = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM sales_target_companies
    WHERE fingerprint LIKE ${`%duplicate slice ${suffix}%`}
  `;
  assert(duplicateSlice.received === 100, "duplicate slice input size");
  assert(duplicateSlice.inserted === 20, `80% duplicate slice inserted ${duplicateSlice.inserted}`);
  assert(Number(canonicalSlice[0]?.count) === 20, "canonical table must retain one row per company");

  console.log(JSON.stringify({
    dbOutage: {
      boundedFailure: true,
      elapsedMs: outageElapsedMs,
      noCorruption: true,
      recovery: "PASS",
    },
    deadLetterReplay: "PASS",
    workerInterruptionRecovery: "PASS",
    staleTokenRejected: "PASS",
    duplicateCompletionRejected: "PASS",
    mergeSplitReversibility: "PASS",
    duplicateSlice: {
      raw: duplicateSlice.received,
      canonicalNew: duplicateSlice.inserted,
      duplicateRate: (duplicateSlice.received - duplicateSlice.inserted) / duplicateSlice.received,
    },
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
