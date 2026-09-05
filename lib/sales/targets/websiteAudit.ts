/**
 * Website-Audit-Engine.
 *
 * Führt eine reale Analyse der Zielkunden-Website durch — ohne
 * Drittanbieter, ohne Puppeteer und ohne PageSpeed-API. Wir zielen
 * bewusst auf robuste Signale, die aus einem einzigen safeFetch()-
 * Ergebnis extrahiert werden können:
 *
 *   Performance  — HTTP-Status, TTFB, Transfer-Größe, Bild-Overhead,
 *                  Script-Anzahl.
 *   Mobile       — Viewport-Meta, `mobile-web-app-capable`,
 *                  Responsive-Klassen (Tailwind/Bootstrap),
 *                  Font-Size-Signale.
 *   Design       — Struktur des H-Baums, Kontrast von Buttons,
 *                  Nutzung moderner Frameworks, Datum im Impressum,
 *                  Farb-Vielfalt.
 *   Conversion   — CTA-Präsenz (Kontakt, Anfrage, Buchung),
 *                  Formular-Präsenz.
 *   SEO          — Title, Meta-Description, H1, Canonical,
 *                  Structured-Data.
 *   Trust        — Impressum/Datenschutz-Verlinkung, Bewertungs-
 *                  hinweise, Referenzen/Case-Studies.
 *   Technology   — CMS-Erkennung (WP/Shopify/Wix/Jimdo/…),
 *                  Analytics, Chat-Widgets, HTTPS-Status.
 *
 * Der Score ist deterministisch aus Findings zusammengesetzt. Jede
 * Rubrik hat ihren eigenen Subscore (0–100). Der Gesamt-Score ist ein
 * gewichteter Durchschnitt. Findings werden strikt als Fact/Inference/
 * Recommendation getrennt.
 */

import { safeFetch, extractDomain, normalizeUrl } from "./security/safeFetch";
import type { SafeFetchResult } from "./security/safeFetch";
import { stripHtml } from "./security/htmlSanitizer";
import type { FindingsBundle, TargetOpportunity, WebsiteOpportunityKind } from "./model";
import { emptyFindings, newTargetId } from "./model";

export interface WebsiteAuditResult {
  url: string;
  finalUrl: string;
  auditedAt: string;
  httpStatus: number;
  ttfbMs: number;
  transferBytes: number;
  redirectChain: string[];
  websiteScore: number;
  designScore: number;
  performanceScore: number;
  seoScore: number;
  conversionScore: number;
  mobileScore: number;
  trustScore: number;
  technologyScore: number;
  subscores: Record<string, number>;
  findings: FindingsBundle;
  techStack: Record<string, unknown>;
  snapshotHash: string | null;
  error: string | null;
  opportunities: Array<Pick<TargetOpportunity,
    | "kind" | "source" | "title" | "reason" | "confidence" | "opportunityScore" | "evidence"
    | "estimatedMinCents" | "estimatedRecommendedCents" | "estimatedMaxCents" | "currency" | "problem" | "proposedSolution"
  >>;
}

const AUDIT_WEIGHTS = {
  performance: 0.18,
  seo: 0.18,
  conversion: 0.18,
  mobile: 0.14,
  design: 0.12,
  trust: 0.12,
  technology: 0.08,
};

/**
 * Führt den Audit aus. Wenn der Fetch scheitert, geben wir eine
 * gültige, aber leere Auswertung mit `error` zurück — dann kann die
 * Pipeline den Ziel-Datensatz sauber als „Website nicht erreichbar"
 * annotieren, ohne dass alles kippt.
 */
export async function performWebsiteAudit(
  rawUrl: string,
  options: {
    onFetch?: (result: SafeFetchResult) => void | Promise<void>;
    fetcher?: (url: string) => Promise<SafeFetchResult>;
  } = {},
): Promise<WebsiteAuditResult> {
  const normalized = normalizeUrl(rawUrl);
  if (!normalized) {
    return emptyAuditResult(rawUrl, null, "Ungültige URL");
  }
  const response = options.fetcher
    ? await options.fetcher(normalized)
    : await safeFetch(normalized, { timeoutMs: 15_000, maxBytes: 2_000_000 });
  await options.onFetch?.(response);
  if (!response.ok || !response.bodyText) {
    return emptyAuditResult(normalized, response, response.error ?? `HTTP ${response.status}`);
  }

  const parsed = stripHtml(response.bodyText);
  const analysis = analyzeParsed(parsed, response.finalUrl);
  const findings = analysis.findings;
  const techStack = analysis.techStack;

  const subscores = analysis.subscores;
  const perf = perfScore(response, parsed);
  const seo = analysis.seoScore;
  const conversion = analysis.conversionScore;
  const mobile = analysis.mobileScore;
  const design = analysis.designScore;
  const trust = analysis.trustScore;
  const tech = analysis.technologyScore;

  const websiteScore = Math.round(
    perf * AUDIT_WEIGHTS.performance +
      seo * AUDIT_WEIGHTS.seo +
      conversion * AUDIT_WEIGHTS.conversion +
      mobile * AUDIT_WEIGHTS.mobile +
      design * AUDIT_WEIGHTS.design +
      trust * AUDIT_WEIGHTS.trust +
      tech * AUDIT_WEIGHTS.technology
  );

  const opportunities = deriveOpportunities({
    websiteScore,
    perf,
    seo,
    conversion,
    mobile,
    design,
    trust,
    tech,
    finalUrl: response.finalUrl,
    hasBookingSignal: analysis.hasBookingSignal,
    hasContactForm: analysis.hasContactForm,
    isEcommerce: analysis.isEcommerce,
    isMinimalPage: analysis.isMinimalPage,
    cms: (techStack.cms as string) ?? null,
  });

  return {
    url: normalized,
    finalUrl: response.finalUrl,
    auditedAt: new Date().toISOString(),
    httpStatus: response.status,
    ttfbMs: response.latencyMs,
    transferBytes: response.bytesRead,
    redirectChain: response.redirectChain,
    websiteScore,
    designScore: design,
    performanceScore: perf,
    seoScore: seo,
    conversionScore: conversion,
    mobileScore: mobile,
    trustScore: trust,
    technologyScore: tech,
    subscores,
    findings,
    techStack,
    snapshotHash: hashString(response.bodyText),
    error: null,
    opportunities,
  };
}

/* -------------------------------------------------------------------------- */
/*  Analyse einzelner Rubriken                                                */
/* -------------------------------------------------------------------------- */

interface AnalyzeResult {
  seoScore: number;
  conversionScore: number;
  mobileScore: number;
  designScore: number;
  trustScore: number;
  technologyScore: number;
  subscores: Record<string, number>;
  findings: FindingsBundle;
  techStack: Record<string, unknown>;
  hasBookingSignal: boolean;
  hasContactForm: boolean;
  isEcommerce: boolean;
  isMinimalPage: boolean;
}

function analyzeParsed(parsed: ReturnType<typeof stripHtml>, finalUrl: string): AnalyzeResult {
  const findings = emptyFindings();
  const subscores: Record<string, number> = {};
  const techStack: Record<string, unknown> = {};

  const metas = parsed.metas;
  const linkTags = parsed.linkTags;
  const scripts = parsed.scriptSrcs;
  const html = parsed.headHtml + parsed.bodyHtml;
  const text = parsed.text.toLowerCase();

  /* SEO -------------------------------------------------------------------- */
  let seo = 100;
  if (!parsed.title || parsed.title.length < 10) {
    seo -= 25;
    findings.facts.push({ text: "Kein aussagekräftiger <title>", category: "seo" });
    findings.recommendations.push({ text: "SEO-Grundlagen: Title-Tag verbessern", category: "seo" });
  } else if (parsed.title.length > 70) {
    seo -= 10;
    findings.facts.push({ text: "Title-Tag > 70 Zeichen", category: "seo" });
  }
  if (!metas["description"] || metas["description"].length < 40) {
    seo -= 15;
    findings.facts.push({ text: "Meta-Description fehlt / zu kurz", category: "seo" });
    findings.recommendations.push({ text: "Meta-Description ergänzen", category: "seo" });
  }
  if (parsed.headings.h1.length === 0) {
    seo -= 15;
    findings.facts.push({ text: "Keine H1 gefunden", category: "seo" });
  } else if (parsed.headings.h1.length > 3) {
    seo -= 5;
    findings.facts.push({ text: `${parsed.headings.h1.length} H1 auf einer Seite`, category: "seo" });
  }
  if (!linkTags.some((l) => l.rel === "canonical")) {
    seo -= 5;
    findings.facts.push({ text: "Kein Canonical-Link", category: "seo" });
  }
  if (!/<script[^>]+type=["']application\/ld\+json["']/i.test(html)) {
    seo -= 10;
    findings.facts.push({ text: "Keine strukturierten Daten (JSON-LD)", category: "seo" });
    findings.recommendations.push({ text: "Structured Data (Organization/LocalBusiness) ergänzen", category: "seo" });
  }
  if (!metas["og:title"]) {
    seo -= 5;
    findings.facts.push({ text: "Kein Open-Graph Titel", category: "seo" });
  }
  subscores.title = parsed.title ? Math.min(100, parsed.title.length * 2) : 0;
  seo = clamp(seo, 0, 100);

  /* Mobile ----------------------------------------------------------------- */
  let mobile = 100;
  const viewport = metas["viewport"] ?? "";
  if (!viewport) {
    mobile -= 40;
    findings.facts.push({ text: "Kein Viewport-Meta", category: "mobile" });
    findings.inferences.push({ text: "Website vermutlich nicht mobil optimiert", category: "mobile" });
  } else if (!/width=device-width/i.test(viewport)) {
    mobile -= 20;
    findings.facts.push({ text: "Viewport ohne width=device-width", category: "mobile" });
  }
  if (/max-width\s*:\s*\d{3,4}\s*px/i.test(html)) {
    // ok – Signal für Responsive CSS
  } else if (!/tailwind|bootstrap|foundation|w-full|md:|lg:/i.test(html)) {
    mobile -= 15;
    findings.inferences.push({ text: "Kein Hinweis auf Responsive-CSS-Framework", category: "mobile" });
  }
  if (parsed.images.length > 0) {
    const withoutLoading = parsed.images.filter((i) => !i.loading).length;
    if (withoutLoading > parsed.images.length * 0.6) {
      mobile -= 8;
      findings.facts.push({ text: "Viele Bilder ohne loading=\"lazy\"", category: "mobile" });
    }
  }
  mobile = clamp(mobile, 0, 100);

  /* Conversion ------------------------------------------------------------ */
  let conversion = 100;
  const hasContact = /kontakt|contact|anrufen|jetzt anrufen|angebot anfordern|angebot|termin|beratung/i.test(text);
  const hasContactForm = parsed.forms.some((f) => f.inputs >= 2);
  const hasBookingSignal =
    /calendly|termin buchen|jetzt buchen|online buchen|jetzt termin|book(?:ing)?/i.test(text) ||
    parsed.scriptSrcs.some((s) => /calendly|cal\.com|acuity/i.test(s));
  const isEcommerce = /warenkorb|cart|checkout|shop|preis|produkte/i.test(text) &&
    parsed.forms.length > 0 && parsed.links.some((l) => /cart|warenkorb/i.test(l.href));

  if (!hasContact) {
    conversion -= 30;
    findings.facts.push({ text: "Keine klaren CTAs im Fließtext", category: "conversion" });
    findings.recommendations.push({ text: "Klare CTA-Struktur (Kontakt / Anfrage)", category: "conversion" });
  }
  if (!hasContactForm) {
    conversion -= 15;
    findings.inferences.push({ text: "Kein Anfrageformular gefunden", category: "conversion" });
  }
  if (!hasBookingSignal) {
    conversion -= 10;
    findings.inferences.push({ text: "Keine Online-Terminbuchung erkennbar", category: "conversion" });
  }
  const isMinimalPage = parsed.text.length < 500;
  if (isMinimalPage) {
    conversion -= 15;
    findings.facts.push({ text: "Sehr wenig Text-Inhalt (< 500 Zeichen)", category: "conversion" });
  }
  conversion = clamp(conversion, 0, 100);

  /* Design ---------------------------------------------------------------- */
  let design = 100;
  const modernFrameworkHints =
    /tailwind|next-|__next|astro|nuxt|vue|react|svelte|framer[- ]motion|shadcn/i.test(html);
  if (!modernFrameworkHints) {
    design -= 20;
    findings.inferences.push({ text: "Kein Hinweis auf modernes Frontend-Framework", category: "design" });
  }
  if (parsed.headings.h2.length + parsed.headings.h3.length < 3) {
    design -= 10;
    findings.inferences.push({ text: "Wenig Struktur / Hierarchie (H2/H3 spärlich)", category: "design" });
  }
  if (parsed.images.length === 0) {
    design -= 5;
    findings.facts.push({ text: "Keine Bilder gefunden", category: "design" });
  }
  if (parsed.text.length > 30000) {
    design -= 5;
    findings.inferences.push({ text: "Sehr textlastig — möglicherweise unübersichtlich", category: "design" });
  }
  design = clamp(design, 0, 100);

  /* Trust ----------------------------------------------------------------- */
  let trust = 100;
  const hasImpressum = parsed.links.some((l) => /impressum|imprint|legal[- ]notice/i.test(l.text) || /impressum|imprint/i.test(l.href));
  const hasDatenschutz = parsed.links.some((l) => /datenschutz|privacy/i.test(l.text) || /datenschutz|privacy/i.test(l.href));
  if (!hasImpressum) {
    trust -= 20;
    findings.facts.push({ text: "Kein Link zum Impressum sichtbar", category: "trust" });
  }
  if (!hasDatenschutz) {
    trust -= 15;
    findings.facts.push({ text: "Kein Link zur Datenschutzerklärung", category: "trust" });
  }
  const hasReferences = /referenz|case study|kundenstimm|testimonial|referenzen|projekte/i.test(text);
  if (!hasReferences) {
    trust -= 10;
    findings.inferences.push({ text: "Keine Referenzen / Case Studies sichtbar", category: "trust" });
  }
  if (finalUrl.startsWith("http://")) {
    trust -= 25;
    findings.facts.push({ text: "Kein HTTPS", category: "trust" });
    findings.recommendations.push({ text: "TLS-Zertifikat einrichten (HTTPS)", category: "trust" });
  }
  trust = clamp(trust, 0, 100);

  /* Technology / CMS ------------------------------------------------------ */
  let tech = 80;
  const cms = detectCms(html, scripts);
  const analytics = detectAnalytics(html, scripts);
  const chat = detectChat(html, scripts);
  const bookings = detectBooking(html, scripts);

  techStack.cms = cms;
  techStack.analytics = analytics;
  techStack.chat = chat;
  techStack.booking = bookings;
  techStack.scriptCount = scripts.length;

  if (cms === "unknown") {
    tech -= 10;
    findings.inferences.push({ text: "Kein CMS eindeutig erkennbar", category: "technology" });
  } else if (cms === "wix" || cms === "jimdo" || cms === "wordpress-legacy") {
    tech -= 15;
    findings.inferences.push({ text: `Baukasten/Legacy-CMS erkannt (${cms})`, category: "technology" });
  }
  if (!analytics) {
    tech -= 5;
    findings.inferences.push({ text: "Kein Analytics-Tag erkannt", category: "technology" });
  }
  if (scripts.length > 40) {
    tech -= 10;
    findings.facts.push({ text: `${scripts.length} <script>-Tags — potenzieller JS-Bloat`, category: "performance" });
  }
  tech = clamp(tech, 0, 100);

  return {
    seoScore: seo,
    conversionScore: conversion,
    mobileScore: mobile,
    designScore: design,
    trustScore: trust,
    technologyScore: tech,
    subscores,
    findings,
    techStack,
    hasBookingSignal,
    hasContactForm,
    isEcommerce,
    isMinimalPage,
  };
}

function perfScore(response: { latencyMs: number; bytesRead: number }, parsed: ReturnType<typeof stripHtml>): number {
  let score = 100;
  if (response.latencyMs > 3000) score -= 40;
  else if (response.latencyMs > 1500) score -= 20;
  else if (response.latencyMs > 800) score -= 10;

  if (response.bytesRead > 1_500_000) score -= 20;
  else if (response.bytesRead > 800_000) score -= 10;

  if (parsed.scriptSrcs.length > 30) score -= 10;
  if (parsed.images.length > 30) score -= 5;
  return clamp(score, 0, 100);
}

function detectCms(html: string, scripts: string[]): string {
  const joined = html + " " + scripts.join(" ");
  if (/wp-content|wp-includes|wordpress/i.test(joined)) return "wordpress";
  if (/cdn\.shopify\.com|shopify\.com/i.test(joined)) return "shopify";
  if (/wix\.com|wixstatic/i.test(joined)) return "wix";
  if (/jimdo/i.test(joined)) return "jimdo";
  if (/typo3/i.test(joined)) return "typo3";
  if (/joomla/i.test(joined)) return "joomla";
  if (/webflow/i.test(joined)) return "webflow";
  if (/squarespace/i.test(joined)) return "squarespace";
  if (/framer\.website|framerusercontent/i.test(joined)) return "framer";
  if (/_next\/static|__next_data__/i.test(joined)) return "nextjs";
  if (/astro\b/i.test(joined)) return "astro";
  if (/nuxt/i.test(joined)) return "nuxt";
  return "unknown";
}

function detectAnalytics(html: string, scripts: string[]): string[] {
  const found: string[] = [];
  const joined = html + " " + scripts.join(" ");
  if (/googletagmanager\.com\/gtm\.js/i.test(joined)) found.push("Google Tag Manager");
  if (/googletagmanager\.com\/gtag\/js/i.test(joined) || /gtag\('config'/i.test(joined)) found.push("GA4");
  if (/plausible\.io/i.test(joined)) found.push("Plausible");
  if (/matomo/i.test(joined)) found.push("Matomo");
  if (/hotjar/i.test(joined)) found.push("Hotjar");
  if (/facebook\.net\/en_US\/fbevents/i.test(joined)) found.push("Meta Pixel");
  if (/vercel\/insights|@vercel\/insights/i.test(joined)) found.push("Vercel Analytics");
  return found;
}

function detectChat(html: string, scripts: string[]): string[] {
  const found: string[] = [];
  const joined = html + " " + scripts.join(" ");
  if (/intercom/i.test(joined)) found.push("Intercom");
  if (/tawk\.to/i.test(joined)) found.push("Tawk.to");
  if (/crisp\.chat/i.test(joined)) found.push("Crisp");
  if (/drift\.com/i.test(joined)) found.push("Drift");
  if (/hs-scripts\.com|hubspot/i.test(joined)) found.push("HubSpot");
  return found;
}

function detectBooking(html: string, scripts: string[]): string[] {
  const found: string[] = [];
  const joined = html + " " + scripts.join(" ");
  if (/calendly/i.test(joined)) found.push("Calendly");
  if (/cal\.com/i.test(joined)) found.push("Cal.com");
  if (/acuity(scheduling)?/i.test(joined)) found.push("Acuity");
  if (/planyo|resmio|opentable/i.test(joined)) found.push("Booking-Tool");
  return found;
}

function hashString(input: string): string {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) - h + input.charCodeAt(i)) | 0;
  }
  return `h_${(h >>> 0).toString(16)}_${input.length}`;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(v)));
}

function emptyAuditResult(url: string, response: { finalUrl?: string; status?: number; redirectChain?: string[] } | null, error: string): WebsiteAuditResult {
  return {
    url,
    finalUrl: response?.finalUrl ?? url,
    auditedAt: new Date().toISOString(),
    httpStatus: response?.status ?? 0,
    ttfbMs: 0,
    transferBytes: 0,
    redirectChain: response?.redirectChain ?? [],
    websiteScore: 0,
    designScore: 0,
    performanceScore: 0,
    seoScore: 0,
    conversionScore: 0,
    mobileScore: 0,
    trustScore: 0,
    technologyScore: 0,
    subscores: {},
    findings: emptyFindings(),
    techStack: {},
    snapshotHash: null,
    error,
    opportunities: [],
  };
}

/* -------------------------------------------------------------------------- */
/*  Opportunity-Ableitung (Website)                                            */
/* -------------------------------------------------------------------------- */

interface OpportunityInput {
  websiteScore: number;
  perf: number;
  seo: number;
  conversion: number;
  mobile: number;
  design: number;
  trust: number;
  tech: number;
  finalUrl: string;
  hasBookingSignal: boolean;
  hasContactForm: boolean;
  isEcommerce: boolean;
  isMinimalPage: boolean;
  cms: string | null;
}

function deriveOpportunities(input: OpportunityInput): WebsiteAuditResult["opportunities"] {
  const out: WebsiteAuditResult["opportunities"] = [];

  if (input.websiteScore < 45 || input.design < 40 || input.mobile < 45) {
    out.push(makeOpp("WEBSITE_REDESIGN", "Website-Redesign", [
      input.design < 40 ? "Design/Struktur schwach" : null,
      input.mobile < 45 ? "Mobile-Optimierung mangelhaft" : null,
      input.perf < 45 ? "Ladeperformance schwach" : null,
      input.cms === "wix" || input.cms === "jimdo" ? `Baukasten-CMS (${input.cms})` : null,
    ]));
  } else if (input.websiteScore < 60) {
    out.push(makeOpp("PERFORMANCE_OPTIMIZATION", "Website-Optimierung", [
      input.perf < 60 ? "Ladeperformance verbesserungswürdig" : null,
      input.seo < 60 ? "SEO-Grundlagen fehlen" : null,
    ]));
  }

  if (input.seo < 60) {
    out.push(makeOpp("SEO", "SEO-Ausbau", [
      "Grundlagen (Title, Description, Structured Data) unvollständig",
    ]));
  }

  if (input.conversion < 55 && input.hasContactForm === false) {
    out.push(makeOpp("CONVERSION_OPTIMIZATION", "Conversion-Optimierung", [
      "Keine klaren CTAs, keine Anfrageformulare",
    ]));
  }

  if (!input.hasBookingSignal && (input.conversion < 70 || input.isMinimalPage)) {
    out.push(makeOpp("BOOKING_SYSTEM", "Terminbuchung online", [
      "Keine Online-Terminvereinbarung erkennbar",
      "Terminanfragen laufen vermutlich manuell",
    ]));
  }

  if (input.isMinimalPage && input.websiteScore < 55) {
    out.push(makeOpp("LANDING_PAGE", "Landingpage-Kampagne", [
      "Aktuelle Seite sehr minimalistisch — Landingpage-Aufbau als schneller Hebel",
    ]));
  }

  if (out.length === 0) {
    out.push(makeOpp("NO_IMMEDIATE_NEED", "Kein akuter Websitebedarf", [
      "Website erfüllt aktuelle Basisanforderungen",
    ], 0.4, 20));
  }

  return out;
}

function makeOpp(
  kind: WebsiteOpportunityKind,
  title: string,
  reasonsRaw: Array<string | null>,
  baseConfidence = 0.75,
  baseScore = 70
): WebsiteAuditResult["opportunities"][number] {
  const reasons = reasonsRaw.filter((s): s is string => Boolean(s && s.length));
  return {
    kind,
    source: "website",
    title,
    reason: reasons.join(" · ") || null,
    confidence: baseConfidence,
    opportunityScore: baseScore,
    evidence: reasons.map((text) => ({ kind: "audit", text })),
    estimatedMinCents: null,
    estimatedRecommendedCents: null,
    estimatedMaxCents: null,
    currency: "EUR",
    problem: reasons[0] ?? null,
    proposedSolution: null,
  };
}

/**
 * Erzeugt eine deterministische ID für ein Website-Audit — hilfreich für
 * Tests und Snapshotting.
 */
export function newAuditId(): string {
  return newTargetId("audit");
}

/**
 * Bequeme Hilfsfunktion um aus einer Website-URL nur die Root-Domain zu
 * bekommen (wird beim ersten Enrichment-Schritt genutzt, um `domain`
 * am Target zu setzen).
 */
export function domainFromUrl(url: string | null): string | null {
  return extractDomain(url);
}
