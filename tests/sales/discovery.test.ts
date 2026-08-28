/**
 * Discovery-Datenmodell.
 *
 * Prüft:
 *   - `emptyDiscovery` liefert alle A–Y-Blöcke initialisiert
 *   - `coerceDiscovery` toleriert partielles und kaputtes JSON
 *   - `analyzeDiscovery` klassifiziert Blöcke korrekt und meldet
 *     Lösungsbereitschaft nur, wenn keine kritischen Themen offen sind
 *     und mindestens 6 Themen geklärt wurden
 *   - `findBlock` liefert die Definition zum Key zurück
 */

import {
  analyzeDiscovery,
  coerceDiscovery,
  emptyDiscovery,
  findBlock,
  DISCOVERY_BLOCKS,
  type DiscoveryBlockKey,
} from "../../lib/sales/discoveryModel";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main(): Promise<void> {
  // Empty
  const empty = emptyDiscovery();
  for (const def of DISCOVERY_BLOCKS) {
    assert(empty.blocks[def.key], `emptyDiscovery muss ${def.key} enthalten`);
    assert(empty.blocks[def.key].status === "open", `${def.key} Startstatus offen`);
    assert(empty.blocks[def.key].evidence === "open", `${def.key} Startevidenz offen`);
  }

  // Analysis auf leer → alle kritischen offen, nicht lösungsbereit.
  const anEmpty = analyzeDiscovery(empty);
  assert(anEmpty.clarified.length === 0, "Leer: nichts geklärt");
  assert(anEmpty.open.length === DISCOVERY_BLOCKS.length, "Leer: alle offen");
  assert(anEmpty.criticalOpen.length > 0, "Kritische Themen offen erwartet");
  assert(!anEmpty.readyForSolution, "Leer darf nicht lösungsbereit sein");
  assert(anEmpty.ratio === 0, "Ratio 0 bei leer");

  // coerceDiscovery: robust gegen Müll
  const c1 = coerceDiscovery(null);
  assert(c1.version === 1, "Null → default DiscoveryData");
  const c2 = coerceDiscovery({ blocks: { A_ziel: { note: "42", status: "clarified", evidence: "verified" } } });
  assert(c2.blocks.A_ziel.note === "42", "Coerce übernimmt Note");
  assert(c2.blocks.A_ziel.status === "clarified", "Coerce übernimmt Status");
  assert(c2.blocks.A_ziel.evidence === "verified", "Coerce übernimmt Evidenz");
  const c3 = coerceDiscovery({ hypotheses: [{ text: "Foo" }] });
  assert(c3.hypotheses.length === 1, "Coerce übernimmt Hypothesen");

  // Lösungsbereitschaft nur wenn kein kritischer offen + ≥6 clarified
  const half = emptyDiscovery();
  const criticalKeys: DiscoveryBlockKey[] = DISCOVERY_BLOCKS.filter((b) => b.criticalForProposal).map((b) => b.key);
  for (const k of criticalKeys) {
    half.blocks[k].status = "clarified";
  }
  const anHalf = analyzeDiscovery(half);
  assert(anHalf.criticalOpen.length === 0, "Alle kritischen geklärt");
  assert(anHalf.readyForSolution, "Lösungsbereit ohne kritische Lücken und viel geklärt");

  // Ein kritisches wieder offen → nicht bereit.
  half.blocks[criticalKeys[0]].status = "open";
  const anMinus = analyzeDiscovery(half);
  assert(!anMinus.readyForSolution, "Ein kritisches offen → nicht bereit");

  // findBlock liefert Definition
  const def = findBlock("A_ziel");
  assert(def.title === "Ziel des Kunden", "findBlock liefert Definition");

  console.log("OK  tests/sales/discovery.test.ts");
}

void main().catch((err) => {
  console.error("FAIL tests/sales/discovery.test.ts");
  console.error(err);
  process.exit(1);
});
