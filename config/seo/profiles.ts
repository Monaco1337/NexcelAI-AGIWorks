/**
 * External profile registry — the single source of truth for off-site presence.
 *
 * This file drives three things at once:
 *  1. `sameAs` in Organization JSON-LD (only entries with status "live").
 *  2. The public press/partner page (only entries with status "live").
 *  3. The citation dossier report (`npm run seo:citations`), which lists what is
 *    still open and prints the exact NAP payload to submit.
 *
 * HARD RULES:
 *  - Never set status "live" for a profile that does not exist and resolve to a
 *    200. `sameAs` pointing at 404s is a trust signal loss, not a gain.
 *  - `url` for a "planned" entry is the DIRECTORY's submission page, not a
 *    fabricated profile URL. When the profile goes live, replace `url` with the
 *    real profile URL and flip the status.
 *  - `addressPolicy` records whether the portal is acceptable given that the
 *    postal address is published in the Impressum only. Portals requiring a
 *    publicly visitable office are marked "office-required" and must not be
 *    submitted.
 */

import type { BrandKey } from "./domains";

export type ProfileStatus = "live" | "planned";

export type ProfileCategory =
  | "social"
  | "developer"
  | "business-directory"
  | "phone-directory"
  | "local-directory"
  | "software-directory"
  | "industry"
  | "press";

/**
 * Whether the portal works with an address that only appears in the Impressum.
 *  - "impressum-ok": portal accepts a registered/legal address, no storefront claim.
 *  - "address-optional": portal does not require any postal address.
 *  - "office-required": portal expects a visitable location — DO NOT submit.
 */
export type AddressPolicy = "impressum-ok" | "address-optional" | "office-required";

export interface ExternalProfile {
  /** Portal name as users know it. */
  name: string;
  category: ProfileCategory;
  /** Live profile URL, or the portal's submission entry point while planned. */
  url: string;
  status: ProfileStatus;
  addressPolicy: AddressPolicy;
  /** Does the portal grant a followed link, a nofollow link, or none? */
  linkType: "dofollow" | "nofollow" | "unknown";
  /** Free of charge to list? */
  free: boolean;
  /** Short note for whoever does the submission. */
  note?: string;
}

const NEXCEL_PROFILES: ExternalProfile[] = [
  {
    name: "LinkedIn (Celina Siebeneicher)",
    category: "social",
    url: "https://www.linkedin.com/in/CelinaSiebeneicher",
    status: "live",
    addressPolicy: "address-optional",
    linkType: "nofollow",
    free: true,
    note: "Persönliches Profil der Inhaberin, bereits im Footer verlinkt.",
  },
];

const AGIWORKS_PROFILES: ExternalProfile[] = [
  {
    name: "LinkedIn (Kevin Blazevic)",
    category: "social",
    url: "https://www.linkedin.com/in/kevin-blazevic-1b9695ba/",
    status: "live",
    addressPolicy: "address-optional",
    linkType: "nofollow",
    free: true,
    note: "Persönliches Profil des Inhabers, bereits im Footer verlinkt.",
  },
];

/**
 * Submission targets that apply to BOTH brands. Each brand submits its own
 * entry with its own NAP record; the portal is shared, the profile is not.
 *
 * Curated for the DACH region and filtered to portals that work without a
 * walk-in office. Ordered roughly by expected value.
 */
export const SHARED_DIRECTORY_TARGETS: Omit<ExternalProfile, "status">[] = [
  // — Kernverzeichnisse / Telefonbücher —————————————————————————
  {
    name: "Google Unternehmensprofil",
    category: "local-directory",
    url: "https://business.google.com/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Als Dienstleister mit Einzugsgebiet anlegen (Adresse ausblenden, Servicegebiet setzen). Wichtigstes Einzelprofil.",
  },
  {
    name: "Bing Places for Business",
    category: "local-directory",
    url: "https://www.bingplaces.com/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Servicegebiet-Modus verfügbar. Import aus Google-Profil möglich.",
  },
  {
    name: "Apple Business Connect",
    category: "local-directory",
    url: "https://businessconnect.apple.com/",
    addressPolicy: "impressum-ok",
    linkType: "unknown",
    free: true,
    note: "Speist Apple Karten und Siri. Servicegebiet ohne Ladenlokal möglich.",
  },
  {
    name: "Das Örtliche",
    category: "phone-directory",
    url: "https://eintragen.dasoertliche.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Klassischer Telefonbucheintrag. Basiseintrag kostenlos.",
  },
  {
    name: "Das Telefonbuch",
    category: "phone-directory",
    url: "https://eintrag.dastelefonbuch.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Speist zusätzlich Gelbe Seiten und GoYellow im selben Datenverbund.",
  },
  {
    name: "Gelbe Seiten",
    category: "phone-directory",
    url: "https://eintrag.gelbeseiten.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Branchenrubrik „Softwareentwicklung“ bzw. „EDV-Dienstleistungen“ wählen.",
  },
  {
    name: "11880.com",
    category: "phone-directory",
    url: "https://www.11880.com/eintragen",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
  },
  {
    name: "GoYellow",
    category: "phone-directory",
    url: "https://www.goyellow.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Häufig automatisch über Das Telefonbuch befüllt — vor Neuanlage prüfen.",
  },
  {
    name: "Yelp Deutschland",
    category: "local-directory",
    url: "https://biz.yelp.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Adresse lässt sich nach Anlage verbergen, Servicegebiet bleibt.",
  },
  {
    name: "Cylex Deutschland",
    category: "business-directory",
    url: "https://www.cylex.de/",
    addressPolicy: "impressum-ok",
    linkType: "dofollow",
    free: true,
  },
  {
    name: "Stadtbranchenbuch",
    category: "business-directory",
    url: "https://www.stadtbranchenbuch.com/",
    addressPolicy: "impressum-ok",
    linkType: "dofollow",
    free: true,
    note: "Eintrag für Unna; Dortmund nur, wenn dort tatsächlich Termine stattfinden.",
  },
  {
    name: "Werkenntdenbesten",
    category: "business-directory",
    url: "https://www.werkenntdenbesten.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
  },
  {
    name: "Yellowmap",
    category: "business-directory",
    url: "https://www.yellowmap.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
  },
  {
    name: "Meinestadt.de",
    category: "local-directory",
    url: "https://www.meinestadt.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Stadtportal — passt zu den Standortseiten für Unna und Dortmund.",
  },
  {
    name: "Wogibtswas / Marktplatz-Mittelstand",
    category: "business-directory",
    url: "https://www.marktplatz-mittelstand.de/",
    addressPolicy: "impressum-ok",
    linkType: "dofollow",
    free: true,
  },
  {
    name: "Firmenwissen (Creditreform)",
    category: "business-directory",
    url: "https://www.firmenwissen.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Datensatz meist bereits vorhanden — beanspruchen statt neu anlegen.",
  },
  {
    name: "Wer liefert was (wlw)",
    category: "industry",
    url: "https://www.wlw.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "B2B-Beschaffungsplattform, starkes Signal für Softwaredienstleister.",
  },
  {
    name: "IHK-Firmendatenbank Dortmund",
    category: "industry",
    url: "https://www.dortmund.ihk.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Nur für die IHK, bei der das Unternehmen tatsächlich gemeldet ist.",
  },

  // — Software- und Agenturverzeichnisse ——————————————————————
  {
    name: "Clutch",
    category: "software-directory",
    url: "https://clutch.co/get-listed",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Referenzen aus /projekte als Case Studies hinterlegen.",
  },
  {
    name: "Sortlist",
    category: "software-directory",
    url: "https://www.sortlist.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
  },
  {
    name: "GoodFirms",
    category: "software-directory",
    url: "https://www.goodfirms.co/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
  },
  {
    name: "DesignRush",
    category: "software-directory",
    url: "https://www.designrush.com/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
  },
  {
    name: "Provenexpert",
    category: "software-directory",
    url: "https://www.provenexpert.com/",
    addressPolicy: "address-optional",
    linkType: "dofollow",
    free: true,
    note: "Nur echte Kundenbewertungen einholen. Keine Sammelbewertungen erzeugen.",
  },
  {
    name: "OMR Reviews",
    category: "software-directory",
    url: "https://omr.com/de/reviews",
    addressPolicy: "address-optional",
    linkType: "nofollow",
    free: true,
    note: "Relevant, sobald ein Produkt als eigenständiges Angebot geführt wird.",
  },
  {
    name: "Crunchbase",
    category: "business-directory",
    url: "https://www.crunchbase.com/",
    addressPolicy: "address-optional",
    linkType: "nofollow",
    free: true,
  },
  {
    name: "North Data",
    category: "business-directory",
    url: "https://www.northdata.de/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Wird aus öffentlichen Registern gespeist — Datensatz prüfen und ergänzen.",
  },

  // — Entwickler- / Tech-Präsenz ————————————————————————————
  {
    name: "GitHub Organisation",
    category: "developer",
    url: "https://github.com/",
    addressPolicy: "address-optional",
    linkType: "nofollow",
    free: true,
    note: "Nur anlegen, wenn tatsächlich öffentlicher Code oder Doku veröffentlicht wird.",
  },
  {
    name: "Xing / New Work Unternehmensprofil",
    category: "social",
    url: "https://www.xing.com/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
  },
  {
    name: "LinkedIn Unternehmensseite",
    category: "social",
    url: "https://www.linkedin.com/company/setup/new/",
    addressPolicy: "impressum-ok",
    linkType: "nofollow",
    free: true,
    note: "Bisher existieren nur persönliche Profile — Unternehmensseite fehlt noch.",
  },
];

const PROFILES: Record<BrandKey, ExternalProfile[]> = {
  nexcel: NEXCEL_PROFILES,
  agiworks: AGIWORKS_PROFILES,
};

/** All registered profiles for a brand, regardless of status. */
export function getProfiles(brand: BrandKey): ExternalProfile[] {
  return PROFILES[brand];
}

/**
 * Profiles safe to emit in `sameAs` — live entries only. A planned entry points
 * at a submission form, which is not an identity of the organisation.
 */
export function getLiveProfiles(brand: BrandKey): ExternalProfile[] {
  return PROFILES[brand].filter((p) => p.status === "live");
}

/** `sameAs` URL list for Organization JSON-LD. */
export function sameAsUrls(brand: BrandKey): string[] {
  return getLiveProfiles(brand).map((p) => p.url);
}

/** Submission targets that are still open for a brand. */
export function getOpenTargets(brand: BrandKey): Omit<ExternalProfile, "status">[] {
  const liveNames = new Set(getLiveProfiles(brand).map((p) => p.name));
  return SHARED_DIRECTORY_TARGETS.filter(
    (t) => !liveNames.has(t.name) && t.addressPolicy !== "office-required"
  );
}
