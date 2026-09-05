import { runEnrichmentWorker } from "../../lib/sales/targets/jobs/workerRunner";

const startedAt = Date.now();

runEnrichmentWorker({ batch: 1, maxMs: 5_000, workerId: "db-outage-child" })
  .then(() => {
    console.error("worker unexpectedly succeeded while database was unavailable");
    process.exit(2);
  })
  .catch((error) => {
    console.error(JSON.stringify({
      boundedFailure: true,
      elapsedMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    }));
    process.exit(1);
  });
