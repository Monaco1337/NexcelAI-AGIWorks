import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getOpportunity } from "@/lib/sales/opportunitiesStore";
import { listNotes } from "@/lib/sales/notesStore";
import { listObjections } from "@/lib/sales/objectionsStore";
import { getLatestSolution } from "@/lib/sales/solutionsStore";
import { listProposalsForOpportunity } from "@/lib/sales/proposalsStore";
import { listActivitiesForEntity } from "@/lib/sales/activitiesStore";
import { serviceUpdateOpportunity } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [notes, objections, solution, proposals, activities] = await Promise.all([
    listNotes("opportunity", id),
    listObjections(id),
    getLatestSolution(id),
    listProposalsForOpportunity(id),
    listActivitiesForEntity("opportunity", id, 200),
  ]);
  return NextResponse.json({
    opportunity,
    notes,
    objections,
    solution,
    proposals,
    activities,
  });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (typeof body?.version !== "number") {
    return NextResponse.json({ error: "version_required" }, { status: 400 });
  }
  try {
    const opportunity = await serviceUpdateOpportunity(gate.auth, id, body);
    return NextResponse.json({ opportunity });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
