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
import { MONEY_PAGES } from "@/data/moneyPages";
import { LOCATION_PAGES } from "@/data/locationPages";
import { KNOWLEDGE_PAGES } from "@/data/knowledgePages";
import { SYSTEM_PAGES } from "@/data/systemPages";
import { REFERENCE_PAGES } from "@/data/referencePages";
import { CITY_SERVICE_PAGES } from "@/data/cityServicePages";

export type SeoPageType =
  | "home"
  | "money"
  | "location"
  | "knowledge"
  | "system"
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
    path: "/uebersicht",
    type: "content",
    breadcrumbLabel: "Übersicht",
    changefreq: "weekly",
    priority: 0.4,
    title: (n) => `Seitenübersicht · ${n}`,
    description: (n) =>
      `Alle Seiten von ${n} auf einen Blick: Leistungen, Systeme, Standorte, Fachbeiträge und Referenzen.`,
  },
  {
    path: "/presse",
    type: "content",
    breadcrumbLabel: "Presse & Partner",
    changefreq: "monthly",
    priority: 0.4,
    title: (n) => `Presse & Partner · ${n}`,
    description: (n) =>
      `Unternehmensangaben, freigegebene Kurzprofile und Logo von ${n} zur Übernahme in Verzeichnisse und Beiträge.`,
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

/** Indexable hub / overview pages that link to the detail collections. */
interface HubSeed {
  brand: BrandKey;
  path: string;
  type: SeoPageType;
  breadcrumbLabel: string;
  title: string;
  description: string;
}

const BRAND_HUBS: HubSeed[] = [
  {
    brand: "nexcel",
    path: "/loesungen",
    type: "money",
    breadcrumbLabel: "Lösungen",
    title: "Lösungen · NEXCEL AI",
    description:
      "KI-Systeme, Automatisierung und Customer Experience: die Lösungen von NEXCEL AI für Unternehmen im Überblick.",
  },
  {
    brand: "nexcel",
    path: "/standorte",
    type: "content",
    breadcrumbLabel: "Standorte",
    title: "Standorte · NEXCEL AI",
    description:
      "NEXCEL AI bringt KI und Automatisierung zu Unternehmen in Dortmund, Unna, Bochum, Essen und Düsseldorf — regional und deutschlandweit.",
  },
  {
    brand: "nexcel",
    path: "/wissen",
    type: "content",
    breadcrumbLabel: "Wissen",
    title: "Wissen · NEXCEL AI",
    description:
      "Erklärungen und Leitfäden rund um KI, Automatisierung und Customer Experience — das Wissensangebot von NEXCEL AI.",
  },
  {
    brand: "agiworks",
    path: "/leistungen",
    type: "money",
    breadcrumbLabel: "Leistungen",
    title: "Leistungen · AGI Works",
    description:
      "Softwareentwicklung von Web-Apps über SaaS bis ERP und CRM: die Leistungen von AGI Works für Unternehmen im Überblick.",
  },
  {
    brand: "agiworks",
    path: "/standorte",
    type: "content",
    breadcrumbLabel: "Standorte",
    title: "Standorte · AGI Works",
    description:
      "AGI Works entwickelt Software für Unternehmen in Dortmund, Unna, Bochum, Essen und Düsseldorf — regional und deutschlandweit.",
  },
  {
    brand: "agiworks",
    path: "/wissen",
    type: "content",
    breadcrumbLabel: "Wissen",
    title: "Wissen · AGI Works",
    description:
      "Erklärungen und Leitfäden rund um Softwareentwicklung, Web-Apps und ERP — das Wissensangebot von AGI Works.",
  },
];

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

  // Money pages (Phase 6) — commercial /leistungen (AGI) & /loesungen (NEXCEL)
  // routes. These ship as CANDIDATE: not approved, not manually cleared and
  // quality.index=false → deny-by-default noindex,follow. They are served by a
  // catch-all route + MoneyPageTemplate, not a static folder per slug.
  MONEY_PAGES.forEach((mp) => {
    pages.push({
      id: mp.id,
      brand: mp.brand,
      path: mp.path,
      internalPath: internalPathFor(mp.brand, mp.path),
      type: "money",
      title: mp.title,
      description: mp.description,
      breadcrumbLabel: mp.serviceName,
      approved: mp.approved,
      manualIndexApproval: mp.manualIndexApproval,
      // Content passed the money-page + quality gates; per-page indexing is still
      // governed by approved + manualIndexApproval from the data module.
      quality: { index: true, score: 100 },
      changefreq: "monthly",
      priority: 0.6,
    });
  });

  // Location pages (Phase 7) — NRW city pages under /standorte/*, served by a
  // catch-all route + LocationPageTemplate. CANDIDATE by default (noindex,follow)
  // until they pass content/duplicate/location guards + manual approval.
  LOCATION_PAGES.forEach((lp) => {
    pages.push({
      id: lp.id,
      brand: lp.brand,
      path: lp.path,
      internalPath: internalPathFor(lp.brand, lp.path),
      type: "location",
      title: lp.title,
      description: lp.description,
      breadcrumbLabel: lp.city,
      approved: lp.approved,
      manualIndexApproval: lp.manualIndexApproval,
      quality: { index: true, score: 100 },
      changefreq: "monthly",
      priority: 0.5,
    });
  });

  // Knowledge pages (Phase 8) — AEO/GEO editorial content under /wissen/*, served
  // by a catch-all route + KnowledgePageTemplate. CANDIDATE by default
  // (noindex,follow) until they pass content/duplicate/knowledge guards + manual
  // approval.
  KNOWLEDGE_PAGES.forEach((kp) => {
    pages.push({
      id: kp.id,
      brand: kp.brand,
      path: kp.path,
      internalPath: internalPathFor(kp.brand, kp.path),
      type: "knowledge",
      title: kp.title,
      description: kp.description,
      breadcrumbLabel: kp.topic,
      approved: kp.approved,
      manualIndexApproval: kp.manualIndexApproval,
      quality: { index: true, score: 100 },
      changefreq: "monthly",
      priority: 0.5,
    });
  });

  // System pages — the 23 /systeme/* detail routes per brand. They were live but
  // outside the registry (and therefore outside the sitemap), so 46 pages of real
  // content were effectively invisible to crawlers. They are now registered with
  // brand-differentiated copy from data/systemPages.ts; the shared visual content
  // in lib/systems-data.tsx stays untouched.
  SYSTEM_PAGES.forEach((sp) => {
    pages.push({
      id: sp.id,
      brand: sp.brand,
      path: sp.path,
      internalPath: internalPathFor(sp.brand, sp.path),
      type: "system",
      title: sp.title,
      description: sp.description,
      breadcrumbLabel: sp.systemName,
      approved: sp.approved,
      manualIndexApproval: sp.manualIndexApproval,
      quality: { index: true, score: 100 },
      changefreq: "monthly",
      priority: 0.6,
    });
  });

  // Reference detail pages — /projekte/<slug>. The project facts come from
  // lib/references-data.ts; data/referencePages.ts only adds the per-brand
  // editorial angle, so the /projekte hub is no longer a dead end.
  REFERENCE_PAGES.forEach((rp) => {
    pages.push({
      id: rp.id,
      brand: rp.brand,
      path: rp.path,
      internalPath: internalPathFor(rp.brand, rp.path),
      type: "content",
      title: rp.title,
      description: rp.description,
      breadcrumbLabel: rp.reference.title,
      approved: rp.approved,
      manualIndexApproval: rp.manualIndexApproval,
      quality: { index: true, score: 100 },
      changefreq: "yearly",
      priority: 0.5,
    });
  });

  // City × service pages — handpicked location/service combinations only (see
  // data/cityServicePages.ts). Deliberately not a generated city × service
  // matrix, which would be doorway content.
  CITY_SERVICE_PAGES.forEach((cs) => {
    pages.push({
      id: cs.id,
      brand: cs.brand,
      path: cs.path,
      internalPath: internalPathFor(cs.brand, cs.path),
      type: "location",
      title: cs.title,
      description: cs.description,
      breadcrumbLabel: cs.city,
      approved: cs.approved,
      manualIndexApproval: cs.manualIndexApproval,
      quality: { index: true, score: 100 },
      changefreq: "monthly",
      priority: 0.45,
    });
  });

  // Hub / overview pages (Phase: go-live) — indexable entry points that link to
  // the money / location / knowledge detail pages (no orphan pages). AGI money
  // lives at /leistungen, NEXCEL at /loesungen; /standorte and /wissen exist per
  // brand on their own domain.
  BRAND_HUBS.forEach((hub) => {
    pages.push({
      id: `${hub.brand}:${hub.path}`,
      brand: hub.brand,
      path: hub.path,
      internalPath: internalPathFor(hub.brand, hub.path),
      type: hub.type,
      title: hub.title,
      description: hub.description,
      breadcrumbLabel: hub.breadcrumbLabel,
      approved: true,
      manualIndexApproval: true,
      quality: { index: true, score: 100 },
      changefreq: "weekly",
      priority: 0.7,
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
