import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { db } from "@/lib/pg";
import {
  configureRollout,
  getRolloutComparison,
  getRolloutOutcomeComparison,
  rollbackRollout,
  type RolloutKind,
} from "@/lib/sales/targets/rollout/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KINDS = new Set<RolloutKind>(["provider", "qualification", "scoring", "opportunity"]);

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const kind = request.nextUrl.searchParams.get("kind") as RolloutKind | null;
  const configKey = request.nextUrl.searchParams.get("configKey");
  if (kind && configKey && KINDS.has(kind)) {
    return NextResponse.json({
      kind,
      configKey,
      assignments: await getRolloutComparison(kind, configKey),
      outcomes: await getRolloutOutcomeComparison(kind, configKey),
    });
  }
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "db_unavailable" }, { status: 503 });
  const [providers, rules, scoring] = await Promise.all([
    sql<Record<string, unknown>[]>`
      SELECT provider AS config_key, enabled, state, baseline_config_id,
             canary_config_id, rollout_percentage, updated_at
      FROM sales_target_provider_config_state ORDER BY provider
    `,
    sql<Record<string, unknown>[]>`
      SELECT config_key, enabled, baseline_version_id, canary_version_id,
             rollout_percentage, updated_at
      FROM sales_target_rule_config_state ORDER BY config_key
    `,
    sql<Record<string, unknown>[]>`
      SELECT config_key, enabled, baseline_version_id, canary_version_id,
             rollout_percentage, updated_at
      FROM sales_target_scoring_config_state ORDER BY config_key
    `,
  ]);
  return NextResponse.json({ providers, rules, scoring });
}

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const kind = body?.kind as RolloutKind | undefined;
  const configKey = text(body?.configKey);
  const baselineVersionId = text(body?.baselineVersionId);
  const canaryVersionId = body?.canaryVersionId === null ? null : text(body?.canaryVersionId);
  const rolloutPercentage = Number(body?.rolloutPercentage);
  if (
    !kind || !KINDS.has(kind) || !configKey || !baselineVersionId ||
    !Number.isInteger(rolloutPercentage) || rolloutPercentage < 0 || rolloutPercentage > 100
  ) {
    return NextResponse.json({ error: "invalid_rollout" }, { status: 400 });
  }
  await configureRollout({
    kind,
    configKey,
    baselineVersionId,
    canaryVersionId,
    rolloutPercentage,
  });
  return NextResponse.json({ ok: true, kind, configKey, rolloutPercentage });
}

export async function DELETE(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const kind = body?.kind as RolloutKind | undefined;
  const configKey = text(body?.configKey);
  if (!kind || !KINDS.has(kind) || !configKey) {
    return NextResponse.json({ error: "invalid_rollout" }, { status: 400 });
  }
  await rollbackRollout(kind, configKey);
  return NextResponse.json({ ok: true, kind, configKey, rolledBack: true });
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}
