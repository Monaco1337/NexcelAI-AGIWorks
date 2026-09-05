import { createHash } from "node:crypto";
import { db, jsonParam } from "@/lib/pg";
import { TargetError } from "../errors";
import { newTargetId } from "../model";
import type { QualificationPolicy } from "./engine";

export async function ensureQualificationRuleVersion(
  policy: QualificationPolicy,
  configKey = "sales-readiness",
): Promise<string> {
  return ensureRuleConfigVersion({
    configKey,
    engineVersion: policy.version,
    definition: policy as unknown as Record<string, unknown>,
  });
}

export async function ensureRuleConfigVersion(input: {
  configKey: string;
  engineVersion: string;
  definition: Record<string, unknown>;
}): Promise<string> {
  const sql = await db();
  if (!sql) throw new TargetError("DB_UNAVAILABLE");
  const definition = JSON.stringify(input.definition);
  const contentHash = createHash("sha256").update(definition).digest("hex");
  return sql.begin(async (tx) => {
    await tx`SELECT pg_advisory_xact_lock(hashtextextended(${"rule-config:" + input.configKey}, 0))`;
    const active = await tx<{ id: string; content_hash: string }[]>`
      SELECT v.id, v.content_hash
      FROM sales_target_rule_config_state s
      JOIN sales_target_rule_config_versions v ON v.id = s.current_version_id
      WHERE s.config_key = ${input.configKey} AND s.enabled = TRUE
      LIMIT 1
    `;
    if (active[0]?.content_hash === contentHash) return active[0].id;

    const current = await tx<{ id: string; version: number }[]>`
      SELECT id, version
      FROM sales_target_rule_config_versions
      WHERE config_key = ${input.configKey}
      ORDER BY version DESC
      LIMIT 1
    `;
    const id = newTargetId("rcfg");
    const version = Number(current[0]?.version ?? 0) + 1;
    await tx`
      INSERT INTO sales_target_rule_config_versions (
        id, config_key, version, supersedes_version_id, definition, content_hash,
        engine_version, effective_from, change_note, provenance
      ) VALUES (
        ${id}, ${input.configKey}, ${version}, ${current[0]?.id ?? null},
        ${tx.json(jsonParam(input.definition))}, ${contentHash}, ${input.engineVersion},
        NOW(), 'Automatically activated deterministic qualification policy',
        ${tx.json(jsonParam({ source: "qualification-engine" }))}
      )
    `;
    await tx`
      INSERT INTO sales_target_rule_config_state (
        config_key, current_version_id, baseline_version_id, enabled
      )
      VALUES (${input.configKey}, ${id}, ${id}, TRUE)
      ON CONFLICT (config_key) DO UPDATE SET
        current_version_id = EXCLUDED.current_version_id,
        baseline_version_id = COALESCE(
          sales_target_rule_config_state.baseline_version_id,
          sales_target_rule_config_state.current_version_id,
          EXCLUDED.current_version_id
        ),
        enabled = TRUE,
        version = sales_target_rule_config_state.version + 1,
        updated_at = NOW()
    `;
    return id;
  });
}

