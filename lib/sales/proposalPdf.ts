/**
 * Executive-Angebots-PDF-Renderer für NEXCEL AI / AGI WORKS.
 *
 * Kein 1:1-Pixel-Layout wie beim Rechnungs-Renderer, sondern ein
 * ruhiges, hochwertiges A4-Layout mit Cover, Executive Summary und
 * variabler Anzahl Sections (die AI liefert die Struktur). Der Renderer
 * bricht Text automatisch um, fügt Seiten hinzu und pflegt eine feste
 * Fuß-/Kopfleiste mit Brand-Kontext.
 *
 * Entwurfsentscheidungen:
 *  - Kein Farbverlauf, keine Deko-Grafik. Typografie ist die Bühne.
 *  - Zweispaltige Cover-Fläche (links: Marke, rechts: Kunde).
 *  - Sections werden nur gerendert, wenn Inhalt vorhanden ist.
 *  - Beträge werden als Text übernommen (die AI liefert bereits die
 *    formatierten Werte), Money-Math findet außerhalb statt.
 */

import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { BrandContext } from "./model";

const PAGE_W = 595.28; // A4 Breite in pt
const PAGE_H = 841.89; // A4 Höhe in pt
const MARGIN_X = 54;
const MARGIN_TOP = 60;
const MARGIN_BOTTOM = 60;

const ACCENT_NEXCEL = rgb(0.0, 0.569, 0.762); // #0091C2
const ACCENT_AGI = rgb(0.09, 0.09, 0.11);
const TEXT = rgb(0.12, 0.14, 0.18);
const MUTED = rgb(0.45, 0.48, 0.55);
const HAIRLINE = rgb(0.82, 0.83, 0.86);

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

interface RenderState {
  pdf: PDFDocument;
  fonts: Fonts;
  brand: BrandContext;
  brandLabel: string;
  accent: ReturnType<typeof rgb>;
  page: PDFPage;
  y: number; // baseline-y (bottom-based)
}

export interface ProposalStructured {
  brandContext?: string;
  cover?: { unternehmen?: string; projektbezeichnung?: string; brand?: string; datum?: string; ansprechpartner?: string | null };
  aufEinenBlick?: string[];
  wieHeute?: { ausgangslage?: string; kernpunkte?: string[] };
  wieMorgen?: { zielzustand?: string; wirkung?: string; erfolgsbild?: string[] };
  hebel?: { titel?: string; beschreibung?: string; warumEntscheidend?: string };
  empfehlung?: { titel?: string; kern?: string; warum?: string };
  loesungsarchitektur?: { beschreibung?: string; phasen?: { name: string; beschreibung: string }[] };
  loesungsbausteine?: { name: string; was?: string; warum?: string; nutzen?: string; marke?: string }[];
  leistungsumfang?: { nexcel?: string[]; agiWorks?: string[] };
  projektablauf?: { phase: string; ziel?: string; aktivitaeten?: string[]; ergebnis?: string }[];
  deliverables?: string[];
  erfolgskriterien?: string[];
  investition?: {
    einmalig?: { position: string; betrag: string }[];
    wiederkehrend?: { position: string; betrag: string; intervall?: string }[];
    optional?: { position: string; betrag: string }[];
    summeEinmalig?: string;
    summeWiederkehrend?: string | null;
    hinweise?: string[];
  };
  zahlungsplan?: { meilenstein: string; betrag?: string; faelligkeit?: string }[];
  scope?: { inScope?: string[]; outOfScope?: string[]; annahmen?: string[]; mitwirkung?: string[] };
  zeitrahmen?: { start?: string | null; dauer?: string; meilensteine?: { name: string; datum?: string | null }[]; gueltigBis?: string | null };
  warumBrand?: { brand?: string; ueberschrift?: string; punkte?: string[] };
  partnerschaft?: string | null;
  naechsterSchritt?: string[];
  absender?: { brand?: string; unternehmen?: string; kontakt?: string[] };
}

export interface RenderProposalOptions {
  brand: BrandContext;
  structured: ProposalStructured;
  proposalNumber?: string;
  generatedAt?: Date;
  watermark?: string;
}

/* -------------------------------------------------------------------------- */
/*  Öffentliche API                                                            */
/* -------------------------------------------------------------------------- */

export async function renderProposalPdf(opts: RenderProposalOptions): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(opts.structured.cover?.projektbezeichnung ?? "Angebot");
  pdf.setCreator("NEXCEL AI Sales Module");
  pdf.setProducer("NEXCEL AI");

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };

  const brandLabel =
    opts.brand === "nexcel"
      ? "NEXCEL AI"
      : opts.brand === "agiworks"
        ? "AGI Works"
        : "NEXCEL AI × AGI Works";

  const accent = opts.brand === "agiworks" ? ACCENT_AGI : ACCENT_NEXCEL;

  const state: RenderState = {
    pdf,
    fonts,
    brand: opts.brand,
    brandLabel,
    accent,
    page: pdf.addPage([PAGE_W, PAGE_H]),
    y: PAGE_H - MARGIN_TOP,
  };

  drawHeader(state, opts);
  drawCover(state, opts.structured);
  drawAufEinenBlick(state, opts.structured.aufEinenBlick ?? []);
  drawSection(state, "Wo Sie heute stehen", () => {
    const s = opts.structured.wieHeute;
    if (s?.ausgangslage) drawParagraph(state, s.ausgangslage);
    if (s?.kernpunkte?.length) drawBullets(state, s.kernpunkte);
  });
  drawSection(state, "Wo Sie hinwollen", () => {
    const s = opts.structured.wieMorgen;
    if (s?.zielzustand) drawParagraph(state, s.zielzustand);
    if (s?.wirkung) drawParagraph(state, s.wirkung);
    if (s?.erfolgsbild?.length) drawBullets(state, s.erfolgsbild);
  });
  drawSection(state, "Der entscheidende Hebel", () => {
    const s = opts.structured.hebel;
    if (s?.titel) drawSubheading(state, s.titel);
    if (s?.beschreibung) drawParagraph(state, s.beschreibung);
    if (s?.warumEntscheidend) drawParagraphMuted(state, s.warumEntscheidend);
  });
  drawSection(state, "Unsere Empfehlung", () => {
    const s = opts.structured.empfehlung;
    if (s?.titel) drawSubheading(state, s.titel);
    if (s?.kern) drawParagraph(state, s.kern);
    if (s?.warum) drawParagraphMuted(state, s.warum);
  });
  drawSection(state, "Lösungsarchitektur", () => {
    const s = opts.structured.loesungsarchitektur;
    if (s?.beschreibung) drawParagraph(state, s.beschreibung);
    for (const phase of s?.phasen ?? []) {
      drawSubheading(state, phase.name);
      drawParagraph(state, phase.beschreibung);
    }
  });
  drawSection(state, "Lösungsbausteine", () => {
    for (const b of opts.structured.loesungsbausteine ?? []) {
      drawSubheading(state, b.name);
      if (b.was) drawParagraph(state, b.was);
      if (b.warum) drawParagraphMuted(state, `Warum: ${b.warum}`);
      if (b.nutzen) drawParagraphMuted(state, `Nutzen: ${b.nutzen}`);
    }
  });
  drawSection(state, "Leistungsumfang", () => {
    const s = opts.structured.leistungsumfang;
    if (s?.nexcel?.length) {
      drawSubheading(state, "NEXCEL AI");
      drawBullets(state, s.nexcel);
    }
    if (s?.agiWorks?.length) {
      drawSubheading(state, "AGI Works");
      drawBullets(state, s.agiWorks);
    }
  });
  drawSection(state, "Projektablauf", () => {
    for (const p of opts.structured.projektablauf ?? []) {
      drawSubheading(state, p.phase);
      if (p.ziel) drawParagraphMuted(state, `Ziel: ${p.ziel}`);
      if (p.aktivitaeten?.length) drawBullets(state, p.aktivitaeten);
      if (p.ergebnis) drawParagraphMuted(state, `Ergebnis: ${p.ergebnis}`);
    }
  });
  drawSection(state, "Deliverables", () => drawBullets(state, opts.structured.deliverables ?? []));
  drawSection(state, "Erfolgskriterien", () => drawBullets(state, opts.structured.erfolgskriterien ?? []));
  drawSection(state, "Investition", () => {
    const s = opts.structured.investition;
    if (s?.einmalig?.length) {
      drawSubheading(state, "Einmalig");
      for (const it of s.einmalig) drawKeyValue(state, it.position, it.betrag);
    }
    if (s?.wiederkehrend?.length) {
      drawSubheading(state, "Wiederkehrend");
      for (const it of s.wiederkehrend) {
        drawKeyValue(state, it.position, `${it.betrag}${it.intervall ? " · " + it.intervall : ""}`);
      }
    }
    if (s?.optional?.length) {
      drawSubheading(state, "Optional");
      for (const it of s.optional) drawKeyValue(state, it.position, it.betrag);
    }
    ensureSpace(state, 22);
    if (s?.summeEinmalig) {
      drawKeyValueBold(state, "Summe einmalig", s.summeEinmalig);
    }
    if (s?.summeWiederkehrend) {
      drawKeyValueBold(state, "Summe wiederkehrend", s.summeWiederkehrend);
    }
    if (s?.hinweise?.length) drawBullets(state, s.hinweise);
  });
  drawSection(state, "Zahlungsplan", () => {
    for (const it of opts.structured.zahlungsplan ?? []) {
      drawKeyValue(state, it.meilenstein, [it.betrag, it.faelligkeit].filter(Boolean).join(" · "));
    }
  });
  drawSection(state, "Scope & Rahmen", () => {
    const s = opts.structured.scope;
    if (s?.inScope?.length) {
      drawSubheading(state, "In Scope");
      drawBullets(state, s.inScope);
    }
    if (s?.outOfScope?.length) {
      drawSubheading(state, "Out of Scope");
      drawBullets(state, s.outOfScope);
    }
    if (s?.annahmen?.length) {
      drawSubheading(state, "Annahmen");
      drawBullets(state, s.annahmen);
    }
    if (s?.mitwirkung?.length) {
      drawSubheading(state, "Mitwirkung des Kunden");
      drawBullets(state, s.mitwirkung);
    }
  });
  drawSection(state, "Zeitrahmen", () => {
    const s = opts.structured.zeitrahmen;
    if (s?.start) drawKeyValue(state, "Start", s.start);
    if (s?.dauer) drawKeyValue(state, "Dauer", s.dauer);
    if (s?.meilensteine?.length) {
      drawSubheading(state, "Meilensteine");
      for (const m of s.meilensteine) drawKeyValue(state, m.name, m.datum ?? "—");
    }
    if (s?.gueltigBis) drawKeyValueMuted(state, "Angebot gültig bis", s.gueltigBis);
  });
  drawSection(state, `Warum ${brandLabel}`, () => {
    const s = opts.structured.warumBrand;
    if (s?.ueberschrift) drawSubheading(state, s.ueberschrift);
    if (s?.punkte?.length) drawBullets(state, s.punkte);
  });
  if (opts.structured.partnerschaft) {
    drawSection(state, "Partnerschaft & Weiterentwicklung", () =>
      drawParagraph(state, opts.structured.partnerschaft ?? "")
    );
  }
  drawSection(state, "Ihr nächster Schritt", () => drawBullets(state, opts.structured.naechsterSchritt ?? []));
  drawSection(state, "Absender", () => {
    const s = opts.structured.absender;
    if (s?.brand) drawSubheading(state, s.brand);
    if (s?.unternehmen) drawParagraph(state, s.unternehmen);
    for (const line of s?.kontakt ?? []) drawParagraphMuted(state, line);
  });

  drawFooters(state, opts);

  if (opts.watermark) {
    drawWatermark(state, opts.watermark);
  }

  return await pdf.save();
}

/* -------------------------------------------------------------------------- */
/*  Zeichenprimitive                                                           */
/* -------------------------------------------------------------------------- */

const TITLE_SIZE = 22;
const SUBHEADING_SIZE = 12.5;
const SECTION_TITLE_SIZE = 14.5;
const BODY_SIZE = 10.5;
const SMALL_SIZE = 9;
const LINE_HEIGHT_FACTOR = 1.35;

function measure(font: PDFFont, size: number, text: string): number {
  return font.widthOfTextAtSize(text ?? "", size);
}

function wrapText(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const words = (text ?? "").split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const trial = current ? `${current} ${word}` : word;
    if (measure(font, size, trial) <= maxWidth) {
      current = trial;
    } else {
      if (current) lines.push(current);
      // Sehr langes Wort: hart brechen.
      if (measure(font, size, word) > maxWidth) {
        let piece = "";
        for (const ch of word) {
          const t = piece + ch;
          if (measure(font, size, t) > maxWidth) {
            if (piece) lines.push(piece);
            piece = ch;
          } else {
            piece = t;
          }
        }
        current = piece;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

function ensureSpace(state: RenderState, needed: number): void {
  if (state.y - needed < MARGIN_BOTTOM) {
    state.page = state.pdf.addPage([PAGE_W, PAGE_H]);
    state.y = PAGE_H - MARGIN_TOP;
    drawRunningHeader(state);
  }
}

function advance(state: RenderState, dy: number): void {
  state.y -= dy;
}

const contentWidth = () => PAGE_W - 2 * MARGIN_X;

function drawTextAt(
  state: RenderState,
  text: string,
  x: number,
  y: number,
  font: PDFFont,
  size: number,
  color = TEXT
): void {
  state.page.drawText(text, { x, y, size, font, color });
}

function drawHeader(state: RenderState, opts: RenderProposalOptions): void {
  // Marke oben links, Angebotsnummer + Datum rechts.
  drawTextAt(state, state.brandLabel, MARGIN_X, PAGE_H - 34, state.fonts.bold, 10, state.accent);
  const rightLabel = [
    opts.proposalNumber ? `Angebot ${opts.proposalNumber}` : "Angebot",
    (opts.generatedAt ?? new Date()).toLocaleDateString("de-DE"),
  ].join(" · ");
  const w = measure(state.fonts.regular, 10, rightLabel);
  drawTextAt(state, rightLabel, PAGE_W - MARGIN_X - w, PAGE_H - 34, state.fonts.regular, 10, MUTED);

  state.page.drawLine({
    start: { x: MARGIN_X, y: PAGE_H - 46 },
    end: { x: PAGE_W - MARGIN_X, y: PAGE_H - 46 },
    thickness: 0.5,
    color: HAIRLINE,
  });
  state.y = PAGE_H - MARGIN_TOP;
}

function drawRunningHeader(state: RenderState): void {
  drawTextAt(state, state.brandLabel, MARGIN_X, PAGE_H - 30, state.fonts.bold, 9, state.accent);
  state.page.drawLine({
    start: { x: MARGIN_X, y: PAGE_H - 40 },
    end: { x: PAGE_W - MARGIN_X, y: PAGE_H - 40 },
    thickness: 0.5,
    color: HAIRLINE,
  });
  state.y = PAGE_H - MARGIN_TOP;
}

function drawCover(state: RenderState, s: ProposalStructured): void {
  const cover = s.cover;
  ensureSpace(state, 220);

  drawTextAt(state, "Angebot", MARGIN_X, state.y, state.fonts.bold, TITLE_SIZE, state.accent);
  advance(state, TITLE_SIZE * LINE_HEIGHT_FACTOR);

  if (cover?.projektbezeichnung) {
    const lines = wrapText(state.fonts.bold, 18, cover.projektbezeichnung, contentWidth());
    for (const line of lines) {
      drawTextAt(state, line, MARGIN_X, state.y, state.fonts.bold, 18, TEXT);
      advance(state, 18 * LINE_HEIGHT_FACTOR);
    }
  }

  advance(state, 12);
  const kv: [string, string][] = [];
  if (cover?.unternehmen) kv.push(["Für", cover.unternehmen]);
  if (cover?.ansprechpartner) kv.push(["Ansprechpartner", cover.ansprechpartner]);
  if (cover?.datum) kv.push(["Datum", cover.datum]);
  kv.push(["Von", state.brandLabel]);
  for (const [k, v] of kv) drawKeyValue(state, k, v);

  advance(state, 12);
  state.page.drawLine({
    start: { x: MARGIN_X, y: state.y },
    end: { x: PAGE_W - MARGIN_X, y: state.y },
    thickness: 0.5,
    color: HAIRLINE,
  });
  advance(state, 18);
}

function drawAufEinenBlick(state: RenderState, points: string[]): void {
  if (points.length === 0) return;
  drawSectionTitle(state, "Auf einen Blick");
  drawBullets(state, points);
  advance(state, 12);
}

function drawSection(state: RenderState, title: string, body: () => void): void {
  drawSectionTitle(state, title);
  body();
  advance(state, 14);
}

function drawSectionTitle(state: RenderState, title: string): void {
  ensureSpace(state, 28);
  drawTextAt(state, title, MARGIN_X, state.y, state.fonts.bold, SECTION_TITLE_SIZE, state.accent);
  advance(state, SECTION_TITLE_SIZE * LINE_HEIGHT_FACTOR);
  state.page.drawLine({
    start: { x: MARGIN_X, y: state.y + 4 },
    end: { x: MARGIN_X + 32, y: state.y + 4 },
    thickness: 1.2,
    color: state.accent,
  });
  advance(state, 8);
}

function drawSubheading(state: RenderState, text: string): void {
  ensureSpace(state, 18);
  const lines = wrapText(state.fonts.bold, SUBHEADING_SIZE, text, contentWidth());
  for (const line of lines) {
    drawTextAt(state, line, MARGIN_X, state.y, state.fonts.bold, SUBHEADING_SIZE, TEXT);
    advance(state, SUBHEADING_SIZE * LINE_HEIGHT_FACTOR);
  }
  advance(state, 2);
}

function drawParagraph(state: RenderState, text: string): void {
  if (!text) return;
  const lines = wrapText(state.fonts.regular, BODY_SIZE, text, contentWidth());
  for (const line of lines) {
    ensureSpace(state, 14);
    drawTextAt(state, line, MARGIN_X, state.y, state.fonts.regular, BODY_SIZE, TEXT);
    advance(state, BODY_SIZE * LINE_HEIGHT_FACTOR);
  }
  advance(state, 3);
}

function drawParagraphMuted(state: RenderState, text: string): void {
  if (!text) return;
  const lines = wrapText(state.fonts.italic, BODY_SIZE, text, contentWidth());
  for (const line of lines) {
    ensureSpace(state, 14);
    drawTextAt(state, line, MARGIN_X, state.y, state.fonts.italic, BODY_SIZE, MUTED);
    advance(state, BODY_SIZE * LINE_HEIGHT_FACTOR);
  }
  advance(state, 3);
}

function drawBullets(state: RenderState, items: string[]): void {
  if (items.length === 0) return;
  const indent = MARGIN_X + 14;
  const width = contentWidth() - 14;
  for (const item of items) {
    if (!item) continue;
    const lines = wrapText(state.fonts.regular, BODY_SIZE, item, width);
    ensureSpace(state, 14);
    state.page.drawCircle({
      x: MARGIN_X + 4,
      y: state.y + BODY_SIZE / 3,
      size: 1.5,
      color: state.accent,
    });
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) ensureSpace(state, 14);
      drawTextAt(state, lines[i], indent, state.y, state.fonts.regular, BODY_SIZE, TEXT);
      advance(state, BODY_SIZE * LINE_HEIGHT_FACTOR);
    }
  }
  advance(state, 3);
}

function drawKeyValue(state: RenderState, key: string, value: string): void {
  ensureSpace(state, 14);
  const keyLabel = `${key}`;
  const keyW = measure(state.fonts.bold, BODY_SIZE, keyLabel);
  drawTextAt(state, keyLabel, MARGIN_X, state.y, state.fonts.bold, BODY_SIZE, TEXT);
  const valueX = MARGIN_X + Math.max(120, keyW + 12);
  const lines = wrapText(state.fonts.regular, BODY_SIZE, value, PAGE_W - MARGIN_X - valueX);
  if (lines.length === 0) {
    advance(state, BODY_SIZE * LINE_HEIGHT_FACTOR);
    return;
  }
  drawTextAt(state, lines[0], valueX, state.y, state.fonts.regular, BODY_SIZE, TEXT);
  advance(state, BODY_SIZE * LINE_HEIGHT_FACTOR);
  for (let i = 1; i < lines.length; i++) {
    ensureSpace(state, 14);
    drawTextAt(state, lines[i], valueX, state.y, state.fonts.regular, BODY_SIZE, TEXT);
    advance(state, BODY_SIZE * LINE_HEIGHT_FACTOR);
  }
}

function drawKeyValueMuted(state: RenderState, key: string, value: string): void {
  ensureSpace(state, 14);
  drawTextAt(state, key, MARGIN_X, state.y, state.fonts.regular, SMALL_SIZE, MUTED);
  const valueX = MARGIN_X + 120;
  drawTextAt(state, value, valueX, state.y, state.fonts.regular, SMALL_SIZE, MUTED);
  advance(state, SMALL_SIZE * LINE_HEIGHT_FACTOR);
}

function drawKeyValueBold(state: RenderState, key: string, value: string): void {
  ensureSpace(state, 16);
  drawTextAt(state, key, MARGIN_X, state.y, state.fonts.bold, SUBHEADING_SIZE, state.accent);
  const valueW = measure(state.fonts.bold, SUBHEADING_SIZE, value);
  drawTextAt(state, value, PAGE_W - MARGIN_X - valueW, state.y, state.fonts.bold, SUBHEADING_SIZE, state.accent);
  advance(state, SUBHEADING_SIZE * LINE_HEIGHT_FACTOR);
}

function drawFooters(state: RenderState, opts: RenderProposalOptions): void {
  const pages = state.pdf.getPages();
  const total = pages.length;
  for (let i = 0; i < total; i++) {
    const page = pages[i];
    page.drawLine({
      start: { x: MARGIN_X, y: 42 },
      end: { x: PAGE_W - MARGIN_X, y: 42 },
      thickness: 0.5,
      color: HAIRLINE,
    });
    const left = state.brandLabel;
    page.drawText(left, {
      x: MARGIN_X,
      y: 26,
      size: 8,
      font: state.fonts.regular,
      color: MUTED,
    });
    const right = `Seite ${i + 1} von ${total}`;
    const w = state.fonts.regular.widthOfTextAtSize(right, 8);
    page.drawText(right, {
      x: PAGE_W - MARGIN_X - w,
      y: 26,
      size: 8,
      font: state.fonts.regular,
      color: MUTED,
    });
    if (opts.proposalNumber) {
      const mid = `Angebot ${opts.proposalNumber}`;
      const mw = state.fonts.regular.widthOfTextAtSize(mid, 8);
      page.drawText(mid, {
        x: (PAGE_W - mw) / 2,
        y: 26,
        size: 8,
        font: state.fonts.regular,
        color: MUTED,
      });
    }
  }
}

function drawWatermark(state: RenderState, text: string): void {
  const pages = state.pdf.getPages();
  for (const page of pages) {
    const size = 64;
    const w = state.fonts.bold.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (PAGE_W - w) / 2,
      y: PAGE_H / 2,
      size,
      font: state.fonts.bold,
      color: rgb(0.9, 0.92, 0.96),
      opacity: 0.35,
      rotate: degrees(-30),
    });
  }
}
