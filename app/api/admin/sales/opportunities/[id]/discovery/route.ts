/**
 * Discovery (Bedarfsgespräch) einer Opportunity.
 *
 * Persistiert eine einzige strukturierte „discovery"-Notiz pro
 * Opportunity im vorhandenen `sales_notes`-Store. Dadurch verwenden
 * Solution und Proposal automatisch dieselben Erkenntnisse — ohne
 * ein zweites Datenmodell.
 *
 * GET  → aktuelle DiscoveryData + Completeness-Analyse
 * PUT  → upsert des kompletten Discovery-Snapshots (Autosave-tauglich)
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { getOpportunity } from "@/lib/sales/opportunitiesStore";
import { createNote, listNotes, updateNote } from "@/lib/sales/notesStore";
import { logActivity } from "@/lib/sales/activitiesStore";
import { SalesError } from "@/lib/sales/model";
import {
  analyzeDiscovery,
  coerceDiscovery,
  emptyDiscovery,
  type DiscoveryData,
} from "@/lib/sales/discoveryModel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function findDiscoveryNote(opportunityId: string) {
  const notes = await listNotes("opportunity", opportunityId);
  return notes.find((n) => n.kind === "discovery") ?? null;
}

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const note = await findDiscoveryNote(id);
  const data = note ? coerceDiscovery(note.structured) : emptyDiscovery();
  return NextResponse.json({
    discovery: data,
    analysis: analyzeDiscovery(data),
    noteId: note?.id ?? null,
    updatedAt: note?.updatedAt ?? null,
  });
}

export async function PUT(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;

  const { id } = await ctx.params;
  const opportunity = await getOpportunity(id);
  if (!opportunity) return NextResponse.json({ error: "not_found" }, { status: 404 });

  let body: { discovery?: unknown; summary?: string; silent?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const data: DiscoveryData = coerceDiscovery(body.discovery);
  data.updatedAt = new Date().toISOString();
  const analysis = analyzeDiscovery(data);

  try {
    const existing = await findDiscoveryNote(id);
    const note = existing
      ? await updateNote(existing.id, {
          structured: data as unknown as Record<string, unknown>,
          body:
            typeof body.summary === "string"
              ? body.summary
              : existing.body,
        })
      : await createNote({
          entityType: "opportunity",
          entityId: id,
          kind: "discovery",
          body: typeof body.summary === "string" ? body.summary : "",
          structured: data as unknown as Record<string, unknown>,
          authorId: gate.auth.userId,
        });

    if (!body.silent) {
      await logActivity({
        entityType: "opportunity",
        entityId: id,
        companyId: opportunity.companyId,
        kind: "discovery",
        summary: `Bedarf aktualisiert (${analysis.clarified.length} geklärt / ${analysis.criticalOpen.length} kritisch offen)`,
        payload: {
          clarified: analysis.clarified.length,
          partial: analysis.partial.length,
          open: analysis.open.length,
          criticalOpen: analysis.criticalOpen,
          readyForSolution: analysis.readyForSolution,
        },
        actorId: gate.auth.userId,
        actorEmail: gate.auth.email,
      });
    }

    return NextResponse.json({
      discovery: data,
      analysis,
      noteId: note.id,
      updatedAt: note.updatedAt,
    });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[SALES] Discovery-Update fehlgeschlagen:", error);
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
}
