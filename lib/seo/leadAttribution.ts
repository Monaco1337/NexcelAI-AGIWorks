/**
 * Lead attribution — privacy-first, server-authoritative.
 *
 * Attributes an inbound lead to its brand, entry page, channel and (optional)
 * campaign. Design rules:
 *  - The BRAND is always re-derived server-side from the request host
 *    (config/seo/domains.ts). It is NEVER trusted from the client.
 *  - No PII, no full query strings, no third-party fingerprints. Only the
 *    allow-listed UTM keys are kept, each length-capped.
 *  - Deterministic + pure, so the SEO-CI (`seo:lead-map`) can self-test it.
 *
 * Legal basis: a lead is a user-initiated inquiry (Art. 6(1)(b) DSGVO); the
 * low-risk, non-PII attribution metadata is processed to handle that inquiry.
 */

import { hostToBrand, cleanAgiPath, type BrandKey } from "@/config/seo/domains";

export type LeadChannel =
  | "organic"
  | "direct"
  | "referral"
  | "paid"
  | "email"
  | "social"
  | "unknown";

export interface RawAttributionInput {
  /** Request host (server-authoritative for brand). */
  host?: string | null;
  /** First-touch landing path captured client-side. */
  landingPath?: string | null;
  /** Referrer URL or bare host captured client-side. */
  referrer?: string | null;
  /** Raw UTM params captured client-side (only allow-listed keys are kept). */
  utm?: Record<string, string | undefined | null> | null;
  /** ISO timestamp of first touch (client). Validated + defaulted server-side. */
  firstSeenAt?: string | null;
  /** Fallback brand when the host is unknown/local/preview. */
  fallbackBrand?: BrandKey;
}

export interface LeadAttribution {
  brand: BrandKey;
  landingPath: string;
  referrerHost: string | null;
  channel: LeadChannel;
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  firstSeenAt: string;
}

/** Known search-engine hosts → organic. */
const SEARCH_HOSTS = [
  "google.",
  "bing.",
  "duckduckgo.",
  "ecosia.",
  "yahoo.",
  "yandex.",
  "baidu.",
  "startpage.",
  "search.brave.",
  "qwant.",
];

/** Known social hosts → social (when no explicit medium). */
const SOCIAL_HOSTS = [
  "facebook.",
  "fb.",
  "instagram.",
  "linkedin.",
  "lnkd.in",
  "twitter.",
  "x.com",
  "t.co",
  "youtube.",
  "youtu.be",
  "tiktok.",
  "pinterest.",
  "reddit.",
  "threads.",
  "xing.",
];

export const UTM_ALLOWLIST = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
] as const;

const PAID_MEDIUMS = ["cpc", "ppc", "paid", "paidsearch", "paid_social", "display", "cpm", "banner"];
const EMAIL_MEDIUMS = ["email", "e-mail", "newsletter", "mail"];
const SOCIAL_MEDIUMS = ["social", "social-network", "social_media", "sm", "paid_social"];

const MAX_UTM_LEN = 120;
const MAX_PATH_LEN = 256;

function hostFromReferrer(referrer: string | null | undefined): string | null {
  if (!referrer) return null;
  const raw = referrer.trim();
  if (!raw) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    return url.host.toLowerCase() || null;
  } catch {
    return null;
  }
}

function matchesAny(host: string, needles: string[]): boolean {
  return needles.some((n) => host === n || host.includes(n));
}

/** Classify the marketing channel. Explicit UTM medium wins over referrer. */
export function classifyChannel(
  referrerHost: string | null,
  medium?: string | null
): LeadChannel {
  const m = (medium ?? "").toLowerCase().trim();
  if (m) {
    if (PAID_MEDIUMS.includes(m)) return "paid";
    if (EMAIL_MEDIUMS.includes(m)) return "email";
    if (SOCIAL_MEDIUMS.includes(m)) return "social";
    if (m === "organic") return "organic";
    if (m === "referral") return "referral";
  }
  if (!referrerHost) return "direct";
  if (matchesAny(referrerHost, SEARCH_HOSTS)) return "organic";
  if (matchesAny(referrerHost, SOCIAL_HOSTS)) return "social";
  return "referral";
}

function sanitizePath(path: string | null | undefined): string {
  if (!path || typeof path !== "string") return "/";
  const clean = cleanAgiPath(path.split(/[?#]/)[0] || "/") || "/";
  if (!clean.startsWith("/")) return "/";
  const trimmed = clean.length > 1 ? clean.replace(/\/$/, "") : clean;
  return trimmed.slice(0, MAX_PATH_LEN) || "/";
}

function sanitizeUtmValue(value: string | null | undefined): string | undefined {
  if (value == null) return undefined;
  const v = String(value).trim();
  if (!v) return undefined;
  // Strip control chars; keep it short and boring.
  return v.replace(/[\u0000-\u001f\u007f]/g, "").slice(0, MAX_UTM_LEN) || undefined;
}

/** Keep only allow-listed UTM keys, sanitized. */
export function sanitizeUtm(
  utm: Record<string, string | undefined | null> | null | undefined
): Partial<Record<(typeof UTM_ALLOWLIST)[number], string>> {
  const out: Partial<Record<(typeof UTM_ALLOWLIST)[number], string>> = {};
  if (!utm) return out;
  for (const key of UTM_ALLOWLIST) {
    const val = sanitizeUtmValue(utm[key]);
    if (val) out[key] = val;
  }
  return out;
}

function validIsoOrNow(value: string | null | undefined, now: Date): string {
  if (value && typeof value === "string") {
    const t = Date.parse(value);
    if (!Number.isNaN(t)) {
      // Never accept a future timestamp; clamp to now.
      return t > now.getTime() ? now.toISOString() : new Date(t).toISOString();
    }
  }
  return now.toISOString();
}

/**
 * Resolve a full, sanitized LeadAttribution. Brand is server-authoritative.
 */
export function resolveAttribution(
  input: RawAttributionInput,
  now: Date = new Date()
): LeadAttribution {
  const brand = hostToBrand(input.host) ?? input.fallbackBrand ?? "nexcel";
  const referrerHost = hostFromReferrer(input.referrer);
  const utm = sanitizeUtm(input.utm);
  const channel = classifyChannel(referrerHost, utm.utm_medium);

  return {
    brand,
    landingPath: sanitizePath(input.landingPath),
    referrerHost,
    channel,
    source: utm.utm_source,
    medium: utm.utm_medium,
    campaign: utm.utm_campaign,
    term: utm.utm_term,
    content: utm.utm_content,
    firstSeenAt: validIsoOrNow(input.firstSeenAt, now),
  };
}

/** Search-engine + social host lists exported for the CI self-test. */
export const ATTRIBUTION_HOST_SIGNALS = { SEARCH_HOSTS, SOCIAL_HOSTS } as const;
