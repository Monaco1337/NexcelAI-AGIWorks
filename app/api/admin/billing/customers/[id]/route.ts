/**
 * Einzelner Rechnungskunde.
 *
 * GET   /api/admin/billing/customers/[id]
 * PATCH /api/admin/billing/customers/[id]  — Name, Adresse, Kontakt, USt-ID
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { getCustomer, updateCustomer, type CustomerInput } from "@/lib/billing/customersStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  try {
    const customer = await getCustomer(id);
    if (!customer) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (error) {
    console.error("[BILLING] Kunde laden fehlgeschlagen:", error);
    return NextResponse.json({ error: "load_failed" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  let body: Partial<CustomerInput>;
  try {
    body = (await request.json()) as Partial<CustomerInput>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  try {
    const customer = await updateCustomer(id, body, actorFrom(gate.auth), await requestMeta());
    if (!customer) return NextResponse.json({ error: "not_found" }, { status: 404 });
    return NextResponse.json({ customer });
  } catch (error) {
    const message = error instanceof Error ? error.message : "update_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
