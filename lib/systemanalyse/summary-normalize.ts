import type { AnalysisSummary } from "./summary-types";

/** Stellt vollständiges Summary sicher; füllt fehlende KI-Felder aus der Heuristik nach. */
export function normalizeAnalysisSummary(partial: unknown, heuristic: AnalysisSummary): AnalysisSummary {
  if (!partial || typeof partial !== "object") return heuristic;
  const p = partial as Record<string, unknown>;

  const bulletsRaw = p.systemProposalBullets;
  const bullets =
    Array.isArray(bulletsRaw) && bulletsRaw.length > 0
      ? bulletsRaw.filter((x): x is string => typeof x === "string" && x.trim().length > 0).slice(0, 10)
      : heuristic.systemProposalBullets;

  const str = (k: string, fallback: string) =>
    typeof p[k] === "string" && (p[k] as string).trim() ? (p[k] as string).trim() : fallback;

  const scoreRaw = p.score;
  const score =
    typeof scoreRaw === "number" && !Number.isNaN(scoreRaw)
      ? Math.min(94, Math.max(18, Math.round(scoreRaw)))
      : heuristic.score;

  return {
    situation: str("situation", heuristic.situation),
    problems: str("problems", heuristic.problems),
    potential: str("potential", heuristic.potential),
    recommendation: str("recommendation", heuristic.recommendation),
    systemProposalBullets: bullets.length ? bullets : heuristic.systemProposalBullets,
    nextSteps: str("nextSteps", heuristic.nextSteps),
    score,
    potentialLevel: str("potentialLevel", heuristic.potentialLevel),
    scoreHint: str("scoreHint", heuristic.scoreHint),
  };
}

export function parseJsonFromModelContent(raw: string): unknown {
  let t = raw.trim();
  if (t.startsWith("```")) {
    t = t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "");
  }
  return JSON.parse(t) as unknown;
}
