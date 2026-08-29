/**
 * Decision-Maker-Relevance-Model.
 *
 * Nicht jeder Geschäftsführer ist der beste Kontakt. In einer 6-Mitarbeiter-
 * Firma ist der Inhaber typischerweise der einzig sinnvolle Ansprechpartner.
 * In einer 200-Mitarbeiter-Firma ist Digital-/Marketing-/IT-Leitung oft
 * relevanter — je nachdem, welche Opportunity wir verfolgen.
 *
 * Wir bewerten Rollen kontextabhängig, ohne willkürliches „AI-Rating".
 */

import type { TargetCompany, TargetDecisionMaker, TargetOpportunity } from "./model";

export type ContactCategory =
  | "PRIMARY_CONTACT"
  | "SECONDARY_CONTACT"
  | "EXECUTIVE_SPONSOR"
  | "TECHNICAL_CONTACT"
  | "UNKNOWN";

export interface DecisionMakerRelevanceInput {
  company: TargetCompany;
  decisionMakers: TargetDecisionMaker[];
  opportunities: TargetOpportunity[];
}

export interface DecisionMakerScoreEntry {
  id: string;
  name: string;
  role: string | null;
  roleCategory: string | null;
  relevanceScore: number;
  contactCategory: ContactCategory;
  reason: string;
  hasBusinessContact: boolean;
}

export interface DecisionMakerRelevanceResult {
  entries: DecisionMakerScoreEntry[];
  primaryContactId: string | null;
  aggregateScore: number;
}

/**
 * Rollen-Basiswerte (0–100). Wir orientieren uns an einer typischen
 * Software-/Digitalisierungs-Opportunity.
 */
const ROLE_BASE: Record<string, number> = {
  geschaeftsfuehrung: 85,
  inhaber: 90,
  vorstand: 80,
  marketing: 65,
  it: 70,
  digital: 70,
  operations: 60,
  vertrieb: 55,
  fachlich: 40,
};

/** Kontextmodifikatoren pro Opportunity-Klasse. */
const OPPORTUNITY_MODIFIER: Record<string, Partial<Record<string, number>>> = {
  NEW_WEBSITE: { marketing: +10, digital: +5, inhaber: +5 },
  WEBSITE_REDESIGN: { marketing: +10, digital: +5 },
  SEO: { marketing: +15, digital: +10 },
  BOOKING_SYSTEM: { operations: +15, digital: +5 },
  ECOMMERCE: { marketing: +10, digital: +10 },
  CRM: { vertrieb: +15, operations: +10, marketing: +5 },
  ANGEBOTSSYSTEM: { vertrieb: +15, operations: +10 },
  RECHNUNGSSYSTEM: { operations: +15 },
  AI_SUPPORT: { it: +15, digital: +10, operations: +5 },
  AI_AGENT: { it: +15, digital: +15 },
  WORKFLOW: { operations: +15, it: +10 },
  DASHBOARD: { it: +10, operations: +10 },
  ERP_INTEGRATION: { it: +15, operations: +10 },
  RECRUITING: { operations: +10 },
};

/**
 * Firmen-Größen-Bias: bei kleinen Firmen zählt Owner/GF stärker; bei
 * großen Firmen zählen Fachbereiche stärker.
 */
function sizeBias(role: string, employeeMax: number | null | undefined): number {
  const size = employeeMax ?? 0;
  if (size <= 15) {
    if (role === "geschaeftsfuehrung" || role === "inhaber") return +10;
    return -5;
  }
  if (size >= 100) {
    if (role === "geschaeftsfuehrung" || role === "inhaber") return -10;
    return +5;
  }
  return 0;
}

function contactCategoryFor(score: number, hasContact: boolean, role: string | null): ContactCategory {
  if (!hasContact) return score >= 70 ? "EXECUTIVE_SPONSOR" : "UNKNOWN";
  if (role === "it" || role === "digital") return "TECHNICAL_CONTACT";
  if (score >= 75) return "PRIMARY_CONTACT";
  if (score >= 55) return "SECONDARY_CONTACT";
  return "UNKNOWN";
}

export function computeDecisionMakerRelevance(
  input: DecisionMakerRelevanceInput
): DecisionMakerRelevanceResult {
  const dms = input.decisionMakers ?? [];
  if (dms.length === 0) {
    return { entries: [], primaryContactId: null, aggregateScore: 0 };
  }

  const topOpportunity = pickTopOpportunity(input.opportunities);
  const oppModifier = topOpportunity ? OPPORTUNITY_MODIFIER[topOpportunity.kind] ?? {} : {};

  const entries: DecisionMakerScoreEntry[] = dms.map((dm) => {
    const roleCategory = (dm.roleCategory ?? "").toLowerCase();
    const base = ROLE_BASE[roleCategory] ?? 45;
    const bias = sizeBias(roleCategory, input.company.employeeEstimateMax);
    const oppMod = oppModifier[roleCategory] ?? 0;
    const confAdj = Math.round((dm.confidence - 0.5) * 20); // ±10
    const hasContact = Boolean(dm.businessEmail || dm.businessPhone || dm.businessMobile);
    const contactBonus = hasContact ? 5 : -5;
    const relevance = Math.max(0, Math.min(100, base + bias + oppMod + confAdj + contactBonus));
    const category = contactCategoryFor(relevance, hasContact, roleCategory || null);
    const reason = buildReason({
      base,
      bias,
      oppMod,
      confAdj,
      hasContact,
      opportunity: topOpportunity?.title ?? null,
    });
    return {
      id: dm.id,
      name: dm.name,
      role: dm.role,
      roleCategory: dm.roleCategory,
      relevanceScore: relevance,
      contactCategory: category,
      reason,
      hasBusinessContact: hasContact,
    };
  });

  entries.sort((a, b) => b.relevanceScore - a.relevanceScore);
  const primary = entries[0] ?? null;
  const aggregate = Math.round(entries[0]?.relevanceScore ?? 0);

  return {
    entries,
    primaryContactId: primary?.id ?? null,
    aggregateScore: aggregate,
  };
}

function pickTopOpportunity(opps: TargetOpportunity[]): TargetOpportunity | null {
  if (!opps || opps.length === 0) return null;
  return [...opps].sort(
    (a, b) => (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0) || b.confidence - a.confidence
  )[0];
}

function buildReason(parts: {
  base: number;
  bias: number;
  oppMod: number;
  confAdj: number;
  hasContact: boolean;
  opportunity: string | null;
}): string {
  const pieces: string[] = [];
  pieces.push(`Rollen-Basis ${parts.base}`);
  if (parts.bias !== 0) pieces.push(`Firmengröße ${parts.bias > 0 ? "+" : ""}${parts.bias}`);
  if (parts.oppMod !== 0 && parts.opportunity) {
    pieces.push(`${parts.opportunity} ${parts.oppMod > 0 ? "+" : ""}${parts.oppMod}`);
  }
  if (parts.confAdj !== 0) pieces.push(`Datenqualität ${parts.confAdj > 0 ? "+" : ""}${parts.confAdj}`);
  pieces.push(parts.hasContact ? "Business-Kontakt vorhanden +5" : "Kein Business-Kontakt −5");
  return pieces.join(" · ");
}
