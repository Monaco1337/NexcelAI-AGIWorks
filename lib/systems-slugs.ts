/**
 * Canonical system slugs — plain (JSX-free) module.
 *
 * Kept separate from lib/systems-data.tsx (which embeds React icons) so it can
 * be imported by CI/Node scripts (e.g. the case-study guard) without pulling the
 * JSX/React runtime into a non-React context.
 *
 * lib/systems-data.tsx re-exports this and types each SystemEntry.slug against
 * it, so the two stay in sync.
 */

export const SYSTEM_SLUGS = [
  "premium-websysteme",
  "buchungs-beauty-systeme",
  "lead-funnels-crm",
  "mitglieder-clubverwaltung",
  "branchen-plattformen",
  "erp-systeme",
  "ki-automatisierung",
  "schnittstellen-integrationen",
] as const;

export type SystemSlug = (typeof SYSTEM_SLUGS)[number];
