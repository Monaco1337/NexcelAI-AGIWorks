/**
 * 0025 — Canonical contact idempotency for bulk and retry paths.
 */

import type { Migration } from "../migrationRunner";

export const migration0025: Migration = {
  id: "0025",
  name: "revenue_contact_idempotency",
  up: async (sql) => {
    await sql`
      WITH ranked AS (
        SELECT id,
          ROW_NUMBER() OVER (
            PARTITION BY target_id, kind, normalized_value
            ORDER BY is_preferred DESC, confidence DESC, last_seen_at DESC, id
          ) AS rank
        FROM sales_target_contacts
        WHERE deleted_at IS NULL AND normalized_value IS NOT NULL
      )
      UPDATE sales_target_contacts contact
      SET deleted_at = NOW()
      FROM ranked
      WHERE ranked.id = contact.id AND ranked.rank > 1
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_contacts_identity
        ON sales_target_contacts (target_id, kind, normalized_value)
        WHERE deleted_at IS NULL AND normalized_value IS NOT NULL
    `;
  },
};
