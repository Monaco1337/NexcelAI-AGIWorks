/**
 * Konvertiere einen Zielkunden zu einer CRM-Firma (`sales_companies`).
 *
 * POST /api/admin/sales/targets/[id]/convert
 *   body: { classification?: "A"|"B"|"C"|"D", source?: string }
 *
 * Legt einen sales_companies-Datensatz mit `qualifiziert` an und
 * setzt `linked_sales_company_id` am Ziel. Idempotent: existiert bereits
 * eine verknüpfte Firma, wird sie zurückgegeben.
 */

import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/pg";
import { authorize } from "@/lib/auth/authorize";
import { findTargetById, updateTarget, recordActivity } from "@/lib/sales/targets/store";
import { serviceCreateCompany } from "@/lib/sales/service";
import { getCompany } from "@/lib/sales/companiesStore";
import { toTargetError } from "@/lib/sales/targets/errors";
import { domainFromUrl } from "@/lib/sales/targets/websiteAudit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Dedup-Suche gegen bestehende CRM-Firmen bevor eine neue angelegt wird.
 * Wir prüfen in dieser Reihenfolge:
 *  1. Bereits verlinkte CRM-Firma (idempotent)
 *  2. Gleiche Domain
 *  3. Gleicher Firmenname (case-insensitive) und gleiche Stadt
 */
async function findExistingSalesCompany(target: {
  name: string;
  website: string | null;
  city: string | null;
}): Promise<string | null> {
  const sql = await db();
  if (!sql) return null;
  const domain = domainFromUrl(target.website);
  if (domain) {
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM sales_companies
      WHERE deleted_at IS NULL AND website ILIKE ${`%${domain}%`}
      ORDER BY updated_at DESC LIMIT 1
    `;
    if (rows[0]) return rows[0].id;
  }
  if (target.name && target.city) {
    const rows = await sql<{ id: string }[]>`
      SELECT id FROM sales_companies
      WHERE deleted_at IS NULL
        AND LOWER(TRIM(name)) = LOWER(TRIM(${target.name}))
        AND LOWER(COALESCE(city, '')) = LOWER(COALESCE(${target.city}, ''))
      ORDER BY updated_at DESC LIMIT 1
    `;
    if (rows[0]) return rows[0].id;
  }
  return null;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  try {
    const { id } = await ctx.params;
    const target = await findTargetById(id);
    if (!target) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

    let body: { classification?: "A" | "B" | "C" | "D"; source?: string; forceCreate?: boolean } = {};
    try {
      body = (await request.json()) as typeof body;
    } catch {
      /* ok */
    }

    // 1) Bereits verlinkt?
    if (target.linkedSalesCompanyId) {
      const existing = await getCompany(target.linkedSalesCompanyId);
      return NextResponse.json({ company: existing, alreadyLinked: true, reason: "linked" });
    }

    // 2) Dedup: existiert bereits ein passender CRM-Datensatz?
    if (!body.forceCreate) {
      const existingId = await findExistingSalesCompany({
        name: target.name,
        website: target.website,
        city: target.city,
      });
      if (existingId) {
        const existing = await getCompany(existingId);
        await updateTarget(id, { linkedSalesCompanyId: existingId, updatedBy: gate.auth.userId });
        await recordActivity({
          targetId: id,
          kind: "linked_to_existing_crm",
          summary: `Mit bestehender CRM-Firma verlinkt: ${existing?.name ?? existingId}`,
          payload: { salesCompanyId: existingId, dedupPath: "domain-or-name-city" },
          actorId: gate.auth.userId,
          actorEmail: gate.auth.user?.email ?? null,
        });
        return NextResponse.json({ company: existing, alreadyLinked: true, reason: "dedup-match" });
      }
    }

    const company = await serviceCreateCompany(gate.auth, {
      name: target.name,
      website: target.website ?? undefined,
      industry: target.industry ?? undefined,
      city: target.city ?? undefined,
      country: target.country ?? "DE",
      source: body.source ?? "Zielkunden-Intelligence",
      classification: body.classification ?? "A",
      status: "qualifiziert",
      notes: target.description ?? "",
    });

    await updateTarget(id, { linkedSalesCompanyId: company.id, updatedBy: gate.auth.userId });
    await recordActivity({
      targetId: id,
      kind: "converted_to_crm",
      summary: `In CRM übernommen: ${company.name}`,
      payload: { salesCompanyId: company.id },
      actorId: gate.auth.userId,
      actorEmail: gate.auth.user?.email ?? null,
    });

    return NextResponse.json({ company }, { status: 201 });
  } catch (error) {
    const err = toTargetError(error);
    return NextResponse.json(err.toJson(), { status: err.httpStatus });
  }
}
