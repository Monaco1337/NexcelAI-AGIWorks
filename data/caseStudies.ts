/**
 * Case Study system — REAL work only, NO fake metrics.
 *
 * Hard rules (enforced by `seo:case-studies`):
 *  - Every case study belongs to exactly one brand and is grounded in a real
 *    system offering (`systemSlug` ∈ lib/systems-data.tsx).
 *  - Outcomes are FACTUAL capabilities (what the system does), not invented
 *    KPIs. Numeric performance claims are blocked unless `verifiedMetrics` is
 *    true (owner attests to real, verifiable numbers).
 *  - NEXCEL AI and AGI Works angles must be genuinely different (the cross-
 *    domain duplicate guard fails on near-identical copy).
 *  - Deny-by-default indexing: a case study is only indexable once approved +
 *    manually cleared (mirrors config/seo/indexing.ts).
 *  - No invented client names. `client` is only set when it is real and cleared
 *    for publication.
 */

import type { BrandKey } from "@/config/seo/domains";

export interface CaseStudyOutcome {
  label: string;
  /** Factual, verifiable value or a qualitative capability. No fake numbers. */
  value: string;
}

export interface CaseStudy {
  /** Stable id: `${brand}:${slug}`. */
  id: string;
  brand: BrandKey;
  /** URL slug (used by a future candidate route /projekte/<slug>). */
  slug: string;
  /** Links to a real system offering in lib/systems-data.tsx. */
  systemSlug: string;
  title: string;
  /** Short intro / summary. */
  summary: string;
  /** The concrete problem addressed (real). */
  challenge: string;
  /** What was built / the approach (real). */
  approach: string;
  /** Factual outcomes only. */
  outcomes: CaseStudyOutcome[];
  tags: string[];
  /** Real, publication-cleared client only. Otherwise omitted. */
  client?: string;
  /** Owner attests outcomes contain only real, verifiable metrics. */
  verifiedMetrics?: boolean;
  /** Deny-by-default indexing controls (see config/seo/indexing.ts). */
  approved: boolean;
  manualIndexApproval: boolean;
}

/**
 * Seed: grounded in the real system catalog. NEXCEL entries take the
 * unternehmenssystem / customer-experience / process lens; AGI entries take the
 * software-architecture / platform / integration lens — deliberately different
 * systems and framing so no cross-domain duplication occurs.
 *
 * These are capability case studies (no client attribution, no invented
 * metrics) and start NON-indexable. Promote real client case studies by adding
 * factual `outcomes` + `client`, setting `verifiedMetrics` where applicable, and
 * flipping `approved` + `manualIndexApproval` after review.
 */
export const CASE_STUDIES: CaseStudy[] = [
  // ── NEXCEL AI ──────────────────────────────────────────────────────────────
  {
    id: "nexcel:conversion-websystem",
    brand: "nexcel",
    slug: "conversion-websystem",
    systemSlug: "premium-websysteme",
    title: "Conversion-orientiertes Websystem",
    summary:
      "Ein Websystem, das Markenauftritt, klare Nutzerführung und ein integriertes Lead-System zu einer Einheit verbindet.",
    challenge:
      "Ein generischer Web-Baukasten bildete weder die Marke noch die Anfrage-Strecke sauber ab. Interessenten sprangen ab, bevor sie Kontakt aufnahmen.",
    approach:
      "Aufbau eines individuellen Websystems entlang der Nutzerführung: markenkonformes Design, conversion-orientierte Seitenstruktur, integriertes Kontakt- und Lead-System sowie eine saubere technische Basis für Ladezeit und Auffindbarkeit.",
    outcomes: [
      { label: "Anfragestrecke", value: "Durchgängige Lead-Strecke von Landingpage bis Kontakt" },
      { label: "Pflege", value: "Eigenständige Inhaltspflege über CMS-Anbindung" },
      { label: "Basis", value: "Saubere technische Grundlage für Performance und Auffindbarkeit" },
    ],
    tags: ["Websystem", "Customer Experience", "Lead"],
    approved: false,
    manualIndexApproval: false,
  },
  {
    id: "nexcel:lead-prozess-crm",
    brand: "nexcel",
    slug: "lead-prozess-crm",
    systemSlug: "lead-funnels-crm",
    title: "Strukturierter Lead-Prozess mit CRM",
    summary:
      "Ein durchgängiger Lead-Prozess, der Anfragen automatisch erfasst, qualifiziert und nachvollziehbar nachfasst.",
    challenge:
      "Anfragen liefen über verstreute Kanäle ein, wurden uneinheitlich erfasst und gingen im Alltag unter. Der Vertrieb war schwer planbar.",
    approach:
      "Konzeption eines qualifizierenden Funnels mit strukturierten Formularen und einem CRM, das jeden Lead erfasst, nach Status priorisiert und den Erstkontakt sowie Wiedervorlagen anstößt.",
    outcomes: [
      { label: "Erfassung", value: "Zentrale, einheitliche Lead-Erfassung statt verstreuter Kanäle" },
      { label: "Nachverfolgung", value: "Nachvollziehbare Pipeline mit Status und Priorität" },
      { label: "Prozess", value: "Automatisierter Erstkontakt und Wiedervorlage" },
    ],
    tags: ["Lead", "CRM", "Prozess"],
    approved: false,
    manualIndexApproval: false,
  },

  // ── AGI Works ────────────────────────────────────────────────────────────────
  {
    id: "agiworks:erp-betriebszentrale",
    brand: "agiworks",
    slug: "erp-betriebszentrale",
    systemSlug: "erp-systeme",
    title: "Individuelles ERP als Betriebszentrale",
    summary:
      "Eine maßgeschneiderte Betriebszentrale, die Kunden, Projekte, Finanzen und Ressourcen in einem System zusammenführt.",
    challenge:
      "Standardsoftware zwang das Unternehmen in fremde Abläufe; Daten lagen verteilt in getrennten Werkzeugen ohne gemeinsame Sicht.",
    approach:
      "Entwurf einer rollenbasierten ERP-Architektur, die die realen Prozesse abbildet: CRM-Kern, Projekt- und Aufgabensteuerung, Finanzobjekte sowie Dokumentenablage in einer konsistenten Datenschicht.",
    outcomes: [
      { label: "Datenmodell", value: "Eine konsistente Datenschicht statt getrennter Insellösungen" },
      { label: "Rechte", value: "Rollenbasierte Zugriffe über alle Bereiche" },
      { label: "Steuerung", value: "Live-Reports als Grundlage für Entscheidungen" },
    ],
    tags: ["ERP", "Softwarearchitektur", "Backend"],
    approved: false,
    manualIndexApproval: false,
  },
  {
    id: "agiworks:integrationsschicht",
    brand: "agiworks",
    slug: "integrationsschicht",
    systemSlug: "schnittstellen-integrationen",
    title: "Stabile Integrationsschicht zwischen Systemen",
    summary:
      "Eine robuste Integrationsschicht, die externe Dienste sauber und wiederholbar mit der zentralen Infrastruktur verbindet.",
    challenge:
      "Getrennte Systeme mussten zuverlässig zusammenarbeiten, ohne dass fehlerhafte Übertragungen Daten beschädigten oder Prozesse blockierten.",
    approach:
      "Aufbau einer Integrationsschicht mit klarem Datenmapping, Fehler-Handling und automatischer Wiederholung über API-, Webhook- und Zahlungs-Anbindungen — DSGVO-konform und verschlüsselt.",
    outcomes: [
      { label: "Verbindungen", value: "Saubere Anbindung von API-, Webhook- und Zahlungsdiensten" },
      { label: "Robustheit", value: "Definiertes Fehler-Handling mit automatischer Wiederholung" },
      { label: "Datenqualität", value: "Konsistentes Datenmapping zwischen Formaten" },
    ],
    tags: ["Integration", "Schnittstellen", "Backend"],
    approved: false,
    manualIndexApproval: false,
  },
];

export function getCaseStudiesForBrand(brand: BrandKey): CaseStudy[] {
  return CASE_STUDIES.filter((c) => c.brand === brand);
}

export function getCaseStudy(brand: BrandKey, slug: string): CaseStudy | undefined {
  return CASE_STUDIES.find((c) => c.brand === brand && c.slug === slug);
}
