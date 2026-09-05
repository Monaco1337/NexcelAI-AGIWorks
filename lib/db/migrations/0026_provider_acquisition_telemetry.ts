/**
 * 0026 — Evidence-based provider health and failover attribution.
 */

import type { Migration } from "../migrationRunner";

export const migration0026: Migration = {
  id: "0026",
  name: "provider_acquisition_telemetry",
  up: async (sql) => {
    await sql`
      ALTER TABLE sales_target_provider_health
        DROP CONSTRAINT IF EXISTS sales_target_provider_state
    `;
    await sql`
      ALTER TABLE sales_target_provider_health
        ALTER COLUMN state SET DEFAULT 'UNKNOWN'
    `;
    await sql`
      UPDATE sales_target_provider_health
      SET state = 'UNKNOWN'
      WHERE state = 'HEALTHY' AND last_success_at IS NULL
    `;
    await sql`
      ALTER TABLE sales_target_provider_health
        ADD CONSTRAINT sales_target_provider_state CHECK (
          state IN (
            'UNKNOWN','HEALTHY','DEGRADED','RATE_LIMITED',
            'CIRCUIT_OPEN','UNAVAILABLE','MISCONFIGURED'
          )
        )
    `;
    await sql`
      ALTER TABLE sales_target_provider_requests
        ADD COLUMN IF NOT EXISTS error_code TEXT,
        ADD COLUMN IF NOT EXISTS provider_version TEXT,
        ADD COLUMN IF NOT EXISTS attempt_sequence INTEGER NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS fallback_from_provider TEXT,
        ADD COLUMN IF NOT EXISTS fallback_reason TEXT,
        ADD COLUMN IF NOT EXISTS provider_observed_count INTEGER NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS contract_rejected_count INTEGER NOT NULL DEFAULT 0
    `;
    await sql`
      ALTER TABLE sales_target_provider_requests
        DROP CONSTRAINT IF EXISTS sales_target_provider_request_attempt_sequence
    `;
    await sql`
      ALTER TABLE sales_target_provider_requests
        ADD CONSTRAINT sales_target_provider_request_attempt_sequence
        CHECK (
          attempt_sequence > 0
          AND provider_observed_count >= 0
          AND contract_rejected_count >= 0
          AND contract_rejected_count <= provider_observed_count
        )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_provider_request_health_window
        ON sales_target_provider_requests (provider, created_at DESC)
        INCLUDE (response_status, latency_ms, error_code)
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_provider_request_correlation
        ON sales_target_provider_requests (correlation_id, attempt_sequence)
        WHERE correlation_id IS NOT NULL
    `;
    await sql`
      UPDATE sales_target_coverage_partitions
      SET provider_cursor = jsonb_set(provider_cursor, '{provider}', '"portfolio"'::jsonb, true),
          updated_at = NOW()
      WHERE provider_cursor->>'provider' = 'overpass_osm'
    `;
  },
};
