/**
 * Systemanalyse-Assistent — type-safe intake model (production-ready, erweiterbar).
 */

export const STEP_ORDER = [
  "intro",
  "profile",
  "context",
  "industry",
  "pain",
  "tools",
  "goals",
  "priority",
  "project",
  "investment",
  "contact",
  "complete",
] as const;

export type StepKey = (typeof STEP_ORDER)[number];

export type CompanySizeId =
  | "solo"
  | "micro"
  | "small"
  | "medium"
  | "large"
  | "enterprise";

export type TeamSizeId = "1-5" | "6-15" | "16-50" | "51-200" | "200+";

export type DigitalMaturityId = "low" | "medium" | "high" | "very_high";

export type UrgencyId = "immediate" | "high" | "medium" | "low";

export type ContactPreferenceId = "email" | "phone" | "video" | "either";

/** Branchen-Schlüssel (align mit config) */
export type IndustryId =
  | "immobilien"
  | "gastronomie"
  | "handwerk"
  | "bau"
  | "logistik"
  | "produktion"
  | "ecommerce"
  | "dienstleistung"
  | "agentur"
  | "beauty"
  | "coaching"
  | "gesundheit"
  | "saas"
  | "finanzen"
  | "bildung"
  | "sonstige";

export interface SystemanalyseState {
  stepIndex: number;
  /** Unternehmensprofil */
  companyName: string;
  contactName: string;
  role: string;
  email: string;
  phone: string;
  companySize: CompanySizeId | "";
  teamSize: TeamSizeId | "";
  industry: IndustryId | "";
  industryOther: string;
  region: string;
  digitalMaturity: DigitalMaturityId | "";
  /** Kontext */
  situationNarrative: string;
  situationDrivers: string[];
  /** Gespräch UI: 0–3 = Fragen, 4 = Ausgangslage bearbeiten */
  contextConvoIndex: number;
  contextConvoChoices: Partial<Record<"q1" | "q2" | "q3" | "q4", string>>;
  /** Branche — dynamische Folgefragen */
  industryFollowUp: Record<string, string[]>;
  /** Schmerzpunkte */
  painByBlock: Record<string, string[]>;
  painConcrete: string;
  painCost: string;
  /** Tools */
  toolsUsed: string[];
  toolsOther: string;
  toolsWorkingWell: string;
  toolsFriction: string;
  /** Ziele */
  goals: string[];
  goalIdealSixMonths: string;
  goalShortTermMust: string;
  /** Priorität */
  urgency: UrgencyId | "";
  bottleneck: string;
  businessRelevance: string;
  mustNotContinue: string;
  /** Projekt */
  projectDirections: string[];
  /** Investment / Reife */
  budgetRange: string;
  projectPhase: string;
  timeHorizon: string;
  /** Abschluss */
  contactPreference: ContactPreferenceId | "";
  appointmentPreference: string;
  consentDsgvo: boolean;
  /** Submit */
  submitStatus: "idle" | "submitting" | "success" | "error";
  submitError: string;
}

export type SystemanalyseAction =
  | { type: "SET_STEP"; index: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "PATCH"; patch: Partial<SystemanalyseState> }
  | { type: "TOGGLE_SITUATION"; id: string }
  | { type: "TOGGLE_INDUSTRY_FOLLOWUP"; questionId: string; optionId: string }
  | { type: "TOGGLE_PAIN"; blockId: string; itemId: string }
  | { type: "TOGGLE_TOOL"; id: string }
  | { type: "TOGGLE_GOAL"; id: string }
  | { type: "TOGGLE_PROJECT_DIRECTION"; id: string }
  | { type: "SET_SUBMIT_STATUS"; status: SystemanalyseState["submitStatus"]; error?: string }
  | { type: "CONTEXT_CONVO_SELECT"; questionIndex: number; optionId: string }
  | { type: "CONTEXT_CONVO_BACK" };
