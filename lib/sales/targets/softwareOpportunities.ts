/**
 * Software-Opportunities aus Business-Kontext.
 *
 * Wichtige Grundregel: Wir raten NICHT. Wir werten explizit vorhandene
 * Signale (Branche, Website-Audit, Business-Größe) aus und geben
 * konkrete Hypothesen als FACT / INFERENCE / RECOMMENDATION.
 * Falsche Aussagen im Sales-Vorgespräch schaden mehr, als sie nutzen —
 * deshalb ist jede Ableitung mit Evidenz + Confidence versehen.
 */

import type {
  OpportunityKind,
  SoftwareOpportunityKind,
  TargetCompany,
  TargetOpportunity,
  WebsiteAudit,
} from "./model";
import { resolvePriceTier, DEFAULT_PROJECT_VALUE_TIERS } from "./model";

export interface SoftwareOpportunitySignals {
  hasBookingSignal: boolean;
  hasContactForm: boolean;
  hasCms: string | null;
  employeeEstimate: number | null;
  industry: string | null;
}

export interface DerivedSoftwareOpportunity {
  kind: SoftwareOpportunityKind;
  title: string;
  problem: string | null;
  proposedSolution: string | null;
  businessImpact: string | null;
  reason: string | null;
  confidence: number;
  opportunityScore: number;
  evidence: unknown[];
  estimatedMinCents: number | null;
  estimatedRecommendedCents: number | null;
  estimatedMaxCents: number | null;
}

interface IndustryPlaybook {
  match: RegExp;
  suggestions: Array<{
    kind: SoftwareOpportunityKind;
    title: string;
    problem: string;
    proposedSolution: string;
    businessImpact: string;
    baseConfidence: number;
    baseScore: number;
    condition?: (s: SoftwareOpportunitySignals) => boolean;
  }>;
}

const INDUSTRY_PLAYBOOKS: IndustryPlaybook[] = [
  {
    match: /handwerk|sanitär|elektro|maler|dachdeck|schreiner|zimmerei|schlosser|shk|bau/i,
    suggestions: [
      {
        kind: "ANGEBOTSSYSTEM",
        title: "Digitaler Angebotsprozess",
        problem: "Angebotsanfragen laufen häufig telefonisch oder per E-Mail und werden manuell in Excel/Word erstellt.",
        proposedSolution: "Digitaler Anfrage- und Angebotsprozess mit Vorlagen, Preisliste und automatischer Nachverfolgung.",
        businessImpact: "Weniger Bearbeitungszeit pro Anfrage, weniger verlorene Leads, klare Angebotshistorie.",
        baseConfidence: 0.72,
        baseScore: 78,
      },
      {
        kind: "TERMINE",
        title: "Terminplanung & Erinnerungen",
        problem: "Terminverwaltung erfolgt vermutlich manuell — verpasste Termine oder Doppelbuchungen sind wahrscheinlich.",
        proposedSolution: "Online-Buchung + Erinnerungsläufe (SMS/E-Mail/WhatsApp) mit Kalender-Integration.",
        businessImpact: "Weniger Leerlauf, weniger Absagen, bessere Auslastung.",
        baseConfidence: 0.65,
        baseScore: 70,
        condition: (s) => !s.hasBookingSignal,
      },
      {
        kind: "CRM",
        title: "CRM für Kundenhistorie",
        problem: "Kundenhistorie liegt vermutlich in Ordnern und Kalendern verteilt.",
        proposedSolution: "Zentrales CRM mit Kunden-, Anfrage- und Auftragsverlauf.",
        businessImpact: "Schneller Kundenzugriff, bessere Nachverkäufe, saubere Übergaben.",
        baseConfidence: 0.6,
        baseScore: 65,
      },
    ],
  },
  {
    match: /arzt|ärzt|praxis|zahnarzt|kieferorthopäd|physio|therap|medizinisch/i,
    suggestions: [
      {
        kind: "TERMINE",
        title: "Online-Terminbuchung für Patienten",
        problem: "Termine werden vermutlich telefonisch vereinbart — hoher Aufwand am Empfang.",
        proposedSolution: "Online-Buchungssystem mit Behandlungsauswahl und automatischen Erinnerungen.",
        businessImpact: "Entlastung der Rezeption, weniger Ausfälle, Patientenzufriedenheit.",
        baseConfidence: 0.85,
        baseScore: 88,
        condition: (s) => !s.hasBookingSignal,
      },
      {
        kind: "AI_SUPPORT",
        title: "Automatischer FAQ-Assistent",
        problem: "Wiederkehrende Fragen (Öffnungszeiten, Anreise, Kosten) blockieren Telefon und E-Mail.",
        proposedSolution: "Chat-Assistent auf der Website mit strukturierten Antworten und Übergabe an Menschen.",
        businessImpact: "Entlastung Team, schnellere Antworten für Patienten.",
        baseConfidence: 0.6,
        baseScore: 65,
      },
    ],
  },
  {
    match: /kanzlei|anwalt|rechtsanwalt|notariat|steuerber|wirtschaftspr/i,
    suggestions: [
      {
        kind: "KUNDENPORTAL",
        title: "Mandantenportal",
        problem: "Dokumentenaustausch mit Mandanten läuft primär per E-Mail — DSGVO-Risiken, Versionschaos.",
        proposedSolution: "Verschlüsseltes Portal mit Dokumenten, Aufgaben, Freigaben und Kommunikation.",
        businessImpact: "Weniger Suchen, weniger Rechtsrisiko, bessere Mandanten-Erfahrung.",
        baseConfidence: 0.75,
        baseScore: 82,
      },
      {
        kind: "DOCS_AUTOMATION",
        title: "Dokumenten-Automatisierung",
        problem: "Wiederkehrende Dokumente werden weitgehend manuell erstellt.",
        proposedSolution: "Vorlagen-Engine mit Feldern aus Fallakte und automatischem PDF-Export.",
        businessImpact: "Deutliche Zeitersparnis pro Fall.",
        baseConfidence: 0.7,
        baseScore: 76,
      },
    ],
  },
  {
    match: /gastro|restaurant|café|caf[eé]|hotel|pension|imbiss|bar\b|club\b/i,
    suggestions: [
      {
        kind: "TERMINE",
        title: "Reservierung online",
        problem: "Tischreservierungen laufen vermutlich telefonisch oder gar nicht — verlorene Umsätze.",
        proposedSolution: "Online-Reservierung mit Bestätigung, Erinnerungen und Warteliste.",
        businessImpact: "Bessere Auslastung, weniger No-Shows.",
        baseConfidence: 0.8,
        baseScore: 85,
        condition: (s) => !s.hasBookingSignal,
      },
      {
        kind: "WHATSAPP_AUTOMATION",
        title: "Gast-Kommunikation via WhatsApp",
        problem: "Direkte Gastkommunikation läuft ohne Automatisierung.",
        proposedSolution: "Automatisierte Bestätigungen, Erinnerungen, Feedback-Anfragen via WhatsApp.",
        businessImpact: "Höhere Rückläuferzahl, mehr Bewertungen, aktive Wiederkehrer.",
        baseConfidence: 0.55,
        baseScore: 60,
      },
    ],
  },
  {
    match: /immobilien|makler|hausverwaltung/i,
    suggestions: [
      {
        kind: "LEAD_MGMT",
        title: "Anfragen-Trichter",
        problem: "Anfragen aus Portalen (Immoscout/ImmoWelt) und Website landen ungetrennt in E-Mail.",
        proposedSolution: "Zentrales Lead-Management mit Bewertung, Zuweisung und Follow-up.",
        businessImpact: "Schnellere Reaktionszeit, weniger verlorene Leads.",
        baseConfidence: 0.75,
        baseScore: 80,
      },
    ],
  },
  {
    match: /fitness|studio|beauty|kosmetik|friseur|spa/i,
    suggestions: [
      {
        kind: "TERMINE",
        title: "Online-Buchung + Erinnerungen",
        problem: "Termine werden häufig telefonisch vergeben — Termindichte schwer planbar.",
        proposedSolution: "Buchungssystem mit Erinnerungen und Zahlungsflow.",
        businessImpact: "Mehr Buchungen, weniger No-Shows.",
        baseConfidence: 0.8,
        baseScore: 84,
        condition: (s) => !s.hasBookingSignal,
      },
    ],
  },
  {
    match: /automotive|kfz|autohaus|werkstatt|reifen/i,
    suggestions: [
      {
        kind: "TERMINE",
        title: "Werkstatt-Terminbuchung",
        problem: "Werkstatt-Termine werden telefonisch vereinbart, Kapazitätsplanung ist unübersichtlich.",
        proposedSolution: "Online-Buchung mit Fahrzeug, Serviceart und automatischer Kapazitätsprüfung.",
        businessImpact: "Bessere Kapazitätsauslastung, weniger Telefonzeit.",
        baseConfidence: 0.75,
        baseScore: 78,
      },
    ],
  },
];

const GENERIC_SUGGESTIONS: IndustryPlaybook["suggestions"] = [
  {
    kind: "CRM",
    title: "CRM-Aufbau",
    problem: "Kunden- und Anfragehistorie ist vermutlich über E-Mail, Excel und einzelne Ordner verteilt.",
    proposedSolution: "Leichtgewichtiges CRM mit Kontakthistorie, Aufgaben und Reporting.",
    businessImpact: "Weniger Suchen, sauberes Follow-up, klare Verantwortlichkeiten.",
    baseConfidence: 0.55,
    baseScore: 60,
  },
  {
    kind: "EMAIL_AUTOMATION",
    title: "E-Mail-Automatisierung",
    problem: "Wiederkehrende Nachfassungen und Standard-Antworten werden manuell versendet.",
    proposedSolution: "Sequenzen für Erstkontakt, Nachfassen und Reaktivierung.",
    businessImpact: "Weniger manuelle Arbeit, konsistentere Kundenkommunikation.",
    baseConfidence: 0.5,
    baseScore: 55,
  },
];

export function deriveSoftwareOpportunities(
  company: Pick<TargetCompany, "industry" | "employeeEstimateMax">,
  audit: WebsiteAudit | null,
  overrides?: Partial<SoftwareOpportunitySignals>
): DerivedSoftwareOpportunity[] {
  const industry = (company.industry ?? overrides?.industry ?? "").toLowerCase();
  const signals: SoftwareOpportunitySignals = {
    hasBookingSignal: overrides?.hasBookingSignal ?? Boolean(audit?.techStack && Array.isArray((audit.techStack as Record<string, unknown>).booking) && ((audit.techStack as Record<string, unknown>).booking as unknown[]).length > 0),
    hasContactForm: overrides?.hasContactForm ?? Boolean(audit && (audit.conversionScore ?? 0) > 70),
    hasCms: overrides?.hasCms ?? (audit?.techStack?.cms as string) ?? null,
    employeeEstimate: overrides?.employeeEstimate ?? company.employeeEstimateMax ?? null,
    industry: company.industry ?? null,
  };

  const bookets = INDUSTRY_PLAYBOOKS.filter((b) => b.match.test(industry));
  const suggestions = bookets.length > 0 ? bookets.flatMap((b) => b.suggestions) : GENERIC_SUGGESTIONS;

  const out: DerivedSoftwareOpportunity[] = [];
  for (const s of suggestions) {
    if (s.condition && !s.condition(signals)) continue;
    const kind = s.kind as OpportunityKind;
    const tier = resolvePriceTier(kind, DEFAULT_PROJECT_VALUE_TIERS);
    out.push({
      kind: s.kind,
      title: s.title,
      problem: s.problem,
      proposedSolution: s.proposedSolution,
      businessImpact: s.businessImpact,
      reason: s.problem,
      confidence: s.baseConfidence,
      opportunityScore: s.baseScore,
      evidence: [
        { kind: "industry_playbook", industry: industry || null },
        signals.hasBookingSignal ? { kind: "signal", text: "Buchungs-Tool bereits erkannt" } : null,
      ].filter(Boolean) as unknown[],
      estimatedMinCents: tier.min,
      estimatedRecommendedCents: tier.recommended,
      estimatedMaxCents: tier.max,
    });
    if (out.length >= 4) break;
  }

  return out;
}
