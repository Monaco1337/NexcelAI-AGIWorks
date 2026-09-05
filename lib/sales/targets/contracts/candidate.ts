import { z } from "zod";

export const candidateValidationOutcomeSchema = z.enum([
  "VALID",
  "REJECTED",
  "REVIEW_REQUIRED",
]);

export const candidateRejectionReasonSchema = z.enum([
  "INVALID_CONTRACT",
  "MISSING_NAME",
  "MISSING_GEOGRAPHY",
  "OUT_OF_SCOPE",
  "UNSUPPORTED_ENTITY",
  "POLICY_RESTRICTED",
  "MALICIOUS_CONTENT",
  "INSUFFICIENT_IDENTITY",
]);

export const normalizedIdentityKeySchema = z
  .object({
    type: z.enum([
      "PROVIDER_EXTERNAL_ID",
      "DOMAIN",
      "PHONE",
      "NAME_POSTAL_CODE",
      "NAME_CITY",
      "ADDRESS",
    ]),
    value: z.string().trim().min(1).max(500),
    exclusive: z.boolean(),
    confidence: z.number().min(0).max(1),
  })
  .strict();

/**
 * A validated, normalized projection of one immutable observation.
 * Original/display values stay on the observation; comparison values live here.
 */
export const normalizedCandidateV1Schema = z
  .object({
    version: z.literal(1),
    observationId: z.string().trim().min(1).max(120),
    normalizationVersion: z.string().trim().min(1).max(80),
    displayName: z.string().trim().min(1).max(300),
    normalizedName: z.string().trim().min(1).max(300),
    legalName: z.string().trim().max(300).nullable().default(null),
    legalForm: z.string().trim().max(100).nullable().default(null),
    registrableDomain: z.string().trim().max(253).nullable().default(null),
    normalizedPhone: z.string().trim().max(40).nullable().default(null),
    addressLine: z.string().trim().max(500).nullable().default(null),
    postalCode: z.string().trim().max(20).nullable().default(null),
    city: z.string().trim().max(120).nullable().default(null),
    region: z.string().trim().max(120).nullable().default(null),
    country: z.string().trim().length(2),
    latitude: z.number().min(-90).max(90).nullable().default(null),
    longitude: z.number().min(-180).max(180).nullable().default(null),
    identityKeys: z.array(normalizedIdentityKeySchema).max(50),
    confidence: z.number().min(0).max(1),
    validationOutcome: candidateValidationOutcomeSchema,
    rejectionReasons: z.array(candidateRejectionReasonSchema).max(20),
  })
  .strict()
  .superRefine((candidate, context) => {
    const rejected = candidate.validationOutcome === "REJECTED";
    if (rejected !== (candidate.rejectionReasons.length > 0)) {
      context.addIssue({
        code: "custom",
        path: ["rejectionReasons"],
        message: "Rejected candidates require reasons; accepted candidates must not have them",
      });
    }
    if ((candidate.latitude === null) !== (candidate.longitude === null)) {
      context.addIssue({
        code: "custom",
        path: ["longitude"],
        message: "Latitude and longitude must be supplied together",
      });
    }
  });

export type CandidateValidationOutcome = z.infer<typeof candidateValidationOutcomeSchema>;
export type CandidateRejectionReason = z.infer<typeof candidateRejectionReasonSchema>;
export type NormalizedIdentityKey = z.infer<typeof normalizedIdentityKeySchema>;
export type NormalizedCandidateV1 = z.infer<typeof normalizedCandidateV1Schema>;
