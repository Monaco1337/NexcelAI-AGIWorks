/**
 * Katalog-Segmentierung
 *
 * Die Zerlegung der NRW-Bounding-Box in Arbeitspakete muss
 * deterministisch, lückenlos und überschneidungsfrei sein. Sonst wären
 * Fortsetzbarkeit und Idempotenz des Katalogaufbaus nicht gegeben:
 * ein Neustart würde entweder Segmente doppelt abarbeiten oder
 * Regionen auslassen.
 */
import { strict as assert } from "node:assert";
import {
  NRW_SCOPE,
  buildSegments,
  findScope,
  segmentKey,
  tileBBox,
} from "../../lib/sales/targets/catalog/scope";
import {
  OVERPASS_TAG_AXES,
  SLOT_BUSY_MARKER,
  parseSlotBusy,
} from "../../lib/sales/targets/providers/overpassProvider";

function main() {
  /* ── Kacheln decken die Scope-bbox lückenlos ab ─────────────────── */
  const tiles = tileBBox(NRW_SCOPE);
  assert.ok(tiles.length >= 12, `mindestens 12 Kacheln erwartet, waren ${tiles.length}`);

  // Jede Kachel liegt innerhalb der Scope-bbox.
  for (const t of tiles) {
    assert.ok(t.bbox.south >= NRW_SCOPE.bbox.south - 1e-9, "Kachel unterschreitet Süd-Grenze");
    assert.ok(t.bbox.north <= NRW_SCOPE.bbox.north + 1e-9, "Kachel überschreitet Nord-Grenze");
    assert.ok(t.bbox.west >= NRW_SCOPE.bbox.west - 1e-9, "Kachel unterschreitet West-Grenze");
    assert.ok(t.bbox.east <= NRW_SCOPE.bbox.east + 1e-9, "Kachel überschreitet Ost-Grenze");
    assert.ok(t.bbox.north > t.bbox.south, "Kachel ohne Höhe");
    assert.ok(t.bbox.east > t.bbox.west, "Kachel ohne Breite");
  }

  // Die Flächensumme der Kacheln entspricht der Scope-Fläche: das
  // beweist Vollabdeckung ohne Überlappung in einem Schritt.
  const tileArea = tiles.reduce(
    (sum, t) => sum + (t.bbox.north - t.bbox.south) * (t.bbox.east - t.bbox.west),
    0
  );
  const scopeArea =
    (NRW_SCOPE.bbox.north - NRW_SCOPE.bbox.south) * (NRW_SCOPE.bbox.east - NRW_SCOPE.bbox.west);
  assert.ok(
    Math.abs(tileArea - scopeArea) < 1e-4,
    `Kachelfläche ${tileArea.toFixed(6)} weicht von Scope-Fläche ${scopeArea.toFixed(6)} ab`
  );

  // Keine zwei Kacheln teilen dieselbe Gitterposition.
  const positions = new Set(tiles.map((t) => `${t.row}/${t.col}`));
  assert.equal(positions.size, tiles.length, "doppelte Gitterposition");

  /* ── Segmente: Kacheln × Tag-Achsen ─────────────────────────────── */
  const segments = buildSegments(NRW_SCOPE);
  assert.equal(
    segments.length,
    tiles.length * OVERPASS_TAG_AXES.length,
    "Segmentanzahl entspricht nicht Kacheln × Achsen"
  );

  const keys = new Set(segments.map((s) => s.key));
  assert.equal(keys.size, segments.length, "Segment-Keys sind nicht eindeutig");

  /* ── Determinismus: gleicher Scope, gleiche Segmente ────────────── */
  const again = buildSegments(NRW_SCOPE);
  assert.deepEqual(
    segments.map((s) => s.key),
    again.map((s) => s.key),
    "Segmentierung ist nicht deterministisch"
  );
  assert.deepEqual(segments[0].bbox, again[0].bbox, "bbox eines Segments ist nicht stabil");

  /* ── Key-Format ist stabil und rekonstruierbar ──────────────────── */
  const first = segments[0];
  assert.equal(
    first.key,
    segmentKey(NRW_SCOPE.key, first.row, first.col, first.tagAxis),
    "Segment-Key weicht vom Generator ab"
  );
  assert.ok(first.key.startsWith("de-nrw/"), "Key trägt den Scope nicht");

  /* ── Reihenfolge: achsenweise, damit die Abdeckung landesweit
       gleichmäßig wächst statt in einer Ecke zu beginnen ──────────── */
  const firstAxisRun = segments.slice(0, tiles.length);
  assert.ok(
    firstAxisRun.every((s) => s.tagAxis === segments[0].tagAxis),
    "erste Segmente gehören nicht alle zur selben Achse"
  );
  const coveredRows = new Set(firstAxisRun.map((s) => s.row));
  assert.ok(coveredRows.size > 1, "erste Achse deckt nur eine Gitterzeile ab");

  /* ── Jede Achse hat einen Provider-Filter ───────────────────────── */
  const axesInSegments = new Set(segments.map((s) => s.tagAxis));
  assert.equal(axesInSegments.size, OVERPASS_TAG_AXES.length, "nicht alle Achsen sind vertreten");

  /* ── Scope-Lookup ───────────────────────────────────────────────── */
  assert.equal(findScope("de-nrw")?.key, "de-nrw");
  assert.equal(findScope("gibt-es-nicht"), null);

  /* ── Bekannte NRW-Städte liegen in der Scope-bbox ───────────────── */
  const cities: Array<[string, number, number]> = [
    ["Unna", 51.5348, 7.6886],
    ["Dortmund", 51.5136, 7.4653],
    ["Hamm", 51.6739, 7.815],
    ["Bochum", 51.4818, 7.2162],
    ["Köln", 50.9375, 6.9603],
    ["Münster", 51.9607, 7.6261],
    ["Aachen", 50.7753, 6.0839],
    ["Bielefeld", 52.0302, 8.5325],
  ];
  for (const [name, lat, lng] of cities) {
    assert.ok(
      lat >= NRW_SCOPE.bbox.south &&
        lat <= NRW_SCOPE.bbox.north &&
        lng >= NRW_SCOPE.bbox.west &&
        lng <= NRW_SCOPE.bbox.east,
      `${name} liegt ausserhalb der NRW-Scope-bbox`
    );
    // Genau eine Kachel enthält die Stadt.
    const hits = tiles.filter(
      (t) => lat >= t.bbox.south && lat < t.bbox.north && lng >= t.bbox.west && lng < t.bbox.east
    );
    assert.equal(hits.length, 1, `${name} liegt in ${hits.length} Kacheln statt genau einer`);
  }

  /* ── Slot-Sperre ist von einem Segmentfehler unterscheidbar ─────── */
  // Overpass sperrt die aufrufende IP nach wenigen grossen Abfragen fuer
  // rund eine Minute. Das darf nicht als Fehler des Segments gelten,
  // sonst waeren nach max_attempts Ticks alle Segmente 'failed', ohne
  // dass je eine Abfrage gelaufen ist.
  assert.equal(
    parseSlotBusy("Segment ohne Geometrie"),
    null,
    "echter Segmentfehler darf nicht als Slot-Sperre gelten"
  );
  assert.equal(
    parseSlotBusy(`${SLOT_BUSY_MARKER} retry_after=56 — Overpass vergibt derzeit keinen Slot`),
    56,
    "angekuendigte Wartezeit muss uebernommen werden"
  );
  assert.equal(
    parseSlotBusy(`${SLOT_BUSY_MARKER} — kein Slot`),
    60,
    "ohne genannte Wartezeit gilt der Standardwert"
  );
  assert.equal(parseSlotBusy(null), null, "fehlende Meldung ist keine Slot-Sperre");

  console.log(
    `OK · Katalog-Segmentierung (${tiles.length} Kacheln × ${OVERPASS_TAG_AXES.length} Achsen = ${segments.length} Segmente)`
  );
}

main();
