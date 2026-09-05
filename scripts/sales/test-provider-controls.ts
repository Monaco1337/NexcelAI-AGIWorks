import { db } from "../../lib/pg";
import {
  reconcileProviderCall,
  reserveProviderCall,
} from "../../lib/sales/targets/providers/policyStore";
import { executeControlledProviderCall } from "../../lib/sales/targets/providers/execution";
import { markProviderRateLimited, resetProviderHealth } from "../../lib/sales/targets/providers/health";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const suffix = Date.now().toString(36);
  process.env.SALES_TARGET_MAX_CONCURRENCY = "2";
  process.env.SALES_TARGET_PROVIDER_MAX_CONCURRENCY = "2";
  process.env.SALES_TARGET_GLOBAL_REQUESTS_PER_DAY = "1000";
  process.env.SALES_TARGET_PROVIDER_REQUESTS_PER_DAY = "1000";
  process.env.SALES_TARGET_DAILY_BUDGET_CENTS = "100000";
  process.env.SALES_TARGET_PROVIDER_DAILY_BUDGET_CENTS = "10";
  await sql`
    UPDATE sales_target_provider_call_reservations
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE provider LIKE 'control_%' AND status = 'reserved'
  `;

  const concurrencyProvider = `control_concurrency_${suffix}`;
  const first = await reserveProviderCall({
    provider: concurrencyProvider,
    endpoint: "test",
    idempotencyKey: `${suffix}:concurrency:1`,
    estimatedCostCents: 1,
  });
  const repeated = await reserveProviderCall({
    provider: concurrencyProvider,
    endpoint: "test",
    idempotencyKey: `${suffix}:concurrency:1`,
    estimatedCostCents: 1,
  });
  assert(repeated.id === first.id, "active retry must reuse reservation");
  const second = await reserveProviderCall({
    provider: concurrencyProvider,
    endpoint: "test",
    idempotencyKey: `${suffix}:concurrency:2`,
    estimatedCostCents: 1,
  });
  await expectRejected(
    reserveProviderCall({
      provider: concurrencyProvider,
      endpoint: "test",
      idempotencyKey: `${suffix}:concurrency:3`,
      estimatedCostCents: 1,
    }),
    "provider concurrency boundary",
  );
  await reconcileProviderCall({
    reservation: first,
    actualCostCents: 1,
    success: true,
    outcome: { test: true },
  });
  await reconcileProviderCall({
    reservation: second,
    actualCostCents: 0,
    success: false,
    errorCode: "TEST_FAILURE",
  });

  const budgetProvider = `control_budget_${suffix}`;
  const budgetRace = await Promise.allSettled(
    Array.from({ length: 3 }, (_, index) =>
      reserveProviderCall({
        provider: budgetProvider,
        endpoint: "test",
        idempotencyKey: `${suffix}:budget:${index}`,
        estimatedCostCents: 6,
      }),
    ),
  );
  assert(
    budgetRace.filter((result) => result.status === "fulfilled").length === 1,
    "atomic provider cost boundary must admit exactly one racing request",
  );
  const admitted = budgetRace.find(
    (result): result is PromiseFulfilledResult<Awaited<ReturnType<typeof reserveProviderCall>>> =>
      result.status === "fulfilled",
  );
  if (!admitted) throw new Error("budget race admitted no request");
  await reconcileProviderCall({
    reservation: admitted.value,
    actualCostCents: 6,
    success: true,
  });

  process.env.SALES_TARGET_PROVIDER_DAILY_BUDGET_CENTS = "100000";
  process.env.SALES_TARGET_PROVIDER_MAX_CONCURRENCY = "10";
  process.env.SALES_TARGET_MAX_CONCURRENCY = "10";
  process.env.SALES_TARGET_PROVIDER_REQUESTS_PER_DAY = "2";
  const requestQuotaProvider = `control_requests_${suffix}`;
  for (let index = 0; index < 2; index++) {
    await executeControlledProviderCall({
      provider: requestQuotaProvider,
      endpoint: "test-request-quota",
      idempotencyKey: `${suffix}:request-quota:${index}`,
      estimatedCostCents: 0,
      operation: async () => true,
      describe: () => ({ success: true, responseStatus: 200 }),
    });
  }
  await expectRejected(
    executeControlledProviderCall({
      provider: requestQuotaProvider,
      endpoint: "test-request-quota",
      idempotencyKey: `${suffix}:request-quota:2`,
      estimatedCostCents: 0,
      operation: async () => true,
      describe: () => ({ success: true, responseStatus: 200 }),
    }),
    "provider daily request boundary",
  );

  process.env.SALES_TARGET_PROVIDER_REQUESTS_PER_DAY = "1000";
  const globalUsage = await sql<{ used: number }[]>`
    SELECT
      (SELECT COUNT(*) FROM sales_target_provider_requests WHERE created_at >= date_trunc('day', NOW()))
      + (SELECT COUNT(*) FROM sales_target_provider_call_reservations
         WHERE status = 'reserved' AND expires_at > NOW()) AS used
  `;
  process.env.SALES_TARGET_GLOBAL_REQUESTS_PER_DAY = String(Number(globalUsage[0]?.used ?? 0) + 2);
  for (let index = 0; index < 2; index++) {
    await executeControlledProviderCall({
      provider: `control_global_request_${suffix}_${index}`,
      endpoint: "test-global-request-quota",
      idempotencyKey: `${suffix}:global-request:${index}`,
      estimatedCostCents: 0,
      operation: async () => true,
      describe: () => ({ success: true, responseStatus: 200 }),
    });
  }
  await expectRejected(
    executeControlledProviderCall({
      provider: `control_global_request_${suffix}_2`,
      endpoint: "test-global-request-quota",
      idempotencyKey: `${suffix}:global-request:2`,
      estimatedCostCents: 0,
      operation: async () => true,
      describe: () => ({ success: true, responseStatus: 200 }),
    }),
    "global daily request boundary",
  );
  process.env.SALES_TARGET_GLOBAL_REQUESTS_PER_DAY = "1000";

  await sql`
    UPDATE sales_target_provider_call_reservations
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE provider LIKE 'control_global_cost_%' AND status = 'reserved'
  `;
  await sql`
    UPDATE sales_target_provider_budgets
    SET limit_cents = spent_cents + 100000
    WHERE provider = '*' AND scope_kind = 'day'
      AND period_start <= NOW() AND period_end > NOW()
  `;
  const globalCostFirst = await reserveProviderCall({
    provider: `control_global_cost_${suffix}_1`,
    endpoint: "test-global-cost",
    idempotencyKey: `${suffix}:global-cost:1`,
    estimatedCostCents: 60_000,
  });
  await expectRejected(
    reserveProviderCall({
      provider: `control_global_cost_${suffix}_2`,
      endpoint: "test-global-cost",
      idempotencyKey: `${suffix}:global-cost:2`,
      estimatedCostCents: 60_000,
    }),
    "global daily cost boundary",
  );
  await reconcileProviderCall({
    reservation: globalCostFirst,
    actualCostCents: 0,
    success: false,
    errorCode: "TEST_RELEASE",
  });

  const timeoutProvider = `control_timeout_${suffix}`;
  await expectRejected(
    executeControlledProviderCall({
      provider: timeoutProvider,
      endpoint: "test-timeout",
      idempotencyKey: `${suffix}:timeout`,
      estimatedCostCents: 0,
      operation: async () => {
        throw new DOMException("provider timed out", "TimeoutError");
      },
      describe: () => ({ success: true }),
    }),
    "failed operation",
  );
  const timeoutRows = await sql<{ status: string; error_code: string; request_count: number }[]>`
    SELECT reservation.status, reservation.error_code,
      (SELECT COUNT(*)::int FROM sales_target_provider_requests request
       WHERE request.provider = ${timeoutProvider}) AS request_count
    FROM sales_target_provider_call_reservations reservation
    WHERE reservation.idempotency_key = ${`${suffix}:timeout`}
  `;
  assert(
    timeoutRows[0]?.status === "released" &&
      timeoutRows[0]?.error_code === "PROVIDER_TIMEOUT" &&
      Number(timeoutRows[0]?.request_count) === 1,
    "timeout must release reservation and persist typed request outcome",
  );

  const circuitProvider = `control_circuit_${suffix}`;
  markProviderRateLimited(circuitProvider, "test circuit");
  let operationCalled = false;
  await expectRejected(
    executeControlledProviderCall({
      provider: circuitProvider,
      endpoint: "test-circuit",
      idempotencyKey: `${suffix}:circuit`,
      estimatedCostCents: 0,
      operation: async () => {
        operationCalled = true;
        return true;
      },
      describe: () => ({ success: true }),
    }),
    "open circuit",
  );
  assert(!operationCalled, "open circuit must block before network operation");
  resetProviderHealth(circuitProvider);

  const expiryProvider = `control_expiry_${suffix}`;
  const expired = await reserveProviderCall({
    provider: expiryProvider,
    endpoint: "test-expiry",
    idempotencyKey: `${suffix}:expiry:1`,
    estimatedCostCents: 4,
    leaseMs: 5_000,
  });
  await sql`
    UPDATE sales_target_provider_call_reservations
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE id = ${expired.id}
  `;
  const replacement = await reserveProviderCall({
    provider: expiryProvider,
    endpoint: "test-expiry",
    idempotencyKey: `${suffix}:expiry:2`,
    estimatedCostCents: 4,
  });
  const expiryRows = await sql<{ expired_status: string; reserved_cents: number }[]>`
    SELECT old.status AS expired_status, budget.reserved_cents
    FROM sales_target_provider_call_reservations old
    JOIN sales_target_provider_budgets budget ON budget.id = old.provider_budget_id
    WHERE old.id = ${expired.id}
  `;
  assert(
    expiryRows[0]?.expired_status === "expired" && Number(expiryRows[0]?.reserved_cents) === 4,
    "expired reservation must release old amount before replacement",
  );
  await reconcileProviderCall({
    reservation: replacement,
    actualCostCents: 0,
    success: false,
    errorCode: "TEST_RELEASE",
  });

  console.log(JSON.stringify({
    concurrencyBoundary: "PASS",
    budgetRace: { admitted: 1, rejected: 2 },
    providerDailyRequestLimit: "PASS",
    globalDailyRequestLimit: "PASS",
    globalDailyCostLimit: "PASS",
    failedCallReconciled: "PASS",
    circuitOpenBlocked: "PASS",
    expiryRecovery: "PASS",
    retryIdempotency: "PASS",
  }));
  await sql.end({ timeout: 5 });
}

async function expectRejected(promise: Promise<unknown>, label: string): Promise<void> {
  try {
    await promise;
  } catch {
    return;
  }
  throw new Error(`${label} unexpectedly succeeded`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
