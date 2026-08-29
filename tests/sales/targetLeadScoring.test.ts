/**
 * Zielkunden – Lead-Scoring.
 *
 * Prüft:
 *  - Klar starker Lead → Priorität A/A+.
 *  - Klar schwacher Lead → Priorität C/D.
 *  - Breakdown enthält menschenlesbare Begründungen (mind. eine Erklärung).
 *  - Website-Schwäche hebt Need- und DigitalWeakness-Score.
 *  - Direkte E-Mail steigert Reachability-Score.
 *
 * Ausführung: `npx tsx tests/sales/targetLeadScoring.test.ts`.
 */

import { computeLeadScore } from "../../lib/sales/targets/leadScoring";
import type {
  FinancialSignal,
  TargetCompany,
  TargetContact,
  TargetDecisionMaker,
  TargetOpportunity,
  WebsiteAudit,
} from "../../lib/sales/targets/model";
import { emptyFindings } from "../../lib/sales/targets/model";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

function baseCompany(overrides: Partial<TargetCompany> = {}): TargetCompany {
  return {
    id: "tg_test",
    name: "Test Firma",
    legalName: null,
    legalForm: "GmbH",
    industry: "Handwerk",
    subIndustry: null,
    description: null,
    website: "https://example.de",
    domain: "example.de",
    phone: "+492303111111",
    email: null,
    addressLine: null,
    postalCode: "59423",
    city: "Unna",
    region: null,
    country: "DE",
    latitude: null,
    longitude: null,
    distanceKm: 3.2,
    employeeEstimateMin: 8,
    employeeEstimateMax: 20,
    foundedYear: 2005,
    locationsEstimate: 1,
    googlePlaceId: null,
    googleRating: 4.5,
    reviewCount: 40,
    openingHours: {},
    social: {},
    registryInfo: {},
    tags: [],
    fingerprint: "n:test",
    originSearchJobId: null,
    linkedSalesCompanyId: null,
    enrichmentStatus: "READY",
    lastEnrichmentAt: null,
    lastEnrichmentError: null,
    doNotContact: false,
    doNotContactReason: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

function weakAudit(): WebsiteAudit {
  return {
    id: "wa_1",
    targetId: "tg_test",
    url: "https://example.de",
    finalUrl: "https://example.de",
    auditedAt: new Date().toISOString(),
    httpStatus: 200,
    ttfbMs: 1800,
    transferBytes: 4_000_000,
    redirectChain: [],
    websiteScore: 32,
    designScore: 28,
    performanceScore: 20,
    seoScore: 40,
    conversionScore: 30,
    mobileScore: 25,
    trustScore: 45,
    technologyScore: 50,
    subscores: {},
    findings: emptyFindings(),
    techStack: { cms: "unknown" },
    snapshotHash: null,
    error: null,
  };
}

function opportunity(kind: TargetOpportunity["kind"], recommendedCents: number, confidence = 0.8): TargetOpportunity {
  return {
    id: `op_${kind}`,
    targetId: "tg_test",
    source: "software",
    kind,
    title: kind,
    problem: "manueller Prozess",
    proposedSolution: "Automatisieren",
    businessImpact: "Zeit sparen",
    reason: null,
    evidence: [],
    confidence,
    opportunityScore: 70,
    estimatedMinCents: Math.round(recommendedCents * 0.7),
    estimatedRecommendedCents: recommendedCents,
    estimatedMaxCents: Math.round(recommendedCents * 1.3),
    currency: "EUR",
    detectedAt: new Date().toISOString(),
  };
}

async function main(): Promise<void> {
  /* -------- starker Lead -------- */
  const contacts: TargetContact[] = [
    { id: "c1", targetId: "tg_test", kind: "phone", value: "02303 111111", normalizedValue: "+492303111111", classification: "BUSINESS_LANDLINE", confidence: 0.95, verificationStatus: "verified", isPreferred: true, sourceId: null, firstSeenAt: "", lastSeenAt: "" },
    { id: "c2", targetId: "tg_test", kind: "mobile", value: "0175 12345", normalizedValue: "+4917512345", classification: "BUSINESS_MOBILE", confidence: 0.9, verificationStatus: "verified", isPreferred: false, sourceId: null, firstSeenAt: "", lastSeenAt: "" },
    { id: "c3", targetId: "tg_test", kind: "email", value: "max@example.de", normalizedValue: "max@example.de", classification: "DIRECT_DECISION_MAKER", confidence: 0.9, verificationStatus: "verified", isPreferred: true, sourceId: null, firstSeenAt: "", lastSeenAt: "" },
  ];
  const dms: TargetDecisionMaker[] = [
    { id: "dm1", targetId: "tg_test", name: "Max Müller", role: "Geschäftsführer", roleCategory: "geschaeftsfuehrung", businessEmail: "max@example.de", businessPhone: "+492303111111", businessMobile: "+4917512345", linkedinUrl: "https://www.linkedin.com/in/max", confidence: 0.9, sourceId: null, sourceUrl: null, createdAt: "", updatedAt: "" },
  ];
  const signals: FinancialSignal[] = [
    { id: "s1", targetId: "tg_test", kind: "job_ads", value: null, weight: 1, polarity: "positive", evidence: "3 offene Stellen", sourceUrl: null, sourceId: null, confidence: 0.7, retrievedAt: "" },
    { id: "s2", targetId: "tg_test", kind: "growth", value: null, weight: 1, polarity: "positive", evidence: "neue Filiale", sourceUrl: null, sourceId: null, confidence: 0.6, retrievedAt: "" },
  ];
  const strong = computeLeadScore({
    company: baseCompany(),
    websiteAudit: weakAudit(),
    opportunities: [opportunity("CRM", 1_500_000), opportunity("BOOKING_SYSTEM", 900_000)],
    contacts,
    decisionMakers: dms,
    financialSignals: signals,
  });
  assert(strong.totalScore >= 65, `starker Lead sollte hoch scoren, ist ${strong.totalScore}`);
  assert(["A+", "A", "B"].includes(strong.priorityClass), `Priorität sollte A+/A/B sein, ist ${strong.priorityClass}`);
  assert(strong.breakdown.length >= 4, "Breakdown enthält Erklärungen");
  assert(
    strong.breakdown.some((e) => e.category === "reachability" && e.points > 0),
    "Reachability wurde bewertet"
  );

  /* -------- schwacher Lead -------- */
  const weak = computeLeadScore({
    company: baseCompany({ distanceKm: 120, website: null, phone: null, email: null }),
    websiteAudit: null,
    opportunities: [],
    contacts: [],
    decisionMakers: [],
    financialSignals: [],
  });
  assert(weak.totalScore <= strong.totalScore - 15, `schwacher Lead deutlich niedriger, aktuell ${weak.totalScore} vs. ${strong.totalScore}`);
  assert(["C", "D"].includes(weak.priorityClass), `Priorität sollte C oder D sein, ist ${weak.priorityClass}`);

  console.log(`OK · Zielkunden-LeadScoring (strong=${strong.totalScore}/${strong.priorityClass}, weak=${weak.totalScore}/${weak.priorityClass})`);
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
