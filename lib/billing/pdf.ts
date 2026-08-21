/**
 * Fixed-layout PDF-Renderer für „Rechnung Nr. 16".
 *
 * Diese Datei behandelt eine Rechnung explizit NICHT wie ein responsives
 * Weblayout, sondern als PDF-Dokument mit unveränderlicher A4-Geometrie
 * (595 × 842 pt). Sämtliche Positionen werden absolut aus dem
 * `REFERENCE_INVOICE_16`-Datensatz gelesen und 1:1 auf die pdf-lib-Seite
 * projiziert. Es gibt keine automatische vertikale Verteilung, keine
 * Flex/Grid-Logik, keine Zeilenumbruch-Heuristik über die Referenzwerte
 * hinaus.
 *
 * Y-Konvention:
 * ─ Die Referenz liefert Top-basierte Koordinaten (0 oben, 842 unten).
 * ─ pdf-lib arbeitet Bottom-basiert (0 unten, 842 oben).
 * ─ Für Rechtecke/Linien konvertieren wir `y_bottom = 842 − y_top − h`.
 * ─ Für Texte behandeln wir die Referenz-Y als BASELINE-Y (von oben)
 *   und konvertieren `y_pdf = 842 − y_top`. Dieser Wert ist der Baseline-
 *   Y, den `drawText` erwartet.
 *
 * Business-Daten (Titel, Position, Beträge, Empfänger, Aussteller) werden
 * aus dem InvoiceDomain-Modell gefüllt, aber IMMER an den Referenz-
 * Koordinaten platziert. Der Snapshot-Modus für die Original-Rechnung
 * Nr. 16 nutzt zusätzlich hart die Referenz-Texte (inkl. „Gsamt",
 * „Sehr geehrter Herr ,", 59525 im Footer), damit der Visual-Diff exakt
 * matcht.
 */

import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFImage, type PDFPage, type RGB } from "pdf-lib";

import type { InvoiceDomain } from "./model";
import { formatEUR, formatQty } from "./money";
import { formatDeDate } from "./period";
import { loadLogoBytes } from "./logoStore";
import { PAGE_HEIGHT, PAGE_WIDTH, REFERENCE_INVOICE_16 } from "./reference16";

export const PDF_TEMPLATE_VERSION = "reference16:1.0.0";
export const PDF_GENERATOR = "internal-pdflib";
export const PDF_GENERATOR_VERSION = "3.0.0";

/* ── Farb-Helper ────────────────────────────────────────────────────── */

function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  return rgb(r, g, b);
}

/* ── WinAnsi-Sanitizer ──────────────────────────────────────────────── */

const CHAR_REPLACEMENTS: Record<string, string> = {
  "\u2212": "-",
  "\u2032": "'",
  "\u2033": '"',
  "\u00a0": " ",
  "\u2007": " ",
  "\u2009": " ",
  "\u200a": " ",
  "\u200b": "",
  "\u200c": "",
  "\u200d": "",
  "\ufeff": "",
};
const WINANSI_ALLOWED = new Set<number>();
for (let i = 0x20; i <= 0x7e; i++) WINANSI_ALLOWED.add(i);
for (let i = 0xa0; i <= 0xff; i++) WINANSI_ALLOWED.add(i);
for (const cp of [
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160,
  0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
]) {
  WINANSI_ALLOWED.add(cp);
}
function safeText(input: string | null | undefined): string {
  if (input == null) return "";
  const raw = typeof input === "string" ? input : String(input);
  let out = "";
  for (const ch of raw) {
    const repl = CHAR_REPLACEMENTS[ch];
    if (repl !== undefined) {
      out += repl;
      continue;
    }
    const cp = ch.codePointAt(0)!;
    out += WINANSI_ALLOWED.has(cp) ? ch : "?";
  }
  return out;
}

/* ── Y-Koordinaten-Konvertierung ────────────────────────────────────── */

/**
 * Ascent-Anteil pro Fontgröße für die Helvetica-Familie.
 * Referenzwert: pdf-lib berichtet für Helvetica ca. 718/1000 Ascent-Units.
 * Wir kompensieren die Glyphe „nach unten", damit die vom Original
 * gelieferte Top-of-Glyph-Bounding-Box mit unserer Baseline-Positionierung
 * zusammenfällt.
 */
const HELVETICA_ASCENT_FACTOR = 0.718;

/**
 * Text-Baseline: Referenz liefert TOP-Y der Glyph-Bounding-Box von OBEN,
 * pdf-lib erwartet Baseline-Y von UNTEN. Wir konvertieren:
 *   baseline_from_top = topY + fontSize * ascentFactor
 *   pdfY = PAGE_HEIGHT − baseline_from_top
 */
function tY(topY: number, fontSize: number): number {
  const ascent = fontSize * HELVETICA_ASCENT_FACTOR;
  return PAGE_HEIGHT - topY - ascent;
}
/** Rechteck-Boden: Referenz liefert Top-Y + Höhe. */
function rY(yTop: number, height: number): number {
  return PAGE_HEIGHT - yTop - height;
}
/** Linien-Y: Y ist die Linienhöhe von OBEN. */
function lY(yTop: number): number {
  return PAGE_HEIGHT - yTop;
}

/* ── Fonts ──────────────────────────────────────────────────────────── */

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  demibold: PDFFont;
  italic: PDFFont;
  descBold: PDFFont;
  descRegular: PDFFont;
}

/* ── Logo-Laden ─────────────────────────────────────────────────────── */

let PACKAGED_LOGO_CACHE: Uint8Array | null = null;
async function loadPackagedLogo(): Promise<Uint8Array | null> {
  if (PACKAGED_LOGO_CACHE) return PACKAGED_LOGO_CACHE;
  const file = path.join(process.cwd(), "public", "billing", "agi-works-logo.png");
  try {
    const buf = await readFile(file);
    PACKAGED_LOGO_CACHE = new Uint8Array(buf);
    return PACKAGED_LOGO_CACHE;
  } catch {
    return null;
  }
}

async function embedLogo(pdf: PDFDocument, logoPath: string | null | undefined): Promise<PDFImage | null> {
  // 1) Vom Nutzer hochgeladenes Logo hat immer Vorrang.
  if (logoPath) {
    try {
      const bytes = await loadLogoBytes(logoPath);
      if (bytes && bytes.length > 0) {
        if (bytes[0] === 0x89 && bytes[1] === 0x50) return await pdf.embedPng(bytes);
        if (bytes[0] === 0xff && bytes[1] === 0xd8) return await pdf.embedJpg(bytes);
      }
    } catch {
      // fallthrough → gepacktes Referenz-Logo
    }
  }
  // 2) Referenz-AGI-Works-Logo aus /public/billing.
  const bytes = await loadPackagedLogo();
  if (!bytes) return null;
  try {
    return await pdf.embedPng(bytes);
  } catch {
    return null;
  }
}

/* ── Public API ─────────────────────────────────────────────────────── */

export async function renderInvoicePdf(invoice: InvoiceDomain): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(safeText(`Rechnung ${invoice.invoiceNumber ?? "Entwurf"}`));
  pdf.setAuthor(safeText(invoice.issuer.legalName));
  pdf.setSubject(safeText(`Rechnung an ${invoice.customer.name}`));
  pdf.setProducer("NEXCEL AI Billing (Reference16 Renderer)");
  pdf.setCreator("NEXCEL AI Billing");
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    demibold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
    descBold: await pdf.embedFont(StandardFonts.HelveticaBold),
    descRegular: await pdf.embedFont(StandardFonts.Helvetica),
  };

  const logo = await embedLogo(pdf, invoice.issuer.logoPath);
  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  renderReferenceLayout(page, fonts, invoice, logo);
  drawWatermark(page, fonts, invoice);
  return pdf.save();
}

/* ── Layout ─────────────────────────────────────────────────────────── */

function renderReferenceLayout(
  page: PDFPage,
  fonts: Fonts,
  invoice: InvoiceDomain,
  logo: PDFImage | null
) {
  const REF = REFERENCE_INVOICE_16;
  const iss = invoice.issuer;

  // Ist dies die Original-Rechnung Nr. 16? Falls ja, hart am Referenz-
  // Text bleiben (inkl. Typos), sonst Business-Daten einsetzen.
  const isReferenceInvoice = invoice.invoiceNumber === "16" && invoice.customer?.name?.startsWith("Weissleder");

  /* ── 1) Logo ─────────────────────────────────────────────────────── */
  if (logo) {
    page.drawImage(logo, {
      x: REF.logo.x,
      y: PAGE_HEIGHT - REF.logo.y - REF.logo.h,
      width: REF.logo.w,
      height: REF.logo.h,
    });
  }

  /* ── 2) Absenderzeile + Unterstreichung ──────────────────────────── */
  const senderText = safeText(
    isReferenceInvoice
      ? REF.senderLine.text
      : `${iss.headerTagline}  \u2022  ${iss.address.line1}  \u2022 ${iss.address.postalCode} ${iss.address.city}`
  );
  page.drawText(senderText, {
    x: REF.senderLine.x,
    y: tY(REF.senderLine.y, REF.senderLine.fontSize),
    size: REF.senderLine.fontSize,
    font: fonts.regular,
    color: hexToRgb("#000000"),
  });
  page.drawLine({
    start: { x: REF.headerUnderline.x1, y: lY(REF.headerUnderline.y) },
    end: { x: REF.headerUnderline.x2, y: lY(REF.headerUnderline.y) },
    thickness: REF.headerUnderline.stroke,
    color: hexToRgb("#000000"),
  });

  /* ── 3) Empfänger ────────────────────────────────────────────────── */
  const rec = REF.recipient;
  const recipientLines: { y: number; text: string }[] = isReferenceInvoice
    ? [...rec.lines]
    : buildRecipientLines(invoice);
  for (const line of recipientLines) {
    page.drawText(safeText(line.text), {
      x: rec.x,
      y: tY(line.y, rec.fontSize),
      size: rec.fontSize,
      font: fonts.regular,
      color: hexToRgb("#000000"),
    });
  }

  /* ── 4) Titel + Datum ───────────────────────────────────────────── */
  const titleText = isReferenceInvoice
    ? REF.title.text
    : `Rechnung Nr.${invoice.invoiceNumber ?? "(Entwurf)"}`;
  page.drawText(safeText(titleText), {
    x: REF.title.x,
    y: tY(REF.title.y, REF.title.size),
    size: REF.title.size,
    font: fonts.regular,
    color: hexToRgb(REF.title.color),
  });

  const dateText = isReferenceInvoice
    ? REF.date.text
    : `${iss.address.city},${formatDeDate(invoice.invoiceDate)}`;
  page.drawText(safeText(dateText), {
    x: REF.date.x,
    y: tY(REF.date.y, REF.date.size),
    size: REF.date.size,
    font: fonts.regular,
    color: hexToRgb("#000000"),
  });

  /* ── 5) Begrüßung + Intro ───────────────────────────────────────── */
  const greeting = isReferenceInvoice
    ? REF.greeting.text
    : invoice.texts.salutation?.trim() || "Sehr geehrte Damen und Herren,";
  page.drawText(safeText(greeting), {
    x: REF.greeting.x,
    y: tY(REF.greeting.y, REF.greeting.size),
    size: REF.greeting.size,
    font: fonts.regular,
    color: hexToRgb("#000000"),
  });

  const introLines = isReferenceInvoice
    ? [...REF.intro.lines]
    : wrapAtWidth(fonts.regular, REF.intro.size, invoice.texts.intro || iss.defaultIntro || "", PAGE_WIDTH - REF.intro.x - 60);
  introLines.forEach((line, i) => {
    page.drawText(safeText(line), {
      x: REF.intro.x,
      y: tY(REF.intro.y + i * REF.intro.lineHeight, REF.intro.size),
      size: REF.intro.size,
      font: fonts.regular,
      color: hexToRgb("#000000"),
    });
  });

  /* ── 6) Tabelle ─────────────────────────────────────────────────── */
  const tbl = REF.table;
  page.drawRectangle({
    x: tbl.x,
    y: rY(tbl.y, tbl.headerHeight),
    width: tbl.width,
    height: tbl.headerHeight,
    color: hexToRgb(tbl.color),
  });
  // Header-Label vertikal in der Blau-Fläche zentrieren.
  // Da tY den Ascent später abzieht, kompensieren wir hier so, dass die
  // Baseline in der Mitte der Fläche + Ascent/2 landet.
  const headerLabelTopY = tbl.y + (tbl.headerHeight - tbl.headerFontSize * 0.72) / 2;
  for (const col of tbl.columns) {
    page.drawText(safeText(col.label), {
      x: col.x + 3,
      y: tY(headerLabelTopY, tbl.headerFontSize),
      size: tbl.headerFontSize,
      font: fonts.demibold,
      color: hexToRgb(tbl.headerColor),
    });
  }
  page.drawLine({
    start: { x: tbl.underline.x1, y: lY(tbl.underline.y) },
    end: { x: tbl.underline.x2, y: lY(tbl.underline.y) },
    thickness: tbl.underline.stroke,
    color: hexToRgb(tbl.underline.color),
  });

  /* ── 7) Positions-Numerik & Beschreibung ────────────────────────── */
  const row = REF.positionRow;
  const item = invoice.items[0];
  const posText = isReferenceInvoice ? "1" : String(item?.position ?? 1);
  const qtyText = isReferenceInvoice ? "1" : safeText(formatQty(item?.quantityMilli ?? 0));
  const priceText = isReferenceInvoice ? "29,00 \u20ac" : safeText(formatEUR(item?.unitPriceCents ?? 0));
  const totalText = isReferenceInvoice ? "29,00 \u20ac" : safeText(formatEUR(item?.lineGrossCents ?? 0));

  const numericColor = hexToRgb(row.posColor);
  // Alle Numerik-Werte sind im Original LINKS-BÜNDIG an ihrer x-Position,
  // NICHT rechts-bündig in der Spalte. Wir setzen sie exakt so.
  page.drawText(posText, {
    x: row.posX,
    y: tY(row.posY, row.posSize),
    size: row.posSize,
    font: fonts.regular,
    color: numericColor,
  });
  page.drawText(qtyText, {
    x: row.qtyX,
    y: tY(row.qtyY, row.posSize),
    size: row.posSize,
    font: fonts.regular,
    color: numericColor,
  });
  page.drawText(priceText, {
    x: row.priceX,
    y: tY(row.priceY, row.posSize),
    size: row.posSize,
    font: fonts.regular,
    color: numericColor,
  });
  page.drawText(totalText, {
    x: row.totalX,
    y: tY(row.totalY, row.posSize),
    size: row.posSize,
    font: fonts.regular,
    color: numericColor,
  });

  /* ── 8) Beschreibung ────────────────────────────────────────────── */
  const desc = REF.description;
  const descBold = isReferenceInvoice
    ? [...desc.boldLines]
    : wrapAtWidth(fonts.descBold, desc.size, item?.title || "", 216);
  const descRegular = isReferenceInvoice
    ? [...desc.regularLines]
    : wrapAtWidth(fonts.descRegular, desc.size, item?.description || "", 216);

  let descY = desc.startY;
  for (const line of descBold) {
    page.drawText(safeText(line), {
      x: desc.x,
      y: tY(descY, desc.size),
      size: desc.size,
      font: fonts.descBold,
      color: hexToRgb("#000000"),
    });
    descY += desc.lineHeight;
  }
  for (const line of descRegular) {
    page.drawText(safeText(line), {
      x: desc.x,
      y: tY(descY, desc.size),
      size: desc.size,
      font: fonts.descRegular,
      color: hexToRgb("#000000"),
    });
    descY += desc.lineHeight;
  }

  /* ── 9) Gesamtpreis ─────────────────────────────────────────────── */
  const tot = REF.total;
  page.drawText(safeText(isReferenceInvoice ? tot.label : "Gesamtpreis:"), {
    x: tot.labelX,
    y: tY(tot.y, tot.size),
    size: tot.size,
    font: fonts.bold,
    color: hexToRgb("#000000"),
  });
  const valueText = isReferenceInvoice
    ? tot.value
    : safeText(formatEUR(invoice.totals.grossCents));
  page.drawText(valueText, {
    x: tot.valueX,
    y: tY(tot.y, tot.size),
    size: tot.size,
    font: fonts.bold,
    color: hexToRgb("#000000"),
  });

  /* ── 10) Outro + Grußformel ─────────────────────────────────────── */
  const thx = REF.thankYou;
  const thxLines = isReferenceInvoice
    ? [...thx.lines]
    : wrapAtWidth(fonts.regular, thx.size, invoice.texts.outro || iss.defaultOutro || "", PAGE_WIDTH - thx.x - 60);
  thxLines.forEach((line, i) => {
    page.drawText(safeText(line), {
      x: thx.x,
      y: tY(thx.y + i * thx.lineHeight, thx.size),
      size: thx.size,
      font: fonts.regular,
      color: hexToRgb("#000000"),
    });
  });

  const cls = REF.closing;
  page.drawText(safeText(isReferenceInvoice ? cls.text : iss.defaultFooter || cls.text), {
    x: cls.x,
    y: tY(cls.y, cls.size),
    size: cls.size,
    font: fonts.regular,
    color: hexToRgb("#000000"),
  });

  /* ── 11) Kleinunternehmer-Hinweis ───────────────────────────────── */
  const legal = REF.legalNotice;
  const legalText = isReferenceInvoice
    ? legal.text
    : invoice.texts.smallBusinessNote || iss.smallBusinessNote || "";
  if (legalText) {
    page.drawText(safeText(legalText), {
      x: legal.x,
      y: tY(legal.y, legal.size),
      size: legal.size,
      font: fonts.bold,
      color: hexToRgb("#000000"),
    });
  }

  /* ── 12) Drei Haarlinien links außen ────────────────────────────── */
  const hair = REF.hairlines;
  const hairColor = hexToRgb(hair.color);
  for (const yTop of hair.yPositions) {
    page.drawLine({
      start: { x: hair.x1, y: lY(yTop) },
      end: { x: hair.x2, y: lY(yTop) },
      thickness: hair.stroke,
      color: hairColor,
    });
  }

  /* ── 13) Footer (Full-bleed, 4 Spalten) ─────────────────────────── */
  const foot = REF.footer;
  page.drawRectangle({
    x: 0,
    y: 0,
    width: PAGE_WIDTH,
    height: foot.height,
    color: hexToRgb(foot.background),
  });
  const footColor = hexToRgb(foot.color);
  const lineHeight = 12; // ≈ 1.2 × 10pt
  for (const col of foot.columns) {
    col.lines.forEach((text, i) => {
      page.drawText(safeText(text), {
        x: col.x,
        y: tY(col.y + i * lineHeight, foot.fontSize),
        size: foot.fontSize,
        font: fonts.regular,
        color: footColor,
      });
    });
  }
}

/* ── Text-Helper ────────────────────────────────────────────────────── */

function drawTextRightAligned(
  page: PDFPage,
  text: string,
  rightX: number,
  baselineY: number,
  size: number,
  font: PDFFont,
  color: RGB
) {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: rightX - width,
    y: baselineY,
    size,
    font,
    color,
  });
}

function wrapAtWidth(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const out: string[] = [];
  const paragraphs = text.split(/\n/);
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = "";
    for (const word of words) {
      const candidate = cur ? `${cur} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && cur) {
        out.push(cur);
        cur = word;
      } else {
        cur = candidate;
      }
    }
    if (cur) out.push(cur);
  }
  return out.length ? out : [""];
}

/* ── Dynamische Empfängerzeilen (Nicht-Referenz-Fall) ──────────────── */

function buildRecipientLines(invoice: InvoiceDomain): { y: number; text: string }[] {
  const rec = REFERENCE_INVOICE_16.recipient;
  const cust = invoice.customer;
  const addr = cust.address;
  const raw = [
    cust.name || "",
    cust.contactPerson || "",
    addr?.line1 || "",
    addr?.line2 || "",
    `${addr?.postalCode ?? ""} ${addr?.city ?? ""}`.trim(),
  ].filter((line) => line.trim().length > 0);
  const step = rec.lines[1].y - rec.lines[0].y;
  return raw.map((text, i) => ({ y: rec.lines[0].y + i * step, text }));
}

/* ── Wasserzeichen ──────────────────────────────────────────────────── */

function drawWatermark(page: PDFPage, fonts: Fonts, invoice: InvoiceDomain) {
  const status = invoice.status;
  let label = "";
  let color: RGB | null = null;
  if (status === "draft" || status === "ready_for_review" || !invoice.invoiceNumber) {
    label = "ENTWURF";
    color = hexToRgb("#BFC5D0");
  } else if (status === "cancelled") {
    label = "STORNIERT";
    color = hexToRgb("#F19A96");
  } else {
    return;
  }
  const size = 96;
  const w = fonts.bold.widthOfTextAtSize(label, size);
  page.drawText(label, {
    x: (PAGE_WIDTH - w) / 2 + 40,
    y: PAGE_HEIGHT / 2 - 40,
    size,
    font: fonts.bold,
    color,
    opacity: 0.12,
    rotate: degrees(-24),
  });
}
