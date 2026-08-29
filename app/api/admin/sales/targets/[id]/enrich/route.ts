/**
 * Enrichment für einen Zielkunden anstoßen.
 *
 * POST /api/admin/sales/targets/[id]/enrich
 *   body: { phases?: EnrichmentPhase[] } — Standard: alle Phasen synchron
 *
 * Wir führen die Phasen synchron im Request aus (kein separater Worker
 * nötig). Für lange Aufrufe kann der Client `phases: ["website_audit"]`
 * übergeben und einzelne Phasen selektiv triggern.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import {
  findTargetById,
  recordActivity,
} from "@/lib/sales/targets/store";
import {
  processEnrichmentPhase,
  runFullEnrichment,
} from "@/lib/sales/targets/pipeline";
import type { EnrichmentPhase } from "@/lib/sales/targets/model";
import { newCorrelationId, toTargetError } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const target = await findTargetById(id);
  if (!target) return NextResponse.json({ error: "NOT_FOUND", message: "Zielkunde nicht gefunden" }, { status: 404 });

  const correlationId = newCorrelationId("enrich");
  let body: { phases?: EnrichmentPhase[]; force?: boolean } = {};
  try {
    body = (await request.json()) as { phases?: EnrichmentPhase[]; force?: boolean };
  } catch {
    /* ok — leer akzeptiert */
  }

  try {
    if (!body.phases || body.phases.length === 0) {
      const outcomes = await runFullEnrichment(target, {
        force: Boolean(body.force),
        correlationId,
      });
      await recordActivity({
        targetId: id,
        kind: "enrichment_full",
        summary: `Vollständige Analyse ausgeführt (${outcomes.filter((o) => o.success).length}/${outcomes.length} Phasen)`,
        actorId: gate.auth.userId,
        actorEmail: gate.auth.user?.email ?? null,
        payload: { correlationId, force: Boolean(body.force) },
      });
      return NextResponse.json({ outcomes, correlationId });
    }
    const outcomes = [];
    for (const phase of body.phases) {
      const fresh = await findTargetById(id);
      if (!fresh) break;
      outcomes.push(await processEnrichmentPhase(fresh, phase));
    }
    return NextResponse.json({ outcomes, correlationId });
  } catch (error) {
    const targetErr = toTargetError(error, "SCORING_FAILED");
    // eslint-disable-next-line no-console
    console.error(`[TARGETS][${correlationId}] enrich failed`, targetErr.toJson());
    return NextResponse.json(
      { ...targetErr.toJson(), correlationId },
      { status: targetErr.httpStatus }
    );
  }
}
