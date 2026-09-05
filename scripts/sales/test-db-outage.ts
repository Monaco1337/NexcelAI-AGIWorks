import { db } from "../../lib/pg";
import {
  completeEnrichmentJob,
  reclaimExpiredEnrichmentJobs,
  takeNextEnrichmentJob,
} from "../../lib/sales/targets/store";

const mode = process.argv[2];
const runId = process.env.DB_OUTAGE_RUN_ID ?? "manual";
const targetId = `db_outage_target_${runId}`;
const jobId = `db_outage_job_${runId}`;

async function main() {
  if (mode === "probe") {
    const started = Date.now();
    try {
      const sql = await db();
      if (!sql) throw new Error("database unavailable");
      await sql`SELECT 1`;
      throw new Error("outage probe unexpectedly reached PostgreSQL");
    } catch (error) {
      const elapsedMs = Date.now() - started;
      if (error instanceof Error && error.message.includes("unexpectedly reached")) throw error;
      if (elapsedMs > 12_000) throw new Error(`database failure was not bounded: ${elapsedMs}ms`);
      console.log(JSON.stringify({ dbOutageBounded: true, elapsedMs }));
      return;
    }
  }

  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  if (mode === "setup") {
    await sql`
      INSERT INTO sales_target_companies (id, name, fingerprint)
      VALUES (${targetId}, 'DB Outage Worker GmbH', ${`db-outage:${runId}`})
      ON CONFLICT (id) DO NOTHING
    `;
    await sql`
      INSERT INTO sales_target_enrichment_jobs (
        id, target_id, phase, status, priority, next_attempt_at
      ) VALUES (${jobId}, ${targetId}, 'website_contact', 'queued', 0, NOW())
      ON CONFLICT (id) DO UPDATE SET
        status = 'queued', priority = 0, next_attempt_at = NOW(),
        lease_owner = NULL, lease_token = NULL, lease_expires_at = NULL
    `;
    const claimed = await takeNextEnrichmentJob({ workerId: `db-outage-worker-a-${runId}` });
    if (claimed?.id !== jobId) throw new Error(`expected ${jobId}, claimed ${claimed?.id ?? "none"}`);
    console.log(JSON.stringify({ setup: true, jobId, leaseToken: claimed.workerToken }));
  } else if (mode === "recover") {
    await sql`
      UPDATE sales_target_enrichment_jobs
      SET lease_expires_at = NOW() - INTERVAL '1 second'
      WHERE id = ${jobId} AND status = 'running'
    `;
    const reclaimed = await reclaimExpiredEnrichmentJobs();
    await sql`
      UPDATE sales_target_enrichment_jobs SET next_attempt_at = NOW()
      WHERE id = ${jobId}
    `;
    const claimed = await takeNextEnrichmentJob({ workerId: `db-outage-worker-b-${runId}` });
    if (claimed?.id !== jobId || !claimed.workerToken) throw new Error("job was not recoverable");
    if (!await completeEnrichmentJob(jobId, claimed.workerToken)) throw new Error("recovered job did not complete");
    const rows = await sql<{ status: string; count: number }[]>`
      SELECT status, COUNT(*) OVER ()::int AS count
      FROM sales_target_enrichment_jobs WHERE id = ${jobId}
    `;
    if (rows[0]?.status !== "done" || Number(rows[0]?.count) !== 1) {
      throw new Error("recovery corrupted job state");
    }
    console.log(JSON.stringify({ recovered: true, reclaimed, status: rows[0].status, rowCount: 1 }));
  } else {
    throw new Error("Usage: test-db-outage.ts setup|probe|recover");
  }
  await sql.end({ timeout: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
