/**
 * Lead-Scoring-Engine — deterministisch, gewichtet, erklärbar.
 *
 * Gesamtscore 0–100, aufgeteilt in acht Kategorien mit einstellbaren
 * Gewichten. Jede Kategorie hat einen Subscore 0–100, der aus konkreten
 * Signalen berechnet wird. Die Breakdown-Liste erklärt für jedes Signal
 * die vergebenen Punkte („+18 Website stark veraltet / -6 keine direkte
 * E-Mail"), damit der Score im UI transparent ist.
 */

import type {
  FinancialSignal,
  LeadScore,
  PriorityClass,
  ScoreBreakdownEntry,
  ScoringWeights,
  TargetCompany,
  TargetContact,
  TargetDecisionMaker,
  TargetOpportunity,
  WebsiteAudit,
} from "./model";
import {
  DEFAULT_SCORING_WEIGHTS,
  DEFAULT_PROJECT_VALUE_TIERS,
  priorityFromScore,
  newTargetId,
} from "./model";
import { estimateCommercialCapacity } from "./financialCapacity";

export interface LeadScoreInput {
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

export interface LeadScoreResult {
  score: LeadScore;
  needScore: number;
  opportunityScore: number;
  websiteScore: number;
  softwareOpportunityScore: number;
  commercialCapacityScore: number;
  reachabilityScore: number;
  decisionMakerScore: number;
  dataConfidenceScore: number;
  totalScore: number;
  priorityClass: PriorityClass;
  breakdown: ScoreBreakdownEntry[];
}

export function computeLeadScore(input: LeadScoreInput): LeadScoreResult {
  const weights = normalizeWeights(input.weights ?? DEFAULT_SCORING_WEIGHTS);
  const thresholds = input.thresholds ?? { aPlus: 85, a: 70, b: 55, c: 40 };
  const breakdown: ScoreBreakdownEntry[] = [];

  const capacity = estimateCommercialCapacity({
    company: input.company,
    signals: input.financialSignals ?? [],
    websiteAudit: input.websiteAudit ?? null,
  });

  const websiteScore = input.websiteAudit?.websiteScore ?? 50;
  const opps = input.opportunities ?? [];
  const websiteOpps = opps.filter((o) => o.source === "website");
  const softwareOpps = opps.filter((o) => o.source === "software");

  // Need (Website-Schwäche + Anzahl relevanter Opportunities)
  const needScore = calcNeedScore(input.websiteAudit ?? null, opps, breakdown);
  // Opportunity Value (max. Projektvolumen)
  const opportunityScore = calcOpportunityValueScore(opps, breakdown);
  // Software-Opportunity-Score
  const softwareOpportunityScore = calcSoftwareOpportunityScore(softwareOpps, breakdown);
  // Reachability (Telefon, Mail, Formular)
  const reachabilityScore = calcReachabilityScore(input.contacts ?? [], breakdown);
  // Decision Maker Access
  const decisionMakerScore = calcDecisionMakerScore(input.decisionMakers ?? [], breakdown);
  // Digital Weakness → invers zu websiteScore
  const digitalWeaknessScore = clamp(100 - (websiteScore ?? 50), 0, 100);
  if (input.websiteAudit && input.websiteAudit.websiteScore !== null) {
    breakdown.push({
      key: "digital_weakness",
      label: `Website-Score ${input.websiteAudit.websiteScore}/100`,
      points: Math.round((digitalWeaknessScore * weights.digitalWeakness) / 100),
      reason:
        input.websiteAudit.websiteScore < 50
          ? "Deutliche Website-Schwäche → hoher Handlungsbedarf"
          : "Website solide → Digital-Hebel begrenzt",
      category: "digitalWeakness",
    });
  }

  // Local Proximity
  const localProximityScore = calcLocalProximity(input.company.distanceKm, breakdown);

  // Timing (Wachstums-/Job-/Expansions-Signale in FinancialSignals)
  const timingScore = calcTimingScore(input.financialSignals ?? [], breakdown);

  const commercialCapacityScore = capacity.score;
  breakdown.push({
    key: "commercial_capacity",
    label: `Kapazität: ${capacity.capacityClass}`,
    points: Math.round((commercialCapacityScore * weights.commercialCapacity) / 100),
    reason: capacity.signals
      .slice(0, 3)
      .map((s) => `${s.polarity === "negative" ? "−" : "+"}${s.text}`)
      .join(" · "),
    category: "commercialCapacity",
  });

  const dataConfidenceScore = calcDataConfidenceScore(input, breakdown);

  const total =
    (needScore * weights.need +
      commercialCapacityScore * weights.commercialCapacity +
      reachabilityScore * weights.reachability +
      decisionMakerScore * weights.decisionMakerAccess +
      digitalWeaknessScore * weights.digitalWeakness +
      opportunityScore * weights.opportunityValue +
      timingScore * weights.timingSignals +
      localProximityScore * weights.localProximity) /
    100;

  const totalScore = clamp(Math.round(total), 0, 100);
  const priorityClass = priorityFromScore(totalScore, thresholds);

  const score: LeadScore = {
    id: newTargetId("score"),
    targetId: input.company.id,
    calculatedAt: new Date().toISOString(),
    configKey: input.configKey ?? "default",
    weights,
    breakdown,
    totalScore,
    priorityClass,
    needScore,
    opportunityScore,
    websiteScore,
    softwareOpportunityScore,
    commercialCapacityScore,
    reachabilityScore,
    decisionMakerScore,
    dataConfidenceScore,
    capacityClass: capacity.capacityClass,
    capacityConfidence: capacity.confidence,
    estimatedBudgetMinCents: capacity.estimatedBudgetMinCents,
    estimatedBudgetMaxCents: capacity.estimatedBudgetMaxCents,
    currency: "EUR",
    isCurrent: true,
  };

  return {
    score,
    needScore,
    opportunityScore,
    websiteScore,
    softwareOpportunityScore,
    commercialCapacityScore,
    reachabilityScore,
    decisionMakerScore,
    dataConfidenceScore,
    totalScore,
    priorityClass,
    breakdown,
  };
}

/* -------------------------------------------------------------------------- */
/*  Subscores                                                                  */
/* -------------------------------------------------------------------------- */

function calcNeedScore(
  audit: WebsiteAudit | null,
  opportunities: TargetOpportunity[],
  breakdown: ScoreBreakdownEntry[]
): number {
  let s = 30;
  if (audit) {
    if ((audit.websiteScore ?? 100) < 50) {
      s += 30;
      breakdown.push({
        key: "need_weak_website",
        label: "Website deutlich verbesserungsbedürftig",
        points: 30,
        reason: `Website-Score ${audit.websiteScore ?? "n/a"}`,
        category: "need",
      });
    }
    if ((audit.mobileScore ?? 100) < 55) {
      s += 10;
      breakdown.push({
        key: "need_weak_mobile",
        label: "Schwache Mobile-Optimierung",
        points: 10,
        reason: `Mobile ${audit.mobileScore}/100`,
        category: "need",
      });
    }
    if ((audit.conversionScore ?? 100) < 55) {
      s += 10;
      breakdown.push({
        key: "need_weak_conversion",
        label: "Wenig klare CTAs / kein Anfrageformular",
        points: 10,
        reason: `Conversion ${audit.conversionScore}/100`,
        category: "need",
      });
    }
  }
  const highConfSoft = opportunities.filter(
    (o) => o.source === "software" && o.confidence >= 0.65
  ).length;
  if (highConfSoft > 0) {
    const bonus = Math.min(20, highConfSoft * 8);
    s += bonus;
    breakdown.push({
      key: "need_software_opps",
      label: `${highConfSoft} Software-Opportunity(ies) mit hoher Confidence`,
      points: bonus,
      category: "need",
    });
  }
  return clamp(s, 0, 100);
}

function calcOpportunityValueScore(
  opportunities: TargetOpportunity[],
  breakdown: ScoreBreakdownEntry[]
): number {
  if (opportunities.length === 0) return 30;
  const maxRecommended = opportunities.reduce((acc, o) => Math.max(acc, o.estimatedRecommendedCents ?? 0), 0);
  const tier = maxRecommended;
  let s = 30;
  if (tier >= DEFAULT_PROJECT_VALUE_TIERS.custom_automation.recommended) {
    s = 90;
    breakdown.push({
      key: "opportunity_high",
      label: "Sehr hoher Opportunity-Wert",
      points: 90,
      category: "opportunityValue",
    });
  } else if (tier >= DEFAULT_PROJECT_VALUE_TIERS.website_crm.recommended) {
    s = 70;
    breakdown.push({
      key: "opportunity_mid",
      label: "Hoher Opportunity-Wert",
      points: 70,
      category: "opportunityValue",
    });
  } else if (tier >= DEFAULT_PROJECT_VALUE_TIERS.website.recommended) {
    s = 50;
    breakdown.push({
      key: "opportunity_normal",
      label: "Solider Opportunity-Wert",
      points: 50,
      category: "opportunityValue",
    });
  } else {
    breakdown.push({
      key: "opportunity_low",
      label: "Geringer Opportunity-Wert",
      points: 30,
      category: "opportunityValue",
    });
  }
  return s;
}

function calcSoftwareOpportunityScore(
  opps: TargetOpportunity[],
  breakdown: ScoreBreakdownEntry[]
): number {
  if (opps.length === 0) return 20;
  const avgConf = opps.reduce((acc, o) => acc + o.confidence, 0) / opps.length;
  const base = Math.round(avgConf * 100);
  if (base >= 70) {
    breakdown.push({
      key: "software_opportunities",
      label: `${opps.length} Software-Opportunities identifiziert`,
      points: 10,
      category: "opportunityValue",
    });
  }
  return clamp(base, 0, 100);
}

function calcReachabilityScore(contacts: TargetContact[], breakdown: ScoreBreakdownEntry[]): number {
  let s = 20;
  const byKind = groupBy(contacts, (c) => c.kind);
  if (byKind.phone?.length) {
    s += 30;
    breakdown.push({ key: "reachability_phone", label: "Telefon vorhanden", points: 30, category: "reachability" });
  }
  if (byKind.mobile?.length) {
    s += 20;
    breakdown.push({ key: "reachability_mobile", label: "Geschäftliche Mobil vorhanden", points: 20, category: "reachability" });
  }
  const directEmails = (byKind.email ?? []).filter((c) => c.classification === "DIRECT_DECISION_MAKER");
  if (directEmails.length) {
    s += 20;
    breakdown.push({ key: "reachability_direct_email", label: "Direkte E-Mail (Entscheider)", points: 20, category: "reachability" });
  } else if ((byKind.email ?? []).length) {
    s += 8;
    breakdown.push({ key: "reachability_generic_email", label: "Allgemeine E-Mail", points: 8, category: "reachability" });
  }
  if (byKind.contact_form?.length) {
    s += 5;
    breakdown.push({ key: "reachability_form", label: "Kontaktformular verfügbar", points: 5, category: "reachability" });
  }
  return clamp(s, 0, 100);
}

function calcDecisionMakerScore(dms: TargetDecisionMaker[], breakdown: ScoreBreakdownEntry[]): number {
  if (dms.length === 0) {
    breakdown.push({
      key: "decision_maker_missing",
      label: "Kein Entscheider ermittelt",
      points: 0,
      category: "decisionMakerAccess",
      reason: "Reduziert Score deutlich",
    });
    return 15;
  }
  const withEmail = dms.filter((d) => Boolean(d.businessEmail)).length;
  const withPhone = dms.filter((d) => Boolean(d.businessPhone || d.businessMobile)).length;
  const withLinkedin = dms.filter((d) => Boolean(d.linkedinUrl)).length;
  let s = 40;
  s += Math.min(30, withEmail * 15);
  s += Math.min(20, withPhone * 10);
  s += Math.min(10, withLinkedin * 5);
  breakdown.push({
    key: "decision_maker",
    label: `${dms.length} Entscheider identifiziert (${withEmail} mit E-Mail, ${withPhone} mit Telefon)`,
    points: s,
    category: "decisionMakerAccess",
  });
  return clamp(s, 0, 100);
}

function calcLocalProximity(distanceKm: number | null, breakdown: ScoreBreakdownEntry[]): number {
  if (distanceKm === null) return 50;
  if (distanceKm <= 5) {
    breakdown.push({ key: "local_very_close", label: `Nur ${distanceKm.toFixed(1)} km entfernt`, points: 100, category: "localProximity" });
    return 100;
  }
  if (distanceKm <= 15) {
    breakdown.push({ key: "local_close", label: `${distanceKm.toFixed(1)} km entfernt`, points: 80, category: "localProximity" });
    return 80;
  }
  if (distanceKm <= 30) {
    breakdown.push({ key: "local_regional", label: `Regional (${distanceKm.toFixed(0)} km)`, points: 60, category: "localProximity" });
    return 60;
  }
  if (distanceKm <= 100) return 40;
  return 20;
}

function calcTimingScore(signals: FinancialSignal[], breakdown: ScoreBreakdownEntry[]): number {
  const timing = signals.filter((s) => ["growth", "expansion", "job_ads", "press"].includes(s.kind));
  if (timing.length === 0) return 40;
  const s = clamp(40 + timing.length * 15, 0, 100);
  breakdown.push({
    key: "timing_signals",
    label: `${timing.length} Timing-Signal(e) (Wachstum/Expansion/Stellenanzeigen)`,
    points: s,
    category: "timingSignals",
  });
  return s;
}

function calcDataConfidenceScore(input: LeadScoreInput, breakdown: ScoreBreakdownEntry[]): number {
  const hasWebsite = Boolean(input.company.website);
  const hasContacts = (input.contacts ?? []).length > 0;
  const hasAudit = Boolean(input.websiteAudit && input.websiteAudit.error === null);
  const hasDM = (input.decisionMakers ?? []).length > 0;
  let s = 30;
  if (hasWebsite) s += 15;
  if (hasContacts) s += 20;
  if (hasAudit) s += 20;
  if (hasDM) s += 15;
  breakdown.push({
    key: "data_confidence",
    label: "Datenbasis-Confidence",
    points: s,
    reason: [
      hasWebsite ? "Website" : "keine Website",
      hasAudit ? "Audit" : "kein Audit",
      hasContacts ? "Kontakte" : "keine Kontakte",
      hasDM ? "Entscheider" : "kein Entscheider",
    ].join(" · "),
    category: "adjustment",
  });
  return clamp(s, 0, 100);
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
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
  if (Math.abs(sum - 100) < 0.5 || sum <= 0) return weights;
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

function groupBy<T, K extends string>(items: T[], keyFn: (item: T) => K): Record<K, T[]> {
  const out: Partial<Record<K, T[]>> = {};
  for (const it of items) {
    const k = keyFn(it);
    (out[k] ??= []).push(it);
  }
  return out as Record<K, T[]>;
}
