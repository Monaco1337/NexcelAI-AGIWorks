/**
 * Negative fixtures — deliberately BAD data that the guards MUST flag.
 *
 * These prove the checks can actually fail (not just pass on clean data). The
 * CI self-test asserts every fixture below produces at least one blocker.
 *
 * CI-only module: not imported by the Next app graph.
 */

import type { CrossDomainPageInput } from "../crossDomainGuard";
import type { DuplicateInput } from "../duplicateGuard";
import type { ContentInput } from "../contentRules";

/** Cross-domain ownership violations. Each MUST yield a blocker. */
export const BAD_CROSS_DOMAIN_PAGES: CrossDomainPageInput[] = [
  {
    // (a) AGI page canonicalized to the NEXCEL domain.
    id: "agiworks:/preise#bad-canonical",
    brand: "agiworks",
    path: "/preise",
    canonical: "https://www.nexcelai.de/preise",
    indexable: true,
  },
  {
    // (b) internal /agiworks prefix leaked into a public path + canonical.
    id: "agiworks:/agiworks/impressum#leaked-prefix",
    brand: "agiworks",
    path: "/agiworks/impressum",
    canonical: "https://www.agiworks.de/agiworks/impressum",
    indexable: true,
  },
  {
    // (c) NEXCEL page canonicalized to the AGI domain.
    id: "nexcel:/kontakt#foreign-canonical",
    brand: "nexcel",
    path: "/kontakt",
    canonical: "https://www.agiworks.de/kontakt",
    indexable: true,
  },
  {
    // (d) invalid canonical URL.
    id: "nexcel:/preise#invalid",
    brand: "nexcel",
    path: "/preise",
    canonical: "not-a-url",
    indexable: true,
  },
];

/** Cross-domain near-duplicate content. MUST yield a CROSS_DOMAIN_DUPLICATE blocker. */
export const BAD_DUPLICATE_PAGES: DuplicateInput[] = [
  {
    id: "nexcel:/leistungen#dup",
    brand: "nexcel",
    path: "/leistungen",
    text: "Wir bauen individuelle digitale Systeme, Webplattformen und Automatisierungen für Unternehmen mit klarer Systemarchitektur und messbaren Ergebnissen.",
  },
  {
    id: "agiworks:/leistungen#dup",
    brand: "agiworks",
    path: "/leistungen",
    text: "Wir bauen individuelle digitale Systeme, Webplattformen und Automatisierungen für Unternehmen mit klarer Systemarchitektur und messbaren Ergebnissen.",
  },
];

/** Content-rule violations. Each MUST yield at least one blocker. */
export const BAD_CONTENT: ContentInput[] = [
  {
    brand: "nexcel",
    pageId: "nexcel:/spam#guarantee",
    path: "/spam",
    title: "Garantiert Platz 1 bei Google – sofort auf Seite 1",
    description:
      "Wir sind weltweit führend und die beste Agentur. Nummer 1 garantiert, unschlagbar und marktführer in allem.",
  },
  {
    brand: "agiworks",
    pageId: "agiworks:/template#placeholder",
    path: "/template",
    title: "Leistungen in {{city}}",
    description: "Angebote in [stadt] mit TODO Beschreibung und PLACEHOLDER Text hier einfügen.",
  },
];
