/**
 * Reference detail pages — /projekte/<slug> for both brands.
 *
 * The project FACTS live in `lib/references-data.ts` (before / after / result /
 * modules) and are never restated or embellished here: no invented metrics, no
 * claims that are not already in the reference record. `caseStudyGuard` and the
 * content rules both enforce that.
 *
 * What differs per brand is the QUESTION each page answers about the same real
 * project:
 *  - AGI Works → how the system was built (architecture, modules, technique).
 *  - NEXCEL AI → which process changed and what it replaced.
 *
 * That keeps cross-domain similarity far below the 0.6 duplicate threshold
 * while both brands can legitimately reference joint work.
 */

import type { BrandKey } from "@/config/seo/domains";
import { STATIC_REFERENCES, type ReferenceEntry } from "@/lib/references-data";
import type { SystemSlug } from "@/lib/systems-slugs";

export interface ReferencePage {
  id: string;
  brand: BrandKey;
  slug: string;
  path: string;
  /** The underlying real project record. */
  reference: ReferenceEntry;
  title: string;
  description: string;
  h1: string;
  /** Direct answer describing the project in full sentences. */
  aeoAnswer: string;
  /** Brand-specific framing paragraph. */
  focus: string;
  relatedPaths: string[];
  approved: boolean;
  manualIndexApproval: boolean;
}

interface BrandRefCopy {
  title: string;
  description: string;
  h1: string;
  aeoAnswer: string;
  focus: string;
}

interface RefSeed {
  /** Systems this project demonstrates — drives internal links. */
  systems: SystemSlug[];
  /** Same-brand commercial anchors. */
  money: Record<BrandKey, string[]>;
  copy: Record<BrandKey, BrandRefCopy>;
}

const MONEY_PREFIX: Record<BrandKey, string> = {
  nexcel: "/loesungen",
  agiworks: "/leistungen",
};

const SEEDS: Record<string, RefSeed> = {
  cannabbros: {
    systems: ["mitglieder-clubverwaltung", "saas-plattform-multi-tenant", "admin-operations-system"],
    money: {
      nexcel: ["digitale-betriebssysteme", "automatisierung"],
      agiworks: ["saas-entwicklung", "web-app-entwicklung"],
    },
    copy: {
      nexcel: {
        title: "CannabiBros: Clubverwaltung digitalisiert · NEXCEL AI",
        description:
          "Von Excel-Listen und Papier zu einer digitalen Mitgliederverwaltung mit Bestellprozess, Limits und regelkonformer Dokumentation.",
        h1: "Ein Club, der seine Verwaltung nicht mehr per Liste führt",
        aeoAnswer:
          "Vor dem Projekt liefen Mitgliederdaten und Bestellungen bei CannabiBros über Excel-Listen und Papier, ohne digitale Kontrolle. Heute laufen Mitgliedschaft, Bestellungen mit Limits, Abholtermine und die zugehörige Dokumentation über ein zusammenhängendes System. Damit sind Bestände und Limits jederzeit kontrollierbar und die Abläufe erfüllen die Vorgaben des KCanG.",
        focus:
          "Der Kern war nicht die Oberfläche, sondern die Regellogik dahinter: Wer darf wie viel bestellen, wann greift ein Limit, und wie wird jeder Schritt so dokumentiert, dass er später nachvollziehbar bleibt. Diese Regeln wurden als Prozess abgebildet, statt sie dem Personal zu überlassen.",
      },
      agiworks: {
        title: "CannabiBros: Club-Plattform entwickelt | AGI Works",
        description:
          "Mitgliederverwaltung, token-basierter Shop, Abholbuchung und Compliance-Modul als zusammenhängende Plattform mit Rollen und Freigaben.",
        h1: "Eine Plattform aus Mitgliedern, Shop und Compliance",
        aeoAnswer:
          "Für CannabiBros wurde eine digitale Infrastruktur mit sieben Modulen entwickelt: Mitgliederverwaltung mit Rollen und Freigaben, token-basierter Shop, Bestellverwaltung, Abholbuchung in Echtzeit, Produkt-CMS, Admin-Dashboard sowie ein Sicherheits- und Compliance-Modul. Die Module greifen auf eine gemeinsame Datenbasis zu, sodass Bestände und Limits an jeder Stelle konsistent bleiben.",
        focus:
          "Technisch anspruchsvoll war die Verbindung von Shop-Logik und Compliance: Kontingente müssen bei jeder Bestellung serverseitig geprüft werden, gleichzeitig muss die Abholbuchung in Echtzeit den verfügbaren Bestand widerspiegeln. Beides läuft über dieselbe Datenbasis, damit keine Abweichungen entstehen.",
      },
    },
  },

  beautybar: {
    systems: ["buchungs-beauty-systeme", "admin-operations-system", "dashboard-reporting"],
    money: {
      nexcel: ["automatisierung", "customer-experience-systeme"],
      agiworks: ["web-app-entwicklung", "webseiten-erstellen-lassen"],
    },
    copy: {
      nexcel: {
        title: "BeautyBar: Terminvergabe automatisiert · NEXCEL AI",
        description:
          "Statt telefonischer Terminvergabe buchen Kundinnen selbst — mit weniger Verwaltungsaufwand und laufender Übersicht über die Auslastung.",
        h1: "Termine, die nicht mehr am Telefon vergeben werden",
        aeoAnswer:
          "Die BeautyBar Akademie vergab Termine zuvor telefonisch. Nach der Umstellung buchen Kundinnen Behandlungen und Schulungen selbst online, das Team pflegt sie im Kalender, und ein Dashboard zeigt Buchungen, Umsätze und Leistungen in Echtzeit. Der Verwaltungsaufwand sinkt, weil die Erfassung nicht mehr manuell nebenher passiert.",
        focus:
          "Interessant war die Doppelrolle des Betriebs: Behandlungen und Schulungen folgen unterschiedlicher Logik in Dauer, Kapazität und Preisstruktur. Beide Buchungsarten laufen über dieselbe Strecke, ohne dass Kundinnen den Unterschied merken.",
      },
      agiworks: {
        title: "BeautyBar: Buchungssystem entwickelt | AGI Works",
        description:
          "Online-Buchung, Terminkalender, Leistungsverwaltung und Galerie-CMS als eigenes System mit Admin-Dashboard entwickelt.",
        h1: "Buchungssystem mit Kalender, Verwaltung und CMS",
        aeoAnswer:
          "Für die BeautyBar Akademie entstand ein Buchungssystem aus sechs Bausteinen: Online-Buchung, Terminkalender für das Team, Leistungsverwaltung, Kundenverwaltung, Galerie-CMS und ein Admin-Dashboard mit Echtzeit-Übersicht. Behandlungen und Schulungen werden im selben System abgebildet, obwohl sie unterschiedliche Kapazitätsregeln haben.",
        focus:
          "Die Leistungsverwaltung wurde bewusst datengetrieben gebaut: Neue Behandlungen, Preise und Dauern pflegt das Studio selbst, ohne dass dafür Code angefasst werden muss. Das Galerie-CMS folgt demselben Prinzip.",
      },
    },
  },

  "agi-energy": {
    systems: ["lead-funnels-crm", "vertriebsplattform-partnerportal", "dashboard-reporting"],
    money: {
      nexcel: ["lead-automation", "ki-fuer-vertrieb"],
      agiworks: ["saas-entwicklung", "crm-system-entwicklung"],
    },
    copy: {
      nexcel: {
        title: "AGI Energy: Leadprozess strukturiert · NEXCEL AI",
        description:
          "Statt anonymer Tarifportale eine persönliche Energieprüfung mit automatischem Routing — Leads gehen nicht mehr unstrukturiert verloren.",
        h1: "Leads, die nicht mehr zwischen Partnern verschwinden",
        aeoAnswer:
          "Im Energievertrieb gingen Leads zuvor über anonyme Tarifportale und ohne Struktur an Partner. Ersetzt wurde das durch eine persönliche Energieprüfung mit automatischem Lead-Routing, einem Partner-Dashboard und einem Admin-Cockpit, das Leads und Provisionen in Echtzeit ausweist. Der Vertrieb wird dadurch planbar, weil jeder Lead einen nachvollziehbaren Status hat.",
        focus:
          "Entscheidend war die Verteilungslogik: Welcher Partner bekommt welchen Lead, in welcher Zeit muss reagiert werden, und was passiert, wenn nicht reagiert wird. Erst diese Regeln machen aus einer Lead-Liste einen steuerbaren Prozess.",
      },
      agiworks: {
        title: "AGI Energy: Vertriebsplattform entwickelt | AGI Works",
        description:
          "Lead-Funnel, rollenbasiertes Partner-Dashboard und Admin-Cockpit mit Reporting und Automatisierungen als Plattform umgesetzt.",
        h1: "Vertriebsplattform mit Partnerrollen und Reporting",
        aeoAnswer:
          "Die Plattform für AGI Energy besteht aus Lead-Funnel, automatischer Lead-Verteilung, einem rollenbasierten Partner-Dashboard, einem Admin-Cockpit mit Reporting sowie Aufgabenmanagement und Compliance-Funktionen. Das Rollenmodell trennt dabei strikt, welche Daten ein Partner sieht und welche ausschließlich der Zentrale vorbehalten sind.",
        focus:
          "Der technische Schwerpunkt lag auf dem Rechtemodell. Sobald mehrere Partner auf derselben Datenbasis arbeiten, muss jede Abfrage die Sichtbarkeit berücksichtigen — nicht erst die Oberfläche. Das Reporting aggregiert darüber hinweg für die Zentrale.",
      },
    },
  },

  "immobilien-weissleder": {
    systems: ["branchen-plattformen", "erp-systeme", "premium-websysteme"],
    money: {
      nexcel: ["digitale-betriebssysteme", "customer-experience-systeme"],
      agiworks: ["erp-system-entwicklung", "webseiten-erstellen-lassen"],
    },
    copy: {
      nexcel: {
        title: "Weissleder: Verwaltung zusammengeführt · NEXCEL AI",
        description:
          "Vermarktung, Verwaltung und Kommunikation liefen getrennt und manuell — heute laufen sie über eine zentrale Plattform zusammen.",
        h1: "Drei getrennte Abläufe auf einer Plattform",
        aeoAnswer:
          "Bei Immobilien Weissleder liefen Vermarktung, Verwaltung und Kommunikation zuvor getrennt und manuell. Heute verbindet eine zentrale Plattform Webseite, Interessenten-CRM, Objektverwaltung, Hausverwaltung, Handwerker-Koordination und Mängelmeldungen. Anfragen und Mängel werden dadurch schneller bearbeitet, weil sie im selben System ankommen, in dem auch die Objektdaten liegen.",
        focus:
          "Der eigentliche Gewinn liegt an den Übergängen: Eine Anfrage auf der Webseite, ein Objekt in der Verwaltung und eine Mängelmeldung des Mieters betreffen häufig dieselbe Immobilie. Erst die gemeinsame Datenbasis macht diesen Zusammenhang sichtbar.",
      },
      agiworks: {
        title: "Weissleder: Immobilienplattform entwickelt | AGI Works",
        description:
          "Premium-Webseite, CRM, Objekt- und Hausverwaltung, Handwerker-Modul und Mängelmeldungen als eine Anwendung entwickelt.",
        h1: "Immobilienplattform von Webseite bis Hausverwaltung",
        aeoAnswer:
          "Die Plattform für Immobilien Weissleder umfasst sieben Bereiche: Premium-Webseite mit Angeboten, CRM für Interessenten und Anfragen, Immobilienverwaltung mit Upload und Pflege, Hausverwaltung, Handwerker-Verwaltung, Mängelmeldungen und ein Admin-Dashboard. Alle Bereiche arbeiten auf demselben Objektdatenmodell.",
        focus:
          "Das Objektdatenmodell war die Entwurfsentscheidung, an der alles hing: Eine Immobilie erscheint gleichzeitig als Exposé in der Vermarktung, als Verwaltungseinheit in der Hausverwaltung und als Bezugspunkt einer Mängelmeldung. Modelliert wurde sie deshalb einmal, mit unterschiedlichen Sichten darauf.",
      },
    },
  },

  "lulus-beauty": {
    systems: ["buchungs-beauty-systeme", "premium-websysteme", "admin-operations-system"],
    money: {
      nexcel: ["customer-experience-systeme", "automatisierung"],
      agiworks: ["webseiten-erstellen-lassen", "web-app-entwicklung"],
    },
    copy: {
      nexcel: {
        title: "Lulu's Beauty: Auslastung im Blick · NEXCEL AI",
        description:
          "Terminvergabe lief per Anruf, ohne Übersicht über die Auslastung. Heute buchen Kundinnen selbst und der Kalender füllt sich ohne Rückrufe.",
        h1: "Volle Kalender ohne Telefon-Pingpong",
        aeoAnswer:
          "Lulu's Beauty Studio vergab Termine ausschließlich per Anruf und hatte dabei keine verlässliche Übersicht über die Auslastung. Nach der Umstellung wählen Kundinnen Leistung und Termin direkt auf der Website, das Team sieht den Kalender in Echtzeit. Die Buchungsstrecke ist Teil des Markenauftritts und nicht ein fremdes Buchungsportal.",
        focus:
          "Bei einem Premium-Studio ist die Buchung Teil des Erlebnisses. Deshalb wurde die Strecke bewusst nicht an ein externes Portal ausgelagert, sondern in Gestaltung und Ablauf an den Auftritt des Studios angepasst.",
      },
      agiworks: {
        title: "Lulu's Beauty: Buchungsstrecke entwickelt | AGI Works",
        description:
          "Service-Auswahl mit Preisen, Echtzeit-Kalender und Admin-Panel mit Leistungsverwaltung und Galerie direkt auf der Website umgesetzt.",
        h1: "Buchung direkt auf der Website statt im Fremdportal",
        aeoAnswer:
          "Für Lulu's Beauty Studio wurde die Buchung als Bestandteil der eigenen Website entwickelt: Service-Auswahl mit Preisen, Terminkalender in Echtzeit für das Team sowie ein Admin-Panel mit Dashboard, Leistungsverwaltung und Galerie. Damit bleibt der gesamte Ablauf unter der eigenen Domain.",
        focus:
          "Buchungen in die eigene Seite zu integrieren statt einzubetten hat einen konkreten Nebeneffekt: Ladezeit und Darstellung bleiben kontrollierbar, und die Buchungsstrecke ist nicht von der Verfügbarkeit eines Drittanbieters abhängig.",
      },
    },
  },

  pflegenest: {
    systems: ["branchen-plattformen", "projekt-aufgabenmanagement", "mitarbeiter-hr-system"],
    money: {
      nexcel: ["digitale-betriebssysteme", "automatisierung"],
      agiworks: ["saas-entwicklung", "erp-system-entwicklung"],
    },
    copy: {
      nexcel: {
        title: "PflegeNest: Papierprozesse abgelöst · NEXCEL AI",
        description:
          "Patientenaufnahme und Einsatzplanung liefen auf Papier mit verstreuten Informationen — heute laufen sie in einem System zusammen.",
        h1: "Ambulante Pflege ohne Zettelwirtschaft",
        aeoAnswer:
          "Bei PflegeNest Bochum liefen Patientenaufnahme und Einsatzplanung zuvor auf Papier, Informationen lagen verstreut. Heute decken digitale Aufnahme, Anamnese, Pflegegrad-Check, Einsatz- und Schichtplanung, CRM und eine Operations-Wall den Tagesbetrieb ab. Der Verwaltungsaufwand sinkt, weil Angaben einmal erfasst und danach überall verwendet werden.",
        focus:
          "In der ambulanten Pflege hängen Aufnahme, Pflegegrad und Einsatzplanung direkt zusammen: Was bei der Aufnahme erfasst wird, bestimmt Dauer und Qualifikation des Einsatzes. Diese Kette wurde durchgängig abgebildet, statt sie auf getrennte Werkzeuge zu verteilen.",
      },
      agiworks: {
        title: "PflegeNest: Pflegeplattform entwickelt | AGI Works",
        description:
          "Aufnahme, Anamnese, Pflegegrad-Check, Einsatz- und Schichtplanung, CRM, Recruiting und Operations-Wall als eine Plattform entwickelt.",
        h1: "Pflegeplattform mit acht verbundenen Modulen",
        aeoAnswer:
          "Die Plattform für PflegeNest Bochum besteht aus acht Modulen: Patientenaufnahme, Anamnese, Pflegegrad-Check, Einsatzplanung, Schichtplanung, CRM für Patienten und Angehörige, Recruiting sowie eine Operations-Wall für den täglichen Betrieb. Ergänzt wird sie um ein Netzwerk für Krankenhäuser und Partner.",
        focus:
          "Die Einsatz- und Schichtplanung war der aufwendigste Teil: Verfügbarkeit von Personal, Qualifikation, Wegezeiten und Patientenbedarf müssen gleichzeitig aufgehen. Umgesetzt wurde das als Planungsmodell, das Konflikte sichtbar macht, statt sie stillschweigend zu überschreiben.",
      },
    },
  },

  "impuls-pflege": {
    systems: ["recruiting-bewerberplattform", "dokumentenmanagement-freigaben", "premium-websysteme"],
    money: {
      nexcel: ["automatisierung", "email-automation"],
      agiworks: ["webseiten-erstellen-lassen", "web-app-entwicklung"],
    },
    copy: {
      nexcel: {
        title: "IMPULS: Bewerbung und Anamnese digital · NEXCEL AI",
        description:
          "Bewerbungen und Anamnese liefen per E-Mail und Papierformular. Heute laufen beide Strecken strukturiert und datenschutzkonform.",
        h1: "Zwei Papierprozesse, die jetzt digital laufen",
        aeoAnswer:
          "Bei IMPULS Ambulante Pflegedienste liefen Bewerbungen per E-Mail und die Anamnese über Papierformulare. Beide Strecken sind heute digital: Bewerbungen kommen strukturiert über ein Karriere-Modul, die Anamnese wird direkt erfasst. Alles liegt in einer Plattform und ist datenschutzkonform abgebildet.",
        focus:
          "In der Pflege konkurrieren Betriebe stark um Personal. Eine Bewerbung, die strukturiert ankommt und schnell beantwortet werden kann, ist deshalb kein Verwaltungsdetail, sondern ein direkter Vorteil bei der Besetzung offener Stellen.",
      },
      agiworks: {
        title: "IMPULS: Pflegeplattform entwickelt | AGI Works",
        description:
          "Website, Karriere- und Bewerbungsmodul, digitale Anamnese, Stellen- und Dokumentenverwaltung als zusammenhängendes System umgesetzt.",
        h1: "Website, Karriere und Anamnese in einem System",
        aeoAnswer:
          "Für IMPULS Ambulante Pflegedienste entstand eine Plattform aus sieben Bausteinen: Premium-Website, Karriere- und Bewerbungsmodul, digitale Anamnese-Erfassung, Stellenverwaltung, Dokumentenverwaltung, Inhaltsverwaltung und ein zentrales Admin-System. Die öffentliche Website und der geschützte Bereich teilen sich dabei eine Codebasis.",
        focus:
          "Weil Bewerbungs- und Anamnesedaten besonders schützenswert sind, wurden Zugriffsrechte und Aufbewahrung von Beginn an im Datenmodell festgelegt und nicht nachträglich über die Oberfläche eingeschränkt.",
      },
    },
  },

  lokfuehrerzentrum: {
    systems: ["lead-funnels-crm", "recruiting-bewerberplattform", "dashboard-reporting"],
    money: {
      nexcel: ["lead-automation", "crm-automation"],
      agiworks: ["crm-system-entwicklung", "web-app-entwicklung"],
    },
    copy: {
      nexcel: {
        title: "Lokführerzentrum: Bewerber qualifiziert · NEXCEL AI",
        description:
          "Interesse ohne Qualifizierung und manuelle Nachverfolgung wurden durch einen Funnel mit Eignungscheck und automatischem Nachfassen ersetzt.",
        h1: "Aus Interesse wird ein qualifizierter Bewerber",
        aeoAnswer:
          "Beim Lokführerzentrum kam Bewerber-Interesse zuvor unqualifiziert an und musste manuell nachverfolgt werden. Heute filtert ein Eignungscheck im Funnel vor, ein CRM übernimmt Pipeline und Nachverfolgung, und Automationen versenden Nachrichten anhand des Status. Die Conversion wird dadurch messbar und das Bewerberaufkommen planbar.",
        focus:
          "Bei geförderten Weiterbildungen entscheidet die Vorqualifizierung über die Wirtschaftlichkeit: Wer die Fördervoraussetzungen nicht erfüllt, bindet Beratungszeit ohne Ergebnis. Der Eignungscheck klärt das vor dem ersten Gespräch.",
      },
      agiworks: {
        title: "Lokführerzentrum: CRM-Plattform entwickelt | AGI Works",
        description:
          "Lead-Funnel mit Eignungscheck, CRM mit Pipeline, Kanban-Board, Rollenverwaltung, Reporting und Automationen als Plattform entwickelt.",
        h1: "Funnel, Pipeline und Kanban in einer Anwendung",
        aeoAnswer:
          "Die Plattform für das Lokführerzentrum umfasst einen conversion-optimierten Lead-Funnel mit Eignungscheck, ein CRM mit Pipeline-Management, eine Kanban-Bearbeitungsansicht, rollenbasierte Benutzerverwaltung, Reporting und Analytics sowie Vorlagen und Automationen für Nachrichten und Prozesse.",
        focus:
          "Die Kanban-Ansicht und die Pipeline greifen auf denselben Datensatz zu, nur in unterschiedlicher Darstellung. Das klingt selbstverständlich, verlangt aber eine Statusmodellierung, die beide Sichten widerspruchsfrei bedient.",
      },
    },
  },

  "born-to-run": {
    systems: ["branchen-plattformen", "saas-plattform-multi-tenant", "ki-automatisierung"],
    money: {
      nexcel: ["ki-systeme", "digitale-betriebssysteme"],
      agiworks: ["saas-entwicklung", "api-entwicklung"],
    },
    copy: {
      nexcel: {
        title: "Born to Run: Events in Echtzeit steuern · NEXCEL AI",
        description:
          "Anmeldung, Zeitmessung und Helfer-Einsatz liefen über Papierlisten. Heute ist der Eventtag in Echtzeit steuerbar.",
        h1: "Ein Eventtag, der sich in Echtzeit steuern lässt",
        aeoAnswer:
          "Bei Born to Run Events liefen Anmeldung, Zeitmessung und Helfer-Einsatz zuvor über Papierlisten. Heute decken Event-Website mit Anmeldung, Live-Tracking mit Leaderboard, ein Operations Center mit Ticket-System und Schichtplanung sowie eine Helfer-App den gesamten Ablauf ab. Operative Fehler am Eventtag gehen zurück, weil alle Beteiligten denselben aktuellen Stand sehen.",
        focus:
          "Ein Großevent verzeiht keine Verzögerung: Entscheidungen fallen im Minutentakt und lassen sich nicht nachträglich korrigieren. Deshalb wurde jeder Bereich so ausgelegt, dass der aktuelle Stand ohne Rückfrage sichtbar ist.",
      },
      agiworks: {
        title: "Born to Run: Event-Plattform entwickelt | AGI Works",
        description:
          "Live-Tracking, Leaderboard, KI-Performance-Analyse, Operations Center, Ticket-System, Schichtplanung und Helfer-App umgesetzt.",
        h1: "Event-Plattform mit Live-Tracking und Operations Center",
        aeoAnswer:
          "Die Plattform für Born to Run Events besteht aus acht Bereichen: Event-Website mit Anmeldung, Live-Tracking und Leaderboard in Echtzeit, KI-gestützte Performance-Analyse für Teilnehmer, Operations Center, Ticket-System, Schichtplanung, Helfer-App sowie Inventar- und Materialverwaltung, ergänzt um Medical und Sicherheit.",
        focus:
          "Live-Tracking stellt andere Anforderungen als übliche Web-Anwendungen: Viele gleichzeitige Zugriffe treffen auf Daten, die sich sekündlich ändern. Auslieferung und Aktualisierung wurden deshalb getrennt ausgelegt, damit das Leaderboard auch unter Last aktuell bleibt.",
      },
    },
  },
};

function buildReferencePages(): ReferencePage[] {
  const pages: ReferencePage[] = [];
  (["nexcel", "agiworks"] as BrandKey[]).forEach((brand) => {
    STATIC_REFERENCES.filter((r) => r.isPublished).forEach((reference) => {
      const seed = SEEDS[reference.slug];
      if (!seed) return;
      const copy = seed.copy[brand];
      const relatedPaths = Array.from(
        new Set([
          ...seed.systems.map((s) => `/systeme/${s}`),
          ...seed.money[brand].map((m) => `${MONEY_PREFIX[brand]}/${m}`),
          "/projekte",
          "/systemanalyse",
        ])
      );
      pages.push({
        id: `${brand}:/projekte/${reference.slug}`,
        brand,
        slug: reference.slug,
        path: `/projekte/${reference.slug}`,
        reference,
        title: copy.title,
        description: copy.description,
        h1: copy.h1,
        aeoAnswer: copy.aeoAnswer,
        focus: copy.focus,
        relatedPaths,
        approved: true,
        manualIndexApproval: true,
      });
    });
  });
  return pages;
}

export const REFERENCE_PAGES: ReferencePage[] = buildReferencePages();

export function getReferencePage(
  brand: BrandKey,
  slug: string
): ReferencePage | undefined {
  return REFERENCE_PAGES.find((p) => p.brand === brand && p.slug === slug);
}

export function getReferencePagesForBrand(brand: BrandKey): ReferencePage[] {
  return REFERENCE_PAGES.filter((p) => p.brand === brand);
}
