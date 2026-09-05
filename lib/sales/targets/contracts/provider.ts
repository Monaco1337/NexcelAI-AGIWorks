import { z } from "zod";

const contractKey = z.string().trim().min(1).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/);
const shortText = z.string().trim().min(1).max(200);

export const providerCapabilitySchema = z.enum([
  "DISCOVERY",
  "COMPANY_BASICS",
  "CONTACTS",
  "DECISION_MAKERS",
  "WEBSITE",
  "FINANCIAL_SIGNALS",
]);

export const providerStateSchema = z.enum([
  "HEALTHY",
  "DEGRADED",
  "RATE_LIMITED",
  "OPEN",
  "DISABLED",
  "MISCONFIGURED",
]);

export const retentionClassSchema = z.enum([
  "NONE",
  "TRANSIENT",
  "BOUNDED",
  "PERMITTED",
]);

export const providerPolicySchema = z
  .object({
    license: shortText,
    attribution: z.string().trim().max(500).nullable().default(null),
    retentionClass: retentionClassSchema,
    maxRetentionDays: z.number().int().min(0).max(3_650).nullable(),
    permittedFields: z.array(contractKey).max(100),
    storesRawPayload: z.boolean(),
  })
  .strict()
  .superRefine((policy, context) => {
    if (policy.retentionClass === "NONE" && policy.storesRawPayload) {
      context.addIssue({
        code: "custom",
        path: ["storesRawPayload"],
        message: "Raw payload storage is forbidden by this retention class",
      });
    }
  });

export const providerMetadataSchema = z
  .object({
    id: contractKey,
    contractVersion: z.number().int().positive(),
    displayName: shortText,
    capabilities: z.array(providerCapabilitySchema).min(1),
    countries: z.array(z.string().trim().length(2)).min(1).max(100),
    secretNames: z.array(z.string().regex(/^[A-Z][A-Z0-9_]*$/)).max(20),
    policy: providerPolicySchema,
  })
  .strict();

const bboxSchema = z
  .object({
    south: z.number().min(-90).max(90),
    west: z.number().min(-180).max(180),
    north: z.number().min(-90).max(90),
    east: z.number().min(-180).max(180),
  })
  .strict()
  .refine((bbox) => bbox.south < bbox.north, {
    path: ["north"],
    message: "north must be greater than south",
  })
  .refine((bbox) => bbox.west < bbox.east, {
    path: ["east"],
    message: "east must be greater than west",
  });

export const providerSearchRequestV1Schema = z
  .object({
    version: z.literal(1),
    correlationId: contractKey,
    country: z.string().trim().length(2),
    city: z.string().trim().min(1).max(120).optional(),
    region: z.string().trim().min(1).max(120).optional(),
    bbox: bboxSchema.optional(),
    center: z
      .object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        radiusKm: z.number().positive().max(500),
      })
      .strict()
      .optional(),
    categories: z.array(contractKey).min(1).max(100),
    limit: z.number().int().min(1).max(1_000),
    cursor: z.string().max(2_000).nullable().default(null),
  })
  .strict()
  .refine((request) => Boolean(request.city || request.region || request.bbox || request.center), {
    path: ["city"],
    message: "At least one geography selector is required",
  });

const nullableText = (max: number) => z.string().trim().max(max).nullable();

export const providerCompanyObservationV1Schema = z.object({
  contractVersion: z.literal(1),
  provider: contractKey,
  providerVersion: z.string().trim().min(1).max(80),
  providerRecordId: nullableText(500),
  observedAt: z.string().datetime(),
  fetchedAt: z.string().datetime(),
  companyNameRaw: z.string().trim().min(1).max(300),
  companyNameNormalized: z.string().trim().min(1).max(300),
  legalName: nullableText(300),
  legalForm: nullableText(100),
  categoryRaw: nullableText(300),
  categoryNormalized: nullableText(300),
  industry: nullableText(200),
  street: nullableText(500),
  houseNumber: nullableText(100),
  postalCode: nullableText(30),
  city: nullableText(200),
  state: nullableText(200),
  country: z.string().trim().length(2),
  latitude: z.number().min(-90).max(90).nullable(),
  longitude: z.number().min(-180).max(180).nullable(),
  website: nullableText(2_000),
  rootDomain: nullableText(253),
  phone: nullableText(100),
  email: nullableText(320),
  socialUrls: z.array(z.string().trim().max(2_000)).max(20),
  sourceUrl: nullableText(2_000),
  providerConfidence: z.number().min(0).max(1),
  rawPayloadReference: nullableText(1_000),
}).strict();

export type ProviderCapability = z.infer<typeof providerCapabilitySchema>;
export type ProviderState = z.infer<typeof providerStateSchema>;
export type RetentionClass = z.infer<typeof retentionClassSchema>;
export type ProviderPolicy = z.infer<typeof providerPolicySchema>;
export type ProviderMetadata = z.infer<typeof providerMetadataSchema>;
export type ProviderSearchRequestV1 = z.infer<typeof providerSearchRequestV1Schema>;
export type ProviderCompanyObservationV1 = z.infer<typeof providerCompanyObservationV1Schema>;
