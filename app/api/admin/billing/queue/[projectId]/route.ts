/**
 * Rechnungsprofil eines einzelnen Projektes lesen und aktualisieren.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  getBillingConfig,
  upsertBillingConfig,
  type UpdateBillingConfigInput,
} from "@/lib/billing/projectBillingStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { projectId } = await ctx.params;
  const config = await getBillingConfig(projectId);
  if (!config) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ config });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { projectId } = await ctx.params;
  let body: UpdateBillingConfigInput;
  try {
    body = (await request.json()) as UpdateBillingConfigInput;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const config = await upsertBillingConfig(projectId, body, actorFrom(gate.auth), await requestMeta());
  return NextResponse.json({ config });
}
