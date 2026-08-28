import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { serviceMarkOpportunityLost } from "@/lib/sales/service";
import { SalesError, type LostReason } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  if (typeof body?.version !== "number") {
    return NextResponse.json({ error: "version_required" }, { status: 400 });
  }
  if (!body.reason) {
    return NextResponse.json({ error: "reason_required" }, { status: 400 });
  }
  try {
    const opportunity = await serviceMarkOpportunityLost(
      gate.auth,
      id,
      body.version,
      body.reason as LostReason,
      body.notes ?? "",
      body.learning
    );
    return NextResponse.json({ opportunity });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "lost_failed" }, { status: 500 });
  }
}
