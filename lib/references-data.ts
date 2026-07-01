/**
 * NEXCEL AI / AGI WORKS · Statische Referenz-Anfangsdaten
 * Wird als Fallback genutzt, wenn kein Datenbank-Eintrag vorhanden.
 */

export type ReferenceEntry = {
  id: string;
  slug: string;
  title: string;
  clientName: string;
  shortDescription: string;
  fullDescription: string;
  type: string;
  tags: string[];
  modules: string[];
  websiteUrl?: string;
  status: "live" | "demo" | "intern" | "referenz";
  coverImage: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: string;
};

export const STATIC_REFERENCES: ReferenceEntry[] = [
  {
    id: "ref_cannabbros",
    slug: "cannabbros",
    title: "CannabiBros",
    clientName: "CannabiBros CSC",
    shortDescription: "Digitale Club-Plattform für Cannabis Social Clubs mit Mitgliederverwaltung, token-basiertem Shop und Compliance-System.",
    fullDescription: "Eine vollständige digitale Infrastruktur für einen regulierten Cannabis Social Club: Mitgliederverwaltung mit Rollen und Freigaben, ein token-basierter Mitglieder-Shop mit Limits und Bestellverwaltung, Abholbuchung in Echtzeit, Produkt- und Content-Verwaltung sowie ein Sicherheits- und Compliance-Modul — 100 % KCanG-konform.",
    type: "Mitglieder-Plattform",
    tags: ["SaaS", "Mitglieder", "Admin Panel", "Buchungssystem", "E-Commerce"],
    modules: ["Mitgliederverwaltung", "Token-Shop", "Bestellverwaltung", "Abholbuchung", "Compliance & Sicherheit", "Produkt-CMS", "Admin-Dashboard"],
    status: "live",
    coverImage: "/images/references/cannabbros.png",
    sortOrder: 1,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref_beautybar",
    slug: "beautybar",
    title: "BeautyBar Akademie",
    clientName: "BeautyBar Akademie",
    shortDescription: "Premium Buchungssystem mit Admin-Dashboard für Behandlungen und Schulungen.",
    fullDescription: "Vollständiges Online-Buchungssystem für eine Beauty-Akademie: Kunden buchen Behandlungen und Schulungen direkt online, Mitarbeiter verwalten Termine im Kalender, das Admin-Dashboard gibt Echtzeit-Übersicht über Buchungen, Umsätze und Leistungen. Inklusive Leistungsverwaltung und Galerie-CMS.",
    type: "Buchungssystem",
    tags: ["Buchungssystem", "Admin Panel", "Website", "Kundenportal"],
    modules: ["Online-Buchung", "Terminkalender", "Leistungsverwaltung", "Admin-Dashboard", "Galerie-CMS", "Kundenverwaltung"],
    status: "live",
    coverImage: "/images/references/beautybar.png",
    sortOrder: 2,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref_agi_energy",
    slug: "agi-energy",
    title: "AGI Energy",
    clientName: "AGI Energy GmbH",
    shortDescription: "Lead-Funnel & Vertriebsplattform für Energieanbieter mit rollenbasiertem Partner-Dashboard.",
    fullDescription: "Eine digitale Vertriebsplattform für den Energiesektor: Persönliche Energieprüfung statt anonymer Tarifportale, automatisches Lead-Routing an Partner, rollenbasiertes Partner-Dashboard, Admin-Cockpit mit Echtzeit-Reporting über Leads und Provisionen, Aufgabenmanagement und Compliance-Funktionen.",
    type: "Lead-Funnel & CRM",
    tags: ["Lead Funnel", "CRM", "Admin Panel", "SaaS", "Automatisierung"],
    modules: ["Lead-Funnel", "Partner-Dashboard", "Admin-Cockpit", "Lead-Verteilung", "Rollen & Rechte", "Reporting", "Automatisierungen"],
    websiteUrl: undefined,
    status: "live",
    coverImage: "/images/references/agi-energy.png",
    sortOrder: 3,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref_immobilien_weissleder",
    slug: "immobilien-weissleder",
    title: "Immobilien Weissleder",
    clientName: "Immobilien Weissleder",
    shortDescription: "Digitale Immobilienplattform für Vermarktung, Verwaltung und Kommunikation.",
    fullDescription: "Eine zentrale Plattform, die Vermarktung, Verwaltung und Kommunikation nahtlos verbindet: Premium-Webseite mit Immobilienangeboten, CRM für Interessenten und Anfragen, Objektverwaltung mit Upload und Pflege, Hausverwaltung, Handwerker-Verwaltung, Mängelmeldungen und Admin-Dashboard.",
    type: "Branchen-Plattform",
    tags: ["Website", "CRM", "Admin Panel", "ERP"],
    modules: ["Premium-Webseite", "Immobilienverwaltung", "CRM", "Hausverwaltung", "Handwerker-Verwaltung", "Mängelmeldungen", "Admin-Dashboard"],
    websiteUrl: "https://immobilien-weissleder.de",
    status: "live",
    coverImage: "/images/references/immobilien-weissleder.png",
    sortOrder: 4,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref_lulus_beauty",
    slug: "lulus-beauty",
    title: "Lulu's Beauty",
    clientName: "Lulu's Beauty Studio",
    shortDescription: "Luxuriöses Buchungssystem mit Service-Auswahl, Terminverwaltung und Admin-Panel.",
    fullDescription: "Ein maßgeschneidertes Buchungssystem für ein exklusives Beauty-Studio: Online-Terminbuchung mit Service-Auswahl und Preisen, Echtzeit-Kalender für das Team, Admin-Panel mit Dashboard, Leistungsverwaltung und Galerie. Kunden erleben eine Premium-Buchungsstrecke direkt auf der Website.",
    type: "Buchungssystem",
    tags: ["Buchungssystem", "Website", "Admin Panel", "Kundenportal"],
    modules: ["Online-Buchung", "Service-Auswahl", "Terminkalender", "Admin-Dashboard", "Leistungsverwaltung", "Galerie"],
    status: "live",
    coverImage: "/images/references/lulus-beauty.png",
    sortOrder: 5,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref_pflegenest",
    slug: "pflegenest",
    title: "PflegeNest Bochum",
    clientName: "PflegeNest Bochum",
    shortDescription: "Digitale Plattform für ambulante Pflege — von der Patientenaufnahme bis zur Schichtplanung.",
    fullDescription: "Eine integrierte Lösung für einen ambulanten Pflegedienst: digitale Patientenaufnahme, Anamnese, Pflegegrad-Check, Einsatzplanung und Schichtplanung, CRM für Patienten und Angehörige, Recruiting-Modul, Operations-Wall für den täglichen Betrieb und ein Netzwerk für Krankenhäuser und Partner.",
    type: "Branchen-Plattform",
    tags: ["SaaS", "CRM", "Admin Panel", "ERP", "Automatisierung"],
    modules: ["Patientenaufnahme", "Anamnese", "Pflegegrad-Check", "Einsatzplanung", "Schichtplanung", "CRM", "Recruiting", "Operations-Wall"],
    status: "live",
    coverImage: "/images/references/pflegenest.png",
    sortOrder: 6,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref_impuls_pflege",
    slug: "impuls-pflege",
    title: "IMPULS Pflegeplattform",
    clientName: "IMPULS Ambulante Pflegedienste",
    shortDescription: "Digitale Komplettlösung für ambulante Pflegedienste — Website, Karriere, Anamnese und Verwaltung.",
    fullDescription: "Die digitale Komplettlösung für ambulante Pflegedienste: Premium-Website, Karriere- und Bewerbungsmodul, digitale Anamnese-Erfassung, Stellenverwaltung, Dokumenten- und Inhaltsverwaltung sowie ein zentrales Admin-System. Alles DSGVO-konform, sicher und in einer Plattform vereint.",
    type: "Branchen-Plattform",
    tags: ["Website", "SaaS", "Admin Panel", "Automatisierung"],
    modules: ["Website", "Karriere & Bewerbungen", "Digitale Anamnese", "Stellenverwaltung", "Dokumentenverwaltung", "Inhaltsverwaltung", "Admin-System"],
    status: "live",
    coverImage: "/images/references/impuls-pflege.png",
    sortOrder: 7,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref_lokfuehrerzentrum",
    slug: "lokfuehrerzentrum",
    title: "Lokführerzentrum",
    clientName: "Lokführerzentrum",
    shortDescription: "Lead-Funnel, Bewerbermanagement und Operations-System für staatlich geförderte Lokführer-Weiterbildung.",
    fullDescription: "Eine vollständige Vertriebsplattform: Conversion-optimierter Lead-Funnel mit Eignungscheck, automatisiertes CRM und Pipeline-Management, Kanban-Bearbeitungsansicht, rollenbasierte Benutzerverwaltung, Reporting & Analytics, Vorlagen und Automationen für Nachrichten und Prozesse.",
    type: "Lead-Funnel & CRM",
    tags: ["Lead Funnel", "CRM", "Admin Panel", "Automatisierung"],
    modules: ["Lead-Funnel & Eignungscheck", "CRM & Pipeline", "Kanban-Board", "Rollen & Rechte", "Reporting", "Automationen & Vorlagen", "Bewerbermanagement"],
    websiteUrl: "https://lokfuehrerzentrum.de",
    status: "live",
    coverImage: "/images/references/lokfuehrerzentrum.png",
    sortOrder: 8,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "ref_born_to_run",
    slug: "born-to-run",
    title: "Born to Run",
    clientName: "Born to Run Events",
    shortDescription: "Digitale Event-Plattform mit Live-Tracking, KI-Analyse und operativer Steuerung für Großevents.",
    fullDescription: "Eine vollständig digitalisierte Plattform für Großsport-Events: öffentliche Event-Website mit Anmeldung, Live-Tracking und Leaderboard in Echtzeit, KI-gestützte Performance-Analyse für Teilnehmer, Operations Center mit Ticket-System und Schichtplanung, Helfer-App, Inventar & Material, Medical & Sicherheit.",
    type: "Branchen-Plattform",
    tags: ["SaaS", "KI-System", "Admin Panel", "App", "Automatisierung"],
    modules: ["Event-Website & Anmeldung", "Live-Tracking & Leaderboard", "KI-Performance-Analyse", "Operations Center", "Ticket-System", "Schichtplanung", "Helfer-App", "Inventar & Material"],
    status: "live",
    coverImage: "/images/references/born-to-run.png",
    sortOrder: 9,
    isPublished: true,
    createdAt: new Date().toISOString(),
  },
];
