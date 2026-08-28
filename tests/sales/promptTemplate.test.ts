/**
 * Prompt-Template-Rendering.
 *
 * `renderTemplate` ersetzt `{{key}}`-Platzhalter durch skalare Werte oder
 * JSON-Repräsentationen. Fehlende Keys werden zum leeren String. Diese
 * Invarianten sind die Basis aller Vertriebs-Prompts.
 *
 * Ausführung: `npx tsx tests/sales/promptTemplate.test.ts`.
 */

import { renderTemplate } from "../../lib/sales/ai/promptStore";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

async function main(): Promise<void> {
  // Skalar-Ersetzung.
  const t1 = renderTemplate("Hallo {{ name }}, willkommen bei {{marke}}.", {
    name: "Kevin",
    marke: "AGI Works",
  });
  assert(t1 === "Hallo Kevin, willkommen bei AGI Works.", "Skalare Werte müssen ersetzt werden");

  // Fehlende Keys werden leerer String.
  const t2 = renderTemplate("Firma: {{unternehmen}} · Region: {{region}}", {
    unternehmen: "Weissleder Immobilien",
  });
  assert(
    t2 === "Firma: Weissleder Immobilien · Region: ",
    "Fehlende Variablen müssen leerer String sein"
  );

  // Objekte werden als JSON serialisiert (Vertragsentscheidung).
  const t3 = renderTemplate("Notizen: {{postCall}}", {
    postCall: { themen: ["CRM"], probleme: [{ zitat: "kein System" }] },
  });
  assert(t3.includes('"themen"'), "Objekte werden als JSON serialisiert");
  assert(t3.includes('"CRM"'), "Nested-Werte müssen erhalten bleiben");

  // Robust gegen Whitespace-Muster.
  const t4 = renderTemplate("{{  key  }} {{key}} {{ key}}", { key: "X" });
  assert(t4 === "X X X", "Whitespace in Platzhaltern egalisieren");

  // Kein Regex-Injection-Risiko.
  const t5 = renderTemplate("{{k}}", { k: "$1 $& $`" });
  assert(t5 === "$1 $& $`", "Regex-Sondersequenzen dürfen nicht interpoliert werden");

  console.log("OK  tests/sales/promptTemplate.test.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
