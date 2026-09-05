import { z } from "zod";
import { salesTargetsConfig } from "@/config/sales-targets";
import {
  ENRICHMENT_STATUSES,
  PRIORITY_CLASSES,
} from "@/lib/sales/targets/model";

const optionalFiniteNumber = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().finite().optional()
);

const optionalBoolean = z.preprocess((value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  if (value === true || value === "true" || value === "1") return true;
  if (value === false || value === "false" || value === "0") return false;
  return value;
}, z.boolean().optional());

const filterValues = (schema: z.ZodType<string>) =>
  z.array(schema).max(salesTargetsConfig.api.maxFilterValues).optional();

export const targetListQuerySchema = z
  .object({
    city: filterValues(z.string().trim().min(1).max(120)),
    industry: filterValues(z.string().trim().min(1).max(120)),
    priority: filterValues(z.enum(PRIORITY_CLASSES)),
    status: filterValues(z.enum(ENRICHMENT_STATUSES)),
    maxDistanceKm: optionalFiniteNumber.pipe(z.number().min(0).max(20_000).optional()),
    minScore: optionalFiniteNumber.pipe(z.number().min(0).max(100).optional()),
    hasWebsite: optionalBoolean,
    hasPhone: optionalBoolean,
    hasEmail: optionalBoolean,
    hasDm: optionalBoolean,
    weakWebsite: optionalBoolean,
    softwareOpp: optionalBoolean,
    q: z.string().trim().max(salesTargetsConfig.api.maxQueryLength).optional(),
    limit: z.coerce.number().int().min(1).max(salesTargetsConfig.api.maxListLimit).default(100),
    offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
    cursor: z.string().trim().max(512).optional(),
    sort: z.enum(["score", "distance", "recent", "name"]).default("score"),
    centerLat: optionalFiniteNumber.pipe(z.number().min(-90).max(90).optional()),
    centerLng: optionalFiniteNumber.pipe(z.number().min(-180).max(180).optional()),
    centerRadiusKm: optionalFiniteNumber.pipe(z.number().positive().max(500).optional()),
    includeChains: optionalBoolean,
  })
  .strict()
  .superRefine((query, context) => {
    const centerValues = [query.centerLat, query.centerLng, query.centerRadiusKm];
    const supplied = centerValues.filter((value) => value !== undefined).length;
    if (supplied !== 0 && supplied !== centerValues.length) {
      context.addIssue({
        code: "custom",
        path: ["centerLat"],
        message: "centerLat, centerLng and centerRadiusKm must be supplied together",
      });
    }
  });

function splitMulti(params: URLSearchParams, key: string): string[] | undefined {
  const values = params
    .getAll(key)
    .flatMap((value) => value.split(","))
    .map((value) => value.trim())
    .filter(Boolean);
  return values.length > 0 ? values : undefined;
}

export function targetListQueryInput(params: URLSearchParams): Record<string, unknown> {
  return {
    city: splitMulti(params, "city"),
    industry: splitMulti(params, "industry"),
    priority: splitMulti(params, "priority"),
    status: splitMulti(params, "status"),
    maxDistanceKm: params.get("maxDistanceKm") ?? undefined,
    minScore: params.get("minScore") ?? undefined,
    hasWebsite: params.get("hasWebsite") ?? undefined,
    hasPhone: params.get("hasPhone") ?? undefined,
    hasEmail: params.get("hasEmail") ?? undefined,
    hasDm: params.get("hasDm") ?? undefined,
    weakWebsite: params.get("weakWebsite") ?? undefined,
    softwareOpp: params.get("softwareOpp") ?? undefined,
    q: params.get("q") ?? undefined,
    limit: params.get("limit") ?? undefined,
    offset: params.get("offset") ?? undefined,
    cursor: params.get("cursor") ?? undefined,
    sort: params.get("sort") ?? undefined,
    centerLat: params.get("centerLat") ?? undefined,
    centerLng: params.get("centerLng") ?? undefined,
    centerRadiusKm: params.get("centerRadiusKm") ?? undefined,
    includeChains: params.get("includeChains") ?? undefined,
  };
}

export const apiValidationIssueSchema = z
  .object({
    path: z.string(),
    code: z.string(),
    message: z.string(),
  })
  .strict();

export const targetApiErrorSchema = z
  .object({
    error: z.string(),
    message: z.string(),
    correlationId: z.string().optional(),
    issues: z.array(apiValidationIssueSchema).optional(),
  })
  .strict();

const boundedText = (max: number) => z.string().trim().max(max);

export const legacyContactStorageInputSchema = z
  .object({
    id: z.string().trim().max(120).optional(),
    vorname: boundedText(120),
    nachname: boundedText(120),
    email: z.email().max(320),
    telefon: boundedText(80).default(""),
    unternehmen: boundedText(200).default(""),
    betreff: boundedText(200),
    nachricht: boundedText(10_000),
    createdAt: z.iso.datetime({ offset: true }).optional(),
    status: z.enum(["open", "in_progress", "closed"]).optional(),
  })
  .strict();

export const testEmailQuerySchema = z
  .object({
    to: z.email().max(320),
  })
  .strict();

export type TargetListQuery = z.infer<typeof targetListQuerySchema>;
export type TargetApiError = z.infer<typeof targetApiErrorSchema>;
export type LegacyContactStorageInput = z.infer<typeof legacyContactStorageInputSchema>;
