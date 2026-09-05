import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { db } from "@/lib/pg";
import {
  allProviderHealth,
  hydrateProviderHealth,
  resetProviderHealth,
} from "@/lib/sales/targets/providers/health";
import { providerStatus } from "@/lib/sales/targets/providers/registry";
import { getOperationalKpis } from "@/lib/sales/targets/metrics/operational";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  await hydrateProviderHealth();
  const sql = await db();
  const [states, metrics] = await Promise.all([
    sql
    ? await sql<Record<string, unknown>[]>`
        SELECT provider, enabled, state, disabled_reason, current_config_id,
               version, updated_at
        FROM sales_target_provider_config_state
        ORDER BY provider
      `
    : [],
    getOperationalKpis(24),
  ]);
  return NextResponse.json({
    registry: providerStatus(),
    health: allProviderHealth(),
    evidence: metrics.provider,
    states,
  });
}

export async function PATCH(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => null) as {
    provider?: unknown;
    state?: unknown;
    reason?: unknown;
    resetHealth?: unknown;
  } | null;
  const provider = typeof body?.provider === "string" ? body.provider.trim() : "";
  const state = body?.state;
  if (!provider || !["active", "paused", "disabled", "testing"].includes(String(state))) {
    return NextResponse.json({ error: "invalid_provider_state" }, { status: 400 });
  }
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  await sql`
    INSERT INTO sales_target_provider_config_state (
      provider, enabled, state, disabled_reason, updated_by
    ) VALUES (
      ${provider}, ${state !== "disabled"}, ${String(state)},
      ${typeof body?.reason === "string" ? body.reason.slice(0, 500) : null},
      ${gate.auth.userId}
    )
    ON CONFLICT (provider) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      state = EXCLUDED.state,
      disabled_reason = EXCLUDED.disabled_reason,
      version = sales_target_provider_config_state.version + 1,
      updated_by = EXCLUDED.updated_by,
      updated_at = NOW()
  `;
  if (body?.resetHealth === true) resetProviderHealth(provider);
  return NextResponse.json({ ok: true, provider, state });
}

