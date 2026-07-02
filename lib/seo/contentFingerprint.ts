/**
 * Content fingerprinting — word shingles + Jaccard similarity.
 * Used by the duplicate guard to detect near-duplicate content within a brand
 * and (critically) across the two brands/domains.
 *
 * CI-only module: not imported by the Next app graph.
 */

/** Normalize text: lowercase, strip punctuation, collapse whitespace. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  const n = normalizeText(text);
  return n ? n.split(" ") : [];
}

/** Build a set of k-word shingles (default k=3). */
export function shingles(text: string, k = 3): Set<string> {
  const tokens = tokenize(text);
  const set = new Set<string>();
  if (tokens.length < k) {
    // Fall back to individual tokens for very short texts (titles).
    tokens.forEach((t) => set.add(t));
    return set;
  }
  for (let i = 0; i <= tokens.length - k; i++) {
    set.add(tokens.slice(i, i + k).join(" "));
  }
  return set;
}

/** Jaccard similarity of two sets: |A∩B| / |A∪B|. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const x of a) if (b.has(x)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface Fingerprint {
  id: string;
  shingles: Set<string>;
}

export function fingerprint(id: string, text: string, k = 3): Fingerprint {
  return { id, shingles: shingles(text, k) };
}

export function similarity(a: Fingerprint, b: Fingerprint): number {
  return jaccard(a.shingles, b.shingles);
}
