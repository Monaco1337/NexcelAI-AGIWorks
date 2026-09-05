/**
 * 0019 — Revenue Intelligence · immutable decision and configuration history.
 *
 * Mutable "current" pointers are kept separate from immutable rule/scoring
 * versions. Qualification and milestone facts are append-only and can point to
 * the exact configuration versions that produced them.
 */

import type { Migration } from "../migrationRunner";

export const migration0019: Migration = {
  id: "0019",
  name: "revenue_qualification_config",
  up: async (sql) => {
    await sql`
      ALTER TABLE sales_target_scoring_config
        ADD COLUMN IF NOT EXISTS threshold_a_plus_plus INTEGER NOT NULL DEFAULT 92
    `;
    await sql`
      UPDATE sales_target_scoring_config
      SET weights = (weights #>> '{}')::jsonb
      WHERE jsonb_typeof(weights) = 'string'
    `;
    await sql`
      UPDATE sales_target_scoring_config
      SET project_value_tiers = (project_value_tiers #>> '{}')::jsonb
      WHERE jsonb_typeof(project_value_tiers) = 'string'
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_rule_config_versions (
        id                    TEXT PRIMARY KEY,
        config_key            TEXT NOT NULL,
        version               INTEGER NOT NULL,
        supersedes_version_id TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        definition            JSONB NOT NULL,
        content_hash          TEXT NOT NULL,
        engine_version        TEXT NOT NULL,
        effective_from        TIMESTAMPTZ,
        effective_until       TIMESTAMPTZ,
        change_note           TEXT NOT NULL DEFAULT '',
        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT sales_target_rule_config_unique UNIQUE (config_key, version),
        CONSTRAINT sales_target_rule_config_version CHECK (version > 0),
        CONSTRAINT sales_target_rule_config_window CHECK (
          effective_until IS NULL
          OR effective_from IS NULL
          OR effective_until > effective_from
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_rule_config_effective
        ON sales_target_rule_config_versions (config_key, effective_from DESC, version DESC)
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_rule_config_state (
        config_key            TEXT PRIMARY KEY,
        current_version_id    TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        enabled               BOOLEAN NOT NULL DEFAULT TRUE,
        version               INTEGER NOT NULL DEFAULT 1,
        updated_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_scoring_config_versions (
        id                    TEXT PRIMARY KEY,
        config_key            TEXT NOT NULL,
        version               INTEGER NOT NULL,
        supersedes_version_id TEXT REFERENCES sales_target_scoring_config_versions(id) ON DELETE SET NULL,
        score_version         TEXT NOT NULL,
        weights               JSONB NOT NULL DEFAULT '{}'::jsonb,
        thresholds            JSONB NOT NULL DEFAULT '{}'::jsonb,
        value_tiers           JSONB NOT NULL DEFAULT '{}'::jsonb,
        feature_contract      JSONB NOT NULL DEFAULT '{}'::jsonb,
        model_metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
        content_hash          TEXT NOT NULL,
        effective_from        TIMESTAMPTZ,
        effective_until       TIMESTAMPTZ,
        change_note           TEXT NOT NULL DEFAULT '',
        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT sales_target_scoring_config_version_unique UNIQUE (config_key, version),
        CONSTRAINT sales_target_scoring_config_version_positive CHECK (version > 0),
        CONSTRAINT sales_target_scoring_config_window CHECK (
          effective_until IS NULL
          OR effective_from IS NULL
          OR effective_until > effective_from
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_scoring_config_effective
        ON sales_target_scoring_config_versions (config_key, effective_from DESC, version DESC)
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_scoring_config_state (
        config_key            TEXT PRIMARY KEY,
        current_version_id    TEXT REFERENCES sales_target_scoring_config_versions(id) ON DELETE SET NULL,
        enabled               BOOLEAN NOT NULL DEFAULT TRUE,
        version               INTEGER NOT NULL DEFAULT 1,
        updated_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await sql`
      ALTER TABLE sales_target_opportunities
        ADD COLUMN IF NOT EXISTS rule_config_version_id TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS rule_version TEXT NOT NULL DEFAULT 'legacy-v1',
        ADD COLUMN IF NOT EXISTS evidence_confidence NUMERIC(4,3)
    `;
    await sql`
      ALTER TABLE sales_target_sales_briefs
        ADD COLUMN IF NOT EXISTS rule_config_version_id TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS scoring_config_version_id TEXT REFERENCES sales_target_scoring_config_versions(id) ON DELETE SET NULL
    `;

    await sql`
      ALTER TABLE sales_target_lead_scores
        ADD COLUMN IF NOT EXISTS rule_config_version_id TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS scoring_config_version_id TEXT REFERENCES sales_target_scoring_config_versions(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS feature_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_scores_config
        ON sales_target_lead_scores (scoring_config_version_id, calculated_at DESC)
        WHERE scoring_config_version_id IS NOT NULL
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_qualification_decisions (
        id                        TEXT PRIMARY KEY,
        target_id                 TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        supersedes_decision_id    TEXT REFERENCES sales_target_qualification_decisions(id) ON DELETE SET NULL,
        lead_score_id             TEXT REFERENCES sales_target_lead_scores(id) ON DELETE SET NULL,
        rule_config_version_id    TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        scoring_config_version_id TEXT REFERENCES sales_target_scoring_config_versions(id) ON DELETE SET NULL,
        qualification_type        TEXT NOT NULL DEFAULT 'sales_readiness',
        decision                  TEXT NOT NULL,
        score                     NUMERIC(8,4),
        confidence                NUMERIC(4,3),
        reason_codes              TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        rationale                 JSONB NOT NULL DEFAULT '{}'::jsonb,
        evidence                  JSONB NOT NULL DEFAULT '[]'::jsonb,
        threshold_snapshot        JSONB NOT NULL DEFAULT '{}'::jsonb,
        decision_source           TEXT NOT NULL,
        decided_by                TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        decided_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        effective_until           TIMESTAMPTZ,
        correlation_id            TEXT,
        provenance                JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class           TEXT NOT NULL DEFAULT 'audit',
        retain_until              TIMESTAMPTZ,
        legal_hold                BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_qualification_decision CHECK (
          decision IN ('QUALIFIED','DISQUALIFIED','REVIEW_REQUIRED','DEFERRED')
        ),
        CONSTRAINT sales_target_qualification_confidence CHECK (
          confidence IS NULL OR confidence BETWEEN 0 AND 1
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_qualification_target
        ON sales_target_qualification_decisions (target_id, decided_at DESC)
        WHERE target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_qualification_queue
        ON sales_target_qualification_decisions (decision, decided_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_qualification_retention
        ON sales_target_qualification_decisions (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_milestone_events (
        id                        TEXT PRIMARY KEY,
        target_id                 TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        linked_sales_company_id   TEXT REFERENCES sales_companies(id) ON DELETE SET NULL,
        qualification_decision_id TEXT REFERENCES sales_target_qualification_decisions(id) ON DELETE SET NULL,
        coverage_run_id           TEXT REFERENCES sales_target_coverage_runs(id) ON DELETE SET NULL,
        milestone_key             TEXT NOT NULL,
        source_system             TEXT NOT NULL,
        source_event_id           TEXT,
        occurred_at               TIMESTAMPTZ NOT NULL,
        recorded_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        actor_id                  TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        dimensions                JSONB NOT NULL DEFAULT '{}'::jsonb,
        values                    JSONB NOT NULL DEFAULT '{}'::jsonb,
        correlation_id            TEXT,
        provenance                JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class           TEXT NOT NULL DEFAULT 'audit',
        retain_until              TIMESTAMPTZ,
        legal_hold                BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_milestone_key_nonempty CHECK (length(btrim(milestone_key)) > 0)
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_milestone_source
        ON sales_target_milestone_events (source_system, source_event_id)
        WHERE source_event_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_milestone_target
        ON sales_target_milestone_events (target_id, occurred_at DESC)
        WHERE target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_milestone_key
        ON sales_target_milestone_events (milestone_key, occurred_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_milestone_retention
        ON sales_target_milestone_events (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    for (const [table, trigger] of [
      ["sales_target_rule_config_versions", "trg_sales_target_rule_config_immutable"],
      ["sales_target_scoring_config_versions", "trg_sales_target_score_config_immutable"],
      ["sales_target_qualification_decisions", "trg_sales_target_qualification_immutable"],
      ["sales_target_milestone_events", "trg_sales_target_milestone_immutable"],
    ] as const) {
      await sql.unsafe(`
        DO $migration$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_trigger
            WHERE tgname = '${trigger}'
              AND tgrelid = '${table}'::regclass
          ) THEN
            CREATE TRIGGER ${trigger}
            BEFORE UPDATE ON ${table}
            FOR EACH ROW EXECUTE FUNCTION sales_target_block_immutable_update();
          END IF;
        END
        $migration$
      `);
    }
  },
};
