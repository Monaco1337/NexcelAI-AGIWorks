/**
 * 0001 — Baseline des bereits produktiv laufenden Schemas.
 *
 * Bildet exakt das ab, was der frühere Laufzeit-Bootstrap in `ensureSchema()`
 * angelegt hat. Auf einer bestehenden Datenbank sind sämtliche Anweisungen
 * No-Ops; die Migration wird lediglich als angewendet vermerkt. Auf einer
 * leeren Datenbank entsteht dasselbe Schema wie bisher.
 *
 * Ab hier gilt: Änderungen an diesen Tabellen erfolgen ausschließlich über
 * neue Migrationsdateien, niemals durch Bearbeiten dieser Datei.
 */

import type { Migration } from "../migrationRunner";

export const migration0001: Migration = {
  id: "0001",
  name: "baseline_existing_schema",
  up: async (sql) => {
    await sql`
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
    await sql`
      CREATE INDEX IF NOT EXISTS idx_contact_posts_created_at
      ON contact_posts (created_at DESC)
    `;

    await sql`
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
    await sql`
      CREATE INDEX IF NOT EXISTS idx_demo_requests_created_at
      ON demo_requests (created_at DESC)
    `;

    await sql`
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
    await sql`
      CREATE INDEX IF NOT EXISTS idx_customer_logos_sort
      ON customer_logos (sort_order ASC, created_at ASC)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS references_projects (
        id                 TEXT PRIMARY KEY,
        title              TEXT NOT NULL DEFAULT '',
        slug               TEXT NOT NULL DEFAULT '',
        client_name        TEXT NOT NULL DEFAULT '',
        short_description  TEXT NOT NULL DEFAULT '',
        full_description   TEXT NOT NULL DEFAULT '',
        type               TEXT NOT NULL DEFAULT '',
        tags               TEXT[] NOT NULL DEFAULT '{}',
        modules            TEXT[] NOT NULL DEFAULT '{}',
        website_url        TEXT,
        status             TEXT NOT NULL DEFAULT 'live',
        cover_image        TEXT NOT NULL DEFAULT '',
        cover_image_data   BYTEA,
        cover_content_type TEXT NOT NULL DEFAULT 'image/png',
        sort_order         INTEGER NOT NULL DEFAULT 0,
        is_published       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_references_sort
      ON references_projects (sort_order ASC, created_at ASC)
    `;

    await sql`
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
    await sql`
      CREATE INDEX IF NOT EXISTS idx_reference_images_ref
      ON reference_images (reference_id, sort_order ASC)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS systems_cards (
        id                 TEXT PRIMARY KEY,
        slug               TEXT UNIQUE NOT NULL,
        category           TEXT NOT NULL DEFAULT 'unternehmen',
        title              TEXT NOT NULL DEFAULT '',
        tagline            TEXT NOT NULL DEFAULT '',
        card_desc          TEXT NOT NULL DEFAULT '',
        long_desc          TEXT NOT NULL DEFAULT '',
        bullets            JSONB NOT NULL DEFAULT '[]',
        details            JSONB NOT NULL DEFAULT '[]',
        image              TEXT NOT NULL DEFAULT '',
        cover_image_data   BYTEA,
        cover_content_type TEXT NOT NULL DEFAULT 'image/png',
        alt                TEXT NOT NULL DEFAULT '',
        sort_order         INTEGER NOT NULL DEFAULT 0,
        is_published       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    // Datenbanken, die noch die reservierte Spalte "desc" tragen, werden
    // verlustfrei umbenannt. Die Prüfung über information_schema ist nötig,
    // weil ein fehlschlagendes ALTER innerhalb der Transaktion die gesamte
    // Migration abbrechen würde.
    await sql`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'systems_cards'
            AND column_name = 'desc'
        ) THEN
          ALTER TABLE systems_cards RENAME COLUMN "desc" TO card_desc;
        END IF;
      END
      $$
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_systems_cards_sort
      ON systems_cards (sort_order ASC, created_at ASC)
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_systems_cards_slug
      ON systems_cards (slug)
    `;
  },
};
