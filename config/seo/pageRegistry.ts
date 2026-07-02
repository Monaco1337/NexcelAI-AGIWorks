/**
 * Page Registry — the authoritative list of pages the SEO system knows about.
 *
 * Phase 1 seeds ONLY real, already-existing core routes for both brands. No new
 * Money / Location / Knowledge / Case-Study pages are created here.
 *
 * Indexability model (see config/seo/indexing.ts):
 *  A page is only indexable when ALL are true:
 *    approved === true && manualIndexApproval === true && quality.index === true
 *  Everything else resolves to "noindex, follow".
 *
 * The existing core pages are already live and indexable in production, so they
 * are seeded with approved + manualIndexApproval + quality.index = true. This
 * preserves current behavior while routing it through the new policy. New/draft
 * pages must start non-approved and stay noindex until explicitly promoted.
 */

import { cleanAgiPath, type BrandKey } from "./brands";
import { AGI_INTERNAL_PREFIX } from "./domains";

export type SeoPageType =
  | "home"
  | "money"
  | "tool"
  | "content"
  | "legal";

export interface SeoPageQuality {
  /** Content quality gate verdict. Only true content may be indexed. */
  index: boolean;
  /** Optional 0–100 quality score (Phase 2 quality gate fills this in). */
  score?: number;
}

export interface SeoPage {
  /** Stable id: `${brand}:${path}`. */
  id: string;
  brand: BrandKey;
  /** Clean, public canonical path (what the user sees, e.g. "/preise"). */
  path: string;
  /** Physical app-tree path (AGI pages live under /agiworks/*). */
  internalPath: string;
  type: SeoPageType;
  title: string;
  description: string;
  /** Human breadcrumb label for this node. */
  breadcrumbLabel: string;
  approved: boolean;
  manualIndexApproval: boolean;
  quality: SeoPageQuality;
  /** Sitemap hints (only applied when the page is actually indexable). */
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}

/** Build the internal app-tree path for a brand + clean path. */
function internalPathFor(brand: BrandKey, cleanPath: string): string {
  if (brand !== "agiworks") return cleanPath;
  if (cleanPath === "/") return AGI_INTERNAL_PREFIX;
  return `${AGI_INTERNAL_PREFIX}${cleanPath}`;
}

/** Core-page copy shared per clean path; brand name is injected per brand. */
interface CoreSeed {
  path: string;
  type: SeoPageType;
  breadcrumbLabel: string;
  changefreq: SeoPage["changefreq"];
  priority: number;
  title: (name: string) => string;
  description: (name: string) => string;
}

const CORE_SEEDS: CoreSeed[] = [
  {
    path: "/",
    type: "home",
    breadcrumbLabel: "Start",
    changefreq: "weekly",
    priority: 1.0,
    title: (n) => `${n} · Unternehmenssysteme, Prozesse & digitale Produkte`,
    description: (n) =>
      `${n} gestaltet digitale Unternehmenssysteme: Systemdesign, Prozesse, Automatisierung und Webplattformen für Unternehmen.`,
  },
  {
    path: "/preise",
    type: "money",
    breadcrumbLabel: "Preise",
    changefreq: "monthly",
    priority: 0.8,
    title: (n) => `Preise · ${n}`,
    description: (n) =>
      `Transparente Leistungspakete und Preisorientierung für Projekte mit ${n}.`,
  },
  {
    path: "/preiskalkulator",
    type: "tool",
    breadcrumbLabel: "Preiskalkulator",
    changefreq: "monthly",
    priority: 0.7,
    title: (n) => `Preiskalkulator · ${n}`,
    description: (n) =>
      `Kalkulieren Sie den Rahmen Ihres Projekts mit dem interaktiven Preiskalkulator von ${n}.`,
  },
  {
    path: "/projekte",
    type: "content",
    breadcrumbLabel: "Projekte",
    changefreq: "monthly",
    priority: 0.7,
    title: (n) => `Projekte & Referenzen · ${n}`,
    description: (n) =>
      `Ausgewählte Projekte und umgesetzte Systeme von ${n}.`,
  },
  {
    path: "/systemanalyse",
    type: "tool",
    breadcrumbLabel: "Systemanalyse",
    changefreq: "monthly",
    priority: 0.7,
    title: (n) => `Systemanalyse · ${n}`,
    description: (n) =>
      `Starten Sie die kostenlose Systemanalyse von ${n} und erhalten Sie eine strukturierte Einschätzung Ihrer digitalen Systeme.`,
  },
  {
    path: "/ueber-mich",
    type: "content",
    breadcrumbLabel: "Über",
    changefreq: "yearly",
    priority: 0.5,
    title: (n) => `Über ${n}`,
    description: (n) =>
      `Wer hinter ${n} steht: Ansatz, Arbeitsweise und Verständnis von digitaler Systemarchitektur.`,
  },
  {
    path: "/kontakt",
    type: "content",
    breadcrumbLabel: "Kontakt",
    changefreq: "yearly",
    priority: 0.6,
    title: (n) => `Kontakt · ${n}`,
    description: (n) =>
      `Kontaktieren Sie ${n}. Beschreiben Sie Ihr Projekt – die Rückmeldung erfolgt persönlich.`,
  },
  {
    path: "/impressum",
    type: "legal",
    breadcrumbLabel: "Impressum",
    changefreq: "yearly",
    priority: 0.2,
    title: (n) => `Impressum · ${n}`,
    description: (n) => `Impressum und Anbieterkennzeichnung gemäß § 5 DDG von ${n}.`,
  },
  {
    path: "/datenschutz",
    type: "legal",
    breadcrumbLabel: "Datenschutz",
    changefreq: "yearly",
    priority: 0.2,
    title: (n) => `Datenschutzerklärung · ${n}`,
    description: (n) => `Informationen zum Datenschutz und zur Verarbeitung von Daten bei ${n}.`,
  },
  {
    path: "/cookie-richtlinie",
    type: "legal",
    breadcrumbLabel: "Cookie-Richtlinie",
    changefreq: "yearly",
    priority: 0.2,
    title: (n) => `Cookie-Richtlinie · ${n}`,
    description: (n) =>
      `Informationen zu Cookies und lokalen Speichertechnologien gemäß § 25 TDDDG und DSGVO bei ${n}.`,
  },
  {
    path: "/agb",
    type: "legal",
    breadcrumbLabel: "AGB",
    changefreq: "yearly",
    priority: 0.2,
    title: (n) => `AGB · ${n}`,
    description: (n) => `Allgemeine Geschäftsbedingungen von ${n}.`,
  },
  {
    path: "/vertragsverarbeitung",
    type: "legal",
    breadcrumbLabel: "Auftragsverarbeitung",
    changefreq: "yearly",
    priority: 0.2,
    title: (n) => `Auftragsverarbeitung · ${n}`,
    description: (n) =>
      `Informationen zur Auftragsverarbeitung gemäß Art. 28 DSGVO bei ${n}.`,
  },
];

const BRAND_NAMES: Record<BrandKey, string> = {
  nexcel: "NEXCEL AI",
  agiworks: "AGI Works",
};

function buildRegistry(): SeoPage[] {
  const pages: SeoPage[] = [];
  (["nexcel", "agiworks"] as BrandKey[]).forEach((brand) => {
    const name = BRAND_NAMES[brand];
    CORE_SEEDS.forEach((seed) => {
      pages.push({
        id: `${brand}:${seed.path}`,
        brand,
        path: seed.path,
        internalPath: internalPathFor(brand, seed.path),
        type: seed.type,
        title: seed.title(name),
        description: seed.description(name),
        breadcrumbLabel: seed.breadcrumbLabel,
        // Existing live core pages: approved + manually cleared + quality-indexable.
        approved: true,
        manualIndexApproval: true,
        quality: { index: true, score: 100 },
        changefreq: seed.changefreq,
        priority: seed.priority,
      });
    });
  });
  return pages;
}

export const PAGE_REGISTRY: SeoPage[] = buildRegistry();

/** All registered pages for a brand. */
export function getPagesForBrand(brand: BrandKey): SeoPage[] {
  return PAGE_REGISTRY.filter((p) => p.brand === brand);
}

/**
 * Look up a page by brand + clean public path. Accepts internal /agiworks paths
 * too and normalizes them to the clean public path first.
 */
export function getPage(brand: BrandKey, path: string): SeoPage | undefined {
  const clean = cleanAgiPath(path) || "/";
  const normalized = clean !== "/" ? clean.replace(/\/$/, "") : "/";
  return PAGE_REGISTRY.find((p) => p.brand === brand && p.path === normalized);
}
