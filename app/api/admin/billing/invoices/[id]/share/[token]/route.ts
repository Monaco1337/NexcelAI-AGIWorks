/**
 * Einzelnen Share-Token widerrufen.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { revokeShareToken } from "@/lib/billing/shareStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string; token: string }> }) {
  const gate = await authorize("billing.send");
  if (!gate.ok) return gate.response;
  const { token } = await ctx.params;
  const revoked = await revokeShareToken(token, actorFrom(gate.auth));
  if (!revoked) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
