import { executeDiscoveryProviderCall } from "./execution";
import type {
  DiscoveryProvider,
  DiscoveryRequest,
  DiscoveryResponse,
} from "./types";

export async function executeDiscoveryFailover(
  providers: readonly DiscoveryProvider[],
  request: DiscoveryRequest,
  context: { searchJobId: string; attempt: number; correlationId?: string | null },
): Promise<DiscoveryResponse> {
  const combined: DiscoveryResponse = {
    companies: [],
    providerLogs: [],
    estimatedCostCents: 0,
    actualCostCents: 0,
    providerObservedCount: 0,
    contractRejectedCount: 0,
  };
  const compatible = providers.filter((provider) => provider.supports?.(request) ?? true);
  const maxAttempts = Math.max(
    1,
    Math.min(Number(process.env.DISCOVERY_MAX_PROVIDER_ATTEMPTS ?? 3) || 3, 3),
  );
  let fallbackFromProvider: string | null = null;
  let fallbackReason: string | null = null;
  for (const [index, provider] of compatible.slice(0, maxAttempts).entries()) {
    try {
      const response = await executeDiscoveryProviderCall(provider, request, {
        ...context,
        attemptSequence: index + 1,
        fallbackFromProvider,
        fallbackReason,
      });
      combined.companies.push(...response.companies);
      combined.providerLogs.push(...response.providerLogs);
      combined.estimatedCostCents += response.estimatedCostCents;
      combined.actualCostCents += response.actualCostCents;
      combined.providerObservedCount =
        (combined.providerObservedCount ?? 0) + (response.providerObservedCount ?? response.companies.length);
      combined.contractRejectedCount =
        (combined.contractRejectedCount ?? 0) + (response.contractRejectedCount ?? 0);
      if (combined.companies.length >= request.limit) break;
      fallbackFromProvider = provider.key;
      fallbackReason = response.providerLogs.some((log) => !log.ok)
        ? "PROVIDER_ERROR"
        : "INSUFFICIENT_YIELD";
    } catch (error) {
      combined.providerLogs.push({
        provider: provider.key,
        endpoint: "discovery",
        latencyMs: 0,
        ok: false,
        error: error instanceof Error ? error.message : "provider_failed",
      });
      fallbackFromProvider = provider.key;
      fallbackReason = "PROVIDER_EXCEPTION";
    }
  }
  return combined;
}
