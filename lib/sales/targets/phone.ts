/**
 * Deterministische Telefonnummer-Normalisierung nach E.164 (Fokus DACH).
 *
 * Bewusst OHNE `libphonenumber`-Dependency, um Bundle-Größe und
 * Runtime-Kosten klein zu halten. Für die Zielsprache DE/AT/CH reicht
 * eine kontextgetriebene Heuristik. Für unbekannte Formate liefern wir
 * transparent `null` zurück statt zu raten — das erhält die
 * Confidence-Semantik des Systems.
 */

import type { PhoneClassification } from "./model";

const COUNTRY_PREFIXES: Record<string, string> = {
  DE: "49",
  AT: "43",
  CH: "41",
  FR: "33",
  NL: "31",
  BE: "32",
  LU: "352",
  IT: "39",
  ES: "34",
};

export interface NormalizedPhone {
  normalized: string;
  display: string;
  country: string | null;
  classification: PhoneClassification;
}

export function normalizePhone(raw: string, defaultCountry: string = "DE"): NormalizedPhone | null {
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "");
  if (!cleaned) return null;

  let e164: string | null = null;
  let country: string | null = null;

  if (cleaned.startsWith("+")) {
    e164 = cleaned;
    country = detectCountryFromE164(cleaned);
  } else if (cleaned.startsWith("00")) {
    e164 = `+${cleaned.slice(2)}`;
    country = detectCountryFromE164(e164);
  } else if (cleaned.startsWith("0")) {
    const prefix = COUNTRY_PREFIXES[defaultCountry.toUpperCase()] ?? "49";
    e164 = `+${prefix}${cleaned.slice(1)}`;
    country = defaultCountry.toUpperCase();
  } else {
    // Fallback: unbekannt, aber wenn genügend Ziffern, geben wir vorsichtig defaultCountry an
    const prefix = COUNTRY_PREFIXES[defaultCountry.toUpperCase()] ?? "49";
    if (cleaned.length >= 8 && cleaned.length <= 14) {
      e164 = `+${prefix}${cleaned}`;
      country = defaultCountry.toUpperCase();
    } else {
      return null;
    }
  }

  if (!/^\+\d{6,15}$/.test(e164)) {
    return null;
  }

  const classification = classifyPhone(e164, country);
  const display = formatDisplay(e164, country);

  return { normalized: e164, display, country, classification };
}

function detectCountryFromE164(e164: string): string | null {
  const digits = e164.replace(/^\+/, "");
  const sortedEntries = Object.entries(COUNTRY_PREFIXES).sort(
    (a, b) => b[1].length - a[1].length
  );
  for (const [country, prefix] of sortedEntries) {
    if (digits.startsWith(prefix)) return country;
  }
  return null;
}

function classifyPhone(e164: string, country: string | null): PhoneClassification {
  if (!country) return "UNKNOWN";
  const digits = e164.replace(/^\+/, "");
  const prefix = COUNTRY_PREFIXES[country] ?? "";
  const national = digits.slice(prefix.length);

  if (country === "DE") {
    if (national.startsWith("15") || national.startsWith("16") || national.startsWith("17")) {
      return "BUSINESS_MOBILE";
    }
    if (national.startsWith("800") || national.startsWith("180")) return "CENTRAL";
    return "BUSINESS_LANDLINE";
  }
  if (country === "AT") {
    if (national.startsWith("6")) return "BUSINESS_MOBILE";
    return "BUSINESS_LANDLINE";
  }
  if (country === "CH") {
    if (national.startsWith("7")) return "BUSINESS_MOBILE";
    return "BUSINESS_LANDLINE";
  }
  return "UNKNOWN";
}

function formatDisplay(e164: string, country: string | null): string {
  if (!country) return e164;
  const digits = e164.replace(/^\+/, "");
  const prefix = COUNTRY_PREFIXES[country] ?? "";
  const national = digits.slice(prefix.length);
  if (country === "DE") {
    if (national.length <= 4) return `+${prefix} ${national}`;
    const areaLen = national.startsWith("1") ? 3 : national.length > 10 ? 4 : 3;
    const area = national.slice(0, areaLen);
    const rest = national.slice(areaLen);
    return `+${prefix} ${area} ${rest}`.trim();
  }
  return `+${prefix} ${national}`;
}

/**
 * Prüft, ob zwei Rohnummern nach Normalisierung identisch sind.
 * Praktisch für Deduplizierung.
 */
export function phonesEqual(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na.normalized === nb.normalized;
}
