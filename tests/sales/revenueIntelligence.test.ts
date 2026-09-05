import {
  buildFingerprint,
  matchEntities,
  normalizeCompanyName,
} from "../../lib/sales/targets/entityResolution";
import { allocatePartitions, shouldMarkExhausted } from "../../lib/sales/targets/coverage/planner";
import { decideAcquisition } from "../../lib/sales/targets/coverage/controller";
import { estimateCapacity } from "../../lib/sales/targets/metrics/capacity";
import { qualifyTarget } from "../../lib/sales/targets/qualification/engine";
import { resolveFollowupPhases } from "../../lib/sales/targets/jobs/phaseGraph";
import type { LeadScore, TargetCompany } from "../../lib/sales/targets/model";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`FAIL: ${message}`);
}

const basePartition = {
  id: "p1",
  geographyKey: "nrw-1",
  geographyVersion: "v1",
  provider: "overpass_osm",
  categoryAxis: "craft",
  strategy: "bbox",
  state: "ACTIVE" as const,
  nextEligibleAt: null,
  attempts: 10,
  rawCount: 1000,
  validCount: 800,
  canonicalNewCount: 400,
  qualifiedCount: 100,
  salesReadyCount: 50,
  duplicateCount: 400,
  failureCount: 1,
  totalCostCents: 0,
  totalLatencyMs: 20_000,
};

assert(normalizeCompanyName("Müller GmbH & Co. KG") === "muller", "legal suffix normalization");
const entityA = buildFingerprint({
  name: "Müller GmbH",
  domain: "mueller.de",
  city: "Unna",
  postalCode: "59423",
});
const entityB = buildFingerprint({
  name: "Mueller Sanitär",
  domain: "mueller.de",
  city: "Unna",
  postalCode: "59423",
});
assert(matchEntities(entityA, entityB).isMatch, "composite entity evidence links");
const sharedDomainOnly = matchEntities(
  buildFingerprint({ name: "Branch A", domain: "marketplace.example" }),
  buildFingerprint({ name: "Branch B", domain: "marketplace.example" }),
);
assert(!sharedDomainOnly.isMatch && sharedDomainOnly.outcome === "POSSIBLE_MATCH", "domain alone does not merge");

const allocations = allocatePartitions(
  [basePartition, { ...basePartition, id: "p2", attempts: 0, geographyKey: "nrw-2" }],
  { limit: 2, explorationFraction: 0.5 },
);
assert(allocations[0]?.partitionId === "p2" && allocations[0].reason === "EXPLORE", "cold partition explored");
const yieldAllocation = allocatePartitions([
  basePartition,
  {
    ...basePartition,
    id: "low-yield",
    canonicalNewCount: 20,
    qualifiedCount: 2,
    duplicateCount: 780,
  },
], { limit: 1, explorationFraction: 0 });
assert(yieldAllocation[0]?.partitionId === basePartition.id, "high-yield partition wins exploitation");
assert(
  allocatePartitions([
    { ...basePartition, id: "disabled", state: "DISABLED" as const },
    { ...basePartition, id: "cooldown", nextEligibleAt: "2099-01-01T00:00:00.000Z" },
  ], { limit: 2 }).length === 0,
  "disabled/rate-limited and cooldown partitions receive no work",
);
assert(
  shouldMarkExhausted({
    ...basePartition,
    duplicateCount: 780,
    canonicalNewCount: 30,
  }),
  "high duplicate low-yield partition exhausted",
);

const control = decideAcquisition({
  targetQualified: 500,
  rollingQualified: 100,
  elapsedFraction: 0.5,
  recentQualifiedPerHour: 10,
  healthyRequestCapacityPerHour: 2,
  backlogOldestAgeSeconds: 60,
  globalBudgetRemainingCents: 10_000,
  maxConcurrency: 20,
  capacitySource: "OBSERVED",
  capacityStatus: "MEASURED",
  capacityEvidence: {
    sampleCount: 100,
    successfulRequestCount: 90,
    observationWindowHours: 24,
    windowStartedAt: "2026-09-04T00:00:00.000Z",
    windowEndedAt: "2026-09-05T00:00:00.000Z",
    latestObservationAt: "2026-09-05T00:00:00.000Z",
    freshnessSeconds: 0,
    requestSuccessRate: 0.9,
    requestLatencyP50Ms: 100,
    requestLatencyP95Ms: 200,
    acceptedRawPerRequest: 10,
    validRate: 0.8,
    canonicalNewRate: 0.5,
    qualificationRate: 0.2,
    salesReadyRate: 0.5,
    duplicateRate: 0.5,
    rateLimitedCount: 0,
    recentRequestThroughputPerHour: 4,
    workerCompletionsPerHour: 20,
    measuredQualifiedPerHour: 2,
    measuredSalesReadyPerHour: 1,
    qualificationRate95Percent: { low: 0.12, high: 0.3 },
    unknownInputs: [],
  },
  configuredLimits: { maxConcurrency: 20, dailyBudgetCents: 10_000 },
});
assert(control.state === "CRITICAL" && control.requestedConcurrency <= 20, "controller reports bounded target risk");

const capacity = estimateCapacity(500, {
  provider: "test",
  partition: "nrw",
  validPerSuccessfulRequest: 50,
  requestSuccessRate: 0.9,
  validRate: 0.8,
  canonicalNewRate: 0.5,
  qualificationRate: 0.25,
  requestSeconds: 10,
  safeConcurrency: 2,
  availableSecondsPerDay: 86_400,
  costCentsPerRequest: 3,
});
assert(capacity.feasible && capacity.expectedQualifiedAtCapacity >= 500, "capacity formula");

const company = makeCompany();
const score = { totalScore: 75 } as LeadScore;
assert(
  qualifyTarget({
    company,
    score,
    hasVerifiedContact: true,
    evidenceConfidence: 0.8,
  }).state === "QUALIFIED",
  "qualified decision requires hard gates",
);
assert(
  qualifyTarget({
    company: { ...company, possibleDuplicateOf: "tg_other" },
    score,
    hasVerifiedContact: true,
    evidenceConfidence: 0.8,
  }).state === "REJECTED",
  "possible duplicate cannot qualify",
);
assert(
  resolveFollowupPhases("website_contact", undefined).includes("financial_signals"),
  "worker follows canonical phase graph",
);

function makeCompany(): TargetCompany {
  return {
    id: "tg_test",
    name: "Test GmbH",
    legalName: null,
    legalForm: "GmbH",
    industry: "Handwerk",
    subIndustry: null,
    description: null,
    website: "https://example.de",
    domain: "example.de",
    phone: "+4923031234",
    email: null,
    addressLine: "Musterstr. 1",
    postalCode: "59423",
    city: "Unna",
    region: "NRW",
    country: "DE",
    latitude: null,
    longitude: null,
    distanceKm: null,
    employeeEstimateMin: null,
    employeeEstimateMax: null,
    foundedYear: null,
    locationsEstimate: null,
    googlePlaceId: null,
    googleRating: null,
    reviewCount: null,
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
    version: 1,
    isChain: false,
    preScore: null,
    preScoreClass: null,
    isGoldenDataset: false,
    possibleDuplicateOf: null,
    possibleDuplicateConfidence: null,
    reviewFlags: {},
    createdAt: new Date(0).toISOString(),
    updatedAt: new Date(0).toISOString(),
  };
}

console.log("OK: revenue intelligence policy tests passed");

