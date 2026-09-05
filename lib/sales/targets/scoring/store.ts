import { createHash } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import { newTargetId, type ProjectValueTier, type ScoringWeights } from "../model";
import type { ScoreThresholds } from "./configVersions";

export async function getActiveScoringVersionId(configKey: string): Promise<string | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<{ current_version_id: string | null }[]>`
    SELECT current_version_id
    FROM sales_target_scoring_config_state
    WHERE config_key = ${configKey} AND enabled = TRUE
    LIMIT 1
  `;
  return rows[0]?.current_version_id ?? null;
}

export async function ensureScoringConfigVersion(input: {
  key: string;
  scoreVersion: string;
  weights: ScoringWeights;
  thresholds: ScoreThresholds;
  valueTiers: Record<string, ProjectValueTier>;
}): Promise<string> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const canonical = JSON.stringify({
    weights: input.weights,
    thresholds: input.thresholds,
    valueTiers: input.valueTiers,
    scoreVersion: input.scoreVersion,
  });
  const contentHash = createHash("sha256").update(canonical).digest("hex");
  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${"score-config:" + input.key}, 0))`;
    const active = await tx<{ id: string; content_hash: string }[]>`
      SELECT v.id, v.content_hash
      FROM sales_target_scoring_config_state s
      JOIN sales_target_scoring_config_versions v ON v.id = s.current_version_id
      WHERE s.config_key = ${input.key} AND s.enabled = TRUE
      LIMIT 1
    `;
    if (active[0]?.content_hash === contentHash) return active[0].id;

    const current = await tx<{ id: string; version: number }[]>`
      SELECT id, version
      FROM sales_target_scoring_config_versions
      WHERE config_key = ${input.key}
      ORDER BY version DESC
      LIMIT 1
    `;
    const id = newTargetId("scfg");
    const version = Number(current[0]?.version ?? 0) + 1;
    await tx`
      INSERT INTO sales_target_scoring_config_versions (
        id, config_key, version, supersedes_version_id, score_version,
        weights, thresholds, value_tiers, feature_contract, model_metadata,
        content_hash, effective_from, change_note, provenance
      ) VALUES (
        ${id}, ${input.key}, ${version}, ${current[0]?.id ?? null}, ${input.scoreVersion},
        ${tx.json(jsonParam(input.weights))}, ${tx.json(jsonParam(input.thresholds))},
        ${tx.json(jsonParam(input.valueTiers))},
        ${tx.json(jsonParam({ unknownPolicy: "EXCLUDE_AND_REWEIGHT" }))},
        ${tx.json(jsonParam({ engine: "deterministic" }))},
        ${contentHash}, NOW(), 'Automatically activated effective scoring configuration',
        ${tx.json(jsonParam({ source: "scoring-engine" }))}
      )
    `;
    await tx`
      INSERT INTO sales_target_scoring_config_state (
        config_key, current_version_id, baseline_version_id, enabled
      )
      VALUES (${input.key}, ${id}, ${id}, TRUE)
      ON CONFLICT (config_key) DO UPDATE SET
        current_version_id = EXCLUDED.current_version_id,
        baseline_version_id = COALESCE(
          sales_target_scoring_config_state.baseline_version_id,
          sales_target_scoring_config_state.current_version_id,
          EXCLUDED.current_version_id
        ),
        enabled = TRUE,
        version = sales_target_scoring_config_state.version + 1,
        updated_at = NOW()
    `;
    return id;
  });
}

export async function publishScoringConfigVersion(input: {
  key: string;
  scoreVersion: string;
  weights: ScoringWeights;
  thresholds: ScoreThresholds;
  valueTiers: Record<string, ProjectValueTier>;
  actorId?: string | null;
  changeNote?: string;
}): Promise<{ id: string; version: number }> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${"score-config:" + input.key}, 0))`;
    const current = await tx<{ id: string; version: number }[]>`
      SELECT id, version
      FROM sales_target_scoring_config_versions
      WHERE config_key = ${input.key}
      ORDER BY version DESC
      LIMIT 1
    `;
    const version = Number(current[0]?.version ?? 0) + 1;
    const id = newTargetId("scfg");
    const canonical = JSON.stringify({
      weights: input.weights,
      thresholds: input.thresholds,
      valueTiers: input.valueTiers,
      scoreVersion: input.scoreVersion,
    });
    await tx`
      INSERT INTO sales_target_scoring_config_versions (
        id, config_key, version, supersedes_version_id, score_version,
        weights, thresholds, value_tiers, feature_contract, model_metadata,
        content_hash, effective_from, change_note, created_by, provenance
      ) VALUES (
        ${id}, ${input.key}, ${version}, ${current[0]?.id ?? null}, ${input.scoreVersion},
        ${tx.json(jsonParam(input.weights))}, ${tx.json(jsonParam(input.thresholds))},
        ${tx.json(jsonParam(input.valueTiers))},
        ${tx.json(jsonParam({ unknownPolicy: "EXCLUDE_AND_REWEIGHT" }))},
        ${tx.json(jsonParam({ engine: "deterministic" }))},
        ${createHash("sha256").update(canonical).digest("hex")}, NOW(),
        ${input.changeNote ?? ""}, ${input.actorId ?? null},
        ${tx.json(jsonParam({ source: "admin-api" }))}
      )
    `;
    await tx`
      INSERT INTO sales_target_scoring_config_state (
        config_key, current_version_id, baseline_version_id, enabled, updated_by
      ) VALUES (${input.key}, ${id}, ${id}, TRUE, ${input.actorId ?? null})
      ON CONFLICT (config_key) DO UPDATE SET
        current_version_id = EXCLUDED.current_version_id,
        baseline_version_id = COALESCE(
          sales_target_scoring_config_state.baseline_version_id,
          sales_target_scoring_config_state.current_version_id,
          EXCLUDED.current_version_id
        ),
        version = sales_target_scoring_config_state.version + 1,
        updated_by = EXCLUDED.updated_by,
        updated_at = NOW()
    `;
    return { id, version };
  });
}

