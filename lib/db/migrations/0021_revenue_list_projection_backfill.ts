/**
 * 0021 — Backfill the already-defined company summary projection.
 *
 * Migration 0020 introduced the operational read model but deliberately did
 * not populate legacy rows. The production list now reads current score/brief/
 * audit pointers from that projection, so existing companies need one
 * deterministic bootstrap row. Runtime rebuilds continue to own subsequent
 * projection updates.
 */

import type { Migration } from "../migrationRunner";

export const migration0021: Migration = {
  id: "0021",
  name: "revenue_list_projection_backfill",
  up: async (sql) => {
    await sql`
      WITH latest_score AS (
        SELECT DISTINCT ON (target_id)
          id, target_id, priority_class, total_score, propensity_score,
          contactability_score, evidence_confidence
        FROM sales_target_lead_scores
        WHERE is_current = TRUE
        ORDER BY target_id, (score_version = 'v2') DESC, calculated_at DESC
      ),
      latest_brief AS (
        SELECT DISTINCT ON (target_id) id, target_id, recommended_action
        FROM sales_target_sales_briefs
        WHERE is_current = TRUE
        ORDER BY target_id, generated_at DESC
      ),
      latest_audit AS (
        SELECT DISTINCT ON (target_id) id, target_id
        FROM sales_target_website_audits
        ORDER BY target_id, audited_at DESC
      ),
      latest_qualification AS (
        SELECT DISTINCT ON (target_id) id, target_id, decision
        FROM sales_target_qualification_decisions
        ORDER BY target_id, decided_at DESC
      )
      INSERT INTO sales_target_company_summaries (
        target_id, canonical_name, canonical_domain, canonical_city,
        canonical_industry, enrichment_state, qualification_state,
        current_lead_score_id, current_qualification_id,
        current_website_audit_id, current_sales_brief_id,
        priority_class, total_score, propensity_score, contactability_score,
        data_confidence, recommended_action, last_enrichment_at,
        freshness_state, summary, provenance_summary
      )
      SELECT
        target.id, target.name, target.domain, target.city, target.industry,
        lower(target.enrichment_status),
        COALESCE(lower(qualification.decision), 'unknown'),
        score.id, qualification.id, audit.id, brief.id,
        COALESCE(score.priority_class, target.pre_score_class),
        COALESCE(score.total_score, target.pre_score),
        score.propensity_score, score.contactability_score,
        score.evidence_confidence, brief.recommended_action,
        target.last_enrichment_at,
        CASE
          WHEN target.last_enrichment_at IS NULL THEN 'unknown'
          WHEN target.last_enrichment_at < NOW() - INTERVAL '90 days' THEN 'stale'
          ELSE 'fresh'
        END,
        '{"projectionVersion":"v1"}'::jsonb,
        '{"source":"migration-0021"}'::jsonb
      FROM sales_target_companies target
      LEFT JOIN latest_score score ON score.target_id = target.id
      LEFT JOIN latest_brief brief ON brief.target_id = target.id
      LEFT JOIN latest_audit audit ON audit.target_id = target.id
      LEFT JOIN latest_qualification qualification ON qualification.target_id = target.id
      WHERE target.deleted_at IS NULL
      ON CONFLICT (target_id) DO NOTHING
    `;
  },
};
