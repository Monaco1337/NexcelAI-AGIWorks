// Shared types for the on-device scanner engine.
// No API dependencies — everything is computed client-side.

export type ScannerMode = "web" | "software" | "cloud";

export type Severity = "info" | "low" | "medium" | "high" | "critical";

export interface Finding {
  id: string;
  area: string;
  title: string;
  detail: string;
  severity: Severity;
  fix?: string;
}

export interface ScoreBreakdown {
  ux: number;
  performance: number;
  conversion: number;
  trust: number;
  security: number;
  overall: number;
}

export interface DetectedTech {
  category: string;
  name: string;
  confidence: number; // 0..1
}

export interface ScanResult {
  mode: ScannerMode;
  source: string; // url or filename
  durationMs: number;
  score: ScoreBreakdown;
  findings: Finding[];
  detected: DetectedTech[];
  summary: string; // short, plain-language summary
  recommendations: string[]; // top actionable steps
  meta: Record<string, unknown>;
}

export interface FetchedHtml {
  url: string;
  finalUrl: string;
  status: number;
  headers: Record<string, string>;
  html: string;
  fetchedAt: number;
  bytes: number;
}
