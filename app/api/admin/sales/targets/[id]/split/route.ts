/**
 * Manuelles Split-Undo (Phase 29).
 *
 * POST /api/admin/sales/targets/[id]/split
 *   body: { restoreDuplicateId }
 *
 * Macht einen früheren Merge rückgängig: der als Duplikat gekennzeichnete
 * Datensatz wird reaktiviert. Wir übertragen NICHT automatisch alle
 * Kontakte zurück — das wäre in fast allen Fällen falsch. Stattdessen
 * verlangen wir vom User eine manuelle Trennung im Review-UI.
 */

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/pg";
import { authorize } from "@/lib/auth/authorize";
import { findTargetById, recordActivity } from "@/lib/sales/targets/store";
import { toTargetError, TargetError } from "@/lib/sales/targets/errors";
import { actorFrom, writeAuditTx } from "@/lib/audit/auditLog";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  try {
    const { id: primaryId } = await ctx.params;
    const body = (await request.json()) as { restoreDuplicateId?: string };
    const restoreId = body.restoreDuplicateId?.trim();
    if (!restoreId) throw new TargetError("VALIDATION_FAILED", "restoreDuplicateId erforderlich");
    const sql = await db();
    if (!sql) throw new TargetError("DB_UNAVAILABLE");
    const primary = await findTargetById(primaryId);
    if (!primary) throw new TargetError("NOT_FOUND");

    await sql.begin(async (tx) => {
      await tx`
        UPDATE sales_target_companies
        SET deleted_at = NULL,
            review_flags = review_flags || jsonb_build_object(
              'split_restored_from', ${primaryId}::text,
              'split_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
              'split_by', ${gate.auth.userId ?? "unknown"}::text
            )
        WHERE id = ${restoreId}
      `;
      await writeAuditTx(tx, {
        actor: actorFrom(gate.auth),
        action: "sales_target.split",
        entityType: "sales_target_company",
        entityId: restoreId,
        before: { primaryId },
        after: { restoredId: restoreId },
      });
    });

    await recordActivity({
      targetId: primaryId,
      kind: "split_restored",
      summary: `Duplikat ${restoreId} wieder aktiviert (manueller Split)`,
      actorId: gate.auth.userId,
      actorEmail: gate.auth.user?.email ?? null,
    });

    return NextResponse.json({ ok: true, restored: restoreId });
  } catch (error) {
    const err = toTargetError(error);
    return NextResponse.json(err.toJson(), { status: err.httpStatus });
  }
}
