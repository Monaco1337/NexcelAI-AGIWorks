/**
 * Zielkunden – Entity Resolution.
 *
 * Prüft die Kernaussage: „Ein Master-Datensatz pro reales Unternehmen".
 *  - Fingerprint normalisiert Rechtsformen weg (GmbH, GmbH & Co. KG).
 *  - Domain allein erzeugt nur einen Review-Kandidaten; Composite-Evidenz
 *    ist für Auto-Linking erforderlich.
 *  - Telefon-Match ist ein starkes Signal.
 *  - Adress-Match + Name-Kern reicht als Match.
 *  - Verschiedene Unternehmen matchen nicht.
 *
 * Ausführung: `npx tsx tests/sales/targetEntityResolution.test.ts`.
 */

import {
  buildFingerprint,
  matchEntities,
  normalizeCompanyName,
  preferValue,
} from "../../lib/sales/targets/entityResolution";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

async function main(): Promise<void> {
  // Rechtsform-Normalisierung: Kern muss vom Rechtsform-Suffix befreit werden.
  assert(normalizeCompanyName("Müller GmbH") === "muller", "Umlaut+GmbH entfernt");
  const kgCore = normalizeCompanyName("Müller GmbH & Co. KG");
  assert(kgCore.startsWith("muller"), `„Müller GmbH & Co. KG" beginnt mit muller, ist „${kgCore}"`);
  assert(!kgCore.includes("gmbh"), "GmbH-Suffix entfernt");
  assert(normalizeCompanyName("Mueller Sanitär") === "mueller sanitar", "Umlaut folded");

  // Eine gemeinsam genutzte Domain darf verschiedene Firmen/Filialen nicht
  // automatisch zusammenführen.
  const a = buildFingerprint({ name: "Müller GmbH", website: "https://mueller.de" });
  const b = buildFingerprint({ name: "Mueller Sanitär", website: "https://www.mueller.de" });
  const domainMatch = matchEntities(a, b);
  assert(
    !domainMatch.isMatch && domainMatch.outcome === "POSSIBLE_MATCH",
    `Domain allein sollte Review auslösen: ${JSON.stringify(domainMatch)}`,
  );
  const domainAndName = matchEntities(
    buildFingerprint({ name: "Müller GmbH", website: "https://mueller.de" }),
    buildFingerprint({ name: "Müller", website: "https://www.mueller.de" }),
  );
  assert(domainAndName.isMatch, `Domain+Name sollte greifen: ${JSON.stringify(domainAndName)}`);

  // Telefon-Match: allein reicht nicht (0.5), zusammen mit Name-Ähnlichkeit ja.
  const c = buildFingerprint({ name: "Kanzlei Meier", phone: "02303 111111" });
  const d = buildFingerprint({ name: "Kanzlei Meier & Partner", phone: "+492303111111" });
  const phoneMatch = matchEntities(c, d);
  assert(phoneMatch.isMatch, `Telefon+Name-Match sollte greifen: ${JSON.stringify(phoneMatch)}`);

  // Adresse + Name-Kern
  const e = buildFingerprint({
    name: "Praxis Dr. Müller",
    addressLine: "Hauptstraße 12",
    postalCode: "59423",
    city: "Unna",
  });
  const f = buildFingerprint({
    name: "Dr. Müller Praxis",
    addressLine: "Hauptstr 12",
    postalCode: "59423",
    city: "Unna",
  });
  const addressMatch = matchEntities(e, f);
  assert(addressMatch.isMatch, `Adresse+Name sollte greifen: ${JSON.stringify(addressMatch)}`);

  // Kein Match für offensichtlich verschiedene Firmen
  const x = buildFingerprint({ name: "Alpha GmbH", website: "https://alpha.de" });
  const y = buildFingerprint({ name: "Beta AG", website: "https://beta.com" });
  const noMatch = matchEntities(x, y);
  assert(!noMatch.isMatch, "verschiedene Firmen matchen nicht");

  // preferValue: neuer Wert mit höherer Confidence gewinnt
  const chosen = preferValue("02303 111111", "02303 222222", { currentConfidence: 0.5, incomingConfidence: 0.9 });
  assert(chosen === "02303 222222", "höhere Confidence gewinnt");
  const kept = preferValue("02303 111111", "02303 222222", { currentConfidence: 0.9, incomingConfidence: 0.5 });
  assert(kept === "02303 111111", "bestehender Wert bleibt bei niedrigerer Incoming-Confidence");
  const filled = preferValue<string | null>(null, "info@example.de");
  assert(filled === "info@example.de", "leerer Wert wird ergänzt");

  console.log("OK · Zielkunden-EntityResolution");
}

void main().catch((err) => {
  console.error(err);
  process.exit(1);
});
