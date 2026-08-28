import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listObjections } from "@/lib/sales/objectionsStore";
import { serviceCreateObjection } from "@/lib/sales/service";
import { SalesError, type ObjectionType } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const objections = await listObjections(id);
  return NextResponse.json({ objections });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  if (!body?.type || !body?.body) {
    return NextResponse.json({ error: "type_and_body_required" }, { status: 400 });
  }
  try {
    const objection = await serviceCreateObjection(gate.auth, {
      opportunityId: id,
      type: body.type as ObjectionType,
      body: body.body,
    });
    return NextResponse.json({ objection }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
