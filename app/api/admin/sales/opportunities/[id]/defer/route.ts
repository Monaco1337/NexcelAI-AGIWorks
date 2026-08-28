import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { serviceMarkOpportunityDeferred } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";

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
    const opportunity = await serviceMarkOpportunityDeferred(
      gate.auth,
      id,
      body.version,
      body.reason ?? "",
      body.reviveAt ?? null
    );
    return NextResponse.json({ opportunity });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "defer_failed" }, { status: 500 });
  }
}
