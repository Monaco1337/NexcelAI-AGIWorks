import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { completeFollowup } from "@/lib/sales/proposalsStore";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  try {
    const followup = await completeFollowup(id, gate.auth.userId, body?.note);
    return NextResponse.json({ followup });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "complete_failed" }, { status: 500 });
  }
}
