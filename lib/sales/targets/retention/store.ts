import { db } from "@/lib/pg";
import { TargetError } from "../errors";

const RETENTION_TABLES = [
  "sales_target_metric_events",
  "sales_target_provider_usage_ledger",
  "sales_target_website_fetches",
  "sales_target_normalized_candidates",
  "sales_target_raw_observations",
] as const;

export async function purgeExpiredEvidence(
  batchSize = 1_000,
): Promise<Record<(typeof RETENTION_TABLES)[number], number>> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const limit = Math.max(1, Math.min(10_000, Math.floor(batchSize)));
  const result = Object.fromEntries(RETENTION_TABLES.map((table) => [table, 0])) as Record<
    (typeof RETENTION_TABLES)[number],
    number
  >;
  for (const table of RETENTION_TABLES) {
    // Table names are a closed compile-time allowlist; values remain bound.
    const rows = await sql<{ id: string }[]>`
      DELETE FROM ${sql(table)}
      WHERE id IN (
        SELECT id FROM ${sql(table)}
        WHERE retain_until IS NOT NULL
          AND retain_until < NOW()
          AND legal_hold = FALSE
        ORDER BY retain_until
        LIMIT ${limit}
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id
    `;
    result[table] = rows.length;
  }
  return result;
}

