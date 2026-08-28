import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listOpportunities } from "@/lib/sales/opportunitiesStore";
import { serviceCreateOpportunity } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const result = await listOpportunities({ companyId: id, limit: 200 });
  return NextResponse.json(result);
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
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
    const opportunity = await serviceCreateOpportunity(gate.auth, { ...body, companyId: id });
    return NextResponse.json({ opportunity }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
