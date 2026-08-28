import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getRun, reviewRun, type RunStatus } from "@/lib/sales/ai/runStore";
import { logActivity } from "@/lib/sales/activitiesStore";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const run = await getRun(id);
  if (!run) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ run });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.ai.execute");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  const status = body?.status as RunStatus | undefined;
  if (!status || !["APPROVED", "REJECTED", "SUPERSEDED", "REVIEW_REQUIRED"].includes(status)) {
    return NextResponse.json({ error: "invalid_status" }, { status: 400 });
  }
  try {
    const run = await reviewRun(id, gate.auth.userId, status, body?.note);
    if (run.entityId) {
      await logActivity({
        entityType: (run.entityType === "lead_query" ? "company" : run.entityType) as "company" | "opportunity" | "contact" | "proposal",
        entityId: run.entityId,
        kind: "ai_run_reviewed",
        summary: `AI-Run ${status}`,
        payload: { runId: run.id, note: body?.note ?? null },
        actorId: gate.auth.userId,
        actorEmail: gate.auth.email,
      });
    }
    return NextResponse.json({ run });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "review_failed" }, { status: 500 });
  }
}
