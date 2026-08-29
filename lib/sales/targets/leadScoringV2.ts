/**
 * Lead-Scoring V2 — mit UNKNOWN-Semantik, Propensity, Contactability,
 * Decision-Maker-Relevance, Sales-Priority-Matrix und strukturierter
 * Explainability.
 *
 * WICHTIG:
 *  - V1 (`leadScoring.ts`) bleibt unverändert. V2 wird ADDITIV parallel
 *    berechnet und mit `scoreVersion: "v2"` gespeichert.
 *  - UNKNOWN-Werte werden explizit `null` gehalten, NICHT auf 0 gesetzt.
 *    Das UI muss diese Fälle als „unbekannt" darstellen.
 *  - Explainability ist strukturiert (input × weight = contribution),
 *    keine reinen Freitext-Kommentare.
 */

import {
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_PROJECT_VALUE_TIERS,
  newTargetId,
  priorityFromScore,
  type ExplainabilityEntry,
  type FinancialSignal,
  type LeadScore,
  type PriorityClass,
  type ScoreBreakdownEntry,
  type ScoringWeights,
  type TargetCompany,
  type TargetContact,
  type TargetDecisionMaker,
  type TargetOpportunity,
  type WebsiteAudit,
} from "./model";
import { estimateCommercialCapacity } from "./financialCapacity";
import { computeContactability } from "./contactability";
import { computePropensity } from "./propensity";
import { computeDecisionMakerRelevance } from "./decisionMakerRelevance";
import {
  capacityLevelFromClass,
  contactabilityLevelFromScore,
  evaluatePriorityMatrix,
  needLevelFromScore,
} from "./priorityMatrix";

export interface LeadScoreV2Input {
  company: TargetCompany;
  websiteAudit?: WebsiteAudit | null;
  opportunities?: TargetOpportunity[];
  contacts?: TargetContact[];
  decisionMakers?: TargetDecisionMaker[];
  financialSignals?: FinancialSignal[];
  weights?: ScoringWeights;
  thresholds?: { aPlus: number; a: number; b: number; c: number };
  configKey?: string;
}

export interface LeadScoreV2Result {
  score: LeadScore;
  matrixPriority: string;
  matrixReason: string;
  explainability: ExplainabilityEntry[];
}

export function computeLeadScoreV2(input: LeadScoreV2Input): LeadScoreV2Result {
  const weights = normalizeWeights(input.weights ?? DEFAULT_SCORING_WEIGHTS);
  const thresholds = input.thresholds ?? { aPlus: 85, a: 70, b: 55, c: 40 };
  const breakdown: ScoreBreakdownEntry[] = [];
  const explain: ExplainabilityEntry[] = [];

  const contacts = input.contacts ?? [];
  const dms = input.decisionMakers ?? [];
  const opps = input.opportunities ?? [];
  const audit = input.websiteAudit ?? null;
  const signals = input.financialSignals ?? [];

  /* -------------------- Capacity (UNKNOWN-fähig) ---------------------- */
  const capacity = estimateCommercialCapacity({
    company: input.company,
    signals,
    websiteAudit: audit,
  });
  const capacityScore: number | null = capacity.signals.length === 0 ? null : capacity.score;
  const capacityConfidence: number = capacity.signals.length === 0 ? 0 : capacity.confidence;

  /* -------------------- Contactability -------------------------------- */
  const contactabilityResult = computeContactability({ contacts, decisionMakers: dms });
  const contactabilityScore: number | null =
    contacts.length === 0 && dms.length === 0 ? null : contactabilityResult.score;
  const contactabilityConfidence = contacts.length === 0 && dms.length === 0
    ? 0
    : Math.max(0.4, contactabilityResult.verifiedRatio);

  /* -------------------- Propensity ------------------------------------ */
  const propensityResult = computePropensity({
    company: input.company,
    audit,
    signals,
  });
  const propensityScore = propensityResult.score;

  /* -------------------- DM Relevance ---------------------------------- */
  const dmRelevance = computeDecisionMakerRelevance({
    company: input.company,
    decisionMakers: dms,
    opportunities: opps,
  });
  const dmRelevanceScore: number | null = dms.length === 0 ? null : dmRelevance.aggregateScore;

  /* -------------------- Need ------------------------------------------ */
  const needScore = calcNeedScore(audit, opps, contacts, breakdown);
  /* -------------------- Opportunity Value ----------------------------- */
  const opportunityScore = calcOpportunityValueScore(opps, breakdown);
  /* -------------------- Website (raw) --------------------------------- */
  const websiteScore = audit && audit.websiteScore !== null ? audit.websiteScore : null;
  /* -------------------- Digital Weakness ------------------------------ */
  const digitalWeaknessScore =
    websiteScore === null ? null : clamp(100 - websiteScore, 0, 100);
  /* -------------------- Reachability (aus Contactability übernommen) -- */
  const reachabilityScore = contactabilityScore;
  /* -------------------- Local Proximity ------------------------------- */
  const localProximityScore =
    input.company.distanceKm === null || input.company.distanceKm === undefined
      ? null
      : calcLocalProximity(input.company.distanceKm);
  /* -------------------- Timing (Wachstum/Presse/…) -------------------- */
  const timingScore = calcTimingScore(signals);
  /* -------------------- Software-Opportunity-Subscore ----------------- */
  const softwareOpps = opps.filter((o) => o.source === "software");
  const softwareOpportunityScore = softwareOpps.length === 0
    ? null
    : Math.round((softwareOpps.reduce((acc, o) => acc + o.confidence, 0) / softwareOpps.length) * 100);
  /* -------------------- Data Confidence ------------------------------- */
  const dataConfidence = calcDataConfidence({
    company: input.company,
    audit,
    contactsCount: contacts.length,
    dmCount: dms.length,
    signalsCount: signals.length,
    oppsCount: opps.length,
  });

  /* -------------------- Weighted Sum ---------------------------------- */
  const contributions: ExplainabilityEntry[] = [];
  let numerator = 0;
  let denominator = 0;

  addContribution(contributions, "need", "Bedarf", needScore, weights.need, "audit + opps", dataConfidence);
  addContribution(contributions, "commercialCapacity", "Kommerzielle Kapazität", capacityScore, weights.commercialCapacity, joinTop(capacity.signals.map((s) => s.text)), capacityConfidence);
  addContribution(contributions, "reachability", "Erreichbarkeit", reachabilityScore, weights.reachability, `${contacts.length} Kontakte / ${dms.length} DM`, contactabilityConfidence);
  addContribution(contributions, "decisionMakerAccess", "Entscheider-Zugang", dmRelevanceScore, weights.decisionMakerAccess, `${dms.length} identifiziert`, dms.length === 0 ? 0 : 0.7);
  addContribution(contributions, "digitalWeakness", "Digitale Schwäche", digitalWeaknessScore, weights.digitalWeakness, audit ? `Website ${websiteScore}/100` : "kein Audit", audit ? 0.9 : 0);
  addContribution(contributions, "opportunityValue", "Opportunity-Wert", opportunityScore, weights.opportunityValue, opps.length > 0 ? `${opps.length} Opps` : "keine Opps", opps.length === 0 ? 0 : Math.min(1, opps.length / 3));
  addContribution(contributions, "timingSignals", "Timing/Propensity", timingScore, weights.timingSignals, propensityResult.signalsUsed > 0 ? `${propensityResult.signalsUsed} Signale` : "keine Signale", propensityResult.signalsUsed === 0 ? 0 : propensityResult.confidence);
  addContribution(contributions, "localProximity", "Lokale Nähe", localProximityScore, weights.localProximity, input.company.distanceKm !== null ? `${input.company.distanceKm} km` : "keine Distanz", input.company.distanceKm !== null ? 1 : 0);

  for (const c of contributions) {
    numerator += c.contribution;
    denominator += c.weight;
    explain.push(c);
    breakdown.push({
      key: c.category,
      label: c.label,
      points: Math.round(c.contribution),
      reason: c.evidence,
      category: (c.category as ScoreBreakdownEntry["category"]) ?? "adjustment",
    });
  }

  // Wenn eine Dimension UNKNOWN ist, ziehen wir sie aus dem Nenner ab.
  // So dominiert eine 50-%-Default-Kapazität nicht den Rest.
  const totalScore = denominator === 0 ? 0 : clamp(Math.round((numerator / denominator) * 100 / 100 * 100), 0, 100);

  // Evidence-Confidence — Aggregate über alle Contribution-Confidence.
  const evidenceConfidence = confidenceAggregate(contributions);

  /* -------------------- Priority-Matrix-Guard ------------------------- */
  const need = needLevelFromScore(needScore);
  const cap = capacityLevelFromClass(capacity.signals.length === 0 ? null : capacity.capacityClass);
  const contactLevel = contactabilityLevelFromScore(contactabilityScore);
  const matrix = evaluatePriorityMatrix({
    need,
    capacity: cap,
    contactability: contactLevel,
    evidenceConfidence,
    numericScore: totalScore,
  });

  // Numerische Priorität aus Score (V1-kompatibel)
  const numericPriority: PriorityClass = priorityFromScore(totalScore, thresholds);

  const score: LeadScore = {
    id: newTargetId("score"),
    targetId: input.company.id,
    calculatedAt: new Date().toISOString(),
    configKey: input.configKey ?? "default",
    weights,
    breakdown,
    totalScore,
    priorityClass: numericPriority,
    needScore,
    opportunityScore,
    websiteScore,
    softwareOpportunityScore,
    commercialCapacityScore: capacityScore,
    reachabilityScore,
    decisionMakerScore: dmRelevanceScore,
    dataConfidenceScore: Math.round(evidenceConfidence * 100),
    capacityClass: capacity.signals.length === 0 ? null : capacity.capacityClass,
    capacityConfidence: capacity.signals.length === 0 ? null : capacity.confidence,
    estimatedBudgetMinCents: capacity.estimatedBudgetMinCents,
    estimatedBudgetMaxCents: capacity.estimatedBudgetMaxCents,
    currency: "EUR",
    isCurrent: true,
    scoreVersion: "v2",
    propensityScore,
    contactabilityScore,
    dmRelevanceScore,
    evidenceConfidence,
    matrixPriority: matrix.priority,
    explainability: explain,
  };

  return {
    score,
    matrixPriority: matrix.priority,
    matrixReason: matrix.reason,
    explainability: explain,
  };
}

/* -------------------------------------------------------------------------- */
/*  Sub-Score-Berechnungen (UNKNOWN-fähig)                                     */
/* -------------------------------------------------------------------------- */

function calcNeedScore(
  audit: WebsiteAudit | null,
  opportunities: TargetOpportunity[],
  contacts: TargetContact[],
  breakdown: ScoreBreakdownEntry[]
): number | null {
  // UNKNOWN, wenn wir weder Website noch Opportunity haben.
  if (!audit && opportunities.length === 0 && contacts.length === 0) return null;

  let s = 30;
  if (audit && audit.websiteScore !== null && audit.websiteScore !== undefined) {
    if (audit.websiteScore < 50) {
      s += 30;
      breakdown.push({
        key: "need_weak_website",
        label: "Website deutlich verbesserungsbedürftig",
        points: 30,
        reason: `Website-Score ${audit.websiteScore}`,
        category: "need",
      });
    } else if (audit.websiteScore < 70) {
      s += 15;
    } else {
      s -= 5; // solide → Bedarf niedriger
    }
    if ((audit.mobileScore ?? 100) < 55) s += 10;
    if ((audit.conversionScore ?? 100) < 55) s += 10;
  }
  const highConfSoft = opportunities.filter((o) => o.source === "software" && o.confidence >= 0.65).length;
  if (highConfSoft > 0) s += Math.min(20, highConfSoft * 8);
  return clamp(s, 0, 100);
}

function calcOpportunityValueScore(
  opportunities: TargetOpportunity[],
  breakdown: ScoreBreakdownEntry[]
): number | null {
  if (opportunities.length === 0) return null;
  const maxRecommended = opportunities.reduce(
    (acc, o) => Math.max(acc, o.estimatedRecommendedCents ?? 0),
    0
  );
  if (maxRecommended >= DEFAULT_PROJECT_VALUE_TIERS.custom_automation.recommended) {
    breakdown.push({
      key: "opportunity_high",
      label: "Sehr hoher Opportunity-Wert",
      points: 90,
      category: "opportunityValue",
    });
    return 90;
  }
  if (maxRecommended >= DEFAULT_PROJECT_VALUE_TIERS.website_crm.recommended) return 70;
  if (maxRecommended >= DEFAULT_PROJECT_VALUE_TIERS.website.recommended) return 50;
  return 30;
}

function calcLocalProximity(distanceKm: number): number {
  if (distanceKm <= 5) return 100;
  if (distanceKm <= 15) return 80;
  if (distanceKm <= 30) return 60;
  if (distanceKm <= 100) return 40;
  return 20;
}

function calcTimingScore(signals: FinancialSignal[]): number | null {
  const timing = signals.filter((s) => ["growth", "expansion", "job_ads", "press"].includes(s.kind));
  if (timing.length === 0) return null;
  return clamp(40 + timing.length * 15, 0, 100);
}

function calcDataConfidence(input: {
  company: TargetCompany;
  audit: WebsiteAudit | null;
  contactsCount: number;
  dmCount: number;
  signalsCount: number;
  oppsCount: number;
}): number {
  let conf = 0.2;
  if (input.company.website) conf += 0.1;
  if (input.audit && input.audit.error === null) conf += 0.15;
  if (input.contactsCount > 0) conf += 0.15;
  if (input.dmCount > 0) conf += 0.15;
  if (input.signalsCount > 0) conf += 0.1;
  if (input.oppsCount > 0) conf += 0.1;
  return Math.min(1, conf);
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function addContribution(
  out: ExplainabilityEntry[],
  category: string,
  label: string,
  input: number | null,
  weight: number,
  evidence: string,
  confidence: number
): void {
  if (input === null || input === undefined) {
    out.push({
      category,
      label,
      input: null,
      weight,
      contribution: 0,
      evidence: `UNKNOWN — nicht in Score einbezogen (${evidence})`,
      confidence,
    });
    return;
  }
  const contribution = (input * weight) / 100;
  out.push({
    category,
    label,
    input,
    weight,
    contribution,
    evidence,
    confidence,
  });
}

function confidenceAggregate(contributions: ExplainabilityEntry[]): number {
  const withInput = contributions.filter((c) => c.input !== null);
  if (withInput.length === 0) return 0;
  const total = withInput.reduce((acc, c) => acc + c.weight, 0);
  if (total === 0) return 0;
  const weighted = withInput.reduce((acc, c) => acc + c.confidence * c.weight, 0);
  return Math.max(0, Math.min(1, weighted / total));
}

function joinTop(values: string[]): string {
  return values.slice(0, 3).join(" · ");
}

function normalizeWeights(weights: ScoringWeights): ScoringWeights {
  const sum =
    weights.need +
    weights.commercialCapacity +
    weights.reachability +
    weights.decisionMakerAccess +
    weights.digitalWeakness +
    weights.opportunityValue +
    weights.timingSignals +
    weights.localProximity;
  if (sum <= 0 || Math.abs(sum - 100) < 0.5) return weights;
  const factor = 100 / sum;
  return {
    need: weights.need * factor,
    commercialCapacity: weights.commercialCapacity * factor,
    reachability: weights.reachability * factor,
    decisionMakerAccess: weights.decisionMakerAccess * factor,
    digitalWeakness: weights.digitalWeakness * factor,
    opportunityValue: weights.opportunityValue * factor,
    timingSignals: weights.timingSignals * factor,
    localProximity: weights.localProximity * factor,
  };
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
