/**
 * Versionierter Migrationsrunner.
 *
 * Ersetzt das bisherige Laufzeit-Bootstrapping, bei dem jede Tabelle per
 * `CREATE TABLE IF NOT EXISTS` angelegt wurde. Dieses Muster kann bestehende
 * Tabellen nicht verändern — genau daran ist die Umbenennung der reservierten
 * Spalte `desc` gescheitert, was den kompletten Schema-Bootstrap abgebrochen
 * und damit alle Admin-Daten unerreichbar gemacht hat.
 *
 * Eigenschaften:
 *  - Jede Migration läuft genau einmal, in fester Reihenfolge, in einer eigenen
 *    Transaktion. Bricht sie ab, wird sie vollständig zurückgerollt.
 *  - Ein Advisory Lock serialisiert konkurrierende Läufe. Auf Vercel starten
 *    viele Lambdas gleichzeitig; ohne Lock würden sie dieselbe Migration
 *    parallel ausführen.
 *  - Beim ersten Fehler wird abgebrochen, weil spätere Migrationen auf
 *    früheren aufbauen. Bereits angewendete Migrationen bleiben gültig.
 *
 * Bewusst KEIN Checksummen-Abgleich der Migrationsfunktionen: deren Quelltext
 * wird beim Production-Build minifiziert, ein Hash über `fn.toString()` würde
 * also bei jedem Deploy fälschlich abweichen.
 */

import type postgres from "postgres";
import type { TransactionSql } from "postgres";

type Sql = ReturnType<typeof postgres>;
/** Transaktions-Handle, wie es `sql.begin()` an den Callback übergibt. */
export type Tx = TransactionSql<Record<string, never>>;

export interface Migration {
  /** Fortlaufend, vierstellig, nie nachträglich ändern. */
  id: string;
  /** Kurzbeschreibung, erscheint im Log und in der Statustabelle. */
  name: string;
  up: (tx: Tx) => Promise<void>;
}

export interface MigrationStatus {
  applied: string[];
  pending: string[];
  failed: { id: string; name: string; error: string } | null;
  /** True, wenn alle bekannten Migrationen angewendet sind. */
  complete: boolean;
}

/**
 * Fester Schlüssel für pg_advisory_xact_lock. Beliebig, muss nur über alle
 * Instanzen identisch sein und darf mit keinem anderen Lock kollidieren.
 */
const LOCK_KEY = 4023986541;

async function ensureMigrationsTable(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      duration_ms INTEGER NOT NULL DEFAULT 0
    )
  `;
}

async function appliedIds(sql: Sql): Promise<Set<string>> {
  const rows = await sql<{ id: string }[]>`SELECT id FROM schema_migrations`;
  return new Set(rows.map((r) => r.id));
}

/**
 * Wendet alle ausstehenden Migrationen an. Idempotent: mehrfacher Aufruf
 * innerhalb desselben Prozesses ist unschädlich, da bereits angewendete
 * Migrationen übersprungen werden.
 */
export async function runMigrations(
  sql: Sql,
  migrations: Migration[]
): Promise<MigrationStatus> {
  await ensureMigrationsTable(sql);

  const done = await appliedIds(sql);
  const pending = migrations.filter((m) => !done.has(m.id));

  if (pending.length === 0) {
    return {
      applied: migrations.map((m) => m.id),
      pending: [],
      failed: null,
      complete: true,
    };
  }

  const applied: string[] = migrations.filter((m) => done.has(m.id)).map((m) => m.id);

  for (const migration of pending) {
    const started = Date.now();
    try {
      await sql.begin(async (tx) => {
        // Serialisiert konkurrierende Instanzen. Der Lock wird beim Ende der
        // Transaktion automatisch freigegeben — auch bei einem Rollback.
        await tx`SELECT pg_advisory_xact_lock(${LOCK_KEY})`;

        // Erneut prüfen: während des Wartens auf den Lock kann eine andere
        // Instanz dieselbe Migration bereits angewendet haben.
        const [existing] = await tx<{ id: string }[]>`
          SELECT id FROM schema_migrations WHERE id = ${migration.id}
        `;
        if (existing) return;

        await migration.up(tx);

        await tx`
          INSERT INTO schema_migrations (id, name, duration_ms)
          VALUES (${migration.id}, ${migration.name}, ${Date.now() - started})
        `;
      });

      applied.push(migration.id);
      console.log(
        `✅ [MIGRATION] ${migration.id} ${migration.name} (${Date.now() - started} ms)`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `❌ [MIGRATION] ${migration.id} ${migration.name} fehlgeschlagen — abgebrochen:`,
        error
      );
      return {
        applied,
        pending: migrations
          .filter((m) => !applied.includes(m.id))
          .map((m) => m.id),
        failed: { id: migration.id, name: migration.name, error: message },
        complete: false,
      };
    }
  }

  return { applied, pending: [], failed: null, complete: true };
}
