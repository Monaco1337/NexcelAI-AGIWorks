import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  getIssuer,
  peekNextInvoiceNumber,
  setSequenceBaseline,
  updateIssuer,
  type UpdateIssuerInput,
} from "@/lib/billing/issuersStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const issuer = await getIssuer(id);
  if (!issuer) return NextResponse.json({ error: "not_found" }, { status: 404 });
  const nextNumber = (await peekNextInvoiceNumber(id)).next;
  return NextResponse.json({ issuer, nextNumber });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  let body: UpdateIssuerInput & { sequenceBaseline?: number };
  try {
    body = (await request.json()) as UpdateIssuerInput & { sequenceBaseline?: number };
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const meta = await requestMeta();
    if (typeof body.sequenceBaseline === "number") {
      await setSequenceBaseline(id, body.sequenceBaseline, actorFrom(gate.auth), meta);
    }
    const issuer = await updateIssuer(id, body, actorFrom(gate.auth), meta);
    if (!issuer) return NextResponse.json({ error: "not_found" }, { status: 404 });
    const nextNumber = (await peekNextInvoiceNumber(id)).next;
    return NextResponse.json({ issuer, nextNumber });
  } catch (error) {
    const message = error instanceof Error ? error.message : "update_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
