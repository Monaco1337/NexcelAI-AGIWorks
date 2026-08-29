/**
 * 0013 — NEXCEL Sales Target Intelligence · Bulk-Katalog.
 *
 * Erweitert die bestehende Zielkunden-Infrastruktur um die drei
 * Bausteine, die für einen serverseitigen, fortsetzbaren Massen-Import
 * (NRW-Katalog) fehlen. Es entsteht KEINE neue Job-, Speicher- oder
 * Katalogarchitektur — alle drei Punkte sind additive Ergänzungen an
 * bereits vorhandenen Tabellen:
 *
 *  1. `sales_target_companies.fingerprint` besitzt bisher nur einen
 *     nicht-eindeutigen Index. Für `INSERT … ON CONFLICT (fingerprint)
 *     DO NOTHING` — die einzige Möglichkeit, tausende Firmen in einer
 *     Anweisung atomar und dublettenfrei zu schreiben — wird ein
 *     UNIQUE-Index benötigt. Bestehende Dubletten werden vorher
 *     deterministisch soft-deleted (ältester Datensatz gewinnt).
 *
 *  2. `sales_target_search_jobs` hat Status und Fehler, aber keine
 *     Lease-/Retry-Semantik. `sales_target_enrichment_jobs` hat sie
 *     bereits (attempts / max_attempts / next_attempt_at). Wir ziehen
 *     dieselben Felder nach, damit ein Cron-getriebener Worker Jobs
 *     leasen, nach Absturz wieder freigeben und mit Backoff erneut
 *     versuchen kann. Der bbox-Zuschnitt reist im vorhandenen
 *     `filters JSONB` mit — keine zusätzliche Spalte, keine neue Tabelle.
 *
 *  3. `sales_target_area_scans` ist bereits der Batch-Run-Datensatz
 *     (welche Jobs, wie viele Firmen, welche Provider-Fehler). Der
 *     Katalog-Publish-Zustand gehört genau dorthin: ein Katalog-Build
 *     IST ein Area-Scan. Wir ergänzen Publish-State, Quality-Report,
 *     Checkpoint und Scope — statt eine zweite Katalogtabelle zu bauen.
 *
 * Alle Änderungen sind additiv und idempotent.
 */

import type { Migration } from "../migrationRunner";

export const migration0013: Migration = {
  id: "0013",
  name: "sales_target_bulk_catalog",
  up: async (sql) => {
    /* ── 1. Fingerprint-Eindeutigkeit ────────────────────────────────
     * Voraussetzung für Batch-Upserts. Vorhandene Dubletten werden
     * zuerst aufgelöst: pro Fingerprint überlebt der älteste aktive
     * Datensatz, alle weiteren werden soft-deleted (nicht gelöscht —
     * Provenance und Referenzen bleiben erhalten).
     */
    await sql`
      WITH ranked AS (
        SELECT id,
               ROW_NUMBER() OVER (
                 PARTITION BY fingerprint
                 ORDER BY created_at ASC, id ASC
               ) AS rn
        FROM sales_target_companies
        WHERE deleted_at IS NULL
      )
      UPDATE sales_target_companies t
         SET deleted_at = NOW(),
             last_enrichment_error = COALESCE(
               t.last_enrichment_error,
               'Automatisch dedupliziert (Migration 0013, Fingerprint-Kollision)'
             )
        FROM ranked r
       WHERE t.id = r.id
         AND r.rn > 1
    `;

    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_targets_fingerprint_unique
        ON sales_target_companies (fingerprint)
        WHERE deleted_at IS NULL
    `;

    /* ── 2. Lease- und Retry-Semantik für Search-Jobs ────────────────
     * Spiegelt exakt die Felder, die sales_target_enrichment_jobs
     * bereits besitzt, damit derselbe FOR-UPDATE-SKIP-LOCKED-Worker-
     * Pattern wiederverwendet werden kann.
     */
    await sql`ALTER TABLE sales_target_search_jobs ADD COLUMN IF NOT EXISTS attempts         INTEGER NOT NULL DEFAULT 0`;
    await sql`ALTER TABLE sales_target_search_jobs ADD COLUMN IF NOT EXISTS max_attempts     INTEGER NOT NULL DEFAULT 3`;
    await sql`ALTER TABLE sales_target_search_jobs ADD COLUMN IF NOT EXISTS next_attempt_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await sql`ALTER TABLE sales_target_search_jobs ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ`;
    await sql`ALTER TABLE sales_target_search_jobs ADD COLUMN IF NOT EXISTS area_scan_id     TEXT`;

    /* Queue-Index: exakt die Prädikate, die takeNextSearchJob nutzt. */
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_search_queue
        ON sales_target_search_jobs (status, next_attempt_at ASC)
        WHERE status IN ('queued','running')
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_search_area
        ON sales_target_search_jobs (area_scan_id, status)
    `;

    /* ── 3. Katalog-Publish-Zustand auf dem Area-Scan ────────────────
     * publish_state trennt „Daten werden gerade aufgebaut" von
     * „Katalog ist freigegeben". Der Übergang auf PUBLISHED erfolgt
     * atomar und nur nach bestandenem Quality Gate.
     */
    await sql`ALTER TABLE sales_target_area_scans ADD COLUMN IF NOT EXISTS publish_state   TEXT NOT NULL DEFAULT 'DRAFT'`;
    await sql`ALTER TABLE sales_target_area_scans ADD COLUMN IF NOT EXISTS quality_report  JSONB NOT NULL DEFAULT '{}'::jsonb`;
    await sql`ALTER TABLE sales_target_area_scans ADD COLUMN IF NOT EXISTS published_at    TIMESTAMPTZ`;
    await sql`ALTER TABLE sales_target_area_scans ADD COLUMN IF NOT EXISTS checkpoint      JSONB NOT NULL DEFAULT '{}'::jsonb`;
    await sql`ALTER TABLE sales_target_area_scans ADD COLUMN IF NOT EXISTS scope_key       TEXT`;
    await sql`ALTER TABLE sales_target_area_scans ADD COLUMN IF NOT EXISTS bbox            JSONB`;
    await sql`ALTER TABLE sales_target_area_scans ADD COLUMN IF NOT EXISTS target_count    INTEGER NOT NULL DEFAULT 0`;

    /* center_lat/center_lng/radius_km sind für einen bbox-Katalog nicht
     * sinnvoll befüllbar. Defaults ergänzen, damit derselbe Datensatz
     * für Radius-Scans UND Katalog-Runs funktioniert. */
    await sql`ALTER TABLE sales_target_area_scans ALTER COLUMN center_lat  DROP NOT NULL`;
    await sql`ALTER TABLE sales_target_area_scans ALTER COLUMN center_lng  DROP NOT NULL`;
    await sql`ALTER TABLE sales_target_area_scans ALTER COLUMN radius_km   DROP NOT NULL`;
    await sql`ALTER TABLE sales_target_area_scans ALTER COLUMN total_tiles DROP NOT NULL`;

    await sql`
      ALTER TABLE sales_target_area_scans
        DROP CONSTRAINT IF EXISTS sales_target_area_publish_state
    `;
    await sql`
      ALTER TABLE sales_target_area_scans
        ADD CONSTRAINT sales_target_area_publish_state
        CHECK (publish_state IN ('DRAFT','PUBLISHED','FAILED'))
    `;

    /* Pro Scope existiert höchstens ein aktiver (nicht veröffentlichter)
     * Katalog-Run — macht ensureCatalogRun idempotent. */
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_area_scope_active
        ON sales_target_area_scans (scope_key)
        WHERE scope_key IS NOT NULL AND publish_state = 'DRAFT'
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_area_published
        ON sales_target_area_scans (scope_key, published_at DESC)
        WHERE publish_state = 'PUBLISHED'
    `;
  },
};
