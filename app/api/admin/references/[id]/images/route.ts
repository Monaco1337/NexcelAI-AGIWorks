import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getReferenceImages,
  addReferenceImage,
} from "@/lib/references-store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const images = await getReferenceImages(params.id);
  return NextResponse.json({ images });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const alt = (formData.get("alt") as string) || "";
    const sortOrder = parseInt((formData.get("sortOrder") as string) || "0", 10);

    if (!file) return NextResponse.json({ error: "Keine Datei" }, { status: 400 });

    const id = `ri_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const contentType = file.type || "image/png";

    await addReferenceImage(id, params.id, buffer, contentType, alt, sortOrder);
    return NextResponse.json({
      id,
      url: `/api/admin/references/${params.id}/images/${id}`,
      alt,
      sortOrder,
    });
  } catch (err) {
    console.error("[API] POST images:", err);
    return NextResponse.json({ error: "Upload fehlgeschlagen" }, { status: 500 });
  }
}
