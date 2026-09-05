import { allocatePartitions } from "../../lib/sales/targets/coverage/planner";
import type { CoveragePartition } from "../../lib/sales/targets/coverage/types";
import { estimateCapacity } from "../../lib/sales/targets/metrics/capacity";

const sizes = [10_000, 100_000, 1_000_000];
const budgetsMs: Record<number, number> = {
  10_000: 250,
  100_000: 1_500,
  1_000_000: 15_000,
};

for (const size of sizes) {
  const partitions: CoveragePartition[] = Array.from({ length: size }, (_, index) => ({
    id: `p${index}`,
    geographyKey: `g${index % 1000}`,
    geographyVersion: "v1",
    provider: index % 2 ? "overpass_osm" : "google_places",
    categoryAxis: `axis${index % 12}`,
    strategy: "bbox",
    state: "ACTIVE",
    nextEligibleAt: null,
    attempts: index % 20,
    rawCount: 100 + (index % 200),
    validCount: 80 + (index % 100),
    canonicalNewCount: index % 60,
    qualifiedCount: index % 20,
    salesReadyCount: index % 10,
    duplicateCount: index % 80,
    failureCount: index % 3,
    totalCostCents: index % 100,
    totalLatencyMs: 1_000 + (index % 10_000),
  }));
  const started = performance.now();
  const result = allocatePartitions(partitions, { limit: 100 });
  const elapsed = performance.now() - started;
  console.log(`${size.toLocaleString()} partitions: ${elapsed.toFixed(1)}ms`);
  if (result.length !== 100 || elapsed > budgetsMs[size]) {
    throw new Error(`Benchmark budget exceeded for ${size}: ${elapsed.toFixed(1)}ms`);
  }
}

const observedCapacityInputs = [
  "CANARY_VALID_PER_REQUEST",
  "CANARY_REQUEST_SUCCESS_RATE",
  "CANARY_VALID_RATE",
  "CANARY_CANONICAL_NEW_RATE",
  "CANARY_QUALIFICATION_RATE",
  "CANARY_REQUEST_SECONDS",
  "CANARY_SAFE_CONCURRENCY",
  "CANARY_AVAILABLE_SECONDS_PER_DAY",
].every((key) => process.env[key] !== undefined);
if (!observedCapacityInputs) {
  console.log("Capacity scenario: INSUFFICIENT_EVIDENCE (synthetic defaults excluded)");
} else {
  const canaryCapacity = estimateCapacity(500, {
    provider: "canary-blended",
    partition: "nrw",
    validPerSuccessfulRequest: envNumber("CANARY_VALID_PER_REQUEST"),
    requestSuccessRate: envNumber("CANARY_REQUEST_SUCCESS_RATE"),
    validRate: envNumber("CANARY_VALID_RATE"),
    canonicalNewRate: envNumber("CANARY_CANONICAL_NEW_RATE"),
    qualificationRate: envNumber("CANARY_QUALIFICATION_RATE"),
    requestSeconds: envNumber("CANARY_REQUEST_SECONDS"),
    safeConcurrency: envNumber("CANARY_SAFE_CONCURRENCY"),
    availableSecondsPerDay: envNumber("CANARY_AVAILABLE_SECONDS_PER_DAY"),
    costCentsPerRequest: envNumber("CANARY_COST_CENTS_PER_REQUEST"),
  });
  console.log(
    `Observed-input capacity scenario: ${canaryCapacity.expectedQualifiedAtCapacity.toFixed(0)} ` +
    `qualified/day; ${canaryCapacity.requiredAttempts.toFixed(0)} attempts required`,
  );
  if (!canaryCapacity.feasible || canaryCapacity.expectedQualifiedAtCapacity < 500) {
    throw new Error("Canary capacity gate cannot sustain 500 qualified companies per 24 hours");
  }
}

function envNumber(key: string): number {
  const value = Number(process.env[key]);
  if (!Number.isFinite(value)) throw new Error(`Observed capacity input missing: ${key}`);
  return value;
}

