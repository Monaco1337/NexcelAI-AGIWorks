/**
 * Manueller Entity-Merge (Phase 29).
 *
 * POST /api/admin/sales/targets/merge
 *   body: { primaryId, duplicateId }
 *
 * Verbindet zwei Zielkunden zu einem: `duplicateId` wird gelöscht
 * (soft-delete), seine Sources/Contacts/Activities werden an
 * `primaryId` referenziert. Die Aktion ist auditierbar (Activity-Log)
 * und rückgängig machbar (soft-delete + Merge-History).
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { findTargetById, recordActivity } from "@/lib/sales/targets/store";
import { toTargetError, TargetError } from "@/lib/sales/targets/errors";
import { actorFrom } from "@/lib/audit/auditLog";
import { mergeCanonicalTargets } from "@/lib/sales/targets/resolution/mergeService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  try {
    const body = (await request.json()) as { primaryId?: string; duplicateId?: string };
    const primaryId = body.primaryId?.trim();
    const duplicateId = body.duplicateId?.trim();
    if (!primaryId || !duplicateId || primaryId === duplicateId) {
      throw new TargetError("VALIDATION_FAILED", "primaryId und duplicateId erforderlich und verschieden");
    }
    const [primary, duplicate] = await Promise.all([
      findTargetById(primaryId),
      findTargetById(duplicateId),
    ]);
    if (!primary || !duplicate) throw new TargetError("NOT_FOUND", "Einer der Datensätze existiert nicht");
    const merge = await mergeCanonicalTargets({
      primaryId,
      duplicateId,
      actorId: gate.auth.userId,
      auditActor: actorFrom(gate.auth),
    });

    await recordActivity({
      targetId: primaryId,
      kind: "merged_in",
      summary: `Duplikat „${duplicate.name}" fusioniert`,
      payload: { duplicateId },
      actorId: gate.auth.userId,
      actorEmail: gate.auth.user?.email ?? null,
    });

    return NextResponse.json({
      ok: true,
      primaryId,
      mergedFrom: duplicateId,
      mergeLedgerId: merge.ledgerId,
    });
  } catch (error) {
    const err = toTargetError(error);
    return NextResponse.json(err.toJson(), { status: err.httpStatus });
  }
}
