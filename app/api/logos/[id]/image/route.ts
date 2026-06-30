import { NextResponse } from "next/server";
import { getLogoImage } from "@/lib/logos-store";

export const dynamic = "force-dynamic";

/**
 * Liefert die Bild-Bytes eines Logos. Die Bytes zu einer ID sind unveränderlich
 * (Ändern erzeugt eine neue ID), daher aggressiv cachebar.
 */
export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  const image = await getLogoImage(params.id);
  if (!image) {
    return NextResponse.json({ error: "Nicht gefunden." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.data), {
    status: 200,
    headers: {
      "Content-Type": image.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
