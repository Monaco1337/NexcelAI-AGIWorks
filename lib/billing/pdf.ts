/**
 * PDF-Renderer „AGI Works Classic".
 *
 * Erzeugt eine Rechnung im visuellen Format der Referenz `Rechnung Nr. 16.pdf`:
 * kleine graue Absenderzeile oben, Empfängerblock links, große hellblaue
 * Überschrift „Rechnung Nr.NN", Datum rechts, blaue Tabellen-Kopfzeile
 * (Pos / Beschreibung / Menge / Preis / Gesamt), fette Positionsbezeichnung
 * mit normaler Beschreibungszeile darunter, prominenter Gesamtbetrag rechts,
 * Kleinunternehmer-Hinweis und tiefer blauer Footer.
 *
 * Alle Beträge und Metadaten stammen aus dem Domain-Modell — im Renderer
 * werden keine Werte umgerechnet, weil sonst PDF und XML auseinanderlaufen
 * könnten. Wir arbeiten mit `pdf-lib` (keine nativen Bindings, läuft auf
 * Vercel), setzen die Positionen deterministisch in mm und rechnen sie auf
 * Points um.
 */

import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
  type RGB,
} from "pdf-lib";

import type { InvoiceDomain } from "./model";
import { formatEUR, formatQty } from "./money";
import { formatDeDate } from "./period";
import { formatRate } from "./tax";

export const PDF_TEMPLATE_VERSION = "agiworks_classic:1.0.0";
export const PDF_GENERATOR = "internal-pdflib";
export const PDF_GENERATOR_VERSION = "1.0.0";

/** A4 in Points (72 dpi × mm/25.4). */
const A4 = { width: 595.28, height: 841.89 };

const MM = 72 / 25.4;

/** Schwarz-hellblau als Corporate Colors, wie in der Referenz. */
const COLOR_TEXT: RGB = rgb(0.08, 0.08, 0.1);
const COLOR_MUTED: RGB = rgb(0.42, 0.45, 0.52);
const COLOR_ACCENT: RGB = rgb(0.12, 0.43, 0.85);
const COLOR_ACCENT_SOFT: RGB = rgb(0.87, 0.94, 1);
const COLOR_TABLE_HEAD_BG: RGB = rgb(0.15, 0.45, 0.85);
const COLOR_TABLE_HEAD_FG: RGB = rgb(1, 1, 1);
const COLOR_LINE: RGB = rgb(0.86, 0.89, 0.94);

const MARGIN = { top: 22, right: 20, bottom: 42, left: 20 };
const FOOTER_HEIGHT_MM = 34;

interface Fonts {
  regular: PDFFont;
  bold: PDFFont;
  small: PDFFont;
  italic: PDFFont;
}

export async function renderInvoicePdf(invoice: InvoiceDomain): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Rechnung ${invoice.invoiceNumber ?? "Entwurf"}`);
  pdf.setAuthor(invoice.issuer.legalName);
  pdf.setSubject(`Rechnung an ${invoice.customer.name}`);
  pdf.setProducer("NEXCEL AI Billing");
  pdf.setCreator("NEXCEL AI Billing");
  pdf.setCreationDate(new Date());
  pdf.setModificationDate(new Date());

  const fonts: Fonts = {
    regular: await pdf.embedFont(StandardFonts.Helvetica),
    bold: await pdf.embedFont(StandardFonts.HelveticaBold),
    small: await pdf.embedFont(StandardFonts.Helvetica),
    italic: await pdf.embedFont(StandardFonts.HelveticaOblique),
  };

  const state = new RenderState(pdf, fonts, invoice);
  await state.render();

  return pdf.save();
}

class RenderState {
  private page!: PDFPage;
  private cursorY = 0;
  private pageNumber = 0;

  constructor(
    private readonly pdf: PDFDocument,
    private readonly fonts: Fonts,
    private readonly invoice: InvoiceDomain
  ) {}

  async render(): Promise<void> {
    this.newPage();
    this.drawHeaderTagline();
    this.drawRecipientAndDate();
    this.drawHeading();
    this.drawIntro();
    this.drawItems();
    this.drawTotals();
    this.drawOutro();
    this.drawSmallBusinessNote();

    // Footer auf jede Seite malen.
    const total = this.pdf.getPageCount();
    for (let i = 0; i < total; i++) {
      const page = this.pdf.getPage(i);
      this.drawFooter(page, i + 1, total);
    }
  }

  /* ── Seitenverwaltung ────────────────────────────────────────────── */

  private newPage(): void {
    this.page = this.pdf.addPage([A4.width, A4.height]);
    this.pageNumber++;
    this.cursorY = A4.height - MARGIN.top * MM;
  }

  private ensureSpace(needed: number): void {
    const bottomLimit = MARGIN.bottom * MM + FOOTER_HEIGHT_MM * MM + 6;
    if (this.cursorY - needed < bottomLimit) {
      this.newPage();
      this.drawHeaderTagline();
    }
  }

  /* ── Bausteine ───────────────────────────────────────────────────── */

  private drawHeaderTagline(): void {
    const iss = this.invoice.issuer;
    const tag = iss.headerTagline || "";
    const parts = [tag, iss.address.line1, `${iss.address.postalCode} ${iss.address.city}`]
      .filter(Boolean)
      .join("   ");
    this.page.drawText(parts, {
      x: MARGIN.left * MM,
      y: A4.height - (MARGIN.top - 4) * MM,
      size: 8,
      font: this.fonts.small,
      color: COLOR_MUTED,
    });

    // Brand-Wortmarke oben rechts, statt echtes Logo — die Referenz nutzt
    // ebenfalls einen dezenten Textblock; ein tatsächliches Logofile pflegen
    // wir separat über den Aussteller-Store.
    const brandText = iss.brandLabel;
    const brandWidth = this.fonts.bold.widthOfTextAtSize(brandText, 18);
    this.page.drawText(brandText, {
      x: A4.width - MARGIN.right * MM - brandWidth,
      y: A4.height - (MARGIN.top + 8) * MM,
      size: 18,
      font: this.fonts.bold,
      color: COLOR_ACCENT,
    });

    this.cursorY = A4.height - (MARGIN.top + 22) * MM;
  }

  private drawRecipientAndDate(): void {
    const cust = this.invoice.customer;
    const startY = this.cursorY;

    // Empfänger links.
    const recipientLines = [
      cust.name,
      cust.contactPerson ?? "",
      cust.address.line1,
      cust.address.line2 ?? "",
      `${cust.address.postalCode} ${cust.address.city}`,
    ].filter((l) => l.trim().length > 0);

    let y = startY;
    for (const line of recipientLines) {
      this.page.drawText(line, {
        x: MARGIN.left * MM,
        y,
        size: 10,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });
      y -= 5 * MM;
    }

    // Datum rechts, in derselben Höhe wie die erste Empfängerzeile.
    const dateText = `${this.invoice.issuer.address.city}, ${formatDeDate(this.invoice.invoiceDate)}`;
    const dateWidth = this.fonts.regular.widthOfTextAtSize(dateText, 10);
    this.page.drawText(dateText, {
      x: A4.width - MARGIN.right * MM - dateWidth,
      y: startY,
      size: 10,
      font: this.fonts.regular,
      color: COLOR_TEXT,
    });

    this.cursorY = Math.min(y, startY - 32 * MM);
  }

  private drawHeading(): void {
    const heading = this.invoice.invoiceNumber
      ? `Rechnung Nr. ${this.invoice.invoiceNumber}`
      : "Rechnung (Entwurf)";
    this.page.drawText(heading, {
      x: MARGIN.left * MM,
      y: this.cursorY,
      size: 20,
      font: this.fonts.bold,
      color: COLOR_ACCENT,
    });
    this.cursorY -= 12 * MM;

    if (this.invoice.servicePeriod.label) {
      this.page.drawText(`Leistungszeitraum: ${this.invoice.servicePeriod.label}`, {
        x: MARGIN.left * MM,
        y: this.cursorY,
        size: 9,
        font: this.fonts.italic,
        color: COLOR_MUTED,
      });
      this.cursorY -= 6 * MM;
    }
  }

  private drawIntro(): void {
    const salutation = this.invoice.texts.salutation?.trim() || this.deriveSalutation();
    if (salutation) {
      this.page.drawText(salutation, {
        x: MARGIN.left * MM,
        y: this.cursorY,
        size: 10,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });
      this.cursorY -= 6 * MM;
    }

    if (this.invoice.texts.intro) {
      this.cursorY = this.drawWrapped(
        this.invoice.texts.intro,
        MARGIN.left * MM,
        this.cursorY,
        A4.width - (MARGIN.left + MARGIN.right) * MM,
        10,
        this.fonts.regular,
        COLOR_TEXT
      );
      this.cursorY -= 4 * MM;
    }
  }

  private deriveSalutation(): string {
    const person = this.invoice.customer.contactPerson;
    if (!person) return "Sehr geehrte Damen und Herren,";
    return `Sehr geehrte/r ${person},`;
  }

  /* ── Tabelle ─────────────────────────────────────────────────────── */

  private drawItems(): void {
    const width = A4.width - (MARGIN.left + MARGIN.right) * MM;
    // Spalten in Points relativ zum linken Rand.
    const columns = {
      pos: { x: 0, w: 10 * MM, label: "Pos" },
      desc: { x: 10 * MM, w: width - (10 + 22 + 30 + 30) * MM, label: "Beschreibung" },
      qty: { x: 0, w: 22 * MM, label: "Menge" },
      price: { x: 0, w: 30 * MM, label: "Preis" },
      total: { x: 0, w: 30 * MM, label: "Gesamt" },
    };
    columns.qty.x = columns.desc.x + columns.desc.w;
    columns.price.x = columns.qty.x + columns.qty.w;
    columns.total.x = columns.price.x + columns.price.w;

    const headHeight = 8 * MM;
    this.ensureSpace(headHeight + 6 * MM);

    // Kopf.
    this.page.drawRectangle({
      x: MARGIN.left * MM,
      y: this.cursorY - headHeight,
      width,
      height: headHeight,
      color: COLOR_TABLE_HEAD_BG,
    });
    const headTextY = this.cursorY - headHeight / 2 - 3;
    this.page.drawText("Pos", {
      x: MARGIN.left * MM + 3,
      y: headTextY,
      size: 10,
      font: this.fonts.bold,
      color: COLOR_TABLE_HEAD_FG,
    });
    this.page.drawText("Beschreibung", {
      x: MARGIN.left * MM + columns.desc.x + 3,
      y: headTextY,
      size: 10,
      font: this.fonts.bold,
      color: COLOR_TABLE_HEAD_FG,
    });
    for (const [key, label] of [
      ["qty", "Menge"],
      ["price", "Preis"],
      ["total", "Gesamt"],
    ] as const) {
      const col = columns[key];
      const w = this.fonts.bold.widthOfTextAtSize(label, 10);
      this.page.drawText(label, {
        x: MARGIN.left * MM + col.x + col.w - w - 3,
        y: headTextY,
        size: 10,
        font: this.fonts.bold,
        color: COLOR_TABLE_HEAD_FG,
      });
    }
    this.cursorY -= headHeight;

    // Zeilen.
    for (const item of this.invoice.items) {
      const descWidth = columns.desc.w - 6;

      const titleLines = wrapText(this.fonts.bold, 10, item.title, descWidth);
      const descLines = item.description
        ? wrapText(this.fonts.regular, 9.5, item.description, descWidth)
        : [];
      const lineHeight = 4.6 * MM;
      const rowHeight =
        Math.max(1, titleLines.length + descLines.length) * lineHeight + 3 * MM;

      this.ensureSpace(rowHeight + 4 * MM);

      // Zeilenhintergrund im Wechsel — nur die Description-Trennlinie
      // unten, wie in der Referenz.
      const rowTop = this.cursorY;
      const rowBottom = rowTop - rowHeight;

      // Position.
      this.page.drawText(String(item.position), {
        x: MARGIN.left * MM + 3,
        y: rowTop - 4 * MM,
        size: 10,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });

      // Titel & Beschreibung.
      let ty = rowTop - 4 * MM;
      for (const line of titleLines) {
        this.page.drawText(line, {
          x: MARGIN.left * MM + columns.desc.x + 3,
          y: ty,
          size: 10,
          font: this.fonts.bold,
          color: COLOR_TEXT,
        });
        ty -= lineHeight;
      }
      for (const line of descLines) {
        this.page.drawText(line, {
          x: MARGIN.left * MM + columns.desc.x + 3,
          y: ty,
          size: 9.5,
          font: this.fonts.regular,
          color: COLOR_MUTED,
        });
        ty -= lineHeight;
      }

      // Menge / Einheit.
      const qtyText = `${formatQty(item.quantityMilli)} ${item.unit}`.trim();
      const qtyW = this.fonts.regular.widthOfTextAtSize(qtyText, 10);
      this.page.drawText(qtyText, {
        x: MARGIN.left * MM + columns.qty.x + columns.qty.w - qtyW - 3,
        y: rowTop - 4 * MM,
        size: 10,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });

      // Einzelpreis.
      const priceText = formatEUR(item.unitPriceCents);
      const priceW = this.fonts.regular.widthOfTextAtSize(priceText, 10);
      this.page.drawText(priceText, {
        x: MARGIN.left * MM + columns.price.x + columns.price.w - priceW - 3,
        y: rowTop - 4 * MM,
        size: 10,
        font: this.fonts.regular,
        color: COLOR_TEXT,
      });

      // Gesamt.
      const totalText = formatEUR(item.lineGrossCents);
      const totalW = this.fonts.bold.widthOfTextAtSize(totalText, 10);
      this.page.drawText(totalText, {
        x: MARGIN.left * MM + columns.total.x + columns.total.w - totalW - 3,
        y: rowTop - 4 * MM,
        size: 10,
        font: this.fonts.bold,
        color: COLOR_TEXT,
      });

      // Trennlinie unten.
      this.page.drawLine({
        start: { x: MARGIN.left * MM, y: rowBottom },
        end: { x: MARGIN.left * MM + width, y: rowBottom },
        color: COLOR_LINE,
        thickness: 0.5,
      });

      this.cursorY = rowBottom;
    }
  }

  private drawTotals(): void {
    const totals = this.invoice.totals;
    const width = A4.width - (MARGIN.left + MARGIN.right) * MM;
    const labelX = MARGIN.left * MM + width - 60 * MM;
    const valueX = MARGIN.left * MM + width - 3;

    this.ensureSpace(30 * MM);
    this.cursorY -= 6 * MM;

    const rows: [string, string, boolean][] = [];
    // Wenn Steuer > 0, jeweils separate Zeilen anzeigen. Sonst nur die
    // Bruttosumme (Kleinunternehmer).
    if (totals.taxCents > 0) {
      rows.push(["Nettosumme", formatEUR(totals.netCents), false]);
      for (const bucket of totals.taxBreakdown) {
        if (bucket.taxCents === 0) continue;
        rows.push([
          `USt ${formatRate(bucket.ratePercentMilli)}`,
          formatEUR(bucket.taxCents),
          false,
        ]);
      }
    }
    rows.push(["Gesamtbetrag", formatEUR(totals.grossCents), true]);

    for (const [label, value, bold] of rows) {
      const font = bold ? this.fonts.bold : this.fonts.regular;
      const size = bold ? 12 : 10;
      const yBaseline = this.cursorY - 4 * MM;
      if (bold) {
        this.page.drawRectangle({
          x: labelX - 4,
          y: yBaseline - 2,
          width: valueX - labelX + 4,
          height: 6 * MM,
          color: COLOR_ACCENT_SOFT,
        });
      }
      this.page.drawText(label, {
        x: labelX,
        y: yBaseline,
        size,
        font,
        color: COLOR_TEXT,
      });
      const valW = font.widthOfTextAtSize(value, size);
      this.page.drawText(value, {
        x: valueX - valW,
        y: yBaseline,
        size,
        font,
        color: bold ? COLOR_ACCENT : COLOR_TEXT,
      });
      this.cursorY -= 6 * MM;
    }
  }

  private drawOutro(): void {
    if (!this.invoice.texts.outro) return;
    this.cursorY -= 6 * MM;
    this.cursorY = this.drawWrapped(
      this.invoice.texts.outro,
      MARGIN.left * MM,
      this.cursorY,
      A4.width - (MARGIN.left + MARGIN.right) * MM,
      10,
      this.fonts.regular,
      COLOR_TEXT
    );
    this.cursorY -= 4 * MM;
    const footer = "Mit freundlichen Grüßen";
    this.page.drawText(footer, {
      x: MARGIN.left * MM,
      y: this.cursorY,
      size: 10,
      font: this.fonts.regular,
      color: COLOR_TEXT,
    });
    this.cursorY -= 6 * MM;
    this.page.drawText(this.invoice.issuer.owner, {
      x: MARGIN.left * MM,
      y: this.cursorY,
      size: 10,
      font: this.fonts.bold,
      color: COLOR_TEXT,
    });
    this.cursorY -= 6 * MM;
  }

  private drawSmallBusinessNote(): void {
    const note = this.invoice.texts.smallBusinessNote || "";
    if (!note) return;
    this.cursorY -= 4 * MM;
    this.cursorY = this.drawWrapped(
      note,
      MARGIN.left * MM,
      this.cursorY,
      A4.width - (MARGIN.left + MARGIN.right) * MM,
      9,
      this.fonts.italic,
      COLOR_MUTED
    );
  }

  /* ── Footer ─────────────────────────────────────────────────────── */

  private drawFooter(page: PDFPage, pageNumber: number, totalPages: number): void {
    const iss = this.invoice.issuer;
    const height = FOOTER_HEIGHT_MM * MM;
    const width = A4.width - (MARGIN.left + MARGIN.right) * MM;
    const bottom = MARGIN.bottom * MM - 6;
    const top = bottom + height;

    page.drawRectangle({
      x: MARGIN.left * MM,
      y: bottom,
      width,
      height,
      color: COLOR_ACCENT,
    });

    const colWidth = width / 4;
    const paddingX = 4 * MM;
    const paddingTop = 3 * MM;
    const baseline = top - paddingTop;
    const white = rgb(1, 1, 1);
    const size = 8;
    const lineHeight = 3.4 * MM;

    // Spalten.
    const columns: [string, string[]][] = [
      [
        iss.brandLabel,
        [
          iss.address.line1,
          `${iss.address.postalCode} ${iss.address.city}`,
          iss.address.countryLabel ?? iss.address.country,
        ].filter(Boolean),
      ],
      [
        "Kontakt",
        [
          iss.contact?.phone ? `Tel.: ${iss.contact.phone}` : "",
          iss.contact?.mobile ? `Mobil: ${iss.contact.mobile}` : "",
          iss.contact?.email ? `Mail: ${iss.contact.email}` : "",
          iss.contact?.website ? iss.contact.website.replace(/^https?:\/\//, "") : "",
        ].filter(Boolean),
      ],
      [
        "Inhaber & Steuer",
        [
          `Inhaber: ${iss.owner}`,
          iss.taxNumber ? `Steuernr.: ${iss.taxNumber}` : "",
          iss.vatId ? `USt-ID: ${iss.vatId}` : "",
        ].filter(Boolean),
      ],
      [
        "Bankverbindung",
        [
          iss.bank.bankName,
          `IBAN: ${iss.bank.iban}`,
          `BIC: ${iss.bank.bic}`,
        ].filter(Boolean),
      ],
    ];

    for (let i = 0; i < columns.length; i++) {
      const [title, rows] = columns[i];
      const x = MARGIN.left * MM + i * colWidth + paddingX;
      page.drawText(title, {
        x,
        y: baseline,
        size: 9,
        font: this.fonts.bold,
        color: white,
      });
      let y = baseline - lineHeight - 1;
      for (const line of rows) {
        page.drawText(line, {
          x,
          y,
          size,
          font: this.fonts.regular,
          color: white,
        });
        y -= lineHeight;
      }
    }

    // Seitenzahl unten rechts, unter dem farbigen Block.
    const pageText = `Seite ${pageNumber} / ${totalPages}`;
    const pw = this.fonts.small.widthOfTextAtSize(pageText, 8);
    page.drawText(pageText, {
      x: A4.width - MARGIN.right * MM - pw,
      y: bottom - 4 * MM,
      size: 8,
      font: this.fonts.small,
      color: COLOR_MUTED,
    });
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
    const lines = wrapText(font, size, text, width);
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
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(candidate, size);
    if (width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  // Auch echte Zeilenumbrüche in der Quelle beachten.
  const flat: string[] = [];
  for (const l of lines) {
    for (const seg of l.split("\n")) flat.push(seg);
  }
  return flat.length ? flat : [""];
}
