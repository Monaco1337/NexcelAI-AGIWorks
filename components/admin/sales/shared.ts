/**
 * Client-sichere API-Typen des Vertriebsmoduls.
 *
 * Bewusst getrennt von `lib/sales/*Store.ts`: die Stores importieren den
 * Postgres-Client und dürfen NIE ins Client-Bundle geraten. Diese Datei
 * enthält nur reine TypeScript-Typen, die exakt den Response-Shapes der
 * API entsprechen.
 */

/* ── Enums (Werte auch clientseitig nutzbar) ────────────────────────── */

export type BrandContext = "nexcel" | "agiworks" | "both";
export type SalesClassification = "A" | "B" | "C" | "D";

export type SalesStatus =
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

export type ContactOutcome =
  | "nicht_erreicht"
  | "rueckruf_gewuenscht"
  | "ansprechpartner_ermittelt"
  | "kein_interesse"
  | "spaeter_wieder_melden"
  | "grundsaetzliches_interesse"
  | "unterlagen_gewuenscht"
  | "termin_vereinbart"
  | "bedarf_bestaetigt"
  | "angebot_besprochen"
  | "entscheidung_ausstehend"
  | "zusage"
  | "absage";

export type NextAction =
  | "pre_call_analyse"
  | "erstanruf"
  | "erneut_anrufen"
  | "rueckruf"
  | "ansprechpartner_recherchieren"
  | "kundenvorschau_erstellen"
  | "follow_up_senden"
  | "nachfassen"
  | "post_call_analyse"
  | "bedarfsgespraech_vorbereiten"
  | "bedarfsgespraech_durchfuehren"
  | "loesung_ausarbeiten"
  | "angebot_erstellen"
  | "angebot_senden"
  | "angebot_nachfassen"
  | "entscheidungsgespraech"
  | "abschluss_vorbereiten"
  | "an_projekt_uebergeben"
  | "spaeter_kontaktieren"
  | "keine_aktion";

export type ContactRole = "entscheider" | "mitentscheider" | "nutzer" | "befuerworter" | "unbekannt";
export type QualityGate = "angebotsreif" | "weitere_klaerung" | "kein_fit";
export type ProposalStatus =
  | "draft"
  | "preview"
  | "approved"
  | "sent"
  | "accepted"
  | "rejected"
  | "expired"
  | "superseded";
export type ObjectionType =
  | "preis"
  | "wert"
  | "timing"
  | "prioritaet"
  | "entscheider"
  | "wettbewerber"
  | "bestand"
  | "scope"
  | "sonstiges";
export type LostReason =
  | "preis"
  | "timing"
  | "prioritaet"
  | "kein_business_case"
  | "wettbewerber"
  | "keine_reaktion"
  | "interne_entscheidung"
  | "scope"
  | "vertrauen"
  | "sonstiges";

export type SalesPromptKey =
  | "LEAD_RESEARCH"
  | "PRE_CALL"
  | "POST_CALL"
  | "CLIENT_PREVIEW"
  | "DISCOVERY_PREP"
  | "SOLUTION_SCOPE"
  | "PROPOSAL";
export type RunStatus =
  | "QUEUED"
  | "PROCESSING"
  | "REVIEW_REQUIRED"
  | "APPROVED"
  | "REJECTED"
  | "SUPERSEDED"
  | "FAILED";

/* ── Labels (deutsch) ───────────────────────────────────────────────── */

export const BRAND_CONTEXT_LABEL: Record<BrandContext, string> = {
  nexcel: "NEXCEL AI",
  agiworks: "AGI Works",
  both: "NEXCEL AI × AGI Works",
};

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

export const CONTACT_ROLE_LABEL: Record<ContactRole, string> = {
  entscheider: "Entscheider",
  mitentscheider: "Mitentscheider",
  nutzer: "Nutzer",
  befuerworter: "Befürworter",
  unbekannt: "Unbekannt",
};

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

export const PIPELINE_ORDER: SalesStatus[] = [
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

/* ── Response-Types ─────────────────────────────────────────────────── */

export interface SalesCompany {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  city: string | null;
  country: string;
  source: string | null;
  classification: SalesClassification | null;
  status: SalesStatus;
  ownerId: string | null;
  ownerName: string | null;
  orgId: string | null;
  expectedValueCents: number | null;
  proposalValueCents: number | null;
  currency: string;
  lastContactAt: string | null;
  contactOutcome: ContactOutcome | null;
  nextAction: NextAction | null;
  nextActionDueAt: string | null;
  nextMeetingAt: string | null;
  notes: string;
  icpScore: number | null;
  icpEvidence: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  version: number;
  contactCount: number;
  opportunityCount: number;
  openOpportunityCount: number;
}

export interface SalesContact {
  id: string;
  companyId: string;
  firstName: string | null;
  lastName: string | null;
  position: string | null;
  phone: string | null;
  email: string | null;
  role: ContactRole;
  isPrimary: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesOpportunity {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  brandContext: BrandContext;
  status: SalesStatus;
  classification: SalesClassification | null;
  contactOutcome: ContactOutcome | null;
  nextAction: NextAction | null;
  nextActionDueAt: string | null;
  nextMeetingAt: string | null;
  expectedValueCents: number | null;
  proposalValueCents: number | null;
  currency: string;
  closeDate: string | null;
  ownerId: string | null;
  ownerName: string | null;
  lostReason: LostReason | null;
  lostNotes: string | null;
  learning: string | null;
  wonAt: string | null;
  lostAt: string | null;
  deferredAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SalesActivity {
  id: string;
  entityType: "company" | "opportunity" | "contact" | "proposal";
  entityId: string;
  companyId: string | null;
  kind: string;
  summary: string;
  payload: Record<string, unknown>;
  actorId: string | null;
  actorEmail: string | null;
  actorName: string | null;
  occurredAt: string;
}

export interface SalesNote {
  id: string;
  entityType: "company" | "opportunity";
  entityId: string;
  kind: "call" | "discovery" | "internal";
  body: string;
  structured: Record<string, unknown>;
  authorId: string | null;
  authorName: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SalesSolution {
  id: string;
  opportunityId: string;
  structured: Record<string, unknown>;
  challengeMode: Record<string, unknown>;
  qualityGate: QualityGate | null;
  qualityGateNote: string | null;
  runId: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  approvedByName: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SalesObjection {
  id: string;
  opportunityId: string;
  type: ObjectionType;
  body: string;
  resolution: string | null;
  resolvedAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdAt: string;
}

export interface SalesProposal {
  id: string;
  opportunityId: string;
  solutionId: string | null;
  title: string;
  brandContext: BrandContext;
  status: ProposalStatus;
  currentVersionId: string | null;
  currentVersionNumber: number | null;
  customerSnapshot: Record<string, unknown>;
  totalCents: number | null;
  currency: string;
  validUntil: string | null;
  sentAt: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface ProposalVersion {
  id: string;
  proposalId: string;
  version: number;
  generatedAt: string;
  generatedBy: string | null;
  solutionScopeVersion: number | null;
  promptVersion: number | null;
  structured: Record<string, unknown>;
  pricingSnapshot: Record<string, unknown>;
  paymentPlanSnapshot: Record<string, unknown>;
  timeframeSnapshot: Record<string, unknown>;
  runId: string | null;
  approvedAt: string | null;
  approvedBy: string | null;
  sentAt: string | null;
  documentId: string | null;
}

export interface ProposalFollowup {
  id: string;
  proposalId: string;
  stage: "first" | "second" | "final";
  dueAt: string;
  status: "open" | "done" | "cancelled";
  note: string;
  completedAt: string | null;
  completedBy: string | null;
  createdAt: string;
}

export interface SalesAiRun {
  id: string;
  promptKey: SalesPromptKey;
  promptVersion: number;
  brandContext: BrandContext | "any";
  entityType: "company" | "opportunity" | "lead_query";
  entityId: string | null;
  status: RunStatus;
  inputSnapshot: Record<string, unknown>;
  output: Record<string, unknown> | null;
  outputText: string | null;
  model: string;
  temperature: number | null;
  tokensIn: number | null;
  tokensOut: number | null;
  provider: string;
  error: string | null;
  actorId: string | null;
  actorName: string | null;
  reviewerId: string | null;
  reviewerName: string | null;
  reviewedAt: string | null;
  reviewNote: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

export interface SalesPrompt {
  id: string;
  key: SalesPromptKey;
  version: number;
  brandContext: BrandContext | "any";
  model: string;
  temperature: number;
  system: string;
  userTemplate: string;
  outputFormat: "json" | "text" | "markdown";
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalesPlaybook {
  id: string;
  key: string;
  version: number;
  brandContext: BrandContext | "any";
  structured: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SalesAsset {
  id: string;
  companyId: string | null;
  kind: string;
  mime: string;
  sha256: string;
  size: number;
  note: string;
  createdAt: string;
}

/* ── Dashboard ──────────────────────────────────────────────────────── */

export interface DashboardResponse {
  counts: {
    companies: number;
    dueToday: number;
    overdue: number;
    aiReviewRequired: number;
  };
  pipelineByStatus: { status: SalesStatus; count: number }[];
  pipelineByBrand: { brand: BrandContext; count: number }[];
  aging: { bucket: "week" | "month" | "quarter" | "older"; count: number }[];
  commercial: {
    expectedCents: number;
    proposalCents: number;
    won: number;
    lost: number;
    deferred: number;
  };
  today: { id: string; name: string; nextAction: NextAction | null; dueAt: string }[];
  overdueList: { id: string; name: string; nextAction: NextAction | null; dueAt: string }[];
  followups: ProposalFollowup[];
}

/* ── Formatierung ───────────────────────────────────────────────────── */

export function formatEuroFromCents(cents: number | null | undefined): string {
  if (cents == null) return "—";
  const value = cents / 100;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateDe(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTimeDe(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
