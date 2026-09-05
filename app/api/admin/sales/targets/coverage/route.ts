import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { findScope, NRW_SCOPE } from "@/lib/sales/targets/catalog/scope";
import {
  ensureCoveragePartitions,
  listCoveragePartitions,
} from "@/lib/sales/targets/coverage/store";
import { allocatePartitions, shouldMarkExhausted } from "@/lib/sales/targets/coverage/planner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const scopeKey = request.nextUrl.searchParams.get("scope") ?? NRW_SCOPE.key;
  const partitions = await listCoveragePartitions(scopeKey);
  const suggested = allocatePartitions(partitions, {
    limit: clamp(request.nextUrl.searchParams.get("limit"), 20, 1, 100),
  });
  return NextResponse.json({
    scopeKey,
    partitions,
    suggested,
    exhaustedCandidates: partitions.filter(shouldMarkExhausted).map((item) => item.id),
  });
}

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const body = await request.json().catch(() => ({})) as { scope?: unknown };
  const scopeKey = typeof body.scope === "string" ? body.scope : NRW_SCOPE.key;
  const scope = findScope(scopeKey);
  if (!scope) return NextResponse.json({ error: "unknown_scope" }, { status: 400 });
  const inserted = await ensureCoveragePartitions(scope);
  return NextResponse.json({ scopeKey, inserted, total: (await listCoveragePartitions(scopeKey)).length });
}

function clamp(raw: string | null, fallback: number, min: number, max: number): number {
  const value = Number.parseInt(raw ?? "", 10);
  return Math.max(min, Math.min(max, Number.isFinite(value) ? value : fallback));
}

