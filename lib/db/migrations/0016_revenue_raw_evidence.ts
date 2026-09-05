/**
 * 0016 — Revenue Intelligence · immutable raw evidence.
 *
 * Provider payloads and their normalized candidates are append-only. Corrections
 * are represented by superseding rows; source material is never overwritten.
 * Retention metadata is carried on every row so a later retention worker can
 * make explicit, auditable deletion decisions.
 */

import type { Migration } from "../migrationRunner";

export const migration0016: Migration = {
  id: "0016",
  name: "revenue_raw_evidence",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_raw_observations (
        id                    TEXT PRIMARY KEY,
        target_id             TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        search_job_id         TEXT REFERENCES sales_target_search_jobs(id) ON DELETE SET NULL,
        enrichment_job_id     TEXT REFERENCES sales_target_enrichment_jobs(id) ON DELETE SET NULL,
        provider_request_id   TEXT REFERENCES sales_target_provider_requests(id) ON DELETE SET NULL,
        parent_observation_id TEXT REFERENCES sales_target_raw_observations(id) ON DELETE SET NULL,
        provider              TEXT NOT NULL,
        source_kind           TEXT NOT NULL,
        source_locator        TEXT,
        external_record_id    TEXT,
        content_type          TEXT,
        payload               JSONB NOT NULL,
        payload_hash          TEXT NOT NULL,
        idempotency_key       TEXT NOT NULL,
        schema_version        TEXT NOT NULL DEFAULT 'v1',
        observed_at           TIMESTAMPTZ NOT NULL,
        retrieved_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ingested_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id        TEXT,
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class       TEXT NOT NULL DEFAULT 'operational',
        retain_until          TIMESTAMPTZ,
        legal_hold            BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_raw_provider_nonempty CHECK (length(btrim(provider)) > 0),
        CONSTRAINT sales_target_raw_kind_nonempty CHECK (length(btrim(source_kind)) > 0),
        CONSTRAINT sales_target_raw_hash_nonempty CHECK (length(btrim(payload_hash)) > 0)
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_raw_idempotency
        ON sales_target_raw_observations (idempotency_key)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_raw_target
        ON sales_target_raw_observations (target_id, observed_at DESC)
        WHERE target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_raw_provider
        ON sales_target_raw_observations (provider, source_kind, observed_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_raw_hash
        ON sales_target_raw_observations (payload_hash, provider)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_raw_request
        ON sales_target_raw_observations (provider_request_id)
        WHERE provider_request_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_raw_retention
        ON sales_target_raw_observations (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_normalized_candidates (
        id                       TEXT PRIMARY KEY,
        observation_id           TEXT NOT NULL REFERENCES sales_target_raw_observations(id) ON DELETE CASCADE,
        target_id                TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        supersedes_candidate_id  TEXT REFERENCES sales_target_normalized_candidates(id) ON DELETE SET NULL,
        entity_kind              TEXT NOT NULL,
        field_path               TEXT NOT NULL,
        raw_value                JSONB NOT NULL,
        normalized_value         JSONB NOT NULL,
        normalized_text          TEXT,
        normalization_key        TEXT,
        normalizer_name          TEXT NOT NULL,
        normalizer_version       TEXT NOT NULL,
        confidence               NUMERIC(4,3) NOT NULL DEFAULT 0.500,
        produced_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id           TEXT,
        provenance               JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class          TEXT NOT NULL DEFAULT 'operational',
        retain_until             TIMESTAMPTZ,
        legal_hold               BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_candidate_confidence CHECK (confidence BETWEEN 0 AND 1),
        CONSTRAINT sales_target_candidate_entity_nonempty CHECK (length(btrim(entity_kind)) > 0),
        CONSTRAINT sales_target_candidate_field_nonempty CHECK (length(btrim(field_path)) > 0)
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_candidate_idempotency
        ON sales_target_normalized_candidates (
          observation_id, field_path, normalizer_name, normalizer_version
        )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_candidates_observation
        ON sales_target_normalized_candidates (observation_id, produced_at)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_candidates_target
        ON sales_target_normalized_candidates (target_id, entity_kind, field_path, produced_at DESC)
        WHERE target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_candidates_key
        ON sales_target_normalized_candidates (entity_kind, field_path, normalization_key)
        WHERE normalization_key IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_candidates_retention
        ON sales_target_normalized_candidates (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    // UPDATE is forbidden; correction happens by appending a superseding row.
    // DELETE remains available for explicit retention enforcement.
    await sql`
      CREATE OR REPLACE FUNCTION sales_target_block_immutable_update()
      RETURNS trigger
      LANGUAGE plpgsql
      AS $function$
      BEGIN
        -- Allow internal referential actions (ON DELETE SET NULL/CASCADE)
        -- so retention cleanup and parent deletion cannot be deadlocked by
        -- the append-only guard.
        IF pg_trigger_depth() > 1 THEN
          RETURN NEW;
        END IF;
        RAISE EXCEPTION 'table % is append-only; insert a superseding row', TG_TABLE_NAME;
      END
      $function$
    `;
    await sql`
      DO $migration$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'trg_sales_target_raw_immutable'
            AND tgrelid = 'sales_target_raw_observations'::regclass
        ) THEN
          CREATE TRIGGER trg_sales_target_raw_immutable
          BEFORE UPDATE ON sales_target_raw_observations
          FOR EACH ROW EXECUTE FUNCTION sales_target_block_immutable_update();
        END IF;
      END
      $migration$
    `;
    await sql`
      DO $migration$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger
          WHERE tgname = 'trg_sales_target_candidates_immutable'
            AND tgrelid = 'sales_target_normalized_candidates'::regclass
        ) THEN
          CREATE TRIGGER trg_sales_target_candidates_immutable
          BEFORE UPDATE ON sales_target_normalized_candidates
          FOR EACH ROW EXECUTE FUNCTION sales_target_block_immutable_update();
        END IF;
      END
      $migration$
    `;
  },
};
