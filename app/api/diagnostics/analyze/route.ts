/**
 * POST /api/diagnostics/analyze
 *
 * Phase 1: Reservierung (returns analysisId immediately).
 *   Body: { url?: string, sessionId?: string, device?: string, referrer?: string }
 *   → { analysisId }
 *
 * Phase 2: Start (separate Route /start). So können Uploads zwischen Phase 1
 *   und 2 angehängt werden, OHNE dass die Analyse vorher schon läuft.
 *
 * Alternative: Body enthält `start: true` direkt — dann beides in einem Schritt.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  createAnalysisRecord,
  runAnalysisAsync,
} from "@/lib/diagnostics/services/analysisOrchestrator";
import { analysisRepo, uploadRepo } from "@/lib/diagnostics/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface CreateBody {
  url?: string;
  sessionId?: string;
  device?: string;
  referrer?: string;
  start?: boolean;
}

function hashIp(req: NextRequest): string | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  if (!ip) return null;
  return createHash("sha256")
    .update(ip + (process.env.IP_SALT ?? "nexcel-diagnostics"))
    .digest("hex")
    .slice(0, 16);
}

export async function POST(req: NextRequest) {
  let body: CreateBody;
  try {
    body = (await req.json()) as CreateBody;
  } catch {
    return NextResponse.json(
      { error: "Ungültiger Request-Body" },
      { status: 400 },
    );
  }
  const url = body.url?.trim() || null;
  // Mindestens eines von beidem muss kommen — URL ODER Uploads (Uploads ergänzt
  // der Client zwischen create und start). Für den 1-Schritt-Modus (start=true)
  // erlauben wir auch URL-only.
  if (!url) {
    return NextResponse.json(
      { error: "Bitte URL eingeben oder Dateien hochladen." },
      { status: 400 },
    );
  }

  const analysis = createAnalysisRecord({
    url,
    uploadIds: [],
    sessionId: body.sessionId ?? null,
    device: body.device ?? null,
    referrer: body.referrer ?? null,
    ipHash: hashIp(req),
  });

  if (body.start) {
    runAnalysisAsync(analysis.id);
  }

  return NextResponse.json({
    ok: true,
    analysisId: analysis.id,
    status: analysis.status,
  });
}
