/**
 * POST /api/diagnostics/upload
 *
 * Empfängt EINE Datei (multipart/form-data, field: "file") und legt sie
 * gegen eine bestehende analysisId ab. Vor dem Aufruf muss POST /analyze
 * gelaufen sein, um die analysisId zu bekommen.
 *
 * Wir limitieren bewusst: max 8 MB pro Datei, max 10 Dateien pro Analyse.
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID, createHash } from "crypto";
import fs from "fs/promises";
import path from "path";
import {
  analysisRepo,
  uploadRepo,
} from "@/lib/diagnostics/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const MAX_FILES_PER_ANALYSIS = 10;

const IS_SERVERLESS =
  process.env.VERCEL === "1" || !!process.env.VERCEL_ENV;
const UPLOAD_DIR = IS_SERVERLESS
  ? "/tmp/nexcel-diagnostics/uploads"
  : path.join(process.cwd(), "data", "diagnostics-uploads");

async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export async function POST(req: NextRequest) {
  const analysisId = req.nextUrl.searchParams.get("analysisId");
  if (!analysisId) {
    return NextResponse.json(
      { error: "Missing analysisId" },
      { status: 400 },
    );
  }
  const analysis = analysisRepo.findById(analysisId);
  if (!analysis) {
    return NextResponse.json(
      { error: "Analyse nicht gefunden" },
      { status: 404 },
    );
  }
  if (analysis.status !== "queued") {
    return NextResponse.json(
      { error: "Analyse hat bereits begonnen — Uploads müssen vorher erfolgen." },
      { status: 409 },
    );
  }

  const existing = uploadRepo.listByAnalysis(analysisId);
  if (existing.length >= MAX_FILES_PER_ANALYSIS) {
    return NextResponse.json(
      { error: `Maximal ${MAX_FILES_PER_ANALYSIS} Dateien pro Analyse.` },
      { status: 413 },
    );
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Ungültiges Formular." }, { status: 400 });
  }
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Keine Datei übermittelt." }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `Datei zu groß. Maximum ${MAX_FILE_BYTES / 1024 / 1024} MB.` },
      { status: 413 },
    );
  }

  await ensureUploadDir();
  const id = randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 200);
  const storagePath = path.join(UPLOAD_DIR, `${id}__${safeName}`);

  const arrayBuf = await file.arrayBuffer();
  const buf = Buffer.from(arrayBuf);
  const sha256 = createHash("sha256").update(buf).digest("hex");
  await fs.writeFile(storagePath, buf);

  // Text-Preview nur wenn MIME klar text/* ist — sonst transparent leer.
  let preview: string | null = null;
  if (
    file.type.startsWith("text/") ||
    file.type.includes("json") ||
    file.type.includes("xml") ||
    file.type.includes("yaml") ||
    file.type.includes("csv")
  ) {
    preview = buf.toString("utf-8").slice(0, 500);
  }

  uploadRepo.insert({
    id,
    analysisId,
    filename: file.name,
    mimeType: file.type || "application/octet-stream",
    bytes: file.size,
    sha256,
    storagePath,
    extractedTextPreview: preview,
    createdAt: Date.now(),
  });

  return NextResponse.json({
    ok: true,
    uploadId: id,
    filename: file.name,
    bytes: file.size,
    mimeType: file.type,
  });
}

export async function GET(req: NextRequest) {
  const analysisId = req.nextUrl.searchParams.get("analysisId");
  if (!analysisId)
    return NextResponse.json({ error: "Missing analysisId" }, { status: 400 });
  const uploads = uploadRepo.listByAnalysis(analysisId);
  return NextResponse.json({
    uploads: uploads.map((u) => ({
      id: u.id,
      filename: u.filename,
      mimeType: u.mimeType,
      bytes: u.bytes,
    })),
  });
}
