import { z } from "zod";

export const resolutionOutcomeSchema = z.enum([
  "EXACT",
  "HIGH_CONFIDENCE",
  "POSSIBLE_MATCH",
  "DISTINCT",
  "INSUFFICIENT_EVIDENCE",
]);

export const qualificationOutcomeSchema = z.enum([
  "QUALIFIED",
  "REJECTED",
  "REVIEW_REQUIRED",
  "INSUFFICIENT_EVIDENCE",
]);

export const qualificationReasonSchema = z.enum([
  "ICP_MATCH",
  "ICP_MISMATCH",
  "OUT_OF_GEOGRAPHY",
  "DUPLICATE",
  "DO_NOT_CONTACT",
  "INSUFFICIENT_PROVENANCE",
  "INSUFFICIENT_IDENTITY",
  "INSUFFICIENT_CONTACTABILITY",
  "QUALITY_GUARD_FAILED",
]);

export const pipelineMilestoneSchema = z.enum([
  "RAW_DISCOVERED",
  "CANDIDATE_VALIDATED",
  "CANONICAL_CREATED",
  "QUALIFIED_NEW",
  "SALES_READY",
]);

const evidenceSchema = z
  .object({
    kind: z.string().trim().min(1).max(80),
    referenceId: z.string().trim().min(1).max(120),
    contribution: z.number().min(-1).max(1),
    note: z.string().trim().max(500).nullable().default(null),
  })
  .strict();

export const resolutionDecisionV1Schema = z
  .object({
    version: z.literal(1),
    candidateId: z.string().trim().min(1).max(120),
    targetId: z.string().trim().min(1).max(120).nullable(),
    outcome: resolutionOutcomeSchema,
    ruleVersion: z.string().trim().min(1).max(80),
    confidence: z.number().min(0).max(1),
    evidence: z.array(evidenceSchema).max(100),
    decidedAt: z.iso.datetime({ offset: true }),
    reviewedBy: z.string().trim().min(1).max(120).nullable().default(null),
  })
  .strict()
  .superRefine((decision, context) => {
    const targetRequired = decision.outcome === "EXACT" || decision.outcome === "HIGH_CONFIDENCE";
    if (targetRequired && !decision.targetId) {
      context.addIssue({
        code: "custom",
        path: ["targetId"],
        message: "A matched decision requires a target",
      });
    }
  });

export const qualificationDecisionV1Schema = z
  .object({
    version: z.literal(1),
    targetId: z.string().trim().min(1).max(120),
    outcome: qualificationOutcomeSchema,
    configVersion: z.string().trim().min(1).max(80),
    reasons: z.array(qualificationReasonSchema).min(1).max(20),
    evidenceIds: z.array(z.string().trim().min(1).max(120)).max(100),
    confidence: z.number().min(0).max(1),
    decidedAt: z.iso.datetime({ offset: true }),
  })
  .strict();

export const pipelineMilestoneEventV1Schema = z
  .object({
    version: z.literal(1),
    targetId: z.string().trim().min(1).max(120),
    milestone: pipelineMilestoneSchema,
    occurredAt: z.iso.datetime({ offset: true }),
    idempotencyKey: z.string().trim().min(8).max(300),
    correlationId: z.string().trim().min(1).max(120),
    decisionId: z.string().trim().min(1).max(120).nullable().default(null),
  })
  .strict();

export type ResolutionOutcome = z.infer<typeof resolutionOutcomeSchema>;
export type QualificationOutcome = z.infer<typeof qualificationOutcomeSchema>;
export type QualificationReason = z.infer<typeof qualificationReasonSchema>;
export type PipelineMilestone = z.infer<typeof pipelineMilestoneSchema>;
export type ResolutionDecisionV1 = z.infer<typeof resolutionDecisionV1Schema>;
export type QualificationDecisionV1 = z.infer<typeof qualificationDecisionV1Schema>;
export type PipelineMilestoneEventV1 = z.infer<typeof pipelineMilestoneEventV1Schema>;
