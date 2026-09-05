/**
 * 0017 — Revenue Intelligence · identity claims and resolution ledger.
 *
 * Identity inputs, resolver decisions and merge actions are append-only
 * ledgers. No company row is silently rewritten to hide how an identity was
 * chosen or later corrected.
 */

import type { Migration } from "../migrationRunner";

export const migration0017: Migration = {
  id: "0017",
  name: "revenue_identity_resolution",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_identity_claims (
        id                  TEXT PRIMARY KEY,
        target_id           TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        candidate_id        TEXT REFERENCES sales_target_normalized_candidates(id) ON DELETE SET NULL,
        observation_id      TEXT REFERENCES sales_target_raw_observations(id) ON DELETE SET NULL,
        subject_kind        TEXT NOT NULL DEFAULT 'company',
        claim_kind          TEXT NOT NULL,
        namespace           TEXT NOT NULL,
        claimed_value       TEXT NOT NULL,
        normalized_value    TEXT NOT NULL,
        identity_key_hash   TEXT NOT NULL,
        asserted_by         TEXT NOT NULL,
        confidence          NUMERIC(4,3) NOT NULL DEFAULT 0.500,
        asserted_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at          TIMESTAMPTZ,
        correlation_id      TEXT,
        provenance          JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class     TEXT NOT NULL DEFAULT 'audit',
        retain_until        TIMESTAMPTZ,
        legal_hold          BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_identity_confidence CHECK (confidence BETWEEN 0 AND 1),
        CONSTRAINT sales_target_identity_namespace_nonempty CHECK (length(btrim(namespace)) > 0),
        CONSTRAINT sales_target_identity_value_nonempty CHECK (length(btrim(normalized_value)) > 0)
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_identity_idempotency
        ON sales_target_identity_claims (candidate_id, namespace, identity_key_hash)
        WHERE candidate_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_identity_key
        ON sales_target_identity_claims (namespace, identity_key_hash, asserted_at DESC)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_identity_target
        ON sales_target_identity_claims (target_id, asserted_at DESC)
        WHERE target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_identity_candidate
        ON sales_target_identity_claims (candidate_id)
        WHERE candidate_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_identity_retention
        ON sales_target_identity_claims (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_resolution_decisions (
        id                      TEXT PRIMARY KEY,
        claim_id                TEXT REFERENCES sales_target_identity_claims(id) ON DELETE SET NULL,
        candidate_id            TEXT REFERENCES sales_target_normalized_candidates(id) ON DELETE SET NULL,
        observation_id          TEXT REFERENCES sales_target_raw_observations(id) ON DELETE SET NULL,
        resolved_target_id      TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        supersedes_decision_id  TEXT REFERENCES sales_target_resolution_decisions(id) ON DELETE SET NULL,
        decision_kind           TEXT NOT NULL,
        resolver                TEXT NOT NULL,
        resolver_version        TEXT NOT NULL,
        confidence              NUMERIC(4,3),
        rationale               JSONB NOT NULL DEFAULT '{}'::jsonb,
        evidence                JSONB NOT NULL DEFAULT '[]'::jsonb,
        config_snapshot         JSONB NOT NULL DEFAULT '{}'::jsonb,
        decided_by              TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        decided_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id          TEXT,
        provenance              JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class         TEXT NOT NULL DEFAULT 'audit',
        retain_until            TIMESTAMPTZ,
        legal_hold              BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_resolution_kind CHECK (
          decision_kind IN ('LINK','CREATE','REJECT','DEFER','SPLIT','NO_MATCH')
        ),
        CONSTRAINT sales_target_resolution_confidence CHECK (
          confidence IS NULL OR confidence BETWEEN 0 AND 1
        )
      )
    `;
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_target_resolution_idempotency
        ON sales_target_resolution_decisions (candidate_id, resolver, resolver_version)
        WHERE candidate_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_resolution_claim
        ON sales_target_resolution_decisions (claim_id, decided_at DESC)
        WHERE claim_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_resolution_target
        ON sales_target_resolution_decisions (resolved_target_id, decided_at DESC)
        WHERE resolved_target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_resolution_correlation
        ON sales_target_resolution_decisions (correlation_id, decided_at)
        WHERE correlation_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_resolution_retention
        ON sales_target_resolution_decisions (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_merge_ledger (
        id                    TEXT PRIMARY KEY,
        operation             TEXT NOT NULL,
        source_target_id      TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        destination_target_id TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        resolution_decision_id TEXT REFERENCES sales_target_resolution_decisions(id) ON DELETE SET NULL,
        reverses_ledger_id    TEXT REFERENCES sales_target_merge_ledger(id) ON DELETE SET NULL,
        source_snapshot       JSONB NOT NULL DEFAULT '{}'::jsonb,
        destination_snapshot  JSONB NOT NULL DEFAULT '{}'::jsonb,
        moved_relations       JSONB NOT NULL DEFAULT '{}'::jsonb,
        reason                TEXT NOT NULL,
        policy_key            TEXT,
        policy_version        TEXT,
        actor_id              TEXT REFERENCES crm_users(id) ON DELETE SET NULL,
        occurred_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        correlation_id        TEXT,
        provenance            JSONB NOT NULL DEFAULT '{}'::jsonb,
        retention_class       TEXT NOT NULL DEFAULT 'audit',
        retain_until          TIMESTAMPTZ,
        legal_hold            BOOLEAN NOT NULL DEFAULT FALSE,
        CONSTRAINT sales_target_merge_operation CHECK (operation IN ('MERGE','UNMERGE')),
        CONSTRAINT sales_target_merge_distinct CHECK (
          source_target_id IS NULL
          OR destination_target_id IS NULL
          OR source_target_id <> destination_target_id
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_merge_source
        ON sales_target_merge_ledger (source_target_id, occurred_at DESC)
        WHERE source_target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_merge_destination
        ON sales_target_merge_ledger (destination_target_id, occurred_at DESC)
        WHERE destination_target_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_merge_reversal
        ON sales_target_merge_ledger (reverses_ledger_id)
        WHERE reverses_ledger_id IS NOT NULL
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_merge_retention
        ON sales_target_merge_ledger (retain_until)
        WHERE retain_until IS NOT NULL AND legal_hold = FALSE
    `;

    for (const [table, trigger] of [
      ["sales_target_identity_claims", "trg_sales_target_identity_immutable"],
      ["sales_target_resolution_decisions", "trg_sales_target_resolution_immutable"],
      ["sales_target_merge_ledger", "trg_sales_target_merge_immutable"],
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
