import { z } from "zod";

export const pipelineMetricSchema = z.enum([
  "discovered_raw",
  "discovered_candidates",
  "canonical_new",
  "qualified_new",
  "sales_ready",
  "rejected",
  "duplicates",
  "enriched_phases",
  "verified_fields",
]);

export const pipelineHealthStateSchema = z.enum([
  "HEALTHY",
  "DEGRADED",
  "AT_RISK",
  "CRITICAL",
  "INSUFFICIENT_EVIDENCE",
]);

export const metricWindowV1Schema = z
  .object({
    version: z.literal(1),
    metric: pipelineMetricSchema,
    value: z.number().int().nonnegative(),
    windowStart: z.iso.datetime({ offset: true }),
    windowEnd: z.iso.datetime({ offset: true }),
    timeZone: z.string().trim().min(1).max(100),
    definitionVersion: z.string().trim().min(1).max(80),
    denominator: z.number().int().nonnegative().nullable().default(null),
  })
  .strict()
  .refine((window) => Date.parse(window.windowStart) < Date.parse(window.windowEnd), {
    path: ["windowEnd"],
    message: "windowEnd must be after windowStart",
  });

export const acquisitionControlSnapshotV1Schema = z
  .object({
    version: z.literal(1),
    capturedAt: z.iso.datetime({ offset: true }),
    state: pipelineHealthStateSchema,
    targetQualified24h: z.number().int().nonnegative(),
    qualified24h: z.number().int().nonnegative().nullable(),
    currentVelocityPerHour: z.number().nonnegative().nullable(),
    requiredVelocityPerHour: z.number().nonnegative().nullable(),
    forecastLow: z.number().nonnegative().nullable(),
    forecastHigh: z.number().nonnegative().nullable(),
    deficit: z.number().nonnegative().nullable(),
    queuedJobs: z.number().int().nonnegative(),
    oldestQueuedAgeSeconds: z.number().int().nonnegative().nullable(),
    failedGuardrails: z.array(z.string().trim().min(1).max(120)).max(50),
  })
  .strict();

export type PipelineMetric = z.infer<typeof pipelineMetricSchema>;
export type PipelineHealthState = z.infer<typeof pipelineHealthStateSchema>;
export type MetricWindowV1 = z.infer<typeof metricWindowV1Schema>;
export type AcquisitionControlSnapshotV1 = z.infer<typeof acquisitionControlSnapshotV1Schema>;
