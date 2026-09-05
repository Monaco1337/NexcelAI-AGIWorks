import { db } from "../../lib/pg";
import { executeDiscoveryFailover } from "../../lib/sales/targets/providers/failover";
import type { DiscoveryProvider } from "../../lib/sales/targets/providers/types";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const suffix = Date.now().toString(36);
  const searchJobId = `failover_job_${suffix}`;
  await sql`
    INSERT INTO sales_target_search_jobs (id, label)
    VALUES (${searchJobId}, 'Provider failover acceptance')
  `;
  const failingPrimary: DiscoveryProvider = {
    key: `injected_primary_${suffix}`,
    label: "Injected failing primary",
    metadata: {
      id: `injected_primary_${suffix}`,
      contractVersion: 1,
      displayName: "Injected failing primary",
      capabilities: ["DISCOVERY"],
      countries: ["DE"],
      secretNames: [],
      policy: {
        license: "acceptance-test",
        attribution: null,
        retentionClass: "TRANSIENT",
        maxRetentionDays: 0,
        permittedFields: [],
        storesRawPayload: false,
      },
    },
    isConfigured: () => true,
    discover: async () => {
      throw new Error("injected primary outage");
    },
  };
  const fallback: DiscoveryProvider = {
    key: `injected_fallback_${suffix}`,
    label: "Injected healthy fallback",
    metadata: {
      id: `injected_fallback_${suffix}`,
      contractVersion: 1,
      displayName: "Injected healthy fallback",
      capabilities: ["DISCOVERY"],
      countries: ["DE"],
      secretNames: [],
      policy: {
        license: "acceptance-test",
        attribution: null,
        retentionClass: "TRANSIENT",
        maxRetentionDays: 0,
        permittedFields: ["name", "location"],
        storesRawPayload: false,
      },
    },
    isConfigured: () => true,
    supports: () => true,
    discover: async () => ({
      companies: [{
        provider: `injected_fallback_${suffix}`,
        providerRawId: "company-1",
        name: "Failover Muster GmbH",
        city: "Dortmund",
        region: "Nordrhein-Westfalen",
        country: "DE",
        latitude: 51.5136,
        longitude: 7.4653,
        confidence: 0.8,
      }],
      estimatedCostCents: 0,
      actualCostCents: 0,
      providerLogs: [{
        provider: `injected_fallback_${suffix}`,
        endpoint: "injected",
        latencyMs: 1,
        ok: true,
      }],
    }),
  };
  const response = await executeDiscoveryFailover(
    [failingPrimary, fallback],
    {
      city: "Dortmund",
      country: "DE",
      centerLat: 51.5136,
      centerLng: 7.4653,
      radiusKm: 1,
      industries: [],
      categories: [],
      limit: 10,
      depth: "QUICK",
      bbox: { south: 51.508, west: 7.456, north: 51.519, east: 7.475 },
      tagAxis: "craft",
    },
    { searchJobId, attempt: 1, correlationId: `failover-${suffix}` },
  );
  const primaryFailed = response.providerLogs.some(
    (log) => log.provider === failingPrimary.key && !log.ok,
  );
  const fallbackSucceeded = response.providerLogs.some(
    (log) => log.provider === fallback.key && log.ok,
  );
  if (!primaryFailed || !fallbackSucceeded || response.companies.length === 0) {
    throw new Error(`provider failover not demonstrated: ${JSON.stringify(response.providerLogs)}`);
  }
  const attempts = await sql<{
    provider: string;
    attempt_sequence: number;
    fallback_from_provider: string | null;
    fallback_reason: string | null;
  }[]>`
    SELECT provider, attempt_sequence, fallback_from_provider, fallback_reason
    FROM sales_target_provider_requests
    WHERE search_job_id = ${searchJobId}
    ORDER BY attempt_sequence
  `;
  const fallbackAttempt = attempts.find((attempt) => attempt.provider === fallback.key);
  if (
    attempts.length !== 2 ||
    fallbackAttempt?.attempt_sequence !== 2 ||
    fallbackAttempt.fallback_from_provider !== failingPrimary.key ||
    fallbackAttempt.fallback_reason !== "PROVIDER_EXCEPTION"
  ) {
    throw new Error(`failover attribution not persisted: ${JSON.stringify(attempts)}`);
  }
  console.log(JSON.stringify({
    primaryFailed,
    fallbackProvider: fallback.key,
    fallbackSucceeded,
    companies: response.companies.length,
    providerLogs: response.providerLogs,
    attempts,
  }));
  await sql.end({ timeout: 5 });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
