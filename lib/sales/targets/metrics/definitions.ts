export const TARGET_MILESTONES = [
  "RAW_OBSERVED",
  "CANDIDATE_VALID",
  "CANONICAL_CREATED",
  "FIRST_QUALIFIED",
  "FIRST_SALES_READY",
  "REJECTED",
  "MERGED",
  "CRM_CONVERTED",
  "OPPORTUNITY_WON",
] as const;

export type TargetMilestone = (typeof TARGET_MILESTONES)[number];

export interface MetricEvent {
  idempotencyKey: string;
  eventType: TargetMilestone;
  occurredAt: string;
  targetId?: string | null;
  observationId?: string | null;
  provider?: string | null;
  partitionId?: string | null;
  coverageRunId?: string | null;
  correlationId?: string | null;
  definitionVersion: string;
  dimensions: Record<string, string | number | boolean | null>;
  value: number;
}

export const METRIC_DEFINITION_VERSION = "revenue-intelligence-v1";

export const FUNNEL_DENOMINATORS: Readonly<Record<TargetMilestone, string>> = {
  RAW_OBSERVED: "provider responses accepted by contract",
  CANDIDATE_VALID: "raw observations normalized without rejection",
  CANONICAL_CREATED: "new canonical companies after entity resolution",
  FIRST_QUALIFIED: "canonical companies crossing active qualification policy for the first time",
  FIRST_SALES_READY: "qualified companies crossing the sales-ready evidence gate for the first time",
  REJECTED: "observations or companies rejected by a versioned rule",
  MERGED: "canonical redirects created by an audited resolution decision",
  CRM_CONVERTED: "qualified targets linked to a CRM company for the first time",
  OPPORTUNITY_WON: "CRM opportunities marked won and attributable to a target",
};

