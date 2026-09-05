export interface CapacityCohort {
  provider: string;
  partition: string;
  validPerSuccessfulRequest: number;
  requestSuccessRate: number;
  validRate: number;
  canonicalNewRate: number;
  qualificationRate: number;
  requestSeconds: number;
  safeConcurrency: number;
  availableSecondsPerDay: number;
  costCentsPerRequest: number;
}

export interface CapacityEstimate {
  requiredRaw: number;
  requiredSuccessfulRequests: number;
  requiredAttempts: number;
  providerRequestCapacity: number;
  expectedQualifiedAtCapacity: number;
  requiredCostCents: number;
  feasible: boolean;
}

export function estimateCapacity(targetQualified: number, cohort: CapacityCohort): CapacityEstimate {
  const target = Math.max(0, targetQualified);
  const validPerRequest = nonNegative(cohort.validPerSuccessfulRequest);
  const successRate = probability(cohort.requestSuccessRate);
  const validRate = probability(cohort.validRate);
  const newRate = probability(cohort.canonicalNewRate);
  const qualificationRate = probability(cohort.qualificationRate);
  const requestSeconds = Math.max(0.001, cohort.requestSeconds);
  const downstreamRate = validRate * newRate * qualificationRate;

  const requiredRaw = downstreamRate > 0 ? target / downstreamRate : Number.POSITIVE_INFINITY;
  const requiredSuccessfulRequests =
    validPerRequest > 0 ? requiredRaw / validPerRequest : Number.POSITIVE_INFINITY;
  const requiredAttempts =
    successRate > 0 ? requiredSuccessfulRequests / successRate : Number.POSITIVE_INFINITY;
  const providerRequestCapacity =
    Math.max(0, cohort.safeConcurrency) * Math.max(0, cohort.availableSecondsPerDay) / requestSeconds;
  const expectedQualifiedAtCapacity =
    providerRequestCapacity * successRate * validPerRequest * downstreamRate;

  return {
    requiredRaw,
    requiredSuccessfulRequests,
    requiredAttempts,
    providerRequestCapacity,
    expectedQualifiedAtCapacity,
    requiredCostCents: requiredAttempts * Math.max(0, cohort.costCentsPerRequest),
    feasible: Number.isFinite(requiredAttempts) && requiredAttempts <= providerRequestCapacity,
  };
}

function probability(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
}

function nonNegative(value: number): number {
  return Math.max(0, Number.isFinite(value) ? value : 0);
}

