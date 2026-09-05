import type { DiscoveredCompanyStub } from "../providers/types";
import { buildFingerprint } from "../entityResolution";
import { appendNormalizedCandidate, appendRawObservation } from "./store";
import { getDiscoveryProviders } from "../providers/registry";

export interface DiscoveryEvidence {
  observationId: string;
  candidateId: string;
  fingerprint: ReturnType<typeof buildFingerprint>;
}

export async function recordDiscoveryEvidence(
  stub: DiscoveredCompanyStub,
  context: {
    searchJobId?: string | null;
    targetId?: string | null;
    correlationId?: string | null;
  } = {},
): Promise<DiscoveryEvidence> {
  const fingerprint = buildFingerprint({
    name: stub.name,
    legalName: stub.legalName,
    website: stub.website,
    domain: stub.domain,
    phone: stub.phone,
    addressLine: stub.addressLine,
    postalCode: stub.postalCode,
    city: stub.city,
    country: stub.country,
    googlePlaceId: stub.googlePlaceId,
  });
  const providerPolicy = getDiscoveryProviders().find((provider) => provider.key === stub.provider)?.metadata.policy;
  const retainUntil = providerPolicy?.maxRetentionDays
    ? new Date(Date.now() + providerPolicy.maxRetentionDays * 86_400_000).toISOString()
    : null;
  const observation = await appendRawObservation({
    targetId: context.targetId,
    searchJobId: context.searchJobId,
    provider: stub.provider,
    sourceKind: "company_discovery",
    sourceLocator: stub.providerSourceUrl,
    externalRecordId: stub.providerRawId,
    payload: stub,
    observedAt: new Date().toISOString(),
    correlationId: context.correlationId,
    provenance: {
      provider: stub.provider,
      sourceUrl: stub.providerSourceUrl ?? null,
      confidence: stub.confidence,
    },
    retentionClass: providerPolicy?.retentionClass.toLowerCase() ?? "operational",
    retainUntil,
  });
  const candidateId = await appendNormalizedCandidate({
    observationId: observation.id,
    targetId: context.targetId,
    fieldPath: "company",
    rawValue: stub,
    normalizedValue: {
      ...stub,
      domain: fingerprint.parts.domain,
      phone: fingerprint.parts.phone,
      nameCore: fingerprint.parts.nameCore,
      addressCore: fingerprint.parts.addressCore,
    },
    normalizedText: fingerprint.parts.nameCore,
    normalizationKey: fingerprint.primary,
    normalizerName: "company-discovery",
    normalizerVersion: "v1",
    confidence: stub.confidence,
    correlationId: context.correlationId,
  });
  return { observationId: observation.id, candidateId, fingerprint };
}

