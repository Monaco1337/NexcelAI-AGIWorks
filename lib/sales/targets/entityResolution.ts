/**
 * Entity Resolution — Deduplizierung für Zielkunden.
 *
 * Ein Master-Datensatz pro reales Unternehmen. Ohne Deduplizierung
 * wird dieselbe Firma in verschiedenen Quellen als „Müller GmbH",
 * „Müller GmbH & Co. KG", „Mueller Sanitär" auftauchen — die Pipeline
 * darf dann nicht viermal enrichen.
 *
 * Der Fingerprint kombiniert normalisierten Namen, Domain, Adresse
 * (Postleitzahl+Straße) und Telefon-E.164. Ein Match zählt, wenn
 * mindestens EIN starkes Signal (Domain oder Telefon) ODER zwei
 * schwache Signale (Name+Ort, Name+PLZ) übereinstimmen.
 */

import { extractDomain } from "./security/safeFetch";
import { normalizePhone } from "./phone";

export interface EntityFingerprintInput {
  name: string;
  legalName?: string | null;
  website?: string | null;
  domain?: string | null;
  phone?: string | null;
  addressLine?: string | null;
  postalCode?: string | null;
  city?: string | null;
  country?: string | null;
  googlePlaceId?: string | null;
}

export interface Fingerprint {
  primary: string;
  parts: {
    nameCore: string;
    domain: string | null;
    phone: string | null;
    addressCore: string | null;
    googlePlaceId: string | null;
  };
}

const LEGAL_SUFFIXES = [
  "gmbh & co. kg",
  "gmbh und co kg",
  "gmbh & co kg",
  "gmbh",
  "mbh",
  "ug (haftungsbeschränkt)",
  "ug",
  "ohg",
  "kg",
  "e.k.",
  "eG",
  "ag",
  "se",
  "b.v.",
  "s.a.",
  "s.r.l.",
  "ltd",
  "llc",
  "inc",
];

const NAME_STOPWORDS = ["der", "die", "das", "und", "the", "for", "of"];

export function buildFingerprint(input: EntityFingerprintInput): Fingerprint {
  const nameCore = normalizeCompanyName(input.legalName || input.name || "");
  const domain = normalizeDomain(input.domain, input.website);
  const phone = normalizePhoneForFingerprint(input.phone);
  const addressCore = normalizeAddressLine(input.addressLine, input.postalCode, input.city);
  const googlePlaceId = input.googlePlaceId?.trim() || null;

  const parts = { nameCore, domain, phone, addressCore, googlePlaceId };

  const primary = [
    googlePlaceId ? `g:${googlePlaceId}` : "",
    domain ? `d:${domain}` : "",
    phone ? `p:${phone}` : "",
    addressCore ? `a:${addressCore}` : "",
    nameCore ? `n:${nameCore}` : "",
  ]
    .filter(Boolean)
    .join("|");

  return { primary, parts };
}

export function normalizeCompanyName(input: string): string {
  let n = (input || "").toLowerCase().normalize("NFKC");
  n = n.replace(/[äáàâãā]/g, "a").replace(/[öóòôõō]/g, "o").replace(/[üúùûū]/g, "u").replace(/[ß]/g, "ss");
  n = n.replace(/&/g, " und ");
  for (const suffix of LEGAL_SUFFIXES) {
    n = n.replace(new RegExp(`\\b${escapeRegex(suffix)}\\b`, "gi"), " ");
  }
  n = n.replace(/[^a-z0-9]+/g, " ");
  n = n
    .split(/\s+/)
    .filter((w) => w && !NAME_STOPWORDS.includes(w))
    .join(" ")
    .trim();
  return n;
}

function normalizeDomain(rawDomain?: string | null, rawWebsite?: string | null): string | null {
  const fromDomain = rawDomain?.trim().toLowerCase() || null;
  if (fromDomain) return fromDomain.replace(/^www\./, "");
  return extractDomain(rawWebsite ?? null);
}

function normalizePhoneForFingerprint(raw?: string | null): string | null {
  if (!raw) return null;
  const n = normalizePhone(raw);
  return n?.normalized ?? null;
}

function normalizeAddressLine(
  addressLine?: string | null,
  postalCode?: string | null,
  city?: string | null
): string | null {
  if (!postalCode && !city && !addressLine) return null;
  const streetCore = (addressLine || "")
    .toLowerCase()
    .replace(/(str\.|straße|strasse)/g, "str")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
  const cityCore = (city || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const plz = (postalCode || "").replace(/\s+/g, "");
  return [plz, cityCore, streetCore].filter(Boolean).join("|");
}

/* -------------------------------------------------------------------------- */
/*  Match                                                                     */
/* -------------------------------------------------------------------------- */

export interface EntityMatch {
  isMatch: boolean;
  confidence: number;
  reasons: string[];
}

export function matchEntities(a: Fingerprint, b: Fingerprint): EntityMatch {
  const reasons: string[] = [];
  let score = 0;

  if (a.parts.googlePlaceId && a.parts.googlePlaceId === b.parts.googlePlaceId) {
    return { isMatch: true, confidence: 0.99, reasons: ["Google Place ID identisch"] };
  }
  if (a.parts.domain && a.parts.domain === b.parts.domain) {
    score += 0.6;
    reasons.push("Domain identisch");
  }
  if (a.parts.phone && a.parts.phone === b.parts.phone) {
    score += 0.5;
    reasons.push("Telefonnummer identisch");
  }
  if (a.parts.addressCore && a.parts.addressCore === b.parts.addressCore) {
    score += 0.4;
    reasons.push("Adresse identisch");
  }
  if (a.parts.nameCore && a.parts.nameCore === b.parts.nameCore) {
    score += 0.3;
    reasons.push("Firmenname (Kern) identisch");
  } else if (a.parts.nameCore && b.parts.nameCore) {
    const sim = nameSimilarity(a.parts.nameCore, b.parts.nameCore);
    if (sim >= 0.85) {
      score += 0.2;
      reasons.push(`Firmenname ähnlich (${(sim * 100).toFixed(0)} %)`);
    }
  }

  const confidence = Math.min(0.99, score);
  return { isMatch: confidence >= 0.6, confidence, reasons };
}

export function nameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const shorter = a.length < b.length ? a : b;
  const longer = a.length < b.length ? b : a;
  if (longer.includes(shorter)) return 0.9;
  const setA = new Set(a.split(""));
  const setB = new Set(b.split(""));
  let intersect = 0;
  setA.forEach((ch) => { if (setB.has(ch)) intersect++; });
  const jaccard = intersect / (setA.size + setB.size - intersect);
  return jaccard;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/* -------------------------------------------------------------------------- */
/*  Merge mit Provenance-Bias                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Wählt beim Merge den Wert mit höherer „source authority" oder Confidence.
 * Für die Erstversion halten wir die Reihenfolge einfach: bestehender Wert
 * bleibt, wenn er nicht leer ist; neuer Wert ersetzt nur bei explizit
 * höherer Confidence.
 */
export function preferValue<T>(current: T | null | undefined, incoming: T | null | undefined, opts?: {
  currentConfidence?: number;
  incomingConfidence?: number;
}): T | null {
  const cur = current ?? null;
  const inc = incoming ?? null;
  if (cur === null || cur === "") return inc as T | null;
  if (inc === null || inc === "") return cur as T | null;
  const cc = opts?.currentConfidence ?? 0.5;
  const ic = opts?.incomingConfidence ?? 0.5;
  return ic > cc ? (inc as T) : (cur as T);
}
