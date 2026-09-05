import type { AcquisitionDecision, AcquisitionSnapshot } from "./types";

export interface ControllerPolicy {
  backlogPauseSeconds: number;
  warningForecastRatio: number;
  criticalForecastRatio: number;
  minBudgetPerRequestCents: number;
}

const DEFAULT_POLICY: ControllerPolicy = {
  backlogPauseSeconds: 30 * 60,
  warningForecastRatio: 0.9,
  criticalForecastRatio: 0.5,
  minBudgetPerRequestCents: 1,
};

export function decideAcquisition(
  snapshot: AcquisitionSnapshot,
  policy: ControllerPolicy = DEFAULT_POLICY,
): AcquisitionDecision {
  const elapsed = Math.max(0, Math.min(1, snapshot.elapsedFraction));
  const hoursRemaining = Math.max(0, (1 - elapsed) * 24);
  const remaining = Math.max(0, snapshot.targetQualified - snapshot.rollingQualified);
  const requiredQualifiedPerHour = remaining / Math.max(1 / 60, hoursRemaining);
  const reasons: string[] = [];

  const pauseForBacklog = snapshot.backlogOldestAgeSeconds >= policy.backlogPauseSeconds;
  const pauseForBudget = snapshot.globalBudgetRemainingCents < policy.minBudgetPerRequestCents;
  const targetReached = remaining === 0;
  if (pauseForBacklog) reasons.push("ENRICHMENT_BACKLOG_LIMIT");
  if (pauseForBudget) reasons.push("GLOBAL_BUDGET_EXHAUSTED");
  if (targetReached) reasons.push("TARGET_ACHIEVED");
  if (snapshot.capacityStatus === "INSUFFICIENT_EVIDENCE") {
    reasons.push("INSUFFICIENT_EVIDENCE");
  }

  const velocity = snapshot.recentQualifiedPerHour;
  const forecastQualified =
    velocity === null
      ? null
      : {
          low: Math.floor(snapshot.rollingQualified + hoursRemaining * velocity * 0.7),
          expected: Math.floor(snapshot.rollingQualified + hoursRemaining * velocity),
          high: Math.floor(snapshot.rollingQualified + hoursRemaining * velocity * 1.3),
        };

  if (!forecastQualified) reasons.push("FORECAST_UNAVAILABLE");
  const forecastRatio = forecastQualified
    ? forecastQualified.expected / Math.max(1, snapshot.targetQualified)
    : null;

  let state: AcquisitionDecision["state"] = "HEALTHY";
  if (snapshot.healthyRequestCapacityPerHour <= 0) {
    state = "CRITICAL";
    reasons.push("NO_HEALTHY_PROVIDER_CAPACITY");
  } else if (forecastRatio !== null && forecastRatio < policy.criticalForecastRatio) {
    state = "CRITICAL";
    reasons.push("TARGET_FORECAST_CRITICAL");
  } else if (forecastRatio !== null && forecastRatio < policy.warningForecastRatio) {
    state = "AT_RISK";
    reasons.push("TARGET_FORECAST_MISS");
  } else if (pauseForBacklog || pauseForBudget || forecastRatio === null) {
    state = "DEGRADED";
  }

  const concurrencyNeeded = Math.ceil(
    requiredQualifiedPerHour / Math.max(0.001, snapshot.healthyRequestCapacityPerHour),
  );
  const requestedConcurrency =
    pauseForBacklog || pauseForBudget || targetReached
      ? 0
      : Math.max(1, Math.min(snapshot.maxConcurrency, concurrencyNeeded));

  return {
    state,
    forecastQualified,
    requiredQualifiedPerHour,
    requestedConcurrency,
    pauseDiscovery: pauseForBacklog || pauseForBudget || targetReached,
    reasons,
  };
}

