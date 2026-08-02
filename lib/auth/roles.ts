/**
 * Rollen- und Berechtigungsmodell.
 *
 * Bisher kannte das System genau zwei Rollen ("admin", "demo_user") und prüfte
 * sie an rund einem Dutzend Stellen per String-Vergleich. Für Tickets reicht
 * das nicht: Bearbeiten, Zuweisen, Genehmigen, Konfigurieren und Löschen sind
 * unterschiedliche Befugnisse, die nicht alle an derselben Rolle hängen.
 *
 * Aufbau:
 *  - Berechtigungen sind das, was geprüft wird. Rollen sind nur Bündel davon.
 *    Damit lässt sich eine Rolle ändern, ohne jede Prüfstelle anzufassen.
 *  - Die Rollen sind aufsteigend mächtig, aber die Prüfung erfolgt NIE über
 *    einen Rangvergleich, sondern immer über die konkrete Berechtigung.
 *    Rangvergleiche brechen, sobald eine Rolle eine Sonderbefugnis erhält.
 *
 * Abbildung der Altrollen:
 *  - "admin"     → owner   (die beiden Inhaber, volle Rechte)
 *  - "demo_user" → viewer  (nur Lesezugriff auf die Demo-Oberfläche)
 */

export const ROLES = ["owner", "admin", "agent", "requester", "viewer"] as const;
export type Role = (typeof ROLES)[number];

export const PERMISSIONS = [
  // — Tickets —
  "ticket.read.all",
  "ticket.read.own",
  "ticket.create",
  "ticket.update",
  "ticket.assign",
  "ticket.transition",
  "ticket.delete",
  "ticket.restore",
  "ticket.archive",
  "ticket.bulk",
  "ticket.comment",
  "ticket.comment.internal",
  "ticket.attachment.upload",
  "ticket.attachment.delete",
  "ticket.approve",
  // — Konfiguration —
  "workflow.read",
  "workflow.manage",
  "sla.manage",
  // — Verwaltung —
  "user.read",
  "user.manage",
  "audit.read",
  // — Bestehende CRM-Bereiche —
  "crm.contacts.read",
  "crm.contacts.manage",
  "crm.content.manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/**
 * Berechtigungen je Rolle. Bewusst ausgeschrieben statt vererbt — man sieht
 * jeder Rolle direkt an, was sie darf, ohne eine Hierarchie im Kopf aufzulösen.
 */
const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  owner: PERMISSIONS,

  admin: [
    "ticket.read.all",
    "ticket.read.own",
    "ticket.create",
    "ticket.update",
    "ticket.assign",
    "ticket.transition",
    "ticket.delete",
    "ticket.restore",
    "ticket.archive",
    "ticket.bulk",
    "ticket.comment",
    "ticket.comment.internal",
    "ticket.attachment.upload",
    "ticket.attachment.delete",
    "ticket.approve",
    "workflow.read",
    "workflow.manage",
    "sla.manage",
    "user.read",
    "audit.read",
    "crm.contacts.read",
    "crm.contacts.manage",
    "crm.content.manage",
  ],

  /** Bearbeitet Tickets im Tagesgeschäft, ändert aber keine Konfiguration. */
  agent: [
    "ticket.read.all",
    "ticket.read.own",
    "ticket.create",
    "ticket.update",
    "ticket.assign",
    "ticket.transition",
    "ticket.archive",
    "ticket.bulk",
    "ticket.comment",
    "ticket.comment.internal",
    "ticket.attachment.upload",
    "workflow.read",
    "user.read",
    "crm.contacts.read",
  ],

  /**
   * Meldet Tickets und verfolgt die eigenen. Vorgesehen für das spätere
   * Kundenportal: bewusst KEIN "ticket.read.all" und keine internen Kommentare.
   */
  requester: [
    "ticket.read.own",
    "ticket.create",
    "ticket.comment",
    "ticket.attachment.upload",
  ],

  viewer: ["ticket.read.own"],
};

const PERMISSION_SETS: Record<Role, ReadonlySet<Permission>> = ROLES.reduce(
  (acc, role) => {
    acc[role] = new Set(ROLE_PERMISSIONS[role]);
    return acc;
  },
  {} as Record<Role, ReadonlySet<Permission>>
);

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

/**
 * Übersetzt die Rollenbezeichnungen aus dem bestehenden Login (JSON-Datei und
 * ADMIN_USERS) in das neue Modell. Unbekannte Werte werden zur schwächsten
 * Rolle — im Zweifel weniger Rechte, nie mehr.
 */
export function normalizeLegacyRole(value: string | null | undefined): Role {
  switch (value) {
    case "admin":
      return "owner";
    case "demo_user":
      return "viewer";
    default:
      return isRole(value) ? value : "viewer";
  }
}

export function roleHasPermission(role: Role, permission: Permission): boolean {
  return PERMISSION_SETS[role].has(permission);
}

export function permissionsForRole(role: Role): Permission[] {
  return [...PERMISSION_SETS[role]];
}

/** Anzeigename für die Oberfläche. */
export const ROLE_LABEL: Record<Role, string> = {
  owner: "Inhaber",
  admin: "Administrator",
  agent: "Bearbeiter",
  requester: "Melder",
  viewer: "Leser",
};
