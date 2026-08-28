import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listProposalsForOpportunity } from "@/lib/sales/proposalsStore";
import { serviceCreateProposal } from "@/lib/sales/service";
import { SalesError, type BrandContext } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const proposals = await listProposalsForOpportunity(id);
  return NextResponse.json({ proposals });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  if (!body?.title || !body?.brandContext) {
    return NextResponse.json({ error: "title_and_brand_required" }, { status: 400 });
  }
  try {
    const proposal = await serviceCreateProposal(gate.auth, {
      opportunityId: id,
      title: body.title,
      brandContext: body.brandContext as BrandContext,
      customerSnapshot: body.customerSnapshot,
      validUntil: body.validUntil,
    });
    return NextResponse.json({ proposal }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
