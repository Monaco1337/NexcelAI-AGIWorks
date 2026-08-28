import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import {
  getProposal,
  listProposalVersions,
  softDeleteProposal,
  updateProposalHead,
} from "@/lib/sales/proposalsStore";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const [proposal, versions] = await Promise.all([
    getProposal(id),
    listProposalVersions(id),
  ]);
  if (!proposal) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ proposal, versions });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const body = await request.json().catch(() => ({}));
  if (typeof body?.version !== "number") {
    return NextResponse.json({ error: "version_required" }, { status: 400 });
  }
  try {
    const proposal = await updateProposalHead(id, { ...body, updatedBy: gate.auth.userId });
    return NextResponse.json({ proposal });
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
  await softDeleteProposal(id);
  return NextResponse.json({ ok: true });
}
