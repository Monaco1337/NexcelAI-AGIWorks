/**
 * Ticketmodell — Arten, Status, Prioritäten und erlaubte Statuswechsel.
 *
 * Bewusst eine einzige Quelle für Server und Oberfläche. Wären die erlaubten
 * Übergänge doppelt definiert, würde die Oberfläche früher oder später einen
 * Wechsel anbieten, den der Server ablehnt.
 *
 * Die Übergangstabelle ist hier fest hinterlegt, aber so strukturiert, dass
 * Phase 4 sie aus der Datenbank laden kann, ohne die aufrufenden Stellen zu
 * ändern: alle Prüfungen laufen über `canTransition()`.
 */

export const TICKET_TYPES = [
  "incident",
  "problem",
  "change",
  "task",
  "security",
  "support",
] as const;
export type TicketType = (typeof TICKET_TYPES)[number];

export const TICKET_STATUSES = [
  "new",
  "triage",
  "in_progress",
  "waiting",
  "review",
  "resolved",
  "closed",
  "cancelled",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_PRIORITIES = ["low", "normal", "high", "urgent", "critical"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_SEVERITIES = ["sev1", "sev2", "sev3", "sev4"] as const;
export type TicketSeverity = (typeof TICKET_SEVERITIES)[number];

export const TICKET_SOURCES = ["manual", "portal", "email", "automation"] as const;
export type TicketSource = (typeof TICKET_SOURCES)[number];

export const TICKET_VISIBILITIES = ["internal", "shared"] as const;
export type TicketVisibility = (typeof TICKET_VISIBILITIES)[number];

export const TICKET_RELATIONS = [
  "blocks",
  "duplicates",
  "relates_to",
  "caused_by",
  "child_of",
] as const;
export type TicketRelation = (typeof TICKET_RELATIONS)[number];

/* ── Anzeigetexte ───────────────────────────────────────────────────── */

export const TYPE_LABEL: Record<TicketType, string> = {
  incident: "Störung",
  problem: "Problem",
  change: "Änderung",
  task: "Aufgabe",
  security: "Sicherheit",
  support: "Support",
};

/**
 * Kurzbeschreibung je Art. Steht in der Oberfläche direkt an der Auswahl,
 * damit die Abgrenzung zwischen Störung und Problem nicht erklärt werden muss.
 */
export const TYPE_HINT: Record<TicketType, string> = {
  incident: "Etwas funktioniert nicht mehr und muss schnell wieder laufen.",
  problem: "Die Ursache hinter wiederkehrenden Störungen.",
  change: "Geplante Änderung an einem System, mit Freigabe.",
  task: "Reguläre Arbeit ohne Störungsbezug.",
  security: "Sicherheitsvorfall oder Schwachstelle.",
  support: "Anfrage oder Hilfestellung.",
};

export const STATUS_LABEL: Record<TicketStatus, string> = {
  new: "Neu",
  triage: "Sichtung",
  in_progress: "In Arbeit",
  waiting: "Wartet",
  review: "Prüfung",
  resolved: "Gelöst",
  closed: "Geschlossen",
  cancelled: "Abgebrochen",
};

export const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Niedrig",
  normal: "Normal",
  high: "Hoch",
  urgent: "Dringend",
  critical: "Kritisch",
};

export const SEVERITY_LABEL: Record<TicketSeverity, string> = {
  sev1: "SEV1 · Totalausfall",
  sev2: "SEV2 · Stark eingeschränkt",
  sev3: "SEV3 · Teilweise betroffen",
  sev4: "SEV4 · Geringfügig",
};

export const RELATION_LABEL: Record<TicketRelation, string> = {
  blocks: "blockiert",
  duplicates: "ist Dublette von",
  relates_to: "hängt zusammen mit",
  caused_by: "verursacht durch",
  child_of: "untergeordnet zu",
};

export const SOURCE_LABEL: Record<TicketSource, string> = {
  manual: "Manuell",
  portal: "Portal",
  email: "E-Mail",
  automation: "Automation",
};

/* ── Zustände ───────────────────────────────────────────────────────── */

/** Status, ab denen ein Ticket als erledigt zählt. */
export const TERMINAL_STATUSES: readonly TicketStatus[] = ["closed", "cancelled"];

/** Status, die als „nicht mehr in Arbeit" gelten. */
export const DONE_STATUSES: readonly TicketStatus[] = ["resolved", "closed", "cancelled"];

export function isOpenStatus(status: TicketStatus): boolean {
  return !DONE_STATUSES.includes(status);
}

/* ── Statuswechsel ──────────────────────────────────────────────────── */

/**
 * Erlaubte Folgezustände. Ein leeres Array bedeutet Endzustand.
 *
 * Rückwege sind absichtlich vorhanden: ein zu früh geschlossenes Ticket muss
 * sich wieder öffnen lassen, sonst legen Bearbeiter Dubletten an.
 */
const TRANSITIONS: Record<TicketStatus, readonly TicketStatus[]> = {
  new: ["triage", "in_progress", "cancelled"],
  triage: ["in_progress", "waiting", "cancelled"],
  in_progress: ["waiting", "review", "resolved", "cancelled"],
  waiting: ["in_progress", "review", "resolved", "cancelled"],
  review: ["in_progress", "resolved", "cancelled"],
  resolved: ["closed", "in_progress"],
  closed: ["in_progress"],
  cancelled: ["in_progress"],
};

export function allowedTransitions(from: TicketStatus): readonly TicketStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: TicketStatus, to: TicketStatus): boolean {
  if (from === to) return true;
  return allowedTransitions(from).includes(to);
}

/**
 * Änderungen brauchen eine Freigabe, bevor die Umsetzung beginnt. Die
 * Genehmigungslogik selbst kommt in Phase 4; die Regel steht hier, damit sie
 * dort nur noch ausgewertet werden muss.
 */
export function requiresApproval(type: TicketType, to: TicketStatus): boolean {
  return type === "change" && to === "in_progress";
}

/* ── Pflichtfelder je Art ───────────────────────────────────────────── */

export function severityRequired(type: TicketType): boolean {
  return type === "incident" || type === "security";
}

/* ── Eingabeprüfung ─────────────────────────────────────────────────── */

export function isTicketType(v: unknown): v is TicketType {
  return typeof v === "string" && (TICKET_TYPES as readonly string[]).includes(v);
}
export function isTicketStatus(v: unknown): v is TicketStatus {
  return typeof v === "string" && (TICKET_STATUSES as readonly string[]).includes(v);
}
export function isTicketPriority(v: unknown): v is TicketPriority {
  return typeof v === "string" && (TICKET_PRIORITIES as readonly string[]).includes(v);
}
export function isTicketSeverity(v: unknown): v is TicketSeverity {
  return typeof v === "string" && (TICKET_SEVERITIES as readonly string[]).includes(v);
}
export function isTicketRelation(v: unknown): v is TicketRelation {
  return typeof v === "string" && (TICKET_RELATIONS as readonly string[]).includes(v);
}
export function isTicketVisibility(v: unknown): v is TicketVisibility {
  return typeof v === "string" && (TICKET_VISIBILITIES as readonly string[]).includes(v);
}
export function isTicketSource(v: unknown): v is TicketSource {
  return typeof v === "string" && (TICKET_SOURCES as readonly string[]).includes(v);
}

/* ── Darstellungsfarben ─────────────────────────────────────────────── */

/**
 * Die Admin-Oberfläche arbeitet mit Inline-Farben statt Utility-Klassen.
 * Die Werte folgen der bestehenden Palette (Erfolg #22C55E, Warnung #FBBF24,
 * Fehler #EF4444) und werden von Listen und Detailansicht gemeinsam genutzt.
 */
export const STATUS_COLOR: Record<TicketStatus, string> = {
  new: "#5BB8FF",
  triage: "#8B7CFF",
  in_progress: "#A45CFF",
  waiting: "#FBBF24",
  review: "#38BDF8",
  resolved: "#22C55E",
  closed: "#6B7280",
  cancelled: "#6B7280",
};

export const PRIORITY_COLOR: Record<TicketPriority, string> = {
  low: "#6B7280",
  normal: "#9CA3AF",
  high: "#FBBF24",
  urgent: "#FB923C",
  critical: "#EF4444",
};

export const TYPE_COLOR: Record<TicketType, string> = {
  incident: "#EF4444",
  problem: "#FB923C",
  change: "#5BB8FF",
  task: "#9CA3AF",
  security: "#F472B6",
  support: "#A45CFF",
};
