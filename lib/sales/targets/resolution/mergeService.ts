import type postgres from "postgres";
import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import { writeAuditTx, type AuditActor } from "@/lib/audit/auditLog";

const MOVED_TABLES = [
  "sales_target_sources",
  "sales_target_contacts",
  "sales_target_decision_makers",
  "sales_target_website_audits",
  "sales_target_opportunities",
  "sales_target_financial_signals",
  "sales_target_activities",
  "sales_target_lead_scores",
  "sales_target_sales_briefs",
] as const;

type MovedTable = typeof MOVED_TABLES[number];
type MovedReferences = Record<MovedTable, string[]> & {
  currentLeadScoreIds: string[];
  currentSalesBriefIds: string[];
};

export async function mergeCanonicalTargets(input: {
  primaryId: string;
  duplicateId: string;
  actorId?: string | null;
  auditActor?: AuditActor;
}): Promise<{ ledgerId: string; movedReferences: MovedReferences }> {
  if (!input.primaryId || !input.duplicateId || input.primaryId === input.duplicateId) {
    throw new TargetError("VALIDATION_FAILED", "Primär- und Duplikat-ID müssen verschieden sein");
  }
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  return sql.begin(async (tx) => {
    const targets = await tx<{ id: string; name: string; deleted_at: Date | null }[]>`
      SELECT id, name, deleted_at
      FROM sales_target_companies
      WHERE id = ANY(${[input.primaryId, input.duplicateId]})
      ORDER BY id
      FOR UPDATE
    `;
    if (targets.length !== 2 || targets.some((target) => target.deleted_at !== null)) {
      throw new TargetError("NOT_FOUND", "Primärziel oder Duplikat ist nicht aktiv");
    }
    const activeMerge = await tx<{ id: string }[]>`
      SELECT merge.id
      FROM sales_target_merge_ledger merge
      WHERE merge.operation = 'MERGE'
        AND merge.source_target_id = ${input.duplicateId}
        AND NOT EXISTS (
          SELECT 1 FROM sales_target_merge_ledger reversal
          WHERE reversal.operation = 'UNMERGE' AND reversal.reverses_ledger_id = merge.id
        )
      LIMIT 1
    `;
    if (activeMerge[0]) {
      throw new TargetError("VERSION_CONFLICT", "Duplikat besitzt bereits einen aktiven Merge");
    }
    const movedReferences = {
      ...Object.fromEntries(MOVED_TABLES.map((table) => [table, [] as string[]])),
      currentLeadScoreIds: [],
      currentSalesBriefIds: [],
    } as unknown as MovedReferences;
    for (const table of MOVED_TABLES) {
      const rows = await tx.unsafe<{ id: string }[]>(
        `SELECT id FROM ${table} WHERE target_id = $1 ORDER BY id`,
        [input.duplicateId],
      );
      movedReferences[table] = rows.map((row) => row.id);
    }
    const [currentScores, currentBriefs] = await Promise.all([
      tx<{ id: string }[]>`
        SELECT id FROM sales_target_lead_scores
        WHERE target_id = ${input.duplicateId} AND is_current = TRUE
      `,
      tx<{ id: string }[]>`
        SELECT id FROM sales_target_sales_briefs
        WHERE target_id = ${input.duplicateId} AND is_current = TRUE
      `,
    ]);
    movedReferences.currentLeadScoreIds = currentScores.map((row) => row.id);
    movedReferences.currentSalesBriefIds = currentBriefs.map((row) => row.id);
    await tx`
      UPDATE sales_target_lead_scores
      SET is_current = FALSE
      WHERE target_id = ${input.duplicateId}
    `;
    await tx`
      UPDATE sales_target_sales_briefs
      SET is_current = FALSE
      WHERE target_id = ${input.duplicateId}
    `;
    for (const table of MOVED_TABLES) {
      await moveReferences(tx, table, movedReferences[table], input.duplicateId, input.primaryId);
    }
    await tx`
      UPDATE sales_target_companies
      SET deleted_at = NOW(),
          review_flags = review_flags || jsonb_build_object(
            'merged_into', ${input.primaryId}::text,
            'merged_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
            'merged_by', ${input.actorId ?? "unknown"}::text
          )
      WHERE id = ${input.duplicateId}
    `;
    const ledgerId = `merge_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    await tx`
      INSERT INTO sales_target_merge_ledger (
        id, operation, source_target_id, destination_target_id,
        source_snapshot, destination_snapshot, moved_relations,
        reason, policy_key, policy_version, actor_id, correlation_id, provenance
      ) VALUES (
        ${ledgerId}, 'MERGE', ${input.duplicateId}, ${input.primaryId},
        ${tx.json(jsonParam(targets.find((target) => target.id === input.duplicateId) ?? {}))},
        ${tx.json(jsonParam(targets.find((target) => target.id === input.primaryId) ?? {}))},
        ${tx.json(jsonParam(movedReferences))},
        'Manual reviewed canonical merge', 'manual-review', 'v1',
        ${input.actorId ?? null}, ${ledgerId},
        ${tx.json(jsonParam({ mechanism: "manual-review", reversible: true }))}
      )
    `;
    if (input.auditActor) {
      const primary = targets.find((target) => target.id === input.primaryId);
      const duplicate = targets.find((target) => target.id === input.duplicateId);
      await writeAuditTx(tx, {
        actor: input.auditActor,
        action: "sales_target.merge",
        entityType: "sales_target_company",
        entityId: input.primaryId,
        before: { duplicateId: input.duplicateId, duplicateName: duplicate?.name },
        after: { primaryId: input.primaryId, primaryName: primary?.name, ledgerId },
      });
    }
    return { ledgerId, movedReferences };
  });
}

export async function splitCanonicalTargets(input: {
  primaryId: string;
  duplicateId: string;
  actorId?: string | null;
  auditActor?: AuditActor;
}): Promise<{ ledgerId: string; restoredReferences: MovedReferences }> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  return sql.begin(async (tx) => {
    const ledgers = await tx<{ id: string; moved_relations: MovedReferences }[]>`
      SELECT merge.id, merge.moved_relations
      FROM sales_target_merge_ledger merge
      WHERE merge.operation = 'MERGE'
        AND merge.destination_target_id = ${input.primaryId}
        AND merge.source_target_id = ${input.duplicateId}
        AND NOT EXISTS (
          SELECT 1 FROM sales_target_merge_ledger reversal
          WHERE reversal.operation = 'UNMERGE' AND reversal.reverses_ledger_id = merge.id
        )
      ORDER BY merge.occurred_at DESC
      LIMIT 1
      FOR UPDATE
    `;
    const ledger = ledgers[0];
    if (!ledger) {
      throw new TargetError("VALIDATION_FAILED", "Kein aktiver Merge für dieses Zielpaar");
    }
    const restoredReferences = normalizeMovedReferences(ledger.moved_relations);
    for (const table of MOVED_TABLES) {
      await moveReferences(
        tx,
        table,
        restoredReferences[table],
        input.primaryId,
        input.duplicateId,
      );
    }
    if (restoredReferences.currentLeadScoreIds.length > 0) {
      await tx`
        UPDATE sales_target_lead_scores SET is_current = TRUE
        WHERE target_id = ${input.duplicateId}
          AND id = ANY(${restoredReferences.currentLeadScoreIds})
      `;
    }
    if (restoredReferences.currentSalesBriefIds.length > 0) {
      await tx`
        UPDATE sales_target_sales_briefs SET is_current = TRUE
        WHERE target_id = ${input.duplicateId}
          AND id = ANY(${restoredReferences.currentSalesBriefIds})
      `;
    }
    const restored = await tx<{ id: string }[]>`
      UPDATE sales_target_companies
      SET deleted_at = NULL,
          review_flags = review_flags
            - 'merged_into' - 'merged_at' - 'merged_by'
            || jsonb_build_object(
              'split_restored_from', ${input.primaryId}::text,
              'split_at', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
              'split_by', ${input.actorId ?? "unknown"}::text
            )
      WHERE id = ${input.duplicateId}
        AND deleted_at IS NOT NULL
        AND review_flags->>'merged_into' = ${input.primaryId}
      RETURNING id
    `;
    if (!restored[0]) {
      throw new TargetError("VERSION_CONFLICT", "Merge-Zustand wurde zwischenzeitlich verändert");
    }
    const reversalId = `unmerge_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
    await tx`
      INSERT INTO sales_target_merge_ledger (
        id, operation, source_target_id, destination_target_id,
        reverses_ledger_id, moved_relations, reason, policy_key,
        policy_version, actor_id, correlation_id, provenance
      ) VALUES (
        ${reversalId}, 'UNMERGE', ${input.duplicateId}, ${input.primaryId},
        ${ledger.id}, ${tx.json(jsonParam(restoredReferences))},
        'Manual reviewed canonical split', 'manual-review', 'v1',
        ${input.actorId ?? null}, ${reversalId},
        ${tx.json(jsonParam({ mechanism: "manual-review", restoredFrom: ledger.id }))}
      )
    `;
    if (input.auditActor) {
      await writeAuditTx(tx, {
        actor: input.auditActor,
        action: "sales_target.split",
        entityType: "sales_target_company",
        entityId: input.duplicateId,
        before: { primaryId: input.primaryId, ledgerId: ledger.id },
        after: { restoredId: input.duplicateId },
      });
    }
    return { ledgerId: reversalId, restoredReferences };
  });
}

async function moveReferences(
  tx: postgres.TransactionSql,
  table: MovedTable,
  ids: string[],
  fromTargetId: string,
  toTargetId: string,
): Promise<void> {
  if (ids.length === 0) return;
  await tx.unsafe(
    `UPDATE ${table}
     SET target_id = $1
     WHERE target_id = $2 AND id = ANY($3::text[])`,
    [toTargetId, fromTargetId, ids],
  );
}

function normalizeMovedReferences(value: MovedReferences | null): MovedReferences {
  const source = value && typeof value === "object" ? value : {} as MovedReferences;
  return {
    ...Object.fromEntries(
    MOVED_TABLES.map((table) => [
      table,
      Array.isArray(source[table])
        ? source[table].filter((id): id is string => typeof id === "string")
        : [],
    ]),
    ),
    currentLeadScoreIds: Array.isArray(source.currentLeadScoreIds)
      ? source.currentLeadScoreIds.filter((id): id is string => typeof id === "string")
      : [],
    currentSalesBriefIds: Array.isArray(source.currentSalesBriefIds)
      ? source.currentSalesBriefIds.filter((id): id is string => typeof id === "string")
      : [],
  } as MovedReferences;
}
