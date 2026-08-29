/**
 * Sales-Brief-Generator (rule-based, deterministisch).
 *
 * Generiert aus den bereits erhobenen Zielkunden-Daten einen kompakten
 * Sales Brief mit Empfehlung, Business-Kurzbeschreibung, Hauptopportunity,
 * geschätztem Projektwert und Next Best Action. Wir bauen bewusst zuerst
 * eine rule-basierte Variante — sie ist stabil, sofort einsetzbar und
 * bildet die spätere LLM-Version als Fallback ab, wenn eine
 * Post-Enrichment-Analyse nicht verfügbar ist.
 */

import type {
  FinancialCapacityClass,
  LeadScore,
  NextBestAction,
  SalesBrief,
  TargetCompany,
  TargetContact,
  TargetDecisionMaker,
  TargetOpportunity,
} from "./model";
import { newTargetId, opportunityKindLabel } from "./model";

export interface SalesBriefInput {
  company: TargetCompany;
  contacts: TargetContact[];
  decisionMakers: TargetDecisionMaker[];
  opportunities: TargetOpportunity[];
  leadScore: LeadScore | null;
}

export function generateSalesBrief(input: SalesBriefInput): SalesBrief {
  const { company, contacts, decisionMakers, opportunities, leadScore } = input;
  const mainOpp = pickMainOpportunity(opportunities);
  const primaryDm = pickPrimaryDecisionMaker(decisionMakers);

  const headline = buildHeadline(company, mainOpp, leadScore);
  const businessSummary = buildBusinessSummary(company);
  const opportunityReason = mainOpp ? mainOpp.reason ?? mainOpp.problem ?? null : null;
  const recommendedEntry = buildRecommendedEntry(company, mainOpp);
  const salesAngle = buildSalesAngle(company, mainOpp);
  const whyNow = buildWhyNow(company, opportunities);

  const nextBestAction = pickNextBestAction(contacts, decisionMakers, leadScore);
  const recommendedTime = recommendedTimeSlot(leadScore);

  const projectValueMin = mainOpp?.estimatedMinCents ?? leadScore?.estimatedBudgetMinCents ?? null;
  const projectValueMax = mainOpp?.estimatedMaxCents ?? leadScore?.estimatedBudgetMaxCents ?? null;

  const confidence = leadScore
    ? Math.min(0.9, 0.4 + (leadScore.totalScore / 100) * 0.4 + (leadScore.dataConfidenceScore ?? 0) / 400)
    : 0.5;

  return {
    id: newTargetId("brief"),
    targetId: company.id,
    generatedAt: new Date().toISOString(),
    generatedBy: "rule",
    headline,
    businessSummary,
    mainOpportunity: mainOpp ? opportunityKindLabel(mainOpp.kind) : null,
    opportunityReason,
    recommendedEntry,
    salesAngle,
    whyNow,
    recommendedAction: nextBestAction,
    recommendedTime,
    decisionMakerId: primaryDm?.id ?? null,
    projectValueMinCents: projectValueMin,
    projectValueMaxCents: projectValueMax,
    capacityClass: leadScore?.capacityClass ?? null,
    capacityConfidence: leadScore?.capacityConfidence ?? null,
    confidence,
    structured: {
      opportunities: opportunities.slice(0, 4).map((o) => ({
        kind: o.kind,
        title: o.title,
        confidence: o.confidence,
        recommendedCents: o.estimatedRecommendedCents,
      })),
      priorityClass: leadScore?.priorityClass ?? null,
      totalScore: leadScore?.totalScore ?? null,
    },
    isCurrent: true,
  };
}

/* -------------------------------------------------------------------------- */
/*  Bausteine                                                                  */
/* -------------------------------------------------------------------------- */

function buildHeadline(
  company: TargetCompany,
  mainOpp: TargetOpportunity | null,
  score: LeadScore | null
): string {
  const parts: string[] = [company.name];
  if (score?.priorityClass) parts.push(`Priorität ${score.priorityClass}`);
  if (mainOpp) parts.push(`Hauptopportunity: ${opportunityKindLabel(mainOpp.kind)}`);
  return parts.join(" · ");
}

function buildBusinessSummary(company: TargetCompany): string | null {
  const bits: string[] = [];
  if (company.industry) bits.push(company.industry);
  if (company.employeeEstimateMax) bits.push(`~${company.employeeEstimateMax} Mitarbeiter`);
  if (company.city) bits.push(company.city);
  if (company.foundedYear && company.foundedYear > 1900) {
    const age = new Date().getUTCFullYear() - company.foundedYear;
    if (age >= 3) bits.push(`seit ${age} Jahren am Markt`);
  }
  if (bits.length === 0) return company.description ?? null;
  return bits.join(" · ");
}

function buildRecommendedEntry(company: TargetCompany, mainOpp: TargetOpportunity | null): string | null {
  if (!mainOpp) {
    return "Erster Kontakt zur Bedarfsermittlung. Kein konkreter Aufhänger auf der Website identifiziert.";
  }
  if (mainOpp.kind === "WEBSITE_REDESIGN" || mainOpp.kind === "NEW_WEBSITE") {
    return 'Nicht mit „Wir bauen Ihre Website neu" starten. Erst nach Bedarf im Angebotsprozess und der Anfrageroute fragen.';
  }
  if (mainOpp.kind === "BOOKING_SYSTEM" || mainOpp.kind === "TERMINE") {
    return 'Einstieg über das Thema Termin-/Anfrageorganisation. Frage: „Wie kommen Termine bei Ihnen aktuell zustande?"';
  }
  if (mainOpp.kind === "CRM" || mainOpp.kind === "LEAD_MGMT") {
    return 'Einstieg über Anfrageverlust. Frage: „Wie behalten Sie den Überblick über offene Anfragen und Nachfassen?"';
  }
  if (mainOpp.kind === "SEO" || mainOpp.kind === "LANDING_PAGE") {
    return "Einstieg über Sichtbarkeit und qualifizierte Anfragen aus dem Web. Kein technisches SEO-Vokabular am Anfang.";
  }
  return null;
}

function buildSalesAngle(company: TargetCompany, mainOpp: TargetOpportunity | null): string | null {
  if (!mainOpp) return null;
  return `${opportunityKindLabel(mainOpp.kind)} — ${mainOpp.problem ?? mainOpp.reason ?? "konkreter Hebel im Prozess"}`;
}

function buildWhyNow(company: TargetCompany, opportunities: TargetOpportunity[]): string | null {
  const strong = opportunities
    .filter((o) => o.confidence >= 0.7)
    .slice(0, 2)
    .map((o) => opportunityKindLabel(o.kind))
    .join(" + ");
  if (!strong) return null;
  return `${strong} — Kombination erhöht Wert und macht den Zeitpunkt jetzt sinnvoll.`;
}

function pickMainOpportunity(opps: TargetOpportunity[]): TargetOpportunity | null {
  if (opps.length === 0) return null;
  const sorted = [...opps].sort((a, b) => {
    const av = (a.estimatedRecommendedCents ?? 0) * a.confidence;
    const bv = (b.estimatedRecommendedCents ?? 0) * b.confidence;
    if (bv !== av) return bv - av;
    return (b.opportunityScore ?? 0) - (a.opportunityScore ?? 0);
  });
  return sorted[0];
}

function pickPrimaryDecisionMaker(dms: TargetDecisionMaker[]): TargetDecisionMaker | null {
  if (dms.length === 0) return null;
  const rank = (d: TargetDecisionMaker): number => {
    const rc = d.roleCategory ?? "";
    if (rc === "geschaeftsfuehrung" || rc === "inhaber" || rc === "gruender" || rc === "managing_director") return 3;
    if (rc === "vertrieb" || rc === "marketing") return 2;
    return 1;
  };
  return [...dms].sort((a, b) => rank(b) - rank(a) || b.confidence - a.confidence)[0] ?? null;
}

function pickNextBestAction(
  contacts: TargetContact[],
  decisionMakers: TargetDecisionMaker[],
  score: LeadScore | null
): NextBestAction {
  const hasPhone = contacts.some((c) => c.kind === "phone" || c.kind === "mobile");
  const hasEmail = contacts.some((c) => c.kind === "email");
  const hasDm = decisionMakers.length > 0;
  const priority = score?.priorityClass;
  if (priority === "A+" || priority === "A") {
    if (hasPhone) return "CALL_NOW";
    if (hasDm && hasEmail) return "SEND_EMAIL";
    return hasDm ? "LINKEDIN" : "RESEARCH_MORE";
  }
  if (priority === "B") {
    return hasEmail ? "SEND_EMAIL" : "RESEARCH_MORE";
  }
  if (priority === "C") return "FOLLOW_UP";
  return "SKIP";
}

function recommendedTimeSlot(score: LeadScore | null): string | null {
  const now = new Date();
  const day = now.getUTCDay();
  if (!score) return null;
  const p = score.priorityClass;
  if (p === "A+" || p === "A") {
    if (day === 0 || day === 6) return "Montag 09:00–11:00 (nach Wochenendreset)";
    return "Innerhalb der nächsten 24h — vormittags 09:00–11:30";
  }
  if (p === "B") return "Diese Woche — Dienstag/Mittwoch 10:00–12:00";
  if (p === "C") return "Nächste Woche als Sammel-Follow-up";
  return "Kein aktiver Kontakt empfohlen";
}
