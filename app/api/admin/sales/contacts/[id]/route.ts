import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { serviceDeleteContact, serviceUpdateContact } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  try {
    const contact = await serviceUpdateContact(gate.auth, id, body);
    return NextResponse.json({ contact });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  await serviceDeleteContact(gate.auth, id);
  return NextResponse.json({ ok: true });
}
