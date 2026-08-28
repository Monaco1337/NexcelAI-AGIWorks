/**
 * Vertriebs-Domain-Modell.
 *
 * Prüft die Invarianten, auf die UI und Backend gleichermaßen bauen:
 *  - Labels für alle Enum-Werte vorhanden (kein „undefined" in der UI).
 *  - `PIPELINE_ORDER` enthält keine Endzustände (gewonnen/verloren/…).
 *  - `OPEN_STATUSES` ⊂ Vertriebsstatus.
 *  - `isBrandContext` verlässlicher Type-Guard.
 *  - `newId(prefix)` liefert kollisionsfreie, sortierbare IDs.
 *
 * Ausführung: `npx tsx tests/sales/model.test.ts`.
 */

import {
  BRAND_CONTEXTS,
  BRAND_CONTEXT_LABEL,
  CLASSIFICATION_LABEL,
  CONTACT_OUTCOMES,
  CONTACT_OUTCOME_LABEL,
  LOST_REASONS,
  LOST_REASON_LABEL,
  NEXT_ACTIONS,
  NEXT_ACTION_LABEL,
  OBJECTION_TYPES,
  OBJECTION_TYPE_LABEL,
  OPEN_STATUSES,
  PIPELINE_ORDER,
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABEL,
  QUALITY_GATES,
  QUALITY_GATE_LABEL,
  SALES_CLASSIFICATIONS,
  SALES_STATUSES,
  SALES_STATUS_LABEL,
  isBrandContext,
  newId,
} from "../../lib/sales/model";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

function assertLabelsCovered<K extends string>(
  name: string,
  keys: readonly K[],
  labels: Record<K, string>
) {
  for (const k of keys) {
    assert(typeof labels[k] === "string" && labels[k].length > 0, `${name}: Label für ${k} fehlt`);
  }
}

async function main(): Promise<void> {
  assertLabelsCovered("BRAND_CONTEXT", BRAND_CONTEXTS, BRAND_CONTEXT_LABEL);
  assertLabelsCovered("CLASSIFICATION", SALES_CLASSIFICATIONS, CLASSIFICATION_LABEL);
  assertLabelsCovered("SALES_STATUS", SALES_STATUSES, SALES_STATUS_LABEL);
  assertLabelsCovered("CONTACT_OUTCOME", CONTACT_OUTCOMES, CONTACT_OUTCOME_LABEL);
  assertLabelsCovered("NEXT_ACTION", NEXT_ACTIONS, NEXT_ACTION_LABEL);
  assertLabelsCovered("QUALITY_GATE", QUALITY_GATES, QUALITY_GATE_LABEL);
  assertLabelsCovered("PROPOSAL_STATUS", PROPOSAL_STATUSES, PROPOSAL_STATUS_LABEL);
  assertLabelsCovered("OBJECTION_TYPE", OBJECTION_TYPES, OBJECTION_TYPE_LABEL);
  assertLabelsCovered("LOST_REASON", LOST_REASONS, LOST_REASON_LABEL);

  // Pipeline darf keine End-Zustände enthalten.
  const closed = new Set(["gewonnen", "verloren", "zurueckgestellt"]);
  for (const s of PIPELINE_ORDER) {
    assert(!closed.has(s), `PIPELINE_ORDER enthält Endzustand: ${s}`);
  }

  // OPEN_STATUSES müssen echte Sales-Stati sein.
  for (const s of OPEN_STATUSES) {
    assert(
      (SALES_STATUSES as readonly string[]).includes(s),
      `OPEN_STATUSES kennt unbekannten Wert: ${s}`
    );
  }

  // Brand-Context Type-Guard.
  assert(isBrandContext("nexcel"), "nexcel ist ein Brand-Kontext");
  assert(isBrandContext("agiworks"), "agiworks ist ein Brand-Kontext");
  assert(isBrandContext("both"), "both ist ein Brand-Kontext");
  assert(!isBrandContext(""), "leerer String ist kein Brand-Kontext");
  assert(!isBrandContext("foo"), "beliebige Strings sind kein Brand-Kontext");
  assert(!isBrandContext(undefined), "undefined ist kein Brand-Kontext");

  // ID-Generator.
  const seen = new Set<string>();
  for (let i = 0; i < 1000; i++) {
    const id = newId("comp");
    assert(id.startsWith("comp_"), "Prefix fehlt");
    assert(!seen.has(id), `Kollision bei ${i}: ${id}`);
    seen.add(id);
  }
  assert(seen.size === 1000, "1000 unterschiedliche IDs erwartet");

  console.log("OK  tests/sales/model.test.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
