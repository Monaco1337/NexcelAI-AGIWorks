/** Additive traceability between approved commercial quote snapshots and their authenticated sources. */
import type { Migration } from '../migrationRunner';
export const migration0023: Migration = {
  id: '0023', name: 'internal_quote_consultation_source', up: async (sql) => {
    await sql`ALTER TABLE internal_pricing_quotes ADD COLUMN IF NOT EXISTS source_type TEXT`;
    await sql`ALTER TABLE internal_pricing_quotes ADD COLUMN IF NOT EXISTS source_id TEXT`;
    await sql`CREATE INDEX IF NOT EXISTS internal_pricing_quote_source_idx ON internal_pricing_quotes (brand, source_type, source_id)`;
  },
};
