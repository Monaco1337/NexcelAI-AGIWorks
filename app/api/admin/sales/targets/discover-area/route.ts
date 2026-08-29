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
import { providerStatus } from "@/lib/sales/targets/providers/registry";
import {
  createAreaScan,
  updateAreaScan,
  getLatestAreaScanForRegion,
} from "@/lib/sales/targets/geocacheStore";
import { newTargetId } from "@/lib/sales/targets/model";

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
  /**
   * Ambient-Mode (Default): wenn für diese Region in den letzten
   * `freshMinutes` Minuten bereits ein erfolgreicher Scan lief, dann
   * KEIN neuer Scan gestartet — die vorhandenen Daten reichen.
   * Set `force: true` um trotzdem neu zu scannen.
   */
  force?: boolean;
  /** Time-To-Live des letzten Scans in Minuten (Default 24 h). */
  freshMinutes?: number;
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

    // ── Freshness-Check ─────────────────────────────────────────────
    // Ambient-Modus: wenn für diese Region bereits ein Scan im
    // TTL-Fenster gelaufen ist, KEIN neuer Scan. Der Client bekommt
    // eine reproduzierbare Antwort mit `skipped: "fresh"` und der
    // ursprünglichen `correlationId` — nichts wird doppelt gemacht.
    const freshMinutes = Math.max(1, Math.min(24 * 60 * 30, Number(body.freshMinutes ?? 24 * 60)));
    const force = Boolean(body.force);
    if (!force) {
      const latest = await getLatestAreaScanForRegion(city, radiusKm);
      if (latest) {
        const ageMin = (Date.now() - new Date(latest.startedAt).getTime()) / 60_000;
        if (ageMin < freshMinutes && latest.discoveredCount > 0) {
          return NextResponse.json({
            correlationId: latest.correlationId,
            skipped: "fresh",
            reason: `Zuletzt vor ${ageMin.toFixed(0)} min gescannt (${latest.discoveredCount} Firmen).`,
            city: center.city,
            center: { lat: center.lat, lng: center.lng, source: center.source },
            radiusKm,
            tileRadiusKm: TILE_RADIUS_KM,
            totalTiles: latest.totalTiles,
            jobIds: latest.jobIds,
            remainingJobIds: [],
            firstResult: null,
            providers: providerStatus(),
            firstProviderError: latest.firstError,
            industryCount: 0,
            estimatedCostCents: 0,
            hint: null,
          });
        }
      }
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

    // AreaScan-Run persistieren, bevor der erste Tile läuft — nach
    // einem Serverneustart können wir daran erkennen, was schon
    // begonnen wurde.
    const areaScanId = newTargetId("area");
    await createAreaScan({
      id: areaScanId,
      correlationId,
      city: center.city,
      country: center.country,
      centerLat: center.lat,
      centerLng: center.lng,
      radiusKm,
      tileRadiusKm: TILE_RADIUS_KM,
      industries: industriesInput.filter(Boolean),
      depth,
      limitPerTile,
      maxTiles,
      totalTiles: limited.length,
      jobIds,
      createdBy: gate.auth.userId,
    });

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

    const providers = providerStatus();
    // AreaScan aktualisieren — beim ersten Tile ist mindestens der
    // initiale Provider-Status und der DiscoveredCount klar.
    await updateAreaScan(areaScanId, {
      discoveredCount: firstResult?.discoveredCount ?? 0,
      providerSummary: {
        providers,
        firstResult: firstResult?.providerLogs ?? [],
      },
      firstError: firstResult?.providerLogs?.find((l) => !l.ok)?.error ?? null,
    });
    return NextResponse.json({
      correlationId,
      areaScanId,
      city: center.city,
      center: { lat: center.lat, lng: center.lng, source: center.source },
      radiusKm,
      tileRadiusKm: TILE_RADIUS_KM,
      totalTiles: limited.length,
      jobIds,
      remainingJobIds: jobIds.slice(1),
      firstResult,
      providers,
      firstProviderError:
        firstResult?.providerLogs?.find((l) => !l.ok)?.error ?? null,
      industryCount: industriesInput.filter((x) => x).length || 1,
      estimatedCostCents: 0,
      hint:
        tiles.length > limited.length
          ? `Region deckt ${tiles.length} Tiles ab — auf ${maxTiles} begrenzt. Radius verkleinern oder erneut ausführen.`
          : null,
    });
  } catch (error) {
    const err = toTargetError(error);
    // eslint-disable-next-line no-console
    console.error(`[TARGETS][${correlationId}] area-scan failed`, err.toJson());
    return NextResponse.json({ ...err.toJson(), correlationId }, { status: err.httpStatus });
  }
}
