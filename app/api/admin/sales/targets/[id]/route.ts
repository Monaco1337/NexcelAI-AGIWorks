/**
 * Zielkunden-Detail.
 *
 * GET /api/admin/sales/targets/[id]
 *   Liefert Firma + Kontakte + Entscheider + Opportunities + neuestes Audit
 *   + Financial-Signals + aktuelle LeadScore + aktueller Sales Brief + Activities.
 *
 * PATCH /api/admin/sales/targets/[id]
 *   Manuelle Korrekturen (Do-Not-Contact-Marker, Basisdaten überschreiben).
 *
 * DELETE /api/admin/sales/targets/[id]
 *   Soft-Delete.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import {
  findTargetById,
  listContacts,
  listDecisionMakers,
  listOpportunities,
  listSources,
  listActivities,
  listFinancialSignals,
  getCurrentLeadScore,
  getCurrentSalesBrief,
  getLatestAudit,
  updateTarget,
  softDeleteTarget,
  recordActivity,
  type UpdateTargetPatch,
} from "@/lib/sales/targets/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  const target = await findTargetById(id);
  if (!target) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const [contacts, decisionMakers, opportunities, sources, audit, signals, leadScore, salesBrief, activities] = await Promise.all([
    listContacts(id),
    listDecisionMakers(id),
    listOpportunities(id),
    listSources(id),
    getLatestAudit(id),
    listFinancialSignals(id),
    getCurrentLeadScore(id),
    getCurrentSalesBrief(id),
    listActivities(id, 30),
  ]);

  return NextResponse.json({
    target,
    contacts,
    decisionMakers,
    opportunities,
    sources,
    latestAudit: audit,
    financialSignals: signals,
    leadScore,
    salesBrief,
    activities,
  });
}

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  let body: UpdateTargetPatch;
  try {
    body = (await request.json()) as UpdateTargetPatch;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const target = await updateTarget(id, { ...body, updatedBy: gate.auth.userId });
    await recordActivity({
      targetId: id,
      kind: "target_updated",
      summary: "Firmenakte manuell bearbeitet",
      payload: { fields: Object.keys(body) },
      actorId: gate.auth.userId,
      actorEmail: gate.auth.user?.email ?? null,
    });
    return NextResponse.json({ target });
  } catch (error) {
    console.error("[TARGETS] update failed:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  await softDeleteTarget(id);
  return NextResponse.json({ ok: true });
}
