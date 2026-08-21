/**
 * Dokumentproduktion.
 *
 * Bündelt die Reihenfolge, in der aus einer finalisierten Rechnung PDF,
 * ZUGFeRD-PDF, XRechnung-XML und Validation-Report entstehen und archiviert
 * werden. Ein Fehler in einem Adapter darf die Kette abbrechen — aber nur
 * an genau einer Stelle, damit im Archiv keine halben Dokumentenpaare
 * liegen.
 */

import { createHash } from "node:crypto";
import { renderInvoicePdf, PDF_TEMPLATE_VERSION, PDF_GENERATOR, PDF_GENERATOR_VERSION } from "./pdf";
import { attachXRechnungToPdf, ZUGFERD_SPEC_VERSION } from "./zugferd";
import { renderXRechnung, XRECHNUNG_SPEC_VERSION } from "./xrechnung";
import { validateInvoice } from "./validate";
import { getInvoice, storeInvoiceDocument } from "./invoicesStore";
import type { InvoiceDomain } from "./model";

const XRECHNUNG_GENERATOR = "internal-en16931-writer";
const XRECHNUNG_GENERATOR_VERSION = "1.0.0";

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

/** Menschlich lesbarer Dateiname ohne problematische Sonderzeichen. */
export function invoiceFilename(
  invoice: InvoiceDomain,
  variant: "pdf" | "zugferd" | "xrechnung"
): string {
  const brand = safeName(invoice.issuer.brandLabel);
  const number = invoice.invoiceNumber ?? invoice.id;
  const customer = safeName(invoice.customer.name);
  const suffix =
    variant === "pdf"
      ? "Rechnung"
      : variant === "zugferd"
        ? "Rechnung-ZUGFeRD"
        : "XRechnung";
  const ext = variant === "xrechnung" ? "xml" : "pdf";
  return `${brand}_${suffix}-${number}_${customer}.${ext}`;
}

function safeName(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9\-_]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/**
 * Erzeugt PDF, ZUGFeRD-PDF und XRechnung XML für die Rechnung und legt sie
 * gehasht in `invoice_documents` ab. Wird beim Finalisieren aufgerufen.
 */
export async function generateAndStoreDocuments(invoiceId: string): Promise<void> {
  const invoice = await getInvoice(invoiceId);
  if (!invoice) throw new Error("Rechnung nicht gefunden.");
  if (invoice.status === "draft" || !invoice.invoiceNumber) {
    throw new Error("Nur finalisierte Rechnungen erhalten Dokumente.");
  }

  // 1) Basis-PDF für Mensch.
  const pdfBytes = await renderInvoicePdf(invoice);
  const pdfBuf = Buffer.from(pdfBytes);
  await storeInvoiceDocument(invoice.id, {
    kind: "pdf",
    mimeType: "application/pdf",
    filename: invoiceFilename(invoice, "pdf"),
    byteSize: pdfBuf.length,
    sha256: sha256(pdfBuf),
    generator: PDF_GENERATOR,
    generatorVersion: PDF_GENERATOR_VERSION,
    specVersion: null,
    templateVersion: PDF_TEMPLATE_VERSION,
    validationStatus: "valid",
    validationReport: { note: "Reines Human-Readable-PDF; strukturierte Daten liegen im XRechnung/ZUGFeRD-Anhang." },
    content: pdfBuf,
  });

  // 2) XRechnung XML.
  const xml = renderXRechnung(invoice);
  const xmlBuf = Buffer.from(xml, "utf8");
  const validation = validateInvoice(invoice, xml);
  const validationStatus =
    validation.status === "invalid" ? "invalid" : validation.status === "warnings" ? "warnings" : "valid";

  await storeInvoiceDocument(invoice.id, {
    kind: "xrechnung",
    mimeType: "application/xml",
    filename: invoiceFilename(invoice, "xrechnung"),
    byteSize: xmlBuf.length,
    sha256: sha256(xmlBuf),
    generator: XRECHNUNG_GENERATOR,
    generatorVersion: XRECHNUNG_GENERATOR_VERSION,
    specVersion: XRECHNUNG_SPEC_VERSION,
    templateVersion: null,
    validationStatus,
    validationReport: validation as unknown as Record<string, unknown>,
    content: xmlBuf,
  });

  // 3) ZUGFeRD PDF = Basis-PDF + eingebettetes UBL-XML.
  const { pdf: zugPdf } = await attachXRechnungToPdf(invoice, pdfBytes);
  const zugBuf = Buffer.from(zugPdf);
  await storeInvoiceDocument(invoice.id, {
    kind: "zugferd",
    mimeType: "application/pdf",
    filename: invoiceFilename(invoice, "zugferd"),
    byteSize: zugBuf.length,
    sha256: sha256(zugBuf),
    generator: "internal-factur-x-embed",
    generatorVersion: "1.0.0",
    specVersion: ZUGFERD_SPEC_VERSION,
    templateVersion: PDF_TEMPLATE_VERSION,
    validationStatus,
    validationReport: validation as unknown as Record<string, unknown>,
    content: zugBuf,
  });
}

/** Nur eine Preview — keine Persistenz, keine Nummer, keine Snapshots. */
export async function renderPreviewPdf(invoice: InvoiceDomain): Promise<Buffer> {
  const bytes = await renderInvoicePdf(invoice);
  return Buffer.from(bytes);
}

/**
 * Erzeugt ein einseitiges Notfall-PDF mit klarer Fehlermeldung. Wir setzen
 * bewusst kein Layout aus dem Rechnungs-Renderer ein — hier reicht der
 * StandardFont in einer A4-Seite, damit der iframe die Ursache lesbar
 * anzeigt, statt einen JSON-Blob als „Quelltext" zu präsentieren.
 */
export async function renderErrorPdf(title: string, message: string): Promise<Buffer> {
  const { PDFDocument, StandardFonts, rgb } = await import("pdf-lib");
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const safe = (s: string) => s.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
  page.drawText(safe(title), {
    x: 60,
    y: 780,
    size: 20,
    font: bold,
    color: rgb(0.85, 0.25, 0.25),
  });
  page.drawRectangle({ x: 60, y: 770, width: 475, height: 2, color: rgb(0.85, 0.25, 0.25) });

  // Nachricht umbrechen.
  const words = safe(message).split(/\s+/);
  let line = "";
  let y = 740;
  const size = 11;
  const max = 475;
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (regular.widthOfTextAtSize(test, size) > max && line) {
      page.drawText(line, { x: 60, y, size, font: regular, color: rgb(0.15, 0.15, 0.2) });
      y -= size + 4;
      line = w;
    } else {
      line = test;
    }
  }
  if (line) page.drawText(line, { x: 60, y, size, font: regular, color: rgb(0.15, 0.15, 0.2) });

  page.drawText("Bitte den Aussteller-Datensatz prüfen oder den Entwurf neu speichern.", {
    x: 60,
    y: 40,
    size: 9,
    font: regular,
    color: rgb(0.5, 0.55, 0.6),
  });

  return Buffer.from(await pdf.save());
}
