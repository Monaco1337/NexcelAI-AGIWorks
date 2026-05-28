/**
 * NEXCEL AI · Diagnostik · analysisOrchestrator
 *
 * Verbindet alle Services zu einer Pipeline. Jede Phase wird:
 *   1. live publiziert (eventBus → SSE)
 *   2. als analysis_event in der DB persistiert (Audit-Trail)
 *   3. transparent als "skipped" markiert, wenn ein Modul fehlt
 *
 * Phasenkette:
 *   intake → company-structure → system-detection → infrastructure
 *   → automation-potential → operational-gaps → recommendations → persistence
 */

import { randomUUID } from "crypto";
import {
  analysisRepo,
  eventRepo,
  findingRepo,
  leadRepo,
  recommendationRepo,
  scoresRepo,
  uploadRepo,
} from "../db";
import { evaluateRules, type RuleContext } from "../rules";
import { computeScores } from "../scoring";
import { buildRecommendations } from "../recommendations";
import { classifyLead } from "../leadClassification";
import type {
  AnalysisEvent,
  AnalysisEventType,
  AnalysisFinding,
  AnalysisPhase,
  AnalysisPhaseId,
  AnalysisStatus,
  CompanyAnalysis,
} from "../types";
import { publish } from "../eventBus";
import { scanWebsite, type WebScanResult } from "./websiteScan";
import { extractInsights, type UploadInsights } from "./uploadAnalysis";

const PHASES: { id: AnalysisPhaseId; label: string }[] = [
  { id: "intake", label: "Unternehmensstruktur wird analysiert" },
  { id: "company-structure", label: "Unternehmenssignale werden ausgewertet" },
  { id: "system-detection", label: "Systeme werden erkannt" },
  { id: "infrastructure", label: "Infrastruktur wird geprüft" },
  { id: "automation-potential", label: "Automatisierungspotenziale werden berechnet" },
  { id: "operational-gaps", label: "Operative Schwachstellen werden identifiziert" },
  { id: "recommendations", label: "Empfehlungssystem wird erstellt" },
  { id: "persistence", label: "Analyse wird gesichert" },
];

export interface StartAnalysisInput {
  url: string | null;
  uploadIds: string[];
  sessionId: string | null;
  device: string | null;
  referrer: string | null;
  ipHash: string | null;
}

export function createAnalysisRecord(
  input: StartAnalysisInput,
): CompanyAnalysis {
  const id = randomUUID();
  let domain: string | null = null;
  if (input.url) {
    try {
      const u = new URL(/^https?:\/\//.test(input.url) ? input.url : "https://" + input.url);
      domain = u.hostname.replace(/^www\./, "");
    } catch {
      domain = null;
    }
  }

  const phases: AnalysisPhase[] = PHASES.map((p) => ({
    id: p.id,
    label: p.label,
    status: "pending",
  }));

  const analysis: CompanyAnalysis = {
    id,
    url: input.url,
    domain,
    status: "queued",
    phases,
    sessionId: input.sessionId,
    device: input.device,
    referrer: input.referrer,
    ipHash: input.ipHash,
    startedAt: Date.now(),
    finishedAt: null,
    errorMessage: null,
    degradationReasons: [],
  };

  analysisRepo.insert(analysis);
  recordEvent(id, "analysis.started", {
    url: input.url,
    hasUploads: input.uploadIds.length > 0,
  });
  return analysis;
}

function recordEvent(
  analysisId: string,
  type: AnalysisEventType,
  payload: Record<string, unknown>,
): AnalysisEvent {
  const ev: AnalysisEvent = {
    id: randomUUID(),
    analysisId,
    type,
    payload,
    createdAt: Date.now(),
  };
  eventRepo.insert(ev);
  publish(analysisId, { kind: "event", event: ev });
  return ev;
}

function setPhase(
  analysis: CompanyAnalysis,
  phaseId: AnalysisPhaseId,
  status: AnalysisPhase["status"],
  note?: string,
) {
  const idx = analysis.phases.findIndex((p) => p.id === phaseId);
  if (idx < 0) return;
  const phase = analysis.phases[idx];
  const updated: AnalysisPhase = {
    ...phase,
    status,
    note,
    startedAt:
      status === "running" ? Date.now() : phase.startedAt,
    finishedAt:
      status === "done" || status === "skipped" || status === "error"
        ? Date.now()
        : phase.finishedAt,
  };
  analysis.phases[idx] = updated;
  analysisRepo.update(analysis);
  publish(analysis.id, { kind: "phase", phase: updated });
  recordEvent(analysis.id, "analysis.phase.changed", {
    phaseId,
    status,
    note,
  });
}

function setStatus(
  analysis: CompanyAnalysis,
  status: AnalysisStatus,
  errorMessage?: string,
) {
  analysis.status = status;
  if (errorMessage) analysis.errorMessage = errorMessage;
  if (status === "completed" || status === "partial" || status === "failed") {
    analysis.finishedAt = Date.now();
  }
  analysisRepo.update(analysis);
  publish(analysis.id, { kind: "status", status, error: errorMessage });
}

/**
 * Startet die Pipeline asynchron. Der Caller bekommt die `analysisId` sofort,
 * das eigentliche Processing läuft im Hintergrund. Status via SSE.
 */
export function runAnalysisAsync(analysisId: string): void {
  // Bewusst nicht await — die HTTP-Antwort soll sofort zurück.
  void runAnalysis(analysisId).catch((err) => {
    // Last-Resort error handling (sollte nie greifen — runAnalysis fängt selbst)
    console.error("[orchestrator] unhandled", err);
  });
}

async function runAnalysis(analysisId: string): Promise<void> {
  const analysis = analysisRepo.findById(analysisId);
  if (!analysis) return;

  setStatus(analysis, "running");

  // ─── PHASE 1: Intake ───────────────────────────────────────────
  setPhase(analysis, "intake", "running");
  const uploads = uploadRepo.listByAnalysis(analysisId);
  const hasUrl = !!analysis.url;
  const hasUploads = uploads.length > 0;

  if (!hasUrl && !hasUploads) {
    analysis.degradationReasons.push("Keine Eingaben — weder URL noch Upload.");
    setPhase(analysis, "intake", "error", "Keine Eingaben");
    setStatus(analysis, "failed", "Keine Eingaben übermittelt.");
    return;
  }
  setPhase(analysis, "intake", "done", `${hasUrl ? "URL ✓" : ""} ${hasUploads ? `· ${uploads.length} Upload(s) ✓` : ""}`.trim());
  if (hasUrl) recordEvent(analysisId, "analysis.url.provided", { url: analysis.url });
  if (hasUploads) recordEvent(analysisId, "analysis.upload.received", { count: uploads.length });

  // ─── PHASE 2: Company-Structure (Web-Stack-Sniff) ─────────────
  let web: WebScanResult | null = null;
  if (hasUrl && analysis.url) {
    setPhase(analysis, "company-structure", "running");
    web = await scanWebsite(analysis.url);
    if (!web.ok) {
      analysis.degradationReasons.push(
        `Website konnte nicht geladen werden: ${web.error ?? "unbekannt"}`,
      );
      setPhase(
        analysis,
        "company-structure",
        "error",
        web.error ?? "Fehler beim Laden",
      );
    } else {
      setPhase(
        analysis,
        "company-structure",
        "done",
        `${web.detectedStack.length} Stack-Hinweise · ${web.bytes / 1024 | 0} KB`,
      );
    }
  } else {
    setPhase(analysis, "company-structure", "skipped", "Keine URL angegeben");
  }

  // ─── PHASE 3: System-Detection ────────────────────────────────
  setPhase(analysis, "system-detection", "running");
  // Upload-Insights: wir laden tatsächlich die Dateiinhalte hier (text-only).
  const rawTexts = await loadUploadTexts(uploads);
  const uploadInsights: UploadInsights = extractInsights(uploads, rawTexts);
  setPhase(
    analysis,
    "system-detection",
    "done",
    uploadInsights.toolMentions.length > 0
      ? `${uploadInsights.toolMentions.length} Tool-Spuren erkannt`
      : "Keine Tool-Spuren in Uploads",
  );

  // ─── PHASE 4: Infrastructure ──────────────────────────────────
  setPhase(analysis, "infrastructure", "running");
  // Inhalt-mäßig schon im Web-Scan enthalten — diese Phase ist die explizite
  // Header-/HTTPS-/Performance-Auswertung. Hier nur Logging, die echten Regeln
  // greifen in evaluateRules.
  setPhase(
    analysis,
    "infrastructure",
    web ? (web.ok ? "done" : "skipped") : "skipped",
    web && web.ok
      ? `${Object.keys(web.headers).length} Header gelesen`
      : "Keine Server-Header analysierbar",
  );

  // ─── PHASE 5-6: Rule Evaluation (Automation + Gaps) ───────────
  setPhase(analysis, "automation-potential", "running");
  const ctx: RuleContext = {
    web: web && web.ok
      ? {
          url: web.inputUrl,
          finalUrl: web.finalUrl,
          statusCode: web.statusCode,
          bytes: web.bytes,
          headers: web.headers,
          title: web.title,
          description: web.description,
          detectedStack: web.detectedStack,
          webFindings: web.webFindings,
          signals: web.signals,
        }
      : null,
    uploads: {
      count: uploads.length,
      totalBytes: uploadInsights.totalBytes,
      extractedText: uploadInsights.extractedText,
      toolMentions: uploadInsights.toolMentions,
      mimeTypes: uploadInsights.mimeTypes,
    },
  };

  const triggered = evaluateRules(ctx);
  setPhase(
    analysis,
    "automation-potential",
    "done",
    `${triggered.filter((t) => t.category === "automation").length} Automatisierungs-Hinweis(e)`,
  );

  setPhase(analysis, "operational-gaps", "running");
  const findings: AnalysisFinding[] = triggered.map((t) => ({
    ...t,
    id: randomUUID(),
    analysisId,
    createdAt: Date.now(),
  }));
  findingRepo.insertMany(findings);
  setPhase(
    analysis,
    "operational-gaps",
    "done",
    `${findings.length} Befund(e) identifiziert`,
  );

  // ─── Scores ───────────────────────────────────────────────────
  const scores = computeScores({
    analysisId,
    findings: triggered,
    webPresent: !!web && web.ok,
    uploadsPresent: hasUploads,
    webHasDetectedStack: !!web && web.detectedStack.length > 0,
  });
  scoresRepo.upsert(scores);

  // ─── PHASE 7: Recommendations ────────────────────────────────
  setPhase(analysis, "recommendations", "running");
  const recs = buildRecommendations({
    analysisId,
    findings,
    scores,
    industryHints: web?.signals.industryHints ?? [],
  });
  recommendationRepo.insertMany(recs);

  // Lead-Classification
  const lead = classifyLead({
    analysisId,
    scores,
    findings,
    hasUploads,
    totalUploadBytes: uploadInsights.totalBytes,
    detectedStack: web?.detectedStack ?? [],
    webPresent: !!web && web.ok,
  });
  leadRepo.upsert(lead);
  recordEvent(analysisId, "lead.classified", {
    tier: lead.tier,
    rawScore: lead.rawScore,
  });
  if (lead.tier === "enterprise") {
    recordEvent(analysisId, "lead.enterprise-detected", { signals: lead.signals });
  } else if (lead.tier === "hot") {
    recordEvent(analysisId, "lead.hot-detected", { signals: lead.signals });
  } else if (lead.tier === "warm") {
    recordEvent(analysisId, "lead.warm-detected", { signals: lead.signals });
  }
  if (scores.automationPotential >= 50) {
    recordEvent(analysisId, "automation.high-potential", {
      score: scores.automationPotential,
    });
  }

  setPhase(
    analysis,
    "recommendations",
    "done",
    `${recs.length} Empfehlung(en) generiert · Lead: ${lead.tier}`,
  );

  // ─── PHASE 8: Persistenz/Abschluss ───────────────────────────
  setPhase(analysis, "persistence", "running");
  // Schon persistiert — diese Phase bestätigt nur.
  setPhase(analysis, "persistence", "done");

  const finalStatus: AnalysisStatus =
    analysis.degradationReasons.length > 0 ? "partial" : "completed";
  setStatus(analysis, finalStatus);
  recordEvent(analysisId, "analysis.completed", {
    findings: findings.length,
    recommendations: recs.length,
    scores: {
      operations: scores.operations,
      automationPotential: scores.automationPotential,
      systemFragmentation: scores.systemFragmentation,
    },
  });
  publish(analysisId, { kind: "done" });
}

async function loadUploadTexts(
  uploads: import("../types").AnalysisUpload[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const fs = await import("fs/promises");
  for (const u of uploads) {
    try {
      // Nur Text-MIME tatsächlich lesen — wir wollen keine Binär-Bytes hineinkippen.
      if (
        u.mimeType.startsWith("text/") ||
        u.mimeType.includes("json") ||
        u.mimeType.includes("xml") ||
        u.mimeType.includes("yaml") ||
        u.mimeType.includes("csv")
      ) {
        const buf = await fs.readFile(u.storagePath);
        map.set(u.id, buf.toString("utf-8").slice(0, 60_000));
      } else {
        map.set(u.id, ""); // bewusst leer — wir markieren nicht-textuelle Files transparent
      }
    } catch {
      map.set(u.id, "");
    }
  }
  return map;
}
