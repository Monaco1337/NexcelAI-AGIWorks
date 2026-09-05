/**
 * 0022 — Durable, atomic provider-call reservations.
 *
 * A reservation represents concurrency, request-count and cost capacity before
 * an external call starts. It is mutable only while active so failed workers
 * can expire/recover the reservation without losing the immutable usage ledger.
 */

import type { Migration } from "../migrationRunner";

export const migration0022: Migration = {
  id: "0022",
  name: "revenue_provider_call_reservations",
  up: async (sql) => {
    await sql`
      CREATE TABLE IF NOT EXISTS sales_target_provider_call_reservations (
        id                        TEXT PRIMARY KEY,
        idempotency_key           TEXT NOT NULL UNIQUE,
        provider                  TEXT NOT NULL,
        provider_config_id        TEXT REFERENCES sales_target_provider_configs(id) ON DELETE SET NULL,
        provider_budget_id        TEXT REFERENCES sales_target_provider_budgets(id) ON DELETE SET NULL,
        global_budget_id          TEXT REFERENCES sales_target_provider_budgets(id) ON DELETE SET NULL,
        target_id                 TEXT REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        search_job_id             TEXT REFERENCES sales_target_search_jobs(id) ON DELETE SET NULL,
        endpoint                  TEXT NOT NULL,
        status                    TEXT NOT NULL DEFAULT 'reserved',
        estimated_cost_cents      BIGINT NOT NULL DEFAULT 0,
        actual_cost_cents         BIGINT NOT NULL DEFAULT 0,
        expires_at                TIMESTAMPTZ NOT NULL,
        completed_at              TIMESTAMPTZ,
        provider_request_id       TEXT REFERENCES sales_target_provider_requests(id) ON DELETE SET NULL,
        error_code                TEXT,
        outcome                   JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT sales_target_provider_reservation_status CHECK (
          status IN ('reserved','completed','released','expired')
        ),
        CONSTRAINT sales_target_provider_reservation_cost CHECK (
          estimated_cost_cents >= 0 AND actual_cost_cents >= 0
        )
      )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_provider_reservation_active
        ON sales_target_provider_call_reservations (provider, expires_at)
        WHERE status = 'reserved'
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_provider_reservation_recovery
        ON sales_target_provider_call_reservations (expires_at)
        WHERE status = 'reserved'
    `;
  },
};
