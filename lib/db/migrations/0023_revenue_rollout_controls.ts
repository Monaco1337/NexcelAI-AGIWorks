/**
 * 0023 — Minimal durable canary and rollback controls.
 *
 * Existing current-version pointers remain the baseline. Optional canary
 * pointers and percentages select deterministic cohorts and every assignment
 * is persisted for audit/comparison.
 */

import type { Migration } from "../migrationRunner";

export const migration0023: Migration = {
  id: "0023",
  name: "revenue_rollout_controls",
  up: async (sql) => {
    await sql`
      ALTER TABLE sales_target_provider_config_state
        ADD COLUMN IF NOT EXISTS baseline_config_id TEXT REFERENCES sales_target_provider_configs(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS canary_config_id TEXT REFERENCES sales_target_provider_configs(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS rollout_percentage INTEGER NOT NULL DEFAULT 0
    `;
    await sql`
      ALTER TABLE sales_target_rule_config_state
        ADD COLUMN IF NOT EXISTS baseline_version_id TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS canary_version_id TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS rollout_percentage INTEGER NOT NULL DEFAULT 0
    `;
    await sql`
      ALTER TABLE sales_target_scoring_config_state
        ADD COLUMN IF NOT EXISTS baseline_version_id TEXT REFERENCES sales_target_scoring_config_versions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS canary_version_id TEXT REFERENCES sales_target_scoring_config_versions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS rollout_percentage INTEGER NOT NULL DEFAULT 0
    `;
    await sql`
      UPDATE sales_target_provider_config_state
      SET baseline_config_id = current_config_id
      WHERE baseline_config_id IS NULL AND current_config_id IS NOT NULL
    `;
    await sql`
      UPDATE sales_target_rule_config_state
      SET baseline_version_id = current_version_id
      WHERE baseline_version_id IS NULL AND current_version_id IS NOT NULL
    `;
    await sql`
      UPDATE sales_target_scoring_config_state
      SET baseline_version_id = current_version_id
      WHERE baseline_version_id IS NULL AND current_version_id IS NOT NULL
    `;
    for (const [table, constraint] of [
      ["sales_target_provider_config_state", "sales_target_provider_rollout_percentage"],
      ["sales_target_rule_config_state", "sales_target_rule_rollout_percentage"],
      ["sales_target_scoring_config_state", "sales_target_scoring_rollout_percentage"],
    ] as const) {
      await sql.unsafe(`
        DO $migration$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = '${constraint}'
          ) THEN
            ALTER TABLE ${table}
              ADD CONSTRAINT ${constraint} CHECK (rollout_percentage BETWEEN 0 AND 100);
          END IF;
        END
        $migration$
      `);
    }
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_rollout_assignments (
        id                    TEXT PRIMARY KEY,
        rollout_kind          TEXT NOT NULL,
        config_key            TEXT NOT NULL,
        eligible_key          TEXT NOT NULL,
        cohort                TEXT NOT NULL,
        selected_version_id   TEXT,
        baseline_version_id   TEXT,
        canary_version_id     TEXT,
        rollout_percentage    INTEGER NOT NULL,
        assigned_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT sales_target_rollout_assignment_unique UNIQUE (
          rollout_kind, config_key, eligible_key
        ),
        CONSTRAINT sales_target_rollout_assignment_kind CHECK (
          rollout_kind IN ('provider','qualification','scoring','opportunity')
        ),
        CONSTRAINT sales_target_rollout_assignment_cohort CHECK (
          cohort IN ('baseline','canary')
        ),
        CONSTRAINT sales_target_rollout_assignment_percentage CHECK (
          rollout_percentage BETWEEN 0 AND 100
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_rollout_comparison
        ON sales_target_rollout_assignments (rollout_kind, config_key, cohort, assigned_at DESC)
    `;
  },
};
