import {
  COMPANY_SIZE_OPTIONS,
  DIGITAL_MATURITY_OPTIONS,
  GOAL_OPTIONS,
  INDUSTRY_OPTIONS,
  PAIN_BLOCKS,
  PROJECT_DIRECTION_OPTIONS,
  TOOL_OPTIONS,
} from "./config";
import type { AnalysisSummary } from "./summary-types";
import type { SystemanalyseState } from "./types";

type StateSlice = Omit<SystemanalyseState, "stepIndex" | "submitStatus" | "submitError">;

function labelIndustry(id: string) {
  return INDUSTRY_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function labelGoals(ids: string[]) {
  if (!ids.length) return "";
  return ids
    .map((id) => GOAL_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean)
    .join(", ");
}

function labelMaturity(id: string) {
  return DIGITAL_MATURITY_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function labelCompanySize(id: string) {
  return COMPANY_SIZE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

function labelDirections(ids: string[]) {
  if (!ids.length) return "";
  return ids
    .map((id) => PROJECT_DIRECTION_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean)
    .join(", ");
}

function labelTools(ids: string[]) {
  if (!ids.length) return "";
  return ids
    .map((id) => TOOL_OPTIONS.find((o) => o.id === id)?.label)
    .filter(Boolean)
    .join(", ");
}

/** Alle ausgewählten Pain-Labels mit Block-Kontext (für Auswertung). */
export function collectPainSelections(state: StateSlice): { blockTitle: string; label: string }[] {
  const out: { blockTitle: string; label: string }[] = [];
  for (const block of PAIN_BLOCKS) {
    const sel = state.painByBlock[block.id] ?? [];
    for (const itemId of sel) {
      const item = block.items.find((i) => i.id === itemId);
      if (item) out.push({ blockTitle: block.title, label: item.label });
    }
  }
  return out;
}

function hasPainId(state: StateSlice, itemId: string): boolean {
  for (const block of PAIN_BLOCKS) {
    if ((state.painByBlock[block.id] ?? []).includes(itemId)) return true;
  }
  return false;
}

function hasBlockSelection(state: StateSlice, blockId: string): boolean {
  return (state.painByBlock[blockId] ?? []).length > 0;
}

/**
 * Realistische System-Bausteine — nur was als Individualsoftware / Integration / Automation üblich umsetzbar ist.
 */
export function buildSystemProposalBullets(state: StateSlice): string[] {
  const bullets: string[] = [];
  const add = (s: string) => {
    if (s && !bullets.includes(s)) bullets.push(s);
  };

  add("Zentrales Unternehmenssystem bzw. Integrations-Hub mit einheitlichem Datenkern");

  if (state.toolsUsed.length >= 3 || hasPainId(state, "p_medienbruch") || hasPainId(state, "s_keinTalk")) {
    add("Schnittstellen & zuverlässige Datensynchronisation zwischen Ihren bestehenden Tools");
  }

  if (
    hasPainId(state, "p_manuell") ||
    hasPainId(state, "p_doppel") ||
    hasPainId(state, "p_noauto") ||
    state.goals.includes("auto")
  ) {
    add("Prozessautomatisierung und definierte Workflows für wiederkehrende Aufgaben");
  }

  if (hasBlockSelection(state, "communication") || hasPainId(state, "c_email") || hasPainId(state, "c_kanaele")) {
    add("Team-Workflows, Aufgaben & Benachrichtigungen statt reiner E-Mail-Kette");
  }

  if (hasPainId(state, "s_insel") || hasPainId(state, "s_zuViele") || hasPainId(state, "s_noint")) {
    add("Zusammenführung bisher getrennter Anwendungen (APIs, Middleware, klare Schnittstellen)");
  }

  if (hasBlockSelection(state, "data") || hasPainId(state, "d_noreport") || hasPainId(state, "d_nokpi")) {
    add("Reporting, KPIs und Auswertungen auf konsistentem Datenstand");
  }

  if (
    hasBlockSelection(state, "sales") ||
    state.goals.includes("vertrieb") ||
    state.toolsUsed.includes("crm")
  ) {
    add("Kunden- und Vorgangssteuerung (CRM / Pipeline / Follow-up)");
  }

  if (hasPainId(state, "comp_nodoku") || hasPainId(state, "c_nodoku")) {
    add("Dokumentenstruktur, Ablage und Nachvollziehbarkeit (DMS / strukturierte Ablage)");
  }

  if (state.goals.includes("plattform") || state.projectDirections.includes("plattform")) {
    add("Schrittweiser Aufbau einer übergreifenden Plattform — phasierbar nach Priorität");
  }

  if (state.goals.includes("ki") || state.projectDirections.includes("ki")) {
    add("Gezielte KI-Funktionen an klar definierten Schnittstellen (nach stabiler Datenbasis)");
  }

  if (state.projectDirections.includes("individual") || state.projectDirections.includes("neuportal")) {
    add("Maßgeschneiderte Software / Portale genau auf Ihre Prozesse zugeschnitten");
  }

  const dir = state.projectDirections;
  if (dir.includes("booking")) add("Buchungs- und Terminlogik als durchgängiger Prozess");
  if (dir.includes("portal")) add("Kunden- oder Partnerportal mit klarer Self-Service-Logik");

  if (bullets.length < 4) {
    add("Schulung, Rollout und kontinuierliche Weiterentwicklung gemeinsam mit Ihrem Team");
  }

  return bullets.slice(0, 8);
}

export function buildHeuristicSummary(state: StateSlice, brandName: string): AnalysisSummary {
  const painSelections = collectPainSelections(state);
  const painCount = painSelections.length;
  const maturityRank: Record<string, number> = { low: 1, medium: 2, high: 3, very_high: 4 };
  const m = maturityRank[state.digitalMaturity] ?? 2;
  const baseScore = 22 + m * 12 + Math.min(28, painCount * 2);
  const score = Math.min(94, Math.max(18, Math.round(baseScore)));

  let potentialLevel = "Mittel";
  if (score < 38) potentialLevel = "Sehr hoch — klare Hebel durch Systemführung und Automatisierung";
  else if (score < 58) potentialLevel = "Hoch — Struktur, Integration und Automatisierung lohnen sich";
  else if (score < 78) potentialLevel = "Solide Basis — Fokus auf Feintuning und Skalierung";
  else potentialLevel = "Gut aufgestellt — Optimierung und gezielte Innovation";

  const sizeLabel = state.companySize ? labelCompanySize(state.companySize) : "";
  const companyLine = state.companyName.trim()
    ? [state.companyName.trim(), sizeLabel].filter(Boolean).join(" · ")
    : sizeLabel || "Unternehmensprofil aus Analyse";

  const industryLine =
    state.industry === "sonstige" && state.industryOther.trim()
      ? `Branche / Feld: ${state.industryOther.trim().slice(0, 120)}`
      : state.industry
        ? `Branche: ${labelIndustry(state.industry)}`
        : "";

  const maturityLine = state.digitalMaturity
    ? `Digitalisierungsgrad (Selbsteinschätzung): ${labelMaturity(state.digitalMaturity)}.`
    : "";
  const situationParts = [
    `${brandName} — ${companyLine}.`,
    industryLine,
    maturityLine,
    state.situationNarrative.trim()
      ? `Ihre Einordnung: ${state.situationNarrative.trim().slice(0, 560)}${state.situationNarrative.length > 560 ? " …" : ""}`
      : "",
  ];
  const situation = situationParts.filter(Boolean).join("\n\n");

  let problems: string;
  if (painSelections.length > 0) {
    const lines = painSelections.slice(0, 12).map((p) => `• ${p.label} (${p.blockTitle})`);
    problems = [
      `Aus Ihrer Diagnose haben wir ${painSelections.length} markierte Schwerpunkt${painSelections.length === 1 ? "" : "e"} übernommen:`,
      lines.join("\n"),
      state.painConcrete.trim()
        ? `\nErgänzend von Ihnen beschrieben: ${state.painConcrete.trim().slice(0, 320)}${state.painConcrete.length > 320 ? " …" : ""}`
        : "",
      state.painCost.trim()
        ? `\nKosten-/Lastfokus: ${state.painCost.trim().slice(0, 220)}${state.painCost.length > 220 ? " …" : ""}`
        : "",
    ]
      .filter(Boolean)
      .join("");
  } else {
    problems = [
      "In der strukturierten Diagnose wurden noch keine Einzelpunkte gesetzt.",
      state.painConcrete.trim()
        ? `Aus Ihrem Freitext leiten wir folgende Schwerpunkte ab: ${state.painConcrete.trim().slice(0, 400)}${state.painConcrete.length > 400 ? " …" : ""}`
        : "Im Erstgespräch priorisieren wir gemeinsam die echten Engpässe anhand Ihrer Beschreibung.",
    ].join("\n\n");
  }

  const goalsLine = labelGoals(state.goals);
  const toolsLine = labelTools(state.toolsUsed);
  const potentialParts: string[] = [];

  if (goalsLine) {
    potentialParts.push(`Aus Ihren Zielen: ${goalsLine} — hier liegt typischerweise Hebel für Zeitgewinn und weniger Fehlerquote.`);
  }
  if (state.goalShortTermMust.trim()) {
    potentialParts.push(
      `Kurzfristig kritisch (Ihre Angabe): ${state.goalShortTermMust.trim().slice(0, 240)}${state.goalShortTermMust.length > 240 ? " …" : ""}`
    );
  }
  if (toolsLine) {
    potentialParts.push(
      `Mit den genannten Werkzeugen (${toolsLine}) besteht oft Potenzial durch bessere Anbindung und weniger manuelle Übergaben.`
    );
  }
  if (state.toolsFriction.trim()) {
    potentialParts.push(`Reibungsstellen (Ihre Angabe): ${state.toolsFriction.trim().slice(0, 200)}${state.toolsFriction.length > 200 ? " …" : ""}`);
  }
  if (m <= 2) {
    potentialParts.push("Bei niedrigerem Digitalisierungsgrad sind Quick-Wins durch Standardisierung und erste Automatisierung meist schnell messbar.");
  } else {
    potentialParts.push("Bei höherem Digitalisierungsgrad lohnt sich Feintuning: Integrationstiefe, Datenqualität und gezielte Automatisierung statt neue Insellösungen.");
  }
  if (state.bottleneck.trim()) {
    potentialParts.push(`Größter Engpass (Ihre Angabe): ${state.bottleneck.trim().slice(0, 220)}${state.bottleneck.length > 220 ? " …" : ""}`);
  }

  const potential =
    potentialParts.join("\n\n") ||
    "Potenzial liegt in klareren Prozessen, zusammengeführten Daten und schrittweiser Automatisierung — im Detail stimmen wir das mit Ihnen ab.";

  const systemProposalBullets = buildSystemProposalBullets(state);

  const directions = labelDirections(state.projectDirections);
  const recommendation = [
    "Basierend auf Größe, Branche, Ihren Zielen und der markierten Diagnose schlagen wir eine Architektur vor, die wir als Individualsoftware und Integration für Sie umsetzen können:",
    directions ? `Ihre gewählten Richtungen fließen ein: ${directions}.` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  const nextSteps = [
    "Wir prüfen Ihre Analyse und melden uns mit einer priorisierten Roadmap (Quick-Wins vs. strategische Bausteine).",
    "Typischer nächster Schritt: 60–90 Minuten Architektur-Skizze — abgestimmt auf Budget und Zeithorizont aus Ihrer Analyse.",
    "Rückmeldung in der Regel innerhalb von zwei Werktagen.",
  ].join("\n\n");

  const scoreHint =
    score < 45
      ? "Fokus: Transparenz, weniger Doppelarbeit, erste Automatisierung."
      : score < 70
        ? "Fokus: Integration der Tools, einheitliche Datenbasis, messbare KPIs."
        : "Fokus: Skalierung, Qualität und gezielte KI dort, wo Daten und Prozesse tragen.";

  return {
    situation,
    problems,
    potential,
    recommendation,
    systemProposalBullets,
    nextSteps,
    score,
    potentialLevel,
    scoreHint,
  };
}
