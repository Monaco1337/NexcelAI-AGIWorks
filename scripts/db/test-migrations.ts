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
  const sql = postgres(connectionString(), {
    max: 1,
    prepare: false,
    ssl: "require",
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

main();
