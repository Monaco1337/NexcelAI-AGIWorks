import { createHash } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import { newTargetId } from "../model";

export interface RawObservationInput {
  targetId?: string | null;
  searchJobId?: string | null;
  enrichmentJobId?: string | null;
  providerRequestId?: string | null;
  provider: string;
  sourceKind: string;
  sourceLocator?: string | null;
  externalRecordId?: string | null;
  contentType?: string | null;
  payload: unknown;
  idempotencyKey?: string;
  schemaVersion?: string;
  observedAt?: string;
  correlationId?: string | null;
  provenance?: Record<string, unknown>;
  retentionClass?: string;
  retainUntil?: string | null;
}

export interface StoredObservation {
  id: string;
  payloadHash: string;
  ingestedAt: string;
}

export async function appendRawObservation(input: RawObservationInput): Promise<StoredObservation> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const id = newTargetId("obs");
  const payloadHash = hashPayload(input.payload);
  const idempotencyKey = input.idempotencyKey ?? hashPayload({
    provider: input.provider,
    sourceKind: input.sourceKind,
    externalRecordId: input.externalRecordId ?? null,
    payloadHash,
  });
  let rows = await sql<Record<string, unknown>[]>`
    INSERT INTO sales_target_raw_observations (
      id, target_id, search_job_id, enrichment_job_id, provider_request_id,
      provider, source_kind, source_locator, external_record_id, content_type,
      payload, payload_hash, idempotency_key, schema_version, observed_at, correlation_id,
      provenance, retention_class, retain_until
    ) VALUES (
      ${id}, ${input.targetId ?? null}, ${input.searchJobId ?? null},
      ${input.enrichmentJobId ?? null}, ${input.providerRequestId ?? null},
      ${input.provider}, ${input.sourceKind}, ${input.sourceLocator ?? null},
      ${input.externalRecordId ?? null}, ${input.contentType ?? "application/json"},
      ${sql.json(jsonParam(input.payload))}, ${payloadHash}, ${idempotencyKey},
      ${input.schemaVersion ?? "v1"},
      ${input.observedAt ?? new Date().toISOString()}, ${input.correlationId ?? null},
      ${sql.json(jsonParam(input.provenance ?? {}))}, ${input.retentionClass ?? "operational"},
      ${input.retainUntil ?? null}
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING id, payload_hash, ingested_at
  `;
  if (!rows[0]) {
    rows = await sql<Record<string, unknown>[]>`
      SELECT id, payload_hash, ingested_at
      FROM sales_target_raw_observations
      WHERE idempotency_key = ${idempotencyKey}
      LIMIT 1
    `;
  }
  return {
    id: String(rows[0].id),
    payloadHash: String(rows[0].payload_hash),
    ingestedAt: toIso(rows[0].ingested_at),
  };
}

export interface NormalizedCandidateInput {
  observationId: string;
  targetId?: string | null;
  entityKind?: string;
  fieldPath: string;
  rawValue: unknown;
  normalizedValue: unknown;
  normalizedText?: string | null;
  normalizationKey?: string | null;
  normalizerName: string;
  normalizerVersion: string;
  confidence: number;
  correlationId?: string | null;
  provenance?: Record<string, unknown>;
}

export async function appendNormalizedCandidate(input: NormalizedCandidateInput): Promise<string> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const id = newTargetId("cand");
  let rows = await sql<{ id: string }[]>`
    INSERT INTO sales_target_normalized_candidates (
      id, observation_id, target_id, entity_kind, field_path, raw_value,
      normalized_value, normalized_text, normalization_key, normalizer_name,
      normalizer_version, confidence, correlation_id, provenance
    ) VALUES (
      ${id}, ${input.observationId}, ${input.targetId ?? null}, ${input.entityKind ?? "company"},
      ${input.fieldPath}, ${sql.json(jsonParam(input.rawValue))},
      ${sql.json(jsonParam(input.normalizedValue))}, ${input.normalizedText ?? null},
      ${input.normalizationKey ?? null}, ${input.normalizerName}, ${input.normalizerVersion},
      ${Math.max(0, Math.min(1, input.confidence))}, ${input.correlationId ?? null},
      ${sql.json(jsonParam(input.provenance ?? {}))}
    )
    ON CONFLICT (
      observation_id, field_path, normalizer_name, normalizer_version
    ) DO NOTHING
    RETURNING id
  `;
  if (!rows[0]) {
    rows = await sql<{ id: string }[]>`
      SELECT id FROM sales_target_normalized_candidates
      WHERE observation_id = ${input.observationId}
        AND field_path = ${input.fieldPath}
        AND normalizer_name = ${input.normalizerName}
        AND normalizer_version = ${input.normalizerVersion}
      LIMIT 1
    `;
  }
  return rows[0].id;
}

function hashPayload(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
      .join(",")}}`;
  }
  return JSON.stringify(value) ?? "null";
}

function toIso(value: unknown): string {
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(String(value));
  return Number.isFinite(parsed.getTime()) ? parsed.toISOString() : new Date(0).toISOString();
}

