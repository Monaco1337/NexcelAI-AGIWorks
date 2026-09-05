/**
 * Contact-Extractor.
 *
 * Zieht geschäftliche Kontakte deterministisch aus HTML-Snippets:
 *  - E-Mail-Adressen (inkl. `mailto:` und obfuscated „info (at) domain")
 *  - Telefonnummern (E.164-Normalisierung, Klassifizierung)
 *  - Social-Handles (LinkedIn, Instagram, Facebook, WhatsApp)
 *  - Adressen (aus einfachen Postleitzahl-/Straßen-Mustern)
 *
 * Kein blindes AI-Guessing: alles kommt aus dem tatsächlichen
 * Website-Text. Jede Fundstelle bekommt eine Confidence, die nach
 * Fundort (Impressum > Footer > Body) und Kontext (mailto vs. Fließtext)
 * gestaffelt wird.
 */

import { normalizePhone, type NormalizedPhone } from "./phone";
import { decodeEntities, stripHtml } from "./security/htmlSanitizer";
import type { EmailClassification, PhoneClassification, ContactKind } from "./model";

export interface ExtractedContactBase {
  kind: ContactKind;
  value: string;
  normalizedValue: string | null;
  classification: PhoneClassification | EmailClassification | null;
  confidence: number;
  context: string;
}

export interface ExtractedContacts {
  emails: ExtractedContactBase[];
  phones: ExtractedContactBase[];
  socials: ExtractedContactBase[];
  addresses: string[];
  contactForms: string[];
}

const EMAIL_REGEX =
  /(?:mailto:)?([a-z0-9._+-]+(?:\s*\(\s*at\s*\)\s*|\s*\[\s*at\s*\]\s*|@)[a-z0-9.-]+\s*(?:\(\s*dot\s*\)\s*|\[\s*dot\s*\]\s*|\.)\s*[a-z]{2,24})/gi;

const PHONE_TEXT_REGEX =
  /(?:tel:)?(\+?\d[\d\s().\/-]{6,}\d)/g;

const LINKEDIN_REGEX = /https?:\/\/(?:www\.)?linkedin\.com\/(?:in|company)\/[a-z0-9-_%.]+/gi;
const INSTAGRAM_REGEX = /https?:\/\/(?:www\.)?instagram\.com\/[a-z0-9._-]+/gi;
const FACEBOOK_REGEX = /https?:\/\/(?:www\.)?facebook\.com\/[a-z0-9.\-_]+/gi;
const WHATSAPP_REGEX = /https?:\/\/(?:wa\.me|api\.whatsapp\.com)\/(?:send\?[^"'<>\s]+|\d+)/gi;

const CONTACT_FORM_HINTS = [/kontakt/i, /contact/i, /anfrage/i, /request/i, /formular/i];
const IMPRESSUM_HINTS = [/impressum/i, /imprint/i, /legal[- ]notice/i];
const FOOTER_HINTS = [/<footer\b/i, /class=["'][^"']*footer/i];

export function extractContactsFromHtml(
  html: string,
  baseUrl?: string,
  defaultCountry: string = "DE"
): ExtractedContacts {
  const parsed = stripHtml(html);
  const text = decodeEntities(html); // volle Roh-Textbasis für Regex, inkl. Entities

  const impressum = matchesAny(html, IMPRESSUM_HINTS);
  const inFooter = matchesAny(html, FOOTER_HINTS);
  const baseConfidence = impressum ? 0.95 : inFooter ? 0.8 : 0.7;

  const emails = extractEmails(text, baseConfidence);
  const phones = extractPhones(text, defaultCountry, baseConfidence);
  const socials = extractSocials(text);
  const addresses = extractAddresses(parsed.text);
  const contactForms = extractContactFormLinks(parsed.links, baseUrl);

  return {
    emails: dedupePreferHigherConfidence(emails),
    phones: dedupePreferHigherConfidence(phones),
    socials,
    addresses,
    contactForms,
  };
}

function extractEmails(text: string, baseConfidence: number): ExtractedContactBase[] {
  const out: ExtractedContactBase[] = [];
  const found = new Set<string>();
  let match: RegExpExecArray | null;
  EMAIL_REGEX.lastIndex = 0;
  while ((match = EMAIL_REGEX.exec(text)) !== null) {
    const candidate = match[1]
      .replace(/\s*\(\s*at\s*\)\s*/gi, "@")
      .replace(/\s*\[\s*at\s*\]\s*/gi, "@")
      .replace(/\s*\(\s*dot\s*\)\s*/gi, ".")
      .replace(/\s*\[\s*dot\s*\]\s*/gi, ".")
      .replace(/\s+/g, "")
      .toLowerCase();

    if (!/^[a-z0-9._+-]+@[a-z0-9.-]+\.[a-z]{2,24}$/.test(candidate)) continue;
    if (found.has(candidate)) continue;
    found.add(candidate);

    const classification = classifyEmail(candidate);
    const cwas = candidate.includes("mailto:") ? 0.05 : 0;
    const confidence = clamp(baseConfidence + cwas + (classification === "DIRECT_DECISION_MAKER" ? 0.05 : 0), 0, 0.99);

    out.push({
      kind: "email",
      value: candidate,
      normalizedValue: candidate,
      classification,
      confidence,
      context: classification === "DIRECT_DECISION_MAKER" ? "direkte Adresse" : "auf Website gefunden",
    });
  }
  return out;
}

function extractPhones(text: string, defaultCountry: string, baseConfidence: number): ExtractedContactBase[] {
  const out: ExtractedContactBase[] = [];
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  PHONE_TEXT_REGEX.lastIndex = 0;
  while ((match = PHONE_TEXT_REGEX.exec(text)) !== null) {
    const raw = match[1];
    const normalized: NormalizedPhone | null = normalizePhone(raw, defaultCountry);
    if (!normalized) continue;
    if (seen.has(normalized.normalized)) continue;
    seen.add(normalized.normalized);

    const kind: ContactKind =
      normalized.classification === "BUSINESS_MOBILE" ? "mobile" : "phone";
    const confidence = clamp(baseConfidence + (raw.includes("tel:") ? 0.05 : 0), 0, 0.98);

    out.push({
      kind,
      value: normalized.display,
      normalizedValue: normalized.normalized,
      classification: normalized.classification,
      confidence,
      context: raw.includes("tel:") ? "tel:-Link" : "Fließtext",
    });
  }
  return out;
}

function extractSocials(text: string): ExtractedContactBase[] {
  const out: ExtractedContactBase[] = [];
  addFirstMatches(text, LINKEDIN_REGEX, "linkedin", out, 0.95);
  addFirstMatches(text, INSTAGRAM_REGEX, "instagram", out, 0.75);
  addFirstMatches(text, FACEBOOK_REGEX, "facebook", out, 0.75);
  addFirstMatches(text, WHATSAPP_REGEX, "whatsapp", out, 0.85);
  return out;
}

function addFirstMatches(
  text: string,
  regex: RegExp,
  kind: ContactKind,
  out: ExtractedContactBase[],
  confidence: number,
  limit = 3
) {
  const seen = new Set<string>();
  let match: RegExpExecArray | null;
  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null && seen.size < limit) {
    const value = match[0];
    if (seen.has(value)) continue;
    seen.add(value);
    out.push({
      kind,
      value,
      normalizedValue: value.toLowerCase(),
      classification: null,
      confidence,
      context: "Website-Link",
    });
  }
}

function extractAddresses(text: string): string[] {
  const results: string[] = [];
  const regex = /([A-ZÄÖÜ][A-Za-zäöüß\-\s]{2,60}\s+\d{1,4}[a-zA-Z]?),?\s+(\d{4,5})\s+([A-ZÄÖÜ][A-Za-zäöüß\-\s]{2,60})/g;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((match = regex.exec(text)) !== null && results.length < 3) {
    const [full] = match;
    const key = full.replace(/\s+/g, " ").trim();
    if (seen.has(key)) continue;
    seen.add(key);
    results.push(key);
  }
  return results;
}

function extractContactFormLinks(
  links: Array<{ href: string; text: string }>,
  baseUrl?: string
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const link of links) {
    const label = `${link.href} ${link.text}`;
    if (!CONTACT_FORM_HINTS.some((r) => r.test(label))) continue;
    let absolute = link.href;
    if (baseUrl) {
      try {
        absolute = new URL(link.href, baseUrl).toString();
      } catch {
        continue;
      }
    }
    try {
      const parsed = new URL(absolute);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") continue;
    } catch {
      continue;
    }
    if (seen.has(absolute)) continue;
    seen.add(absolute);
    out.push(absolute);
    if (out.length >= 5) break;
  }
  return out;
}

export function classifyEmail(email: string): EmailClassification {
  const local = email.split("@")[0] ?? "";
  const dotted = local.includes(".") || local.includes("-");
  const isGeneral = /^(info|kontakt|contact|hallo|hello|hi|office|team|mail|email|welcome)$/i.test(local);
  const isDepartment = /^(marketing|sales|vertrieb|support|hr|jobs|karriere|einkauf|finance|buchhaltung|it|admin)$/i.test(local);

  if (isGeneral) return "GENERAL";
  if (isDepartment) return "DEPARTMENT";
  if (dotted && local.length >= 5) return "DIRECT_DECISION_MAKER";
  return "UNKNOWN";
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function dedupePreferHigherConfidence(items: ExtractedContactBase[]): ExtractedContactBase[] {
  const map = new Map<string, ExtractedContactBase>();
  for (const item of items) {
    const key = `${item.kind}:${item.normalizedValue ?? item.value}`;
    const existing = map.get(key);
    if (!existing || item.confidence > existing.confidence) {
      map.set(key, item);
    }
  }
  return Array.from(map.values());
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
