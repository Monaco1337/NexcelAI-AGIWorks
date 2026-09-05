import { db, jsonParam } from "../../lib/pg";
import {
  configureRollout,
  getRolloutComparison,
  getRolloutOutcomeComparison,
  loadSelectedRuleDefinition,
  loadSelectedScoringDefinition,
  rollbackRollout,
  selectRolloutVersion,
  type RolloutKind,
} from "../../lib/sales/targets/rollout/store";

async function main() {
  const sql = await db();
  if (!sql) throw new Error("DATABASE_URL is required");
  const suffix = Date.now().toString(36);
  const providerKey = `rollout_provider_${suffix}`;
  const ruleKey = `rollout_rule_${suffix}`;
  const scoringKey = `rollout_score_${suffix}`;
  const providerBase = `pcfg_base_${suffix}`;
  const providerCanary = `pcfg_canary_${suffix}`;
  const ruleBase = `rcfg_base_${suffix}`;
  const ruleCanary = `rcfg_canary_${suffix}`;
  const scoringBase = `scfg_base_${suffix}`;
  const scoringCanary = `scfg_canary_${suffix}`;

  await sql`
    INSERT INTO sales_target_provider_configs (
      id, provider, version, capabilities, config, pricing, quota
    ) VALUES
      (${providerBase}, ${providerKey}, 1, '["DISCOVERY"]'::jsonb,
       '{"variant":"baseline"}'::jsonb, '{}'::jsonb, '{}'::jsonb),
      (${providerCanary}, ${providerKey}, 2, '["DISCOVERY"]'::jsonb,
       '{"variant":"canary"}'::jsonb, '{}'::jsonb, '{}'::jsonb)
  `;
  await sql`
    INSERT INTO sales_target_provider_config_state (
      provider, current_config_id, baseline_config_id, enabled, state
    ) VALUES (${providerKey}, ${providerBase}, ${providerBase}, TRUE, 'active')
  `;
  const baselinePolicy = {
    version: "qualification-baseline",
    allowedCountries: ["DE"],
    minScore: 55,
    minEvidenceConfidence: 0.6,
    requireReachableContact: true,
    requireWebsiteOrAddress: true,
  };
  const canaryPolicy = { ...baselinePolicy, version: "qualification-canary", minScore: 65 };
  await sql`
    INSERT INTO sales_target_rule_config_versions (
      id, config_key, version, definition, content_hash, engine_version
    ) VALUES
      (${ruleBase}, ${ruleKey}, 1, ${sql.json(jsonParam(baselinePolicy))}, 'base', 'test-v1'),
      (${ruleCanary}, ${ruleKey}, 2, ${sql.json(jsonParam(canaryPolicy))}, 'canary', 'test-v2')
  `;
  await sql`
    INSERT INTO sales_target_rule_config_state (
      config_key, current_version_id, baseline_version_id, enabled
    ) VALUES (${ruleKey}, ${ruleBase}, ${ruleBase}, TRUE)
  `;
  const weights = {
    need: 20, website: 20, softwareOpportunity: 20, commercialCapacity: 20,
    reachability: 10, decisionMaker: 5, dataConfidence: 5,
  };
  const thresholds = { aPlusPlus: 92, aPlus: 85, a: 70, b: 55, c: 40 };
  await sql`
    INSERT INTO sales_target_scoring_config_versions (
      id, config_key, version, score_version, weights, thresholds,
      value_tiers, content_hash
    ) VALUES
      (${scoringBase}, ${scoringKey}, 1, 'baseline-v1',
       ${sql.json(jsonParam(weights))}, ${sql.json(jsonParam(thresholds))}, '{}'::jsonb, 'base'),
      (${scoringCanary}, ${scoringKey}, 2, 'canary-v2',
       ${sql.json(jsonParam({ ...weights, need: 25, website: 15 }))},
       ${sql.json(jsonParam(thresholds))}, '{}'::jsonb, 'canary')
  `;
  await sql`
    INSERT INTO sales_target_scoring_config_state (
      config_key, current_version_id, baseline_version_id, enabled
    ) VALUES (${scoringKey}, ${scoringBase}, ${scoringBase}, TRUE)
  `;

  const cases: Array<{
    kind: RolloutKind;
    key: string;
    baseline: string;
    canary: string;
  }> = [
    { kind: "provider", key: providerKey, baseline: providerBase, canary: providerCanary },
    { kind: "qualification", key: ruleKey, baseline: ruleBase, canary: ruleCanary },
    { kind: "opportunity", key: ruleKey, baseline: ruleBase, canary: ruleCanary },
    { kind: "scoring", key: scoringKey, baseline: scoringBase, canary: scoringCanary },
  ];
  const results: Record<string, unknown> = {};
  for (const item of cases) {
    await configureRollout({
      kind: item.kind,
      configKey: item.key,
      baselineVersionId: item.baseline,
      canaryVersionId: item.canary,
      rolloutPercentage: 50,
    });
    const selections = [];
    for (let index = 0; index < 40; index++) {
      selections.push(await selectRolloutVersion(item.kind, item.key, `${suffix}:${item.kind}:${index}`));
    }
    const canary = selections.filter((selection) => selection.cohort === "canary").length;
    const baseline = selections.length - canary;
    assert(canary > 0 && baseline > 0, `${item.kind} must allocate partial traffic`);
    const comparison = await getRolloutComparison(item.kind, item.key);
    assert(comparison.length === 2, `${item.kind} baseline/canary comparison`);
    await rollbackRollout(item.kind, item.key);
    const afterRollback = [];
    for (let index = 40; index < 50; index++) {
      afterRollback.push(await selectRolloutVersion(item.kind, item.key, `${suffix}:${item.kind}:${index}`));
    }
    assert(
      afterRollback.every((selection) =>
        selection.cohort === "baseline" && selection.selectedVersionId === item.baseline
      ),
      `${item.kind} rollback must restore baseline`,
    );
    results[item.kind] = { baseline, canary, afterRollbackBaseline: afterRollback.length };
  }

  const qualification = await loadSelectedRuleDefinition(
    "qualification",
    ruleKey,
    `${suffix}:qualification:post-rollback`,
  );
  assert(
    qualification.definition?.version === "qualification-baseline",
    "qualification loader must apply rolled-back baseline definition",
  );
  const scoring = await loadSelectedScoringDefinition(
    scoringKey,
    `${suffix}:scoring:post-rollback`,
  );
  assert(scoring.definition?.scoreVersion === "baseline-v1", "scoring loader must apply baseline");

  await sql`
    INSERT INTO sales_target_qualification_decisions (
      id, rule_config_version_id, decision, score, decision_source
    ) VALUES
      (${`q_rollout_base_${suffix}`}, ${ruleBase}, 'QUALIFIED', 70, 'rollout-test'),
      (${`q_rollout_canary_${suffix}`}, ${ruleCanary}, 'DISQUALIFIED', 50, 'rollout-test')
  `;
  const outcomes = await getRolloutOutcomeComparison("qualification", ruleKey, 1);
  assert(outcomes.length === 2, "qualification outcome comparison must expose both versions");
  results.outcomeVersionsCompared = outcomes.length;

  console.log(JSON.stringify(results));
  await sql.end({ timeout: 5 });
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
