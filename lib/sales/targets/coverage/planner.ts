import type { CoveragePartition, PartitionAllocation } from "./types";

export interface AllocationOptions {
  limit: number;
  explorationFraction?: number;
  now?: Date;
}

/**
 * Ranks eligible partitions by a conservative quality-adjusted yield.
 * A deterministic exploration reserve prevents mature high-volume partitions
 * from starving new geography/provider/category combinations.
 */
export function allocatePartitions(
  partitions: readonly CoveragePartition[],
  options: AllocationOptions,
): PartitionAllocation[] {
  const now = options.now ?? new Date();
  const eligible = partitions.filter(
    (partition) =>
      partition.state === "ACTIVE" &&
      (!partition.nextEligibleAt || Date.parse(partition.nextEligibleAt) <= now.getTime()),
  );
  const limit = Math.max(0, Math.floor(options.limit));
  if (limit === 0) return [];

  const explorationCount = Math.min(
    eligible.length,
    Math.max(1, Math.floor(limit * (options.explorationFraction ?? 0.15))),
  );
  const unexplored = eligible
    .filter((partition) => partition.attempts === 0)
    .sort((a, b) => stableKey(a).localeCompare(stableKey(b)))
    .slice(0, explorationCount);
  const selected = new Set(unexplored.map((partition) => partition.id));

  const exploit = eligible
    .filter((partition) => !selected.has(partition.id))
    .map((partition) => ({ partition, score: partitionScore(partition) }))
    .sort((a, b) => b.score - a.score || stableKey(a.partition).localeCompare(stableKey(b.partition)))
    .slice(0, Math.max(0, limit - unexplored.length));

  return [
    ...unexplored.map((partition) => ({
      partitionId: partition.id,
      score: 1,
      reason: "EXPLORE" as const,
    })),
    ...exploit.map(({ partition, score }) => ({
      partitionId: partition.id,
      score,
      reason: "EXPLOIT" as const,
    })),
  ].map((allocation, index) => ({ ...allocation, rank: index + 1 }));
}

export function partitionScore(partition: CoveragePartition): number {
  const attempts = Math.max(1, partition.attempts);
  const lowerQualifiedRate = wilsonLowerBound(partition.qualifiedCount, attempts);
  const newRate = partition.canonicalNewCount / Math.max(1, partition.validCount);
  const validRate = partition.validCount / Math.max(1, partition.rawCount);
  const successRate = (attempts - partition.failureCount) / attempts;
  const costPenalty = 1 + partition.totalCostCents / Math.max(1, partition.qualifiedCount * 100);
  const latencyPenalty = 1 + partition.totalLatencyMs / attempts / 60_000;
  // Until qualification observations exist, keep a small ranking floor so
  // measured canonical-new and duplicate yield can still distinguish
  // productive from exhausted partitions. This is only a planner weight and
  // is never exposed as an observed qualification rate.
  const qualificationWeight = 0.1 + lowerQualifiedRate;
  return (qualificationWeight * newRate * validRate * successRate) / (costPenalty * latencyPenalty);
}

export function shouldMarkExhausted(partition: CoveragePartition): boolean {
  if (partition.attempts < 5 || partition.validCount < 100) return false;
  const duplicateRate = partition.duplicateCount / Math.max(1, partition.validCount);
  const marginalNewRate = partition.canonicalNewCount / Math.max(1, partition.validCount);
  return duplicateRate >= 0.8 && marginalNewRate <= 0.05;
}

function wilsonLowerBound(successes: number, trials: number, z = 1.96): number {
  if (trials <= 0) return 0;
  const p = Math.max(0, Math.min(1, successes / trials));
  const denominator = 1 + (z * z) / trials;
  const centre = p + (z * z) / (2 * trials);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * trials)) / trials);
  return Math.max(0, (centre - margin) / denominator);
}

function stableKey(partition: CoveragePartition): string {
  return `${partition.provider}:${partition.geographyKey}:${partition.categoryAxis}:${partition.id}`;
}

