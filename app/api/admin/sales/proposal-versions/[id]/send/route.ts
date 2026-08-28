import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { serviceMarkProposalSent } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function POST(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.proposal.send");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  try {
    const result = await serviceMarkProposalSent(gate.auth, id);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "send_failed" }, { status: 500 });
  }
}
