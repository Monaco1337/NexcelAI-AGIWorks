/**
 * Template prop contracts — factual data in, no fake signals.
 *
 * These types are the interface between (later) candidate pages and the reusable
 * Phase 4 template components. Deliberately there are NO fields for ratings,
 * review counts, fake certifications, opening hours or geo coordinates — the
 * type system itself makes those un-representable.
 */

import type { BrandKey } from "@/config/seo/domains";

/** Content atom: a visible FAQ pair (also drives FAQPage JSON-LD when rendered). */
export interface FaqItem {
  question: string;
  answer: string;
}

/** Breadcrumb node with an absolute or root-relative href. */
export interface BreadcrumbNode {
  label: string;
  href: string;
}

/** A single feature / benefit with an optional short elaboration. */
export interface FeatureItem {
  title: string;
  description?: string;
}

/** A numbered process step. */
export interface ProcessStep {
  title: string;
  description: string;
}

/** A cost/scope tier. `priceHint` is an honest orientation string, never a promise. */
export interface CostTier {
  name: string;
  /** Human orientation, e.g. "ab 2.500 €" — NOT a guaranteed price. */
  priceHint: string;
  summary: string;
  includes: string[];
}

/** One comparison row across up to N options. */
export interface ComparisonRow {
  criterion: string;
  /** Value per option column, keyed by option id. */
  values: Record<string, string>;
}

export interface ComparisonOption {
  id: string;
  label: string;
}

/** A factual outcome for a case study. No invented metrics. */
export interface CaseStudyOutcome {
  label: string;
  /** Factual, verifiable value or qualitative description. */
  value: string;
}

/** Shared metadata every template needs to render JSON-LD + trust correctly. */
export interface TemplateBase {
  brand: BrandKey;
  /** Absolute canonical URL of the page using this template. */
  canonicalUrl: string;
  /** Breadcrumb trail (root → current). */
  breadcrumbs: BreadcrumbNode[];
  /** H1 / page title. */
  title: string;
  /** Short eyebrow/kicker above the title. */
  eyebrow?: string;
  /** Lead paragraph under the title. */
  intro: string;
  /** Optional visible FAQ (renders FAQPage JSON-LD only when present). */
  faq?: FaqItem[];
}

export interface ServiceTemplateProps extends TemplateBase {
  serviceName: string;
  features: FeatureItem[];
  process?: ProcessStep[];
  areaServed?: string[];
}

export interface IndustryTemplateProps extends TemplateBase {
  industry: string;
  challenges: FeatureItem[];
  solutions: FeatureItem[];
}

export interface LocationTemplateProps extends TemplateBase {
  /** City / region served (service-area statement, not an office claim). */
  area: string;
  /** Why the region matters — must be real local differentiation. */
  localContext: string;
  services: FeatureItem[];
}

export interface KnowledgeTemplateProps extends TemplateBase {
  /** Editorial author (real person). Defaults to the brand owner. */
  authorName?: string;
  datePublished?: string;
  dateModified?: string;
  sections: { heading: string; body: string }[];
}

export interface CostTemplateProps extends TemplateBase {
  tiers: CostTier[];
  /** Honest note on what drives cost. */
  factorsNote: string;
}

export interface ComparisonTemplateProps extends TemplateBase {
  options: ComparisonOption[];
  rows: ComparisonRow[];
  /** Neutral, factual conclusion (no "we are the best"). */
  conclusion: string;
}

export interface CaseStudyTemplateProps extends TemplateBase {
  client?: string;
  /** The concrete problem addressed. */
  challenge: string;
  /** What was built/done. */
  approach: string;
  /** Factual outcomes only. */
  outcomes: CaseStudyOutcome[];
}
