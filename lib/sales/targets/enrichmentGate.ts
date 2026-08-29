/**
 * Progressive-Enrichment-Gate.
 *
 * Die Master-Prompt-Phase 22 verlangt eine strikte „Cheap Filters First"-
 * Reihenfolge. Konkret: teure Phasen (Deep Website Audit, Financial
 * Signals, Decision-Maker-Suche) werden erst ausgeführt, wenn der Lead
 * überhaupt vielversprechend ist.
 *
 * Wir vermeiden gezielt jede Form von „AI-Guessing" beim Gate. Die
 * Bewertung ist rein regelbasiert und deterministisch — 3 Signale reichen,
 * um die meisten irrelevanten Firmen früh auszusortieren.
 */

import type {
  EnrichmentPhase,
  TargetCompany,
  TargetContact,
  WebsiteAudit,
} from "./model";

export interface GateInput {
  target: TargetCompany;
  contacts?: TargetContact[];
  websiteAudit?: WebsiteAudit | null;
}

export interface GateDecision {
  proceed: boolean;
  reason: string;
  qualificationScore: number;
}

/**
 * Vorläufiger Qualifizierungs-Score in [0, 100], berechnet aus günstig
 * verfügbaren Signalen. Wird für den Gate-Threshold verwendet, NICHT
 * als finaler Lead-Score.
 */
export function preliminaryQualificationScore(input: GateInput): number {
  const t = input.target;
  let score = 0;

  // Basisdaten
  if (t.name) score += 5;
  if (t.website) score += 15;
  if (t.city) score += 5;
  if (t.industry) score += 5;

  // Kontakt-Signale
  const contacts = input.contacts ?? [];
  if (contacts.some((c) => c.kind === "phone" || c.kind === "mobile")) score += 15;
  if (contacts.some((c) => c.kind === "email")) score += 10;
  if (contacts.some((c) => c.kind === "contact_form")) score += 5;

  // Firma erkennbar operativ?
  if (t.employeeEstimateMax && t.employeeEstimateMax >= 3) score += 5;
  if (t.foundedYear && t.foundedYear > 1900 && new Date().getUTCFullYear() - t.foundedYear >= 2) {
    score += 5;
  }
  if (t.reviewCount && t.reviewCount >= 5) score += 5;

  // Website-Signal (falls schon ein Audit vorliegt)
  const audit = input.websiteAudit ?? null;
  if (audit) {
    if (audit.websiteScore !== null && audit.websiteScore !== undefined) {
      // Weder sehr modern noch sehr schlecht → mittelmäßig, wenig Potenzial
      const s = audit.websiteScore;
      if (s <= 55) score += 15; // erkennbares Potenzial für Web-Opportunity
      else if (s <= 75) score += 8;
      else score += 4;
    }
  }

  // Distance (falls definiert): näher = besser
  if (t.distanceKm !== null && t.distanceKm !== undefined) {
    if (t.distanceKm <= 15) score += 5;
    else if (t.distanceKm <= 30) score += 3;
  }

  // Do-not-contact schließt sofort aus
  if (t.doNotContact) return 0;

  return Math.max(0, Math.min(100, score));
}

/**
 * Threshold pro Phase (env-override möglich).
 * Deep-Phasen benötigen mindestens ein sinnvolles Qualifizierungslevel.
 */
export const DEFAULT_THRESHOLDS: Record<EnrichmentPhase, number> = {
  company_basics: 0,
  website_contact: 10,
  software_opportunities: 20,
  lead_score: 15,
  sales_brief: 20,
  website_audit: 30,        // teuer (mehrere Sekunden fetch + analysis)
  financial_signals: 25,
  decision_makers: 40,      // sehr teuer und liefert nur bei relevanten Leads Wert
};

function envThreshold(phase: EnrichmentPhase): number | null {
  const key = `NEXT_SALES_TARGET_GATE_${phase}`;
  const raw = process.env[key];
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/**
 * Entscheide, ob eine Phase basierend auf dem vorläufigen Score
 * ausgeführt werden soll.
 */
export function gateForPhase(phase: EnrichmentPhase, input: GateInput): GateDecision {
  const threshold = envThreshold(phase) ?? DEFAULT_THRESHOLDS[phase] ?? 0;
  const qualification = preliminaryQualificationScore(input);
  if (input.target.doNotContact) {
    return {
      proceed: false,
      reason: "Do-Not-Contact aktiv",
      qualificationScore: 0,
    };
  }
  if (qualification >= threshold) {
    return {
      proceed: true,
      reason: `Qualifizierung ${qualification} ≥ Threshold ${threshold}`,
      qualificationScore: qualification,
    };
  }
  return {
    proceed: false,
    reason: `Qualifizierung ${qualification} < Threshold ${threshold}`,
    qualificationScore: qualification,
  };
}
