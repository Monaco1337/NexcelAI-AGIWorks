export interface AcquisitionTouch {
  provider: string;
  observationId: string;
  observedAt: string;
  costCents: number;
}

export interface OutcomeAttribution {
  firstSource: string | null;
  contributingSources: string[];
  totalAcquisitionCostCents: number;
}

/**
 * Produces deterministic first-source plus contributing-source attribution.
 * It intentionally does not mutate scoring weights; feedback is consumed by
 * offline calibration reports and explicit config versions.
 */
export function attributeOutcome(touches: readonly AcquisitionTouch[]): OutcomeAttribution {
  const ordered = [...touches].sort(
    (a, b) =>
      Date.parse(a.observedAt) - Date.parse(b.observedAt) ||
      a.observationId.localeCompare(b.observationId),
  );
  return {
    firstSource: ordered[0]?.provider ?? null,
    contributingSources: [...new Set(ordered.map((touch) => touch.provider))],
    totalAcquisitionCostCents: ordered.reduce(
      (total, touch) => total + Math.max(0, touch.costCents),
      0,
    ),
  };
}

