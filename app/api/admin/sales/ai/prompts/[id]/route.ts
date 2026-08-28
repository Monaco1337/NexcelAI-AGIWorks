import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { togglePromptActive } from "@/lib/sales/ai/promptStore";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.prompt.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  if (typeof body?.isActive !== "boolean") {
    return NextResponse.json({ error: "isActive_required" }, { status: 400 });
  }
  await togglePromptActive(id, body.isActive);
  return NextResponse.json({ ok: true });
}
