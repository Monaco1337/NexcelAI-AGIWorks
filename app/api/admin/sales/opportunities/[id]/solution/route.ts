/**
 * Solution Scope einer Opportunity.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getLatestSolution } from "@/lib/sales/solutionsStore";
import { serviceUpsertSolution } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const solution = await getLatestSolution(id);
  return NextResponse.json({ solution });
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const solution = await serviceUpsertSolution(gate.auth, {
      opportunityId: id,
      structured: body.structured,
      challengeMode: body.challengeMode,
      qualityGate: body.qualityGate,
      qualityGateNote: body.qualityGateNote,
      runId: body.runId,
    });
    return NextResponse.json({ solution });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "upsert_failed" }, { status: 500 });
  }
}
