/** Shared real database calendar for NEXCEL AI and AGI Works. */
import type { Migration } from "../migrationRunner";

export const migration0017: Migration = {
  id: "0017",
  name: "shared_consultation_booking",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS consultation_bookings (
        id                    TEXT PRIMARY KEY,
        resource_id           TEXT NOT NULL,
        brand                 TEXT NOT NULL CHECK (brand IN ('nexcel','agiworks')),
        starts_at             TIMESTAMPTZ NOT NULL,
        ends_at               TIMESTAMPTZ NOT NULL,
        name                  TEXT NOT NULL,
        email                 TEXT NOT NULL,
        company               TEXT NOT NULL DEFAULT '',
        project_type          TEXT NOT NULL,
        project_goal          TEXT NOT NULL,
        timeframe             TEXT NOT NULL,
        budget_range          TEXT NOT NULL,
        attribution           JSONB NOT NULL DEFAULT '{}'::jsonb,
        status                TEXT NOT NULL DEFAULT 'confirmed'
                              CHECK (status IN ('confirmed','cancelled')),
        confirmation_sent_at  TIMESTAMPTZ,
        confirmation_claimed_at TIMESTAMPTZ,
        reminder_sent_at      TIMESTAMPTZ,
        reminder_claimed_at   TIMESTAMPTZ,
        cancellation_sent_at   TIMESTAMPTZ,
        cancellation_claimed_at TIMESTAMPTZ,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT chk_consultation_end_after_start CHECK (ends_at > starts_at)
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS uq_consultation_active_resource_slot
      ON consultation_bookings(resource_id, starts_at)
      WHERE status = 'confirmed'
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_consultation_brand_created
      ON consultation_bookings(brand, starts_at, created_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_consultation_email_recent
      ON consultation_bookings(email, created_at DESC)
    `;
  },
};
