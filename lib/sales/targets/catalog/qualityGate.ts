/**
 * Quality Gate für den Katalog-Publish.
 *
 * Der Katalog wird erst dann für den Vertrieb freigeschaltet, wenn er
 * nachweislich brauchbar ist. Alle Kennzahlen werden direkt aus
 * PostgreSQL berechnet — nichts wird geschätzt oder fortgeschrieben.
 *
 * Bewusst KEIN Kriterium: Anteil analysierter Websites oder Lead-Scores.
 * Die Anreicherung läuft gestuft im Hintergrund weiter; sie darf die
 * Sichtbarkeit des Katalogs nicht blockieren.
 */

import { db } from "@/lib/pg";
import { ALL_CATEGORIES } from "../categoryMap";

export interface QualityCheck {
  key: string;
  label: string;
  passed: boolean;
  actual: number;
  required: number;
  unit: "count" | "percent";
}

export interface QualityReport {
  passed: boolean;
  evaluatedAt: string;
  totalCompanies: number;
  checks: QualityCheck[];
}

export interface QualityThresholds {
  minCompanies: number;
  minCategorizedPct: number;
  minWithSourcePct: number;
  minReachablePct: number;
}

export const DEFAULT_THRESHOLDS: QualityThresholds = {
  minCompanies: 5000,
  minCategorizedPct: 95,
  minWithSourcePct: 99,
  // Messung an der Stichprobe lag bei ~50 Prozent Telefon oder Website.
  minReachablePct: 40,
};

export async function evaluateQualityGate(
  bbox: { south: number; west: number; north: number; east: number } | null,
  thresholds: QualityThresholds = DEFAULT_THRESHOLDS
): Promise<QualityReport> {
  const sql = await db();
  const evaluatedAt = new Date().toISOString();
  if (!sql) {
    return { passed: false, evaluatedAt, totalCompanies: 0, checks: [] };
  }

  const useBBox = bbox !== null;
  const known = [...ALL_CATEGORIES];

  const rows = await sql<Record<string, unknown>[]>`
    WITH scoped AS (
      SELECT t.id, t.industry, t.phone, t.website
      FROM sales_target_companies t
      WHERE t.deleted_at IS NULL
        AND (${useBBox ? 1 : 0}::int = 0 OR (
          t.latitude  BETWEEN ${bbox?.south ?? 0} AND ${bbox?.north ?? 0} AND
          t.longitude BETWEEN ${bbox?.west ?? 0} AND ${bbox?.east ?? 0}
        ))
    )
    SELECT
      (SELECT COUNT(*)::int FROM scoped)                                        AS total,
      (SELECT COUNT(*)::int FROM scoped
        WHERE industry IS NOT NULL AND industry = ANY(${known}::text[]))        AS categorized,
      (SELECT COUNT(*)::int FROM scoped s
        WHERE EXISTS (SELECT 1 FROM sales_target_sources src WHERE src.target_id = s.id)) AS with_source,
      (SELECT COUNT(*)::int FROM scoped
        WHERE COALESCE(phone,'') <> '' OR COALESCE(website,'') <> '')           AS reachable,
      (SELECT COUNT(*)::int FROM (
        SELECT fingerprint FROM sales_target_companies
         WHERE deleted_at IS NULL
         GROUP BY fingerprint HAVING COUNT(*) > 1
      ) d)                                                                      AS dup_fingerprints
  `;

  const r = rows[0] ?? {};
  const total = Number(r.total ?? 0);
  const categorized = Number(r.categorized ?? 0);
  const withSource = Number(r.with_source ?? 0);
  const reachable = Number(r.reachable ?? 0);
  const dupes = Number(r.dup_fingerprints ?? 0);

  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);

  const checks: QualityCheck[] = [
    {
      key: "min_companies",
      label: "Mindestanzahl Unternehmen",
      passed: total >= thresholds.minCompanies,
      actual: total,
      required: thresholds.minCompanies,
      unit: "count",
    },
    {
      key: "categorized",
      label: "Normalisierte Kategorie vorhanden",
      passed: pct(categorized) >= thresholds.minCategorizedPct,
      actual: pct(categorized),
      required: thresholds.minCategorizedPct,
      unit: "percent",
    },
    {
      key: "provenance",
      label: "Mindestens eine Quelle je Unternehmen",
      passed: pct(withSource) >= thresholds.minWithSourcePct,
      actual: pct(withSource),
      required: thresholds.minWithSourcePct,
      unit: "percent",
    },
    {
      key: "reachable",
      label: "Telefon oder Website vorhanden",
      passed: pct(reachable) >= thresholds.minReachablePct,
      actual: pct(reachable),
      required: thresholds.minReachablePct,
      unit: "percent",
    },
    {
      key: "fingerprint_unique",
      label: "Keine Fingerprint-Dubletten",
      passed: dupes === 0,
      actual: dupes,
      required: 0,
      unit: "count",
    },
  ];

  return {
    passed: checks.every((c) => c.passed),
    evaluatedAt,
    totalCompanies: total,
    checks,
  };
}
