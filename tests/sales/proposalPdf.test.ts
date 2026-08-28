/**
 * Executive-Angebots-PDF.
 *
 * Prüft, dass der brand-aware Renderer PDFs erzeugt, die
 *  - ein gültiges PDF-Header-Präfix haben,
 *  - mehr als eine Seite bekommen können,
 *  - Inhalte sowohl bei minimaler als auch bei voller Struktur produzieren,
 *  - für alle drei Marken (nexcel/agiworks/both) laufen,
 *  - ein Wasserzeichen einbrennen können, ohne zu crashen.
 *
 * Ausführung: `npx tsx tests/sales/proposalPdf.test.ts`.
 */

import { PDFDocument } from "pdf-lib";
import {
  renderProposalPdf,
  type ProposalStructured,
} from "../../lib/sales/proposalPdf";

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(`FAIL: ${message}`);
}

const minimal: ProposalStructured = {
  cover: {
    unternehmen: "Weissleder Immobilien",
    projektbezeichnung: "Digitalisierungspaket Q3",
    datum: "01.09.2026",
  },
  aufEinenBlick: ["Zentraler Lead-Funnel", "AI-gestützte Angebotserstellung"],
  wieHeute: {
    ausgangslage: "Kein zentrales System.",
    kernpunkte: ["Excel-Chaos", "Kein Reporting"],
  },
  investition: {
    einmalig: [{ position: "Setup", betrag: "12.500 EUR" }],
    summeEinmalig: "12.500 EUR",
  },
  naechsterSchritt: ["Kick-off vereinbaren", "Zugang beschaffen"],
  absender: { brand: "NEXCEL AI", unternehmen: "NEXCEL AI", kontakt: ["kontakt@nexcel-ai.de"] },
};

// Voller Payload, um Text-Umbruch und Seitenwechsel zu triggern.
const rich: ProposalStructured = {
  ...minimal,
  loesungsbausteine: Array.from({ length: 12 }, (_, i) => ({
    name: `Baustein ${i + 1}`,
    was: "Umfangreiche Beschreibung, die den Text-Umbruch und die Seitenwechsel-Logik strapaziert.",
    warum: "Damit der Renderer beweist, dass er zuverlässig neue Seiten öffnet, ohne die Ränder zu verletzen.",
    nutzen: "Zeit- und Fehlerreduktion.",
  })),
  projektablauf: Array.from({ length: 6 }, (_, i) => ({
    phase: `Phase ${i + 1}`,
    ziel: "Klar definiertes Etappenziel",
    aktivitaeten: ["Setup", "Feintuning", "Freigabe"],
    ergebnis: "Nachvollziehbares Ergebnis",
  })),
  scope: {
    inScope: ["A", "B", "C"],
    outOfScope: ["D"],
    annahmen: ["Verfügbarkeit"],
    mitwirkung: ["Content-Freigabe"],
  },
  zeitrahmen: {
    start: "01.10.2026",
    dauer: "8 Wochen",
    meilensteine: [
      { name: "Kick-off", datum: "05.10.2026" },
      { name: "Go-Live", datum: "01.12.2026" },
    ],
    gueltigBis: "31.10.2026",
  },
};

async function renderAndInspect(
  brand: "nexcel" | "agiworks" | "both",
  structured: ProposalStructured,
  opts: { watermark?: string } = {}
) {
  const bytes = await renderProposalPdf({
    brand,
    structured,
    proposalNumber: "V1",
    generatedAt: new Date("2026-09-01T10:00:00Z"),
    watermark: opts.watermark,
  });

  assert(bytes.byteLength > 1500, `${brand}: PDF unrealistisch klein (${bytes.byteLength} bytes)`);

  // Erste vier Bytes müssen '%PDF' sein.
  const header = new TextDecoder("latin1").decode(bytes.slice(0, 4));
  assert(header === "%PDF", `${brand}: kein gültiger PDF-Header (${header})`);

  const parsed = await PDFDocument.load(bytes);
  const pageCount = parsed.getPageCount();
  assert(pageCount >= 1, `${brand}: mindestens eine Seite erwartet`);
  return { bytes, pageCount };
}

async function main(): Promise<void> {
  // Minimaler Payload: eine Seite reicht.
  const { pageCount: minimalPages } = await renderAndInspect("nexcel", minimal);
  assert(minimalPages >= 1, "Minimal-Angebot muss mindestens eine Seite haben");

  // Voller Payload: mehrere Seiten werden erwartet.
  const { pageCount: richPages } = await renderAndInspect("agiworks", rich);
  assert(richPages >= 2, `Fließtext-lastiges Angebot muss auf mehreren Seiten enden (war ${richPages})`);

  // Multi-Brand rendert ohne Fehler.
  await renderAndInspect("both", rich);

  // Wasserzeichen: läuft durch, PDF bleibt gültig.
  await renderAndInspect("nexcel", minimal, { watermark: "Vorschau" });

  console.log("OK  tests/sales/proposalPdf.test.ts");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
