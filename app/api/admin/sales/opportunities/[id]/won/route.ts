import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { serviceMarkOpportunityWon } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";
import { recordAttributedOutcome } from "@/lib/sales/targets/feedback/service";
import { newCorrelationId } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  if (typeof body?.version !== "number") {
    return NextResponse.json({ error: "version_required" }, { status: 400 });
  }
  try {
    const opportunity = await serviceMarkOpportunityWon(
      gate.auth,
      id,
      body.version,
      body.learning
    );
    await recordAttributedOutcome({
      eventType: "OPPORTUNITY_WON",
      salesOpportunityId: id,
      correlationId: newCorrelationId("opportunity-won"),
    });
    return NextResponse.json({ opportunity });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "won_failed" }, { status: 500 });
  }
}
