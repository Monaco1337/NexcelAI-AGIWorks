/**
 * Systemanalyse Engine — Type Layer
 * ─────────────────────────────────────────────────────────────
 * Modulare Diagnose-Engine. Jede Frage = AnalysisModule.
 * Das System ist erweiterbar: neue Module können ohne UI-Änderung
 * registriert werden, Follow-up-Rules laden kontextabhängig nach.
 */

export type ModuleCategory =
  | "growth"
  | "sales"
  | "marketing"
  | "operations"
  | "automation"
  | "finance"
  | "product"
  | "team"
  | "crm"
  | "digital-maturity";

/** Antwort-Optionen einer Diagnose-Frage. */
export interface AnalysisOption {
  id: string;
  label: string;
  /**
   * Maturity-Wert dieser Option (0..100).
   * Höher = strukturell besser aufgestellt.
   */
  maturity: number;
  /**
   * Kurz-Diagnose, die im Report erscheint, falls diese Option gewählt wird.
   * `weakness` bei niedriger Maturity, `strength` bei hoher.
   */
  diagnostic?: {
    weakness?: string;
    strength?: string;
    /** Bottleneck-Tag, in welchem Bucket das landet. */
    bucket?: "growth" | "automation" | "revenue" | "structure";
  };
}

/** Follow-up-Regel: lädt zusätzliche Module abhängig von der Antwort. */
export interface FollowUpRule {
  /** Wenn die gewählte Option eine dieser IDs hat … */
  whenOptionId: string[];
  /** … werden diese Module zusätzlich aktiviert (in Reihenfolge angehängt). */
  loadModules: string[];
}

export interface AnalysisModule {
  id: string;
  category: ModuleCategory;
  /** Diagnose-Frage. */
  question: string;
  /** Kurzer Kontext: Warum ist diese Frage relevant? */
  explanation: string;
  /** Antwort-Chips. */
  options: AnalysisOption[];
  /** Optionaler Freitext-Input zur Vertiefung. */
  freeText?: {
    label: string;
    placeholder: string;
  };
  /** Gewichtung der Frage im Gesamt-Score (1..5; Default 1). */
  weight?: number;
  /** Follow-up-Module, die durch bestimmte Antworten aktiviert werden. */
  followUpRules?: FollowUpRule[];
  /** Tag, der unter dem Modul-Header angezeigt wird (z.B. „SCAN · Growth Layer"). */
  scanLabel?: string;
}

/** Antwort eines abgeschlossenen Moduls. */
export interface ModuleAnswer {
  moduleId: string;
  optionId: string;
  /** Optionaler vom Nutzer eingegebener Kontext. */
  freeText?: string;
  timestamp: number;
}

/** Aggregierter Engine-State. */
export interface AnalysisState {
  /** Aktive Modul-Reihenfolge (kann durch Follow-ups wachsen). */
  queue: string[];
  answers: ModuleAnswer[];
  /** Index des aktuell sichtbaren Moduls in queue. */
  activeIndex: number;
  /** Engine-Status. */
  phase: "scanning" | "analyzing" | "report";
}

/** Output der Score-Engine. */
export interface MaturityScore {
  /** 0..100. */
  total: number;
  /** Per Kategorie aggregiert (0..100 oder null wenn keine Daten). */
  byCategory: Partial<Record<ModuleCategory, number>>;
  /** Klassifikation. */
  band: "critical" | "manual" | "transitional" | "system-driven";
  bandLabel: string;
}

export interface ReportInsight {
  type: "growth-bottleneck" | "automation-gap" | "revenue-leak" | "structure-gap";
  text: string;
  severity: "low" | "medium" | "high";
  moduleId: string;
}

export interface PriorityAction {
  text: string;
  /** Welche Kategorie adressiert diese Action. */
  category: ModuleCategory;
  /** Verweis auf empfohlenes NEXUS-Modul. */
  recommendedModule?: string;
}

export interface SystemReport {
  score: MaturityScore;
  growthBottlenecks: ReportInsight[];
  automationGaps: ReportInsight[];
  revenueLeakage: ReportInsight[];
  structureGaps: ReportInsight[];
  priorityActions: PriorityAction[];
  recommendedSetup: string[];
}
