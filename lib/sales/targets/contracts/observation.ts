import { z } from "zod";
import { salesTargetsConfig } from "@/config/sales-targets";
import { retentionClassSchema } from "./provider";

export const observationKindSchema = z.enum([
  "DISCOVERY_RESULT",
  "COMPANY_PROFILE",
  "CONTACT",
  "WEBSITE_FETCH",
  "FINANCIAL_SIGNAL",
  "MANUAL_IMPORT",
]);

export const observationParseStatusSchema = z.enum([
  "PENDING",
  "ACCEPTED",
  "REJECTED",
  "QUARANTINED",
]);

function serializedByteLength(value: unknown): number {
  try {
    const serialized = JSON.stringify(value);
    return serialized === undefined ? Number.POSITIVE_INFINITY : new TextEncoder().encode(serialized).byteLength;
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

const jsonPayloadSchema = z.unknown().superRefine((payload, context) => {
  const byteLength = serializedByteLength(payload);
  if (!Number.isFinite(byteLength)) {
    context.addIssue({ code: "custom", message: "Payload must be JSON serializable" });
  } else if (byteLength > salesTargetsConfig.observations.maxPayloadBytes) {
    context.addIssue({
      code: "custom",
      message: `Payload exceeds ${salesTargetsConfig.observations.maxPayloadBytes} bytes`,
    });
  }
});

/**
 * Versioned trust-boundary contract emitted by provider adapters.
 * This is evidence, not a canonical company mutation.
 */
export const rawObservationV1Schema = z
  .object({
    version: z.literal(1),
    providerId: z.string().trim().min(1).max(80),
    providerContractVersion: z.number().int().positive(),
    kind: observationKindSchema,
    externalId: z.string().trim().min(1).max(500).nullable().default(null),
    sourceUrl: z.url().max(2_048).nullable().default(null),
    observedAt: z.iso.datetime({ offset: true }),
    receivedAt: z.iso.datetime({ offset: true }),
    correlationId: z.string().trim().min(1).max(120),
    searchJobId: z.string().trim().min(1).max(120).nullable().default(null),
    coveragePartitionId: z.string().trim().min(1).max(120).nullable().default(null),
    idempotencyKey: z.string().trim().min(8).max(300),
    payloadHash: z.string().regex(/^[a-f0-9]{64}$/),
    retentionClass: retentionClassSchema,
    retentionExpiresAt: z.iso.datetime({ offset: true }).nullable().default(null),
    payload: jsonPayloadSchema,
  })
  .strict()
  .superRefine((observation, context) => {
    if (observation.retentionClass === "NONE" && observation.payload !== null) {
      context.addIssue({
        code: "custom",
        path: ["payload"],
        message: "Payload must be null when retention is forbidden",
      });
    }
  });

export const observationEnvelopeSchema = z.discriminatedUnion("version", [
  rawObservationV1Schema,
]);

export type ObservationKind = z.infer<typeof observationKindSchema>;
export type ObservationParseStatus = z.infer<typeof observationParseStatusSchema>;
export type RawObservationV1 = z.infer<typeof rawObservationV1Schema>;
export type ObservationEnvelope = z.infer<typeof observationEnvelopeSchema>;
