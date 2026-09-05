import { createHash } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";

export type RolloutKind = "provider" | "qualification" | "scoring" | "opportunity";

export interface RolloutSelection {
  kind: RolloutKind;
  configKey: string;
  eligibleKey: string;
  cohort: "baseline" | "canary";
  selectedVersionId: string | null;
  baselineVersionId: string | null;
  canaryVersionId: string | null;
  rolloutPercentage: number;
}

export async function selectRolloutVersion(
  kind: RolloutKind,
  configKey: string,
  eligibleKey: string,
): Promise<RolloutSelection> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const state = kind === "provider"
    ? await sql<Record<string, unknown>[]>`
        SELECT COALESCE(baseline_config_id, current_config_id) AS baseline_id,
               canary_config_id AS canary_id, rollout_percentage
        FROM sales_target_provider_config_state WHERE provider = ${configKey}
      `
    : kind === "scoring"
      ? await sql<Record<string, unknown>[]>`
          SELECT COALESCE(baseline_version_id, current_version_id) AS baseline_id,
                 canary_version_id AS canary_id, rollout_percentage
          FROM sales_target_scoring_config_state WHERE config_key = ${configKey}
        `
      : await sql<Record<string, unknown>[]>`
          SELECT COALESCE(baseline_version_id, current_version_id) AS baseline_id,
                 canary_version_id AS canary_id, rollout_percentage
          FROM sales_target_rule_config_state WHERE config_key = ${configKey}
        `;
  const baselineVersionId = (state[0]?.baseline_id as string | null) ?? null;
  const canaryVersionId = (state[0]?.canary_id as string | null) ?? null;
  const rolloutPercentage = Math.max(0, Math.min(100, Number(state[0]?.rollout_percentage ?? 0)));
  const cohort = canaryVersionId && rolloutPercentage > 0 && bucket(eligibleKey) < rolloutPercentage
    ? "canary"
    : "baseline";
  const selectedVersionId = cohort === "canary" ? canaryVersionId : baselineVersionId;
  const selection: RolloutSelection = {
    kind,
    configKey,
    eligibleKey,
    cohort,
    selectedVersionId,
    baselineVersionId,
    canaryVersionId,
    rolloutPercentage,
  };
  await sql`
    INSERT INTO sales_target_rollout_assignments (
      id, rollout_kind, config_key, eligible_key, cohort, selected_version_id,
      baseline_version_id, canary_version_id, rollout_percentage, provenance
    ) VALUES (
      ${`rollout_${createHash("sha256").update(`${kind}:${configKey}:${eligibleKey}`).digest("hex").slice(0, 20)}`},
      ${kind}, ${configKey}, ${eligibleKey}, ${cohort}, ${selectedVersionId},
      ${baselineVersionId}, ${canaryVersionId}, ${rolloutPercentage},
      ${sql.json(jsonParam({ algorithm: "sha256-mod-100", version: "v1" }))}
    )
    ON CONFLICT (rollout_kind, config_key, eligible_key) DO UPDATE SET
      cohort = EXCLUDED.cohort,
      selected_version_id = EXCLUDED.selected_version_id,
      baseline_version_id = EXCLUDED.baseline_version_id,
      canary_version_id = EXCLUDED.canary_version_id,
      rollout_percentage = EXCLUDED.rollout_percentage,
      assigned_at = NOW(),
      provenance = EXCLUDED.provenance
  `;
  return selection;
}

export async function configureRollout(input: {
  kind: RolloutKind;
  configKey: string;
  baselineVersionId: string;
  canaryVersionId: string | null;
  rolloutPercentage: number;
}): Promise<void> {
  const percentage = Math.max(0, Math.min(100, Math.floor(input.rolloutPercentage)));
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const versionIds = [input.baselineVersionId, input.canaryVersionId].filter(
    (value): value is string => Boolean(value),
  );
  const owned = input.kind === "provider"
    ? await sql<{ id: string }[]>`
        SELECT id FROM sales_target_provider_configs
        WHERE provider = ${input.configKey} AND id = ANY(${versionIds})
      `
    : input.kind === "scoring"
      ? await sql<{ id: string }[]>`
          SELECT id FROM sales_target_scoring_config_versions
          WHERE config_key = ${input.configKey} AND id = ANY(${versionIds})
        `
      : await sql<{ id: string }[]>`
          SELECT id FROM sales_target_rule_config_versions
          WHERE config_key = ${input.configKey} AND id = ANY(${versionIds})
        `;
  if (owned.length !== new Set(versionIds).size) {
    throw new TargetError("VALIDATION_FAILED", "Rollout-Version gehört nicht zur Konfiguration");
  }
  if (input.kind === "provider") {
    await sql`
      UPDATE sales_target_provider_config_state
      SET baseline_config_id = ${input.baselineVersionId},
          canary_config_id = ${input.canaryVersionId},
          rollout_percentage = ${input.canaryVersionId ? percentage : 0},
          version = version + 1,
          updated_at = NOW()
      WHERE provider = ${input.configKey}
    `;
  } else if (input.kind === "scoring") {
    await sql`
      UPDATE sales_target_scoring_config_state
      SET baseline_version_id = ${input.baselineVersionId},
          canary_version_id = ${input.canaryVersionId},
          rollout_percentage = ${input.canaryVersionId ? percentage : 0},
          version = version + 1,
          updated_at = NOW()
      WHERE config_key = ${input.configKey}
    `;
  } else {
    await sql`
      UPDATE sales_target_rule_config_state
      SET baseline_version_id = ${input.baselineVersionId},
          canary_version_id = ${input.canaryVersionId},
          rollout_percentage = ${input.canaryVersionId ? percentage : 0},
          version = version + 1,
          updated_at = NOW()
      WHERE config_key = ${input.configKey}
    `;
  }
}

export async function rollbackRollout(kind: RolloutKind, configKey: string): Promise<void> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const table = kind === "provider"
    ? "sales_target_provider_config_state"
    : kind === "scoring"
      ? "sales_target_scoring_config_state"
      : "sales_target_rule_config_state";
  const keyColumn = kind === "provider" ? "provider" : "config_key";
  await sql.unsafe(
    `UPDATE ${table}
     SET canary_${kind === "provider" ? "config" : "version"}_id = NULL,
         rollout_percentage = 0,
         version = version + 1,
         updated_at = NOW()
     WHERE ${keyColumn} = $1`,
    [configKey],
  );
}

export async function getRolloutComparison(kind: RolloutKind, configKey: string) {
  const sql = await db();
  if (!sql) return [];
  return sql<Record<string, unknown>[]>`
    SELECT cohort,
      COUNT(*)::int AS assignments,
      MIN(assigned_at) AS first_assigned_at,
      MAX(assigned_at) AS last_assigned_at,
      COUNT(DISTINCT selected_version_id)::int AS selected_versions
    FROM sales_target_rollout_assignments
    WHERE rollout_kind = ${kind} AND config_key = ${configKey}
    GROUP BY cohort
    ORDER BY cohort
  `;
}

export async function getRolloutOutcomeComparison(
  kind: RolloutKind,
  configKey: string,
  windowHours = 168,
) {
  const sql = await db();
  if (!sql) return [];
  const hours = Math.max(1, Math.min(24 * 30, Math.floor(windowHours)));
  if (kind === "provider") {
    return sql<Record<string, unknown>[]>`
      SELECT usage.provider_config_id AS version_id,
        COUNT(*)::int AS sample_count,
        COUNT(*) FILTER (
          WHERE request.error IS NULL
            AND (request.response_status IS NULL OR request.response_status BETWEEN 200 AND 299)
        )::int AS successful,
        AVG(request.latency_ms) FILTER (WHERE request.latency_ms IS NOT NULL) AS average_latency_ms,
        COALESCE(SUM(
          CASE WHEN usage.provider_metadata->>'rawYield' ~ '^[0-9]+([.][0-9]+)?$'
            THEN (usage.provider_metadata->>'rawYield')::numeric ELSE 0 END
        ), 0) AS yield,
        COALESCE(SUM(usage.actual_cost_cents), 0)::bigint AS actual_cost_cents
      FROM sales_target_provider_usage_ledger usage
      LEFT JOIN sales_target_provider_requests request
        ON request.id = usage.provider_request_id
      WHERE usage.provider = ${configKey}
        AND usage.provider_config_id IS NOT NULL
        AND usage.occurred_at >= NOW() - (${hours} * INTERVAL '1 hour')
      GROUP BY usage.provider_config_id
      ORDER BY usage.provider_config_id
    `;
  }
  if (kind === "qualification") {
    return sql<Record<string, unknown>[]>`
      SELECT rule_config_version_id AS version_id,
        COUNT(*)::int AS sample_count,
        COUNT(*) FILTER (WHERE decision = 'QUALIFIED')::int AS successful,
        AVG(score) FILTER (WHERE score IS NOT NULL) AS average_score
      FROM sales_target_qualification_decisions
      WHERE rule_config_version_id IS NOT NULL
        AND rule_config_version_id IN (
          SELECT id FROM sales_target_rule_config_versions WHERE config_key = ${configKey}
        )
        AND decided_at >= NOW() - (${hours} * INTERVAL '1 hour')
      GROUP BY rule_config_version_id
      ORDER BY rule_config_version_id
    `;
  }
  if (kind === "scoring") {
    return sql<Record<string, unknown>[]>`
      SELECT scoring_config_version_id AS version_id,
        COUNT(*)::int AS sample_count,
        COUNT(*) FILTER (WHERE decision = 'QUALIFIED')::int AS successful,
        AVG(score) FILTER (WHERE score IS NOT NULL) AS average_score
      FROM sales_target_qualification_decisions
      WHERE scoring_config_version_id IS NOT NULL
        AND scoring_config_version_id IN (
          SELECT id FROM sales_target_scoring_config_versions WHERE config_key = ${configKey}
        )
        AND decided_at >= NOW() - (${hours} * INTERVAL '1 hour')
      GROUP BY scoring_config_version_id
      ORDER BY scoring_config_version_id
    `;
  }
  return sql<Record<string, unknown>[]>`
    SELECT rule_config_version_id AS version_id,
      COUNT(*)::int AS sample_count,
      AVG(opportunity_score) AS average_score,
      COALESCE(SUM(estimated_recommended_cents), 0)::bigint AS estimated_value_cents
    FROM sales_target_opportunities
    WHERE rule_config_version_id IS NOT NULL
      AND rule_config_version_id IN (
        SELECT id FROM sales_target_rule_config_versions WHERE config_key = ${configKey}
      )
      AND detected_at >= NOW() - (${hours} * INTERVAL '1 hour')
    GROUP BY rule_config_version_id
    ORDER BY rule_config_version_id
  `;
}

export async function loadSelectedRuleDefinition(
  kind: "qualification" | "opportunity",
  configKey: string,
  eligibleKey: string,
): Promise<{ selection: RolloutSelection; definition: Record<string, unknown> | null }> {
  const selection = await selectRolloutVersion(kind, configKey, eligibleKey);
  if (!selection.selectedVersionId) return { selection, definition: null };
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const rows = await sql<{ definition: Record<string, unknown> }[]>`
    SELECT definition
    FROM sales_target_rule_config_versions
    WHERE id = ${selection.selectedVersionId}
    LIMIT 1
  `;
  return { selection, definition: rows[0]?.definition ?? null };
}

export async function loadSelectedScoringDefinition(
  configKey: string,
  eligibleKey: string,
): Promise<{
  selection: RolloutSelection;
  definition: {
    weights: Record<string, number>;
    thresholds: Record<string, number>;
    valueTiers: Record<string, unknown>;
    scoreVersion: string;
  } | null;
}> {
  const selection = await selectRolloutVersion("scoring", configKey, eligibleKey);
  if (!selection.selectedVersionId) return { selection, definition: null };
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const rows = await sql<Record<string, unknown>[]>`
    SELECT weights, thresholds, value_tiers, score_version
    FROM sales_target_scoring_config_versions
    WHERE id = ${selection.selectedVersionId}
    LIMIT 1
  `;
  if (!rows[0]) return { selection, definition: null };
  return {
    selection,
    definition: {
      weights: rows[0].weights as Record<string, number>,
      thresholds: rows[0].thresholds as Record<string, number>,
      valueTiers: rows[0].value_tiers as Record<string, unknown>,
      scoreVersion: String(rows[0].score_version),
    },
  };
}

function bucket(eligibleKey: string): number {
  const prefix = createHash("sha256").update(eligibleKey).digest("hex").slice(0, 8);
  return Number.parseInt(prefix, 16) % 100;
}
