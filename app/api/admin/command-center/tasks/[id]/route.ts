import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { db } from "@/lib/pg";
import { recordCommandEventTx } from "@/lib/command-center/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("ticket.update");
  if (!gate.ok) return gate.response;
  if (request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) {
    return NextResponse.json({ error: "origin_forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.version !== "number" || !Number.isSafeInteger(body.version)
      || !["open", "in_progress", "done", "cancelled"].includes(body.status)) {
    return NextResponse.json({ error: "status_and_version_required" }, { status: 400 });
  }
  const auth = gate.auth;
  const privileged = auth.role === "owner" || auth.role === "admin";
  const sql = await db();
  if (!sql) return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  try {
    const updated = await sql.begin(async tx => {
      const [current] = await tx<{
        brand: "nexcel" | "agiworks"; title: string; version: number;
        created_by: string; assigned_to: string | null; status: string;
      }[]>`SELECT brand, title, version, created_by, assigned_to, status
        FROM command_tasks WHERE id = ${id} AND deleted_at IS NULL FOR UPDATE`;
      if (!current) return "missing";
      if (!privileged && (auth.brand !== current.brand ||
          (current.created_by !== auth.userId && current.assigned_to !== auth.userId))) return "forbidden";
      if (current.version !== body.version) return "conflict";
      if (current.status === body.status) return "unchanged";
      await tx`UPDATE command_tasks SET status = ${body.status}, version = version + 1,
        updated_at = NOW() WHERE id = ${id}`;
      await recordCommandEventTx(tx, {
        key: `command.task.status:${id}:${current.version + 1}`,
        type: "command.task.status_changed", brand: current.brand,
        entityType: "task", entityId: id, actorId: auth.userId,
        recipientId: current.created_by, targetTab: "overview",
        title: "Aufgabenstatus aktualisiert", detail: current.title,
        payload: { from: current.status, to: body.status },
      });
      return "updated";
    });
    if (updated === "missing") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (updated === "forbidden") return NextResponse.json({ error: "forbidden" }, { status: 403 });
    if (updated === "conflict") return NextResponse.json({ error: "version_conflict" }, { status: 409 });
    return NextResponse.json({ updated: updated === "updated" });
  } catch (error) {
    console.error("[COMMAND TASK] update failed", error instanceof Error ? error.name : "error");
    return NextResponse.json({ error: "task_update_failed" }, { status: 500 });
  }
}
