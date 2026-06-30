import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { isDbEnabled } from "@/lib/pg";
import { updateLogo, deleteLogo, type LogoBrand } from "@/lib/logos-store";

export const dynamic = "force-dynamic";

async function requireAdmin() {
  const session = await verifySession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Keine Datenbank verbunden." }, { status: 503 });
  }

  try {
    const body = await request.json();
    const updates: Parameters<typeof updateLogo>[1] = {};
    if (typeof body.name === "string") updates.name = body.name;
    if (typeof body.brand === "string") updates.brand = body.brand as LogoBrand;
    if (typeof body.className === "string") updates.className = body.className;
    if (typeof body.filterStyle === "string") updates.filterStyle = body.filterStyle;
    if (typeof body.active === "boolean") updates.active = body.active;
    if (typeof body.sortOrder === "number") updates.sortOrder = body.sortOrder;

    const logo = await updateLogo(params.id, updates);
    if (!logo) return NextResponse.json({ error: "Logo nicht gefunden." }, { status: 404 });
    return NextResponse.json({ logo });
  } catch (error) {
    console.error("❌ [API/admin/logos/:id] PATCH:", error);
    return NextResponse.json({ error: "Update fehlgeschlagen." }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDbEnabled()) {
    return NextResponse.json({ error: "Keine Datenbank verbunden." }, { status: 503 });
  }

  const ok = await deleteLogo(params.id);
  if (!ok) return NextResponse.json({ error: "Löschen fehlgeschlagen." }, { status: 500 });
  return NextResponse.json({ success: true });
}
