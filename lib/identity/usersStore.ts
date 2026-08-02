/**
 * Nutzer- und Organisationsdatensätze in Postgres.
 *
 * `crm_users` ist ein Spiegel der bestehenden Identitätsquellen
 * (`data/demo-users.json` und die Env-Variable `ADMIN_USERS`). Die
 * Authentifizierung selbst bleibt unverändert — hier entsteht lediglich ein
 * referenzierbarer Datensatz, damit Tickets Zuweisungen, Genehmiger und
 * Kommentarautoren über Fremdschlüssel abbilden können.
 *
 * Abgleichsschlüssel ist die kleingeschriebene E-Mail, nicht die ID. Die IDs in
 * der JSON-Datei sind nicht stabil; ein ID-Wechsel würde sonst bei jedem Login
 * einen zweiten Datensatz erzeugen und bestehende Ticketzuweisungen ins Leere
 * laufen lassen.
 */

import { db, type Sql } from "@/lib/pg";
import { normalizeLegacyRole, isRole, type Role } from "@/lib/auth/roles";

export interface CrmUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  brand: "nexcel" | "agiworks" | null;
  orgId: string | null;
  isActive: boolean;
  source: "env" | "file" | "db";
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CrmOrganization {
  id: string;
  name: string;
  brand: string;
  emailDomain: string | null;
  isInternal: boolean;
  isActive: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  brand: string | null;
  org_id: string | null;
  is_active: boolean;
  source: string;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

function iso(value: Date | null): string | null {
  return value ? value.toISOString() : null;
}

function rowToUser(row: UserRow): CrmUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: isRole(row.role) ? row.role : "viewer",
    brand: row.brand === "nexcel" || row.brand === "agiworks" ? row.brand : null,
    orgId: row.org_id,
    isActive: row.is_active,
    source: row.source === "env" || row.source === "db" ? row.source : "file",
    lastLoginAt: iso(row.last_login_at),
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

const USER_COLUMNS = `id, email, name, role, brand, org_id, is_active, source, last_login_at, created_at, updated_at`;

/* ── Organisationen ────────────────────────────────────────────────── */

function domainOf(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at < 0 || at === email.length - 1) return null;
  return email.slice(at + 1).toLowerCase();
}

/**
 * Findet die Organisation zu einer E-Mail-Domain. Wird beim Spiegeln genutzt,
 * damit Nutzer derselben Firma automatisch zusammengehören — Voraussetzung für
 * die spätere Mandantentrennung im Kundenportal.
 */
async function findOrgByEmail(sql: Sql, email: string): Promise<string | null> {
  const domain = domainOf(email);
  if (!domain) return null;
  const [row] = await sql<{ id: string }[]>`
    SELECT id FROM crm_organizations
    WHERE lower(email_domain) = ${domain} AND is_active
    LIMIT 1
  `;
  return row?.id ?? null;
}

export async function listOrganizations(): Promise<CrmOrganization[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<
    {
      id: string;
      name: string;
      brand: string;
      email_domain: string | null;
      is_internal: boolean;
      is_active: boolean;
      notes: string;
      created_at: Date;
      updated_at: Date;
    }[]
  >`
    SELECT id, name, brand, email_domain, is_internal, is_active, notes, created_at, updated_at
    FROM crm_organizations
    ORDER BY is_internal DESC, name ASC
  `;
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    brand: r.brand,
    emailDomain: r.email_domain,
    isInternal: r.is_internal,
    isActive: r.is_active,
    notes: r.notes,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  }));
}

/* ── Nutzer ────────────────────────────────────────────────────────── */

export async function getUserById(id: string): Promise<CrmUser | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_COLUMNS)} FROM crm_users WHERE id = ${id} LIMIT 1
  `;
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function getUserByEmail(email: string): Promise<CrmUser | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_COLUMNS)} FROM crm_users
    WHERE lower(email) = ${email.toLowerCase()} LIMIT 1
  `;
  return rows[0] ? rowToUser(rows[0]) : null;
}

export interface ListUsersOptions {
  activeOnly?: boolean;
  roles?: Role[];
  /** Freitextsuche über Name und E-Mail. */
  search?: string;
}

export async function listUsers(options: ListUsersOptions = {}): Promise<CrmUser[]> {
  const sql = await db();
  if (!sql) return [];
  const { activeOnly = false, roles, search } = options;
  const term = search?.trim() ? `%${search.trim().toLowerCase()}%` : null;

  const rows = await sql<UserRow[]>`
    SELECT ${sql.unsafe(USER_COLUMNS)} FROM crm_users
    WHERE (${activeOnly} = FALSE OR is_active)
      AND (${roles == null} OR role = ANY(${roles ?? []}))
      AND (
        ${term}::text IS NULL
        OR lower(name) LIKE ${term}
        OR lower(email) LIKE ${term}
      )
    ORDER BY is_active DESC, name ASC, email ASC
  `;
  return rows.map(rowToUser);
}

/** Nutzer, die Tickets zugewiesen bekommen können. */
export async function listAssignableUsers(): Promise<CrmUser[]> {
  return listUsers({ activeOnly: true, roles: ["owner", "admin", "agent"] });
}

export interface MirrorUserInput {
  id: string;
  email: string;
  name: string;
  /** Rollenbezeichnung aus der Altquelle ("admin" / "demo_user") oder neu. */
  role: string;
  brand?: string | null;
  source: "env" | "file";
}

/**
 * Legt den Nutzer an oder aktualisiert ihn. Wird bei jedem erfolgreichen Login
 * aufgerufen.
 *
 * Bewusst NICHT überschrieben werden `role` und `org_id`, sobald der Datensatz
 * existiert: beides kann im CRM gepflegt worden sein, und die JSON-Datei kennt
 * das feinere Rollenmodell nicht. Sie würde eine dort vergebene Rolle
 * "agent" bei jedem Login wieder auf "viewer" zurücksetzen.
 */
export async function mirrorUser(input: MirrorUserInput): Promise<CrmUser | null> {
  const sql = await db();
  if (!sql) return null;

  const email = input.email.trim();
  const initialRole = normalizeLegacyRole(input.role);
  const brand =
    input.brand === "nexcel" || input.brand === "agiworks" ? input.brand : null;
  const orgId = await findOrgByEmail(sql, email);

  const rows = await sql<UserRow[]>`
    INSERT INTO crm_users (id, email, name, role, brand, org_id, source, last_login_at, updated_at)
    VALUES (
      ${input.id}, ${email}, ${input.name ?? ""}, ${initialRole},
      ${brand}, ${orgId}, ${input.source}, NOW(), NOW()
    )
    ON CONFLICT ((lower(email))) DO UPDATE SET
      name          = EXCLUDED.name,
      brand         = COALESCE(EXCLUDED.brand, crm_users.brand),
      org_id        = COALESCE(crm_users.org_id, EXCLUDED.org_id),
      source        = EXCLUDED.source,
      is_active     = TRUE,
      last_login_at = NOW(),
      updated_at    = NOW()
    RETURNING ${sql.unsafe(USER_COLUMNS)}
  `;
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function setUserRole(id: string, role: Role): Promise<CrmUser | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    UPDATE crm_users SET role = ${role}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING ${sql.unsafe(USER_COLUMNS)}
  `;
  return rows[0] ? rowToUser(rows[0]) : null;
}

export async function setUserActive(id: string, active: boolean): Promise<CrmUser | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<UserRow[]>`
    UPDATE crm_users SET is_active = ${active}, updated_at = NOW()
    WHERE id = ${id}
    RETURNING ${sql.unsafe(USER_COLUMNS)}
  `;
  return rows[0] ? rowToUser(rows[0]) : null;
}
