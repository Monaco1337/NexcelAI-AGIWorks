/**
 * Bulk-Upsert-Idempotenz
 *
 * Der Katalogaufbau schreibt tausende Firmen über
 * `INSERT … ON CONFLICT (fingerprint) DO NOTHING`. Das ist nur dann
 * dublettenfrei, wenn der Fingerprint für dieselbe Firma stabil ist —
 * über Segmentgrenzen, Tag-Achsen und Wiederholungsläufe hinweg.
 *
 * Diese Suite prüft genau diese Voraussetzung deterministisch, ohne
 * Datenbank: gleiche Firma → gleicher Fingerprint, andere Firma →
 * anderer Fingerprint.
 */
import { strict as assert } from "node:assert";
import { buildFingerprint } from "../../lib/sales/targets/entityResolution";

function fp(input: Parameters<typeof buildFingerprint>[0]): string {
  return buildFingerprint(input).primary;
}

const base = {
  name: "Ralf Marx Sanitär- und Heizungstechnik",
  legalName: null,
  website: "https://marx-sanitaer.de",
  domain: "marx-sanitaer.de",
  phone: "+492314274621",
  addressLine: "Musterstraße 12",
  postalCode: "44139",
  city: "Dortmund",
  country: "DE",
  googlePlaceId: null,
};

function main() {
  /* ── Stabilität: derselbe Input erzeugt denselben Fingerprint ──── */
  assert.equal(fp(base), fp({ ...base }), "Fingerprint ist nicht reproduzierbar");

  /* ── Ein Wiederholungslauf desselben Segments darf nichts Neues
       erzeugen: identische Stubs kollabieren auf einen Schlüssel ─── */
  const batch = [base, { ...base }, { ...base }];
  const unique = new Set(batch.map(fp));
  assert.equal(unique.size, 1, "identische Firmen erzeugen mehrere Fingerprints");

  /* ── Dieselbe Firma über zwei Tag-Achsen: die Achse ist kein Teil
       der Identität, der Fingerprint muss gleich bleiben ─────────── */
  assert.equal(
    fp(base),
    fp({ ...base, name: "Ralf Marx Sanitär- und Heizungstechnik GmbH" }),
    "Rechtsform verändert die Identität"
  );

  /* ── Schreibweisen-Varianten derselben Firma ────────────────────── */
  assert.equal(
    fp(base),
    fp({ ...base, name: "  RALF MARX  Sanitär- und Heizungstechnik  " }),
    "Groß-/Kleinschreibung und Leerraum verändern den Fingerprint"
  );
  assert.equal(
    fp(base),
    fp({ ...base, website: "http://www.marx-sanitaer.de/", domain: null }),
    "Protokoll/www/Trailing-Slash verändern den Fingerprint"
  );
  assert.equal(
    fp(base),
    fp({ ...base, phone: "0231 4274621" }),
    "nationale Telefonschreibweise verändert den Fingerprint"
  );

  /* ── Abgrenzung: echte andere Firmen kollidieren nicht ──────────── */
  const other = { ...base, name: "Hardline Cleaners", website: "https://hardline-cleaners.de", domain: "hardline-cleaners.de", phone: "+4923759375800" };
  assert.notEqual(fp(base), fp(other), "verschiedene Firmen teilen einen Fingerprint");

  // Gleiche Kette, andere Filiale: unterschiedliche Adresse und Telefon
  // müssen zu unterschiedlichen Datensätzen führen.
  const branchA = { ...base, website: null, domain: null, phone: "+4923112345", addressLine: "Hauptstraße 1", postalCode: "44135", city: "Dortmund" };
  const branchB = { ...base, website: null, domain: null, phone: "+4923467890", addressLine: "Bahnhofstraße 9", postalCode: "59065", city: "Hamm" };
  assert.notEqual(fp(branchA), fp(branchB), "zwei Filialen kollabieren auf einen Fingerprint");

  /* ── Fingerprint ist nie leer ───────────────────────────────────── */
  const sparse = {
    name: "Bäckerei ohne Kontaktdaten",
    legalName: null,
    website: null,
    domain: null,
    phone: null,
    addressLine: null,
    postalCode: null,
    city: null,
    country: "DE",
    googlePlaceId: null,
  };
  assert.ok(fp(sparse).length > 0, "Firma ohne Kontaktdaten hat keinen Fingerprint");
  assert.equal(fp(sparse), fp({ ...sparse }), "sparsamer Datensatz ist nicht stabil");

  /* ── Batch-Dedup wie in bulkIngestCompanies: Map über Fingerprints
       reduziert Mehrfachtreffer auf genau eine Zeile ─────────────── */
  const mixed = [base, { ...base }, other, branchA, branchB, { ...other }];
  const byFingerprint = new Map<string, unknown>();
  for (const stub of mixed) byFingerprint.set(fp(stub), stub);
  assert.equal(byFingerprint.size, 4, `Batch-Dedup ergab ${byFingerprint.size} statt 4 Zeilen`);

  console.log("OK · Bulk-Upsert-Idempotenz");
}

main();
