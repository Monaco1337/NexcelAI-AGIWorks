/**
 * Vertriebsmodul — Domain-Typen, Enums und Utilities.
 *
 * Alle UI-Labels sind deutsch. Interne Keys sind technische Snake-Case-
 * Konstanten, die stabil in Datenbank und API bleiben — auch wenn die
 * Anzeige später verfeinert wird.
 */

/* -------------------------------------------------------------------------- */
/*  Brand Context                                                              */
/* -------------------------------------------------------------------------- */

export const BRAND_CONTEXTS = ["nexcel", "agiworks", "both"] as const;
export type BrandContext = (typeof BRAND_CONTEXTS)[number];

export const BRAND_CONTEXT_LABEL: Record<BrandContext, string> = {
  nexcel: "NEXCEL AI",
  agiworks: "AGI Works",
  both: "NEXCEL AI × AGI Works",
};

export function isBrandContext(value: unknown): value is BrandContext {
  return typeof value === "string" && (BRAND_CONTEXTS as readonly string[]).includes(value);
}

/* -------------------------------------------------------------------------- */
/*  Klassifizierung (A/B/C/D)                                                  */
/* -------------------------------------------------------------------------- */

export const SALES_CLASSIFICATIONS = ["A", "B", "C", "D"] as const;
export type SalesClassification = (typeof SALES_CLASSIFICATIONS)[number];

export const CLASSIFICATION_LABEL: Record<SalesClassification, string> = {
  A: "A — Sehr interessant",
  B: "B — Interessant",
  C: "C — Niedrige Priorität",
  D: "D — Kein Fit",
};

export const CLASSIFICATION_COLOR: Record<SalesClassification, string> = {
  A: "#22C55E",
  B: "#3B82F6",
  C: "#FBBF24",
  D: "#6B7280",
};

/* -------------------------------------------------------------------------- */
/*  Vertriebsstatus                                                            */
/* -------------------------------------------------------------------------- */

export const SALES_STATUSES = [
  "neu",
  "qualifiziert",
  "kontaktversuch",
  "erreicht",
  "interesse",
  "unterlagen_gesendet",
  "termin_vereinbart",
  "bedarfsgespraech_abgeschlossen",
  "loesung_in_vorbereitung",
  "angebot_gesendet",
  "entscheidung_offen",
  "verhandlung",
  "gewonnen",
  "verloren",
  "zurueckgestellt",
] as const;
export type SalesStatus = (typeof SALES_STATUSES)[number];

export const SALES_STATUS_LABEL: Record<SalesStatus, string> = {
  neu: "Neu",
  qualifiziert: "Qualifiziert",
  kontaktversuch: "Kontaktversuch",
  erreicht: "Erreicht",
  interesse: "Interesse",
  unterlagen_gesendet: "Unterlagen gesendet",
  termin_vereinbart: "Termin vereinbart",
  bedarfsgespraech_abgeschlossen: "Bedarfsgespräch abgeschlossen",
  loesung_in_vorbereitung: "Lösung in Vorbereitung",
  angebot_gesendet: "Angebot gesendet",
  entscheidung_offen: "Entscheidung offen",
  verhandlung: "Verhandlung",
  gewonnen: "Gewonnen",
  verloren: "Verloren",
  zurueckgestellt: "Zurückgestellt",
};

export const SALES_STATUS_COLOR: Record<SalesStatus, string> = {
  neu: "#94A3B8",
  qualifiziert: "#60A5FA",
  kontaktversuch: "#818CF8",
  erreicht: "#A78BFA",
  interesse: "#F472B6",
  unterlagen_gesendet: "#FB7185",
  termin_vereinbart: "#FBBF24",
  bedarfsgespraech_abgeschlossen: "#F59E0B",
  loesung_in_vorbereitung: "#F97316",
  angebot_gesendet: "#EAB308",
  entscheidung_offen: "#84CC16",
  verhandlung: "#22C55E",
  gewonnen: "#10B981",
  verloren: "#EF4444",
  zurueckgestellt: "#6B7280",
};

/** Status, in dem eine Opportunity als offen gilt (Pipeline). */
export const OPEN_STATUSES: readonly SalesStatus[] = SALES_STATUSES.filter(
  (s) => s !== "gewonnen" && s !== "verloren" && s !== "zurueckgestellt"
);

export function isSalesStatus(value: unknown): value is SalesStatus {
  return typeof value === "string" && (SALES_STATUSES as readonly string[]).includes(value);
}

export function isOpenStatus(status: SalesStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

/** Standardablauf; UI zeigt sie in dieser Reihenfolge in der Kanban-Pipeline. */
export const PIPELINE_ORDER: readonly SalesStatus[] = [
  "neu",
  "qualifiziert",
  "kontaktversuch",
  "erreicht",
  "interesse",
  "unterlagen_gesendet",
  "termin_vereinbart",
  "bedarfsgespraech_abgeschlossen",
  "loesung_in_vorbereitung",
  "angebot_gesendet",
  "entscheidung_offen",
  "verhandlung",
];

/* -------------------------------------------------------------------------- */
/*  Kontaktergebnis                                                            */
/* -------------------------------------------------------------------------- */

export const CONTACT_OUTCOMES = [
  "nicht_erreicht",
  "rueckruf_gewuenscht",
  "ansprechpartner_ermittelt",
  "kein_interesse",
  "spaeter_wieder_melden",
  "grundsaetzliches_interesse",
  "unterlagen_gewuenscht",
  "termin_vereinbart",
  "bedarf_bestaetigt",
  "angebot_besprochen",
  "entscheidung_ausstehend",
  "zusage",
  "absage",
] as const;
export type ContactOutcome = (typeof CONTACT_OUTCOMES)[number];

export const CONTACT_OUTCOME_LABEL: Record<ContactOutcome, string> = {
  nicht_erreicht: "Nicht erreicht",
  rueckruf_gewuenscht: "Rückruf gewünscht",
  ansprechpartner_ermittelt: "Ansprechpartner ermittelt",
  kein_interesse: "Kein Interesse",
  spaeter_wieder_melden: "Später wieder melden",
  grundsaetzliches_interesse: "Grundsätzliches Interesse",
  unterlagen_gewuenscht: "Unterlagen gewünscht",
  termin_vereinbart: "Termin vereinbart",
  bedarf_bestaetigt: "Bedarf bestätigt",
  angebot_besprochen: "Angebot besprochen",
  entscheidung_ausstehend: "Entscheidung ausstehend",
  zusage: "Zusage",
  absage: "Absage",
};

/* -------------------------------------------------------------------------- */
/*  Nächster Schritt                                                           */
/* -------------------------------------------------------------------------- */

export const NEXT_ACTIONS = [
  "pre_call_analyse",
  "erstanruf",
  "erneut_anrufen",
  "rueckruf",
  "ansprechpartner_recherchieren",
  "kundenvorschau_erstellen",
  "follow_up_senden",
  "nachfassen",
  "post_call_analyse",
  "bedarfsgespraech_vorbereiten",
  "bedarfsgespraech_durchfuehren",
  "loesung_ausarbeiten",
  "angebot_erstellen",
  "angebot_senden",
  "angebot_nachfassen",
  "entscheidungsgespraech",
  "abschluss_vorbereiten",
  "an_projekt_uebergeben",
  "spaeter_kontaktieren",
  "keine_aktion",
] as const;
export type NextAction = (typeof NEXT_ACTIONS)[number];

export const NEXT_ACTION_LABEL: Record<NextAction, string> = {
  pre_call_analyse: "Pre-Call-Analyse",
  erstanruf: "Erstanruf",
  erneut_anrufen: "Erneut anrufen",
  rueckruf: "Rückruf durchführen",
  ansprechpartner_recherchieren: "Ansprechpartner recherchieren",
  kundenvorschau_erstellen: "Kundenvorschau erstellen",
  follow_up_senden: "Follow-up senden",
  nachfassen: "Nachfassen",
  post_call_analyse: "Post-Call-Tiefenanalyse",
  bedarfsgespraech_vorbereiten: "Bedarfsgespräch vorbereiten",
  bedarfsgespraech_durchfuehren: "Bedarfsgespräch durchführen",
  loesung_ausarbeiten: "Lösung ausarbeiten",
  angebot_erstellen: "Angebot erstellen",
  angebot_senden: "Angebot senden",
  angebot_nachfassen: "Angebot nachfassen",
  entscheidungsgespraech: "Entscheidungsgespräch",
  abschluss_vorbereiten: "Abschluss vorbereiten",
  an_projekt_uebergeben: "An Projekt übergeben",
  spaeter_kontaktieren: "Später kontaktieren",
  keine_aktion: "Keine Aktion",
};

/* -------------------------------------------------------------------------- */
/*  Kontaktrolle                                                               */
/* -------------------------------------------------------------------------- */

export const CONTACT_ROLES = [
  "entscheider",
  "mitentscheider",
  "nutzer",
  "befuerworter",
  "unbekannt",
] as const;
export type ContactRole = (typeof CONTACT_ROLES)[number];

export const CONTACT_ROLE_LABEL: Record<ContactRole, string> = {
  entscheider: "Entscheider",
  mitentscheider: "Mitentscheider",
  nutzer: "Nutzer",
  befuerworter: "Befürworter",
  unbekannt: "Unbekannt",
};

/* -------------------------------------------------------------------------- */
/*  Quality Gate (Solution Scope)                                              */
/* -------------------------------------------------------------------------- */

export const QUALITY_GATES = ["angebotsreif", "weitere_klaerung", "kein_fit"] as const;
export type QualityGate = (typeof QUALITY_GATES)[number];

export const QUALITY_GATE_LABEL: Record<QualityGate, string> = {
  angebotsreif: "Angebotsreif",
  weitere_klaerung: "Weitere Klärung notwendig",
  kein_fit: "Kein sinnvoller Fit",
};

export const QUALITY_GATE_COLOR: Record<QualityGate, string> = {
  angebotsreif: "#22C55E",
  weitere_klaerung: "#F59E0B",
  kein_fit: "#EF4444",
};

/* -------------------------------------------------------------------------- */
/*  Proposal-Status                                                            */
/* -------------------------------------------------------------------------- */

export const PROPOSAL_STATUSES = [
  "draft",
  "preview",
  "approved",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "superseded",
] as const;
export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number];

export const PROPOSAL_STATUS_LABEL: Record<ProposalStatus, string> = {
  draft: "Entwurf",
  preview: "Vorschau",
  approved: "Freigegeben",
  sent: "Versendet",
  accepted: "Angenommen",
  rejected: "Abgelehnt",
  expired: "Abgelaufen",
  superseded: "Ersetzt",
};

/* -------------------------------------------------------------------------- */
/*  Einwandtypen                                                               */
/* -------------------------------------------------------------------------- */

export const OBJECTION_TYPES = [
  "preis",
  "wert",
  "timing",
  "prioritaet",
  "entscheider",
  "wettbewerber",
  "bestand",
  "scope",
  "sonstiges",
] as const;
export type ObjectionType = (typeof OBJECTION_TYPES)[number];

export const OBJECTION_TYPE_LABEL: Record<ObjectionType, string> = {
  preis: "Preis",
  wert: "Wert",
  timing: "Timing",
  prioritaet: "Priorität",
  entscheider: "Entscheider",
  wettbewerber: "Wettbewerber",
  bestand: "Bestehender Anbieter",
  scope: "Scope",
  sonstiges: "Sonstiges",
};

/* -------------------------------------------------------------------------- */
/*  Lost-Reasons                                                               */
/* -------------------------------------------------------------------------- */

export const LOST_REASONS = [
  "preis",
  "timing",
  "prioritaet",
  "kein_business_case",
  "wettbewerber",
  "keine_reaktion",
  "interne_entscheidung",
  "scope",
  "vertrauen",
  "sonstiges",
] as const;
export type LostReason = (typeof LOST_REASONS)[number];

export const LOST_REASON_LABEL: Record<LostReason, string> = {
  preis: "Preis",
  timing: "Timing",
  prioritaet: "Fehlende Priorität",
  kein_business_case: "Kein ausreichender Business Case",
  wettbewerber: "Wettbewerber",
  keine_reaktion: "Keine Reaktion",
  interne_entscheidung: "Interne Entscheidung",
  scope: "Scope",
  vertrauen: "Vertrauen",
  sonstiges: "Sonstiges",
};

/* -------------------------------------------------------------------------- */
/*  Aktivitätsarten                                                            */
/* -------------------------------------------------------------------------- */

export const ACTIVITY_KINDS = [
  "created",
  "status_changed",
  "classification_changed",
  "next_action_set",
  "owner_changed",
  "contact_added",
  "contact_updated",
  "note",
  "call",
  "email",
  "precall",
  "postcall",
  "client_preview",
  "discovery_prep",
  "discovery",
  "solution_created",
  "solution_updated",
  "solution_gate",
  "solution_approved",
  "proposal_created",
  "proposal_version",
  "proposal_approved",
  "proposal_sent",
  "followup_created",
  "followup_completed",
  "objection",
  "won",
  "lost",
  "deferred",
  "ai_run_started",
  "ai_run_completed",
  "ai_run_failed",
  "ai_run_reviewed",
] as const;
export type ActivityKind = (typeof ACTIVITY_KINDS)[number];

/* -------------------------------------------------------------------------- */
/*  IDs                                                                        */
/* -------------------------------------------------------------------------- */

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/* -------------------------------------------------------------------------- */
/*  Fehlerklasse                                                               */
/* -------------------------------------------------------------------------- */

export class SalesError extends Error {
  constructor(message: string, public code: string = "sales_error", public status = 400) {
    super(message);
    this.name = "SalesError";
  }
}
