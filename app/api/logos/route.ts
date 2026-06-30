import { NextRequest, NextResponse } from "next/server";
import { isDbEnabled } from "@/lib/pg";
import { listLogos, type LogoBrand } from "@/lib/logos-store";

export const dynamic = "force-dynamic";

/**
 * Öffentliche Logo-Liste für den Kunden-Slider.
 * Liefert nur aktive Logos (Metadaten + Bild-URL). Wenn keine DB verbunden
 * ist oder keine Logos existieren, gibt die Komponente clientseitig die
 * fest hinterlegten Standard-Logos aus.
 */
export async function GET(request: NextRequest) {
  if (!isDbEnabled()) {
    return NextResponse.json(
      { logos: [], dbConnected: false },
      { headers: { "Cache-Control": "public, max-age=30, s-maxage=60" } },
    );
  }

  const { searchParams } = new URL(request.url);
  const brandParam = searchParams.get("brand");
  const brand: LogoBrand | undefined =
    brandParam === "nexcel" || brandParam === "agiworks" ? brandParam : undefined;

  const records = await listLogos({ activeOnly: true, brand });
  const logos = records.map((l) => ({
    id: l.id,
    name: l.name,
    src: `/api/logos/${l.id}/image`,
    className: l.className,
    filterStyle: l.filterStyle,
  }));

  return NextResponse.json(
    { logos, dbConnected: true },
    { headers: { "Cache-Control": "public, max-age=30, s-maxage=60, stale-while-revalidate=300" } },
  );
}
