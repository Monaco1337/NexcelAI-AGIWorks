import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { deleteAsset, loadAssetBytes } from "@/lib/sales/assetsStore";

export const runtime = "nodejs";

export async function GET(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.read");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  const data = await loadAssetBytes(id);
  if (!data) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return new NextResponse(new Uint8Array(data.bytes), {
    headers: {
      "content-type": data.mime,
      "cache-control": "private, max-age=60",
    },
  });
}

export async function DELETE(_: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const { id } = await ctx.params;
  await deleteAsset(id);
  return NextResponse.json({ ok: true });
}
