/**
 * Location pages (Phase 7) — NRW city pages as CANDIDATE (noindex).
 *
 * Hard rules (enforced by `seo:location-pages` + the shared location guard):
 *  - No fake offices/branches: both brands are legally based in Unna only
 *    (config/businessLocations.ts, isPublicOfficeClaimAllowed=false). No "Büro
 *    in <Stadt>", no "besuchen Sie uns", no opening hours, no geo coordinates.
 *  - Only service-area phrasing is allowed ("für Unternehmen in <Stadt>", "im
 *    Ruhrgebiet", "aus NRW", "regional und deutschlandweit").
 *  - REAL local differentiation per city — never a generic templated city page.
 *    Same-brand pages that are near-identical are blocked (generic-template).
 *  - AGI Works (/standorte, technical) and NEXCEL AI (/standorte, strategic)
 *    must read differently (cross-domain duplicate guard).
 *  - Candidate by default: approved=false, manualIndexApproval=false → noindex.
 */

import type { BrandKey } from "@/config/seo/domains";
import type { FaqItem, FeatureItem, ProcessStep } from "@/lib/templates/types";

export interface LocationPage {
  id: string;
  brand: BrandKey;
  slug: string;
  path: string;
  city: string;
  /** Real region context (e.g. "Ruhrgebiet", "NRW"). */
  region: string;
  serviceName: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  heroIntro: string;
  /** AEO direct answer, city-specific. */
  aeoAnswer: string;
  /** Real local differentiation — city-specific facts, no office claim. */
  localContext: string;
  services: FeatureItem[];
  industries: string[];
  process: ProcessStep[];
  faq: FaqItem[];
  /** Neighbouring city slugs (same brand) for internal links. */
  nearbyCities: string[];
  relatedPaths: string[];
  /** Service-area statement for JSON-LD (never an address). */
  areaServed: string[];
  approved: boolean;
  manualIndexApproval: boolean;
}

/* Shared, small building blocks (kept short so pages stay clearly distinct). */

const AGI_SERVICES: FeatureItem[] = [
  { title: "Web-Apps & Portale", description: "Individuelle Anwendungen mit Login, Rollen und Datenlogik." },
  { title: "ERP-, CRM- & Admin-Systeme", description: "Betriebszentralen, die reale Prozesse abbilden." },
  { title: "Schnittstellen", description: "Systeme sauber verbinden, statt Daten manuell zu übertragen." },
  { title: "Websysteme", description: "Performante, wartbare Seiten mit SEO-Basis." },
];

const AGI_PROCESS: ProcessStep[] = [
  { title: "Analyse", description: "Prozesse, Rollen und Ziele remote oder vor Ort nach Vereinbarung aufnehmen." },
  { title: "Architektur", description: "Datenmodell und Systemdesign festlegen." },
  { title: "Umsetzung", description: "In kurzen Zyklen produktionsreif entwickeln." },
  { title: "Launch & Betrieb", description: "Ausrollen, überwachen und weiterentwickeln." },
];

const NEXCEL_SERVICES: FeatureItem[] = [
  { title: "KI & Automatisierung", description: "Wiederkehrende Abläufe strukturiert automatisieren." },
  { title: "Lead- & CRM-Prozesse", description: "Anfragen erfassen, qualifizieren und nachfassen." },
  { title: "Customer Experience", description: "Konsistente Journeys über alle Kontaktpunkte." },
  { title: "Digitale Betriebssysteme", description: "Prozesse, Daten und Kommunikation verbinden." },
];

const NEXCEL_PROCESS: ProcessStep[] = [
  { title: "Systemanalyse", description: "Prozesse und Potenziale remote oder vor Ort nach Vereinbarung bewerten." },
  { title: "Konzept", description: "Automatisierungs- und CX-Logik entwerfen." },
  { title: "Umsetzung", description: "Technische Realisierung gemeinsam mit AGI Works." },
  { title: "Optimierung", description: "Wirkung messen und nachschärfen." },
];

/* ── AGI Works — Softwareentwicklung, /standorte/* ─────────────────────────── */

const AGI_LOCATIONS: LocationPage[] = [
  {
    id: "agiworks:/standorte/dortmund",
    brand: "agiworks",
    slug: "dortmund",
    path: "/standorte/dortmund",
    city: "Dortmund",
    region: "Ruhrgebiet",
    serviceName: "Softwareentwicklung Dortmund",
    title: "Softwareentwicklung Dortmund | AGI Works",
    description:
      "AGI Works entwickelt Web-Apps, SaaS-, ERP- und CRM-Systeme für Unternehmen in Dortmund und im Ruhrgebiet — remote und vor Ort nach Vereinbarung.",
    eyebrow: "Standort",
    h1: "Softwareentwicklung für Unternehmen in Dortmund",
    heroIntro:
      "Individuelle Software für Dortmunder Unternehmen: Web-Apps, Plattformen und Unternehmenssysteme, entwickelt mit sauberer Architektur.",
    aeoAnswer:
      "AGI Works entwickelt individuelle Software für Unternehmen in Dortmund: Web-Apps, SaaS, ERP-, CRM- und Admin-Systeme. Die Zusammenarbeit läuft remote und bei Bedarf vor Ort nach Vereinbarung, das Unternehmen ist rechtlich in Unna im Kreis Unna ansässig. Passend für den Dortmunder Mittelstand und Dienstleister mit spezifischen Prozessen. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Dortmund hat sich vom Kohle- und Stahlstandort zu einem der größten Technologie- und Dienstleistungsstandorte des Ruhrgebiets entwickelt, mit starkem Mittelstand, Logistik, Versicherungen und einer wachsenden Digitalwirtschaft rund um den Technologiepark. Für diese Unternehmen ist individuelle, wartbare Software oft entscheidender als ein weiteres Standardtool.",
    services: AGI_SERVICES,
    industries: ["Logistik & Handel", "Versicherungen & Dienstleistung", "Handwerk & Mittelstand", "IT & Digitalwirtschaft"],
    process: AGI_PROCESS,
    faq: [
      { question: "Arbeitet AGI Works vor Ort in Dortmund?", answer: "Die Zusammenarbeit läuft überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der rechtliche Sitz ist Unna." },
      { question: "Für welche Dortmunder Unternehmen eignet sich das?", answer: "Für Mittelstand und Dienstleister mit Prozessen, die Standardsoftware nicht sauber abbildet." },
      { question: "Was wird konkret entwickelt?", answer: "Web-Apps, SaaS-Plattformen sowie ERP-, CRM- und Admin-Systeme mit sauberer Architektur." },
      { question: "Wie beginnt ein Projekt?", answer: "Mit einer kostenlosen Systemanalyse, die Ziele, Umfang und Projektkorridor klärt." },
      { question: "Werden bestehende Systeme angebunden?", answer: "Ja, über Schnittstellen werden vorhandene Systeme sauber integriert." },
    ],
    nearbyCities: ["unna", "bochum", "essen"],
    relatedPaths: ["/leistungen/web-app-entwicklung", "/leistungen/erp-system-entwicklung", "/systemanalyse", "/kontakt"],
    areaServed: ["Dortmund", "Ruhrgebiet", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/standorte/unna",
    brand: "agiworks",
    slug: "unna",
    path: "/standorte/unna",
    city: "Unna",
    region: "Kreis Unna",
    serviceName: "Softwareentwicklung Unna",
    title: "Softwareentwicklung Unna | AGI Works",
    description:
      "AGI Works ist in Unna ansässig und entwickelt Web-Apps, ERP- und CRM-Systeme für Unternehmen in Unna, im Kreis Unna und deutschlandweit.",
    eyebrow: "Standort",
    h1: "Softwareentwicklung für Unternehmen in Unna",
    heroIntro:
      "AGI Works ist rechtlich in Unna ansässig und entwickelt individuelle Software für Unternehmen in der Region und darüber hinaus.",
    aeoAnswer:
      "AGI Works ist als Einzelunternehmen rechtlich in Unna ansässig und entwickelt individuelle Software für Unternehmen in Unna und im Kreis Unna. Die Zusammenarbeit ist remote und vor Ort nach Vereinbarung möglich. Passend für den regionalen Mittelstand und Handwerksbetriebe mit Digitalisierungsbedarf. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Unna ist Kreisstadt im östlichen Ruhrgebiet mit einem bodenständigen Mittelstand aus Handwerk, Handel und Dienstleistung. Viele Betriebe arbeiten noch mit Insellösungen aus Excel und E-Mail; hier schafft eine sauber gebaute Anwendung schnell Ordnung, ohne fremde Prozesse überzustülpen. Als ansässiges Unternehmen kennt AGI Works die regionale Ausgangslage.",
    services: AGI_SERVICES,
    industries: ["Handwerk", "Regionaler Handel", "Dienstleister im Kreis Unna", "Mittelstand"],
    process: AGI_PROCESS,
    faq: [
      { question: "Ist AGI Works wirklich in Unna ansässig?", answer: "Ja, der rechtliche Sitz des Einzelunternehmens ist Unna; das ist eine Rechtsadresse, kein öffentliches Ladenlokal." },
      { question: "Für wen in Unna eignet sich das?", answer: "Für Handwerk, Handel und Dienstleister, die Prozesse aus Excel und E-Mail in ein sauberes System überführen wollen." },
      { question: "Muss ich für Termine anreisen?", answer: "Nein, die Zusammenarbeit ist remote möglich; Termine vor Ort erfolgen nach Vereinbarung." },
      { question: "Was kostet ein Projekt?", answer: "Der Projektkorridor hängt vom Umfang ab und wird nach der Systemanalyse eingeordnet." },
      { question: "Können bestehende Daten übernommen werden?", answer: "Ja, ein Migrationspfad aus vorhandenen Tools ist Teil des Projekts." },
    ],
    nearbyCities: ["dortmund", "bochum"],
    relatedPaths: ["/leistungen/erp-system-entwicklung", "/leistungen/softwareentwicklung", "/systemanalyse", "/kontakt"],
    areaServed: ["Unna", "Kreis Unna", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/standorte/bochum",
    brand: "agiworks",
    slug: "bochum",
    path: "/standorte/bochum",
    city: "Bochum",
    region: "Ruhrgebiet",
    serviceName: "Softwareentwicklung Bochum",
    title: "Softwareentwicklung Bochum | AGI Works",
    description:
      "AGI Works entwickelt sichere Web-Apps und Unternehmenssysteme für Unternehmen in Bochum und im Ruhrgebiet — mit Fokus auf Datenschutz und Architektur.",
    eyebrow: "Standort",
    h1: "Softwareentwicklung für Unternehmen in Bochum",
    heroIntro:
      "Individuelle Software für Bochumer Unternehmen: Anwendungen mit sauberer Architektur, klaren Rollen und Sicherheitsfokus.",
    aeoAnswer:
      "AGI Works entwickelt individuelle Software für Unternehmen in Bochum, mit besonderem Augenmerk auf sichere Architektur und Datenschutz. Die Zusammenarbeit läuft remote und vor Ort nach Vereinbarung, der Sitz ist Unna. Passend für Gesundheits-, Bildungs- und Technologiebetriebe. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Bochum steht sinnbildlich für den Strukturwandel im Ruhrgebiet: aus Bergbau wurden Hochschulen, Gesundheitswirtschaft und ein bekanntes IT-Sicherheitsumfeld rund um die Universität. Für Betriebe in diesem Umfeld zählen saubere Architektur, Zugriffsschutz und Nachvollziehbarkeit besonders — genau dort setzt individuelle Softwareentwicklung an.",
    services: AGI_SERVICES,
    industries: ["Gesundheitswirtschaft", "Hochschulnahe Betriebe", "IT & Sicherheit", "Dienstleister"],
    process: AGI_PROCESS,
    faq: [
      { question: "Spielt Datensicherheit eine Rolle?", answer: "Ja, Zugriffsschutz, Eingabevalidierung und ein Rollenkonzept sind fester Bestandteil jeder Umsetzung." },
      { question: "Arbeitet AGI Works in Bochum vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der Sitz ist Unna." },
      { question: "Für welche Bochumer Betriebe passt das?", answer: "Für Gesundheits-, Bildungs- und Technologiebetriebe mit Bedarf an sicheren, individuellen Anwendungen." },
      { question: "Was wird gebaut?", answer: "Web-Apps, Portale sowie ERP-, CRM- und Admin-Systeme mit sauberer Architektur." },
      { question: "Wie startet man?", answer: "Mit einer kostenlosen Systemanalyse, die Anforderungen und Projektkorridor klärt." },
    ],
    nearbyCities: ["dortmund", "essen", "unna"],
    relatedPaths: ["/leistungen/web-app-entwicklung", "/leistungen/kundenportal-entwicklung", "/systemanalyse", "/kontakt"],
    areaServed: ["Bochum", "Ruhrgebiet", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/standorte/essen",
    brand: "agiworks",
    slug: "essen",
    path: "/standorte/essen",
    city: "Essen",
    region: "Ruhrgebiet",
    serviceName: "Softwareentwicklung Essen",
    title: "Softwareentwicklung Essen | AGI Works",
    description:
      "AGI Works entwickelt skalierbare Web-Apps und Unternehmenssysteme für Unternehmen in Essen und im Ruhrgebiet — remote und vor Ort nach Vereinbarung.",
    eyebrow: "Standort",
    h1: "Softwareentwicklung für Unternehmen in Essen",
    heroIntro:
      "Individuelle Software für Essener Unternehmen: Systeme, die auch bei wachsenden Anforderungen und mehreren Standorten tragen.",
    aeoAnswer:
      "AGI Works entwickelt individuelle, skalierbare Software für Unternehmen in Essen, von Web-Apps bis zu ERP- und CRM-Systemen. Die Zusammenarbeit läuft remote und vor Ort nach Vereinbarung, der Sitz ist Unna. Passend für dienstleistungs- und konzernnahe Betriebe mit gewachsenen Strukturen. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Essen ist ein traditioneller Konzern- und Dienstleistungsstandort mit vielen Unternehmenszentralen aus Energie, Handel und Beratung. In gewachsenen Strukturen mit mehreren Bereichen sind saubere Datenmodelle, Rollenkonzepte und belastbare Schnittstellen entscheidend, damit Systeme nicht zur Bremse werden.",
    services: AGI_SERVICES,
    industries: ["Energie & Versorgung", "Handel", "Beratung & Dienstleistung", "Unternehmensgruppen"],
    process: AGI_PROCESS,
    faq: [
      { question: "Eignet sich das für größere Strukturen?", answer: "Ja, die Architektur wird auf Wachstum, mehrere Bereiche und belastbare Schnittstellen ausgelegt." },
      { question: "Arbeitet AGI Works in Essen vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der Sitz ist Unna." },
      { question: "Können mehrere Systeme verbunden werden?", answer: "Ja, über saubere Schnittstellen mit Fehler-Handling und Datenmapping." },
      { question: "Für welche Essener Betriebe passt das?", answer: "Für dienstleistungs- und konzernnahe Betriebe mit gewachsenen, spezifischen Prozessen." },
      { question: "Wie startet man?", answer: "Mit einer kostenlosen Systemanalyse, die Umfang und Projektkorridor bestimmt." },
    ],
    nearbyCities: ["bochum", "dortmund", "duesseldorf"],
    relatedPaths: ["/leistungen/erp-system-entwicklung", "/leistungen/api-entwicklung", "/systemanalyse", "/kontakt"],
    areaServed: ["Essen", "Ruhrgebiet", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "agiworks:/standorte/duesseldorf",
    brand: "agiworks",
    slug: "duesseldorf",
    path: "/standorte/duesseldorf",
    city: "Düsseldorf",
    region: "NRW",
    serviceName: "Softwareentwicklung Düsseldorf",
    title: "Softwareentwicklung Düsseldorf | AGI Works",
    description:
      "AGI Works entwickelt individuelle Web-Apps, Plattformen und Portale für Unternehmen in Düsseldorf und NRW — remote und vor Ort nach Vereinbarung.",
    eyebrow: "Standort",
    h1: "Softwareentwicklung für Unternehmen in Düsseldorf",
    heroIntro:
      "Individuelle Software für Düsseldorfer Unternehmen: Plattformen und Portale, die zu einem anspruchsvollen Markenumfeld passen.",
    aeoAnswer:
      "AGI Works entwickelt individuelle Software für Unternehmen in Düsseldorf: Web-Apps, Plattformen, Portale und Unternehmenssysteme. Die Zusammenarbeit läuft remote und vor Ort nach Vereinbarung, der Sitz ist Unna. Passend für Beratungs-, Agentur- und Handelsumfelder mit hohem Qualitätsanspruch. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Düsseldorf ist Landeshauptstadt und ein wirtschaftsstarker Standort mit Schwerpunkten in Beratung, Werbung, Mode und Handel. In einem markenbewussten Umfeld zählen neben der Technik auch Auftritt, Performance und ein durchdachtes Nutzererlebnis — individuelle Entwicklung verbindet beides statt auf Baukasten-Kompromisse zu setzen.",
    services: AGI_SERVICES,
    industries: ["Beratung", "Agentur & Werbung", "Mode & Handel", "Dienstleister"],
    process: AGI_PROCESS,
    faq: [
      { question: "Passt individuelle Software zu einem Markenumfeld?", answer: "Ja, Auftritt, Performance und Nutzererlebnis werden gemeinsam mit der technischen Umsetzung gedacht." },
      { question: "Arbeitet AGI Works in Düsseldorf vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der Sitz ist Unna." },
      { question: "Was wird entwickelt?", answer: "Web-Apps, Plattformen, Portale sowie ERP-, CRM- und Admin-Systeme." },
      { question: "Für welche Düsseldorfer Betriebe passt das?", answer: "Für Beratungen, Agenturen und Handelsbetriebe mit hohem Qualitätsanspruch." },
      { question: "Wie startet man?", answer: "Mit einer kostenlosen Systemanalyse, die Anforderungen und Projektkorridor klärt." },
    ],
    nearbyCities: ["essen", "bochum"],
    relatedPaths: ["/leistungen/web-app-entwicklung", "/leistungen/saas-entwicklung", "/systemanalyse", "/kontakt"],
    areaServed: ["Düsseldorf", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
];

/* ── NEXCEL AI — KI-Automatisierung, /standorte/* ──────────────────────────── */

const NEXCEL_LOCATIONS: LocationPage[] = [
  {
    id: "nexcel:/standorte/dortmund",
    brand: "nexcel",
    slug: "dortmund",
    path: "/standorte/dortmund",
    city: "Dortmund",
    region: "Ruhrgebiet",
    serviceName: "KI-Automatisierung Dortmund",
    title: "KI-Automatisierung Dortmund · NEXCEL AI",
    description:
      "NEXCEL AI entwickelt KI-Systeme, Automatisierungen und digitale Betriebssysteme für Unternehmen in Dortmund und im Ruhrgebiet — remote und vor Ort nach Vereinbarung.",
    eyebrow: "Standort",
    h1: "KI-Automatisierung für Unternehmen in Dortmund",
    heroIntro:
      "KI und Automatisierung für Dortmunder Unternehmen: Prozesse, die sich selbst erledigen, und Kommunikation, die konsistent wirkt.",
    aeoAnswer:
      "NEXCEL AI konzipiert KI-Systeme, Automatisierungen und Customer-Experience-Prozesse für Unternehmen in Dortmund. Die Zusammenarbeit läuft remote und vor Ort nach Vereinbarung, der rechtliche Sitz ist Unna im Kreis Unna. Passend für dienstleistungsstarke Betriebe mit viel wiederkehrender Kommunikation. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Dortmund entwickelt sich zu einem digital geprägten Dienstleistungsstandort im Ruhrgebiet, mit vielen Betrieben, deren Alltag von Anfragen, Terminen und Kundenkommunikation bestimmt ist. Genau dort entfalten KI-gestützte Automatisierung und durchdachte Customer-Experience-Prozesse spürbare Entlastung.",
    services: NEXCEL_SERVICES,
    industries: ["Dienstleister", "Handel & Service", "Beauty & Gesundheit", "Digitalwirtschaft"],
    process: NEXCEL_PROCESS,
    faq: [
      { question: "Arbeitet NEXCEL AI vor Ort in Dortmund?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der rechtliche Sitz ist Unna." },
      { question: "Was bringt KI-Automatisierung konkret?", answer: "Wiederkehrende Aufgaben wie Eingangsbearbeitung und Nachfassen laufen automatisiert, mit menschlicher Kontrolle an sensiblen Stellen." },
      { question: "Für welche Dortmunder Unternehmen passt das?", answer: "Für dienstleistungsstarke Betriebe mit viel Kommunikation und wiederkehrenden Abläufen." },
      { question: "Wie wird umgesetzt?", answer: "NEXCEL AI konzipiert die Systeme, die technische Umsetzung erfolgt gemeinsam mit AGI Works." },
      { question: "Wie startet man?", answer: "Mit einer kostenlosen Systemanalyse, die Potenziale und Projektkorridor klärt." },
    ],
    nearbyCities: ["unna", "bochum", "essen"],
    relatedPaths: ["/loesungen/automatisierung", "/loesungen/lead-automation", "/systemanalyse", "/kontakt"],
    areaServed: ["Dortmund", "Ruhrgebiet", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/standorte/unna",
    brand: "nexcel",
    slug: "unna",
    path: "/standorte/unna",
    city: "Unna",
    region: "Kreis Unna",
    serviceName: "KI-Automatisierung Unna",
    title: "KI-Automatisierung Unna · NEXCEL AI",
    description:
      "NEXCEL AI ist in Unna ansässig und entwickelt KI-Systeme, Automatisierungen und Lead-Prozesse für Unternehmen in Unna, im Kreis Unna und deutschlandweit.",
    eyebrow: "Standort",
    h1: "KI-Automatisierung für Unternehmen in Unna",
    heroIntro:
      "NEXCEL AI ist rechtlich in Unna ansässig und bringt KI, Automatisierung und Customer Experience zu Unternehmen in der Region.",
    aeoAnswer:
      "NEXCEL AI ist als Einzelunternehmen rechtlich in Unna ansässig und konzipiert KI-Systeme, Automatisierungen und Lead-Prozesse für Unternehmen in Unna und im Kreis Unna. Die Zusammenarbeit ist remote und vor Ort nach Vereinbarung möglich. Passend für den regionalen Mittelstand mit wiederkehrender Kundenkommunikation. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Unna ist Kreisstadt im östlichen Ruhrgebiet mit einem bodenständigen Mittelstand, in dem viele Abläufe noch manuell über Telefon, Excel und E-Mail laufen. Gerade hier lohnt sich der Einstieg in Automatisierung mit klaren Regeln und menschlicher Kontrolle, ohne dass Betriebe ihre gewohnte Nähe zu Kunden verlieren.",
    services: NEXCEL_SERVICES,
    industries: ["Mittelstand", "Dienstleister im Kreis Unna", "Handel & Service", "Handwerk"],
    process: NEXCEL_PROCESS,
    faq: [
      { question: "Ist NEXCEL AI wirklich in Unna ansässig?", answer: "Ja, der rechtliche Sitz des Einzelunternehmens ist Unna; das ist eine Rechtsadresse, kein öffentliches Ladenlokal." },
      { question: "Ist Automatisierung für kleine Betriebe sinnvoll?", answer: "Ja, oft schon bei einem einzelnen wiederkehrenden Ablauf; die Wirkung wird über konkrete Ziele gemessen." },
      { question: "Bleibt die Nähe zum Kunden erhalten?", answer: "Ja, Automatik übernimmt Routine, während persönliche Kommunikation beim Team bleibt." },
      { question: "Muss ich anreisen?", answer: "Nein, die Zusammenarbeit ist remote möglich; Termine vor Ort erfolgen nach Vereinbarung." },
      { question: "Wie startet man?", answer: "Mit einer kostenlosen Systemanalyse, die Potenziale und Projektkorridor klärt." },
    ],
    nearbyCities: ["dortmund", "bochum"],
    relatedPaths: ["/loesungen/automatisierung", "/loesungen/customer-experience-systeme", "/systemanalyse", "/kontakt"],
    areaServed: ["Unna", "Kreis Unna", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/standorte/bochum",
    brand: "nexcel",
    slug: "bochum",
    path: "/standorte/bochum",
    city: "Bochum",
    region: "Ruhrgebiet",
    serviceName: "KI-Automatisierung Bochum",
    title: "KI-Automatisierung Bochum · NEXCEL AI",
    description:
      "NEXCEL AI entwickelt KI-Systeme und Customer-Experience-Prozesse für Unternehmen in Bochum und im Ruhrgebiet — DSGVO-bewusst und mit klarer Kontrolle.",
    eyebrow: "Standort",
    h1: "KI-Automatisierung für Unternehmen in Bochum",
    heroIntro:
      "KI und Customer Experience für Bochumer Unternehmen: automatisierte Abläufe mit Datenschutzbewusstsein und menschlicher Kontrolle.",
    aeoAnswer:
      "NEXCEL AI konzipiert KI-Systeme und Customer-Experience-Prozesse für Unternehmen in Bochum, mit besonderem Augenmerk auf Datenschutz und Nachvollziehbarkeit. Die Zusammenarbeit läuft remote und vor Ort nach Vereinbarung, der Sitz ist Unna. Passend für Gesundheits-, Bildungs- und Servicebetriebe. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Bochum ist geprägt von Hochschulen, Gesundheitswirtschaft und einem starken Bewusstsein für IT-Sicherheit. In diesem Umfeld müssen Automatisierung und KI besonders transparent und datenschutzkonform gestaltet sein — mit klaren Regeln, Einwilligung und menschlicher Kontrolle statt Blackbox.",
    services: NEXCEL_SERVICES,
    industries: ["Gesundheit & Pflege", "Bildung", "Service & Dienstleistung", "Hochschulnahe Betriebe"],
    process: NEXCEL_PROCESS,
    faq: [
      { question: "Wie steht es um Datenschutz?", answer: "Datenschutz, Einwilligung und Nachvollziehbarkeit werden von Beginn an eingeplant." },
      { question: "Arbeitet NEXCEL AI in Bochum vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der Sitz ist Unna." },
      { question: "Bleibt die Kontrolle beim Team?", answer: "Ja, sensible Schritte behalten eine menschliche Freigabe; die KI arbeitet nach Ihren Regeln." },
      { question: "Für welche Bochumer Betriebe passt das?", answer: "Für Gesundheits-, Bildungs- und Servicebetriebe mit wiederkehrender Kommunikation." },
      { question: "Wie startet man?", answer: "Mit einer kostenlosen Systemanalyse, die Potenziale und Projektkorridor klärt." },
    ],
    nearbyCities: ["dortmund", "essen", "unna"],
    relatedPaths: ["/loesungen/customer-experience-systeme", "/loesungen/automatisierung", "/systemanalyse", "/kontakt"],
    areaServed: ["Bochum", "Ruhrgebiet", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/standorte/essen",
    brand: "nexcel",
    slug: "essen",
    path: "/standorte/essen",
    city: "Essen",
    region: "Ruhrgebiet",
    serviceName: "KI-Automatisierung Essen",
    title: "KI-Automatisierung Essen · NEXCEL AI",
    description:
      "NEXCEL AI entwickelt KI-Systeme, Automatisierung und Lead-Prozesse für Unternehmen in Essen und im Ruhrgebiet — remote und vor Ort nach Vereinbarung.",
    eyebrow: "Standort",
    h1: "KI-Automatisierung für Unternehmen in Essen",
    heroIntro:
      "KI und Automatisierung für Essener Unternehmen: skalierbare Prozesse und Lead-Systeme für dienstleistungsstarke Strukturen.",
    aeoAnswer:
      "NEXCEL AI konzipiert KI-Systeme, Automatisierungen und Lead-Prozesse für Unternehmen in Essen. Die Zusammenarbeit läuft remote und vor Ort nach Vereinbarung, der Sitz ist Unna. Passend für dienstleistungs- und vertriebsstarke Betriebe mit hohem Anfragevolumen. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Essen ist ein dienstleistungs- und konzernstarker Standort mit vielen Vertriebs- und Serviceorganisationen. Bei hohem Anfrage- und Kommunikationsvolumen zahlt sich strukturierte Lead-Automation und KI-gestützte Priorisierung besonders aus, weil planbarer Vertrieb hier direkt auf das Wachstum wirkt.",
    services: NEXCEL_SERVICES,
    industries: ["Vertrieb & Service", "Handel", "Beratung", "Dienstleistung"],
    process: NEXCEL_PROCESS,
    faq: [
      { question: "Eignet sich das bei hohem Anfragevolumen?", answer: "Ja, Lead-Automation und KI-Priorisierung sind gerade bei vielen Anfragen wirkungsvoll." },
      { question: "Arbeitet NEXCEL AI in Essen vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der Sitz ist Unna." },
      { question: "Wird der Vertrieb planbarer?", answer: "Ja, über strukturierte Lead-Strecken mit Attribution und nachvollziehbarer Pipeline." },
      { question: "Wie wird umgesetzt?", answer: "NEXCEL AI konzipiert die Prozesse, AGI Works übernimmt die technische Umsetzung." },
      { question: "Wie startet man?", answer: "Mit einer kostenlosen Systemanalyse, die Potenziale und Projektkorridor klärt." },
    ],
    nearbyCities: ["bochum", "dortmund", "duesseldorf"],
    relatedPaths: ["/loesungen/lead-automation", "/loesungen/ki-fuer-vertrieb", "/systemanalyse", "/kontakt"],
    areaServed: ["Essen", "Ruhrgebiet", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
  {
    id: "nexcel:/standorte/duesseldorf",
    brand: "nexcel",
    slug: "duesseldorf",
    path: "/standorte/duesseldorf",
    city: "Düsseldorf",
    region: "NRW",
    serviceName: "KI-Automatisierung Düsseldorf",
    title: "KI-Automatisierung Düsseldorf · NEXCEL AI",
    description:
      "NEXCEL AI entwickelt KI-Systeme, Customer Experience und Automatisierung für Unternehmen in Düsseldorf und NRW — remote und vor Ort nach Vereinbarung.",
    eyebrow: "Standort",
    h1: "KI-Automatisierung für Unternehmen in Düsseldorf",
    heroIntro:
      "KI, Automatisierung und Customer Experience für Düsseldorfer Unternehmen: konsistente Erlebnisse in einem markenbewussten Umfeld.",
    aeoAnswer:
      "NEXCEL AI konzipiert KI-Systeme, Customer-Experience-Prozesse und Automatisierung für Unternehmen in Düsseldorf. Die Zusammenarbeit läuft remote und vor Ort nach Vereinbarung, der Sitz ist Unna. Passend für Agentur-, Beratungs- und Handelsumfelder mit hohem Anspruch an das Kundenerlebnis. Der nächste Schritt ist eine kostenlose Systemanalyse.",
    localContext:
      "Düsseldorf ist Landeshauptstadt mit starkem Agentur-, Beratungs- und Handelsumfeld, in dem das Kundenerlebnis Teil der Marke ist. Hier zählt eine konsistente, gut orchestrierte Customer Experience über alle Kanäle — unterstützt durch Automatisierung, die entlastet, ohne die persönliche Note zu verdrängen.",
    services: NEXCEL_SERVICES,
    industries: ["Agentur & Werbung", "Beratung", "Mode & Handel", "Dienstleistung"],
    process: NEXCEL_PROCESS,
    faq: [
      { question: "Passt Automatisierung zu einem Markenumfeld?", answer: "Ja, sie entlastet bei Routine, während die persönliche, markenkonforme Kommunikation erhalten bleibt." },
      { question: "Arbeitet NEXCEL AI in Düsseldorf vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der Sitz ist Unna." },
      { question: "Was steht im Fokus?", answer: "Eine konsistente Customer Experience über alle Kontaktpunkte, unterstützt durch KI und Automatisierung." },
      { question: "Für welche Düsseldorfer Betriebe passt das?", answer: "Für Agenturen, Beratungen und Handelsbetriebe mit hohem Anspruch an das Kundenerlebnis." },
      { question: "Wie startet man?", answer: "Mit einer kostenlosen Systemanalyse, die Potenziale und Projektkorridor klärt." },
    ],
    nearbyCities: ["essen", "bochum"],
    relatedPaths: ["/loesungen/customer-experience-systeme", "/loesungen/ki-systeme", "/systemanalyse", "/kontakt"],
    areaServed: ["Düsseldorf", "Nordrhein-Westfalen", "Deutschland"],
    approved: true,
    manualIndexApproval: true,
  },
];

export const LOCATION_PAGES: LocationPage[] = [...AGI_LOCATIONS, ...NEXCEL_LOCATIONS];

export function getLocationPagesForBrand(brand: BrandKey): LocationPage[] {
  return LOCATION_PAGES.filter((p) => p.brand === brand);
}

export function getLocationPage(brand: BrandKey, slug: string): LocationPage | undefined {
  return LOCATION_PAGES.find((p) => p.brand === brand && p.slug === slug);
}
