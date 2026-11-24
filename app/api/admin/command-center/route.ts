/** Operational Command Center: one authenticated, no-store, permission-scoped read model. */
import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { db } from "@/lib/pg";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Brand = "nexcel" | "agiworks";
type Metric = number | null;
type WorkItem = {
  id: string;
  title: string;
  description: string;
  brand: Brand;
  tab: "overview" | "tickets" | "vertrieb" | "termine";
  kind: "task" | "ticket" | "lead" | "meeting";
  dueAt: string | null;
  priority: string;
  version?: number;
};

export async function GET(request: NextRequest) {
  const gate = await authorize("ticket.read.all");
  if (!gate.ok) return gate.response;
  const auth = gate.auth;
  const desired = request.nextUrl.searchParams.get("brand") ?? "all";
  if (!["all", "nexcel", "agiworks"].includes(desired)) {
    return NextResponse.json({ error: "invalid_brand" }, { status: 400 });
  }
  const privileged = auth.role === "owner" || auth.role === "admin";
  if (!privileged && (!auth.brand || (desired !== "all" && desired !== auth.brand))) {
    return NextResponse.json({ error: "brand_forbidden" }, { status: 403 });
  }
  const scope: Brand | null = privileged
    ? (desired === "all" ? null : desired as Brand)
    : auth.brand;
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  // Data sources fail independently: never disguise an unavailable counter as zero.
  const warnings: string[] = [];
  async function safely<T>(name: string, canRead: boolean, fn: () => Promise<T>): Promise<T | null> {
    if (!canRead) return null;
    try { return await fn(); }
    catch (error) {
      console.error("[COMMAND CENTER] read failed:", name, error instanceof Error ? error.name : "error");
      warnings.push(name);
      return null;
    }
  }
  async function count(fn: () => PromiseLike<Array<{ value: string | number }>>): Promise<number> {
    const rows = await fn();
    return Number(rows[0]?.value ?? 0);
  }
  const maySales = auth.can("sales.read");
  const mayBilling = auth.can("billing.read");
  const mayTickets = auth.can("ticket.read.all");
  const mayContacts = auth.can("crm.contacts.read");
  const [leads, offers, projects, tasks, tickets, invoices, bookings, taskRows, ticketRows, leadRows] = await Promise.all([
    safely("leads", mayContacts, () => count(() => sql<{ value: number | string }[]>`
      SELECT count(*)::int AS value FROM marketing_inbound_leads
      WHERE status IN ('new','in_review') AND (${scope === null} OR brand = ${scope})
    `)),
    safely("offers", maySales, () => count(() => sql<{ value: number | string }[]>`
      SELECT count(*)::int AS value FROM sales_proposals
      WHERE deleted_at IS NULL AND status IN ('draft','preview','approved','sent')
        AND (${scope === null} OR brand_context IN (${scope}, 'both'))
    `)),
    safely("projects", mayTickets, () => count(() => sql<{ value: number | string }[]>`
      SELECT count(*)::int AS value FROM crm_projects
      WHERE deleted_at IS NULL AND status = 'active'
        AND (${scope === null} OR brand = ${scope} OR brand IS NULL)
    `)),
    safely("tasks", mayTickets, () => count(() => sql<{ value: number | string }[]>`
      SELECT count(*)::int AS value FROM command_tasks
      WHERE deleted_at IS NULL AND status IN ('open','in_progress')
        AND (${scope === null} OR brand = ${scope})
        AND (${privileged} OR assigned_to = ${auth.userId} OR created_by = ${auth.userId})
    `)),
    safely("tickets", mayTickets, () => count(() => sql<{ value: number | string }[]>`
      SELECT count(*)::int AS value FROM tickets
      WHERE deleted_at IS NULL AND archived_at IS NULL
        AND status NOT IN ('resolved','closed','cancelled')
        AND (${scope === null} OR brand = ${scope})
    `)),
    safely("invoices", mayBilling, () => count(() => sql<{ value: number | string }[]>`
      SELECT count(*)::int AS value FROM invoices i
      JOIN billing_issuers b ON b.id = i.issuer_id
      WHERE i.status IN ('finalized','sent','overdue','partially_paid')
        AND i.payment_status <> 'paid'
        AND (${scope === null} OR b.key = ${scope})
    `)),
    safely("bookings", mayTickets, () => count(() => sql<{ value: number | string }[]>`
      SELECT count(*)::int AS value FROM consultation_bookings
      WHERE status IN ('pending','confirmed') AND starts_at >= NOW()
        AND (${scope === null} OR brand = ${scope})
    `)),
    safely("task_queue", mayTickets, async () => sql<{
      id: string; title: string; description: string; brand: Brand;
      priority: string; due_at: Date | null; version: number;
    }[]>`
      SELECT id, title, description, brand, priority, due_at, version
      FROM command_tasks WHERE deleted_at IS NULL AND status IN ('open','in_progress')
        AND (${scope === null} OR brand = ${scope})
        AND (${privileged} OR assigned_to = ${auth.userId} OR created_by = ${auth.userId})
      ORDER BY due_at ASC NULLS LAST, created_at DESC LIMIT 16
    `),
    safely("ticket_queue", mayTickets, async () => sql<{
      id: string; title: string; brand: Brand; priority: string; due_at: Date | null;
    }[]>`
      SELECT id, title, brand, priority, due_at FROM tickets
      WHERE deleted_at IS NULL AND archived_at IS NULL
        AND status NOT IN ('resolved','closed','cancelled')
        AND (${scope === null} OR brand = ${scope})
        AND (${privileged} OR assignee_id = ${auth.userId})
      ORDER BY due_at ASC NULLS LAST, created_at DESC LIMIT 8
    `),
    safely("lead_queue", mayContacts, async () => sql<{
      id: string; subject: string; name: string; brand: Brand; priority: string;
      next_action_at: Date | null;
    }[]>`
      SELECT id, subject, name, brand, priority, next_action_at
      FROM marketing_inbound_leads
      WHERE status IN ('new','in_review') AND (${scope === null} OR brand = ${scope})
      ORDER BY next_action_at ASC NULLS LAST, created_at DESC LIMIT 8
    `),
  ]);
  const asDate = (d: Date | null) => d instanceof Date ? d.toISOString() : null;
  const work: WorkItem[] = [
    ...(taskRows ?? []).map(t => ({ id: t.id, title: t.title, description: t.description,
      brand: t.brand, tab: "overview" as const, kind: "task" as const,
      dueAt: asDate(t.due_at), priority: t.priority, version: t.version })),
    ...(ticketRows ?? []).map(t => ({ id: t.id, title: t.title,
      description: "Ticket bearbeiten", brand: t.brand, tab: "tickets" as const,
      kind: "ticket" as const, dueAt: asDate(t.due_at), priority: t.priority })),
    ...(leadRows ?? []).map(l => ({ id: l.id, title: l.subject || l.name,
      description: "Neue Kundenanfrage bearbeiten", brand: l.brand,
      tab: "vertrieb" as const, kind: "lead" as const,
      dueAt: asDate(l.next_action_at), priority: l.priority })),
  ];
  const rank = (p: string) => p === "critical" || p === "urgent" || p === "high" ? 0 : 1;
  work.sort((a, b) => rank(a.priority) - rank(b.priority)
    || (a.dueAt ?? "9999").localeCompare(b.dueAt ?? "9999"));
  const metrics: Record<string, Metric> = { leads, offers, projects, tasks, tickets, invoices, bookings };
  return NextResponse.json({ brand: scope ?? "all", generatedAt: new Date().toISOString(),
    metrics, work: work.slice(0, 12), warnings },
    { headers: { "Cache-Control": "private, no-store, max-age=0" } });
}
