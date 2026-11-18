import type { Migration } from "../migrationRunner";

/** Additive evolution of migration 0017; never rewrite an applied migration. */
export const migration0018: Migration = {
  id: "0018", name: "consultation_admin_availability_and_approvals",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS consultation_weekly_slots (
        resource_id TEXT NOT NULL, weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
        start_minute SMALLINT NOT NULL CHECK (start_minute BETWEEN 480 AND 1140 AND start_minute % 15 = 0),
        PRIMARY KEY(resource_id,weekday,start_minute)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS consultation_slot_overrides (
        resource_id TEXT NOT NULL, starts_at TIMESTAMPTZ NOT NULL,
        action TEXT NOT NULL CHECK(action IN ('open','block')),
        PRIMARY KEY(resource_id,starts_at)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS consultation_blackout_dates (
        resource_id TEXT NOT NULL, local_date DATE NOT NULL,
        PRIMARY KEY(resource_id,local_date)
      )
    `;
    await sql`ALTER TABLE consultation_bookings DROP CONSTRAINT IF EXISTS consultation_bookings_status_check`;
    await sql`ALTER TABLE consultation_bookings ADD CONSTRAINT consultation_bookings_status_check CHECK (status IN ('pending','confirmed','cancelled'))`;
    await sql`DROP INDEX IF EXISTS uq_consultation_active_resource_slot`;
    await sql`
      CREATE UNIQUE INDEX uq_consultation_active_resource_slot
      ON consultation_bookings(resource_id,starts_at)
      WHERE status IN ('pending','confirmed')
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_consultation_bookings_status ON consultation_bookings(status,starts_at)`;
  },
};
