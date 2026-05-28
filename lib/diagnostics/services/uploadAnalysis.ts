/**
 * NEXCEL AI · Diagnostik · Upload-Inhalts-Analyse
 *
 * Aus Uploads extrahieren wir, was OHNE externe Dienste machbar ist:
 *   - Text aus Plain-Text/CSV/JSON/MD
 *   - "Tool-Mentions" via Stichwortliste (CRM-Namen, Excel, WhatsApp, etc.)
 *   - Datei-Metadaten (Typ, Größe)
 *
 * PDFs/Office-Dokumente liefern wir bewusst NICHT als "geparst" zurück, wenn
 * wir keine sichere Library haben — wir markieren sie als "binary, mime: …"
 * und das `extractedText` bleibt leer. Das ist ehrliche Degradation statt Fake.
 */

import type { AnalysisUpload } from "../types";

const TEXT_LIKE_MIME_PREFIXES = [
  "text/",
  "application/json",
  "application/xml",
  "application/yaml",
  "application/x-yaml",
  "application/javascript",
  "application/x-sh",
  "application/sql",
];

const KNOWN_TOOL_KEYWORDS = [
  "hubspot",
  "salesforce",
  "pipedrive",
  "zoho",
  "monday",
  "asana",
  "trello",
  "slack",
  "teams",
  "whatsapp",
  "telegram",
  "excel",
  ".xls",
  ".xlsx",
  "google sheets",
  "spreadsheet",
  "notion",
  "airtable",
  "jira",
  "confluence",
  "outlook",
  "gmail",
  "mailchimp",
  "klaviyo",
  "brevo",
  "sendgrid",
  "stripe",
  "paypal",
  "klarna",
  "sap",
  "datev",
  "lexware",
  "sevdesk",
  "fastbill",
  "shopify",
  "woocommerce",
  "shopware",
  "magento",
  "wordpress",
  "wix",
  "squarespace",
  "calendly",
  "cal.com",
  "zapier",
  "make.com",
  "n8n",
  "onoffice",
  "flowfact",
  "propstack",
  "immobilienscout",
  "immoware",
];

export interface UploadInsights {
  extractedText: string;
  toolMentions: string[];
  totalBytes: number;
  mimeTypes: string[];
}

function isTextLike(mime: string): boolean {
  const m = mime.toLowerCase();
  return TEXT_LIKE_MIME_PREFIXES.some((p) => m.startsWith(p));
}

export function extractInsights(
  uploads: AnalysisUpload[],
  rawTextsByUploadId: Map<string, string>,
): UploadInsights {
  const texts: string[] = [];
  let totalBytes = 0;
  const mimeTypes = new Set<string>();

  for (const u of uploads) {
    totalBytes += u.bytes;
    mimeTypes.add(u.mimeType);
    const raw = rawTextsByUploadId.get(u.id);
    if (raw && isTextLike(u.mimeType)) {
      texts.push(raw);
    }
    // Auch der Dateiname kann Hinweise enthalten — z. B. "kundenliste-excel.xlsx"
    texts.push(u.filename);
  }

  const concatenated = texts.join("\n").slice(0, 80_000);
  const lower = concatenated.toLowerCase();

  const mentioned = new Set<string>();
  for (const kw of KNOWN_TOOL_KEYWORDS) {
    if (lower.includes(kw)) mentioned.add(kw);
  }

  return {
    extractedText: concatenated,
    toolMentions: Array.from(mentioned),
    totalBytes,
    mimeTypes: Array.from(mimeTypes),
  };
}
