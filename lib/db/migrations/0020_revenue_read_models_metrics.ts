/**
 * 0020 — Revenue Intelligence · current read model, metrics and provenance.
 *
 * Adds a single mutable company summary for operational reads while preserving
 * immutable metric events underneath mutable/rebuildable rollups. Existing
 * evidence tables gain common lineage and retention fields.
 */

import type { Migration } from "../migrationRunner";

export const migration0020: Migration = {
  id: "0020",
  name: "revenue_read_models_metrics",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_company_summaries (
        target_id                    TEXT PRIMARY KEY REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        canonical_name               TEXT NOT NULL,
        canonical_domain             TEXT,
        canonical_city               TEXT,
        canonical_industry           TEXT,
        identity_state               TEXT NOT NULL DEFAULT 'unresolved',
        enrichment_state             TEXT NOT NULL DEFAULT 'pending',
        qualification_state          TEXT NOT NULL DEFAULT 'unknown',
        coverage_state               TEXT,
        current_lead_score_id         TEXT REFERENCES sales_target_lead_scores(id) ON DELETE SET NULL,
        current_qualification_id      TEXT REFERENCES sales_target_qualification_decisions(id) ON DELETE SET NULL,
        current_website_audit_id      TEXT REFERENCES sales_target_website_audits(id) ON DELETE SET NULL,
        current_sales_brief_id        TEXT REFERENCES sales_target_sales_briefs(id) ON DELETE SET NULL,
        priority_class                TEXT,
        total_score                   INTEGER,
        propensity_score              INTEGER,
        contactability_score          INTEGER,
        data_confidence               NUMERIC(4,3),
        opportunity_count             INTEGER NOT NULL DEFAULT 0,
        verified_contact_count        INTEGER NOT NULL DEFAULT 0,
        decision_maker_count          INTEGER NOT NULL DEFAULT 0,
        recommended_action            TEXT,
        last_observation_at            TIMESTAMPTZ,
        last_enrichment_at             TIMESTAMPTZ,
        last_milestone_at              TIMESTAMPTZ,
        stale_after                    TIMESTAMPTZ,
        freshness_state                TEXT NOT NULL DEFAULT 'unknown',
        summary                        JSONB NOT NULL DEFAULT '{}'::jsonb,
        provenance_summary             JSONB NOT NULL DEFAULT '{}'::jsonb,
        source_count                   INTEGER NOT NULL DEFAULT 0,
        observation_count              INTEGER NOT NULL DEFAULT 0,
        version                        INTEGER NOT NULL DEFAULT 1,
        rebuilt_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_summary_confidence CHECK (
          data_confidence IS NULL OR data_confidence BETWEEN 0 AND 1
        ),
        CONSTRAINT sales_target_summary_counts CHECK (
          opportunity_count >= 0
          AND verified_contact_count >= 0
          AND decision_maker_count >= 0
          AND source_count >= 0
          AND observation_count >= 0
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_summary_priority
        ON sales_target_company_summaries (priority_class, total_score DESC NULLS LAST, updated_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_summary_qualification
        ON sales_target_company_summaries (qualification_state, total_score DESC NULLS LAST)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_summary_freshness
        ON sales_target_company_summaries (freshness_state, stale_after)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_summary_domain
        ON sales_target_company_summaries (canonical_domain)
        WHERE canonical_domain IS NOT NULL
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_metric_events (
        id                        TEXT PRIMARY KEY,
        metric_key                TEXT NOT NULL,
        event_kind                TEXT NOT NULL DEFAULT 'increment',
        target_id                 TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        coverage_run_id           TEXT REFERENCES sales_target_coverage_runs(id) ON DELETE SET NULL,
        provider_request_id       TEXT REFERENCES sales_target_provider_requests(id) ON DELETE SET NULL,
        milestone_event_id        TEXT REFERENCES sales_target_milestone_events(id) ON DELETE SET NULL,
        rule_config_version_id    TEXT REFERENCES sales_target_rule_config_versions(id) ON DELETE SET NULL,
        scoring_config_version_id TEXT REFERENCES sales_target_scoring_config_versions(id) ON DELETE SET NULL,
        value                     NUMERIC(24,8) NOT NULL,
        unit                      TEXT NOT NULL DEFAULT 'count',
        dimensions                JSONB NOT NULL DEFAULT '{}'::jsonb,
        source_system             TEXT NOT NULL,
        deduplication_key         TEXT,
        occurred_at               TIMESTAMPTZ NOT NULL,
        recorded_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id            TEXT,
        provenance                JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class           TEXT NOT NULL DEFAULT 'analytics',
        retain_until              TIMESTAMPTZ,
        legal_hold                BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_metric_key_nonempty CHECK (length(btrim(metric_key)) > 0),
        CONSTRAINT sales_target_metric_event_kind CHECK (
          event_kind IN ('increment','gauge','timing','currency','ratio')
        )
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_metric_dedup
        ON sales_target_metric_events (source_system, deduplication_key)
        WHERE deduplication_key IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_metric_time
        ON sales_target_metric_events (metric_key, occurred_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_metric_target
        ON sales_target_metric_events (target_id, metric_key, occurred_at DESC)
        WHERE target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_metric_retention
        ON sales_target_metric_events (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_metric_rollups (
        id                    TEXT PRIMARY KEY,
        metric_key            TEXT NOT NULL,
        grain                 TEXT NOT NULL,
        window_start          TIMESTAMPTZ NOT NULL,
        window_end            TIMESTAMPTZ NOT NULL,
        dimension_key         TEXT NOT NULL DEFAULT '*',
        dimensions            JSONB NOT NULL DEFAULT '{}'::jsonb,
        event_count           BIGINT NOT NULL DEFAULT 0,
        value_sum             NUMERIC(30,8) NOT NULL DEFAULT 0,
        value_min             NUMERIC(24,8),
        value_max             NUMERIC(24,8),
        value_avg             NUMERIC(24,8),
        numerator             NUMERIC(30,8),
        denominator           NUMERIC(30,8),
        unit                  TEXT NOT NULL DEFAULT 'count',
        is_complete           BOOLEAN NOT NULL DEFAULT FALSE,
        source_watermark      TIMESTAMPTZ,
        revision              INTEGER NOT NULL DEFAULT 1,
        computed_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_metric_rollup_unique UNIQUE (
          metric_key, grain, window_start, window_end, dimension_key
        ),
        CONSTRAINT sales_target_metric_rollup_window CHECK (window_end > window_start),
        CONSTRAINT sales_target_metric_rollup_count CHECK (event_count >= 0),
        CONSTRAINT sales_target_metric_rollup_revision CHECK (revision > 0)
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_metric_rollup_lookup
        ON sales_target_metric_rollups (metric_key, grain, window_start DESC, dimension_key)
    `;

    /* Common lineage/retention vocabulary on pre-existing evidence. */
    await sql`
      ALTER TABLE sales_target_sources
        ADD COLUMN IF NOT EXISTS raw_observation_id TEXT REFERENCES sales_target_raw_observations(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS normalized_candidate_id TEXT REFERENCES sales_target_normalized_candidates(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS correlation_id TEXT,
        ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS retention_class TEXT NOT NULL DEFAULT 'operational',
        ADD COLUMN IF NOT EXISTS retain_until TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_sources_observation
        ON sales_target_sources (raw_observation_id)
        WHERE raw_observation_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_sources_retention
        ON sales_target_sources (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      ALTER TABLE sales_target_website_audits
        ADD COLUMN IF NOT EXISTS website_fetch_id TEXT REFERENCES sales_target_website_fetches(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS raw_observation_id TEXT REFERENCES sales_target_raw_observations(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS correlation_id TEXT,
        ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS retention_class TEXT NOT NULL DEFAULT 'operational',
        ADD COLUMN IF NOT EXISTS retain_until TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_audits_fetch
        ON sales_target_website_audits (website_fetch_id)
        WHERE website_fetch_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_audits_retention
        ON sales_target_website_audits (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      ALTER TABLE sales_target_provider_requests
        ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS retention_class TEXT NOT NULL DEFAULT 'operational',
        ADD COLUMN IF NOT EXISTS retain_until TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_pr_retention
        ON sales_target_provider_requests (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      ALTER TABLE sales_target_outcomes
        ADD COLUMN IF NOT EXISTS source_system TEXT,
        ADD COLUMN IF NOT EXISTS source_event_id TEXT,
        ADD COLUMN IF NOT EXISTS correlation_id TEXT,
        ADD COLUMN IF NOT EXISTS provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
        ADD COLUMN IF NOT EXISTS retention_class TEXT NOT NULL DEFAULT 'audit',
        ADD COLUMN IF NOT EXISTS retain_until TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS legal_hold BOOLEAN NOT NULL DEFAULT FALSE
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_outcomes_source
        ON sales_target_outcomes (source_system, source_event_id)
        WHERE source_system IS NOT NULL AND source_event_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_outcomes_retention
        ON sales_target_outcomes (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      DO $migration$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'trg_sales_target_metric_event_immutable'
            AND tgrelid = 'sales_target_metric_events'::regclass
        ) THEN
          CREATE TRIGGER trg_sales_target_metric_event_immutable
          BEFORE UPDATE ON sales_target_metric_events
          FOR EACH ROW EXECUTE FUNCTION sales_target_block_immutable_update();
        END IF;
      END
      $migration$
    `;
  },
};
