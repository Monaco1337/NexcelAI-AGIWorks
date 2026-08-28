/**
 * Einzel-Firma: lesen, aktualisieren, weich löschen.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getCompany, softDeleteCompany } from "@/lib/sales/companiesStore";
import { listContacts } from "@/lib/sales/contactsStore";
import { listOpportunities } from "@/lib/sales/opportunitiesStore";
import { listActivitiesForCompany } from "@/lib/sales/activitiesStore";
import { serviceUpdateCompany } from "@/lib/sales/service";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const company = await getCompany(id);
  if (!company) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [contacts, oppRes, activities] = await Promise.all([
    listContacts(id),
    listOpportunities({ companyId: id, limit: 200 }),
    listActivitiesForCompany(id, 200),
  ]);
  return NextResponse.json({
    company,
    contacts,
    opportunities: oppRes.opportunities,
    activities,
  });
}

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
  if (typeof body?.version !== "number") {
    return NextResponse.json({ error: "version_required" }, { status: 400 });
  }
  try {
    const company = await serviceUpdateCompany(gate.auth, id, body);
    return NextResponse.json({ company });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: error.status });
    }
    console.error("[SALES] Firma aktualisieren fehlgeschlagen:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  await softDeleteCompany(id);
  return NextResponse.json({ ok: true });
}
