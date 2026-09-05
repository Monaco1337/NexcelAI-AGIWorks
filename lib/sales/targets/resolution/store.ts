import { createHash } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import type { Fingerprint } from "../entityResolution";
import { newTargetId } from "../model";

export interface ResolutionRecordInput {
  targetId: string;
  observationId: string;
  candidateId: string;
  fingerprint: Fingerprint;
  wasCreated: boolean;
  provider: string;
  confidence: number;
  correlationId?: string | null;
}

/**
 * Persists identity claims and the resolver decision under sorted
 * transaction-scoped advisory locks. Network calls never occur in this
 * transaction, and competing workers serialize on the same strong keys.
 */
export async function recordResolution(input: ResolutionRecordInput): Promise<string> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const claims = identityClaims(input.fingerprint);
  return sql.begin(async (tx) => {
    for (const claim of [...claims].sort((a, b) => a.hash.localeCompare(b.hash))) {
      await tx`SELECT pg_advisory_xact_lock(hashtextextended(${claim.hash}, 0))`;
    }

    let primaryClaimId: string | null = null;
    for (const claim of claims) {
      const id = newTargetId("claim");
      let rows = await tx<{ id: string }[]>`
        INSERT INTO sales_target_identity_claims (
          id, target_id, candidate_id, observation_id, subject_kind, claim_kind,
          namespace, claimed_value, normalized_value, identity_key_hash,
          asserted_by, confidence, correlation_id, provenance
        ) VALUES (
          ${id}, ${input.targetId}, ${input.candidateId}, ${input.observationId},
          'company', ${claim.kind}, ${claim.namespace}, ${claim.value}, ${claim.value},
          ${claim.hash}, ${input.provider}, ${input.confidence}, ${input.correlationId ?? null},
          ${tx.json(jsonParam({ provider: input.provider }))}
        )
        ON CONFLICT (candidate_id, namespace, identity_key_hash)
          WHERE candidate_id IS NOT NULL
        DO NOTHING
        RETURNING id
      `;
      if (!rows[0]) {
        rows = await tx<{ id: string }[]>`
          SELECT id FROM sales_target_identity_claims
          WHERE candidate_id = ${input.candidateId}
            AND namespace = ${claim.namespace}
            AND identity_key_hash = ${claim.hash}
          LIMIT 1
        `;
      }
      primaryClaimId ??= rows[0].id;
    }

    const decisionId = newTargetId("res");
    let decisions = await tx<{ id: string }[]>`
      INSERT INTO sales_target_resolution_decisions (
        id, claim_id, candidate_id, observation_id, resolved_target_id,
        decision_kind, resolver, resolver_version, confidence, rationale,
        evidence, config_snapshot, correlation_id, provenance
      ) VALUES (
        ${decisionId}, ${primaryClaimId}, ${input.candidateId}, ${input.observationId},
        ${input.targetId}, ${input.wasCreated ? "CREATE" : "LINK"},
        'deterministic-company-resolver', 'v1', ${input.confidence},
        ${tx.json(jsonParam({ fingerprint: input.fingerprint.primary }))},
        ${tx.json(jsonParam(claims.map(({ namespace, kind }) => ({ namespace, kind }))))},
        ${tx.json(jsonParam({ autoLinkRequiresCompositeEvidence: true }))},
        ${input.correlationId ?? null},
        ${tx.json(jsonParam({ provider: input.provider }))}
      )
      ON CONFLICT (candidate_id, resolver, resolver_version)
        WHERE candidate_id IS NOT NULL
      DO NOTHING
      RETURNING id
    `;
    if (!decisions[0]) {
      decisions = await tx<{ id: string }[]>`
        SELECT id FROM sales_target_resolution_decisions
        WHERE candidate_id = ${input.candidateId}
          AND resolver = 'deterministic-company-resolver'
          AND resolver_version = 'v1'
        LIMIT 1
      `;
    }
    return decisions[0].id;
  });
}

function identityClaims(fingerprint: Fingerprint): Array<{
  kind: string;
  namespace: string;
  value: string;
  hash: string;
}> {
  const raw: Array<[string, string, string | null]> = [
    ["provider_external_id", "google_place_id", fingerprint.parts.googlePlaceId],
    ["domain", "domain", fingerprint.parts.domain],
    ["phone", "phone", fingerprint.parts.phone],
    ["address", "address", fingerprint.parts.addressCore],
    ["name", "name", fingerprint.parts.nameCore],
  ];
  return raw
    .filter((entry): entry is [string, string, string] => Boolean(entry[2]))
    .map(([kind, namespace, value]) => ({
      kind,
      namespace,
      value,
      hash: createHash("sha256").update(`${namespace}:${value}`).digest("hex"),
    }));
}

