import type { ScoringWeights } from "../model";

export interface ScoreThresholds {
  aPlusPlus: number;
  aPlus: number;
  a: number;
  b: number;
  c: number;
}

export interface ScoringConfigVersion {
  id: string;
  key: string;
  version: number;
  status: "DRAFT" | "CANARY" | "ACTIVE" | "RETIRED";
  weights: ScoringWeights;
  thresholds: ScoreThresholds;
  unknownPolicy: "ZERO" | "NEUTRAL" | "EXCLUDE_AND_REWEIGHT";
  createdAt: string;
  activatedAt: string | null;
}

export function validateScoringConfig(config: ScoringConfigVersion): string[] {
  const errors: string[] = [];
  const weights = Object.values(config.weights);
  if (weights.some((weight) => !Number.isFinite(weight) || weight < 0)) {
    errors.push("WEIGHTS_MUST_BE_NON_NEGATIVE");
  }
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (Math.abs(total - 100) > 0.001) errors.push("WEIGHTS_MUST_SUM_TO_100");
  const t = config.thresholds;
  if (!(t.aPlusPlus > t.aPlus && t.aPlus > t.a && t.a > t.b && t.b > t.c)) {
    errors.push("THRESHOLDS_MUST_DESCEND");
  }
  if (Object.values(t).some((threshold) => threshold < 0 || threshold > 100)) {
    errors.push("THRESHOLDS_OUT_OF_RANGE");
  }
  if (!Number.isInteger(config.version) || config.version < 1) errors.push("VERSION_INVALID");
  return errors;
}

export function canActivateScoringConfig(config: ScoringConfigVersion): boolean {
  return config.status !== "RETIRED" && validateScoringConfig(config).length === 0;
}

