import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import { newTargetId } from "../model";
import { appendMetricEvent, createMetricEvent } from "../metrics/store";
import type { QualificationDecision } from "./engine";

export async function isTargetQualified(targetId: string): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;
  const rows = await sql<{ decision: string }[]>`
    SELECT decision
    FROM sales_target_qualification_decisions
    WHERE target_id = ${targetId}
    ORDER BY decided_at DESC
    LIMIT 1
  `;
  return rows[0]?.decision === "QUALIFIED";
}

export async function persistQualificationDecision(input: {
  targetId: string;
  decision: QualificationDecision;
  leadScoreId?: string | null;
  ruleConfigVersionId?: string | null;
  scoringConfigVersionId?: string | null;
  evidence?: unknown[];
  correlationId?: string | null;
  actorId?: string | null;
}): Promise<string> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const previous = await sql<{ id: string }[]>`
    SELECT id
    FROM sales_target_qualification_decisions
    WHERE target_id = ${input.targetId}
    ORDER BY decided_at DESC
    LIMIT 1
  `;
  const id = newTargetId("qual");
  const storedDecision = {
    QUALIFIED: "QUALIFIED",
    REJECTED: "DISQUALIFIED",
    REVIEW: "REVIEW_REQUIRED",
    UNKNOWN: "DEFERRED",
  }[input.decision.state];
  await sql`
    INSERT INTO sales_target_qualification_decisions (
      id, target_id, supersedes_decision_id, lead_score_id,
      rule_config_version_id, scoring_config_version_id, qualification_type,
      decision, reason_codes, rationale, evidence, threshold_snapshot,
      decision_source, decided_by, decided_at, correlation_id, provenance
    ) VALUES (
      ${id}, ${input.targetId}, ${previous[0]?.id ?? null}, ${input.leadScoreId ?? null},
      ${input.ruleConfigVersionId ?? null}, ${input.scoringConfigVersionId ?? null},
      'sales_readiness', ${storedDecision}, ${input.decision.reasons},
      ${sql.json(jsonParam({ state: input.decision.state }))},
      ${sql.json(jsonParam(input.evidence ?? []))},
      ${sql.json(jsonParam({ policyVersion: input.decision.policyVersion }))},
      'qualification-engine', ${input.actorId ?? null}, ${input.decision.decidedAt},
      ${input.correlationId ?? null},
      ${sql.json(jsonParam({ policyVersion: input.decision.policyVersion }))}
    )
  `;

  if (input.decision.state === "QUALIFIED") {
    const milestoneId = newTargetId("mile");
    const sourceEventId = `target:${input.targetId}:FIRST_QUALIFIED`;
    const milestoneRows = await sql<{ id: string }[]>`
      INSERT INTO sales_target_milestone_events (
        id, target_id, qualification_decision_id, milestone_key, source_system,
        source_event_id, occurred_at, actor_id, dimensions, values,
        correlation_id, provenance
      ) VALUES (
        ${milestoneId}, ${input.targetId}, ${id}, 'FIRST_QUALIFIED',
        'revenue_intelligence', ${sourceEventId}, ${input.decision.decidedAt},
        ${input.actorId ?? null},
        ${sql.json(jsonParam({ policyVersion: input.decision.policyVersion }))},
        ${sql.json(jsonParam({ count: 1 }))}, ${input.correlationId ?? null},
        ${sql.json(jsonParam({ decisionId: id }))}
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;
    if (milestoneRows[0]) {
      await appendMetricEvent(createMetricEvent({
        idempotencyKey: sourceEventId,
        eventType: "FIRST_QUALIFIED",
        occurredAt: input.decision.decidedAt,
        targetId: input.targetId,
        correlationId: input.correlationId,
        dimensions: { policyVersion: input.decision.policyVersion },
        value: 1,
      }));
    }
  } else if (input.decision.state === "REJECTED") {
    await appendMetricEvent(createMetricEvent({
      idempotencyKey: `qualification:${id}:REJECTED`,
      eventType: "REJECTED",
      occurredAt: input.decision.decidedAt,
      targetId: input.targetId,
      correlationId: input.correlationId,
      dimensions: {
        policyVersion: input.decision.policyVersion,
        reason: input.decision.reasons.join(","),
      },
      value: 1,
    }));
  }
  return id;
}

