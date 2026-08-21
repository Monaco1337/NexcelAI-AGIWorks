/**
 * Logo-Upload und Auslieferung je Aussteller.
 *  POST  — nimmt PNG oder JPG entgegen (max. 2 MB), speichert es in
 *          `billing_assets` und trägt den Pfad in `billing_issuers.logo_path`.
 *  DELETE — entfernt den Pfad; das Asset selbst bleibt zur Nachvollziehbarkeit
 *          erhalten, wird aber nicht mehr referenziert.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { actorFrom } from "@/lib/audit/auditLog";
import { updateIssuer } from "@/lib/billing/issuersStore";
import { saveLogo } from "@/lib/billing/logoStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg"]);

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  const contentType = req.headers.get("content-type") || "";
  let bytes: Buffer;
  let mimeType: string;

  if (contentType.startsWith("multipart/form-data")) {
    const form = await req.formData();
    const file = form.get("logo");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Datei fehlt (Feld: logo)" }, { status: 400 });
    }
    mimeType = file.type || "";
    bytes = Buffer.from(await file.arrayBuffer());
  } else {
    // Raw-Upload (fetch(body: blob)): mime kommt aus Content-Type.
    mimeType = contentType;
    bytes = Buffer.from(await req.arrayBuffer());
  }

  if (!ALLOWED.has(mimeType)) {
    return NextResponse.json({ error: "Nur PNG oder JPG erlaubt." }, { status: 415 });
  }
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: "Datei ist leer oder größer als 2 MB." }, { status: 413 });
  }

  const asset = await saveLogo(bytes, mimeType);
  const updated = await updateIssuer(id, { logoPath: asset.path }, actorFrom(gate.auth));
  if (!updated) return NextResponse.json({ error: "Aussteller nicht gefunden" }, { status: 404 });
  return NextResponse.json({ issuer: updated, logo: asset });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("billing.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const updated = await updateIssuer(id, { logoPath: null }, actorFrom(gate.auth));
  if (!updated) return NextResponse.json({ error: "Aussteller nicht gefunden" }, { status: 404 });
  return NextResponse.json({ issuer: updated });
}
