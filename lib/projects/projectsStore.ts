/**
 * Datenzugriff für Projekte.
 *
 * Die Übersicht zeigt je Projekt die Zahl offener Tickets und die zuletzt
 * bewegte Meldung. Beides kommt aus EINER Abfrage: bei vierzehn Projekten
 * wären es sonst neunundzwanzig Roundtrips für eine einzige Seite.
 *
 * Die letzte Aktivität wird über LATERAL geholt statt über eine Unterabfrage
 * je Spalte — so liest Postgres die zugehörige Ticketzeile genau einmal und
 * kann dabei den Projektindex nutzen.
 */

import { db } from "@/lib/pg";
import type { Tx } from "@/lib/db/migrationRunner";
import { writeAuditTx, type AuditActor } from "@/lib/audit/auditLog";
import { slugify, type Project, type ProjectOption, type ProjectStatus } from "./model";

export { isProjectStatus, slugify } from "./model";
export type { Project, ProjectOption, ProjectStatus } from "./model";

interface ProjectRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  production_url: string | null;
  repo: string | null;
  brand: string | null;
  color: string;
  status: string;
  org_id: string | null;
  sort_order: number;
  open_tickets: number;
  total_tickets: number;
  overdue_tickets: number;
  last_ticket_id: string | null;
  last_ticket_key: string | null;
  last_ticket_title: string | null;
  last_ticket_status: string | null;
  last_ticket_at: Date | null;
  last_actor_name: string | null;
  created_at: Date;
  updated_at: Date;
}

function rowToProject(r: ProjectRow): Project {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    productionUrl: r.production_url,
    repo: r.repo,
    brand: r.brand,
    color: r.color,
    status: r.status as ProjectStatus,
    orgId: r.org_id,
    sortOrder: r.sort_order,
    openTickets: Number(r.open_tickets ?? 0),
    totalTickets: Number(r.total_tickets ?? 0),
    overdueTickets: Number(r.overdue_tickets ?? 0),
    lastActivity:
      r.last_ticket_id && r.last_ticket_at
        ? {
            ticketId: r.last_ticket_id,
            key: r.last_ticket_key ?? "",
            title: r.last_ticket_title ?? "",
            status: r.last_ticket_status ?? "new",
            at: r.last_ticket_at.toISOString(),
            actorName: r.last_actor_name,
          }
        : null,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}

const PROJECT_QUERY = `
  SELECT
    p.id, p.slug, p.name, p.description, p.production_url, p.repo, p.brand,
    p.color, p.status, p.org_id, p.sort_order, p.created_at, p.updated_at,
    COALESCE(c.open_tickets, 0)    AS open_tickets,
    COALESCE(c.total_tickets, 0)   AS total_tickets,
    COALESCE(c.overdue_tickets, 0) AS overdue_tickets,
    l.id     AS last_ticket_id,
    l.key    AS last_ticket_key,
    l.title  AS last_ticket_title,
    l.status AS last_ticket_status,
    l.updated_at AS last_ticket_at,
    lu.name  AS last_actor_name
  FROM crm_projects p
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*)::int AS total_tickets,
      COUNT(*) FILTER (WHERE status NOT IN ('resolved','closed','cancelled'))::int AS open_tickets,
      COUNT(*) FILTER (
        WHERE due_at < NOW() AND status NOT IN ('resolved','closed','cancelled')
      )::int AS overdue_tickets
    FROM tickets t
    WHERE t.project_id = p.id AND t.deleted_at IS NULL AND t.archived_at IS NULL
  ) c ON TRUE
  LEFT JOIN LATERAL (
    SELECT t.id, t.key, t.title, t.status, t.updated_at, t.updated_by
    FROM tickets t
    WHERE t.project_id = p.id AND t.deleted_at IS NULL
    ORDER BY t.updated_at DESC
    LIMIT 1
  ) l ON TRUE
  LEFT JOIN crm_users lu ON lu.id = l.updated_by
`;

export async function listProjects(
  options: { includeArchived?: boolean; search?: string } = {}
): Promise<Project[]> {
  const sql = await db();
  if (!sql) return [];

  const term = options.search?.trim() ? `%${options.search.trim().toLowerCase()}%` : null;

  const rows = await sql<ProjectRow[]>`
    ${sql.unsafe(PROJECT_QUERY)}
    WHERE p.deleted_at IS NULL
      AND (${options.includeArchived === true} OR p.status <> 'archived')
      AND (
        ${term}::text IS NULL
        OR lower(p.name) LIKE ${term}
        OR lower(p.slug) LIKE ${term}
        OR lower(COALESCE(p.production_url, '')) LIKE ${term}
        OR lower(COALESCE(p.repo, '')) LIKE ${term}
      )
    ORDER BY p.sort_order ASC, p.name ASC
  `;
  return rows.map(rowToProject);
}

export async function getProject(id: string): Promise<Project | null> {
  const sql = await db();
  if (!sql) return null;
  const rows = await sql<ProjectRow[]>`
    ${sql.unsafe(PROJECT_QUERY)}
    WHERE p.id = ${id} AND p.deleted_at IS NULL
    LIMIT 1
  `;
  return rows[0] ? rowToProject(rows[0]) : null;
}

/** Schlanke Liste für Auswahlfelder — ohne die Zähl-Joins. */
export async function listProjectOptions(): Promise<ProjectOption[]> {
  const sql = await db();
  if (!sql) return [];
  const rows = await sql<
    { id: string; name: string; slug: string; color: string; status: string }[]
  >`
    SELECT id, name, slug, color, status FROM crm_projects
    WHERE deleted_at IS NULL AND status <> 'archived'
    ORDER BY sort_order ASC, name ASC
  `;
  return rows.map((r) => ({ ...r, status: r.status as ProjectStatus }));
}

/* ── Schreiben ──────────────────────────────────────────────────────── */

export class ProjectValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectValidationError";
  }
}

function projectId(slug: string): string {
  return `prj_${slug}`;
}

async function knownUserId(tx: Tx, id: string | null | undefined): Promise<string | null> {
  if (!id) return null;
  const rows = await tx<{ id: string }[]>`
    SELECT id FROM crm_users WHERE id = ${id} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

export interface CreateProjectInput {
  name: string;
  slug?: string;
  description?: string;
  productionUrl?: string | null;
  repo?: string | null;
  brand?: string | null;
  color?: string;
  status?: ProjectStatus;
}

export async function createProject(
  input: CreateProjectInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<Project | null> {
  const sql = await db();
  if (!sql) return null;

  const name = input.name.trim();
  if (!name) throw new ProjectValidationError("Name darf nicht leer sein");

  const slug = slugify(input.slug?.trim() || name);
  if (!slug) throw new ProjectValidationError("Aus dem Namen lässt sich keine Kennung bilden");

  const id = projectId(slug);

  await sql.begin(async (tx) => {
    const [existing] = await tx<{ id: string }[]>`
      SELECT id FROM crm_projects WHERE slug = ${slug} LIMIT 1
    `;
    if (existing) throw new ProjectValidationError("Ein Projekt mit dieser Kennung existiert bereits");

    // Neue Projekte hinten anstellen, damit die bestehende Reihenfolge bleibt.
    const [last] = await tx<{ max: number | null }[]>`
      SELECT MAX(sort_order) AS max FROM crm_projects
    `;
    const actorId = await knownUserId(tx, actor.id);

    await tx`
      INSERT INTO crm_projects (
        id, slug, name, description, production_url, repo, brand, color,
        status, sort_order, created_by, updated_by
      ) VALUES (
        ${id}, ${slug}, ${name}, ${input.description ?? ""},
        ${input.productionUrl || null}, ${input.repo || null},
        ${input.brand || null}, ${input.color ?? "#A45CFF"},
        ${input.status ?? "active"}, ${(last?.max ?? 0) + 10},
        ${actorId}, ${actorId}
      )
    `;

    await writeAuditTx(tx, {
      actor,
      action: "project.created",
      entityType: "project",
      entityId: id,
      after: { slug, name, productionUrl: input.productionUrl ?? null },
      ...meta,
    });
  });

  return getProject(id);
}

export interface UpdateProjectInput {
  name?: string;
  description?: string;
  productionUrl?: string | null;
  repo?: string | null;
  brand?: string | null;
  color?: string;
  status?: ProjectStatus;
}

export async function updateProject(
  id: string,
  input: UpdateProjectInput,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<Project | null> {
  const sql = await db();
  if (!sql) return null;

  await sql.begin(async (tx) => {
    const [current] = await tx<
      {
        name: string; description: string; production_url: string | null;
        repo: string | null; brand: string | null; color: string; status: string;
      }[]
    >`
      SELECT name, description, production_url, repo, brand, color, status
      FROM crm_projects WHERE id = ${id} AND deleted_at IS NULL
      FOR UPDATE
    `;
    if (!current) throw new ProjectValidationError("Projekt nicht gefunden");

    const name = input.name !== undefined ? input.name.trim() : undefined;
    if (name !== undefined && !name) {
      throw new ProjectValidationError("Name darf nicht leer sein");
    }

    const actorId = await knownUserId(tx, actor.id);

    await tx`
      UPDATE crm_projects SET
        name           = COALESCE(${name ?? null}, name),
        description    = COALESCE(${input.description ?? null}, description),
        production_url = ${input.productionUrl === undefined ? sql`production_url` : input.productionUrl || null},
        repo           = ${input.repo === undefined ? sql`repo` : input.repo || null},
        brand          = ${input.brand === undefined ? sql`brand` : input.brand || null},
        color          = COALESCE(${input.color ?? null}, color),
        status         = COALESCE(${input.status ?? null}, status),
        updated_by     = ${actorId},
        updated_at     = NOW()
      WHERE id = ${id}
    `;

    const [next] = await tx<
      {
        name: string; description: string; production_url: string | null;
        repo: string | null; brand: string | null; color: string; status: string;
      }[]
    >`
      SELECT name, description, production_url, repo, brand, color, status
      FROM crm_projects WHERE id = ${id}
    `;

    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    const compare: [string, unknown, unknown][] = [
      ["name", current.name, next.name],
      ["description", current.description, next.description],
      ["productionUrl", current.production_url, next.production_url],
      ["repo", current.repo, next.repo],
      ["brand", current.brand, next.brand],
      ["color", current.color, next.color],
      ["status", current.status, next.status],
    ];
    for (const [field, a, b] of compare) {
      if (JSON.stringify(a) !== JSON.stringify(b)) {
        before[field] = a;
        after[field] = b;
      }
    }

    if (Object.keys(after).length > 0) {
      await writeAuditTx(tx, {
        actor, action: "project.updated", entityType: "project",
        entityId: id, before, after, ...meta,
      });
    }
  });

  return getProject(id);
}

/**
 * Weiches Löschen. Die Tickets des Projekts bleiben erhalten und verlieren nur
 * ihren Projektbezug — die Arbeit daran ist ja trotzdem geleistet worden.
 */
export async function deleteProject(
  id: string,
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;

  let ok = false;
  await sql.begin(async (tx) => {
    const [row] = await tx<{ slug: string; name: string }[]>`
      UPDATE crm_projects SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = ${id} AND deleted_at IS NULL
      RETURNING slug, name
    `;
    if (!row) return;
    ok = true;

    const [affected] = await tx<{ count: number }[]>`
      SELECT COUNT(*)::int AS count FROM tickets
      WHERE project_id = ${id} AND deleted_at IS NULL
    `;
    await tx`UPDATE tickets SET project_id = NULL WHERE project_id = ${id}`;

    await writeAuditTx(tx, {
      actor,
      action: "project.deleted",
      entityType: "project",
      entityId: id,
      before: { slug: row.slug, name: row.name },
      context: { detachedTickets: affected?.count ?? 0 },
      ...meta,
    });
  });
  return ok;
}

/** Reihenfolge der Übersicht. */
export async function reorderProjects(
  ids: string[],
  actor: AuditActor,
  meta: { ip?: string | null; userAgent?: string | null } = {}
): Promise<boolean> {
  const sql = await db();
  if (!sql) return false;

  await sql.begin(async (tx) => {
    for (let i = 0; i < ids.length; i++) {
      await tx`
        UPDATE crm_projects SET sort_order = ${(i + 1) * 10}, updated_at = NOW()
        WHERE id = ${ids[i]}
      `;
    }
    await writeAuditTx(tx, {
      actor,
      action: "project.reordered",
      entityType: "project",
      entityId: "collection",
      after: { count: ids.length },
      ...meta,
    });
  });
  return true;
}
