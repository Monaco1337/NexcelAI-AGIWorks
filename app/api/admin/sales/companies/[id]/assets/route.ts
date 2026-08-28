/**
 * Kundenlogos & andere Referenz-Assets pro Firma.
 * Upload akzeptiert multipart/form-data mit `file` und optional `note`.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { listAssetsForCompany, saveAsset } from "@/lib/sales/assetsStore";
import { SalesError } from "@/lib/sales/model";

export const runtime = "nodejs";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const assets = await listAssetsForCompany(id);
  return NextResponse.json({ assets });
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return NextResponse.json({ error: "multipart_required" }, { status: 415 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file_required" }, { status: 400 });
  }
  const bytes = new Uint8Array(await file.arrayBuffer());

  try {
    const asset = await saveAsset({
      companyId: id,
      kind: (form.get("kind") as string | null) ?? "customer_logo",
      mime: file.type || "application/octet-stream",
      bytes,
      note: (form.get("note") as string | null) ?? "",
      createdBy: gate.auth.userId,
    });
    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    if (error instanceof SalesError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json({ error: "upload_failed" }, { status: 500 });
  }
}
