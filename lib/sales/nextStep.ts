/**
 * Guided Next Step.
 *
 * Nimmt den aktuellen Zustand einer Opportunity + Firma + Discovery-
 * Vollständigkeit + Solution + Angebote entgegen und liefert genau
 * einen empfohlenen nächsten Schritt zurück. Die Empfehlung wird an
 * prominenter Stelle in der Firmenakte angezeigt.
 *
 * Wichtig: reine Server- und Client-fähige Pure Function ohne
 * DB-Zugriff. Alle Entscheidungen sind deterministisch und aus dem
 * Zustand ableitbar — dadurch testbar und stabil.
 */

import type { DiscoveryCompleteness } from "./discoveryModel";

export type NextStepKind =
  | "PREPARE_PRECALL"
  | "MAKE_FIRST_CALL"
  | "DOCUMENT_CALL"
  | "POST_CALL_ANALYSIS"
  | "SCHEDULE_MEETING"
  | "PREPARE_DISCOVERY"
  | "RUN_DISCOVERY"
  | "COMPLETE_DISCOVERY"
  | "DRAFT_SOLUTION"
  | "REVIEW_SOLUTION"
  | "APPROVE_SOLUTION"
  | "PREPARE_PROPOSAL"
  | "GENERATE_PROPOSAL"
  | "REVIEW_PROPOSAL"
  | "SEND_PROPOSAL"
  | "FOLLOWUP_PROPOSAL"
  | "AWAIT_DECISION"
  | "DEAL_WON"
  | "DEAL_LOST"
  | "DEAL_DEFERRED"
  | "OPEN_OPPORTUNITY";

export interface NextStepRecommendation {
  kind: NextStepKind;
  title: string;
  reason: string;
  cta: string;
  targetTab?: "overview" | "contacts" | "opportunities" | "calls" | "discovery" | "solution" | "proposals" | "ai" | "activity";
  focus?: "call" | "discovery" | "solution" | "proposal";
}

export interface NextStepInputState {
  hasOpportunity: boolean;
  status:
    | "neu"
    | "qualifiziert"
    | "kontaktversuch"
    | "erreicht"
    | "interesse"
    | "unterlagen_gesendet"
    | "termin_vereinbart"
    | "bedarfsgespraech_abgeschlossen"
    | "loesung_in_vorbereitung"
    | "angebot_gesendet"
    | "entscheidung_offen"
    | "verhandlung"
    | "gewonnen"
    | "verloren"
    | "zurueckgestellt";
  hasPreCall: boolean;
  callsCount: number;
  hasContact: boolean;
  discovery?: DiscoveryCompleteness;
  solution?: { exists: boolean; approved: boolean };
  proposal?: {
    exists: boolean;
    hasVersion: boolean;
    versionApproved: boolean;
    sent: boolean;
    followupOpen: boolean;
    accepted: boolean;
    rejected: boolean;
  };
}

/**
 * Deterministisch berechneter „nächster Schritt".
 * Reihenfolge ist bewusst: End-Zustände zuerst, dann rückwärts vom
 * Angebot bis zum ersten Kontakt.
 */
export function recommendNextStep(state: NextStepInputState): NextStepRecommendation {
  if (!state.hasOpportunity) {
    return {
      kind: "OPEN_OPPORTUNITY",
      title: "Opportunity anlegen",
      reason:
        "Für diese Firma gibt es noch keine konkrete Verkaufschance. Lege eine Opportunity an, sobald ein Bedarf oder ein relevantes Potenzial erkennbar ist.",
      cta: "Opportunity anlegen",
      targetTab: "opportunities",
    };
  }

  switch (state.status) {
    case "gewonnen":
      return {
        kind: "DEAL_WON",
        title: "Deal gewonnen",
        reason: "Die Opportunity ist gewonnen. Übergabe an Projekt anstoßen und Learnings dokumentieren.",
        cta: "An Projekt übergeben",
        targetTab: "activity",
      };
    case "verloren":
      return {
        kind: "DEAL_LOST",
        title: "Deal verloren",
        reason: "Verlustgrund und Learning sind bereits erfasst. Prüfe, ob eine spätere Wiedervorlage sinnvoll ist.",
        cta: "Historie ansehen",
        targetTab: "activity",
      };
    case "zurueckgestellt":
      return {
        kind: "DEAL_DEFERRED",
        title: "Zurückgestellt",
        reason: "Setze eine Wiedervorlage, damit der Kontakt nicht verloren geht.",
        cta: "Wiedervorlage setzen",
        targetTab: "overview",
      };
  }

  if (state.proposal?.sent) {
    if (state.proposal.accepted) {
      return {
        kind: "DEAL_WON",
        title: "Angebot angenommen — Deal schließen",
        reason: "Das Angebot wurde angenommen. Setze den Deal auf gewonnen und übergib an Projekt.",
        cta: "Als gewonnen markieren",
        targetTab: "proposals",
      };
    }
    if (state.proposal.rejected) {
      return {
        kind: "DEAL_LOST",
        title: "Angebot abgelehnt — Deal abschließen",
        reason: "Erfasse den Verlustgrund und dokumentiere das Learning.",
        cta: "Als verloren markieren",
        targetTab: "proposals",
      };
    }
    return {
      kind: "FOLLOWUP_PROPOSAL",
      title: state.proposal.followupOpen
        ? "Angebot nachfassen"
        : "Entscheidung des Kunden begleiten",
      reason:
        "Das Angebot ist versendet. Verabredetes Follow-up einhalten, Einwände direkt in der Opportunity dokumentieren.",
      cta: state.proposal.followupOpen ? "Follow-up erledigen" : "Follow-up planen",
      targetTab: "proposals",
    };
  }

  if (state.proposal?.hasVersion && !state.proposal.versionApproved) {
    return {
      kind: "REVIEW_PROPOSAL",
      title: "Angebot freigeben",
      reason: "Prüfe die aktuelle Angebotsversion — nach Freigabe ist sie versandbereit.",
      cta: "Zur Angebotsprüfung",
      targetTab: "proposals",
      focus: "proposal",
    };
  }

  if (state.proposal?.versionApproved && !state.proposal?.sent) {
    return {
      kind: "SEND_PROPOSAL",
      title: "Angebot versenden",
      reason: "Die freigegebene Version kann jetzt versendet werden. Follow-ups werden automatisch geplant.",
      cta: "Als versendet markieren",
      targetTab: "proposals",
    };
  }

  if (state.solution?.approved) {
    if (!state.proposal?.exists) {
      return {
        kind: "PREPARE_PROPOSAL",
        title: "Angebot vorbereiten",
        reason:
          "Die Lösung ist freigegeben. Ergänze Preis, Zahlplan, Zeitraum und Gültigkeit und generiere das Angebot.",
        cta: "Angebot vorbereiten",
        targetTab: "proposals",
        focus: "proposal",
      };
    }
    return {
      kind: "GENERATE_PROPOSAL",
      title: "Angebotsversion erzeugen",
      reason: "Angebot ist angelegt, aber es fehlt noch eine Version. Erzeuge eine Version aus dem freigegebenen Angebots-Run.",
      cta: "Version erzeugen",
      targetTab: "proposals",
      focus: "proposal",
    };
  }

  if (state.solution?.exists && !state.solution.approved) {
    return {
      kind: "APPROVE_SOLUTION",
      title: "Lösung prüfen und freigeben",
      reason: "Der Lösungsentwurf liegt vor. Prüfe die Bausteine, ergänze fehlende Punkte und gib die Lösung frei.",
      cta: "Zur Lösungsprüfung",
      targetTab: "solution",
      focus: "solution",
    };
  }

  if (state.discovery && state.discovery.readyForSolution) {
    return {
      kind: "DRAFT_SOLUTION",
      title: "Lösung ausarbeiten",
      reason:
        "Alle für ein Angebot kritischen Themen sind geklärt. Erstelle jetzt den Lösungsentwurf und lasse ihn intern prüfen.",
      cta: "Lösungsentwurf erstellen",
      targetTab: "solution",
      focus: "solution",
    };
  }

  if (state.status === "bedarfsgespraech_abgeschlossen" || (state.discovery && state.discovery.clarified.length > 0)) {
    if (state.discovery && state.discovery.criticalOpen.length > 0) {
      return {
        kind: "COMPLETE_DISCOVERY",
        title: "Bedarf vervollständigen",
        reason: `Für ein Angebot fehlen noch ${state.discovery.criticalOpen.length} kritische Themen. Kläre sie direkt im Bedarfsbereich.`,
        cta: "Bedarf öffnen",
        targetTab: "discovery",
        focus: "discovery",
      };
    }
    return {
      kind: "COMPLETE_DISCOVERY",
      title: "Bedarf finalisieren",
      reason: "Fasse die bestätigten Erkenntnisse zusammen und setze den nächsten Schritt.",
      cta: "Bedarf abschließen",
      targetTab: "discovery",
      focus: "discovery",
    };
  }

  if (state.status === "termin_vereinbart") {
    return {
      kind: "PREPARE_DISCOVERY",
      title: "Bedarfsgespräch vorbereiten",
      reason: "Der Termin steht. Öffne den geführten Bedarfsgespräch-Modus und starte pünktlich mit vollständigem Briefing.",
      cta: "Bedarfsgespräch öffnen",
      targetTab: "discovery",
      focus: "discovery",
    };
  }

  if (
    state.status === "erreicht" ||
    state.status === "interesse" ||
    state.status === "unterlagen_gesendet"
  ) {
    return {
      kind: "SCHEDULE_MEETING",
      title: "Termin vereinbaren",
      reason: "Der Kontakt ist warm. Verabrede einen konkreten Bedarfsgespräch-Termin.",
      cta: "Termin setzen",
      targetTab: "overview",
    };
  }

  if (state.callsCount > 0 && state.status === "kontaktversuch") {
    return {
      kind: "POST_CALL_ANALYSIS",
      title: "Post-Call-Analyse erstellen",
      reason: "Erfassten Gesprächsverlauf strukturiert auswerten — Erkenntnisse fließen automatisch weiter.",
      cta: "Analyse erstellen",
      targetTab: "ai",
    };
  }

  if (state.hasPreCall && state.callsCount === 0) {
    return {
      kind: "MAKE_FIRST_CALL",
      title: "Erstkontakt durchführen",
      reason: "Das Briefing liegt bereit. Starte den Live-Gesprächs-Modus und dokumentiere direkt beim Telefonieren.",
      cta: "Gespräch starten",
      focus: "call",
    };
  }

  if (state.hasContact) {
    return {
      kind: "PREPARE_PRECALL",
      title: "Pre-Call vorbereiten",
      reason: "Kontakt bekannt, aber noch kein Briefing erstellt. Kurzbriefing generieren, dann anrufen.",
      cta: "Pre-Call erstellen",
      targetTab: "ai",
    };
  }

  return {
    kind: "PREPARE_PRECALL",
    title: "Ansprechpartner recherchieren",
    reason: "Bevor angerufen wird, klären wir den richtigen Ansprechpartner und legen ein Kurzbriefing an.",
    cta: "Kontakt hinzufügen",
    targetTab: "contacts",
  };
}

export const NEXT_STEP_LABEL: Record<NextStepKind, string> = {
  PREPARE_PRECALL: "Pre-Call vorbereiten",
  MAKE_FIRST_CALL: "Erstkontakt durchführen",
  DOCUMENT_CALL: "Gespräch dokumentieren",
  POST_CALL_ANALYSIS: "Post-Call analysieren",
  SCHEDULE_MEETING: "Termin vereinbaren",
  PREPARE_DISCOVERY: "Bedarfsgespräch vorbereiten",
  RUN_DISCOVERY: "Bedarfsgespräch führen",
  COMPLETE_DISCOVERY: "Bedarf finalisieren",
  DRAFT_SOLUTION: "Lösung ausarbeiten",
  REVIEW_SOLUTION: "Lösung prüfen",
  APPROVE_SOLUTION: "Lösung freigeben",
  PREPARE_PROPOSAL: "Angebot vorbereiten",
  GENERATE_PROPOSAL: "Angebot erzeugen",
  REVIEW_PROPOSAL: "Angebot prüfen",
  SEND_PROPOSAL: "Angebot versenden",
  FOLLOWUP_PROPOSAL: "Angebot nachfassen",
  AWAIT_DECISION: "Entscheidung begleiten",
  DEAL_WON: "Abschluss dokumentieren",
  DEAL_LOST: "Verlust erfassen",
  DEAL_DEFERRED: "Wiedervorlage setzen",
  OPEN_OPPORTUNITY: "Opportunity anlegen",
};
