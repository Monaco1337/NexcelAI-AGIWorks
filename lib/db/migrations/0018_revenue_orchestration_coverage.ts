/**
 * 0018 — Revenue Intelligence · durable orchestration, coverage and provider
 * economics.
 *
 * Extends existing queues without changing their status contracts, adds
 * restart-safe per-phase state, captures website fetch evidence, and models
 * geographic coverage plus versioned provider configuration and budgets.
 */

import type { Migration } from "../migrationRunner";

export const migration0018: Migration = {
  id: "0018",
  name: "revenue_orchestration_coverage",
  up: async (sql) => {
    /* Durable leases and idempotency for the existing queues. */
    await sql`
      ALTER TABLE sales_target_search_jobs
        ADD COLUMN IF NOT EXISTS lease_owner TEXT,
        ADD COLUMN IF NOT EXISTS lease_token TEXT,
        ADD COLUMN IF NOT EXISTS leased_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
        ADD COLUMN IF NOT EXISTS correlation_id TEXT,
        ADD COLUMN IF NOT EXISTS last_error_code TEXT,
        ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS dead_lettered_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_search_idempotency
        ON sales_target_search_jobs (idempotency_key)
        WHERE idempotency_key IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_search_lease
        ON sales_target_search_jobs (lease_expires_at, heartbeat_at)
        WHERE status = 'running'
    `;

    await sql`
      ALTER TABLE sales_target_enrichment_jobs
        ADD COLUMN IF NOT EXISTS lease_expires_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS lease_owner TEXT,
        ADD COLUMN IF NOT EXISTS lease_token TEXT,
        ADD COLUMN IF NOT EXISTS leased_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS heartbeat_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS idempotency_key TEXT,
        ADD COLUMN IF NOT EXISTS correlation_id TEXT,
        ADD COLUMN IF NOT EXISTS last_error_code TEXT,
        ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS dead_lettered_at TIMESTAMPTZ
    `;
    await sql`
      ALTER TABLE sales_target_enrichment_jobs
        DROP CONSTRAINT IF EXISTS sales_target_enrichment_status
    `;
    await sql`
      ALTER TABLE sales_target_enrichment_jobs
        ADD CONSTRAINT sales_target_enrichment_status
        CHECK (status IN ('queued','running','done','failed','skipped','cancelled'))
    `;
    await sql`
      UPDATE sales_target_enrichment_jobs
      SET status = 'queued',
          lease_owner = NULL,
          lease_token = NULL,
          lease_expires_at = NULL,
          heartbeat_at = NULL,
          next_attempt_at = NOW(),
          error = COALESCE(error, 'Requeued during durable lease migration'),
          updated_at = NOW()
      WHERE status = 'running' AND lease_expires_at IS NULL
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_enrich_idempotency
        ON sales_target_enrichment_jobs (idempotency_key)
        WHERE idempotency_key IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_enrich_lease
        ON sales_target_enrichment_jobs (lease_expires_at, heartbeat_at)
        WHERE status = 'running'
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_phase_states (
        id                      TEXT PRIMARY KEY,
        target_id               TEXT NOT NULL REFERENCES sales_target_companies(id) ON DELETE CASCADE,
        phase                   TEXT NOT NULL,
        status                  TEXT NOT NULL DEFAULT 'pending',
        revision                INTEGER NOT NULL DEFAULT 1,
        input_fingerprint       TEXT,
        output_fingerprint      TEXT,
        observation_cursor      TIMESTAMPTZ,
        last_job_id             TEXT REFERENCES sales_target_enrichment_jobs(id) ON DELETE SET NULL,
        last_started_at         TIMESTAMPTZ,
        last_succeeded_at       TIMESTAMPTZ,
        last_failed_at          TIMESTAMPTZ,
        next_eligible_at        TIMESTAMPTZ,
        stale_after             TIMESTAMPTZ,
        attempt_count           INTEGER NOT NULL DEFAULT 0,
        consecutive_failures    INTEGER NOT NULL DEFAULT 0,
        blocked_reason          TEXT,
        last_error_code         TEXT,
        last_error              TEXT,
        state                   JSONB NOT NULL DEFAULT '{}'::jsonb,
        version                 INTEGER NOT NULL DEFAULT 1,
        created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_phase_unique UNIQUE (target_id, phase),
        CONSTRAINT sales_target_phase_status CHECK (
          status IN ('pending','queued','running','succeeded','failed','skipped','blocked','stale')
        ),
        CONSTRAINT sales_target_phase_revision_positive CHECK (revision > 0),
        CONSTRAINT sales_target_phase_attempts_nonnegative CHECK (
          attempt_count >= 0 AND consecutive_failures >= 0
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_phase_runnable
        ON sales_target_phase_states (status, next_eligible_at, updated_at)
        WHERE status IN ('pending','failed','stale')
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_phase_target
        ON sales_target_phase_states (target_id, status, phase)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_website_fetches (
        id                    TEXT PRIMARY KEY,
        target_id             TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        enrichment_job_id     TEXT REFERENCES sales_target_enrichment_jobs(id) ON DELETE SET NULL,
        observation_id        TEXT REFERENCES sales_target_raw_observations(id) ON DELETE SET NULL,
        requested_url         TEXT NOT NULL,
        final_url             TEXT,
        http_method           TEXT NOT NULL DEFAULT 'GET',
        http_status           INTEGER,
        started_at            TIMESTAMPTZ NOT NULL,
        completed_at          TIMESTAMPTZ,
        duration_ms           INTEGER,
        request_headers       JSONB NOT NULL DEFAULT '{}'::jsonb,
        response_headers      JSONB NOT NULL DEFAULT '{}'::jsonb,
        redirect_chain        JSONB NOT NULL DEFAULT '[]'::jsonb,
        robots_evidence       JSONB NOT NULL DEFAULT '{}'::jsonb,
        tls_evidence          JSONB NOT NULL DEFAULT '{}'::jsonb,
        content_type          TEXT,
        content_length        BIGINT,
        content_hash          TEXT,
        body_storage_key      TEXT,
        fetcher               TEXT NOT NULL,
        fetcher_version       TEXT NOT NULL,
        error_code            TEXT,
        error                 TEXT,
        correlation_id        TEXT,
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class       TEXT NOT NULL DEFAULT 'operational',
        retain_until          TIMESTAMPTZ,
        legal_hold            BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_fetch_status CHECK (
          http_status IS NULL OR http_status BETWEEN 100 AND 599
        ),
        CONSTRAINT sales_target_fetch_duration CHECK (
          duration_ms IS NULL OR duration_ms >= 0
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_fetch_target
        ON sales_target_website_fetches (target_id, started_at DESC)
        WHERE target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_fetch_hash
        ON sales_target_website_fetches (content_hash)
        WHERE content_hash IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_fetch_retention
        ON sales_target_website_fetches (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_coverage_partitions (
        id                    TEXT PRIMARY KEY,
        parent_partition_id   TEXT REFERENCES sales_target_coverage_partitions(id) ON DELETE SET NULL,
        scope_key             TEXT NOT NULL,
        partition_key         TEXT NOT NULL,
        partition_kind        TEXT NOT NULL DEFAULT 'bbox',
        country               TEXT NOT NULL DEFAULT 'DE',
        region                TEXT,
        locality              TEXT,
        bbox                  JSONB,
        center_lat            DOUBLE PRECISION,
        center_lng            DOUBLE PRECISION,
        radius_km             NUMERIC(8,2),
        depth                 INTEGER NOT NULL DEFAULT 0,
        status                TEXT NOT NULL DEFAULT 'pending',
        expected_entities     INTEGER,
        discovered_entities   INTEGER NOT NULL DEFAULT 0,
        coverage_ratio        NUMERIC(6,5),
        provider_cursor       JSONB NOT NULL DEFAULT '{}'::jsonb,
        last_covered_at       TIMESTAMPTZ,
        next_coverage_at      TIMESTAMPTZ,
        lease_owner           TEXT,
        lease_token           TEXT,
        lease_expires_at      TIMESTAMPTZ,
        version               INTEGER NOT NULL DEFAULT 1,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_coverage_partition_unique UNIQUE (scope_key, partition_key),
        CONSTRAINT sales_target_coverage_partition_status CHECK (
          status IN ('pending','running','covered','partial','failed','paused','retired')
        ),
        CONSTRAINT sales_target_coverage_ratio CHECK (
          coverage_ratio IS NULL OR coverage_ratio BETWEEN 0 AND 1
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_coverage_due
        ON sales_target_coverage_partitions (status, next_coverage_at)
        WHERE status IN ('pending','partial','failed')
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_coverage_scope
        ON sales_target_coverage_partitions (scope_key, status, updated_at DESC)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_coverage_runs (
        id                    TEXT PRIMARY KEY,
        partition_id          TEXT REFERENCES sales_target_coverage_partitions(id) ON DELETE SET NULL,
        search_job_id         TEXT REFERENCES sales_target_search_jobs(id) ON DELETE SET NULL,
        area_scan_id          TEXT REFERENCES sales_target_area_scans(id) ON DELETE SET NULL,
        run_kind              TEXT NOT NULL DEFAULT 'discovery',
        status                TEXT NOT NULL DEFAULT 'queued',
        idempotency_key       TEXT,
        controller_version    TEXT,
        config_snapshot       JSONB NOT NULL DEFAULT '{}'::jsonb,
        checkpoint            JSONB NOT NULL DEFAULT '{}'::jsonb,
        providers_attempted   TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
        request_count         INTEGER NOT NULL DEFAULT 0,
        observation_count     INTEGER NOT NULL DEFAULT 0,
        candidate_count       INTEGER NOT NULL DEFAULT 0,
        new_target_count      INTEGER NOT NULL DEFAULT 0,
        matched_target_count  INTEGER NOT NULL DEFAULT 0,
        estimated_cost_cents  BIGINT NOT NULL DEFAULT 0,
        actual_cost_cents     BIGINT NOT NULL DEFAULT 0,
        currency              TEXT NOT NULL DEFAULT 'EUR',
        error_code            TEXT,
        error                 TEXT,
        started_at            TIMESTAMPTZ,
        heartbeat_at          TIMESTAMPTZ,
        finished_at           TIMESTAMPTZ,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_coverage_run_status CHECK (
          status IN ('queued','running','completed','partial','failed','cancelled')
        )
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_coverage_run_idempotency
        ON sales_target_coverage_runs (idempotency_key)
        WHERE idempotency_key IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_coverage_run_partition
        ON sales_target_coverage_runs (partition_id, created_at DESC)
        WHERE partition_id IS NOT NULL
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_controller_snapshots (
        id                    TEXT PRIMARY KEY,
        partition_id          TEXT REFERENCES sales_target_coverage_partitions(id) ON DELETE SET NULL,
        coverage_run_id       TEXT REFERENCES sales_target_coverage_runs(id) ON DELETE SET NULL,
        controller_key        TEXT NOT NULL,
        controller_version    TEXT NOT NULL,
        sequence_no           INTEGER NOT NULL,
        observed_state        JSONB NOT NULL,
        decision              JSONB NOT NULL,
        issued_work           JSONB NOT NULL DEFAULT '[]'::jsonb,
        budget_state          JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id        TEXT,
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class       TEXT NOT NULL DEFAULT 'audit',
        retain_until          TIMESTAMPTZ,
        legal_hold            BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_controller_sequence CHECK (sequence_no >= 0)
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_controller_run_sequence
        ON sales_target_controller_snapshots (coverage_run_id, sequence_no)
        WHERE coverage_run_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_controller_partition
        ON sales_target_controller_snapshots (partition_id, created_at DESC)
        WHERE partition_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_controller_retention
        ON sales_target_controller_snapshots (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_provider_configs (
        id                    TEXT PRIMARY KEY,
        provider              TEXT NOT NULL,
        version               INTEGER NOT NULL,
        supersedes_config_id  TEXT REFERENCES sales_target_provider_configs(id) ON DELETE SET NULL,
        capabilities          JSONB NOT NULL DEFAULT '[]'::jsonb,
        config                JSONB NOT NULL DEFAULT '{}'::jsonb,
        secret_reference      TEXT,
        pricing               JSONB NOT NULL DEFAULT '{}'::jsonb,
        quota                 JSONB NOT NULL DEFAULT '{}'::jsonb,
        effective_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        CONSTRAINT sales_target_provider_config_unique UNIQUE (provider, version),
        CONSTRAINT sales_target_provider_config_version CHECK (version > 0)
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_provider_config_state (
        provider              TEXT PRIMARY KEY,
        current_config_id     TEXT REFERENCES sales_target_provider_configs(id) ON DELETE SET NULL,
        enabled               BOOLEAN NOT NULL DEFAULT TRUE,
        state                 TEXT NOT NULL DEFAULT 'active',
        disabled_reason       TEXT,
        version               INTEGER NOT NULL DEFAULT 1,
        updated_by            TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_provider_runtime_state CHECK (
          state IN ('active','paused','disabled','testing')
        )
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_provider_budgets (
        id                    TEXT PRIMARY KEY,
        provider              TEXT NOT NULL DEFAULT '*',
        scope_kind            TEXT NOT NULL,
        scope_key             TEXT NOT NULL,
        period_start          TIMESTAMPTZ NOT NULL,
        period_end            TIMESTAMPTZ NOT NULL,
        limit_cents           BIGINT NOT NULL,
        reserved_cents        BIGINT NOT NULL DEFAULT 0,
        spent_cents           BIGINT NOT NULL DEFAULT 0,
        currency              TEXT NOT NULL DEFAULT 'EUR',
        hard_limit            BOOLEAN NOT NULL DEFAULT TRUE,
        version               INTEGER NOT NULL DEFAULT 1,
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_provider_budget_unique UNIQUE (
          provider, scope_kind, scope_key, period_start, period_end
        ),
        CONSTRAINT sales_target_provider_budget_period CHECK (period_end > period_start),
        CONSTRAINT sales_target_provider_budget_values CHECK (
          limit_cents >= 0 AND reserved_cents >= 0 AND spent_cents >= 0
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_provider_budget_lookup
        ON sales_target_provider_budgets (scope_kind, scope_key, period_start, period_end)
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_provider_usage_ledger (
        id                    TEXT PRIMARY KEY,
        provider_request_id   TEXT REFERENCES sales_target_provider_requests(id) ON DELETE SET NULL,
        provider_config_id    TEXT REFERENCES sales_target_provider_configs(id) ON DELETE SET NULL,
        budget_id             TEXT REFERENCES sales_target_provider_budgets(id) ON DELETE SET NULL,
        provider              TEXT NOT NULL,
        endpoint              TEXT NOT NULL,
        usage_kind            TEXT NOT NULL,
        units                 NUMERIC(18,6) NOT NULL DEFAULT 1,
        unit_name             TEXT NOT NULL DEFAULT 'request',
        estimated_cost_cents  BIGINT NOT NULL DEFAULT 0,
        actual_cost_cents     BIGINT NOT NULL DEFAULT 0,
        currency              TEXT NOT NULL DEFAULT 'EUR',
        billable              BOOLEAN NOT NULL DEFAULT TRUE,
        occurred_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id        TEXT,
        provider_metadata     JSONB NOT NULL DEFAULT '{}'::jsonb,
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class       TEXT NOT NULL DEFAULT 'finance',
        retain_until          TIMESTAMPTZ,
        legal_hold            BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_provider_usage_units CHECK (units >= 0),
        CONSTRAINT sales_target_provider_usage_cost CHECK (
          estimated_cost_cents >= 0 AND actual_cost_cents >= 0
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_provider_usage_provider
        ON sales_target_provider_usage_ledger (provider, occurred_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_provider_usage_budget
        ON sales_target_provider_usage_ledger (budget_id, occurred_at DESC)
        WHERE budget_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_provider_usage_retention
        ON sales_target_provider_usage_ledger (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      ALTER TABLE sales_target_provider_requests
        ADD COLUMN IF NOT EXISTS provider_config_id TEXT REFERENCES sales_target_provider_configs(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS budget_id TEXT REFERENCES sales_target_provider_budgets(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS raw_observation_id TEXT REFERENCES sales_target_raw_observations(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS correlation_id TEXT,
        ADD COLUMN IF NOT EXISTS external_request_id TEXT,
        ADD COLUMN IF NOT EXISTS cache_key TEXT,
        ADD COLUMN IF NOT EXISTS estimated_cost_cents BIGINT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'EUR',
        ADD COLUMN IF NOT EXISTS request_units NUMERIC(18,6),
        ADD COLUMN IF NOT EXISTS response_units NUMERIC(18,6),
        ADD COLUMN IF NOT EXISTS response_hash TEXT,
        ADD COLUMN IF NOT EXISTS retry_after TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_pr_correlation
        ON sales_target_provider_requests (correlation_id, created_at)
        WHERE correlation_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_pr_external
        ON sales_target_provider_requests (provider, external_request_id)
        WHERE external_request_id IS NOT NULL
    `;

    for (const [table, trigger] of [
      ["sales_target_website_fetches", "trg_sales_target_fetch_immutable"],
      ["sales_target_controller_snapshots", "trg_sales_target_controller_immutable"],
      ["sales_target_provider_configs", "trg_sales_target_provider_config_immutable"],
      ["sales_target_provider_usage_ledger", "trg_sales_target_provider_usage_immutable"],
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
