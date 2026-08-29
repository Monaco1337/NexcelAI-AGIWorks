/**
 * 0012 — NEXCEL Sales Target Intelligence · Geocode-Cache + freie
 * Discovery-Sekundärquellen (Wikidata, o. ä.).
 *
 * Ergänzt zwei neue Tabellen, damit die bereits vorhandenen Discovery-
 * Provider (OpenStreetMap Overpass, Wikidata) ihre Ergebnisse dauerhaft
 * in Postgres materialisieren — analog zu allen anderen Datenpfaden
 * des Systems. Ziel: nach der ersten Auflösung/Abfrage eines Bereichs
 * müssen wir nie wieder gegen einen externen Endpoint gehen, solange
 * der Cache frisch ist.
 *
 * Alle Änderungen sind additiv.
 */

import type { Migration } from "../migrationRunner";

export const migration0012: Migration = {
  id: "0012",
  name: "sales_target_geocache",
  up: async (sql) => {
    /* ── 1. Geocode-Cache ───────────────────────────────────────────────
     * Persistente Auflösung: Stadt-/Query-Normalform → lat/lng. So bleiben
     * die Coordinates zwischen Deployments stabil und wir belasten keine
     * öffentlichen Endpoints (Overpass-Mirror, Nominatim) unnötig.
     */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_geocode_cache (
        query_norm      TEXT PRIMARY KEY,
        lat             DOUBLE PRECISION NOT NULL,
        lng             DOUBLE PRECISION NOT NULL,
        display_name    TEXT NOT NULL,
        country         TEXT,
        source          TEXT NOT NULL,
        hit_count       INTEGER NOT NULL DEFAULT 1,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_geocode_source ON sales_target_geocode_cache (source)`;

    /* ── 2. Area-Scan-Runs ─────────────────────────────────────────────
     * Ein Area-Scan ist eine Sammlung von SearchJobs. Wir halten das
     * Ergebnis (welche Tiles, wie viele Firmen, welche Provider-Fehler)
     * gebündelt, damit UI-Detail-Ansichten und Reports pro Bereich
     * exakt reproduzierbar sind — ohne 60 SearchJobs einzeln zu joinen.
     */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_area_scans (
        id                 TEXT PRIMARY KEY,
        correlation_id     TEXT NOT NULL,
        city               TEXT NOT NULL,
        country            TEXT NOT NULL DEFAULT 'DE',
        center_lat         DOUBLE PRECISION NOT NULL,
        center_lng         DOUBLE PRECISION NOT NULL,
        radius_km          NUMERIC(6, 2) NOT NULL,
        tile_radius_km     NUMERIC(6, 2) NOT NULL DEFAULT 25,
        industries         TEXT[] NOT NULL DEFAULT '{}',
        depth              TEXT NOT NULL DEFAULT 'STANDARD',
        limit_per_tile     INTEGER NOT NULL DEFAULT 50,
        max_tiles          INTEGER NOT NULL DEFAULT 60,
        total_tiles        INTEGER NOT NULL,
        job_ids            TEXT[] NOT NULL DEFAULT '{}',
        status             TEXT NOT NULL DEFAULT 'running',    -- running · completed · failed
        discovered_count   INTEGER NOT NULL DEFAULT 0,
        actual_cost_cents  BIGINT NOT NULL DEFAULT 0,
        provider_summary   JSONB NOT NULL DEFAULT '{}'::jsonb,
        first_error        TEXT,
        created_by         TEXT,
        started_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finished_at        TIMESTAMPTZ
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_area_scans_city ON sales_target_area_scans (city, radius_km)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_area_scans_correlation ON sales_target_area_scans (correlation_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_area_scans_started ON sales_target_area_scans (started_at DESC)`;

    /* ── 3. Provider-Sekundärquellen: External-ID-Mapping ───────────────
     * Damit Wikidata-QIDs, OSM-Element-IDs etc. eindeutig einer Company
     * zugeordnet werden und bei Re-Runs deterministisch dedupen.
     */
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_external_ids (
        target_id     TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        namespace     TEXT NOT NULL,          -- 'osm' · 'wikidata' · 'google_places'
        external_id   TEXT NOT NULL,
        confidence    NUMERIC(4, 3) NOT NULL DEFAULT 0.9,
        source_url    TEXT,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (namespace, external_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_sales_target_external_ids_target ON sales_target_external_ids (target_id)`;
  },
};
