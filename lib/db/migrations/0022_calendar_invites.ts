import type { Migration } from "../migrationRunner";

/** One logical invite/cancel delivery per recipient and booking; applied after 0021. */
export const migration0022: Migration = {
  id: "0022",
  name: "internal_calendar_invitation_deliveries",
  up: async sql => {
    await sql`
      CREATE TABLE IF NOT EXISTS internal_calendar_deliveries (
        id TEXT PRIMARY KEY,
        booking_id TEXT NOT NULL REFERENCES consultation_bookings(id),
        recipient TEXT NOT NULL,
        kind TEXT NOT NULL CHECK(kind IN ('invite','cancel')),
        attempts INTEGER NOT NULL DEFAULT 0,
        claimed_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(booking_id,recipient,kind)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_internal_calendar_pending ON internal_calendar_deliveries(sent_at,attempts,claimed_at) WHERE sent_at IS NULL`;
  },
};
