export type CoverageState = "ACTIVE" | "EXHAUSTED" | "PAUSED" | "DISABLED";

export interface CoveragePartition {
  id: string;
  parentPartitionId?: string | null;
  depth?: number;
  geographyKey: string;
  geographyVersion: string;
  provider: string;
  categoryAxis: string;
  strategy: string;
  bbox?: { south: number; west: number; north: number; east: number } | null;
  state: CoverageState;
  nextEligibleAt: string | null;
  attempts: number;
  rawCount: number;
  validCount: number;
  canonicalNewCount: number;
  qualifiedCount: number;
  salesReadyCount: number;
  duplicateCount: number;
  failureCount: number;
  totalCostCents: number;
  totalLatencyMs: number;
}

export interface PartitionAllocation {
  partitionId: string;
  rank: number;
  score: number;
  reason: "EXPLORE" | "EXPLOIT";
}

export interface AcquisitionSnapshot {
  targetQualified: number;
  rollingQualified: number;
  elapsedFraction: number;
  recentQualifiedPerHour: number | null;
  healthyRequestCapacityPerHour: number;
  backlogOldestAgeSeconds: number;
  globalBudgetRemainingCents: number;
  maxConcurrency: number;
  capacitySource: "OBSERVED" | "PARTIALLY_OBSERVED" | "SYNTHETIC_FALLBACK";
  capacityStatus: "MEASURED" | "INSUFFICIENT_EVIDENCE";
  capacityEvidence: {
    sampleCount: number;
    successfulRequestCount: number;
    observationWindowHours: number;
    windowStartedAt: string;
    windowEndedAt: string;
    latestObservationAt: string | null;
    freshnessSeconds: number | null;
    requestSuccessRate: number | null;
    requestLatencyP50Ms: number | null;
    requestLatencyP95Ms: number | null;
    acceptedRawPerRequest: number | null;
    validRate: number | null;
    canonicalNewRate: number | null;
    qualificationRate: number | null;
    salesReadyRate: number | null;
    duplicateRate: number | null;
    rateLimitedCount: number;
    recentRequestThroughputPerHour: number | null;
    workerCompletionsPerHour: number | null;
    measuredQualifiedPerHour: number | null;
    measuredSalesReadyPerHour: number | null;
    qualificationRate95Percent: { low: number; high: number } | null;
    unknownInputs: string[];
  };
  configuredLimits: {
    maxConcurrency: number;
    dailyBudgetCents: number;
  };
}

export type PipelineState = "HEALTHY" | "DEGRADED" | "AT_RISK" | "CRITICAL";

export interface AcquisitionDecision {
  state: PipelineState;
  forecastQualified: { low: number; expected: number; high: number } | null;
  requiredQualifiedPerHour: number;
  requestedConcurrency: number;
  pauseDiscovery: boolean;
  reasons: string[];
}

