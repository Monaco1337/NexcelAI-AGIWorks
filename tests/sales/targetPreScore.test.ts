/**
 * Cold-Start-Bewertung
 *
 * Der Pre-Score entscheidet, in welcher Reihenfolge hunderttausend
 * Betriebe angereichert werden. Ist die Reihenfolge falsch, laeuft die
 * teure Tiefenanalyse an den aussichtsreichen Firmen vorbei — der Fehler
 * faellt dabei nicht auf, weil trotzdem Ergebnisse entstehen. Deshalb
 * pruefen wir hier die fachliche Rangfolge, nicht nur die Rechenwege.
 */
import { strict as assert } from "node:assert";
import {
  computePreScore,
  preScoreClass,
  enrichmentPriorityFromPreScore,
  DEFAULT_PRE_SCORE_WEIGHTS,
  type PreScoreInput,
} from "../../lib/sales/targets/preScore";
import { PRIORITY_CLASSES, priorityFromScore } from "../../lib/sales/targets/model";

const base: PreScoreInput = {
  industry: "Handwerk",
  addressLine: "Hauptstr. 1",
  postalCode: "59423",
  city: "Unna",
  signals: ["has_opening_hours"],
};

function score(patch: Partial<PreScoreInput>): number {
  return computePreScore({ ...base, ...patch }).score;
}

function main() {
  /* ── Erreichbarkeit schlaegt Unerreichbarkeit ────────────────────── */
  assert.ok(
    score({ phone: "+4923031234" }) > score({}),
    "Betrieb mit Telefon muss vor einem ohne Kontaktweg liegen"
  );

  /* ── Fehlende Website ist ein Anlass, kein Mangel ────────────────── */
  // Wer keine Website hat, ist fuer uns interessanter, nicht uninteressanter.
  const ohneSite = score({ phone: "+4923031234" });
  const mitSite = score({ phone: "+4923031234", website: "https://example.de" });
  assert.ok(
    ohneSite > mitSite,
    `fehlende Website muss den Bedarf erhoehen (ohne=${ohneSite}, mit=${mitSite})`
  );

  /* ── Analoge Signale erhoehen den Bedarf ─────────────────────────── */
  assert.ok(
    score({ phone: "+49230312", signals: ["has_opening_hours", "uses_fax", "cash_only"] }) >
      score({ phone: "+49230312", signals: ["has_opening_hours", "accepts_card_payment"] }),
    "Fax und Barzahlung sprechen fuer Digitalisierungsbedarf"
  );

  /* ── Bereits digitalisierte Betriebe rutschen nach hinten ────────── */
  assert.ok(
    score({ phone: "+49230312", website: "https://x.de", signals: ["takes_reservation", "has_social_media"] }) <
      ohneSite,
    "vorhandene Online-Buchung senkt den Bedarf"
  );

  /* ── Ketten sind nachrangig ──────────────────────────────────────── */
  assert.ok(
    score({ phone: "+49230312", isChain: true }) < score({ phone: "+49230312" }),
    "Filialen duerfen nicht vor inhabergefuehrten Betrieben liegen"
  );

  /* ── Branchenfit wirkt in die richtige Richtung ──────────────────── */
  assert.ok(
    score({ phone: "+49230312", industry: "Sanitär / Heizung" }) >
      score({ phone: "+49230312", industry: "Einzelhandel", subIndustry: "Kiosk" }),
    "Handwerksnahe Branche muss vor einem Kiosk liegen"
  );

  /* ── Score bleibt im Wertebereich, Gewichte summieren auf 100 ────── */
  const w = DEFAULT_PRE_SCORE_WEIGHTS;
  assert.equal(w.contactability + w.substance + w.digitalGap + w.industryFit, 100);
  for (const patch of [{}, { phone: "1", email: "a@b.de", website: "https://x.de" }]) {
    const r = computePreScore({ ...base, ...patch });
    assert.ok(r.score >= 0 && r.score <= 100, `Score ausserhalb 0..100: ${r.score}`);
    const summe = r.dimensions.reduce((n, d) => n + d.contribution, 0);
    assert.ok(Math.abs(summe - r.score) <= 1, "Beitraege muessen den Score ergeben");
    for (const d of r.dimensions) {
      assert.ok(d.evidence.length > 0, `Dimension ${d.key} ohne Beleg`);
    }
  }

  /* ── Klassengrenzen sind monoton ─────────────────────────────────── */
  const reihen = [100, 80, 66, 50, 34, 0].map(preScoreClass);
  assert.deepEqual(reihen, ["A+", "A+", "A", "B", "C", "D"]);
  // Aus reinen Discovery-Daten wird bewusst kein A++ vergeben.
  assert.ok(!reihen.includes("A++" as never), "A++ setzt Anreicherung voraus");

  /* ── Warteschlange: besserer Betrieb wird frueher gezogen ────────── */
  // sales_target_enrichment_jobs.priority wird aufsteigend abgearbeitet.
  assert.ok(
    enrichmentPriorityFromPreScore(90) < enrichmentPriorityFromPreScore(30),
    "hoher Pre-Score muss kleinere Prioritaetszahl ergeben"
  );

  /* ── A++ existiert und steht ueber A+ ────────────────────────────── */
  assert.equal(PRIORITY_CLASSES[0], "A++");
  assert.equal(priorityFromScore(95), "A++");
  assert.equal(priorityFromScore(87), "A+");
  assert.equal(priorityFromScore(72), "A");
  assert.equal(priorityFromScore(10), "D");
  // C und D bleiben erhalten, sie werden nur nachrangig behandelt.
  assert.ok(PRIORITY_CLASSES.includes("C") && PRIORITY_CLASSES.includes("D"));

  console.log("OK · Zielkunden-PreScore (A++ … D)");
}

main();
