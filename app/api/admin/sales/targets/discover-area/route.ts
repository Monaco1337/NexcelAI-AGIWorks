/**
 * Area-Discovery: kachelt einen Kreisradius (bis 250 km) in Sub-Tiles
 * (Google Places kann max. 50 km pro Query) und legt für jede
 * Tile × Branche einen `queued` Search-Job an.
 *
 * POST /api/admin/sales/targets/discover-area
 *   body: {
 *     city:          string,
 *     radiusKm:      number,          // bis 250
 *     industries?:   string[],
 *     depth?:        "QUICK" | "STANDARD" | "DEEP",
 *     maxTiles?:     number,          // Budget-Cap (Default 60)
 *     limitPerTile?: number,          // Places pro Tile (Default 50)
 *   }
 *
 * Der erste Job wird synchron ausgeführt, damit die UI sofort Ergebnisse
 * sieht. Die restlichen Job-IDs kommen als Queue zurück; der Client
 * arbeitet sie parallel über `POST /area-jobs/[id]/run` ab und pollt
 * `GET /area-status?ids=…` für den Fortschritt.
 */

import { NextResponse, type NextRequest } from "next/server";
import { authorize } from "@/lib/auth/authorize";
import { createSearchJob, getSearchJob } from "@/lib/sales/targets/store";
import { runSearchJob } from "@/lib/sales/targets/pipeline";
import { geocodeCity, tileArea } from "@/lib/sales/targets/geocode";
import { newCorrelationId, toTargetError, TargetError } from "@/lib/sales/targets/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const HARD_TILE_CAP = 120;
const HARD_RADIUS_CAP_KM = 250;
const TILE_RADIUS_KM = 25;

interface Body {
  city?: string;
  radiusKm?: number;
  industries?: string[];
  depth?: "QUICK" | "STANDARD" | "DEEP";
  maxTiles?: number;
  limitPerTile?: number;
}

export async function POST(request: NextRequest) {
  const gate = await authorize("sales.manage");
  if (!gate.ok) return gate.response;
  const correlationId = newCorrelationId("area");

  try {
    const body = (await request.json().catch(() => ({}))) as Body;
    const city = body.city?.trim();
    if (!city) throw new TargetError("VALIDATION_FAILED", "city ist erforderlich");
    const radiusKm = Math.max(1, Math.min(HARD_RADIUS_CAP_KM, Number(body.radiusKm ?? 25)));

    const center = await geocodeCity(city);
    if (!center) {
      throw new TargetError("VALIDATION_FAILED", `Stadt „${city}“ konnte nicht geocodiert werden`);
    }

    const tiles = tileArea({ lat: center.lat, lng: center.lng }, radiusKm, TILE_RADIUS_KM);
    const maxTiles = Math.min(HARD_TILE_CAP, Math.max(1, Number(body.maxTiles ?? 60)));
    const limited = tiles.slice(0, maxTiles);
    const limitPerTile = Math.max(5, Math.min(100, Number(body.limitPerTile ?? 50)));
    const depth = body.depth ?? "STANDARD";
    const industriesInput = Array.isArray(body.industries) && body.industries.length > 0 ? body.industries : [""];

    const jobIds: string[] = [];
    for (let i = 0; i < limited.length; i++) {
      const tile = limited[i];
      for (const industry of industriesInput) {
        const job = await createSearchJob({
          label: `Area · ${center.city} · ${industry || "alle"} · Tile ${i + 1}/${limited.length}`,
          city: center.city,
          country: center.country,
          centerLat: tile.centerLat,
          centerLng: tile.centerLng,
          radiusKm: tile.radiusKm,
          industries: industry ? [industry] : [],
          depth,
          limitCount: limitPerTile,
          providerPreferences: { source: "area-scan", correlationId },
          createdBy: gate.auth.userId,
        });
        jobIds.push(job.id);
      }
    }

    // Ersten Job direkt hier abarbeiten, damit die UI sofort etwas sieht.
    let firstResult: Awaited<ReturnType<typeof runSearchJob>> | null = null;
    if (jobIds.length > 0) {
      const first = await getSearchJob(jobIds[0]);
      if (first) {
        try {
          firstResult = await runSearchJob(first);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[TARGETS][${correlationId}] initial tile run failed`, err);
        }
      }
    }

    return NextResponse.json({
      correlationId,
      city: center.city,
      center: { lat: center.lat, lng: center.lng, source: center.source },
      radiusKm,
      tileRadiusKm: TILE_RADIUS_KM,
      totalTiles: limited.length,
      jobIds,
      remainingJobIds: jobIds.slice(1),
      firstResult,
      industryCount: industriesInput.filter((x) => x).length || 1,
      estimatedCostCents: limited.length * industriesInput.length * limitPerTile * 3, // ~ Google Places
      hint:
        tiles.length > limited.length
          ? `Region deckt ${tiles.length} Tiles ab — auf ${maxTiles} begrenzt (Budget). Radius verkleinern oder Budget anheben.`
          : null,
    });
  } catch (error) {
    const err = toTargetError(error);
    // eslint-disable-next-line no-console
    console.error(`[TARGETS][${correlationId}] area-scan failed`, err.toJson());
    return NextResponse.json({ ...err.toJson(), correlationId }, { status: err.httpStatus });
  }
}
