/** Durable, auditable inbound intake. Does not send outbound marketing. */
import type { Migration } from "../migrationRunner";

export const migration0016: Migration = {
  id: "0016",
  name: "inbound_lead_pipeline",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS marketing_inbound_leads (
        id              TEXT PRIMARY KEY,
        source_type     TEXT NOT NULL,
        source_id       TEXT NOT NULL,
        brand           TEXT NOT NULL CHECK (brand IN ('nexcel', 'agiworks')),
        name            TEXT NOT NULL,
        email           TEXT NOT NULL,
        company         TEXT,
        subject         TEXT NOT NULL DEFAULT '',
        message         TEXT NOT NULL DEFAULT '',
        attribution     JSONB NOT NULL DEFAULT '{}'::jsonb,
        details         JSONB NOT NULL DEFAULT '{}'::jsonb,
        priority        TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('high', 'normal')),
        status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new','in_review','accepted','dismissed')),
        next_action_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '1 day'),
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (source_type, source_id)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_marketing_inbound_pending
      ON marketing_inbound_leads (priority, next_action_at, created_at)
      WHERE status IN ('new','in_review')
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_marketing_inbound_brand_status
      ON marketing_inbound_leads (brand, status, created_at DESC)
    `;
  },
};
