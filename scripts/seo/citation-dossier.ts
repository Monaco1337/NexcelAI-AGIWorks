/**
 * Citation dossier generator.
 *
 * Produces a per-brand submission sheet in Markdown: the exact NAP record to
 * paste into each directory, the approved description texts at the lengths the
 * portals ask for, and the open submission targets with their address policy.
 *
 * Generated rather than hand-written on purpose — NAP consistency across
 * directories is the whole point of citations, so the data has to come from the
 * same source the website renders from (config/businessLocations.ts,
 * config/seo/brands.ts, config/seo/profiles.ts).
 *
 * Usage: npm run seo:citations   →   writes reports/citations/<brand>.md
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { getBrandConfig, type BrandKey } from "../../config/seo/brands";
import { getBusinessLocation } from "../../config/businessLocations";
import {
  getLiveProfiles,
  getOpenTargets,
  type ProfileCategory,
} from "../../config/seo/profiles";

const BRANDS: BrandKey[] = ["nexcel", "agiworks"];

const CATEGORY_LABEL: Record<ProfileCategory, string> = {
  social: "Soziale Netzwerke",
  developer: "Entwickler-Präsenz",
  "business-directory": "Firmenverzeichnisse",
  "phone-directory": "Telefonbücher",
  "local-directory": "Karten- & Stadtportale",
  "software-directory": "Software- & Agenturverzeichnisse",
  industry: "Branchen- & Kammerverzeichnisse",
  press: "Presse",
};

const CATEGORY_ORDER: ProfileCategory[] = [
  "local-directory",
  "phone-directory",
  "business-directory",
  "software-directory",
  "industry",
  "social",
  "developer",
  "press",
];

const POLICY_LABEL = {
  "impressum-ok": "Impressum-Adresse ausreichend",
  "address-optional": "Adresse nicht erforderlich",
  "office-required": "Ladenlokal erforderlich — nicht einreichen",
} as const;

/**
 * Category keywords for the portals' own taxonomy. Submitting under the same
 * category everywhere is part of citation consistency.
 */
const RUBRICS: Record<BrandKey, string[]> = {
  nexcel: [
    "Softwareentwicklung",
    "EDV-Dienstleistungen",
    "Unternehmensberatung IT",
    "Digitalisierungsberatung",
  ],
  agiworks: [
    "Softwareentwicklung",
    "Webentwicklung",
    "EDV-Dienstleistungen",
    "IT-Dienstleistungen",
  ],
};

const KEYWORDS: Record<BrandKey, string[]> = {
  nexcel: [
    "Unternehmenssysteme",
    "CRM-System",
    "Kundenportal",
    "Prozessautomatisierung",
    "KI-Automatisierung",
    "Digitalisierung Mittelstand",
  ],
  agiworks: [
    "Individualsoftware",
    "Web-App-Entwicklung",
    "Softwarearchitektur",
    "Schnittstellen-Entwicklung",
    "Backend-Entwicklung",
    "Plattformentwicklung",
  ],
};

const SHORT_DESC: Record<BrandKey, string> = {
  nexcel:
    "NEXCEL AI entwickelt digitale Unternehmenssysteme für Vertrieb, Kundenbetreuung und interne Abläufe.",
  agiworks:
    "AGI Works entwickelt individuelle Software, Web-Anwendungen und Plattformen für Unternehmen.",
};

const MEDIUM_DESC: Record<BrandKey, string> = {
  nexcel:
    "NEXCEL AI aus Unna entwickelt digitale Unternehmenssysteme für mittelständische Betriebe: CRM, Kundenportale, Automatisierung und KI-gestützte Prozesse. Jedes System wird individuell geplant statt aus einem Baukasten zusammengesetzt.",
  agiworks:
    "AGI Works aus Unna entwickelt individuelle Software für Unternehmen: Web-Anwendungen, Backend-Systeme, Plattformen und Schnittstellen. Auftraggeber erhalten Quellcode und Dokumentation und bleiben damit unabhängig vom Dienstleister.",
};

function buildDossier(brand: BrandKey): string {
  const cfg = getBrandConfig(brand);
  const loc = getBusinessLocation(brand);
  const live = getLiveProfiles(brand);
  const open = getOpenTargets(brand);

  const lines: string[] = [];
  const push = (s = "") => lines.push(s);

  push(`# Citation-Dossier — ${cfg.publicName}`);
  push();
  push(
    `Generiert aus der Codebasis (\`npm run seo:citations\`). Nicht von Hand bearbeiten —`
  );
  push(
    `Änderungen an Adresse, Texten oder Profilen gehören in \`config/businessLocations.ts\`,`
  );
  push(`\`config/seo/brands.ts\` bzw. \`config/seo/profiles.ts\`.`);
  push();

  // — NAP record ————————————————————————————————————————
  push(`## 1. NAP-Datensatz (exakt so übernehmen)`);
  push();
  push(
    `Jede Abweichung — auch „Str." statt „Straße" — schwächt das Signal. Immer kopieren, nie tippen.`
  );
  push();
  push(`| Feld | Wert |`);
  push(`| --- | --- |`);
  push(`| Firmenname | ${cfg.publicName} |`);
  push(`| Rechtlicher Name | ${loc.legalName} |`);
  push(`| Inhaber | ${cfg.primaryOwner} |`);
  push(`| Straße | ${loc.street} |`);
  push(`| PLZ | ${loc.postalCode} |`);
  push(`| Ort | ${loc.city} |`);
  push(`| Bundesland | ${loc.region} |`);
  push(`| Land | ${loc.country} (${loc.countryCode}) |`);
  push(`| E-Mail | ${cfg.email} |`);
  push(`| Website | ${cfg.canonicalDomain}/ |`);
  push(`| Presse-/Angabenseite | ${cfg.canonicalDomain}/presse |`);
  push(`| Einzugsgebiet | ${cfg.areaServed.join(", ")} |`);
  push();
  push(`**Adress-Politik:** Die Anschrift ist ausschließlich im Impressum veröffentlicht.`);
  push(
    `Bei Portalen mit Karteneintrag die Option „Adresse ausblenden / Servicegebiet" wählen.`
  );
  push(
    `Es besteht kein Ladenlokal — keine Öffnungszeiten eintragen, keine Vor-Ort-Termine ohne Vereinbarung zusagen.`
  );
  push();

  // — Texts ——————————————————————————————————————————————
  push(`## 2. Beschreibungstexte`);
  push();
  push(`**Kurz (ca. 100 Zeichen, für Listenansichten):**`);
  push();
  push(`> ${SHORT_DESC[brand]}`);
  push();
  push(`**Mittel (ca. 250 Zeichen, Standardfeld der meisten Portale):**`);
  push();
  push(`> ${MEDIUM_DESC[brand]}`);
  push();
  push(
    `**Lang:** siehe ${cfg.canonicalDomain}/presse — dort steht die freigegebene Langfassung.`
  );
  push();
  push(`**Branchenrubriken (überall identisch wählen):**`);
  push();
  RUBRICS[brand].forEach((r) => push(`- ${r}`));
  push();
  push(`**Schlagworte:**`);
  push();
  push(KEYWORDS[brand].join(", "));
  push();

  // — Live profiles ————————————————————————————————————
  push(`## 3. Bereits bestehende Profile (${live.length})`);
  push();
  if (live.length === 0) {
    push(`_Noch keine._`);
  } else {
    push(`| Profil | URL | Link |`);
    push(`| --- | --- | --- |`);
    live.forEach((p) => push(`| ${p.name} | ${p.url} | ${p.linkType} |`));
    push();
    push(
      `Diese URLs werden als \`sameAs\` im Organization-JSON-LD ausgeliefert. Ein Profil erst`
    );
    push(`nach Freischaltung auf \`status: "live"\` setzen.`);
  }
  push();

  // — Open targets ——————————————————————————————————————
  push(`## 4. Offene Einreichungen (${open.length})`);
  push();
  push(
    `Reihenfolge nach erwartetem Nutzen. Nach jeder Freischaltung den Eintrag in`
  );
  push(
    `\`config/seo/profiles.ts\` mit der echten Profil-URL und \`status: "live"\` ergänzen.`
  );
  push();

  let n = 0;
  for (const category of CATEGORY_ORDER) {
    const group = open.filter((t) => t.category === category);
    if (group.length === 0) continue;
    push(`### ${CATEGORY_LABEL[category]}`);
    push();
    push(`| # | Portal | Einstieg | Adresse | Link | Kosten | Hinweis |`);
    push(`| --- | --- | --- | --- | --- | --- | --- |`);
    for (const t of group) {
      n += 1;
      push(
        `| ${n} | ${t.name} | ${t.url} | ${POLICY_LABEL[t.addressPolicy]} | ${t.linkType} | ${
          t.free ? "kostenlos" : "kostenpflichtig"
        } | ${t.note ?? "—"} |`
      );
    }
    push();
  }

  // — Process ————————————————————————————————————————————
  push(`## 5. Vorgehen`);
  push();
  push(
    `1. Einen Portalzugang pro Marke mit der jeweiligen Marken-E-Mail anlegen, nicht privat.`
  );
  push(
    `2. NAP-Datensatz aus Abschnitt 1 kopieren. Keine Variante des Firmennamens erfinden.`
  );
  push(
    `3. Beschreibung aus Abschnitt 2 in der Länge einsetzen, die das Portal zulässt.`
  );
  push(`4. Als Website die Startseite verlinken, nicht eine Unterseite.`);
  push(
    `5. Bestätigungs-E-Mail bzw. Postkarten-Verifizierung abwarten und den Eintrag prüfen.`
  );
  push(
    `6. Profil-URL in \`config/seo/profiles.ts\` eintragen, \`status: "live"\`, dann deployen —`
  );
  push(`   damit erscheint sie automatisch in \`sameAs\` und auf der Presseseite.`);
  push();
  push(`## 6. Was hier bewusst nicht steht`);
  push();
  push(
    `Gekaufte Links, Linktausch-Netzwerke, automatisierte Masseneinträge und Bewertungen`
  );
  push(
    `ohne echten Kundenkontakt sind nicht Teil dieses Dossiers. Sie verstoßen gegen die`
  );
  push(
    `Google-Richtlinien für Spam und gefährden die Sichtbarkeit beider Domains dauerhaft.`
  );
  push();

  return lines.join("\n");
}

function main(): void {
  const outDir = join(process.cwd(), "reports", "citations");
  mkdirSync(outDir, { recursive: true });

  for (const brand of BRANDS) {
    const md = buildDossier(brand);
    const file = join(outDir, `${brand}.md`);
    writeFileSync(file, md, "utf8");
    const open = getOpenTargets(brand).length;
    const live = getLiveProfiles(brand).length;
    console.log(
      `${getBrandConfig(brand).publicName}: ${live} Profile live, ${open} offen → reports/citations/${brand}.md`
    );
  }
}

main();
