import { createHash } from "node:crypto";
import { logProviderRequest } from "../hardening/storeAdditions";
import {
  assertProviderCallablePersistent,
  markProviderFailure,
  markProviderRateLimited,
  markProviderSuccess,
} from "./health";
import {
  estimateProviderCallCostCents,
  reconcileProviderCall,
  reserveProviderCall,
} from "./policyStore";
import type {
  DiscoveredCompanyStub,
  DiscoveryProvider,
  DiscoveryRequest,
  DiscoveryResponse,
} from "./types";
import { providerCompanyObservationV1Schema } from "../contracts/provider";
import { normalizeCompanyName } from "../entityResolution";

export interface DiscoveryCallContext {
  searchJobId: string;
  attempt: number;
  correlationId?: string | null;
  attemptSequence?: number;
  fallbackFromProvider?: string | null;
  fallbackReason?: string | null;
}

export interface ControlledProviderOutcome {
  success: boolean;
  latencyMs?: number | null;
  responseStatus?: number | null;
  responseBytes?: number | null;
  actualCostCents?: number;
  error?: string | null;
  measurements?: Record<string, unknown>;
}

export async function executeControlledProviderCall<T>(input: {
  provider: string;
  endpoint: string;
  idempotencyKey: string;
  estimatedCostCents: number;
  targetId?: string | null;
  searchJobId?: string | null;
  correlationId?: string | null;
  operation: () => Promise<T>;
  describe: (value: T, elapsedMs: number) => ControlledProviderOutcome;
}): Promise<T> {
  await assertProviderCallablePersistent(input.provider);
  const reservation = await reserveProviderCall({
    provider: input.provider,
    endpoint: input.endpoint,
    idempotencyKey: input.idempotencyKey,
    estimatedCostCents: input.estimatedCostCents,
    targetId: input.targetId,
    searchJobId: input.searchJobId,
  });
  const startedAt = Date.now();
  try {
    const value = await input.operation();
    const outcome = input.describe(value, Date.now() - startedAt);
    const errorCode = outcome.success ? null : classifyProviderError(outcome.error);
    const providerRequestId = await logProviderRequest({
      targetId: input.targetId,
      searchJobId: input.searchJobId,
      provider: input.provider,
      endpoint: input.endpoint,
      requestHash: input.idempotencyKey,
      responseStatus: outcome.responseStatus,
      responseBytes: outcome.responseBytes,
      latencyMs: outcome.latencyMs ?? Date.now() - startedAt,
      estimatedCostCents: input.estimatedCostCents,
      costCents: outcome.actualCostCents ?? 0,
      error: outcome.success ? null : outcome.error ?? "provider_failed",
      correlationId: input.correlationId,
      providerConfigId: reservation.providerConfigId,
      budgetId: reservation.providerBudgetId,
      errorCode,
    });
    await reconcileProviderCall({
      reservation,
      providerRequestId,
      actualCostCents: outcome.actualCostCents ?? 0,
      success: outcome.success,
      errorCode,
      outcome: {
        latencyMs: outcome.latencyMs ?? Date.now() - startedAt,
        ...outcome.measurements,
      },
    });
    if (outcome.success) markProviderSuccess(input.provider);
    else markProviderError(input.provider, errorCode, outcome.error ?? "provider_failed");
    return value;
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_failed";
    const errorCode = classifyProviderError(message, error);
    const providerRequestId = await logProviderRequest({
      targetId: input.targetId,
      searchJobId: input.searchJobId,
      provider: input.provider,
      endpoint: input.endpoint,
      requestHash: input.idempotencyKey,
      latencyMs: Date.now() - startedAt,
      estimatedCostCents: input.estimatedCostCents,
      costCents: 0,
      error: message,
      correlationId: input.correlationId,
      providerConfigId: reservation.providerConfigId,
      budgetId: reservation.providerBudgetId,
      errorCode,
    });
    await reconcileProviderCall({
      reservation,
      providerRequestId,
      actualCostCents: 0,
      success: false,
        errorCode,
      outcome: { latencyMs: Date.now() - startedAt },
    });
    markProviderError(input.provider, errorCode, message);
    throw error;
  }
}

/**
 * The single production boundary for discovery-provider calls.
 * Policy, circuit, request/concurrency/cost reservation, durable request
 * outcome and reservation reconciliation all happen around the network call.
 */
export async function executeDiscoveryProviderCall(
  provider: DiscoveryProvider,
  request: DiscoveryRequest,
  context: DiscoveryCallContext,
): Promise<DiscoveryResponse> {
  await assertProviderCallablePersistent(provider.key);
  const estimatedCostCents = await estimateProviderCallCostCents(provider.key, request.limit);
  const endpoint = "discovery";
  const idempotencyKey = createHash("sha256")
    .update(`${context.searchJobId}:${provider.key}:${context.attempt}:${stableRequest(request)}`)
    .digest("hex");
  const reservation = await reserveProviderCall({
    provider: provider.key,
    endpoint,
    idempotencyKey,
    estimatedCostCents,
    searchJobId: context.searchJobId,
  });
  const startedAt = Date.now();
  try {
    const response = await provider.discover(request);
    const providerObservedCount = response.companies.length;
    response.companies = response.companies.flatMap((company) => {
      const normalized = normalizeProviderCompany(provider, company);
      return normalized ? [normalized] : [];
    });
    response.providerObservedCount = providerObservedCount;
    response.contractRejectedCount = providerObservedCount - response.companies.length;
    const primaryLog = response.providerLogs[0];
    const success = response.providerLogs.length > 0 && response.providerLogs.every((log) => log.ok);
    const errorCode = success ? null : classifyProviderError(primaryLog?.error);
    const providerRequestId = await logProviderRequest({
      searchJobId: context.searchJobId,
      provider: provider.key,
      endpoint: primaryLog?.endpoint ?? endpoint,
      requestHash: idempotencyKey,
      latencyMs: primaryLog?.latencyMs ?? Date.now() - startedAt,
      estimatedCostCents: response.estimatedCostCents,
      costCents: response.actualCostCents,
      error: success ? null : primaryLog?.error ?? "provider_failed",
      correlationId: context.correlationId,
      providerConfigId: reservation.providerConfigId,
      budgetId: reservation.providerBudgetId,
      errorCode,
      providerVersion: `adapter-v${provider.metadata.contractVersion}`,
      attemptSequence: context.attemptSequence ?? 1,
      fallbackFromProvider: context.fallbackFromProvider,
      fallbackReason: context.fallbackReason,
      providerObservedCount,
      contractRejectedCount: response.contractRejectedCount,
    });
    await reconcileProviderCall({
      reservation,
      providerRequestId,
      actualCostCents: response.actualCostCents,
      success,
      errorCode,
      outcome: {
        latencyMs: primaryLog?.latencyMs ?? Date.now() - startedAt,
        rawYield: response.companies.length,
        providerObservedCount,
        contractRejectedCount: response.contractRejectedCount,
        estimatedCostCents: response.estimatedCostCents,
      },
    });
    if (success) markProviderSuccess(provider.key);
    else markProviderError(provider.key, errorCode, primaryLog?.error ?? "provider_failed");
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "provider_failed";
    const errorCode = classifyProviderError(message, error);
    const providerRequestId = await logProviderRequest({
      searchJobId: context.searchJobId,
      provider: provider.key,
      endpoint,
      requestHash: idempotencyKey,
      latencyMs: Date.now() - startedAt,
      estimatedCostCents,
      costCents: 0,
      error: message,
      correlationId: context.correlationId,
      providerConfigId: reservation.providerConfigId,
      budgetId: reservation.providerBudgetId,
      errorCode,
      providerVersion: `adapter-v${provider.metadata.contractVersion}`,
      attemptSequence: context.attemptSequence ?? 1,
      fallbackFromProvider: context.fallbackFromProvider,
      fallbackReason: context.fallbackReason,
    });
    await reconcileProviderCall({
      reservation,
      providerRequestId,
      actualCostCents: 0,
      success: false,
      errorCode,
      outcome: { latencyMs: Date.now() - startedAt },
    });
    markProviderError(provider.key, errorCode, message);
    throw error;
  }
}

export function normalizeProviderCompany(
  provider: DiscoveryProvider,
  company: DiscoveredCompanyStub,
  fetchedAt = new Date().toISOString(),
): DiscoveredCompanyStub | null {
  if (company.provider !== provider.key || provider.metadata.id !== provider.key) return null;
  const observedAt = validDate(company.observedAt) ?? fetchedAt;
  const country = (company.country ?? "DE").toUpperCase();
  const normalizedName = normalizeCompanyName(company.name);
  const domain = company.domain ?? domainFromWebsite(company.website ?? null);
  const parsed = providerCompanyObservationV1Schema.safeParse({
    contractVersion: 1,
    provider: provider.key,
    providerVersion: company.providerVersion ?? `adapter-v${provider.metadata.contractVersion}`,
    providerRecordId: company.providerRawId ?? null,
    observedAt,
    fetchedAt,
    companyNameRaw: company.name,
    companyNameNormalized: normalizedName,
    legalName: company.legalName ?? null,
    legalForm: company.legalForm ?? null,
    categoryRaw: company.categoryRaw ?? company.subIndustry ?? null,
    categoryNormalized: company.categoryNormalized ?? company.subIndustry ?? null,
    industry: company.industry ?? null,
    street: company.addressLine ?? null,
    houseNumber: null,
    postalCode: company.postalCode ?? null,
    city: company.city ?? null,
    state: company.state ?? company.region ?? null,
    country,
    latitude: company.latitude ?? null,
    longitude: company.longitude ?? null,
    website: company.website ?? null,
    rootDomain: domain,
    phone: company.phone ?? null,
    email: company.email ?? null,
    socialUrls: company.socialUrls ?? [],
    sourceUrl: company.providerSourceUrl ?? null,
    providerConfidence: company.confidence,
    rawPayloadReference: company.rawPayloadReference ?? null,
  });
  if (!parsed.success) return null;
  return {
    ...company,
    providerVersion: parsed.data.providerVersion,
    observedAt: parsed.data.observedAt,
    fetchedAt: parsed.data.fetchedAt,
    normalizedName: parsed.data.companyNameNormalized,
    categoryRaw: parsed.data.categoryRaw,
    categoryNormalized: parsed.data.categoryNormalized,
    domain: parsed.data.rootDomain,
    state: parsed.data.state,
    country: parsed.data.country,
    socialUrls: parsed.data.socialUrls,
    rawPayloadReference: parsed.data.rawPayloadReference,
  };
}

function stableRequest(request: DiscoveryRequest): string {
  return JSON.stringify({
    city: request.city,
    country: request.country,
    centerLat: request.centerLat,
    centerLng: request.centerLng,
    radiusKm: request.radiusKm,
    industries: [...request.industries].sort(),
    categories: [...request.categories].sort(),
    limit: request.limit,
    depth: request.depth,
    bbox: request.bbox ?? null,
    tagAxis: request.tagAxis ?? null,
  });
}

function validDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
}

function domainFromWebsite(value: string | null): string | null {
  if (!value) return null;
  try {
    return new URL(value).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function classifyProviderError(message?: string | null, error?: unknown): string {
  const normalized = `${message ?? ""} ${error instanceof Error ? error.name : ""}`.toLowerCase();
  if (normalized.includes("429") || normalized.includes("rate limit")) return "PROVIDER_RATE_LIMITED";
  if (normalized.includes("timeout") || normalized.includes("abort")) return "PROVIDER_TIMEOUT";
  if (normalized.includes("invalid json") || normalized.includes("malformed")) return "PROVIDER_MALFORMED_RESPONSE";
  if (normalized.includes("ssrf")) return "PROVIDER_SECURITY_REJECTED";
  return "PROVIDER_FAILED";
}

function markProviderError(provider: string, code: string | null, message: string): void {
  if (code === "PROVIDER_RATE_LIMITED") markProviderRateLimited(provider, message);
  else markProviderFailure(provider, message);
}
