/**
 * 0027 — Human ground-truth labels required before golden inclusion.
 */

import type { Migration } from "../migrationRunner";

export const migration0027: Migration = {
  id: "0027",
  name: "golden_dataset_reviews",
  up: async (sql) => {
    await sql`
      ALTER TABLE sales_target_evaluations
        ADD COLUMN IF NOT EXISTS review_status TEXT NOT NULL DEFAULT 'DRAFT',
        ADD COLUMN IF NOT EXISTS review_version TEXT NOT NULL DEFAULT 'v1',
        ADD COLUMN IF NOT EXISTS comparison_target_id TEXT
          REFERENCES sales_target_companies(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS identity_verdict TEXT,
        ADD COLUMN IF NOT EXISTS valid_company BOOLEAN,
        ADD COLUMN IF NOT EXISTS canonical_name_correct BOOLEAN,
        ADD COLUMN IF NOT EXISTS geography_correct BOOLEAN,
        ADD COLUMN IF NOT EXISTS target_fit_verdict TEXT,
        ADD COLUMN IF NOT EXISTS qualification_correct BOOLEAN,
        ADD COLUMN IF NOT EXISTS provenance_complete BOOLEAN,
        ADD COLUMN IF NOT EXISTS review_completed_at TIMESTAMPTZ
    `;
    await sql`
      ALTER TABLE sales_target_evaluations
        DROP CONSTRAINT IF EXISTS sales_target_evaluation_review_status,
        DROP CONSTRAINT IF EXISTS sales_target_evaluation_identity_verdict,
        DROP CONSTRAINT IF EXISTS sales_target_evaluation_target_fit
    `;
    await sql`
      ALTER TABLE sales_target_evaluations
        ADD CONSTRAINT sales_target_evaluation_review_status
          CHECK (review_status IN ('DRAFT','COMPLETED')),
        ADD CONSTRAINT sales_target_evaluation_identity_verdict
          CHECK (
            identity_verdict IS NULL
            OR identity_verdict IN ('SAME_ENTITY','DISTINCT_ENTITY','UNCERTAIN','NOT_APPLICABLE')
          ),
        ADD CONSTRAINT sales_target_evaluation_target_fit
          CHECK (
            target_fit_verdict IS NULL
            OR target_fit_verdict IN ('YES','NO','UNKNOWN')
          )
    `;
    await sql`
      CREATE INDEX IF NOT EXISTS idx_sales_target_evaluation_completed
        ON sales_target_evaluations (target_id, evaluated_at DESC)
        WHERE review_status = 'COMPLETED'
    `;
    await sql`
      UPDATE sales_target_companies company
      SET is_golden_dataset = FALSE, updated_at = NOW()
      WHERE company.is_golden_dataset = TRUE
        AND NOT EXISTS (
          SELECT 1
          FROM sales_target_evaluations evaluation
          WHERE evaluation.target_id = company.id
            AND evaluation.review_status = 'COMPLETED'
        )
    `;
  },
};
