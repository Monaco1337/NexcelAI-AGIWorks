import type { LeadScore, TargetCompany } from "../model";

export type QualificationState = "QUALIFIED" | "REJECTED" | "REVIEW" | "UNKNOWN";

export interface QualificationPolicy {
  version: string;
  allowedCountries: string[];
  allowedIndustries?: string[];
  minScore: number;
  minEvidenceConfidence: number;
  requireReachableContact: boolean;
  requireWebsiteOrAddress: boolean;
}

export interface QualificationInput {
  company: TargetCompany;
  score: LeadScore | null;
  hasVerifiedContact: boolean;
  evidenceConfidence: number | null;
}

export interface QualificationDecision {
  state: QualificationState;
  policyVersion: string;
  reasons: string[];
  decidedAt: string;
}

export const DEFAULT_QUALIFICATION_POLICY: QualificationPolicy = {
  version: "qualification-v1",
  allowedCountries: ["DE"],
  minScore: 55,
  minEvidenceConfidence: 0.6,
  requireReachableContact: true,
  requireWebsiteOrAddress: true,
};

/**
 * Qualification is a hard, explainable gate and deliberately separate from
 * priority scoring. Missing evidence returns UNKNOWN/REVIEW rather than being
 * silently treated as a negative or a qualified lead.
 */
export function qualifyTarget(
  input: QualificationInput,
  policy: QualificationPolicy = DEFAULT_QUALIFICATION_POLICY,
  now = new Date(),
): QualificationDecision {
  const reasons: string[] = [];
  const { company, score } = input;

  if (company.doNotContact) reasons.push("DO_NOT_CONTACT");
  if (company.possibleDuplicateOf) reasons.push("POSSIBLE_DUPLICATE");
  if (!policy.allowedCountries.includes(company.country.toUpperCase())) reasons.push("COUNTRY_OUT_OF_SCOPE");
  if (
    policy.allowedIndustries?.length &&
    (!company.industry || !policy.allowedIndustries.includes(company.industry))
  ) reasons.push("INDUSTRY_OUT_OF_SCOPE");
  if (policy.requireWebsiteOrAddress && !company.website && !company.addressLine) {
    reasons.push("NO_VERIFIABLE_LOCATION");
  }

  if (reasons.length > 0) {
    return { state: "REJECTED", policyVersion: policy.version, reasons, decidedAt: now.toISOString() };
  }

  if (!score) {
    return {
      state: "UNKNOWN",
      policyVersion: policy.version,
      reasons: ["SCORE_NOT_AVAILABLE"],
      decidedAt: now.toISOString(),
    };
  }
  if (score.totalScore < policy.minScore) reasons.push("SCORE_BELOW_THRESHOLD");
  if (policy.requireReachableContact && !input.hasVerifiedContact) reasons.push("NO_VERIFIED_CONTACT");
  if (input.evidenceConfidence === null) reasons.push("EVIDENCE_CONFIDENCE_UNKNOWN");
  else if (input.evidenceConfidence < policy.minEvidenceConfidence) reasons.push("LOW_EVIDENCE_CONFIDENCE");

  const reviewReasons = new Set(["NO_VERIFIED_CONTACT", "EVIDENCE_CONFIDENCE_UNKNOWN", "LOW_EVIDENCE_CONFIDENCE"]);
  const state =
    reasons.length === 0
      ? "QUALIFIED"
      : reasons.every((reason) => reviewReasons.has(reason))
        ? "REVIEW"
        : "REJECTED";
  return { state, policyVersion: policy.version, reasons, decidedAt: now.toISOString() };
}

