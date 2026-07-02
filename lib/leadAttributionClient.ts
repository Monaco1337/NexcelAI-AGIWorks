/**
 * Client-side first-touch attribution capture.
 *
 * Captures {landingPath, referrer, utm, firstSeenAt} ONCE per visitor and keeps
 * it first-party in localStorage (`nx_attribution`). It stores no PII and no
 * full query string — only the allow-listed UTM keys. The stored payload is
 * attached to voluntary lead submissions so the server can attribute the lead.
 *
 * First-touch is non-overwriting: the first landing wins for the whole visit.
 */

import { UTM_ALLOWLIST } from "@/lib/seo/leadAttribution";
import { HONEYPOT_FIELD, HONEYPOT_TIME_FIELD } from "@/lib/security/honeypot";

const STORAGE_KEY = "nx_attribution";

export interface StoredAttribution {
  landingPath: string;
  referrer: string | null;
  utm: Record<string, string>;
  firstSeenAt: string;
}

function safeGet(key: string): string | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string): void {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    /* storage disabled — attribution is best-effort */
  }
}

function parseUtm(search: string): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const params = new URLSearchParams(search);
    for (const key of UTM_ALLOWLIST) {
      const v = params.get(key);
      if (v && v.trim()) out[key] = v.trim().slice(0, 120);
    }
  } catch {
    /* ignore */
  }
  return out;
}

/** Capture first-touch attribution once. Safe to call on every page mount. */
export function captureFirstTouch(): void {
  if (typeof window === "undefined") return;
  if (safeGet(STORAGE_KEY)) return; // first-touch wins
  const data: StoredAttribution = {
    landingPath: window.location.pathname || "/",
    referrer: document.referrer || null,
    utm: parseUtm(window.location.search),
    firstSeenAt: new Date().toISOString(),
  };
  safeSet(STORAGE_KEY, JSON.stringify(data));
}

export function getStoredAttribution(): StoredAttribution | null {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAttribution;
  } catch {
    return null;
  }
}

/**
 * Attribution payload for a lead submission. Falls back to the current page if
 * nothing was captured yet (e.g. storage disabled).
 */
export function getAttributionPayload(): StoredAttribution {
  const stored = getStoredAttribution();
  if (stored) return stored;
  if (typeof window === "undefined") {
    return { landingPath: "/", referrer: null, utm: {}, firstSeenAt: new Date().toISOString() };
  }
  return {
    landingPath: window.location.pathname || "/",
    referrer: document.referrer || null,
    utm: parseUtm(window.location.search),
    firstSeenAt: new Date().toISOString(),
  };
}

/** Field names for the hidden honeypot inputs a form should render. */
export const honeypotFieldNames = {
  value: HONEYPOT_FIELD,
  time: HONEYPOT_TIME_FIELD,
} as const;
