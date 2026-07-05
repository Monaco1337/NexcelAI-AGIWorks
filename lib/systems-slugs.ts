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
  // Vertrieb
  "lead-funnels-crm",
  "vertriebsplattform-partnerportal",
  "angebots-beratungssystem",
  // Kunden
  "kundenportal-self-service",
  "buchungs-beauty-systeme",
  "mitglieder-clubverwaltung",
  "service-supportportal",
  "omnichannel-kommunikation",
  // Unternehmen
  "erp-systeme",
  "admin-operations-system",
  "dokumentenmanagement-freigaben",
  "projekt-aufgabenmanagement",
  "mitarbeiter-hr-system",
  "warenwirtschaft-lagerverwaltung",
  "dashboard-reporting",
  "recruiting-bewerberplattform",
  // KI
  "ki-automatisierung",
  "ki-telefonagent-voice",
  // Plattformen
  "premium-websysteme",
  "branchen-plattformen",
  "saas-plattform-multi-tenant",
  "akademie-lernplattform",
  "schnittstellen-integrationen",
] as const;

export type SystemSlug = (typeof SYSTEM_SLUGS)[number];
