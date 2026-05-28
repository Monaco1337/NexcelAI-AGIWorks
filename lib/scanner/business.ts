// Business translator — produces an INDIVIDUAL executive diagnosis
// for each scanned site. It uses the rich SiteSignals from web.ts
// to tailor industry, diagnosis, opportunities and module ranking.

import type { ScanResult } from "./types";
import type { SiteSignals } from "./web";

export type Industry =
  | "beauty"
  | "realestate"
  | "consulting"
  | "care"
  | "ecommerce"
  | "saas"
  | "agency"
  | "restaurant"
  | "fitness"
  | "automotive"
  | "legal"
  | "medical"
  | "generic";

export interface Opportunity {
  id: string;
  problem: string;
  matters: string;
  improvement: string;
  effect: string;
}

export interface BusinessScore {
  id: string;
  label: string;
  hint: string;
  value: number;
}

export interface SystemModule {
  name: string;
  benefit: string;
  /** Higher = more relevant for this specific site. Used for ranking. */
  weight?: number;
}

export interface SystemRecommendation {
  name: string;
  oneliner: string;
  modules: SystemModule[];
  impact: string;
}

export interface ExecutiveAnalysis {
  domain: string;
  brand: string;
  industry: Industry;
  industryLabel: string;
  potentialScore: number;
  diagnosis: string;
  diagnosisDetail: string;
  confidence: number;
  scores: BusinessScore[];
  opportunities: Opportunity[];
  recommendation: SystemRecommendation;
  /** Plain-language facts the system observed — proves individuality. */
  observations: string[];
}

/* ─── Industry detection (weighted) ─────────────────────────── */

const INDUSTRY_WEIGHTS: { id: Industry; label: string; words: RegExp[] }[] = [
  {
    id: "care",
    label: "Pflege & Betreuung",
    words: [/pflegedienst/i, /ambulant/i, /tagespflege/i, /intensivpflege/i, /altenpflege/i, /seniorenheim/i, /betreuung/i, /pflege\b/i],
  },
  {
    id: "medical",
    label: "Praxis & Medizin",
    words: [/praxis/i, /klinik/i, /arzt/i, /ärzt/i, /zahnarzt/i, /physio/i, /therap/i, /hebamm/i, /reha/i, /patient/i],
  },
  {
    id: "beauty",
    label: "Beauty & Wellness",
    words: [/beauty/i, /kosmetik/i, /nagel/i, /friseur/i, /salon/i, /barber/i, /brow/i, /lash/i, /makeup/i, /wellness/i, /spa\b/i, /massage/i],
  },
  {
    id: "realestate",
    label: "Immobilien",
    words: [/immobilien/i, /makler/i, /exposé/i, /wohnung/i, /grundstück/i, /haus[-\s]kauf/i],
  },
  {
    id: "legal",
    label: "Recht & Steuern",
    words: [/anwalt/i, /kanzlei/i, /rechtsanwalt/i, /steuerberat/i, /notar/i],
  },
  {
    id: "consulting",
    label: "Beratung",
    words: [/unternehmensberat/i, /consulting/i, /strategie/i, /managementberat/i, /coach\b/i],
  },
  {
    id: "ecommerce",
    label: "Onlinehandel",
    words: [/warenkorb/i, /\bshop\b/i, /bestellen/i, /versand/i, /produkt/i],
  },
  {
    id: "saas",
    label: "Software / SaaS",
    words: [/saas/i, /\bsoftware\b/i, /\bplatform\b/i, /\bapp\b/i],
  },
  {
    id: "agency",
    label: "Agentur",
    words: [/\bagentur\b/i, /webdesign/i, /werbeagentur/i],
  },
  {
    id: "restaurant",
    label: "Gastronomie",
    words: [/restaurant/i, /bistro/i, /\bcafé\b/i, /\bcafe\b/i, /speisekarte/i, /reservier/i],
  },
  {
    id: "fitness",
    label: "Fitness",
    words: [/\bfitness\b/i, /personal[-\s]?trainer/i, /\bgym\b/i, /yoga/i, /pilates/i],
  },
  {
    id: "automotive",
    label: "Automotive",
    words: [/\bkfz\b/i, /werkstatt/i, /fahrzeug/i, /\bleasing\b/i, /gebrauchtwagen/i],
  },
];

function detectIndustry(text: string): { id: Industry; label: string; conf: number } {
  let best: { id: Industry; label: string; score: number } = {
    id: "generic",
    label: "Unternehmen",
    score: 0,
  };
  for (const ind of INDUSTRY_WEIGHTS) {
    let score = 0;
    for (const w of ind.words) if (w.test(text)) score++;
    if (score > best.score) best = { id: ind.id, label: ind.label, score };
  }
  return { id: best.id, label: best.label, conf: Math.min(1, best.score / 3) };
}

/* ─── System recommendation per industry ────────────────────── */

const SYSTEMS: Record<Industry, SystemRecommendation> = {
  care: {
    name: "Anfrage-, Bewerbungs- und Patientensteuerung",
    oneliner: "Ein System, das Patientenanfragen, Bewerbungen und Pflege-Pipeline gleichzeitig sauber führt.",
    impact: "Mehr Personal, planbare Auslastung, weniger Telefon-Druck im Team.",
    modules: [
      { name: "Anfrage-Assistent", benefit: "Beantwortet Patienten- und Angehörigen-Fragen 24/7." },
      { name: "Bewerbungs-Pipeline", benefit: "Führt Pflegekräfte vom Erstkontakt bis zur Einstellung." },
      { name: "Belegungs-Steuerung", benefit: "Live-Überblick über freie Plätze und Touren." },
      { name: "Angehörigen-Portal", benefit: "Klarheit für Familien, Entlastung fürs Team." },
      { name: "Dokumenten-Logik", benefit: "Verträge, Genehmigungen, Pflegegrade strukturiert ablegen." },
      { name: "Tour-Optimierung", benefit: "Routen und Kapazitäten automatisch geplant." },
      { name: "Management Dashboard", benefit: "Pflegequote, Pipeline, Personal-KPIs auf einen Blick." },
    ],
  },
  medical: {
    name: "Praxis- und Patientenbetriebssystem",
    oneliner: "Ein System, das Anamnese, Termin und Behandlungsverlauf zu einem Fluss verbindet.",
    impact: "Weniger Wartezimmer-Stress, weniger No-Shows, ruhige Abläufe.",
    modules: [
      { name: "Online-Termin-Modul", benefit: "Patienten buchen 24/7, Praxis bestimmt die Slots." },
      { name: "Anamnese-Vorbereitung", benefit: "Patienten füllen vorab digital aus." },
      { name: "Erinnerungs-Logik", benefit: "Termin-Erinnerungen automatisch — weniger No-Shows." },
      { name: "Rezept- & Folge-Steuerung", benefit: "Rezepte, Folgetermine, Überweisungen strukturiert." },
      { name: "Bewertungs-System", benefit: "Patienten geben Feedback nach jedem Besuch." },
      { name: "Wartelisten-Logik", benefit: "Lücken werden automatisch nachbesetzt." },
      { name: "Management Dashboard", benefit: "Auslastung, Behandlungs-Mix, KPIs live." },
    ],
  },
  beauty: {
    name: "Digitale Kunden- und Buchungszentrale",
    oneliner: "Ein System, das Interessenten geführt zur Buchung bringt — automatisch und persönlich.",
    impact: "Mehr Termine, weniger No-Shows, freie Hände für die Arbeit am Kunden.",
    modules: [
      { name: "Online-Buchung", benefit: "Termine 24/7 buchbar — auch aus Instagram." },
      { name: "Anfrage-Assistent", benefit: "Beantwortet Standardfragen sofort." },
      { name: "Erinnerungs-Logik", benefit: "Reduziert No-Shows automatisch." },
      { name: "Follow-up Automation", benefit: "Holt Stammkunden zurück nach 4–6 Wochen." },
      { name: "Bewertungs-System", benefit: "Sammelt Bewertungen automatisch nach jedem Termin." },
      { name: "Geschenkgutschein-Modul", benefit: "Zusatz-Umsatz ohne Mehrarbeit." },
      { name: "Management Dashboard", benefit: "Auslastung, Umsatz pro Mitarbeiter, Pipeline live." },
    ],
  },
  realestate: {
    name: "Immobilien-Lead- und Angebotszentrale",
    oneliner: "Ein System, das aus Interessenten qualifizierte Käufer macht — strukturiert und schnell.",
    impact: "Schnellere Verkäufe, sauberere Pipeline, weniger Streuverlust.",
    modules: [
      { name: "Lead-Qualifizierung", benefit: "Trennt Käufer-Profile sofort von Neugierigen." },
      { name: "Exposé-Logik", benefit: "Liefert das passende Objekt automatisch zur Anfrage." },
      { name: "Besichtigungs-Steuerung", benefit: "Termine, Erinnerungen, Folgeaktionen automatisch." },
      { name: "Status-Pipeline", benefit: "Jeder Lead hat einen klaren Stand." },
      { name: "Angebots-Automation", benefit: "Personalisierte Angebote ohne Copy-Paste." },
      { name: "Bewertungs-System", benefit: "Käufer-Stimmen automatisch sammeln." },
      { name: "Reporting", benefit: "Verkaufsfortschritt und Performance auf einen Blick." },
    ],
  },
  legal: {
    name: "Mandats-Betriebssystem",
    oneliner: "Ein System, das Erstkontakt, Mandatsannahme und Bearbeitung verbindet.",
    impact: "Mehr passende Mandate, weniger Verwaltung, klare Abläufe.",
    modules: [
      { name: "Anfrage-Qualifizierung", benefit: "Erkennt geeignete Fälle automatisch." },
      { name: "Erstgespräch-Logik", benefit: "Termine, Vorbereitung, Unterlagen strukturiert." },
      { name: "Mandats-Pipeline", benefit: "Status jedes Falls auf einen Blick." },
      { name: "Dokumenten-Steuerung", benefit: "Verträge und Schriftsätze zentral." },
      { name: "Fristen-Wächter", benefit: "Keine Frist wird mehr vergessen." },
      { name: "Bewertungs-System", benefit: "Mandanten-Stimmen automatisch sammeln." },
      { name: "Management Dashboard", benefit: "Mandats-Volumen, Honorare, Auslastung live." },
    ],
  },
  consulting: {
    name: "Beratungs- und Vertriebsbetriebssystem",
    oneliner: "Ein System, das Reputation in Anfragen verwandelt — und Anfragen in Mandate.",
    impact: "Mehr Erstgespräche, höhere Abschluss-Rate, weniger Verwaltung.",
    modules: [
      { name: "Discovery-Assistent", benefit: "Qualifiziert Erstgespräche automatisch vor." },
      { name: "Angebotslogik", benefit: "Strukturiert Vorschläge auf Basis der Bedarfe." },
      { name: "Pipeline-Management", benefit: "Mandate, Status, Verantwortlichkeiten zentral." },
      { name: "Case-Builder", benefit: "Erfolgsgeschichten automatisch sichtbar machen." },
      { name: "Follow-up Automation", benefit: "Hält warme Kontakte konsequent in Kontakt." },
      { name: "Bewertungs-System", benefit: "Kundenstimmen aus jedem Mandat ernten." },
      { name: "Management Dashboard", benefit: "Auslastung, Umsatz, Forecasts." },
    ],
  },
  ecommerce: {
    name: "Vertriebs- und Kunden-Betriebssystem",
    oneliner: "Ein System, das Besucher zu Käufern macht — und Käufer zu Wiederkehrern.",
    impact: "Mehr Umsatz pro Besucher, höhere Wiederkaufrate.",
    modules: [
      { name: "Kundenanalyse", benefit: "Erkennt Kaufabsicht und Segmente in Echtzeit." },
      { name: "Empfehlungs-Engine", benefit: "Zeigt jedem Besucher das passende Produkt." },
      { name: "Warenkorb-Rückholung", benefit: "Holt abgebrochene Bestellungen zurück." },
      { name: "Loyalty-Logik", benefit: "Belohnt Wiederkäufer ohne Mehraufwand." },
      { name: "Service-Bot", benefit: "Beantwortet Standardfragen sofort." },
      { name: "Bewertungs-System", benefit: "Sammelt Bewertungen nach jedem Kauf." },
      { name: "Management Dashboard", benefit: "Umsatz, Kohorten, LTV in Echtzeit." },
    ],
  },
  saas: {
    name: "Wachstums- und Onboarding-Betriebssystem",
    oneliner: "Ein System, das Testnutzer zu zahlenden Kunden macht — wiederholbar.",
    impact: "Höhere Trial-Conversion, niedrigere Churn-Rate.",
    modules: [
      { name: "Onboarding-Logik", benefit: "Führt jeden neuen Nutzer zum ersten Erfolg." },
      { name: "Aktivierungs-Triggers", benefit: "Reagiert in Echtzeit auf Nutzerverhalten." },
      { name: "Pricing-Steuerung", benefit: "Passt Pakete an Segmente an." },
      { name: "Customer-Health", benefit: "Zeigt Risiko-Konten, bevor sie kündigen." },
      { name: "Expansion-Engine", benefit: "Identifiziert Upsell-Momente automatisch." },
      { name: "Support-Routing", benefit: "Anfragen landen sofort bei der richtigen Person." },
      { name: "Management Dashboard", benefit: "ARR, Cohorts, Net-Retention live." },
    ],
  },
  agency: {
    name: "Mandats- und Liefer-Betriebssystem",
    oneliner: "Ein System, das Akquise, Projekte und Auslieferung als ein Fluss orchestriert.",
    impact: "Mehr Pipeline, weniger Verwaltung, höhere Marge pro Projekt.",
    modules: [
      { name: "Lead-Qualifizierung", benefit: "Trennt ernsthafte Anfragen automatisch." },
      { name: "Angebotslogik", benefit: "Strukturierte Vorschläge mit Modulen und Sätzen." },
      { name: "Projekt-Pipeline", benefit: "Status, Verantwortliche, Deadlines zentral." },
      { name: "Capacity-Planning", benefit: "Wer macht was bis wann — sichtbar." },
      { name: "Case-Builder", benefit: "Referenzen automatisch produzieren lassen." },
      { name: "Follow-up Automation", benefit: "Pipeline bleibt warm." },
      { name: "Management Dashboard", benefit: "Pipeline, Marge, Auslastung live." },
    ],
  },
  restaurant: {
    name: "Reservierungs- und Gäste-Betriebssystem",
    oneliner: "Ein System, das Tische optimal füllt und Gäste zu Stammgästen macht.",
    impact: "Bessere Auslastung, weniger No-Shows, höherer Pro-Kopf-Umsatz.",
    modules: [
      { name: "Reservierungs-Logik", benefit: "Tische optimal verteilen, Erinnerungen automatisch." },
      { name: "Gäste-Profile", benefit: "Stammgäste erkennen und persönlich behandeln." },
      { name: "Wartelisten-Steuerung", benefit: "Maximiert die Auslastung an Spitzenzeiten." },
      { name: "Bewertungs-System", benefit: "Sammelt Feedback nach jedem Besuch." },
      { name: "Loyalty-Programm", benefit: "Belohnt Wiederkehrer automatisch." },
      { name: "Geschenkgutschein-Modul", benefit: "Zusatz-Umsatz ohne Mehrarbeit." },
      { name: "Management Dashboard", benefit: "Umsatz, Auslastung, Trends live." },
    ],
  },
  fitness: {
    name: "Mitglieder- und Trainings-Betriebssystem",
    oneliner: "Ein System, das aus Interessenten Mitglieder macht — und Mitglieder hält.",
    impact: "Mehr Probetrainings, höhere Mitglieder-Bindung, planbares Wachstum.",
    modules: [
      { name: "Probetraining-Funnel", benefit: "Führt Interessenten geführt zum ersten Termin." },
      { name: "Onboarding-Logik", benefit: "Macht aus Probetrainings Mitglieder." },
      { name: "Trainings-Steuerung", benefit: "Sessions, Erinnerungen, Programme zentral." },
      { name: "Retention-Engine", benefit: "Erkennt inaktive Mitglieder, bevor sie kündigen." },
      { name: "Bewertungs-System", benefit: "Sammelt Erfolgsgeschichten automatisch." },
      { name: "Empfehlungs-Logik", benefit: "Mitglieder bringen Mitglieder." },
      { name: "Management Dashboard", benefit: "Pipeline, Retention, Umsatz live." },
    ],
  },
  automotive: {
    name: "Verkaufs- und Servicesteuerung",
    oneliner: "Ein System, das Anfragen, Probefahrten und Werkstatt-Termine sauber orchestriert.",
    impact: "Mehr Verkäufe pro Lead, planbare Werkstatt-Auslastung.",
    modules: [
      { name: "Lead-Qualifizierung", benefit: "Trennt Käufer von Neugierigen sofort." },
      { name: "Fahrzeug-Matching", benefit: "Liefert passende Angebote automatisch." },
      { name: "Probefahrt-Logik", benefit: "Termine, Erinnerungen, Nachfass automatisch." },
      { name: "Service-Steuerung", benefit: "Werkstatt-Termine optimal verteilen." },
      { name: "Follow-up Automation", benefit: "Hält Interessenten warm bis zum Abschluss." },
      { name: "Bewertungs-System", benefit: "Käufer-Stimmen sammeln." },
      { name: "Management Dashboard", benefit: "Pipeline, Verkäufe, Werkstatt-Auslastung live." },
    ],
  },
  generic: {
    name: "Digitales Vertriebs- und Kundensystem",
    oneliner: "Ein System, das Interessenten geführt zu Kunden macht — automatisch und persönlich.",
    impact: "Mehr Anfragen, weniger Aufwand, planbares Wachstum.",
    modules: [
      { name: "Kundenanalyse", benefit: "Versteht, wer kauft — und was wirklich entscheidet." },
      { name: "Anfrage-Assistent", benefit: "Beantwortet Standardfragen sofort, 24/7." },
      { name: "Angebotslogik", benefit: "Strukturierte Vorschläge ohne Copy-Paste." },
      { name: "Terminsteuerung", benefit: "Termine, Erinnerungen, Absagen automatisch." },
      { name: "Follow-up Automation", benefit: "Holt warme Leads konsequent zurück." },
      { name: "Bewertungs-System", benefit: "Sammelt Bewertungen automatisch." },
      { name: "Management Dashboard", benefit: "Pipeline, Umsatz, KPIs live." },
    ],
  },
};

/* ─── Module relevance scoring per site ─────────────────────── */

function rankModules(
  modules: SystemModule[],
  s: SiteSignals | null,
): SystemModule[] {
  if (!s) return modules.slice(0, 7);
  const scored = modules.map((m) => {
    let w = 1;
    const n = m.name.toLowerCase();
    if (n.includes("buch") || n.includes("termin"))
      w += s.hasOnlineBooking ? -0.4 : 0.9;
    if (n.includes("anfrage") || n.includes("assist"))
      w += s.hasContactForm ? 0.1 : 0.6;
    if (n.includes("bewerb"))
      w += s.hasJobs ? 0.2 : 0.7;
    if (n.includes("bewertung"))
      w += s.hasReviews ? -0.3 : 0.6;
    if (n.includes("erinnerung") || n.includes("follow"))
      w += s.hasOnlineBooking ? 0.2 : 0.5;
    if (n.includes("dashboard"))
      w += 0.2;
    if (n.includes("loyalty") || n.includes("empfehl"))
      w += s.hasNewsletter ? -0.2 : 0.3;
    if (n.includes("dokument"))
      w += s.industryHints.some((h) => /pflege|kanzlei|klinik/i.test(h)) ? 0.4 : -0.2;
    if (n.includes("standort") || n.includes("tour"))
      w += s.hasMultipleLocations ? 0.5 : -0.1;
    return { m, w };
  });
  scored.sort((a, b) => b.w - a.w);
  return scored.slice(0, 7).map((x) => x.m);
}

/* ─── Public translator ──────────────────────────────────────── */

export function toExecutive(result: ScanResult): ExecutiveAnalysis {
  const meta = result.meta || {};
  const signals = (meta.signals as SiteSignals | undefined) || null;

  const haystack = [
    result.source,
    String(meta.title || ""),
    String(meta.description || ""),
    signals?.h1.join(" ") || "",
    signals?.h2.join(" ") || "",
    signals?.industryHints.join(" ") || "",
    signals?.topNouns.join(" ") || "",
  ]
    .join(" ")
    .toLowerCase();

  const ind = detectIndustry(haystack);

  let domain = result.source;
  try {
    if (result.mode === "web") domain = new URL(result.source).host.replace(/^www\./, "");
  } catch { /* keep */ }

  const brand = signals?.brandWord || domain;

  /* ── Build INDIVIDUAL opportunities ── */
  const opps: Opportunity[] = [];

  if (signals) {
    if (signals.hasPhone && !signals.hasOnlineBooking && !signals.hasContactForm) {
      opps.push({
        id: "only-phone",
        problem: `${brand} nimmt Anfragen heute praktisch nur über das Telefon an.`,
        matters: "Wer nicht anruft, ist verloren — besonders abends und am Wochenende.",
        improvement: "Ein digitaler Anfrage-Weg, den Interessenten 24/7 nutzen können.",
        effect: "Mehr Anfragen aus dem gleichen Traffic — ohne mehr Werbebudget.",
      });
    }
    if (signals.hasPhone && !signals.hasOnlineBooking && /termin|buch|reservier/i.test(
      [...signals.h1, ...signals.h2].join(" "),
    )) {
      opps.push({
        id: "promo-no-booking",
        problem: `${brand} bewirbt Termine, ohne sie online buchbar zu machen.`,
        matters: "Interessenten müssen aktiv anrufen — die meisten tun es nicht.",
        improvement: "Ein Online-Termin-Modul direkt im Kontaktfluss.",
        effect: "Spürbar mehr Termine bei gleicher Mitarbeiter-Last.",
      });
    }
    if (!signals.hasReviews) {
      opps.push({
        id: "no-reviews",
        problem: `Es ist keine sichtbare Sammlung von Kundenstimmen erkennbar.`,
        matters: "Soziale Beweise sind das stärkste Vertrauenssignal.",
        improvement: "Echte Bewertungen automatisch nach jeder Leistung einsammeln.",
        effect: "Mehr Konversion in derselben Sichtbarkeit.",
      });
    }
    if (!signals.hasFaq && signals.wordCount < 700) {
      opps.push({
        id: "thin-content",
        problem: "Besucher bekommen zu wenige Antworten auf der Seite.",
        matters: `Nur ~${signals.wordCount} Wörter — Standardfragen landen ans Telefon.`,
        improvement: "Ein FAQ- und Anfrage-Assistent, der die häufigsten Fragen sofort klärt.",
        effect: "Weniger Telefonate, mehr qualifizierte Anfragen.",
      });
    }
    if (signals.industryHints.some((h) => /pflege|salon|klinik|praxis/i.test(h)) && !signals.hasJobs) {
      opps.push({
        id: "no-careers",
        problem: `${brand} hat keinen sichtbaren Bewerber-Funnel.`,
        matters: "Personalmangel ist der größte Wachstums-Stopper in deiner Branche.",
        improvement: "Eine geführte Bewerbungs-Strecke direkt auf der Webseite.",
        effect: "Mehr Bewerbungen — ohne Personal-Anzeigen.",
      });
    }
    if (!signals.hasMap || !signals.hasOpeningHours) {
      const missing: string[] = [];
      if (!signals.hasMap) missing.push("Standort/Karte");
      if (!signals.hasOpeningHours) missing.push("Öffnungszeiten");
      opps.push({
        id: "local-trust",
        problem: `Lokale Trust-Signale fehlen (${missing.join(" + ")}).`,
        matters: "Lokale Kunden suchen genau diese Infos zuerst.",
        improvement: "Klar sichtbare Standort-, Zeit- und Anfahrt-Informationen.",
        effect: "Mehr Spontan-Anfragen aus der Nähe.",
      });
    }
    if (signals.imgCount < 4) {
      opps.push({
        id: "low-imagery",
        problem: `Nur ${signals.imgCount} Bilder auf der Startseite.`,
        matters: "Vertrauen entsteht über echte Fotos von Team, Räumen, Ergebnissen.",
        improvement: "Eigene Bildwelt, die das Versprechen sichtbar macht.",
        effect: "Höhere emotionale Bindung, längere Verweildauer.",
      });
    }
    if (signals.socialLinks.length === 0) {
      opps.push({
        id: "no-social",
        problem: `${brand} verlinkt keine Social-Profile.`,
        matters: "Besucher können der Marke außerhalb der Seite nicht folgen.",
        improvement: "Sichtbare Verbindung zu den aktiven Kanälen.",
        effect: "Mehr wiederkehrende Berührungspunkte mit Interessenten.",
      });
    }
    if (signals.hasWhatsapp) {
      opps.push({
        id: "whatsapp-leverage",
        problem: `${brand} nutzt WhatsApp, aber unstrukturiert.`,
        matters: "Chats werden manuell beantwortet — viel Zeit, wenig Übersicht.",
        improvement: "WhatsApp-Anfragen automatisch qualifizieren und dokumentieren.",
        effect: "Schnellere Reaktionszeit, kein Lead bleibt liegen.",
      });
    }
    if (!signals.hasNewsletter && (ind.id === "ecommerce" || ind.id === "beauty" || ind.id === "fitness")) {
      opps.push({
        id: "no-newsletter",
        problem: "Bestandskunden werden nicht systematisch reaktiviert.",
        matters: "Wiederkäufe sind 5–7× günstiger als Neukunden-Akquise.",
        improvement: "Eine schlanke Reaktivierungs-Sequenz für vorhandene Kontakte.",
        effect: "Mehr Umsatz aus dem bestehenden Kundenstamm.",
      });
    }
  }

  // Always include the most important headline finding from technical layer
  const techToOpp: Record<string, Opportunity> = {
    "seo-no-h1": {
      id: "no-h1",
      problem: "Die Seite erklärt ihren Hauptnutzen nicht klar.",
      matters: "Besucher entscheiden in 5 Sekunden, ob sie bleiben.",
      improvement: "Ein klarer, brand-führender Aufmacher mit konkretem Nutzen.",
      effect: "Mehr Verweildauer, mehr Anfragen aus organischem Traffic.",
    },
    "seo-no-title": {
      id: "no-title",
      problem: "Die Seite hat keinen aussagekräftigen Titel für Google.",
      matters: "Der Titel entscheidet, ob jemand überhaupt klickt.",
      improvement: "Titel mit Marke + konkretem Nutzen.",
      effect: "Mehr Klicks aus der Suche.",
    },
  };
  for (const f of result.findings) {
    if (techToOpp[f.id] && !opps.some((o) => o.id === techToOpp[f.id].id)) {
      opps.push(techToOpp[f.id]);
    }
  }

  // Final opportunities: max 4 with deduplication
  const seen = new Set<string>();
  const opportunities = opps.filter((o) => {
    if (seen.has(o.id)) return false;
    seen.add(o.id);
    return true;
  }).slice(0, 4);

  /* ── Business scores derived from signals + technical scores ── */
  const sc = result.score;
  const acquireBoost =
    (signals?.hasOnlineBooking ? 5 : 0) +
    (signals?.hasContactForm ? 3 : 0) -
    (signals && signals.imgCount < 4 ? 8 : 0);
  const inquireBoost =
    (signals?.hasOnlineBooking ? 8 : 0) +
    (signals?.hasContactForm ? 4 : 0) +
    (signals?.hasWhatsapp ? 3 : 0) -
    (!signals?.hasOnlineBooking && !signals?.hasContactForm ? 12 : 0);
  const trustBoost =
    (signals?.hasReviews ? 8 : -10) +
    (signals?.hasMap ? 3 : -2) +
    (signals?.hasOpeningHours ? 3 : -2) +
    (signals?.socialLinks.length ? Math.min(6, signals.socialLinks.length * 2) : -3);
  const timeBoost =
    (signals?.hasOnlineBooking ? 8 : -8) +
    (signals?.hasFaq ? 4 : -4) +
    (signals?.hasPhone && !signals?.hasOnlineBooking ? -8 : 0);
  const scaleBoost =
    (signals?.hasJobs ? 4 : -4) +
    (signals?.hasMultipleLocations ? 4 : 0) +
    (signals?.hasNewsletter ? 3 : -3);

  const scores: BusinessScore[] = [
    {
      id: "acquire",
      label: "Kunden gewinnen",
      hint: signals?.hasOnlineBooking
        ? "Auftritt aktiviert Besucher messbar."
        : "Auftritt aktiviert Besucher zu wenig.",
      value: clamp(weighted(sc.conversion, 0.6, sc.ux, 0.4) + acquireBoost),
    },
    {
      id: "inquire",
      label: "Anfragen steigern",
      hint:
        signals && !signals.hasOnlineBooking && !signals.hasContactForm
          ? "Heute fast nur über Telefon — digitale Wege fehlen."
          : "Anfrage-Wege vorhanden, optimierbar.",
      value: clamp(sc.conversion + inquireBoost),
    },
    {
      id: "trust",
      label: "Vertrauen aufbauen",
      hint: signals?.hasReviews
        ? "Soziale Beweise vorhanden, aber ausbaufähig."
        : "Vertrauenssignale wirken kühl — Bewertungen fehlen.",
      value: clamp(weighted(sc.trust, 0.6, sc.security, 0.4) + trustBoost),
    },
    {
      id: "save-time",
      label: "Zeit sparen",
      hint: signals?.hasOnlineBooking
        ? "Termine bereits digital — weiteres Potenzial bei Folgeprozessen."
        : "Viele Standardabläufe sind heute manuell.",
      value: clamp(80 + timeBoost - opportunities.length * 4),
    },
    {
      id: "scale",
      label: "Wachstum vorbereiten",
      hint: signals?.hasJobs
        ? "Personal-Funnel vorhanden — Skalierung möglich."
        : "Skalierung benötigt Personal- und Prozess-Pipeline.",
      value: clamp(weighted(sc.performance, 0.5, sc.security, 0.5) + scaleBoost),
    },
  ].map((x) => ({ ...x, value: Math.round(x.value) }));

  const potentialScore = clamp(
    Math.round(scores.reduce((a, b) => a + b.value, 0) / scores.length),
  );

  /* ── Diagnosis: pick weakest axis + most striking signal ── */
  const weakest = [...scores].sort((a, b) => a.value - b.value)[0];
  const diagnosis = buildDiagnosis(weakest.id, brand, signals);
  const diagnosisDetail = buildDiagnosisDetail(brand, ind.id, signals, opportunities);

  /* ── Confidence: more signals = higher confidence ── */
  let confidence = 0.55;
  if (signals) {
    confidence += Math.min(0.15, signals.h2.length * 0.015);
    confidence += Math.min(0.1, signals.industryHints.length * 0.025);
    confidence += Math.min(0.1, result.detected.length * 0.02);
    confidence += signals.wordCount > 500 ? 0.05 : 0;
  }
  confidence = Math.min(0.96, confidence);

  /* ── Recommendation: industry template, modules ranked per signals ── */
  const tpl = SYSTEMS[ind.id];
  const recommendation: SystemRecommendation = {
    name: tpl.name,
    oneliner: tpl.oneliner,
    impact: tpl.impact,
    modules: rankModules(tpl.modules, signals),
  };

  /* ── Observations: prove individuality ── */
  const observations: string[] = [];
  if (signals) {
    if (signals.h1[0]) observations.push(`Hauptbotschaft: „${truncate(signals.h1[0], 90)}".`);
    if (signals.industryHints.length)
      observations.push(`Branchen-Signale: ${signals.industryHints.slice(0, 3).join(", ")}.`);
    observations.push(
      `Kontakt-Wege: ${[
        signals.hasPhone && "Telefon",
        signals.hasEmail && "E-Mail",
        signals.hasContactForm && "Formular",
        signals.hasOnlineBooking && "Online-Termin",
        signals.hasWhatsapp && "WhatsApp",
        signals.hasChat && "Live-Chat",
      ]
        .filter(Boolean)
        .join(", ") || "kein digitaler Kanal sichtbar"}.`,
    );
    if (signals.socialLinks.length)
      observations.push(`Social: ${signals.socialLinks.join(", ")}.`);
    observations.push(
      `Inhalt: ${signals.wordCount} Wörter · ${signals.imgCount} Bilder · ${signals.h2.length} H2-Bereiche${signals.videoEmbed ? " · Video" : ""}.`,
    );
    if (signals.hasMultipleLocations) observations.push("Mehrere Standorte erkennbar.");
    if (signals.hasReviews)
      observations.push(`Bewertungen sichtbar (${signals.reviewMentions} Erwähnungen).`);
  }

  return {
    domain,
    brand,
    industry: ind.id,
    industryLabel: ind.label,
    potentialScore,
    diagnosis,
    diagnosisDetail,
    confidence,
    scores,
    opportunities,
    recommendation,
    observations,
  };
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function buildDiagnosis(weakestId: string, brand: string, s: SiteSignals | null): string {
  if (s && !s.hasOnlineBooking && !s.hasContactForm && s.hasPhone) {
    return `${brand} verliert Anfragen, weil der Weg zum Kunden heute fast ausschließlich über das Telefon läuft.`;
  }
  if (s && !s.hasReviews && weakestId === "trust") {
    return `${brand} überzeugt fachlich, lässt aber soziale Beweise ungenutzt.`;
  }
  if (s && s.wordCount < 350) {
    return `${brand} bietet zu wenig Inhalt — Besucher bekommen nicht genug Antworten, um zu handeln.`;
  }
  switch (weakestId) {
    case "acquire":
      return `${brand} wandelt zu wenige Besucher in echte Anfragen.`;
    case "inquire":
      return `Der Weg zur Anfrage ist bei ${brand} unklar — Interessenten brauchen mehr Führung.`;
    case "trust":
      return `Vertrauenssignale sind bei ${brand} ausbaufähig — Käufer entscheiden in Sekunden.`;
    case "save-time":
      return `Bei ${brand} laufen viele Abläufe manuell — ein System spart das Team frei.`;
    case "scale":
      return `Die Basis von ${brand} trägt heute, ist aber nicht für planbares Wachstum optimiert.`;
    default:
      return `${brand} verliert Potenzial durch manuelle Abläufe und unklare Kundenwege.`;
  }
}

function buildDiagnosisDetail(
  brand: string,
  ind: Industry,
  s: SiteSignals | null,
  opps: Opportunity[],
): string {
  const top = opps[0];
  const second = opps[1];
  const channelLine = (() => {
    if (!s) return "";
    if (!s.hasOnlineBooking && !s.hasContactForm && s.hasPhone)
      return "Heute kommen Anfragen praktisch nur per Telefon herein. ";
    if (s.hasOnlineBooking && s.hasContactForm)
      return "Mehrere digitale Anfrage-Wege sind vorhanden, aber sie laufen nicht als ein System. ";
    if (s.hasContactForm) return "Ein Kontaktformular ist da, aber kein direkter Buchungsweg. ";
    return "";
  })();
  const indLine: Record<Industry, string> = {
    care: `In der Pflege entscheiden zwei Engpässe über Wachstum: Anfragen und Personal. `,
    medical: `In der Praxis entscheidet die Termin-Logik über Auslastung und Patientenzufriedenheit. `,
    beauty: `Im Beauty-Markt entscheidet die Buchungs- und Wiederkehr-Logik über Umsatz pro Sitzplatz. `,
    realestate: `Im Immobilien-Geschäft entscheidet die Geschwindigkeit vom Erstkontakt zum Exposé. `,
    legal: `In der Kanzlei entscheidet die Mandatsannahme über Auslastung und Honorare. `,
    consulting: `In der Beratung entscheidet, wie aus Reputation strukturierte Anfragen werden. `,
    ecommerce: `Im Onlinehandel entscheidet die Wiederkauf-Logik über Profitabilität. `,
    saas: `Im SaaS-Geschäft entscheidet die Aktivierungs-Geschwindigkeit über Lifetime-Value. `,
    agency: `In der Agentur entscheidet die saubere Trennung von Akquise, Liefern, Auswerten. `,
    restaurant: `In der Gastronomie entscheidet die Tisch- und Reservierungs-Logik. `,
    fitness: `Im Fitness-Markt entscheidet die Mitglieder-Bindung über Wachstum. `,
    automotive: `In der Werkstatt/Verkauf entscheidet die Lead-Service-Verkettung. `,
    generic: "",
  };
  const baseLine = indLine[ind];
  const oppLine = top
    ? `Konkret: ${top.problem.toLowerCase()}${
        second ? ` Außerdem: ${second.problem.toLowerCase()}` : ""
      }`
    : `${brand} hat eine solide Basis — der Hebel liegt in der Konsolidierung der Kundenprozesse.`;
  return `${baseLine}${channelLine}${oppLine}`.trim();
}

function clamp(n: number) {
  return Math.max(0, Math.min(100, n));
}
function weighted(a: number, wa: number, b: number, wb: number) {
  return a * wa + b * wb;
}
function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}
