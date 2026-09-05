import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";

export async function rebuildCompanySummary(targetId: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  await sql`
    INSERT INTO sales_target_company_summaries (
      target_id, canonical_name, canonical_domain, canonical_city,
      canonical_industry, identity_state, enrichment_state,
      qualification_state, current_lead_score_id, current_qualification_id,
      current_website_audit_id, current_sales_brief_id, priority_class,
      total_score, propensity_score, contactability_score, data_confidence,
      opportunity_count, verified_contact_count, decision_maker_count,
      recommended_action, last_observation_at, last_enrichment_at,
      last_milestone_at, freshness_state, summary, provenance_summary,
      source_count, observation_count, rebuilt_at, updated_at
    )
    SELECT
      t.id, t.name, t.domain, t.city, t.industry,
      CASE WHEN rd.id IS NULL THEN 'unresolved' ELSE lower(rd.decision_kind) END,
      lower(t.enrichment_status),
      COALESCE(lower(qd.decision), 'unknown'),
      ls.id, qd.id, wa.id, sb.id, COALESCE(ls.priority_class, t.pre_score_class),
      COALESCE(ls.total_score, t.pre_score), ls.propensity_score, ls.contactability_score,
      ls.evidence_confidence,
      COALESCE(op.cnt, 0), COALESCE(ct.cnt, 0), COALESCE(dm.cnt, 0),
      sb.recommended_action, obs.last_observation_at, t.last_enrichment_at,
      mile.last_milestone_at,
      CASE
        WHEN t.last_enrichment_at IS NULL THEN 'unknown'
        WHEN t.last_enrichment_at < NOW() - INTERVAL '90 days' THEN 'stale'
        ELSE 'fresh'
      END,
      ${sql.json(jsonParam({ projectionVersion: "v1" }))},
      ${sql.json(jsonParam({ source: "canonical-and-evidence" }))},
      COALESCE(src.cnt, 0), COALESCE(obs.cnt, 0), NOW(), NOW()
    FROM sales_target_companies t
    LEFT JOIN LATERAL (
      SELECT * FROM sales_target_resolution_decisions
      WHERE resolved_target_id = t.id ORDER BY decided_at DESC LIMIT 1
    ) rd ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM sales_target_qualification_decisions
      WHERE target_id = t.id ORDER BY decided_at DESC LIMIT 1
    ) qd ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM sales_target_lead_scores
      WHERE target_id = t.id AND is_current = TRUE
      ORDER BY (score_version = 'v2') DESC, calculated_at DESC LIMIT 1
    ) ls ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM sales_target_website_audits
      WHERE target_id = t.id ORDER BY audited_at DESC LIMIT 1
    ) wa ON TRUE
    LEFT JOIN LATERAL (
      SELECT * FROM sales_target_sales_briefs
      WHERE target_id = t.id AND is_current = TRUE ORDER BY generated_at DESC LIMIT 1
    ) sb ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS cnt FROM sales_target_opportunities
      WHERE target_id = t.id AND deleted_at IS NULL
    ) op ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS cnt FROM sales_target_contacts
      WHERE target_id = t.id AND deleted_at IS NULL
        AND verification_status IN ('high','verified')
    ) ct ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS cnt FROM sales_target_decision_makers
      WHERE target_id = t.id AND deleted_at IS NULL
    ) dm ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS cnt FROM sales_target_sources WHERE target_id = t.id
    ) src ON TRUE
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::int AS cnt, MAX(observed_at) AS last_observation_at
      FROM sales_target_raw_observations WHERE target_id = t.id
    ) obs ON TRUE
    LEFT JOIN LATERAL (
      SELECT MAX(occurred_at) AS last_milestone_at
      FROM sales_target_milestone_events WHERE target_id = t.id
    ) mile ON TRUE
    WHERE t.id = ${targetId} AND t.deleted_at IS NULL
    ON CONFLICT (target_id) DO UPDATE SET
      canonical_name = EXCLUDED.canonical_name,
      canonical_domain = EXCLUDED.canonical_domain,
      canonical_city = EXCLUDED.canonical_city,
      canonical_industry = EXCLUDED.canonical_industry,
      identity_state = EXCLUDED.identity_state,
      enrichment_state = EXCLUDED.enrichment_state,
      qualification_state = EXCLUDED.qualification_state,
      current_lead_score_id = EXCLUDED.current_lead_score_id,
      current_qualification_id = EXCLUDED.current_qualification_id,
      current_website_audit_id = EXCLUDED.current_website_audit_id,
      current_sales_brief_id = EXCLUDED.current_sales_brief_id,
      priority_class = EXCLUDED.priority_class,
      total_score = EXCLUDED.total_score,
      propensity_score = EXCLUDED.propensity_score,
      contactability_score = EXCLUDED.contactability_score,
      data_confidence = EXCLUDED.data_confidence,
      opportunity_count = EXCLUDED.opportunity_count,
      verified_contact_count = EXCLUDED.verified_contact_count,
      decision_maker_count = EXCLUDED.decision_maker_count,
      recommended_action = EXCLUDED.recommended_action,
      last_observation_at = EXCLUDED.last_observation_at,
      last_enrichment_at = EXCLUDED.last_enrichment_at,
      last_milestone_at = EXCLUDED.last_milestone_at,
      freshness_state = EXCLUDED.freshness_state,
      summary = EXCLUDED.summary,
      provenance_summary = EXCLUDED.provenance_summary,
      source_count = EXCLUDED.source_count,
      observation_count = EXCLUDED.observation_count,
      version = sales_target_company_summaries.version + 1,
      rebuilt_at = NOW(),
      updated_at = NOW()
  `;
}

