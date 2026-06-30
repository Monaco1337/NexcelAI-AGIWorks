import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { isDbEnabled } from "@/lib/pg";
import { listLogos, createLogo, type LogoBrand } from "@/lib/logos-store";

export const dynamic = "force-dynamic";

const MAX_BYTES = 3 * 1024 * 1024; // 3 MB pro Logo
const ALLOWED = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/gif"];

async function requireAdmin() {
  const session = await verifySession();
  if (!session || session.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbEnabled()) {
    return NextResponse.json(
      { logos: [], dbConnected: false, message: "Keine Datenbank verbunden." },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  const logos = await listLogos();
  return NextResponse.json(
    { logos, dbConnected: true },
    { headers: { "Cache-Control": "no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDbEnabled()) {
    return NextResponse.json(
      { error: "Keine Datenbank verbunden. Bitte zuerst Vercel Postgres einrichten." },
      { status: 503 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
    }
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json(
        { error: `Dateityp nicht erlaubt (${file.type || "unbekannt"}). Erlaubt: PNG, JPG, WEBP, SVG, GIF.` },
        { status: 415 },
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: `Datei zu groß (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximal 3 MB.` },
        { status: 413 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name =
      (form.get("name") as string | null)?.trim() ||
      file.name.replace(/\.[^.]+$/, "") ||
      "Logo";
    const brand = ((form.get("brand") as string | null) || "all") as LogoBrand;
    const className = (form.get("className") as string | null)?.trim() || undefined;
    const filterStyle = (form.get("filterStyle") as string | null)?.trim() || undefined;

    const logo = await createLogo({
      name,
      brand,
      image: buffer,
      contentType: file.type,
      className,
      filterStyle,
    });

    if (!logo) {
      return NextResponse.json({ error: "Speichern fehlgeschlagen." }, { status: 500 });
    }

    return NextResponse.json({ logo }, { status: 201 });
  } catch (error) {
    console.error("❌ [API/admin/logos] POST:", error);
    return NextResponse.json({ error: "Upload fehlgeschlagen." }, { status: 500 });
  }
}
