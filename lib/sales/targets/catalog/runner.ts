/**
 * Katalog-Runner: ensure · resume · publish.
 *
 * Der Runner ist bewusst zustandslos. Jeder Aufruf tut ein begrenztes
 * Stück Arbeit und schreibt das Ergebnis nach PostgreSQL. Wird der
 * Prozess mittendrin beendet — Serverless-Timeout, Deploy, Absturz —
 * geht nichts verloren: der nächste Aufruf liest den Fortschritt aus
 * `sales_target_search_jobs` und macht dort weiter.
 *
 * Aufgerufen wird er ausschließlich serverseitig, vom Cron-Tick oder
 * vom Discovery-Worker. Der Browser startet nichts und rechnet nichts.
 */

import { newCorrelationId } from "../errors";
import {
  createSearchJob,
  takeNextSearchJob,
  completeSearchJob,
  failSearchJob,
  reclaimExpiredSearchJobs,
  searchJobProgress,
} from "../store";
import type { SearchJob } from "../model";
import { getConfiguredDiscoveryProviders } from "../providers/registry";
import type { DiscoveryResponse } from "../providers/types";
import { bulkIngestCompanies } from "./bulkIngest";
import { buildSegments, findScope, NRW_SCOPE, type CatalogScope } from "./scope";
import {
  createCatalogRun,
  findActiveCatalogRun,
  findPublishedCatalogRun,
  getCatalogRun,
  markCatalogRunFailed,
  publishCatalogRun,
  updateCatalogRun,
  type CatalogRun,
} from "./catalogStore";
import { evaluateQualityGate } from "./qualityGate";
import { writeAudit, type AuditActor } from "@/lib/audit/auditLog";

/**
 * Der Katalog läuft überwiegend per Cron, also ohne angemeldeten Nutzer.
 * Wird er manuell aus dem Admin ausgelöst, reicht die Nutzer-ID herein.
 */
function systemActor(actorId: string | null): AuditActor {
  return actorId
    ? { id: actorId, email: "admin", role: "admin", kind: "user" }
    : { id: null, email: "system@nexcel", role: "system", kind: "system" };
}

/**
 * Obergrenze je Segment-Query. Gemessen an der dichtesten Kachel
 * (Ruhrgebiet, Achse `shop`): 4.000 Elemente in 10,2 s gegenüber
 * 11.180 Elementen in 11,5 s — die Grenze kostet praktisch keine Zeit,
 * deckelt aber sonst dichte Ballungsräume und erzeugt dort eine
 * systematische Lücke.
 */
const SEGMENT_LIMIT = 12_000;

export interface EnsureResult {
  run: CatalogRun;
  created: boolean;
  segmentsQueued: number;
}

/**
 * Stellt sicher, dass für einen Scope ein Katalog-Run existiert und alle
 * Segmente als Search-Jobs eingereiht sind. Mehrfachaufrufe sind
 * unschädlich: der partielle Unique-Index verhindert doppelte Runs, und
 * Segment-Jobs werden nur angelegt, wenn der Run frisch ist.
 */
export async function ensureCatalogRun(
  scopeKey: string = NRW_SCOPE.key,
  createdBy: string | null = null
): Promise<EnsureResult> {
  const scope = findScope(scopeKey);
  if (!scope) throw new Error(`Unbekannter Katalog-Scope: ${scopeKey}`);

  const existing = await findActiveCatalogRun(scope.key);
  if (existing) {
    return { run: existing, created: false, segmentsQueued: 0 };
  }

  const segments = buildSegments(scope);
  const run = await createCatalogRun({
    correlationId: newCorrelationId("catalog"),
    scopeKey: scope.key,
    label: scope.label,
    country: scope.country,
    region: scope.region,
    bbox: scope.bbox,
    totalSegments: segments.length,
    createdBy,
  });

  // Ein paralleler Aufruf hat den Run bereits samt Jobs angelegt.
  const progress = await searchJobProgress(run.id);
  if (progress.total > 0) {
    return { run, created: false, segmentsQueued: 0 };
  }

  for (const segment of segments) {
    await createSearchJob({
      label: `${scope.label} · ${segment.tagAxis} · r${segment.row}c${segment.col}`,
      city: null,
      region: scope.region,
      country: scope.country,
      centerLat: null,
      centerLng: null,
      radiusKm: 0,
      industries: [],
      categories: [],
      filters: {
        catalogSegment: segment.key,
        bbox: segment.bbox,
        tagAxis: segment.tagAxis,
      } as SearchJob["filters"],
      depth: "STANDARD",
      limitCount: SEGMENT_LIMIT,
      createdBy,
      areaScanId: run.id,
    });
  }

  await writeAudit({
    actor: systemActor(createdBy),
    action: "sales_target_catalog.started",
    entityType: "sales_target_catalog",
    entityId: run.id,
    context: { scopeKey: scope.key, segments: segments.length },
  });

  return { run, created: true, segmentsQueued: segments.length };
}

export interface SegmentOutcome {
  jobId: string;
  segment: string | null;
  ok: boolean;
  discovered: number;
  inserted: number;
  duplicates: number;
  durationMs: number;
  error?: string;
}

/**
 * Arbeitet Segmente ab, bis das Zeitbudget aufgebraucht oder die Queue
 * leer ist. Genau ein Segment pro Schleifendurchlauf, damit ein
 * Abbruch immer nur das laufende Segment kostet.
 */
export async function runCatalogSegments(opts: {
  areaScanId?: string | null;
  maxSegments?: number;
  budgetMs?: number;
}): Promise<{ outcomes: SegmentOutcome[]; reclaimed: number }> {
  const maxSegments = Math.max(1, Math.min(60, opts.maxSegments ?? 3));
  const budgetMs = Math.max(5_000, Math.min(280_000, opts.budgetMs ?? 45_000));
  const startedAt = Date.now();

  // Hängengebliebene Jobs aus abgebrochenen Läufen zurückholen.
  const reclaimed = await reclaimExpiredSearchJobs();
  const outcomes: SegmentOutcome[] = [];

  for (let i = 0; i < maxSegments; i++) {
    if (Date.now() - startedAt > budgetMs) break;
    const job = await takeNextSearchJob({ areaScanId: opts.areaScanId ?? null });
    if (!job) break;
    outcomes.push(await runSegmentJob(job));
  }

  return { outcomes, reclaimed };
}

async function runSegmentJob(job: SearchJob): Promise<SegmentOutcome> {
  const started = Date.now();
  const filters = (job.filters ?? {}) as Record<string, unknown>;
  const segment = (filters.catalogSegment as string | undefined) ?? null;
  const bbox = filters.bbox as { south: number; west: number; north: number; east: number } | undefined;
  const tagAxis = (filters.tagAxis as string | undefined) ?? null;

  try {
    const providers = getConfiguredDiscoveryProviders();
    if (providers.length === 0) {
      throw new Error("Kein Discovery-Provider verfügbar");
    }

    const logs: DiscoveryResponse["providerLogs"] = [];
    const companies: DiscoveryResponse["companies"] = [];
    for (const provider of providers) {
      const res = await provider.discover({
        city: job.city,
        country: job.country,
        centerLat: job.centerLat,
        centerLng: job.centerLng,
        radiusKm: job.radiusKm,
        industries: job.industries,
        categories: job.categories,
        limit: job.limitCount,
        depth: job.depth,
        bbox: bbox ?? null,
        tagAxis,
      });
      logs.push(...res.providerLogs);
      companies.push(...res.companies);
      if (companies.length >= job.limitCount) break;
    }

    // Ein leeres Ergebnis ist bei einem Segment dieser Größe kein
    // gültiger Befund. Overpass antwortet unter Last mit HTTP 200 und
    // leerer Liste statt mit einem Fehler; würden wir das als Erfolg
    // verbuchen, fiele eine ganze Teilregion dauerhaft aus dem Katalog.
    // Solange Versuche übrig sind, geht das Segment mit Backoff zurück
    // in die Queue; erst danach gilt es als endgültig leer.
    const providerError =
      logs.find((l) => !l.ok)?.error ??
      (companies.length === 0 && bbox && job.attempts < job.maxAttempts
        ? "Segment lieferte kein Ergebnis (vermutlich Provider-Drosselung) — erneuter Versuch"
        : null);

    if (companies.length === 0 && providerError) {
      await failSearchJob(job.id, providerError);
      return {
        jobId: job.id,
        segment,
        ok: false,
        discovered: 0,
        inserted: 0,
        duplicates: 0,
        durationMs: Date.now() - started,
        error: providerError,
      };
    }

    const ingest = await bulkIngestCompanies(companies, {
      searchJobId: job.id,
      region: job.region,
    });

    await completeSearchJob(job.id, {
      discoveredCount: ingest.inserted,
      error: null,
    });

    if (job.areaScanId) {
      const progress = await searchJobProgress(job.areaScanId);
      await updateCatalogRun(job.areaScanId, { discoveredCount: progress.discovered });
    }

    return {
      jobId: job.id,
      segment,
      ok: true,
      discovered: ingest.received,
      inserted: ingest.inserted,
      duplicates: ingest.duplicates,
      durationMs: Date.now() - started,
    };
  } catch (err) {
    const message = (err as Error).message || "Segment fehlgeschlagen";
    await failSearchJob(job.id, message);
    return {
      jobId: job.id,
      segment,
      ok: false,
      discovered: 0,
      inserted: 0,
      duplicates: 0,
      durationMs: Date.now() - started,
      error: message,
    };
  }
}

export interface PublishAttempt {
  attempted: boolean;
  published: boolean;
  reason: string;
  report: Awaited<ReturnType<typeof evaluateQualityGate>> | null;
}

/**
 * Prüft das Quality Gate, sobald alle Segmente durch sind, und setzt
 * den Katalog bei Erfolg atomar auf PUBLISHED.
 */
export async function maybePublishCatalog(
  areaScanId: string,
  actorId: string | null = null
): Promise<PublishAttempt> {
  const run = await getCatalogRun(areaScanId);
  if (!run) return { attempted: false, published: false, reason: "Katalog-Run nicht gefunden", report: null };
  if (run.publishState !== "DRAFT") {
    return { attempted: false, published: false, reason: `Bereits ${run.publishState}`, report: null };
  }

  const progress = await searchJobProgress(areaScanId);
  const open = progress.queued + progress.running;
  if (open > 0) {
    return {
      attempted: false,
      published: false,
      reason: `${open} von ${progress.total} Segmenten offen`,
      report: null,
    };
  }

  const report = await evaluateQualityGate(run.bbox);
  const reportJson = JSON.parse(JSON.stringify(report)) as Record<string, unknown>;

  if (!report.passed) {
    await updateCatalogRun(areaScanId, {
      qualityReport: reportJson,
      targetCount: report.totalCompanies,
    });
    const failed = report.checks.filter((c) => !c.passed).map((c) => c.label);
    // Alle Segmente durch, aber Gate nicht bestanden: der Run bleibt
    // DRAFT, damit ein weiterer Durchlauf (erneutes ensure) nachlegen
    // kann, statt den Katalog dauerhaft als kaputt zu markieren.
    return {
      attempted: true,
      published: false,
      reason: `Quality Gate nicht bestanden: ${failed.join(", ")}`,
      report,
    };
  }

  const ok = await publishCatalogRun(areaScanId, reportJson, report.totalCompanies);
  if (ok) {
    await writeAudit({
      actor: systemActor(actorId),
      action: "sales_target_catalog.published",
      entityType: "sales_target_catalog",
      entityId: areaScanId,
      context: {
        scopeKey: run.scopeKey,
        totalCompanies: report.totalCompanies,
        checks: report.checks.map((c) => ({ key: c.key, actual: c.actual, required: c.required })),
      },
    });
  }
  return {
    attempted: true,
    published: ok,
    reason: ok ? "Katalog veröffentlicht" : "Bereits durch anderen Lauf veröffentlicht",
    report,
  };
}

export async function markCatalogFailed(areaScanId: string, reason: string): Promise<void> {
  await markCatalogRunFailed(areaScanId, { failedAt: new Date().toISOString(), reason });
}

/** Kompakter Zustand für UI und Cron-Antwort. */
export async function catalogStatus(scopeKey: string = NRW_SCOPE.key): Promise<{
  scope: CatalogScope | null;
  run: CatalogRun | null;
  published: CatalogRun | null;
  progress: Awaited<ReturnType<typeof searchJobProgress>> | null;
}> {
  const scope = findScope(scopeKey);
  const run = await findActiveCatalogRun(scopeKey);
  const published = await findPublishedCatalogRun(scopeKey);
  const progress = run ? await searchJobProgress(run.id) : null;
  return { scope, run, published, progress };
}
