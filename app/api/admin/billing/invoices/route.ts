/**
 * Rechnungsliste und Anlage.
 *
 * GET  /api/admin/billing/invoices   — Filter, Suche, Cursor
 * POST /api/admin/billing/invoices   — neuer Entwurf
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize, requestMeta } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import {
  createInvoiceDraft,
  InvoiceError,
  isInvoiceStatus,
  listInvoices,
  type InvoiceFilter,
} from "@/lib/billing/invoicesStore";
import type { InvoiceItemInput, InvoiceStatus } from "@/lib/billing/model";
import { createDraftFromProject, createDraftForNextInQueue } from "@/lib/billing/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function multi(params: URLSearchParams, key: string): string[] | undefined {
  const all = params
    .getAll(key)
    .flatMap((v) => v.split(","))
    .map((v) => v.trim())
    .filter(Boolean);
  return all.length > 0 ? all : undefined;
}

export async function GET(request: NextRequest) {
  const gate = await authorize("billing.read");
  if (!gate.ok) return gate.response;

  const params = request.nextUrl.searchParams;
  const filter: InvoiceFilter = {
    issuerId: params.get("issuerId") ?? undefined,
    projectId:
      params.get("projectId") === "none" ? null : params.get("projectId") ?? undefined,
    customerId: params.get("customerId") ?? undefined,
    status: multi(params, "status")?.filter(isInvoiceStatus) as InvoiceStatus[] | undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    search: params.get("q") ?? undefined,
    limit: Number.parseInt(params.get("limit") ?? "50", 10) || 50,
    cursor: params.get("cursor") ?? undefined,
  };

  try {
    const page = await listInvoices(filter);
    return NextResponse.json(page);
  } catch (error) {
    console.error("[BILLING] Liste fehlgeschlagen:", error);
    return NextResponse.json({ error: "list_failed" }, { status: 500 });
  }
}

interface CreateBody {
  source?: "project" | "queue" | "manual";
  projectId?: string;
  issuerId?: string;
  customerId?: string;
  items?: InvoiceItemInput[];
  invoiceDate?: string;
  dueDate?: string;
  servicePeriod?: { start: string; end: string };
  currency?: string;
  paymentTermsDays?: number;
  texts?: Record<string, string>;
  references?: Record<string, string | null>;
}

export async function POST(request: NextRequest) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const actor = actorFrom(gate.auth);
  const meta = await requestMeta();

  try {
    let invoice;
    if (body.source === "project") {
      if (!body.projectId) throw new InvoiceError("Projekt-ID fehlt.");
      invoice = await createDraftFromProject(
        body.projectId,
        actor,
        { invoiceDate: body.invoiceDate, overridePeriod: body.servicePeriod },
        meta
      );
    } else if (body.source === "queue") {
      invoice = await createDraftForNextInQueue(actor, meta);
    } else {
      if (!body.issuerId) throw new InvoiceError("Aussteller fehlt.");
      if (!Array.isArray(body.items) || body.items.length === 0) {
        throw new InvoiceError("Mindestens eine Position ist erforderlich.");
      }
      invoice = await createInvoiceDraft(
        {
          issuerId: body.issuerId,
          customerId: body.customerId ?? null,
          projectId: body.projectId ?? null,
          invoiceDate: body.invoiceDate,
          dueDate: body.dueDate,
          servicePeriod: body.servicePeriod,
          currency: body.currency,
          paymentTermsDays: body.paymentTermsDays,
          texts: body.texts,
          references: body.references,
          items: body.items,
        },
        actor,
        meta
      );
    }
    if (!invoice) {
      return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
    }
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error) {
    if (error instanceof InvoiceError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    console.error("[BILLING] Anlage fehlgeschlagen:", error);
    return NextResponse.json({ error: "create_failed" }, { status: 500 });
  }
}
