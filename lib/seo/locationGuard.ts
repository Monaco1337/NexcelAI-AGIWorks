/**
 * Location guard — prevents fake local-SEO signals.
 *
 * The registered addresses are LEGAL addresses only (isPublicOfficeClaimAllowed
 * === false). This guard blocks:
 *  - Public office / storefront / "visit us" claims.
 *  - Opening-hours claims (no fake hours).
 *  - Geo-coordinate claims (no fake coordinates).
 *  - "Office / branch in <City>" for any city other than the real legal city.
 *
 * Registry-based by default; most value comes from scanning rendered DOM text
 * (documented as partial coverage without DOM).
 *
 * CI-only module: not imported by the Next app graph.
 */

import { BUSINESS_LOCATIONS } from "@/config/businessLocations";
import { PAGE_REGISTRY, type SeoPage } from "@/config/seo/pageRegistry";
import type { BrandKey } from "@/config/seo/domains";
import { blocker, info, type Finding } from "./findings";

export interface LocationCheckInput {
  brand: BrandKey;
  pageId: string;
  path: string;
  text: string;
}

const OFFICE_CLAIM_PATTERNS: RegExp[] = [
  /\bbesuchen\s+sie\s+uns\b/i,
  /\bvor\s+ort\s+in\s+unserem\s+b(ü|u)ro\b/i,
  /\bunser\s+(b(ü|u)ro|standort|ladenlokal|gesch(ä|a)ft|filiale)\b/i,
  /\bkommen\s+sie\s+vorbei\b/i,
  /\bwalk[-\s]?in\b/i,
  /\bshowroom\b/i,
];

const OPENING_HOURS_PATTERNS: RegExp[] = [
  /\b(ö|o)ffnungszeiten\b/i,
  /\bmo(n)?\s*[-–]\s*(fr|do|sa)\b/i,
  /\bge(ö|o)ffnet\s+(von|ab)\b/i,
  /\b\d{1,2}[:.]\d{2}\s*[-–]\s*\d{1,2}[:.]\d{2}\s*uhr\b/i,
];

const GEO_PATTERNS: RegExp[] = [
  /\b\d{1,2}\.\d{4,}\s*,\s*\d{1,2}\.\d{4,}\b/, // lat, long
  /\b(lat|latitude|lng|long|longitude)\s*[:=]\s*-?\d+\.\d+/i,
];

/** "Büro/Standort/Filiale in <City>" capture. */
const OFFICE_IN_CITY = /\b(b(ü|u)ro|standort|filiale|niederlassung)\s+in\s+([A-ZÄÖÜ][\wäöüß-]+)/gi;

export function checkLocation(input: LocationCheckInput): Finding[] {
  const findings: Finding[] = [];
  const meta = { brand: input.brand, pageId: input.pageId, path: input.path };
  const loc = BUSINESS_LOCATIONS[input.brand];
  const text = input.text ?? "";

  if (!loc.isPublicOfficeClaimAllowed) {
    for (const re of OFFICE_CLAIM_PATTERNS) {
      const m = text.match(re);
      if (m) findings.push(blocker("PUBLIC_OFFICE_CLAIM", `Public office claim: "${m[0]}"`, meta));
    }
  }

  for (const re of OPENING_HOURS_PATTERNS) {
    const m = text.match(re);
    if (m) findings.push(blocker("OPENING_HOURS_CLAIM", `Opening-hours claim: "${m[0]}"`, meta));
  }

  for (const re of GEO_PATTERNS) {
    const m = text.match(re);
    if (m) findings.push(blocker("GEO_COORDINATES", `Geo-coordinate claim: "${m[0]}"`, meta));
  }

  let match: RegExpExecArray | null;
  OFFICE_IN_CITY.lastIndex = 0;
  while ((match = OFFICE_IN_CITY.exec(text)) !== null) {
    const city = match[3];
    if (city && city.toLowerCase() !== loc.city.toLowerCase()) {
      findings.push(
        blocker(
          "FAKE_OFFICE_LOCATION",
          `Office claim for "${city}" but legal city is "${loc.city}"`,
          { ...meta, detail: match[0] }
        )
      );
    }
  }

  return findings;
}

export function checkRegistryLocations(
  bodyByPageId: Record<string, string> = {},
  pages: SeoPage[] = PAGE_REGISTRY
): Finding[] {
  const findings: Finding[] = [];
  for (const p of pages) {
    const text = `${p.title}\n${p.description}\n${bodyByPageId[p.id] ?? ""}`;
    findings.push(
      ...checkLocation({ brand: p.brand, pageId: p.id, path: p.path, text })
    );
  }
  if (findings.length === 0) {
    findings.push(
      info(
        "LOCATION_OK",
        `No fake location claims found in ${pages.length} pages (registry text; DOM coverage partial)`
      )
    );
  }
  return findings;
}
