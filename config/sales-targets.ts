import "server-only";

import { z } from "zod";

const booleanFromEnv = z
  .enum(["true", "false", "1", "0"])
  .optional()
  .transform((value) => value === "true" || value === "1");

const boundedInteger = (fallback: number, min: number, max: number) =>
  z.coerce.number().int().min(min).max(max).default(fallback);

const envSchema = z.object({
  SALES_TARGETS_ENABLED: booleanFromEnv,
  SALES_TARGETS_LEGACY_INPUT_COMPATIBILITY: booleanFromEnv,
  SALES_TARGETS_MAX_LIST_LIMIT: boundedInteger(1_000, 1, 1_000),
  SALES_TARGETS_MAX_FILTER_VALUES: boundedInteger(50, 1, 100),
  SALES_TARGETS_MAX_QUERY_LENGTH: boundedInteger(200, 1, 1_000),
  SALES_TARGETS_MAX_JSON_BYTES: boundedInteger(262_144, 1_024, 1_048_576),
  SALES_TARGETS_MAX_OBSERVATION_BYTES: boundedInteger(262_144, 1_024, 1_048_576),
  SALES_TARGETS_DEFAULT_COUNTRY: z.string().trim().length(2).default("DE"),
  SALES_TARGETS_BUSINESS_TIME_ZONE: z.string().trim().min(1).default("Europe/Berlin"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const fields = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
  throw new Error(`Invalid sales-target configuration: ${fields}`);
}

const env = parsed.data;

/**
 * Secret-free, server-side runtime configuration.
 *
 * Values are bounded at process startup so malformed environment variables
 * cannot silently remove request/payload limits.
 */
export const salesTargetsConfig = Object.freeze({
  enabled: env.SALES_TARGETS_ENABLED ?? true,
  compatibility: Object.freeze({
    acceptLegacyInput: env.SALES_TARGETS_LEGACY_INPUT_COMPATIBILITY ?? false,
  }),
  api: Object.freeze({
    maxListLimit: env.SALES_TARGETS_MAX_LIST_LIMIT,
    maxFilterValues: env.SALES_TARGETS_MAX_FILTER_VALUES,
    maxQueryLength: env.SALES_TARGETS_MAX_QUERY_LENGTH,
    maxJsonBytes: env.SALES_TARGETS_MAX_JSON_BYTES,
  }),
  observations: Object.freeze({
    maxPayloadBytes: env.SALES_TARGETS_MAX_OBSERVATION_BYTES,
  }),
  defaults: Object.freeze({
    country: env.SALES_TARGETS_DEFAULT_COUNTRY.toUpperCase(),
    businessTimeZone: env.SALES_TARGETS_BUSINESS_TIME_ZONE,
  }),
});

export type SalesTargetsConfig = typeof salesTargetsConfig;
