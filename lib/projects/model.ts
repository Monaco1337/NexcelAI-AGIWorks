/**
 * Projektmodell — Typen, Status und Anzeigetexte.
 *
 * Bewusst frei von Datenbankzugriff: die Admin-Oberfläche läuft im Browser und
 * würde über einen Import aus dem Store den Postgres-Treiber in ihr Bündel
 * ziehen. Dieselbe Trennung wie zwischen `tickets/model` und `tickets/store`.
 */

export const PROJECT_STATUSES = ["active", "paused", "archived"] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  active: "Aktiv",
  paused: "Pausiert",
  archived: "Archiviert",
};

export const PROJECT_STATUS_COLOR: Record<ProjectStatus, string> = {
  active: "#22C55E",
  paused: "#FBBF24",
  archived: "#6B7280",
};

export function isProjectStatus(v: unknown): v is ProjectStatus {
  return typeof v === "string" && (PROJECT_STATUSES as readonly string[]).includes(v);
}

export interface Project {
  id: string;
  slug: string;
  name: string;
  description: string;
  productionUrl: string | null;
  repo: string | null;
  brand: string | null;
  color: string;
  status: ProjectStatus;
  orgId: string | null;
  sortOrder: number;
  /** Offene Tickets — die Zahl, die in der Übersicht zählt. */
  openTickets: number;
  totalTickets: number;
  /** Überfällige Tickets; treibt die Warnanzeige in der Zeile. */
  overdueTickets: number;
  /** Zuletzt bewegtes Ticket, für die Aktivitätszeile. */
  lastActivity: {
    ticketId: string;
    key: string;
    title: string;
    status: string;
    at: string;
    actorName: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectOption {
  id: string;
  name: string;
  slug: string;
  color: string;
  status: ProjectStatus;
}

/** Erzeugt aus einem Namen eine URL-taugliche Kennung. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
