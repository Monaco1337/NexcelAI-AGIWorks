import type { Migration } from "../migrationRunner";

/** Additive table creation. No existing data or auth table is modified. */
export const migration0021: Migration = {
  id: "0021",
  name: "admin_push_subscriptions_and_delivery_outbox",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS admin_push_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        p256dh TEXT NOT NULL,
        auth_key TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_push_sub_user ON admin_push_subscriptions(user_id)`;
    await sql`
      CREATE TABLE IF NOT EXISTS admin_push_deliveries (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        subscription_id TEXT NOT NULL REFERENCES admin_push_subscriptions(id) ON DELETE CASCADE,
        brand TEXT NOT NULL CHECK (brand IN ('nexcel','agiworks')),
        lead_type TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        claimed_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        last_http_status INTEGER,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(lead_id,subscription_id)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_push_pending ON admin_push_deliveries(sent_at,attempts,claimed_at) WHERE sent_at IS NULL`;
    await sql`
      CREATE TABLE IF NOT EXISTS admin_alert_emails (
        id TEXT PRIMARY KEY,
        lead_id TEXT NOT NULL,
        recipient TEXT NOT NULL,
        brand TEXT NOT NULL CHECK (brand IN ('nexcel','agiworks')),
        lead_type TEXT NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        claimed_at TIMESTAMPTZ,
        sent_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(lead_id,recipient)
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_admin_alert_emails_pending ON admin_alert_emails(sent_at,attempts,claimed_at) WHERE sent_at IS NULL`;
  },
};
