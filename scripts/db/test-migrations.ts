/**
 * Probelauf aller Migrationen in einem Wegwerf-Schema.
 *
 * Es gibt keine lokale Postgres-Instanz, und Migrationen ungetestet gegen die
 * Produktionsdatenbank laufen zu lassen ist keine Option. Der Kompromiss:
 * dieselbe Instanz, aber ein temporäres Schema. Damit läuft das echte DDL
 * gegen die echte Postgres-Version, ohne eine Produktionstabelle anzufassen.
 *
 * Das Schema wird am Ende immer entfernt — auch wenn eine Migration scheitert.
 *
 * Usage: npx tsx --env-file=.env.production.local scripts/db/test-migrations.ts
 */

import postgres from "postgres";
import { runMigrations } from "../../lib/db/migrationRunner";
import { MIGRATIONS } from "../../lib/db/migrations";

function connectionString(): string {
  const value =
    process.env.POSTGRES_URL ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL_UNPOOLED;
  if (!value) {
    console.error("Keine Postgres-URL in der Umgebung gefunden.");
    process.exit(1);
  }
  return value;
}

async function main(): Promise<void> {
  const schema = `migtest_${Date.now()}`;
  const url = connectionString();
  const local = ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);
  const sql = postgres(url, {
    max: 4,
    prepare: false,
    ssl: local ? false : "require",
    // Alle Anweisungen laufen ausschließlich in diesem Schema.
    connection: { search_path: schema },
  });

  let failed = false;

  try {
    // search_path zeigt bereits auf das Schema, das es noch nicht gibt —
    // CREATE SCHEMA muss daher voll qualifiziert erfolgen.
    await sql.unsafe(`CREATE SCHEMA "${schema}"`);
    console.log(`Testschema angelegt: ${schema}\n`);

    const status = await runMigrations(sql, MIGRATIONS);

    if (status.failed) {
      failed = true;
      console.error(
        `\n❌ Migration ${status.failed.id} (${status.failed.name}) fehlgeschlagen:\n   ${status.failed.error}`
      );
    } else {
      console.log(`\n✅ Alle ${status.applied.length} Migrationen erfolgreich.`);
    }

    // Zweiter Lauf: muss vollständig ohne Änderung durchlaufen. Belegt, dass
    // wiederholtes Deployen keine Nebenwirkungen hat.
    const second = await runMigrations(sql, MIGRATIONS);
    if (second.pending.length > 0 || second.failed) {
      failed = true;
      console.error("❌ Zweiter Lauf war nicht idempotent.");
    } else {
      console.log("✅ Zweiter Lauf idempotent (keine ausstehenden Migrationen).");
    }

    await verifyRevenueConcurrencyAndImmutability(sql);

    const tables = await sql<{ table_name: string }[]>`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = ${schema} ORDER BY table_name
    `;
    console.log(`\nAngelegte Tabellen (${tables.length}):`);
    tables.forEach((t) => console.log(`  · ${t.table_name}`));

    const indexes = await sql<{ indexname: string }[]>`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = ${schema} ORDER BY indexname
    `;
    console.log(`\nAngelegte Indizes (${indexes.length}):`);
    indexes.forEach((i) => console.log(`  · ${i.indexname}`));
  } catch (error) {
    failed = true;
    console.error("❌ Probelauf abgebrochen:", error);
  } finally {
    try {
      await sql.unsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
      console.log(`\nTestschema entfernt: ${schema}`);
    } catch (error) {
      console.error(
        `\n⚠️  Testschema ${schema} konnte nicht entfernt werden — bitte manuell prüfen:`,
        error
      );
    }
    await sql.end({ timeout: 5 });
  }

  process.exit(failed ? 1 : 0);
}

async function verifyRevenueConcurrencyAndImmutability(
  sql: ReturnType<typeof postgres>,
): Promise<void> {
  await sql`
    INSERT INTO sales_target_companies (id, name, fingerprint)
    VALUES ('test_target_lease', 'Lease Test GmbH', 'lease:test')
  `;
  await sql`
    INSERT INTO sales_target_enrichment_jobs (id, target_id, phase, status, priority)
    VALUES
      ('test_job_1', 'test_target_lease', 'website_contact', 'queued', 100),
      ('test_job_2', 'test_target_lease', 'lead_score', 'queued', 90)
  `;
  const claims = await Promise.all(
    ["worker-a", "worker-b"].map((worker) =>
      sql.begin(async (tx) => tx<{ id: string }[]>`
        WITH candidate AS (
          SELECT id FROM sales_target_enrichment_jobs
          WHERE status = 'queued'
          ORDER BY priority DESC, created_at
          FOR UPDATE SKIP LOCKED
          LIMIT 1
        )
        UPDATE sales_target_enrichment_jobs j
        SET status = 'running', lease_token = ${worker},
            lease_expires_at = NOW() + INTERVAL '5 minutes'
        FROM candidate
        WHERE j.id = candidate.id
        RETURNING j.id
      `),
    ),
  );
  const claimedIds = claims.flat().map((row) => row.id);
  if (claimedIds.length !== 2 || new Set(claimedIds).size !== 2) {
    throw new Error(`Concurrent SKIP LOCKED claim failed: ${claimedIds.join(",")}`);
  }

  await sql`
    UPDATE sales_target_enrichment_jobs
    SET lease_expires_at = NOW() - INTERVAL '1 minute'
    WHERE id = 'test_job_1'
  `;
  const reclaimed = await sql<{ id: string }[]>`
    UPDATE sales_target_enrichment_jobs
    SET status = 'queued', lease_token = NULL, lease_expires_at = NULL
    WHERE status = 'running' AND lease_expires_at < NOW()
    RETURNING id
  `;
  if (!reclaimed.some((row) => row.id === "test_job_1")) {
    throw new Error("Expired lease was not reclaimable");
  }

  await sql`
    INSERT INTO sales_target_raw_observations (
      id, target_id, provider, source_kind, payload, payload_hash, idempotency_key, observed_at
    ) VALUES (
      'test_observation_immutable', 'test_target_lease', 'test', 'contract-test',
      '{"value":1}'::jsonb, 'hash-1', 'test-observation-immutable', NOW()
    )
  `;
  let immutableBlocked = false;
  try {
    await sql`
      UPDATE sales_target_raw_observations
      SET payload = '{"value":2}'::jsonb
      WHERE id = 'test_observation_immutable'
    `;
  } catch {
    immutableBlocked = true;
  }
  if (!immutableBlocked) throw new Error("Immutable observation accepted an UPDATE");
  console.log("✅ Lease concurrency, reclaim, and immutable evidence checks passed.");
}

main();
