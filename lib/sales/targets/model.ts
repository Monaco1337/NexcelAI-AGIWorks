/**
 * Sales Target Intelligence — Domain-Modell.
 *
 * Diese Datei ist die einzige Wahrheit über Enums, Labels, Preisstaffel
 * und Score-Gewichtungen für den neuen Zielkunden-Bereich. Sie enthält
 * bewusst KEINE DB- oder Provider-Logik — nur reines Domain-Modell,
 * damit die Engine unabhängig testbar bleibt.
 */

import { newId as newSalesId } from "../model";

/* -------------------------------------------------------------------------- */
/*  IDs                                                                        */
/* -------------------------------------------------------------------------- */

export function newTargetId(prefix: string = "tg"): string {
  return newSalesId(prefix);
}

/* -------------------------------------------------------------------------- */
/*  Enrichment-Status & Phasen                                                 */
/* -------------------------------------------------------------------------- */

export const ENRICHMENT_STATUSES = [
  "DISCOVERED",
  "QUEUED",
  "ENRICHING",
  "CONTACTS_FOUND",
  "ANALYZING",
  "SCORING",
  "READY",
  "FAILED",
  "SUSPENDED",
] as const;
export type EnrichmentStatus = (typeof ENRICHMENT_STATUSES)[number];

export const ENRICHMENT_STATUS_LABEL: Record<EnrichmentStatus, string> = {
  DISCOVERED: "Entdeckt",
  QUEUED: "In Warteschlange",
  ENRICHING: "Wird angereichert",
  CONTACTS_FOUND: "Kontakte gefunden",
  ANALYZING: "Wird analysiert",
  SCORING: "Wird bewertet",
  READY: "Bereit",
  FAILED: "Fehlgeschlagen",
  SUSPENDED: "Pausiert",
};

export const ENRICHMENT_PHASES = [
  "company_basics",
  "website_contact",
  "decision_makers",
  "website_audit",
  "software_opportunities",
  "financial_signals",
  "sales_brief",
  "lead_score",
] as const;
export type EnrichmentPhase = (typeof ENRICHMENT_PHASES)[number];

export const ENRICHMENT_PHASE_LABEL: Record<EnrichmentPhase, string> = {
  company_basics: "Unternehmen + Adresse",
  website_contact: "Website + Kontakt",
  decision_makers: "Entscheider",
  website_audit: "Website-Audit",
  software_opportunities: "Software-Opportunities",
  financial_signals: "Finanzsignale",
  sales_brief: "Sales Brief",
  lead_score: "Lead Score",
};

export const JOB_STATUSES = ["queued", "running", "done", "failed", "skipped"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/*  Search-Konfiguration                                                       */
/* -------------------------------------------------------------------------- */

export const SEARCH_DEPTHS = ["QUICK", "STANDARD", "DEEP"] as const;
export type SearchDepth = (typeof SEARCH_DEPTHS)[number];

export const SEARCH_DEPTH_LABEL: Record<SearchDepth, string> = {
  QUICK: "Schnell — Maps + Website",
  STANDARD: "Standard — Suche + Website-Audit",
  DEEP: "Tief — Entscheider + Finanzen + Presse",
};

export interface SearchFilters {
  onlyWithoutModernWebsite?: boolean;
  onlyWeakWebsite?: boolean;
  minEmployees?: number;
  maxDistanceKm?: number;
  minBudgetCents?: number;
  minLeadScore?: number;
  /* ── Katalog-Segmente ──────────────────────────────────────────────
   * Bei Bulk-Katalogläufen trägt der Search-Job sein Arbeitspaket hier:
   * eine Bounding-Box plus eine OSM-Tag-Achse. Damit bleibt die
   * bestehende Job-Tabelle ohne zusätzliche Spalten nutzbar. */
  catalogSegment?: string;
  bbox?: { south: number; west: number; north: number; east: number };
  tagAxis?: string;
}

/* -------------------------------------------------------------------------- */
/*  Kontakt-Typen                                                              */
/* -------------------------------------------------------------------------- */

export const CONTACT_KINDS = [
  "phone",
  "mobile",
  "email",
  "contact_form",
  "whatsapp",
  "linkedin",
  "instagram",
  "facebook",
  "address",
  "website",
] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export const CONTACT_KIND_LABEL: Record<ContactKind, string> = {
  phone: "Telefon",
  mobile: "Geschäftl. Mobil",
  email: "E-Mail",
  contact_form: "Kontaktformular",
  whatsapp: "WhatsApp",
  linkedin: "LinkedIn",
  instagram: "Instagram",
  facebook: "Facebook",
  address: "Adresse",
  website: "Website",
};

export const PHONE_TYPES = [
  "BUSINESS_LANDLINE",
  "BUSINESS_MOBILE",
  "CENTRAL",
  "SALES",
  "SUPPORT",
  "UNKNOWN",
] as const;
export type PhoneClassification = (typeof PHONE_TYPES)[number];

export const PHONE_TYPE_LABEL: Record<PhoneClassification, string> = {
  BUSINESS_LANDLINE: "Festnetz (geschäftlich)",
  BUSINESS_MOBILE: "Mobil (geschäftlich)",
  CENTRAL: "Zentrale",
  SALES: "Vertrieb",
  SUPPORT: "Support",
  UNKNOWN: "Unbekannt",
};

export const EMAIL_TYPES = [
  "DIRECT_DECISION_MAKER",
  "DEPARTMENT",
  "GENERAL",
  "UNKNOWN",
] as const;
export type EmailClassification = (typeof EMAIL_TYPES)[number];

export const EMAIL_TYPE_LABEL: Record<EmailClassification, string> = {
  DIRECT_DECISION_MAKER: "Direkt (Entscheider)",
  DEPARTMENT: "Abteilung",
  GENERAL: "Allgemein",
  UNKNOWN: "Unbekannt",
};

export const VERIFICATION_STATUSES = [
  "unverified",
  "low",
  "medium",
  "high",
  "verified",
  "conflicting",
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export function classifyConfidence(confidence: number): VerificationStatus {
  if (confidence >= 0.9) return "verified";
  if (confidence >= 0.7) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

export const VERIFICATION_LABEL: Record<VerificationStatus, string> = {
  unverified: "Unbestätigt",
  low: "Niedrige Confidence",
  medium: "Mittlere Confidence",
  high: "Hohe Confidence",
  verified: "Verifiziert",
  conflicting: "Widersprüchlich",
};

export const VERIFICATION_COLOR: Record<VerificationStatus, string> = {
  unverified: "#6B7280",
  low: "#EF4444",
  medium: "#F59E0B",
  high: "#3B82F6",
  verified: "#22C55E",
  conflicting: "#F97316",
};

/* -------------------------------------------------------------------------- */
/*  Entscheider-Rollen                                                         */
/* -------------------------------------------------------------------------- */

export const DECISION_MAKER_ROLES = [
  "geschaeftsfuehrung",
  "inhaber",
  "gruender",
  "managing_director",
  "marketing",
  "it",
  "operations",
  "vertrieb",
  "fachlich",
  "praxis_inhaber",
  "kanzlei_inhaber",
] as const;
export type DecisionMakerRole = (typeof DECISION_MAKER_ROLES)[number];

export const DECISION_MAKER_ROLE_LABEL: Record<DecisionMakerRole, string> = {
  geschaeftsfuehrung: "Geschäftsführer:in",
  inhaber: "Inhaber:in",
  gruender: "Gründer:in",
  managing_director: "Managing Director",
  marketing: "Marketing-Leitung",
  it: "IT-Leitung",
  operations: "Operations",
  vertrieb: "Vertriebsleitung",
  fachlich: "Fachliche Leitung",
  praxis_inhaber: "Praxisinhaber:in",
  kanzlei_inhaber: "Kanzleiinhaber:in",
};

/* -------------------------------------------------------------------------- */
/*  Opportunity-Typen                                                          */
/* -------------------------------------------------------------------------- */

export const WEBSITE_OPPORTUNITY_KINDS = [
  "NEW_WEBSITE",
  "WEBSITE_REDESIGN",
  "SEO",
  "LANDING_PAGE",
  "BOOKING_SYSTEM",
  "ECOMMERCE",
  "PERFORMANCE_OPTIMIZATION",
  "CONVERSION_OPTIMIZATION",
  "MAINTENANCE",
  "NO_IMMEDIATE_NEED",
] as const;
export type WebsiteOpportunityKind = (typeof WEBSITE_OPPORTUNITY_KINDS)[number];

export const SOFTWARE_OPPORTUNITY_KINDS = [
  "CRM",
  "LEAD_MGMT",
  "TERMINE",
  "KUNDENPORTAL",
  "ANGEBOTSSYSTEM",
  "RECHNUNGSSYSTEM",
  "DOCS_AUTOMATION",
  "AI_SUPPORT",
  "AI_AGENT",
  "EMAIL_AUTOMATION",
  "WHATSAPP_AUTOMATION",
  "DASHBOARD",
  "REPORTING",
  "ERP_INTEGRATION",
  "MITARBEITERPORTAL",
  "RECRUITING",
  "WORKFLOW",
  "DATA_ANALYSIS",
  "CUSTOM_SOFTWARE",
] as const;
export type SoftwareOpportunityKind = (typeof SOFTWARE_OPPORTUNITY_KINDS)[number];

export type OpportunityKind = WebsiteOpportunityKind | SoftwareOpportunityKind;

export const OPPORTUNITY_KIND_LABEL: Record<OpportunityKind, string> = {
  NEW_WEBSITE: "Neue Website",
  WEBSITE_REDESIGN: "Website-Redesign",
  SEO: "SEO-Ausbau",
  LANDING_PAGE: "Landingpage-Kampagne",
  BOOKING_SYSTEM: "Terminbuchung",
  ECOMMERCE: "Onlineshop",
  PERFORMANCE_OPTIMIZATION: "Performance-Optimierung",
  CONVERSION_OPTIMIZATION: "Conversion-Optimierung",
  MAINTENANCE: "Wartung",
  NO_IMMEDIATE_NEED: "Kein akuter Websitebedarf",
  CRM: "CRM-System",
  LEAD_MGMT: "Lead-Management",
  TERMINE: "Terminmanagement",
  KUNDENPORTAL: "Kundenportal",
  ANGEBOTSSYSTEM: "Angebotssystem",
  RECHNUNGSSYSTEM: "Rechnungssystem",
  DOCS_AUTOMATION: "Dokumenten-Automatisierung",
  AI_SUPPORT: "AI Customer Support",
  AI_AGENT: "AI Agent",
  EMAIL_AUTOMATION: "E-Mail-Automatisierung",
  WHATSAPP_AUTOMATION: "WhatsApp-Automatisierung",
  DASHBOARD: "Management-Dashboard",
  REPORTING: "Reporting",
  ERP_INTEGRATION: "ERP-Integration",
  MITARBEITERPORTAL: "Mitarbeiterportal",
  RECRUITING: "Recruiting-System",
  WORKFLOW: "Workflow-Automation",
  DATA_ANALYSIS: "Datenanalyse",
  CUSTOM_SOFTWARE: "Individualsoftware",
};

export function opportunityKindLabel(kind: string): string {
  return OPPORTUNITY_KIND_LABEL[kind as OpportunityKind] ?? kind;
}

/* -------------------------------------------------------------------------- */
/*  Finanzsignale                                                              */
/* -------------------------------------------------------------------------- */

export const FINANCIAL_SIGNAL_KINDS = [
  "legal_form",
  "age",
  "employees",
  "locations",
  "rating",
  "reviews",
  "job_ads",
  "growth",
  "expansion",
  "tech_stack",
  "website_maturity",
  "press",
  "risk",
  "insolvency",
  "closed",
] as const;
export type FinancialSignalKind = (typeof FINANCIAL_SIGNAL_KINDS)[number];

export const FINANCIAL_SIGNAL_LABEL: Record<FinancialSignalKind, string> = {
  legal_form: "Rechtsform",
  age: "Unternehmensalter",
  employees: "Mitarbeiter",
  locations: "Standorte",
  rating: "Bewertung",
  reviews: "Bewertungsanzahl",
  job_ads: "Stellenanzeigen",
  growth: "Wachstum",
  expansion: "Expansion",
  tech_stack: "Technologie-Stack",
  website_maturity: "Website-Reifegrad",
  press: "Presse-/PR-Aktivität",
  risk: "Wirtschaftliches Risiko",
  insolvency: "Insolvenz",
  closed: "Geschäftsaufgabe",
};

export const FINANCIAL_CAPACITY_CLASSES = [
  "VERY_LOW",
  "LOW",
  "MEDIUM",
  "HIGH",
  "VERY_HIGH",
] as const;
export type FinancialCapacityClass = (typeof FINANCIAL_CAPACITY_CLASSES)[number];

export const FINANCIAL_CAPACITY_LABEL: Record<FinancialCapacityClass, string> = {
  VERY_LOW: "Sehr niedrig",
  LOW: "Niedrig",
  MEDIUM: "Mittel",
  HIGH: "Hoch",
  VERY_HIGH: "Sehr hoch",
};

export const FINANCIAL_CAPACITY_COLOR: Record<FinancialCapacityClass, string> = {
  VERY_LOW: "#EF4444",
  LOW: "#F97316",
  MEDIUM: "#F59E0B",
  HIGH: "#22C55E",
  VERY_HIGH: "#10B981",
};

/* -------------------------------------------------------------------------- */
/*  Prioritätsklassen                                                          */
/* -------------------------------------------------------------------------- */

/**
 * A++ steht ueber A+ und bleibt der Spitze vorbehalten: hoher Bedarf,
 * belastbare Kapazitaet, direkt erreichbarer Entscheider und belegte
 * Evidenz. Die Klasse ist nur nach Anreicherung erreichbar — aus reinen
 * Discovery-Daten laesst sich eine solche Aussage nicht verantworten.
 * C und D bleiben erhalten; sie werden nicht geloescht, sondern nur
 * nachrangig behandelt.
 */
export const PRIORITY_CLASSES = ["A++", "A+", "A", "B", "C", "D"] as const;
export type PriorityClass = (typeof PRIORITY_CLASSES)[number];

export const PRIORITY_CLASS_LABEL: Record<PriorityClass, string> = {
  "A++": "A++ — Top-Kandidat, sofort anrufen",
  "A+": "A+ — Sofort kontaktieren",
  A: "A — Priorität hoch",
  B: "B — Priorität mittel",
  C: "C — Beobachten",
  D: "D — Deprioritiziert",
};

export const PRIORITY_CLASS_COLOR: Record<PriorityClass, string> = {
  "A++": "#059669",
  "A+": "#10B981",
  A: "#22C55E",
  B: "#3B82F6",
  C: "#F59E0B",
  D: "#6B7280",
};

/* -------------------------------------------------------------------------- */
/*  Next Best Action                                                           */
/* -------------------------------------------------------------------------- */

export const NEXT_BEST_ACTIONS = [
  "CALL_NOW",
  "SEND_EMAIL",
  "SEND_WHATSAPP",
  "LINKEDIN",
  "RESEARCH_MORE",
  "SKIP",
  "FOLLOW_UP",
] as const;
export type NextBestAction = (typeof NEXT_BEST_ACTIONS)[number];

export const NEXT_BEST_ACTION_LABEL: Record<NextBestAction, string> = {
  CALL_NOW: "Jetzt anrufen",
  SEND_EMAIL: "E-Mail senden",
  SEND_WHATSAPP: "WhatsApp senden",
  LINKEDIN: "Über LinkedIn kontaktieren",
  RESEARCH_MORE: "Weiter recherchieren",
  SKIP: "Überspringen",
  FOLLOW_UP: "Follow-up planen",
};

/* -------------------------------------------------------------------------- */
/*  Score-Weights + Preistaffel (Defaults)                                     */
/* -------------------------------------------------------------------------- */

export interface ScoringWeights {
  need: number;
  commercialCapacity: number;
  reachability: number;
  decisionMakerAccess: number;
  digitalWeakness: number;
  opportunityValue: number;
  timingSignals: number;
  localProximity: number;
}

export const DEFAULT_SCORING_WEIGHTS: ScoringWeights = {
  need: 25,
  commercialCapacity: 20,
  reachability: 15,
  decisionMakerAccess: 10,
  digitalWeakness: 10,
  opportunityValue: 10,
  timingSignals: 5,
  localProximity: 5,
};

export interface ProjectValueTier {
  min: number;
  recommended: number;
  max: number;
}

export const DEFAULT_PROJECT_VALUE_TIERS: Record<string, ProjectValueTier> = {
  landingpage: { min: 200000, recommended: 300000, max: 400000 },
  website: { min: 500000, recommended: 800000, max: 1200000 },
  website_crm: { min: 1000000, recommended: 1500000, max: 2500000 },
  custom_automation: { min: 1500000, recommended: 3000000, max: 5000000 },
  enterprise_software: { min: 3000000, recommended: 6000000, max: 15000000 },
};

/* -------------------------------------------------------------------------- */
/*  Score-Breakdown                                                            */
/* -------------------------------------------------------------------------- */

export interface ScoreBreakdownEntry {
  key: string;
  label: string;
  points: number;
  reason?: string;
  category:
    | "need"
    | "commercialCapacity"
    | "reachability"
    | "decisionMakerAccess"
    | "digitalWeakness"
    | "opportunityValue"
    | "timingSignals"
    | "localProximity"
    | "adjustment";
}

/* -------------------------------------------------------------------------- */
/*  Findings (Fact / Inference / Recommendation)                               */
/* -------------------------------------------------------------------------- */

export interface Finding {
  text: string;
  category: string;
  evidence?: string;
  confidence?: number;
}

export interface FindingsBundle {
  facts: Finding[];
  inferences: Finding[];
  recommendations: Finding[];
}

export function emptyFindings(): FindingsBundle {
  return { facts: [], inferences: [], recommendations: [] };
}

/* -------------------------------------------------------------------------- */
/*  Provider-Kennung                                                           */
/* -------------------------------------------------------------------------- */

export const PROVIDER_KEYS = [
  "company_website",
  "impressum",
  "google_places",
  "google_search",
  "manual",
  "linkedin",
  "registry",
  "financial_signal",
  "internal_audit",
  "internal_scoring",
] as const;
export type ProviderKey = (typeof PROVIDER_KEYS)[number];

export const PROVIDER_LABEL: Record<ProviderKey, string> = {
  company_website: "Unternehmenswebsite",
  impressum: "Impressum",
  google_places: "Google Places",
  google_search: "Google Search",
  manual: "Manuell",
  linkedin: "LinkedIn",
  registry: "Handelsregister",
  financial_signal: "Finanzsignal",
  internal_audit: "Interne Analyse",
  internal_scoring: "Interne Bewertung",
};

/* -------------------------------------------------------------------------- */
/*  Domain-Typen                                                               */
/* -------------------------------------------------------------------------- */

export interface TargetCompany {
  id: string;
  name: string;
  legalName: string | null;
  legalForm: string | null;
  industry: string | null;
  subIndustry: string | null;
  description: string | null;
  website: string | null;
  domain: string | null;
  phone: string | null;
  email: string | null;
  addressLine: string | null;
  postalCode: string | null;
  city: string | null;
  region: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  employeeEstimateMin: number | null;
  employeeEstimateMax: number | null;
  foundedYear: number | null;
  locationsEstimate: number | null;
  googlePlaceId: string | null;
  googleRating: number | null;
  reviewCount: number | null;
  openingHours: Record<string, unknown>;
  social: Record<string, unknown>;
  registryInfo: Record<string, unknown>;
  tags: string[];
  fingerprint: string;
  originSearchJobId: string | null;
  linkedSalesCompanyId: string | null;
  enrichmentStatus: EnrichmentStatus;
  lastEnrichmentAt: string | null;
  lastEnrichmentError: string | null;
  doNotContact: boolean;
  doNotContactReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TargetSource {
  id: string;
  targetId: string;
  field: string;
  value: string;
  provider: ProviderKey | string;
  sourceUrl: string | null;
  retrievedAt: string;
  confidence: number;
  verificationStatus: VerificationStatus;
  isPreferred: boolean;
  note: string | null;
}

export interface TargetContact {
  id: string;
  targetId: string;
  kind: ContactKind;
  value: string;
  normalizedValue: string | null;
  classification: PhoneClassification | EmailClassification | null;
  confidence: number;
  verificationStatus: VerificationStatus;
  isPreferred: boolean;
  sourceId: string | null;
  firstSeenAt: string;
  lastSeenAt: string;
}

export interface TargetDecisionMaker {
  id: string;
  targetId: string;
  name: string;
  role: string | null;
  roleCategory: DecisionMakerRole | null;
  businessEmail: string | null;
  businessPhone: string | null;
  businessMobile: string | null;
  linkedinUrl: string | null;
  confidence: number;
  sourceId: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WebsiteAudit {
  id: string;
  targetId: string;
  url: string;
  finalUrl: string | null;
  auditedAt: string;
  httpStatus: number | null;
  ttfbMs: number | null;
  transferBytes: number | null;
  redirectChain: string[];
  websiteScore: number | null;
  designScore: number | null;
  performanceScore: number | null;
  seoScore: number | null;
  conversionScore: number | null;
  mobileScore: number | null;
  trustScore: number | null;
  technologyScore: number | null;
  subscores: Record<string, number>;
  findings: FindingsBundle;
  techStack: Record<string, unknown>;
  snapshotHash: string | null;
  error: string | null;
}

export interface TargetOpportunity {
  id: string;
  targetId: string;
  source: "website" | "software" | "manual";
  kind: OpportunityKind;
  title: string;
  problem: string | null;
  proposedSolution: string | null;
  businessImpact: string | null;
  reason: string | null;
  evidence: unknown[];
  confidence: number;
  opportunityScore: number | null;
  estimatedMinCents: number | null;
  estimatedRecommendedCents: number | null;
  estimatedMaxCents: number | null;
  currency: string;
  detectedAt: string;
}

export interface FinancialSignal {
  id: string;
  targetId: string;
  kind: FinancialSignalKind;
  value: string | null;
  weight: number;
  polarity: "positive" | "neutral" | "negative";
  evidence: string | null;
  sourceUrl: string | null;
  sourceId: string | null;
  confidence: number;
  retrievedAt: string;
}

export interface ExplainabilityEntry {
  category: string;
  label: string;
  input: number | null;
  weight: number;
  contribution: number;
  evidence?: string;
  confidence: number;
}

export interface LeadScore {
  id: string;
  targetId: string;
  calculatedAt: string;
  configKey: string;
  weights: ScoringWeights;
  breakdown: ScoreBreakdownEntry[];
  totalScore: number;
  priorityClass: PriorityClass;
  needScore: number | null;
  opportunityScore: number | null;
  websiteScore: number | null;
  softwareOpportunityScore: number | null;
  commercialCapacityScore: number | null;
  reachabilityScore: number | null;
  decisionMakerScore: number | null;
  dataConfidenceScore: number | null;
  capacityClass: FinancialCapacityClass | null;
  capacityConfidence: number | null;
  estimatedBudgetMinCents: number | null;
  estimatedBudgetMaxCents: number | null;
  currency: string;
  isCurrent: boolean;
  /* V2-Erweiterungen — bei V1-Scores immer `null`. */
  scoreVersion?: "v1" | "v2";
  propensityScore?: number | null;
  contactabilityScore?: number | null;
  dmRelevanceScore?: number | null;
  evidenceConfidence?: number | null;
  matrixPriority?: string | null;
  explainability?: ExplainabilityEntry[];
}

export interface SalesBrief {
  id: string;
  targetId: string;
  generatedAt: string;
  generatedBy: "rule" | "llm";
  headline: string;
  businessSummary: string | null;
  mainOpportunity: string | null;
  opportunityReason: string | null;
  recommendedEntry: string | null;
  salesAngle: string | null;
  whyNow: string | null;
  recommendedAction: NextBestAction;
  recommendedTime: string | null;
  decisionMakerId: string | null;
  projectValueMinCents: number | null;
  projectValueMaxCents: number | null;
  capacityClass: FinancialCapacityClass | null;
  capacityConfidence: number | null;
  confidence: number;
  structured: Record<string, unknown>;
  isCurrent: boolean;
}

export interface SearchJob {
  id: string;
  label: string | null;
  city: string | null;
  region: string | null;
  country: string;
  centerLat: number | null;
  centerLng: number | null;
  radiusKm: number;
  industries: string[];
  categories: string[];
  filters: SearchFilters;
  depth: SearchDepth;
  limitCount: number;
  providerPreferences: Record<string, unknown>;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  estimatedCostCents: number;
  actualCostCents: number;
  discoveredCount: number;
  enrichedCount: number;
  error: string | null;
  createdBy: string | null;
  createdAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  /* ── Queue-Semantik (Migration 0013) ─────────────────────────────── */
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string | null;
  leaseExpiresAt: string | null;
  /** Zugehöriger Katalog-/Area-Run, falls der Job Teil eines Batches ist. */
  areaScanId: string | null;
}

export interface EnrichmentJob {
  id: string;
  targetId: string;
  phase: EnrichmentPhase;
  status: JobStatus;
  priority: number;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: string;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  payload: Record<string, unknown>;
  actualCostCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface TargetActivity {
  id: string;
  targetId: string;
  kind: string;
  summary: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  actorEmail: string | null;
  occurredAt: string;
}

export interface WatchlistEntry {
  id: string;
  targetId: string;
  userId: string;
  addedAt: string;
  lastCheckAt: string | null;
  criteria: Record<string, unknown>;
  note: string;
}

export interface ScoringConfig {
  key: string;
  label: string;
  weights: ScoringWeights;
  thresholdAPlus: number;
  thresholdA: number;
  thresholdB: number;
  thresholdC: number;
  projectValueTiers: Record<string, ProjectValueTier>;
  isActive: boolean;
  updatedAt: string;
}

/* -------------------------------------------------------------------------- */
/*  Preisstaffel-Auflösung                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Wählt eine Preistaffel für eine Opportunity aus. Bewusst konservativ:
 * unbekannte Kinds fallen auf `website`, Custom-/Enterprise-Kinds bekommen
 * höhere Staffeln.
 */
export function resolvePriceTier(
  kind: OpportunityKind,
  tiers: Record<string, ProjectValueTier> = DEFAULT_PROJECT_VALUE_TIERS
): ProjectValueTier {
  const key = tierKeyForOpportunity(kind);
  return tiers[key] ?? tiers.website ?? DEFAULT_PROJECT_VALUE_TIERS.website;
}

function tierKeyForOpportunity(kind: OpportunityKind): string {
  switch (kind) {
    case "LANDING_PAGE":
      return "landingpage";
    case "NEW_WEBSITE":
    case "WEBSITE_REDESIGN":
    case "SEO":
    case "PERFORMANCE_OPTIMIZATION":
    case "CONVERSION_OPTIMIZATION":
    case "MAINTENANCE":
      return "website";
    case "CRM":
    case "KUNDENPORTAL":
    case "LEAD_MGMT":
    case "TERMINE":
    case "ANGEBOTSSYSTEM":
    case "RECHNUNGSSYSTEM":
    case "BOOKING_SYSTEM":
      return "website_crm";
    case "DOCS_AUTOMATION":
    case "AI_SUPPORT":
    case "AI_AGENT":
    case "EMAIL_AUTOMATION":
    case "WHATSAPP_AUTOMATION":
    case "DASHBOARD":
    case "REPORTING":
    case "MITARBEITERPORTAL":
    case "RECRUITING":
    case "WORKFLOW":
    case "DATA_ANALYSIS":
    case "ECOMMERCE":
      return "custom_automation";
    case "ERP_INTEGRATION":
    case "CUSTOM_SOFTWARE":
      return "enterprise_software";
    default:
      return "website";
  }
}

/* -------------------------------------------------------------------------- */
/*  Priorität aus Score ableiten                                               */
/* -------------------------------------------------------------------------- */

export function priorityFromScore(
  total: number,
  thresholds: { aPlusPlus?: number; aPlus: number; a: number; b: number; c: number } = {
    aPlusPlus: 92,
    aPlus: 85,
    a: 70,
    b: 55,
    c: 40,
  }
): PriorityClass {
  if (total >= (thresholds.aPlusPlus ?? 92)) return "A++";
  if (total >= thresholds.aPlus) return "A+";
  if (total >= thresholds.a) return "A";
  if (total >= thresholds.b) return "B";
  if (total >= thresholds.c) return "C";
  return "D";
}

/* -------------------------------------------------------------------------- */
/*  CRM-Konvertierung: Ziel-Enrichmentstatus für Sales-Company                 */
/* -------------------------------------------------------------------------- */

export function initialSalesStatusFromTarget(): "neu" | "qualifiziert" {
  return "qualifiziert";
}
