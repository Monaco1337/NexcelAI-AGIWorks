/**
 * Contactability-Score — deterministisch, erklärbar.
 *
 * Ein Lead braucht nicht nur Kontaktdaten. Er braucht einen belastbaren
 * Score „Wie gut ist dieser Lead überhaupt erreichbar?" — getrennt vom
 * Bedarf, getrennt von der Kapazität, getrennt von der Priorität.
 *
 * Der Score ist 0–100 und wird ausschließlich aus vorhandenen
 * Datenpunkten berechnet — keine Heuristik, keine LLM-Schätzung. Wenn
 * Kontakte fehlen, ist der Score entsprechend niedrig; er wird nie
 * „geschätzt".
 */

import type {
  TargetContact,
  TargetDecisionMaker,
} from "./model";
import { classifyConfidence } from "./model";

export interface ContactabilityInput {
  contacts: TargetContact[];
  decisionMakers: TargetDecisionMaker[];
}

export interface ContactabilityBreakdownEntry {
  key: string;
  label: string;
  points: number;
  evidence?: string;
}

export interface ContactabilityResult {
  score: number;
  breakdown: ContactabilityBreakdownEntry[];
  hasBusinessPhone: boolean;
  hasBusinessMobile: boolean;
  hasDirectEmail: boolean;
  hasGenericEmail: boolean;
  hasContactForm: boolean;
  hasLinkedin: boolean;
  hasDecisionMaker: boolean;
  hasDecisionMakerContact: boolean;
  verifiedRatio: number;
}

/**
 * Punkteschema (Summe bei perfekter Erreichbarkeit ≈ 100):
 *
 *  +30 Direkte Entscheider-E-Mail
 *  +25 Entscheider-Telefon (Business)
 *  +15 Firmen-Telefon (Business)
 *  +10 Generische E-Mail (info@, kontakt@)
 *  + 5 Kontaktformular
 *  +10 LinkedIn (Unternehmen)
 *  + 5 Verifizierte Daten (≥ 50 % verified/high)
 */
export function computeContactability(input: ContactabilityInput): ContactabilityResult {
  const breakdown: ContactabilityBreakdownEntry[] = [];
  const contacts = (input.contacts ?? []).filter((c) => c);
  const dms = (input.decisionMakers ?? []).filter((d) => d);

  const contactByKind = groupByKind(contacts);

  const hasBusinessPhone = (contactByKind.phone ?? []).length > 0;
  const hasBusinessMobile = (contactByKind.mobile ?? []).length > 0;
  const emails = contactByKind.email ?? [];
  const directEmails = emails.filter((c) => c.classification === "DIRECT_DECISION_MAKER");
  const genericEmails = emails.filter((c) => c.classification !== "DIRECT_DECISION_MAKER");
  const hasDirectEmail = directEmails.length > 0;
  const hasGenericEmail = genericEmails.length > 0;
  const hasContactForm = (contactByKind.contact_form ?? []).length > 0;
  const hasLinkedin = (contactByKind.linkedin ?? []).length > 0;
  const hasDecisionMaker = dms.length > 0;
  const dmWithContact = dms.filter(
    (d) => Boolean(d.businessEmail) || Boolean(d.businessPhone) || Boolean(d.businessMobile)
  );
  const hasDecisionMakerContact = dmWithContact.length > 0;

  let score = 0;

  if (hasDirectEmail) {
    score += 30;
    breakdown.push({
      key: "direct_email",
      label: "Direkte Entscheider-E-Mail",
      points: 30,
      evidence: directEmails[0].value,
    });
  }
  if (hasDecisionMakerContact) {
    score += 25;
    breakdown.push({
      key: "dm_contact",
      label: "Entscheider mit Business-Kontakt",
      points: 25,
      evidence: `${dmWithContact.length} Entscheider mit Business-Telefon/E-Mail`,
    });
  }
  if (hasBusinessPhone) {
    score += 15;
    breakdown.push({
      key: "company_phone",
      label: "Firmen-Telefon vorhanden",
      points: 15,
    });
  }
  if (hasBusinessMobile) {
    score += 5;
    breakdown.push({
      key: "company_mobile",
      label: "Firmen-Mobil vorhanden",
      points: 5,
    });
  }
  if (!hasDirectEmail && hasGenericEmail) {
    score += 10;
    breakdown.push({
      key: "generic_email",
      label: "Allgemeine E-Mail (info@/kontakt@)",
      points: 10,
      evidence: genericEmails[0].value,
    });
  }
  if (hasContactForm) {
    score += 5;
    breakdown.push({
      key: "contact_form",
      label: "Kontaktformular verfügbar",
      points: 5,
    });
  }
  if (hasLinkedin) {
    score += 5;
    breakdown.push({
      key: "linkedin",
      label: "LinkedIn-Unternehmensseite",
      points: 5,
    });
  }

  const verifiedRatio = ratioOfVerified(contacts);
  if (verifiedRatio >= 0.5) {
    score += 5;
    breakdown.push({
      key: "verified_ratio",
      label: `≥ 50 % der Kontakte verifiziert (${Math.round(verifiedRatio * 100)} %)`,
      points: 5,
    });
  } else if (verifiedRatio < 0.2 && contacts.length > 0) {
    breakdown.push({
      key: "unverified_dominant",
      label: `Nur ${Math.round(verifiedRatio * 100)} % verifiziert`,
      points: 0,
      evidence: "Reachability nur eingeschränkt belegbar",
    });
  }

  score = clamp(score, 0, 100);
  return {
    score,
    breakdown,
    hasBusinessPhone,
    hasBusinessMobile,
    hasDirectEmail,
    hasGenericEmail,
    hasContactForm,
    hasLinkedin,
    hasDecisionMaker,
    hasDecisionMakerContact,
    verifiedRatio,
  };
}

function groupByKind(contacts: TargetContact[]): Record<string, TargetContact[]> {
  const out: Record<string, TargetContact[]> = {};
  for (const c of contacts) {
    (out[c.kind] ??= []).push(c);
  }
  return out;
}

function ratioOfVerified(contacts: TargetContact[]): number {
  if (contacts.length === 0) return 0;
  const verified = contacts.filter((c) => {
    const status =
      c.verificationStatus === "unverified" ? classifyConfidence(c.confidence) : c.verificationStatus;
    return status === "verified" || status === "high";
  }).length;
  return verified / contacts.length;
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
