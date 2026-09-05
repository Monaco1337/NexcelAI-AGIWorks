import {
  ENRICHMENT_PHASES,
  type EnrichmentPhase,
} from "../model";

/**
 * Canonical enrichment transition graph.
 *
 * Phase handlers may return an explicit list when evidence changes eligibility.
 * When they do not, every execution path (cron, admin worker, full enrichment)
 * falls back to this graph instead of maintaining route-local cascades.
 */
export const ENRICHMENT_PHASE_GRAPH: Readonly<
  Record<EnrichmentPhase, readonly EnrichmentPhase[]>
> = {
  company_basics: ["website_contact"],
  website_contact: ["website_audit", "software_opportunities", "financial_signals"],
  decision_makers: ["lead_score"],
  website_audit: ["software_opportunities", "lead_score"],
  software_opportunities: ["lead_score"],
  financial_signals: ["lead_score"],
  lead_score: ["sales_brief"],
  sales_brief: [],
};

export function isEnrichmentPhase(value: string): value is EnrichmentPhase {
  return (ENRICHMENT_PHASES as readonly string[]).includes(value);
}

export function resolveFollowupPhases(
  phase: EnrichmentPhase,
  explicit: readonly EnrichmentPhase[] | undefined,
): EnrichmentPhase[] {
  return [...(explicit ?? ENRICHMENT_PHASE_GRAPH[phase])];
}

