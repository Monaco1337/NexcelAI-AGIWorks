import { randomUUID } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { db } from "@/lib/pg";
import { recordCommandEventTx } from "@/lib/command-center/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const gate = await authorize("ticket.create");
  if (!gate.ok) return gate.response;
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "origin_forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title.length < 1 || title.length > 200) return NextResponse.json({ error: "invalid_title" }, { status: 400 });
  const description = typeof body.description === "string" ? body.description.trim() : "";
  if (description.length > 2000) return NextResponse.json({ error: "description_too_long" }, { status: 400 });
  const brand = body.brand === "agiworks" ? "agiworks" : body.brand === "nexcel" ? "nexcel" : null;
  if (!brand) return NextResponse.json({ error: "invalid_brand" }, { status: 400 });
  const auth = gate.auth;
  const privileged = auth.role === "owner" || auth.role === "admin";
  if (!privileged && (!auth.brand || brand !== auth.brand)) {
    return NextResponse.json({ error: "brand_forbidden" }, { status: 403 });
  }
  const priority = body.priority === "high" || body.priority === "low" ? body.priority : "normal";
  const assignee = typeof body.assigneeId === "string" ? body.assigneeId.trim() : auth.userId;
  if (assignee !== auth.userId && !auth.can("ticket.assign")) {
    return NextResponse.json({ error: "assignment_forbidden" }, { status: 403 });
  }
  const due = body.dueAt == null || body.dueAt === "" ? null
    : typeof body.dueAt === "string" && !Number.isNaN(Date.parse(body.dueAt))
      ? new Date(body.dueAt).toISOString() : "invalid";
  if (due === "invalid") return NextResponse.json({ error: "invalid_due_date" }, { status: 400 });
  const requestId = typeof body.clientRequestId === "string" && /^[a-zA-Z0-9_-]{8,100}$/.test(body.clientRequestId)
    ? body.clientRequestId : null;
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  try {
    let taskId: string | null = null;
    let created = false;
    await sql.begin(async tx => {
      if (assignee !== auth.userId) {
        const [person] = await tx<{ id: string }[]>`
          SELECT id FROM crm_users WHERE id = ${assignee} AND is_active LIMIT 1
        `;
        if (!person) throw new Error("assignee_not_found");
      }
      const id = randomUUID();
      const rows = await tx<{ id: string }[]>`
        INSERT INTO command_tasks (
          id, brand, title, description, priority, due_at,
          assigned_to, created_by, client_request_id
        ) VALUES (
          ${id}, ${brand}, ${title}, ${description}, ${priority}, ${due},
          ${assignee}, ${auth.userId}, ${requestId}
        ) ON CONFLICT (created_by, client_request_id) DO NOTHING RETURNING id
      `;
      created = rows.length === 1;
      if (!created && requestId) {
        const [prior] = await tx<{ id: string }[]>`
          SELECT id FROM command_tasks WHERE created_by = ${auth.userId}
            AND client_request_id = ${requestId}
        `;
        taskId = prior?.id ?? null;
      } else taskId = rows[0]?.id ?? null;
      if (!taskId) throw new Error("task_insert_failed");
      if (created) await recordCommandEventTx(tx, {
        key: `command.task.created:${taskId}`,
        type: "command.task.created", brand, entityType: "task", entityId: taskId,
        actorId: auth.userId, recipientId: assignee, title: "Neue Aufgabe zugewiesen",
        detail: title, targetTab: "overview", payload: { priority, dueAt: due },
      });
    });
    return NextResponse.json({ taskId, created }, { status: created ? 201 : 200 });
  } catch (error) {
    if (error instanceof Error && error.message === "assignee_not_found") {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error("[COMMAND TASK] create failed", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "task_create_failed" }, { status: 500 });
  }
}
