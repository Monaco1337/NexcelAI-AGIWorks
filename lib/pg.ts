/**
 * NEXCEL AI / AGI WORKS · Zentraler Postgres-Layer
 *
 * Eine einzige, robuste Postgres-Verbindung für die gesamte App.
 *
 * Verbindung kommt aus Vercel Postgres / Neon Env-Variablen.
 * Wenn KEINE Datenbank konfiguriert ist, geben alle Helfer `null` zurück
 * und die App fällt sauber auf das bestehende Datei-/Memory-Verhalten zurück
 * — die Seite geht also nie kaputt, auch ohne DB.
 *
 * Das Schema wird über versionierte Migrationen aufgebaut
 * (lib/db/migrations). Der frühere Inline-Bootstrap per
 * `CREATE TABLE IF NOT EXISTS` ist entfallen, weil er bestehende Tabellen
 * nicht verändern konnte.
 */

import postgres from "postgres";
import { runMigrations, type MigrationStatus } from "./db/migrationRunner";
import { MIGRATIONS } from "./db/migrations";

/** Erste verfügbare Postgres-URL aus den üblichen Vercel/Neon-Variablen. */
function resolveConnectionString(): string | null {
  const candidates = [
    process.env.POSTGRES_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_PRISMA_URL,
    process.env.POSTGRES_URL_NON_POOLING,
    process.env.DATABASE_URL_UNPOOLED,
  ];
  for (const c of candidates) {
    if (c && c.trim().length > 0) return c.trim();
  }
  return null;
}

const CONNECTION_STRING = resolveConnectionString();

/** True, wenn eine Datenbank verbunden werden kann. */
export function isDbEnabled(): boolean {
  return !!CONNECTION_STRING;
}

export type Sql = ReturnType<typeof postgres>;

let sql: Sql | null = null;

/** Lazy-initialisierter SQL-Client (oder null, wenn keine DB konfiguriert). */
export function getSql(): Sql | null {
  if (!CONNECTION_STRING) return null;
  if (sql) return sql;

  try {
    // Vercel/Neon liefert eine bereits korrekt kodierte Connection-URL —
    // direkt verwenden, keine eigene Manipulation (zerschießt sonst das
    // Schema "postgres://").
    sql = postgres(CONNECTION_STRING, {
      max: 5,
      idle_timeout: 20,
      connect_timeout: 15,
      // Pooled-Verbindungen (PgBouncer/Neon) vertragen keine Prepared Statements.
      prepare: false,
      ssl: "require",
    });
    return sql;
  } catch (error) {
    console.error("❌ [PG] Verbindung konnte nicht initialisiert werden:", error);
    return null;
  }
}

/* ── Schema-Bootstrap (einmal pro Prozess) ─────────────────────────── */

let schemaPromise: Promise<boolean> | null = null;
let lastStatus: MigrationStatus | null = null;

/**
 * Status des letzten Migrationslaufs in diesem Prozess. Wird von
 * /api/db-health ausgegeben, damit ein unvollständiges Schema sichtbar ist,
 * statt still im Hintergrund zu bleiben.
 */
export function getMigrationStatus(): MigrationStatus | null {
  return lastStatus;
}

export function ensureSchema(): Promise<boolean> {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const client = getSql();
    if (!client) return false;

    try {
      lastStatus = await runMigrations(client, MIGRATIONS);
    } catch (error) {
      console.error("❌ [PG] Migrationslauf abgebrochen:", error);
      return true; // Verbindung steht; bestehende Tabellen bleiben nutzbar.
    }

    if (lastStatus.failed) {
      console.error(
        `❌ [PG] Schema unvollständig — Migration ${lastStatus.failed.id} ` +
          `(${lastStatus.failed.name}) fehlgeschlagen: ${lastStatus.failed.error}`
      );
    } else {
      console.log(
        `✅ [PG] Schema bereit (${lastStatus.applied.length} Migrationen)`
      );
    }

    // Die Verbindung steht. Bereits migrierte Tabellen bleiben nutzbar, auch
    // wenn eine spätere Migration scheitert — sonst legt ein Fehler in einem
    // neuen Modul die gesamte Website lahm.
    return true;
  })();

  return schemaPromise;
}

/**
 * Bequemer Wrapper: stellt Schema sicher und liefert den Client,
 * oder null wenn keine DB verfügbar / Bootstrap fehlgeschlagen.
 */
export async function db(): Promise<Sql | null> {
  const client = getSql();
  if (!client) return null;
  const ok = await ensureSchema();
  if (!ok) return null;
  return client;
}
