/**
 * NEXCEL AI / AGI WORKS · Zentraler Postgres-Layer
 *
 * Eine einzige, robuste Postgres-Verbindung für die gesamte App
 * (Kontakte, Demo-Anfragen, Kunden-Logos).
 *
 * Verbindung kommt aus Vercel Postgres / Neon Env-Variablen.
 * Wenn KEINE Datenbank konfiguriert ist, geben alle Helfer `null` zurück
 * und die App fällt sauber auf das bestehende Datei-/Memory-Verhalten zurück
 * — die Seite geht also nie kaputt, auch ohne DB.
 *
 * Schema wird beim ersten Zugriff automatisch angelegt (idempotent).
 */

import postgres from "postgres";

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

type Sql = ReturnType<typeof postgres>;

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

export function ensureSchema(): Promise<boolean> {
  if (schemaPromise) return schemaPromise;

  schemaPromise = (async () => {
    const client = getSql();
    if (!client) return false;

    try {
      await client`
        CREATE TABLE IF NOT EXISTS contact_posts (
          id           TEXT PRIMARY KEY,
          vorname      TEXT NOT NULL DEFAULT '',
          nachname     TEXT NOT NULL DEFAULT '',
          email        TEXT NOT NULL DEFAULT '',
          telefon      TEXT,
          unternehmen  TEXT,
          betreff      TEXT NOT NULL DEFAULT '',
          nachricht    TEXT NOT NULL DEFAULT '',
          status       TEXT NOT NULL DEFAULT 'open',
          read         BOOLEAN NOT NULL DEFAULT FALSE,
          archived     BOOLEAN NOT NULL DEFAULT FALSE,
          brand        TEXT NOT NULL DEFAULT 'nexcel',
          source_host  TEXT,
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_contact_posts_created_at
        ON contact_posts (created_at DESC)
      `;

      await client`
        CREATE TABLE IF NOT EXISTS demo_requests (
          id           TEXT PRIMARY KEY,
          name         TEXT NOT NULL DEFAULT '',
          email        TEXT NOT NULL DEFAULT '',
          unternehmen  TEXT,
          status       TEXT NOT NULL DEFAULT 'pending',
          expires_at   TIMESTAMPTZ,
          read         BOOLEAN NOT NULL DEFAULT FALSE,
          archived     BOOLEAN NOT NULL DEFAULT FALSE,
          brand        TEXT NOT NULL DEFAULT 'nexcel',
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at
        ON demo_requests (created_at DESC)
      `;

      await client`
        CREATE TABLE IF NOT EXISTS customer_logos (
          id            TEXT PRIMARY KEY,
          name          TEXT NOT NULL DEFAULT '',
          brand         TEXT NOT NULL DEFAULT 'all',
          image_data    BYTEA NOT NULL,
          content_type  TEXT NOT NULL DEFAULT 'image/png',
          class_name    TEXT NOT NULL DEFAULT 'max-h-[48px] max-w-[160px] sm:max-h-[56px] sm:max-w-[184px]',
          filter_style  TEXT NOT NULL DEFAULT 'brightness(1.05) opacity(0.85)',
          sort_order    INTEGER NOT NULL DEFAULT 0,
          active        BOOLEAN NOT NULL DEFAULT TRUE,
          created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_customer_logos_sort
        ON customer_logos (sort_order ASC, created_at ASC)
      `;

      await client`
        CREATE TABLE IF NOT EXISTS references_projects (
          id               TEXT PRIMARY KEY,
          title            TEXT NOT NULL DEFAULT '',
          slug             TEXT NOT NULL DEFAULT '',
          client_name      TEXT NOT NULL DEFAULT '',
          short_description TEXT NOT NULL DEFAULT '',
          full_description TEXT NOT NULL DEFAULT '',
          type             TEXT NOT NULL DEFAULT '',
          tags             TEXT[] NOT NULL DEFAULT '{}',
          modules          TEXT[] NOT NULL DEFAULT '{}',
          website_url      TEXT,
          status           TEXT NOT NULL DEFAULT 'live',
          cover_image      TEXT NOT NULL DEFAULT '',
          cover_image_data BYTEA,
          cover_content_type TEXT NOT NULL DEFAULT 'image/png',
          sort_order       INTEGER NOT NULL DEFAULT 0,
          is_published     BOOLEAN NOT NULL DEFAULT TRUE,
          created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_references_sort
        ON references_projects (sort_order ASC, created_at ASC)
      `;
      await client`
        CREATE TABLE IF NOT EXISTS reference_images (
          id           TEXT PRIMARY KEY,
          reference_id TEXT NOT NULL REFERENCES references_projects(id) ON DELETE CASCADE,
          image_data   BYTEA NOT NULL,
          content_type TEXT NOT NULL DEFAULT 'image/png',
          alt          TEXT NOT NULL DEFAULT '',
          sort_order   INTEGER NOT NULL DEFAULT 0,
          created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      await client`
        CREATE INDEX IF NOT EXISTS idx_reference_images_ref
        ON reference_images (reference_id, sort_order ASC)
      `;

      console.log("✅ [PG] Schema bereit");
      return true;
    } catch (error) {
      console.error("❌ [PG] Schema-Bootstrap fehlgeschlagen:", error);
      // Reset, damit ein späterer Versuch erneut booten kann.
      schemaPromise = null;
      return false;
    }
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
