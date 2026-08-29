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
import { db } from "@/lib/pg";
import { authorize } from "@/lib/auth/authorize";
import { findTargetById, recordActivity } from "@/lib/sales/targets/store";
import { toTargetError, TargetError } from "@/lib/sales/targets/errors";
import { actorFrom, writeAuditTx } from "@/lib/audit/auditLog";

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
    const sql = await db();
    if (!sql) throw new TargetError("DB_UNAVAILABLE");

    await sql.begin(async (tx) => {
      await tx`UPDATE sales_target_sources SET target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      await tx`UPDATE sales_target_contacts SET target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      await tx`UPDATE sales_target_decision_makers SET target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      await tx`UPDATE sales_target_website_audits SET target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      await tx`UPDATE sales_target_opportunities SET target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      await tx`UPDATE sales_target_financial_signals SET target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      await tx`UPDATE sales_target_activities SET target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      // Lead-Scores und Sales-Briefs bleiben pro Version geschützt.
      // Wir markieren die vom Duplikat auf is_current = FALSE.
      await tx`UPDATE sales_target_lead_scores SET is_current = FALSE, target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      await tx`UPDATE sales_target_sales_briefs SET is_current = FALSE, target_id = ${primaryId} WHERE target_id = ${duplicateId}`;
      // Duplikat soft-deleten und Merge-Referenz sichern.
      await tx`
        UPDATE sales_target_companies
        SET deleted_at = NOW(),
            review_flags = review_flags || jsonb_build_object(
              'merged_into', ${primaryId}::text,
              'merged_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
              'merged_by', ${gate.auth.userId ?? "unknown"}::text
            )
        WHERE id = ${duplicateId}
      `;
      await writeAuditTx(tx, {
        actor: actorFrom(gate.auth),
        action: "sales_target.merge",
        entityType: "sales_target_company",
        entityId: primaryId,
        before: { duplicateId, duplicateName: duplicate.name },
        after: { primaryId, primaryName: primary.name },
      });
    });

    await recordActivity({
      targetId: primaryId,
      kind: "merged_in",
      summary: `Duplikat „${duplicate.name}" fusioniert`,
      payload: { duplicateId },
      actorId: gate.auth.userId,
      actorEmail: gate.auth.user?.email ?? null,
    });

    return NextResponse.json({ ok: true, primaryId, mergedFrom: duplicateId });
  } catch (error) {
    const err = toTargetError(error);
    return NextResponse.json(err.toJson(), { status: err.httpStatus });
  }
}
