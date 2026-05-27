/**
 * KI-/Heuristik-Auswertung nach Abschluss der Systemanalyse.
 * Alle Texte werden aus den tatsächlichen Antworten abgeleitet (keine statischen Dummy-Texte).
 */
export type AnalysisSummary = {
  /** 1. Kurz-Zusammenfassung — Lage des Unternehmens */
  situation: string;
  /** 2. Hauptprobleme — wichtigste Engpässe */
  problems: string;
  /** 3. Automatisierungs-Potenzial — Zeit & Kosten */
  potential: string;
  /** Kurzer einleitender Satz zur System-Empfehlung (optional, Fließtext) */
  recommendation: string;
  /** 4. High-End Systemvorschlag — realistisch umsetzbare Bausteine (von uns implementierbar) */
  systemProposalBullets: string[];
  nextSteps: string;
  score: number;
  potentialLevel: string;
  scoreHint: string;
};
