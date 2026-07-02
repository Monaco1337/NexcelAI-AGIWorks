/**
 * Convert a CaseStudy (data) into CaseStudyTemplateProps (Phase 4 template).
 * Builds the canonical URL + breadcrumb trail on the brand's own domain.
 */

import type { CaseStudy } from "@/data/caseStudies";
import type { CaseStudyTemplateProps } from "@/lib/templates/types";
import { toAbsoluteUrl } from "@/config/seo/domains";

/** Public path for a case study (future candidate route). */
export function caseStudyPath(slug: string): string {
  return `/projekte/${slug}`;
}

export function caseStudyToTemplateProps(cs: CaseStudy): CaseStudyTemplateProps {
  const path = caseStudyPath(cs.slug);
  return {
    brand: cs.brand,
    canonicalUrl: toAbsoluteUrl(cs.brand, path),
    breadcrumbs: [
      { label: "Start", href: "/" },
      { label: "Projekte", href: "/projekte" },
      { label: cs.title, href: path },
    ],
    eyebrow: "Projekt",
    title: cs.title,
    intro: cs.summary,
    client: cs.client,
    challenge: cs.challenge,
    approach: cs.approach,
    outcomes: cs.outcomes,
  };
}
