/**
 * 0024 — Controlled dead-letter replay metadata.
 *
 * The append-only reversible merge ledger already exists since migration
 * 0017; merge/split remediation wires the production routes to that ledger.
 */

import type { Migration } from "../migrationRunner";

export const migration0024: Migration = {
  id: "0024",
  name: "revenue_replay_metadata",
  up: async (sql) => {
    await sql`
      ALTER TABLE sales_target_enrichment_jobs
        ADD COLUMN IF NOT EXISTS replay_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_replayed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_replayed_by TEXT REFERENCES crm_users(id) ON DELETE SET NULL
    `;
    await sql`
      ALTER TABLE sales_target_search_jobs
        ADD COLUMN IF NOT EXISTS replay_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS last_replayed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS last_replayed_by TEXT REFERENCES crm_users(id) ON DELETE SET NULL
    `;
  },
};
