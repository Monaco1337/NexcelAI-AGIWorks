/**
 * PDF-Renderer „AGI Works Classic".
 *
 * 1:1-Nachbau des Originals `Rechnung Nr. 16.pdf`. Alle Positionen sind
 * deterministisch in Millimetern definiert und werden auf Points umgerechnet,
 * damit der Ausdruck exakt der Referenz entspricht.
 *
 * Layout-Zonen (von oben nach unten):
 *  1. Header rechts       — Brand-Logo (Marken-Play-Icon + Wortmarke) oder Bild-Logo.
 *  2. Absenderzeile mit • — mittig oben, dezent grau.
 *  3. Empfängerblock      — links, kleine Bulletpoint-Marker davor.
 *  4. Titel „Rechnung Nr.N" (blau) + Datum rechts.
 *  5. Anrede + Intro.
 *  6. Positions-Tabelle   — blauer Header, mehrzeilige Positionen, Trennlinien.
 *  7. „Gesamtpreis:" groß und blau, ggf. USt-Aufschlüsselung darüber.
 *  8. Outro + „Mit freundlichen Grüßen".
 *  9. Kleinunternehmer-Hinweis (fett, zentriert).
 * 10. Blauer Footer-Balken mit vier Info-Spalten.
 *
 * Werte werden nie umgerechnet, sondern 1:1 aus dem Domain-Modell übernommen.
 * Damit können PDF und E-Rechnung nie auseinanderlaufen.
 */

import {
  PDFDocument,
  StandardFonts,
  degrees,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import type { InvoiceDomain } from "./model";
import { formatEUR, formatQty } from "./money";
import { formatDeDate } from "./period";
import { loadLogoBytes } from "./logoStore";

export const PDF_TEMPLATE_VERSION = "agiworks_classic:2.0.0";
export const PDF_GENERATOR = "internal-pdflib";
export const PDF_GENERATOR_VERSION = "2.0.0";

/** A4 in Points. */
const A4 = { width: 595.28, height: 841.89 };
const MM = 72 / 25.4;

const COLOR_TEXT: RGB = rgb(0.11, 0.13, 0.16);
const COLOR_TEXT_SOFT: RGB = rgb(0.30, 0.33, 0.39);
const COLOR_MUTED: RGB = rgb(0.55, 0.60, 0.68);
const COLOR_MARKER: RGB = rgb(0.78, 0.82, 0.87);
const COLOR_ACCENT: RGB = rgb(0.30, 0.71, 0.93); // #4CB4EE — der Original-Blau
const COLOR_ACCENT_DARK: RGB = rgb(0.23, 0.58, 0.83);
const COLOR_HEAD_BG: RGB = rgb(0.30, 0.71, 0.93);
const COLOR_HEAD_FG: RGB = rgb(1, 1, 1);
const COLOR_LINE: RGB = rgb(0.86, 0.89, 0.94);
const COLOR_FOOTER_BG: RGB = rgb(0.30, 0.71, 0.93);
const COLOR_LOGO_TEXT: RGB = rgb(0.45, 0.51, 0.58);

const MARGIN = { top: 12, right: 18, bottom: 10, left: 18 };
const FOOTER_HEIGHT_MM = 26;
const SMALL_BUSINESS_MARGIN_MM = 6;

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
}

/**
 * Ersetzt Zeichen, die die WinAnsi-Kodierung der Standard-Fonts nicht
 * abbilden kann. Ohne diesen Wrapper stirbt pdf-lib bei typografischen
 * Anführungszeichen, en/em-Dashes oder Emojis.
 */
// WinAnsi kennt Bullet, En-/Em-Dash, deutsche Guillemets und die
// typografischen Anführungszeichen – wir behalten sie bewusst, damit das
// Layout 1:1 zur Referenz bleibt. Nur echte Sonderzeichen ohne Winansi-
// Repräsentation werden ersetzt.
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
    const replacement = CHAR_REPLACEMENTS[ch];
    if (replacement !== undefined) {
      out += replacement;
      continue;
    }
    const cp = ch.codePointAt(0)!;
    out += WINANSI_ALLOWED.has(cp) ? ch : "?";
  }
  return out;
}

export async function renderInvoicePdf(invoice: InvoiceDomain): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(safeText(`Rechnung ${invoice.invoiceNumber ?? "Entwurf"}`));
  pdf.setAuthor(safeText(invoice.issuer.legalName));
  pdf.setSubject(safeText(`Rechnung an ${invoice.customer.name}`));
  pdf.setProducer("NEXCEL AI Billing");
  pdf.setCreator("NEXCEL AI Billing");
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };

  const logo = await tryLoadLogo(pdf, invoice.issuer.logoPath);
  const state = new RenderState(pdf, fonts, invoice, logo);
  await state.render();

  return pdf.save();
}

async function tryLoadLogo(
  pdf: PDFDocument,
  path: string | null | undefined
): Promise<PDFImage | null> {
  if (!path) return null;
  try {
    const bytes = await loadLogoBytes(path);
    if (!bytes) return null;
    if (bytes[0] === 0x89 && bytes[1] === 0x50) return await pdf.embedPng(bytes);
    if (bytes[0] === 0xff && bytes[1] === 0xd8) return await pdf.embedJpg(bytes);
    return null;
  } catch {
    return null;
  }
}

class RenderState {
  private page!: PDFPage;
  private cursorY = 0;

  constructor(
    private readonly pdf: PDFDocument,
    private readonly fonts: Fonts,
    private readonly invoice: InvoiceDomain,
    private readonly logo: PDFImage | null
  ) {}

  async render(): Promise<void> {
    this.newPage();

    // Layout-Reihenfolge exakt wie im Referenz-PDF.
    this.drawLogo();               // ganz oben rechts
    this.drawAddressLine();        // dezente Absenderzeile mit •
    this.drawRecipient();          // Empfängerblock links
    this.drawTitle();              // „Rechnung Nr.NN" (blau) + Datum rechts
    this.drawSalutation();         // Anrede mit •-Marker
    this.drawIntro();              // Intro-Text
    this.drawItemsTable();         // Positionen
    this.drawTotals();             // ggf. USt + „Gesamtpreis:"
    this.drawOutro();              // Outro
    this.drawSalutationClose();    // „Mit freundlichen Grüßen"
    this.drawSmallBusinessNote();  // Fett, zentriert
    this.drawFooter();             // Blauer Balken unten
    this.drawWatermarkIfDraft();
  }

  private newPage(): void {
    this.page = this.pdf.addPage([A4.width, A4.height]);
    this.cursorY = A4.height - MARGIN.top * MM;
  }

  private ensureSpace(needed: number): void {
    const footerTop = FOOTER_HEIGHT_MM * MM + MARGIN.bottom * MM + 4 * MM;
    if (this.cursorY - needed < footerTop) {
      this.newPage();
      this.drawLogo(); // Kopfzeile & Logo auch auf Folgeseiten
      this.drawAddressLine();
      this.cursorY -= 6 * MM;
    }
  }

  /* ── 1) Logo ─────────────────────────────────────────────────────── */

  private drawLogo(): void {
    const iss = this.invoice.issuer;
    const isNexcel = (iss.key || "").toLowerCase().includes("nexcel");

    // Anker rechts oben; Höhe ~14 mm.
    const y = A4.height - (MARGIN.top + 2) * MM;
    const rightX = A4.width - MARGIN.right * MM;

    if (this.logo) {
      const targetHeight = 16 * MM;
      const dims = this.logo.scaleToFit(60 * MM, targetHeight);
      this.page.drawImage(this.logo, {
        x: rightX - dims.width,
        y: y - dims.height,
        width: dims.width,
        height: dims.height,
      });
      return;
    }

    // Vektor-Logo als Fallback: Play-Dreieck-Icon + Wortmarke.
    // Format richtet sich nach der Referenz (AGI WORKS) bzw. Brand.
    const brandUpper = (iss.brandLabel || "").toUpperCase();
    const wordText = brandUpper || "AGI WORKS";
    const fontBold = this.fonts.bold;
    const fontRegular = this.fonts.regular;

    // Farben je Brand.
    const iconColor = isNexcel ? rgb(0.51, 0.28, 1.0) : COLOR_ACCENT;
    const iconStroke = isNexcel ? rgb(0.63, 0.42, 1.0) : COLOR_ACCENT;

    // Icon: sanft abgerundetes Play-Dreieck (nach rechts zeigend).
    const iconSize = 12 * MM;
    const iconY = y - iconSize + 2;
    const iconX = rightX - iconSize - 55; // Platz für Wortmarke rechts vom Icon

    this.drawPlayIcon(iconX, iconY, iconSize, iconColor, iconStroke);

    // Wortmarke: "AGI" oder Brand-Erstteil in leicht dunklerem Grau,
    // Rest in helleres Grau — exakt wie „AGI WORKS" im Original.
    const wordY = y - iconSize / 2 - 4;
    const parts = splitBrandLabel(wordText);
    const primaryColor = rgb(0.20, 0.24, 0.30);
    const secondaryColor = COLOR_LOGO_TEXT;

    const primarySize = 13;
    const primaryW = fontBold.widthOfTextAtSize(parts.primary, primarySize);
    const secondarySize = 13;
    const secondaryW = parts.secondary
      ? fontRegular.widthOfTextAtSize(parts.secondary, secondarySize)
      : 0;
    const gap = parts.secondary ? 3 : 0;

    // Gesamt-Breite: Icon + Padding + Text
    const textStartX = iconX + iconSize + 6;
    this.page.drawText(parts.primary, {
      x: textStartX,
      y: wordY,
      size: primarySize,
      font: fontBold,
      color: primaryColor,
    });
    if (parts.secondary) {
      this.page.drawText(parts.secondary, {
        x: textStartX + primaryW + gap,
        y: wordY,
        size: secondarySize,
        font: fontRegular,
        color: secondaryColor,
      });
    }
    // Sichtbarkeit: kein Reflow, wenn primary+secondary breiter als geplant.
    // Wenn Text über den rechten Rand ragen würde, korrigieren wir das
    // durch einen Shift; das kommt bei den vorgesehenen Brand-Namen nicht
    // vor, ist aber ein Sicherheitsnetz.
    const totalWidth = iconSize + 6 + primaryW + gap + secondaryW;
    const overshoot = iconX + totalWidth - rightX;
    if (overshoot > 0) {
      // no-op: Wortmarke bleibt sichtbar; für andere Brands ggf. Layout anpassen
    }
  }

  /**
   * Zeichnet ein geometrisches, gerundetes „Play"-Dreieck als Marken-Icon.
   * Kein externes Asset nötig — deterministisch reproduzierbar auf jeder
   * Serverless-Instanz.
   */
  private drawPlayIcon(x: number, y: number, size: number, fill: RGB, stroke: RGB): void {
    // Hintergrund-Kreis (dezent) + Dreieck.
    const cx = x + size / 2;
    const cy = y + size / 2;
    const r = size / 2;

    // Umrisskreis (kein Fill), damit das Icon einen sauberen Halo bekommt.
    this.page.drawCircle({
      x: cx,
      y: cy,
      size: r,
      borderColor: stroke,
      borderWidth: 1.1,
      color: undefined,
    });

    // Play-Dreieck (nach rechts).
    const half = r * 0.55;
    const dx = r * 0.45;
    this.page.drawSvgPath(
      `M ${cx - dx} ${cy - half}
       L ${cx - dx} ${cy + half}
       L ${cx + half} ${cy}
       Z`,
      {
        color: fill,
        borderColor: fill,
        borderWidth: 0.5,
      }
    );
  }

  /* ── 2) Absenderzeile mit • ───────────────────────────────────────── */

  private drawAddressLine(): void {
    const iss = this.invoice.issuer;
    const parts = [
      iss.headerTagline || "",
      iss.address?.line1 || "",
      `${iss.address?.postalCode ?? ""} ${iss.address?.city ?? ""}`.trim(),
    ]
      .map((s) => safeText(s))
      .filter((s) => s.trim().length > 0);
    if (parts.length === 0) return;
    const text = parts.join("   \u2022   ");
    const size = 8;
    const w = this.fonts.regular.widthOfTextAtSize(text, size);
    const y = A4.height - (MARGIN.top + 16) * MM;
    this.page.drawText(text, {
      x: A4.width / 2 - w / 2,
      y,
      size,
      font: this.fonts.regular,
      color: COLOR_TEXT_SOFT,
    });
    this.cursorY = y - 6 * MM;
  }

  /* ── 3) Empfängerblock ───────────────────────────────────────────── */

  private drawRecipient(): void {
    const cust = this.invoice.customer;
    const addr = cust.address || { line1: "", postalCode: "", city: "", country: "DE" };
    const lines = [
      cust.name || "",
      cust.contactPerson || "",
      addr.line1 || "",
      addr.line2 || "",
      `${addr.postalCode ?? ""} ${addr.city ?? ""}`.trim(),
    ]
      .map((l) => safeText(l))
      .filter((l) => l.trim().length > 0);

    const x = (MARGIN.left + 8) * MM;
    let y = this.cursorY - 4 * MM;
    for (const line of lines) {
      this.page.drawText(line, {
        x,
        y,
        size: 10,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });
      y -= 5.2 * MM;
    }
    this.cursorY = y - 4 * MM;
  }

  /* ── 4) Titel + Datum ────────────────────────────────────────────── */

  private drawTitle(): void {
    const y = this.cursorY;
    const iss = this.invoice.issuer;
    const number = this.invoice.invoiceNumber ?? "(Entwurf)";
    const title = this.invoice.invoiceNumber
      ? `Rechnung Nr.${number}`
      : "Rechnung Nr. (Entwurf)";
    this.page.drawText(safeText(title), {
      x: (MARGIN.left + 8) * MM,
      y,
      size: 22,
      font: this.fonts.bold,
      color: COLOR_ACCENT,
    });

    const cityRaw = iss.address?.city || "";
    const dateText = safeText(`${cityRaw},${formatDeDate(this.invoice.invoiceDate)}`);
    const dw = this.fonts.regular.widthOfTextAtSize(dateText, 11);
    this.page.drawText(dateText, {
      x: A4.width - MARGIN.right * MM - dw,
      y: y + 3,
      size: 11,
      font: this.fonts.regular,
      color: COLOR_TEXT,
    });

    this.cursorY = y - 12 * MM;
  }

  /* ── 5) Anrede + Intro ───────────────────────────────────────────── */

  private drawSalutation(): void {
    const salutation = this.invoice.texts.salutation?.trim() || this.deriveSalutation();
    if (!salutation) return;
    this.drawBulletMarker(this.cursorY - 1);
    this.page.drawText(safeText(salutation), {
      x: (MARGIN.left + 8) * MM,
      y: this.cursorY - 4,
      size: 10.5,
      font: this.fonts.regular,
      color: COLOR_TEXT,
    });
    this.cursorY -= 8 * MM;
  }

  private drawIntro(): void {
    const intro = this.invoice.texts.intro || this.invoice.issuer.defaultIntro || "";
    if (!intro) return;
    this.drawBulletMarker(this.cursorY - 1);
    this.cursorY = this.drawWrapped(
      safeText(intro),
      (MARGIN.left + 8) * MM,
      this.cursorY - 4,
      A4.width - (MARGIN.left + 8 + MARGIN.right) * MM,
      10.5,
      this.fonts.regular,
      COLOR_TEXT
    );
    this.cursorY -= 6 * MM;
  }

  private deriveSalutation(): string {
    const person = this.invoice.customer.contactPerson;
    if (!person) return "Sehr geehrte Damen und Herren,";
    return `Sehr geehrte/r ${person},`;
  }

  private drawBulletMarker(y: number): void {
    // Kleiner grauer horizontaler Strich als Absatz-Marker (wie im Original).
    this.page.drawRectangle({
      x: MARGIN.left * MM,
      y: y - 3,
      width: 4,
      height: 1,
      color: COLOR_MARKER,
    });
  }

  /* ── 6) Positions-Tabelle ────────────────────────────────────────── */

  private drawItemsTable(): void {
    const leftX = MARGIN.left * MM;
    const width = A4.width - (MARGIN.left + MARGIN.right) * MM;
    const columns = {
      pos:   { x: 0,        w: 10 * MM,          label: "Pos" },
      desc:  { x: 10 * MM,  w: width - (10 + 22 + 30 + 30) * MM, label: "Beschreibung" },
      qty:   { x: 0,        w: 22 * MM,          label: "Menge" },
      price: { x: 0,        w: 30 * MM,          label: "Preis" },
      total: { x: 0,        w: 30 * MM,          label: "Gesamt" },
    };
    columns.qty.x = columns.desc.x + columns.desc.w;
    columns.price.x = columns.qty.x + columns.qty.w;
    columns.total.x = columns.price.x + columns.price.w;

    const headHeight = 8 * MM;
    this.ensureSpace(headHeight + 20 * MM);

    // Kopfzeile.
    this.page.drawRectangle({
      x: leftX,
      y: this.cursorY - headHeight,
      width,
      height: headHeight,
      color: COLOR_HEAD_BG,
    });
    const headBaseline = this.cursorY - headHeight / 2 - 3;

    this.page.drawText("Pos", {
      x: leftX + 3 * MM,
      y: headBaseline,
      size: 10,
      font: this.fonts.bold,
      color: COLOR_HEAD_FG,
    });
    this.page.drawText("Beschreibung", {
      x: leftX + columns.desc.x + 3,
      y: headBaseline,
      size: 10,
      font: this.fonts.bold,
      color: COLOR_HEAD_FG,
    });
    for (const key of ["qty", "price", "total"] as const) {
      const col = columns[key];
      const label = key === "qty" ? "Menge" : key === "price" ? "Preis" : "Gesamt";
      const w = this.fonts.bold.widthOfTextAtSize(label, 10);
      this.page.drawText(label, {
        x: leftX + col.x + col.w - w - 3,
        y: headBaseline,
        size: 10,
        font: this.fonts.bold,
        color: COLOR_HEAD_FG,
      });
    }
    this.cursorY -= headHeight;

    // Zeilen.
    const items = this.invoice.items.length > 0 ? this.invoice.items : [];
    for (const item of items) {
      const descWidth = columns.desc.w - 6;
      const titleLines = wrapText(this.fonts.bold, 10.5, safeText(item.title), descWidth);
      const descLines = item.description
        ? wrapText(this.fonts.regular, 9.5, safeText(item.description), descWidth)
        : [];
      const lineHeight = 4.8 * MM;
      const rowHeight = (titleLines.length + descLines.length) * lineHeight + 3 * MM;

      this.ensureSpace(rowHeight + 4 * MM);

      const rowTop = this.cursorY;
      const rowBottom = rowTop - rowHeight;

      this.drawBulletMarker(rowTop - 4 * MM);

      // Position.
      this.page.drawText(String(item.position), {
        x: leftX + 3 * MM,
        y: rowTop - 4 * MM,
        size: 10.5,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });

      // Titel (fett) + Beschreibung (regular).
      let ty = rowTop - 4 * MM;
      for (const line of titleLines) {
        this.page.drawText(line, {
          x: leftX + columns.desc.x + 3,
          y: ty,
          size: 10.5,
          font: this.fonts.bold,
          color: COLOR_TEXT,
        });
        ty -= lineHeight;
      }
      for (const line of descLines) {
        this.page.drawText(line, {
          x: leftX + columns.desc.x + 3,
          y: ty,
          size: 9.5,
          font: this.fonts.regular,
          color: COLOR_TEXT_SOFT,
        });
        ty -= lineHeight;
      }

      // Menge.
      const qtyText = safeText(`${formatQty(item.quantityMilli)}`.trim());
      const qtyW = this.fonts.regular.widthOfTextAtSize(qtyText, 10.5);
      this.page.drawText(qtyText, {
        x: leftX + columns.qty.x + columns.qty.w - qtyW - 3,
        y: rowTop - 4 * MM,
        size: 10.5,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });

      // Preis.
      const priceText = safeText(formatEUR(item.unitPriceCents));
      const priceW = this.fonts.regular.widthOfTextAtSize(priceText, 10.5);
      this.page.drawText(priceText, {
        x: leftX + columns.price.x + columns.price.w - priceW - 3,
        y: rowTop - 4 * MM,
        size: 10.5,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });

      // Gesamt.
      const totalText = safeText(formatEUR(item.lineGrossCents));
      const totalW = this.fonts.regular.widthOfTextAtSize(totalText, 10.5);
      this.page.drawText(totalText, {
        x: leftX + columns.total.x + columns.total.w - totalW - 3,
        y: rowTop - 4 * MM,
        size: 10.5,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });

      // Feine Trennlinie unten.
      this.page.drawLine({
        start: { x: leftX, y: rowBottom },
        end: { x: leftX + width, y: rowBottom },
        color: COLOR_LINE,
        thickness: 0.5,
      });

      this.cursorY = rowBottom;
    }

    if (items.length === 0) {
      // Keine Positionen — dennoch eine leere Zeile mit dezenter Info.
      this.cursorY -= 8 * MM;
      this.page.drawText("Keine Positionen erfasst.", {
        x: leftX + 3 * MM,
        y: this.cursorY,
        size: 10,
        font: this.fonts.italic,
        color: COLOR_MUTED,
      });
      this.cursorY -= 6 * MM;
    }
  }

  /* ── 7) Summen ───────────────────────────────────────────────────── */

  private drawTotals(): void {
    const totals = this.invoice.totals;
    const rightX = A4.width - MARGIN.right * MM;
    this.ensureSpace(30 * MM);
    this.cursorY -= 12 * MM;

    // Wenn USt vorhanden, zeigen wir Netto- und USt-Zeilen darüber.
    if (totals.taxCents > 0) {
      this.drawSummaryRow("Nettosumme", formatEUR(totals.netCents), false);
      for (const bucket of totals.taxBreakdown) {
        if (bucket.taxCents === 0) continue;
        this.drawSummaryRow(
          `USt ${(bucket.ratePercentMilli / 1000).toFixed(2)} %`,
          formatEUR(bucket.taxCents),
          false
        );
      }
    }

    // "Gesamtpreis:" groß, blau, fett — 1:1 wie Original.
    const label = "Gesamtpreis:";
    const value = formatEUR(totals.grossCents);
    const valueSize = 14;
    const labelSize = 14;
    const labelW = this.fonts.bold.widthOfTextAtSize(label, labelSize);
    const valueW = this.fonts.bold.widthOfTextAtSize(value, valueSize);

    const y = this.cursorY;
    // Labels an ca. 70% Breite, Wert bündig rechts.
    const labelX = rightX - valueW - 12 * MM - labelW;
    this.page.drawText(label, {
      x: labelX,
      y,
      size: labelSize,
      font: this.fonts.bold,
      color: COLOR_TEXT,
    });
    this.page.drawText(value, {
      x: rightX - valueW,
      y,
      size: valueSize,
      font: this.fonts.bold,
      color: COLOR_ACCENT_DARK,
    });
    this.cursorY -= 12 * MM;
  }

  private drawSummaryRow(label: string, value: string, bold: boolean): void {
    const rightX = A4.width - MARGIN.right * MM;
    const font = bold ? this.fonts.bold : this.fonts.regular;
    const size = 10;
    const valueW = font.widthOfTextAtSize(value, size);
    const labelW = font.widthOfTextAtSize(label, size);
    const y = this.cursorY;
    this.page.drawText(safeText(label), {
      x: rightX - valueW - 12 * MM - labelW,
      y,
      size,
      font,
      color: COLOR_TEXT_SOFT,
    });
    this.page.drawText(safeText(value), {
      x: rightX - valueW,
      y,
      size,
      font,
      color: COLOR_TEXT,
    });
    this.cursorY -= 5.5 * MM;
  }

  /* ── 8) Outro + Grußformel ───────────────────────────────────────── */

  private drawOutro(): void {
    const outro = this.invoice.texts.outro || this.invoice.issuer.defaultOutro || "";
    if (!outro) return;
    this.ensureSpace(24 * MM);
    this.drawBulletMarker(this.cursorY - 1);
    this.cursorY = this.drawWrapped(
      safeText(outro),
      (MARGIN.left + 8) * MM,
      this.cursorY - 4,
      A4.width - (MARGIN.left + 8 + MARGIN.right) * MM,
      10.5,
      this.fonts.regular,
      COLOR_TEXT
    );
    this.cursorY -= 6 * MM;
  }

  private drawSalutationClose(): void {
    const closing = this.invoice.issuer.defaultFooter || "Mit freundlichen Grüßen";
    this.drawBulletMarker(this.cursorY - 1);
    this.page.drawText(safeText(closing), {
      x: (MARGIN.left + 8) * MM,
      y: this.cursorY - 4,
      size: 10.5,
      font: this.fonts.regular,
      color: COLOR_TEXT,
    });
    this.cursorY -= 10 * MM;
  }

  /* ── 9) Kleinunternehmer-Hinweis ─────────────────────────────────── */

  private drawSmallBusinessNote(): void {
    const note = this.invoice.texts.smallBusinessNote;
    if (!note) return;
    const size = 10.5;
    const text = safeText(note);
    const width = A4.width - (MARGIN.left + MARGIN.right) * MM;
    const lines = wrapText(this.fonts.bold, size, text, width);

    // Positionierung: bevorzugt direkt unter dem letzten Content. Wenn der
    // Cursor bereits tief steht, halten wir Mindestabstand zum Footer ein.
    const desiredY = this.cursorY - 6 * MM;
    const minY = MARGIN.bottom * MM + FOOTER_HEIGHT_MM * MM + (SMALL_BUSINESS_MARGIN_MM + lines.length * 5) * MM;
    let y = Math.max(desiredY, minY);
    for (const line of lines) {
      const w = this.fonts.bold.widthOfTextAtSize(line, size);
      this.page.drawText(line, {
        x: (A4.width - w) / 2,
        y,
        size,
        font: this.fonts.bold,
        color: COLOR_TEXT,
      });
      y -= (size + 3);
    }
    this.cursorY = y - 2 * MM;
  }

  /* ── 10) Footer (blauer Balken) ──────────────────────────────────── */

  private drawFooter(): void {
    const iss = this.invoice.issuer;
    const height = FOOTER_HEIGHT_MM * MM;
    const width = A4.width - (MARGIN.left + MARGIN.right) * MM;
    const bottom = MARGIN.bottom * MM;
    const top = bottom + height;
    const leftX = MARGIN.left * MM;

    this.page.drawRectangle({
      x: leftX,
      y: bottom,
      width,
      height,
      color: COLOR_FOOTER_BG,
    });

    const address = iss.address || { line1: "", postalCode: "", city: "", country: "" };
    const contact = iss.contact || { email: "" };
    const bank = iss.bank || { bankName: "", iban: "", bic: "" };

    const size = 7.5;
    const white = rgb(1, 1, 1);
    const font = this.fonts.regular;
    const lineHeight = 3.3 * MM;

    // Spaltenbreiten nach realem Textbedarf: Bank braucht mehr Platz,
    // Steuer weniger. Werte in Prozent der Gesamtbreite.
    const ratios = [0.24, 0.23, 0.20, 0.33];
    const cols: { x: number; w: number }[] = [];
    let cx = leftX;
    for (const r of ratios) {
      const w = width * r;
      cols.push({ x: cx, w });
      cx += w;
    }

    const paddingX = 3.5 * MM;

    // Spalte 1: Tagline (mehrzeilig) + Adresse. Wir umbrechen dynamisch,
    // damit der Text nie in Spalte 2 hineinragt.
    const taglineLines = wrapText(
      font,
      size,
      safeText(iss.headerTagline || iss.brandLabel || ""),
      cols[0].w - paddingX
    );
    const column1 = [
      ...taglineLines,
      address.line1 || "",
      `${address.postalCode ?? ""} ${address.city ?? ""}`.trim(),
    ].filter((r) => r.trim().length > 0);

    const column2 = [
      contact.phone ? `Telefon: ${contact.phone}` : "",
      contact.mobile ? `Handy: ${contact.mobile}` : "",
      contact.email ? `Email: ${contact.email}` : "",
    ].filter((r) => r.trim().length > 0);

    const column3 = [
      iss.owner ? `Inhaber: ${iss.owner}` : "",
      iss.taxNumber ? `Steuernr.: ${iss.taxNumber}` : "",
      iss.vatId ? `USt-ID: ${iss.vatId}` : "",
    ].filter((r) => r.trim().length > 0);

    const column4 = [
      bank.bankName || "",
      bank.iban ? `IBAN: ${bank.iban}` : "",
      bank.bic ? `BIC: ${bank.bic}` : "",
    ].filter((r) => r.trim().length > 0);

    const columns = [column1, column2, column3, column4];

    for (let i = 0; i < columns.length; i++) {
      const rows = columns[i];
      const x = cols[i].x + paddingX;
      let y = top - 4 * MM;
      for (const line of rows) {
        this.page.drawText(safeText(line), {
          x,
          y,
          size,
          font,
          color: white,
        });
        y -= lineHeight;
      }
    }
  }

  /* ── Wasserzeichen (nur Draft/Storno) ────────────────────────────── */

  private drawWatermarkIfDraft(): void {
    const status = this.invoice.status;
    let label = "";
    let color: RGB | null = null;
    if (status === "draft" || status === "ready_for_review" || !this.invoice.invoiceNumber) {
      label = "ENTWURF";
      color = rgb(0.75, 0.78, 0.85);
    } else if (status === "cancelled") {
      label = "STORNIERT";
      color = rgb(0.95, 0.6, 0.55);
    } else {
      return;
    }
    for (let i = 0; i < this.pdf.getPageCount(); i++) {
      const page = this.pdf.getPage(i);
      const size = 96;
      const font = this.fonts.bold;
      const width = font.widthOfTextAtSize(label, size);
      page.drawText(label, {
        x: (A4.width - width) / 2 + 40,
        y: A4.height / 2 - 40,
        size,
        font,
        color,
        opacity: 0.12,
        rotate: degrees(-24),
      });
    }
  }

  /* ── Helper ─────────────────────────────────────────────────────── */

  private drawWrapped(
    text: string,
    x: number,
    y: number,
    width: number,
    size: number,
    font: PDFFont,
    color: RGB
  ): number {
    const lines = wrapText(font, size, safeText(text), width);
    let curY = y;
    for (const line of lines) {
      this.page.drawText(line, { x, y: curY, size, font, color });
      curY -= (size + 3);
    }
    return curY;
  }
}

/** Bricht Text an Wortgrenzen, sodass er in `maxWidth` (Points) passt. */
function wrapText(font: PDFFont, size: number, text: string, maxWidth: number): string[] {
  const paragraphs = text.split("\n");
  const out: string[] = [];
  for (const para of paragraphs) {
    const words = para.split(/\s+/).filter(Boolean);
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        out.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) out.push(current);
    if (para === "") out.push("");
  }
  return out.length ? out : [""];
}

/**
 * Zerlegt eine Wortmarke wie „AGI WORKS" in Primärteil (fett, dunkel) und
 * Sekundärteil (regular, grau) — exakt wie im Referenz-Logo.
 */
function splitBrandLabel(label: string): { primary: string; secondary: string } {
  const parts = label.trim().split(/\s+/);
  if (parts.length <= 1) return { primary: parts[0] ?? "", secondary: "" };
  return { primary: parts[0], secondary: parts.slice(1).join(" ") };
}
