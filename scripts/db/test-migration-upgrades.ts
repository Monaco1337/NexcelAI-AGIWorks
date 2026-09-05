import postgres from "postgres";
import { runMigrations } from "../../lib/db/migrationRunner";
import { MIGRATIONS } from "../../lib/db/migrations";

const url = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL is required");
const local = ["localhost", "127.0.0.1", "::1"].includes(new URL(url).hostname);

function client(schema: string) {
  return postgres(url!, {
    max: 2,
    prepare: false,
    ssl: local ? false : "require",
    connection: { search_path: schema },
  });
}

async function main() {
  const admin = postgres(url!, { max: 2, prepare: false, ssl: local ? false : "require" });
  const schemas = {
    legacyEmpty: `mig_legacy_empty_${Date.now()}`,
    legacyPopulated: `mig_legacy_populated_${Date.now()}`,
    concurrent: `mig_concurrent_${Date.now()}`,
  };
  try {
    for (const schema of Object.values(schemas)) {
      await admin.unsafe(`CREATE SCHEMA "${schema}"`);
    }
    await testLegacyUpgrade(schemas.legacyEmpty, false);
    await testLegacyUpgrade(schemas.legacyPopulated, true);
    await testConcurrentMigrationLock(schemas.concurrent);
    console.log(JSON.stringify({
      emptyLegacy0015Upgrade: "PASS",
      populatedLegacy0015Upgrade: "PASS",
      rerunIdempotency: "PASS",
      concurrentMigrationLock: "PASS",
      migrations: MIGRATIONS.length,
    }));
  } finally {
    for (const schema of Object.values(schemas)) {
      await admin.unsafe(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    }
    await admin.end({ timeout: 5 });
  }
}

async function testLegacyUpgrade(schema: string, populated: boolean) {
  const sql = client(schema);
  try {
    const legacy = MIGRATIONS.filter((migration) => Number(migration.id) <= 15);
    const legacyResult = await runMigrations(sql, legacy);
    assert(!legacyResult.failed && legacyResult.complete, `${schema}: 0015 setup failed`);
    if (populated) {
      await sql`
        INSERT INTO sales_target_companies (
          id, name, fingerprint, phone, address_line, city, enrichment_status
        ) VALUES (
          'legacy_company', 'Legacy GmbH', 'legacy:gmbh',
          '+49 231 12345', 'Altstraße 1', 'Dortmund', 'SCORING'
        )
      `;
      await sql`
        INSERT INTO sales_target_lead_scores (
          id, target_id, total_score, priority_class, is_current
        ) VALUES ('legacy_score', 'legacy_company', 72, 'A', TRUE)
      `;
      await sql`
        INSERT INTO sales_target_contacts (
          id, target_id, kind, value, normalized_value, confidence, verification_status
        ) VALUES
          ('legacy_contact_a', 'legacy_company', 'phone', '+49 231 12345', '+4923112345', 0.8, 'high'),
          ('legacy_contact_b', 'legacy_company', 'phone', '+49 231 12345', '+4923112345', 0.7, 'medium')
      `;
      await sql`
        INSERT INTO sales_target_enrichment_jobs (
          id, target_id, phase, status, started_at
        ) VALUES (
          'legacy_running_job', 'legacy_company', 'website_contact', 'running', NOW()
        )
      `;
    }
    const upgraded = await runMigrations(sql, MIGRATIONS);
    assert(!upgraded.failed && upgraded.complete, `${schema}: upgrade failed`);
    const rerun = await runMigrations(sql, MIGRATIONS);
    assert(!rerun.failed && rerun.pending.length === 0, `${schema}: rerun was not idempotent`);
    if (populated) {
      const company = await sql<Record<string, unknown>[]>`
        SELECT company.name, summary.total_score, job.status,
          (SELECT COUNT(*) FROM sales_target_contacts contact
           WHERE contact.target_id = company.id AND contact.deleted_at IS NULL) AS live_contacts
        FROM sales_target_companies company
        LEFT JOIN sales_target_company_summaries summary ON summary.target_id = company.id
        LEFT JOIN sales_target_enrichment_jobs job ON job.id = 'legacy_running_job'
        WHERE company.id = 'legacy_company'
      `;
      assert(company[0]?.name === "Legacy GmbH", "legacy company was not preserved");
      assert(Number(company[0]?.total_score) === 72, "summary backfill lost current score");
      assert(company[0]?.status === "queued", "legacy running job was not recovered");
      assert(Number(company[0]?.live_contacts) === 1, "contact idempotency migration did not preserve one contact");
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function testConcurrentMigrationLock(schema: string) {
  const first = client(schema);
  const second = client(schema);
  try {
    const [a, b] = await Promise.all([
      runMigrations(first, MIGRATIONS),
      runMigrations(second, MIGRATIONS),
    ]);
    assert(!a.failed && !b.failed && a.complete && b.complete, "concurrent migration failed");
    const rows = await first<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM schema_migrations
    `;
    assert(Number(rows[0]?.count) === MIGRATIONS.length, "concurrent migration wrote duplicate/incomplete ledger");
  } finally {
    await Promise.all([first.end({ timeout: 5 }), second.end({ timeout: 5 })]);
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
