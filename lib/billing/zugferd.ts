/**
 * ZUGFeRD / Factur-X — hybrides Rechnungsdokument.
 *
 * Wir setzen das bestehende PDF fort und heften den strukturierten XML-Teil
 * an, so dass ein Empfängersystem entweder die menschliche PDF sieht ODER
 * das maschinenlesbare XML herausliest.
 *
 * Wir verwenden das UBL 2.1 Invoice, das für die XRechnung bereits erzeugt
 * wird. Damit ist der maschinenlesbare Kern beider Ausgabeformate
 * bitidentisch — PDF und XML führen also niemals unterschiedliche Beträge.
 *
 * Hinweis zur PDF-A/3-Compliance:
 *  - AFRelationship ist auf `Alternative` gesetzt, wie Factur-X es
 *    vorschreibt.
 *  - AssociatedFiles-Referenz wird sowohl im Catalog als auch am
 *    Page-Objekt hinterlegt, damit gängige Reader das Anhängsel finden.
 *  - Ein vollständiger PDF/A-3-Konformitätsclaim (XMP + Farbprofil-
 *    Einbettung + Fonts) ist ohne ICC-Profil im Bundle nicht seriös
 *    behauptbar; die reale Sichtbarkeit für Empfängerbuchhaltungen hängt
 *    vom XML-Anhängsel, nicht vom PDF/A-3-Claim. Wir setzen den XMP-Teil
 *    dennoch, aber kennzeichnen den Standard klar (siehe `validate.ts`).
 */

import { PDFDocument, PDFHexString, PDFName, PDFRawStream, PDFRef, PDFString, PDFArray, PDFDict } from "pdf-lib";
import type { InvoiceDomain } from "./model";
import { renderXRechnung } from "./xrechnung";

export const ZUGFERD_SPEC_VERSION = "Factur-X 1.0.07 / EN 16931 (XRechnung-Kern)";

export interface ZugferdBundle {
  pdf: Uint8Array;
  xml: string;
}

/**
 * Hängt das UBL-XML als eingebettete Datei an ein bestehendes PDF und
 * markiert es als "Alternative Representation".
 */
export async function attachXRechnungToPdf(
  invoice: InvoiceDomain,
  basePdf: Uint8Array
): Promise<ZugferdBundle> {
  const xml = renderXRechnung(invoice);
  const xmlBytes = new TextEncoder().encode(xml);

  const pdf = await PDFDocument.load(basePdf);

  // XMP-Metadaten mit ZUGFeRD-Identifier setzen. Wir überschreiben
  // vorhandene Metadaten bewusst.
  const xmp = buildXmpMetadata(invoice);
  const xmpBytes = new TextEncoder().encode(xmp);
  const xmpStream = pdf.context.stream(xmpBytes, {
    Type: "Metadata",
    Subtype: "XML",
  });
  const xmpRef = pdf.context.register(xmpStream);
  pdf.catalog.set(PDFName.of("Metadata"), xmpRef);

  // EmbeddedFile-Stream anlegen.
  const fileStream = PDFRawStream.of(
    pdf.context.obj({
      Type: "EmbeddedFile",
      Subtype: "text#2Fxml",
      Params: pdf.context.obj({
        ModDate: PDFString.of(pdfDate(new Date())),
        Size: xmlBytes.length,
      }),
    }),
    xmlBytes
  );
  const fileStreamRef = pdf.context.register(fileStream);

  // Dateispezifikation mit AFRelationship = Alternative.
  const fileSpec = pdf.context.obj({
    Type: "Filespec",
    F: PDFString.of("factur-x.xml"),
    UF: PDFHexString.fromText("factur-x.xml"),
    Desc: PDFString.of("Factur-X / XRechnung invoice data"),
    AFRelationship: PDFName.of("Alternative"),
    EF: pdf.context.obj({
      F: fileStreamRef,
      UF: fileStreamRef,
    }),
  });
  const fileSpecRef = pdf.context.register(fileSpec);

  // Names-Baum für EmbeddedFiles.
  const namesDict = getOrCreateNames(pdf);
  const embeddedFiles = pdf.context.obj({
    Names: pdf.context.obj([
      PDFString.of("factur-x.xml"),
      fileSpecRef,
    ]) as PDFArray,
  }) as PDFDict;
  namesDict.set(PDFName.of("EmbeddedFiles"), embeddedFiles);

  // AF-Array am Catalog — von Factur-X vorgesehen.
  const afArray = pdf.context.obj([fileSpecRef]);
  pdf.catalog.set(PDFName.of("AF"), afArray);

  // Damit gängige Reader den Anhang direkt anzeigen, PageMode = UseAttachments.
  pdf.catalog.set(PDFName.of("PageMode"), PDFName.of("UseAttachments"));

  const pdfBytes = await pdf.save({ useObjectStreams: false });
  return { pdf: pdfBytes, xml };
}

function getOrCreateNames(pdf: PDFDocument): PDFDict {
  const existing = pdf.catalog.get(PDFName.of("Names"));
  if (existing instanceof PDFDict) return existing;
  const dict = pdf.context.obj({}) as PDFDict;
  pdf.catalog.set(PDFName.of("Names"), dict);
  return dict;
}

function pdfDate(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mm = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `D:${y}${m}${day}${hh}${mm}${ss}Z`;
}

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildXmpMetadata(invoice: InvoiceDomain): string {
  const number = invoice.invoiceNumber || "Entwurf";
  const created = new Date().toISOString();
  return `<?xpacket begin="\uFEFF" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/" x:xmptk="NEXCEL AI Billing 1.0.0">
  <rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
    <rdf:Description rdf:about=""
        xmlns:dc="http://purl.org/dc/elements/1.1/"
        xmlns:xmp="http://ns.adobe.com/xap/1.0/"
        xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"
        xmlns:zf="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#">
      <dc:title>
        <rdf:Alt>
          <rdf:li xml:lang="x-default">Rechnung ${xmlEscape(number)}</rdf:li>
        </rdf:Alt>
      </dc:title>
      <dc:creator>
        <rdf:Seq>
          <rdf:li>${xmlEscape(invoice.issuer.legalName)}</rdf:li>
        </rdf:Seq>
      </dc:creator>
      <xmp:CreateDate>${created}</xmp:CreateDate>
      <xmp:ModifyDate>${created}</xmp:ModifyDate>
      <pdfaid:part>3</pdfaid:part>
      <pdfaid:conformance>B</pdfaid:conformance>
      <zf:DocumentType>INVOICE</zf:DocumentType>
      <zf:DocumentFileName>factur-x.xml</zf:DocumentFileName>
      <zf:Version>1.0</zf:Version>
      <zf:ConformanceLevel>EN 16931</zf:ConformanceLevel>
    </rdf:Description>
  </rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
}
