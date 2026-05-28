/**
 * NEXCEL AI · Unternehmensdiagnostik · Domain Types
 *
 * Eine Analyse ist eine erstklassige Entität mit relationalen Sub-Entitäten:
 *   company_analyses (1) ──┬── (N) analysis_uploads
 *                          ├── (N) analysis_scores
 *                          ├── (N) analysis_findings
 *                          ├── (N) analysis_recommendations
 *                          ├── (N) analysis_events
 *                          └── (1) lead_classifications
 *
 * Alle Werte sind deterministisch aus echten Signalen abgeleitet.
 * Es gibt keine Mock- oder Zufallswerte irgendwo in dieser Pipeline.
 */

export type AnalysisStatus =
  | "queued"
  | "running"
  | "completed"
  | "partial"
  | "failed";

/** Live-Phasen, die im Frontend angezeigt werden — exakt diese IDs feuert das Backend. */
export type AnalysisPhaseId =
  | "intake"
  | "company-structure"
  | "system-detection"
  | "infrastructure"
  | "automation-potential"
  | "operational-gaps"
  | "recommendations"
  | "persistence";

export interface AnalysisPhase {
  id: AnalysisPhaseId;
  label: string;
  /** "skipped" tritt auf, wenn ein Modul fehlt — wir machen das transparent statt zu faken. */
  status: "pending" | "running" | "done" | "skipped" | "error";
  startedAt?: number;
  finishedAt?: number;
  note?: string;
}

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export type FindingCategory =
  | "system-fragmentation"
  | "automation"
  | "scalability"
  | "technical"
  | "conversion"
  | "trust"
  | "data"
  | "operations";

export interface AnalysisFinding {
  id: string;
  analysisId: string;
  ruleId: string;
  category: FindingCategory;
  severity: Severity;
  title: string;
  detail: string;
  /** Quelle: woher kommt diese Erkenntnis? (z. B. "web.headers", "stack.detection", "upload.pdf") */
  source: string;
  /** Score-Impact pro Achse — null wenn rein erklärend. */
  scoreImpact: ScoreImpact | null;
  /** Konkrete Behebung — kann leer sein, wenn rein deskriptiv. */
  recommendation: string | null;
  createdAt: number;
}

/** Pro Achse: wie stark verschiebt diese Regel den Score? Werte sind ganzzahlig. */
export interface ScoreImpact {
  operations?: number;
  automationPotential?: number;
  systemFragmentation?: number;
  scalabilityRisk?: number;
  technicalRisk?: number;
  conversionRisk?: number;
}

/** Final aggregierte Scores einer Analyse. */
export interface AnalysisScores {
  analysisId: string;
  operations: number; // 0..100 — wie reibungsarm der Betrieb läuft
  automationPotential: number; // 0..100 — wie viel ist automatisierbar
  systemFragmentation: number; // 0..100 — wie zersplittert die Tool-Landschaft ist
  scalabilityRisk: number; // 0..100 — Risiko beim Skalieren
  technicalRisk: number; // 0..100 — technische Schulden / Sicherheit
  conversionRisk: number; // 0..100 — wie viele Anfragen verloren gehen
  /** Konfidenz der Gesamtbewertung — abhängig davon, wie vollständig die Inputs waren. */
  confidence: number; // 0..100
  computedAt: number;
}

export interface AnalysisRecommendation {
  id: string;
  analysisId: string;
  productKey:
    | "crm-system"
    | "recruiting-os"
    | "real-estate-os"
    | "automation-layer"
    | "analytics-system"
    | "ai-workflow-system"
    | "data-platform"
    | "operations-platform";
  name: string;
  oneliner: string;
  /** Module die enthalten sind */
  modules: { name: string; benefit: string }[];
  /** Geschätzter Projektumfang in Wochen — nur wenn ableitbar, sonst null. */
  estimatedWeeks: number | null;
  priority: 1 | 2 | 3; // 1 = höchste
  /** Welche Findings haben diese Empfehlung getriggert? */
  reasonFindingIds: string[];
  createdAt: number;
}

export interface AnalysisUpload {
  id: string;
  analysisId: string;
  filename: string;
  mimeType: string;
  bytes: number;
  /** SHA-256 für Dedupe und Audit. */
  sha256: string;
  /** Wo die Datei liegt (Pfad oder Hinweis). */
  storagePath: string;
  /** Welcher Inhalt wurde extrahiert — leer wenn unbekanntes Format. */
  extractedTextPreview: string | null;
  createdAt: number;
}

export type LeadTier = "cold" | "warm" | "hot" | "enterprise";

export interface LeadClassification {
  id: string;
  analysisId: string;
  tier: LeadTier;
  /** Ableitungs-Reasoning — transparent welche Signale zur Klassifikation führten. */
  signals: string[];
  /** Numerischer Score nur intern — für Sortierung im CRM. */
  rawScore: number;
  createdAt: number;
}

/** Events sind das BigMA-Audit-Log — chronologisch alles, was passiert ist. */
export type AnalysisEventType =
  | "analysis.started"
  | "analysis.url.provided"
  | "analysis.upload.received"
  | "analysis.phase.changed"
  | "analysis.completed"
  | "analysis.failed"
  | "lead.classified"
  | "automation.high-potential"
  | "lead.enterprise-detected"
  | "lead.warm-detected"
  | "lead.hot-detected";

export interface AnalysisEvent {
  id: string;
  analysisId: string;
  type: AnalysisEventType;
  payload: Record<string, unknown>;
  createdAt: number;
}

export interface CompanyAnalysis {
  id: string;
  /** Eingegebene URL — kann leer sein, wenn nur Uploads vorhanden. */
  url: string | null;
  /** Aus URL abgeleitete Domain. */
  domain: string | null;
  status: AnalysisStatus;
  phases: AnalysisPhase[];
  /** Session-Identifier (Anonym, vom Client). */
  sessionId: string | null;
  device: string | null;
  referrer: string | null;
  ipHash: string | null;
  startedAt: number;
  finishedAt: number | null;
  errorMessage: string | null;
  /** Wenn das Backend nicht voll laufen konnte — wir markieren das, statt zu faken. */
  degradationReasons: string[];
}

/** Vollständiges Result-DTO, das das Frontend nach Abschluss bekommt. */
export interface AnalysisResultDTO {
  analysis: CompanyAnalysis;
  scores: AnalysisScores | null;
  findings: AnalysisFinding[];
  recommendations: AnalysisRecommendation[];
  uploads: AnalysisUpload[];
  leadClassification: LeadClassification | null;
  events: AnalysisEvent[];
  /** Rohbefunde aus dem Web-Scanner (Tech-Stack, etc.) — falls Web-Phase lief. */
  webMeta: {
    title: string | null;
    description: string | null;
    statusCode: number | null;
    detectedStack: { category: string; name: string; confidence: number }[];
    bytes: number | null;
    durationMs: number | null;
  } | null;
}
