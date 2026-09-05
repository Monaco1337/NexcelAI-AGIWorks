import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import type postgres from "postgres";
import { selectRolloutVersion } from "../rollout/store";

export interface ProviderPolicy {
  provider: string;
  enabled: boolean;
  state: "active" | "paused" | "disabled" | "testing";
  configId: string | null;
  version: number | null;
  capabilities: unknown[];
  config: Record<string, unknown>;
  pricing: Record<string, unknown>;
  quota: Record<string, unknown>;
}

export async function getProviderPolicy(
  provider: string,
  eligibleKey?: string | null,
): Promise<ProviderPolicy | null> {
  const sql = await db();
  if (!sql) return null;
  const states = await sql<Record<string, unknown>[]>`
    SELECT provider, enabled, state, current_config_id
    FROM sales_target_provider_config_state
    WHERE provider = ${provider}
    LIMIT 1
  `;
  if (!states[0]) return null;
  const selection = eligibleKey
    ? await selectRolloutVersion("provider", provider, eligibleKey)
    : null;
  const configId = selection?.selectedVersionId ??
    (states[0].current_config_id as string | null) ??
    null;
  const configs = configId
    ? await sql<Record<string, unknown>[]>`
        SELECT version, capabilities, config, pricing, quota
        FROM sales_target_provider_configs
        WHERE id = ${configId}
        LIMIT 1
      `
    : [];
  const config = configs[0] ?? {};
  return {
    provider: String(states[0].provider),
    enabled: Boolean(states[0].enabled),
    state: states[0].state as ProviderPolicy["state"],
    configId,
    version: config.version === null || config.version === undefined ? null : Number(config.version),
    capabilities: (config.capabilities as unknown[]) ?? [],
    config: (config.config as Record<string, unknown>) ?? {},
    pricing: (config.pricing as Record<string, unknown>) ?? {},
    quota: (config.quota as Record<string, unknown>) ?? {},
  };
}

export async function assertProviderPolicyAllowsCall(
  provider: string,
  eligibleKey?: string | null,
): Promise<ProviderPolicy | null> {
  const policy = await getProviderPolicy(provider, eligibleKey);
  // No persisted policy means legacy-enabled during the additive migration.
  if (!policy) return null;
  if (!policy.enabled || policy.state === "disabled" || policy.state === "paused") {
    throw new TargetError("PROVIDER_UNAVAILABLE", `Provider ${provider} ist ${policy.state}`);
  }
  return policy;
}

export async function estimateProviderCallCostCents(
  provider: string,
  maximumResults: number,
): Promise<number> {
  const policy = await getProviderPolicy(provider);
  const perRequest = Number(policy?.pricing.costCentsPerRequest);
  if (Number.isFinite(perRequest) && perRequest >= 0) return Math.ceil(perRequest);
  const perResult = Number(policy?.pricing.costCentsPerResult);
  if (Number.isFinite(perResult) && perResult >= 0) {
    return Math.ceil(perResult * Math.max(0, maximumResults));
  }
  // Conservative configured fallback for the only currently billed adapter.
  // This value is a reservation limit, never reported as observed spend.
  return provider === "google_places" ? Math.max(0, maximumResults) * 3 : 0;
}

export async function reserveProviderBudget(input: {
  provider: string;
  scopeKind: string;
  scopeKey: string;
  estimatedCostCents: number;
}): Promise<{ budgetId: string; reservedCents: number } | null> {
  const amount = Math.max(0, Math.ceil(input.estimatedCostCents));
  if (amount === 0) return null;
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const rows = await sql<{ id: string }[]>`
    UPDATE sales_target_provider_budgets
    SET reserved_cents = reserved_cents + ${amount},
        version = version + 1,
        updated_at = NOW()
    WHERE id = (
      SELECT id
      FROM sales_target_provider_budgets
      WHERE provider IN (${input.provider}, '*')
        AND scope_kind = ${input.scopeKind}
        AND scope_key = ${input.scopeKey}
        AND period_start <= NOW()
        AND period_end > NOW()
        AND (
          hard_limit = FALSE
          OR spent_cents + reserved_cents + ${amount} <= limit_cents
        )
      ORDER BY provider = ${input.provider} DESC
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    )
    RETURNING id
  `;
  if (!rows[0]) {
    throw new TargetError("PROVIDER_RATE_LIMITED", `Budget für ${input.provider}/${input.scopeKey} ausgeschöpft`);
  }
  return { budgetId: rows[0].id, reservedCents: amount };
}

export async function reconcileProviderBudget(input: {
  budgetId: string;
  provider: string;
  endpoint: string;
  reservedCents: number;
  actualCostCents: number;
  estimatedCostCents: number;
  providerRequestId?: string | null;
  providerConfigId?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const actual = Math.max(0, Math.ceil(input.actualCostCents));
  const reserved = Math.max(0, Math.ceil(input.reservedCents));
  await sql.begin(async (tx) => {
    await tx`
      UPDATE sales_target_provider_budgets
      SET reserved_cents = GREATEST(0, reserved_cents - ${reserved}),
          spent_cents = spent_cents + ${actual},
          version = version + 1,
          updated_at = NOW()
      WHERE id = ${input.budgetId}
    `;
    await tx`
      INSERT INTO sales_target_provider_usage_ledger (
        id, provider_request_id, provider_config_id, budget_id, provider,
        endpoint, usage_kind, estimated_cost_cents, actual_cost_cents,
        correlation_id, provider_metadata, provenance
      ) VALUES (
        ${`usage_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`},
        ${input.providerRequestId ?? null}, ${input.providerConfigId ?? null},
        ${input.budgetId}, ${input.provider}, ${input.endpoint}, 'request',
        ${Math.max(0, Math.ceil(input.estimatedCostCents))}, ${actual},
        ${input.correlationId ?? null}, ${tx.json(jsonParam(input.metadata ?? {}))},
        ${tx.json(jsonParam({ reservationCents: reserved }))}
      )
    `;
  });
}

export interface ProviderCallReservation {
  id: string;
  provider: string;
  providerConfigId: string | null;
  providerBudgetId: string;
  globalBudgetId: string;
  estimatedCostCents: number;
  expiresAt: string;
}

export async function reserveProviderCall(input: {
  provider: string;
  endpoint: string;
  idempotencyKey: string;
  estimatedCostCents: number;
  targetId?: string | null;
  searchJobId?: string | null;
  leaseMs?: number;
}): Promise<ProviderCallReservation> {
  const policy = await assertProviderPolicyAllowsCall(
    input.provider,
    input.searchJobId ?? input.targetId ?? input.idempotencyKey,
  );
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dayEnd = new Date(dayStart.getTime() + 86_400_000);
  const dayKey = dayStart.toISOString().slice(0, 10);
  const estimatedCostCents = Math.max(0, Math.ceil(input.estimatedCostCents));
  const providerRequestLimit = positiveSetting(
    policy?.quota.requestsPerDay,
    process.env.SALES_TARGET_PROVIDER_REQUESTS_PER_DAY,
    5_000,
  );
  const globalRequestLimit = positiveSetting(
    undefined,
    process.env.SALES_TARGET_GLOBAL_REQUESTS_PER_DAY,
    20_000,
  );
  const providerCostLimit = positiveSetting(
    policy?.quota.costCentsPerDay,
    process.env.SALES_TARGET_PROVIDER_DAILY_BUDGET_CENTS,
    positiveSetting(undefined, process.env.SALES_TARGET_DAILY_BUDGET_CENTS, 1_000_000_000),
  );
  const globalCostLimit = positiveSetting(
    undefined,
    process.env.SALES_TARGET_DAILY_BUDGET_CENTS,
    1_000_000_000,
  );
  const providerConcurrency = positiveSetting(
    policy?.quota.maxConcurrency,
    process.env.SALES_TARGET_PROVIDER_MAX_CONCURRENCY,
    2,
  );
  const globalConcurrency = positiveSetting(
    undefined,
    process.env.SALES_TARGET_MAX_CONCURRENCY,
    4,
  );
  const expiresAt = new Date(now.getTime() + Math.max(5_000, input.leaseMs ?? 120_000));

  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${"provider-call:global:" + dayKey}, 0))`;
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${"provider-call:" + input.provider + ":" + dayKey}, 0))`;

    const existing = await tx<Record<string, unknown>[]>`
      SELECT * FROM sales_target_provider_call_reservations
      WHERE idempotency_key = ${input.idempotencyKey}
      FOR UPDATE
    `;
    if (existing[0]) {
      if (existing[0].status !== "reserved" || new Date(String(existing[0].expires_at)) <= now) {
        throw new TargetError("VERSION_CONFLICT", "Provider-Aufruf wurde bereits abgeschlossen oder ist abgelaufen");
      }
      return mapReservation(existing[0]);
    }

    const expired = await tx<{
      provider_budget_id: string | null;
      global_budget_id: string | null;
      estimated_cost_cents: number;
    }[]>`
      UPDATE sales_target_provider_call_reservations
      SET status = 'expired', completed_at = NOW(), updated_at = NOW(),
          error_code = COALESCE(error_code, 'RESERVATION_EXPIRED')
      WHERE status = 'reserved' AND expires_at <= NOW()
      RETURNING provider_budget_id, global_budget_id, estimated_cost_cents
    `;
    for (const row of expired) {
      const budgetIds = [row.provider_budget_id, row.global_budget_id].filter(
        (value): value is string => Boolean(value),
      );
      if (budgetIds.length > 0) {
        await tx`
          UPDATE sales_target_provider_budgets
          SET reserved_cents = GREATEST(0, reserved_cents - ${Number(row.estimated_cost_cents)}),
              version = version + 1,
              updated_at = NOW()
          WHERE id = ANY(${budgetIds})
        `;
      }
    }

    const usage = await tx<Record<string, unknown>[]>`
      SELECT
        (SELECT COUNT(*) FROM sales_target_provider_requests
         WHERE created_at >= ${dayStart.toISOString()} AND created_at < ${dayEnd.toISOString()})
          + (SELECT COUNT(*) FROM sales_target_provider_call_reservations
             WHERE status = 'reserved' AND expires_at > NOW()) AS global_requests,
        (SELECT COUNT(*) FROM sales_target_provider_requests
         WHERE provider = ${input.provider}
           AND created_at >= ${dayStart.toISOString()} AND created_at < ${dayEnd.toISOString()})
          + (SELECT COUNT(*) FROM sales_target_provider_call_reservations
             WHERE provider = ${input.provider} AND status = 'reserved' AND expires_at > NOW())
          AS provider_requests,
        (SELECT COUNT(*) FROM sales_target_provider_call_reservations
         WHERE status = 'reserved' AND expires_at > NOW()) AS global_active,
        (SELECT COUNT(*) FROM sales_target_provider_call_reservations
         WHERE provider = ${input.provider} AND status = 'reserved' AND expires_at > NOW())
          AS provider_active
    `;
    const counters = usage[0] ?? {};
    if (Number(counters.global_requests ?? 0) >= globalRequestLimit) {
      throw new TargetError("PROVIDER_RATE_LIMITED", "Globales Provider-Tageslimit ausgeschöpft");
    }
    if (Number(counters.provider_requests ?? 0) >= providerRequestLimit) {
      throw new TargetError("PROVIDER_RATE_LIMITED", `Tageslimit für ${input.provider} ausgeschöpft`);
    }
    if (Number(counters.global_active ?? 0) >= globalConcurrency) {
      throw new TargetError("PROVIDER_RATE_LIMITED", "Globale Provider-Parallelität ausgeschöpft");
    }
    if (Number(counters.provider_active ?? 0) >= providerConcurrency) {
      throw new TargetError("PROVIDER_RATE_LIMITED", `Parallelität für ${input.provider} ausgeschöpft`);
    }
    await enforceQualifiedCostCeiling(tx, input.provider);

    const providerBudgetId = `pbudget_${input.provider}_${dayKey}`;
    const globalBudgetId = `pbudget_global_${dayKey}`;
    await tx`
      INSERT INTO sales_target_provider_budgets (
        id, provider, scope_kind, scope_key, period_start, period_end, limit_cents
      ) VALUES
        (${providerBudgetId}, ${input.provider}, 'day', ${dayKey},
         ${dayStart.toISOString()}, ${dayEnd.toISOString()}, ${providerCostLimit}),
        (${globalBudgetId}, '*', 'day', ${dayKey},
         ${dayStart.toISOString()}, ${dayEnd.toISOString()}, ${globalCostLimit})
      ON CONFLICT (provider, scope_kind, scope_key, period_start, period_end) DO NOTHING
    `;
    const budgets = await tx<{ id: string; limit_cents: number; reserved_cents: number; spent_cents: number }[]>`
      SELECT id, limit_cents, reserved_cents, spent_cents
      FROM sales_target_provider_budgets
      WHERE id = ANY(${[providerBudgetId, globalBudgetId]})
      ORDER BY id
      FOR UPDATE
    `;
    if (budgets.length !== 2 || budgets.some((row) =>
      Number(row.spent_cents) + Number(row.reserved_cents) + estimatedCostCents > Number(row.limit_cents)
    )) {
      throw new TargetError("PROVIDER_RATE_LIMITED", `Kostenbudget für ${input.provider} ausgeschöpft`);
    }
    await tx`
      UPDATE sales_target_provider_budgets
      SET reserved_cents = reserved_cents + ${estimatedCostCents},
          version = version + 1,
          updated_at = NOW()
      WHERE id = ANY(${[providerBudgetId, globalBudgetId]})
    `;
    const id = `pcall_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    const rows = await tx<Record<string, unknown>[]>`
      INSERT INTO sales_target_provider_call_reservations (
        id, idempotency_key, provider, provider_config_id,
        provider_budget_id, global_budget_id, target_id, search_job_id,
        endpoint, estimated_cost_cents, expires_at
      ) VALUES (
        ${id}, ${input.idempotencyKey}, ${input.provider}, ${policy?.configId ?? null},
        ${providerBudgetId}, ${globalBudgetId}, ${input.targetId ?? null},
        ${input.searchJobId ?? null}, ${input.endpoint}, ${estimatedCostCents},
        ${expiresAt.toISOString()}
      )
      RETURNING *
    `;
    return mapReservation(rows[0]);
  });
}

export async function reconcileProviderCall(input: {
  reservation: ProviderCallReservation;
  providerRequestId?: string | null;
  actualCostCents: number;
  success: boolean;
  errorCode?: string | null;
  outcome?: Record<string, unknown>;
}): Promise<void> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const actualCostCents = Math.max(0, Math.ceil(input.actualCostCents));
  await sql.begin(async (tx) => {
    const rows = await tx<{ status: string; estimated_cost_cents: number }[]>`
      SELECT status, estimated_cost_cents
      FROM sales_target_provider_call_reservations
      WHERE id = ${input.reservation.id}
      FOR UPDATE
    `;
    if (!rows[0] || rows[0].status !== "reserved") return;
    const reserved = Number(rows[0].estimated_cost_cents);
    await tx`
      UPDATE sales_target_provider_budgets
      SET reserved_cents = GREATEST(0, reserved_cents - ${reserved}),
          spent_cents = spent_cents + ${actualCostCents},
          version = version + 1,
          updated_at = NOW()
      WHERE id = ANY(${[input.reservation.providerBudgetId, input.reservation.globalBudgetId]})
    `;
    await tx`
      UPDATE sales_target_provider_call_reservations
      SET status = ${input.success ? "completed" : "released"},
          actual_cost_cents = ${actualCostCents},
          provider_request_id = ${input.providerRequestId ?? null},
          error_code = ${input.errorCode ?? null},
          outcome = ${tx.json(jsonParam(input.outcome ?? {}))},
          completed_at = NOW(),
          updated_at = NOW()
      WHERE id = ${input.reservation.id}
    `;
    await tx`
      INSERT INTO sales_target_provider_usage_ledger (
        id, provider_request_id, provider_config_id, budget_id, provider,
        endpoint, usage_kind, estimated_cost_cents, actual_cost_cents,
        provider_metadata, provenance
      ) VALUES (
        ${`usage_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`},
        ${input.providerRequestId ?? null}, ${input.reservation.providerConfigId},
        ${input.reservation.providerBudgetId}, ${input.reservation.provider},
        'provider-call', 'request', ${reserved}, ${actualCostCents},
        ${tx.json(jsonParam(input.outcome ?? {}))},
        ${tx.json(jsonParam({ reservationId: input.reservation.id }))}
      )
    `;
  });
}

async function enforceQualifiedCostCeiling(
  tx: postgres.TransactionSql,
  provider: string,
): Promise<void> {
  const ceiling = Number(process.env.SALES_TARGET_MAX_COST_PER_QUALIFIED_CENTS);
  if (!Number.isFinite(ceiling) || ceiling <= 0) return;
  const rows = await tx<{ qualified_count: number; cost_cents: number }[]>`
    SELECT
      COUNT(DISTINCT milestone.target_id)::int AS qualified_count,
      COALESCE(SUM(request.cost_cents), 0)::bigint AS cost_cents
    FROM sales_target_milestone_events milestone
    LEFT JOIN sales_target_provider_requests request
      ON request.target_id = milestone.target_id AND request.provider = ${provider}
    WHERE milestone.milestone_key = 'FIRST_QUALIFIED'
      AND milestone.occurred_at >= NOW() - INTERVAL '30 days'
  `;
  const qualified = Number(rows[0]?.qualified_count ?? 0);
  if (qualified >= 10 && Number(rows[0]?.cost_cents ?? 0) / qualified > ceiling) {
    throw new TargetError("PROVIDER_RATE_LIMITED", `Cost-per-qualified-Limit für ${provider} überschritten`);
  }
}

function positiveSetting(value: unknown, environment: string | undefined, fallback: number): number {
  const candidate = Number(value ?? environment);
  return Number.isFinite(candidate) && candidate >= 0 ? Math.floor(candidate) : fallback;
}

function mapReservation(row: Record<string, unknown>): ProviderCallReservation {
  return {
    id: String(row.id),
    provider: String(row.provider),
    providerConfigId: (row.provider_config_id as string | null) ?? null,
    providerBudgetId: String(row.provider_budget_id),
    globalBudgetId: String(row.global_budget_id),
    estimatedCostCents: Number(row.estimated_cost_cents ?? 0),
    expiresAt: row.expires_at instanceof Date
      ? row.expires_at.toISOString()
      : String(row.expires_at),
  };
}

