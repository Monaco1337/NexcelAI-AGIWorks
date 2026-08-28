import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { createNote, listNotes } from "@/lib/sales/notesStore";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const notes = await listNotes("opportunity", id);
  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  try {
    const note = await createNote({
      entityType: "opportunity",
      entityId: id,
      kind: body.kind ?? "internal",
      body: body.body ?? "",
      structured: body.structured ?? {},
      authorId: gate.auth.userId,
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
