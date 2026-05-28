"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";
import type {
  AnalysisFinding,
  AnalysisRecommendation,
  AnalysisResultDTO,
  AnalysisScores,
  CompanyAnalysis,
  Severity,
} from "@/lib/diagnostics/types";

interface Props {
  analysisId: string;
}

/* ── Einfache Sprache ─────────────────────────────────────────────── */

type ScoreKey =
  | "operations"
  | "automationPotential"
  | "systemFragmentation"
  | "scalabilityRisk"
  | "technicalRisk"
  | "conversionRisk";

const SCORE_ITEMS: {
  key: ScoreKey;
  label: string;
  hint: string;
  /** true = hoher Wert ist schlecht (wir drehen die Anzeige) */
  inverted: boolean;
}[] = [
  {
    key: "operations",
    label: "Tagesablauf",
    hint: "Wie reibungslos Ihr Alltag läuft",
    inverted: false,
  },
  {
    key: "automationPotential",
    label: "Zeit sparen",
    hint: "Wo Sie repetitive Arbeit abgeben können",
    inverted: false,
  },
  {
    key: "systemFragmentation",
    label: "Alles im Blick",
    hint: "Ob Ihre Tools zusammenarbeiten",
    inverted: true,
  },
  {
    key: "scalabilityRisk",
    label: "Mitwachsen",
    hint: "Ob Ihr Setup mit Ihnen wächst",
    inverted: true,
  },
  {
    key: "technicalRisk",
    label: "Website",
    hint: "Stabilität und Vertrauen online",
    inverted: true,
  },
  {
    key: "conversionRisk",
    label: "Kundenanfragen",
    hint: "Ob Interessenten Sie leicht erreichen",
    inverted: true,
  },
];

const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Sehr wichtig",
  high: "Wichtig",
  medium: "Beachten",
  low: "Hinweis",
  info: "Info",
};

function displayScore(value: number, inverted: boolean): number {
  return inverted ? 100 - value : value;
}

function scoreVerdict(effective: number): { label: string; color: string } {
  if (effective >= 70) return { label: "Gut", color: "var(--brand-primary)" };
  if (effective >= 45) return { label: "Ausbaufähig", color: "rgba(255,255,255,0.65)" };
  return { label: "Potenzial", color: "#F97316" };
}

function buildSummary(
  scores: AnalysisScores | null,
  findings: AnalysisFinding[],
): string {
  if (findings.length > 0) {
    const top = findings.find((f) => f.severity === "high" || f.severity === "critical") ?? findings[0];
    if (top) return top.title;
  }
  if (!scores) return "Hier sehen Sie, wo Ihr Unternehmen digital noch Luft nach oben hat.";
  const weak = SCORE_ITEMS.map((item) => ({
    ...item,
    effective: displayScore(scores[item.key], item.inverted),
  }))
    .sort((a, b) => a.effective - b.effective)[0];
  if (weak.effective < 45) {
    return `Vor allem bei „${weak.label}“ sehen wir deutliches Verbesserungspotenzial.`;
  }
  return "Solide Basis — mit gezielten Anpassungen holen Sie deutlich mehr aus Ihrem Alltag raus.";
}

/* ── Main ─────────────────────────────────────────────────────────── */

export default function DiagnosticsReport({ analysisId }: Props) {
  const brand = useBrand();
  const kontaktHref = resolveBrandNavHref("/kontakt", brand.id);
  const [data, setData] = useState<AnalysisResultDTO | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`/api/diagnostics/result/${analysisId}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error(`Server-Fehler ${res.status}`);
        const json = (await res.json()) as AnalysisResultDTO;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Bericht konnte nicht geladen werden.");
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [analysisId]);

  const topFindings = useMemo(() => {
    if (!data) return [];
    const order: Severity[] = ["critical", "high", "medium", "low", "info"];
    return [...data.findings]
      .sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))
      .slice(0, 4);
  }, [data]);

  const topRec = useMemo(
    () => data?.recommendations.sort((a, b) => a.priority - b.priority)[0] ?? null,
    [data],
  );

  if (error) {
    return (
      <div className="mx-auto max-w-[680px] px-5 py-12 text-center text-white/70">
        <h2 className="text-2xl font-light text-white">Bericht nicht verfügbar</h2>
        <p className="mt-3 text-[14px] text-white/55">{error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-[680px] px-5 py-12 text-center text-white/55">
        Lade Ihre Auswertung…
      </div>
    );
  }

  const summary = buildSummary(data.scores, data.findings);

  return (
    <div className="mx-auto w-full max-w-[1120px] px-4 pb-16 pt-[110px] sm:px-6 md:pb-20 md:pt-[120px]">
      {/* Header — nur Domain + Kurzfassung */}
      <header className="mb-5 md:mb-6">
        <p
          className="text-[11px] uppercase tracking-[0.28em] mb-2"
          style={{ color: "var(--brand-primary)", opacity: 0.75 }}
        >
          Ihre Auswertung
        </p>
        <h1
          className="text-[1.75rem] leading-[1.08] text-white sm:text-[2.25rem] lg:text-[2.5rem]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 300,
            letterSpacing: "-0.025em",
          }}
        >
          {data.analysis.domain ?? "Ihr Unternehmen"}
        </h1>
        <p className="mt-2 max-w-[52ch] text-[15px] leading-[1.55] text-white/55 font-light">
          {summary}
        </p>
        {data.analysis.degradationReasons.length > 0 ? (
          <p className="mt-2 text-[13px] text-white/40 font-light">
            Hinweis: Nicht alle Bereiche konnten vollständig geprüft werden.
          </p>
        ) : null}
      </header>

      {/* Desktop: alles auf einen Blick — 12-Spalten-Grid */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6 lg:items-start">
        {/* Scores — kompakt 3×2 */}
        <section className="lg:col-span-7">
          <SectionLabel>Ihr Überblick</SectionLabel>
          {data.scores ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-2.5">
              {SCORE_ITEMS.map((item, i) => (
                <CompactScore
                  key={item.key}
                  label={item.label}
                  hint={item.hint}
                  value={displayScore(data.scores![item.key], item.inverted)}
                  delay={i * 0.03}
                />
              ))}
            </div>
          ) : (
            <EmptyHint>Für diese Auswertung liegen noch keine Kennzahlen vor.</EmptyHint>
          )}
        </section>

        {/* Empfehlung + CTA — rechts, sticky auf Desktop */}
        <aside className="lg:col-span-5 lg:sticky lg:top-[calc(env(safe-area-inset-top,0px)+6.5rem)]">
          {topRec ? (
            <RecommendationCompact rec={topRec} />
          ) : (
            <div
              className="rounded-2xl p-5 mb-4"
              style={{
                border: "1px solid var(--brand-card-border)",
                background: "var(--brand-glow-soft)",
              }}
            >
              <p className="text-[14px] leading-[1.55] text-white/60 font-light">
                Sprechen Sie uns an — wir zeigen Ihnen konkret, was als Nächstes Sinn macht.
              </p>
            </div>
          )}
          <CTABlock href={kontaktHref} brandName={brand.name} />
        </aside>

        {/* Befunde — volle Breite, kompakt */}
        <section className="lg:col-span-12">
          <SectionLabel>
            {topFindings.length > 0
              ? `Das fällt auf · ${data.findings.length}`
              : "Das fällt auf"}
          </SectionLabel>
          {topFindings.length > 0 ? (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4 lg:gap-2.5">
              {topFindings.map((f) => (
                <FindingCompact key={f.id} f={f} />
              ))}
            </div>
          ) : (
            <EmptyHint>Keine besonderen Auffälligkeiten — solide Ausgangslage.</EmptyHint>
          )}
          {data.findings.length > 4 ? (
            <p className="mt-3 text-[12px] text-white/35 font-light">
              + {data.findings.length - 4} weitere Punkte in der Detailbesprechung
            </p>
          ) : null}
        </section>
      </div>
    </div>
  );
}

/* ── Subcomponents ────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-3 text-[11px] uppercase tracking-[0.22em] text-white/40"
      style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 500 }}
    >
      {children}
    </h2>
  );
}

function CompactScore({
  label,
  hint,
  value,
  delay,
}: {
  label: string;
  hint: string;
  value: number;
  delay: number;
}) {
  const verdict = scoreVerdict(value);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-xl px-3 py-3 sm:px-3.5 sm:py-3.5"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className="text-[12.5px] text-white/90 leading-tight"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 400 }}
        >
          {label}
        </span>
        <span
          className="shrink-0 text-[10px] uppercase tracking-[0.14em]"
          style={{ color: verdict.color }}
        >
          {verdict.label}
        </span>
      </div>
      <p className="mt-1 text-[10.5px] leading-[1.4] text-white/38 line-clamp-2">{hint}</p>
      <div
        className="mt-2.5 h-[2px] w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.span
          className="block h-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay }}
          style={{
            background: verdict.color,
            boxShadow: `0 0 8px color-mix(in srgb, ${verdict.color} 50%, transparent)`,
          }}
        />
      </div>
    </motion.div>
  );
}

function FindingCompact({ f }: { f: AnalysisFinding }) {
  const sevColor: Record<Severity, string> = {
    critical: "#F97316",
    high: "#FB923C",
    medium: "rgba(255,255,255,0.55)",
    low: "rgba(255,255,255,0.45)",
    info: "rgba(255,255,255,0.35)",
  };
  return (
    <div
      className="rounded-xl px-3.5 py-3 flex flex-col h-full"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <span
        className="text-[9.5px] uppercase tracking-[0.16em] mb-1.5"
        style={{ color: sevColor[f.severity] }}
      >
        {SEVERITY_LABEL[f.severity]}
      </span>
      <p
        className="text-[13px] leading-[1.35] text-white font-light"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        {f.title}
      </p>
      <p className="mt-1.5 text-[11.5px] leading-[1.45] text-white/48 font-light line-clamp-3 flex-1">
        {f.detail}
      </p>
      {f.recommendation ? (
        <p className="mt-2 text-[11px] leading-[1.4] font-light" style={{ color: "var(--brand-primary)" }}>
          {f.recommendation.replace(/^→\s*/, "")}
        </p>
      ) : null}
    </div>
  );
}

function RecommendationCompact({ rec }: { rec: AnalysisRecommendation }) {
  return (
    <div
      className="rounded-2xl p-5 mb-4"
      style={{
        border: "1px solid var(--brand-card-border)",
        background:
          "linear-gradient(180deg, var(--brand-glow-soft) 0%, rgba(255,255,255,0.01) 100%)",
        boxShadow: "0 20px 50px rgba(0,0,0,0.35)",
      }}
    >
      <p
        className="text-[11px] uppercase tracking-[0.22em] mb-2"
        style={{ color: "var(--brand-primary)", opacity: 0.8 }}
      >
        Unser Vorschlag
      </p>
      <h3
        className="text-[1.35rem] leading-[1.15] text-white sm:text-[1.5rem]"
        style={{
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 300,
          letterSpacing: "-0.02em",
        }}
      >
        <span
          style={{
            background: "var(--brand-headline-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {rec.name}
        </span>
      </h3>
      <p className="mt-2 text-[13.5px] leading-[1.55] text-white/60 font-light">{rec.oneliner}</p>
      {rec.modules.length > 0 ? (
        <ul className="mt-3 space-y-1">
          {rec.modules.slice(0, 3).map((m) => (
            <li key={m.name} className="text-[12px] text-white/45 font-light flex gap-2">
              <span style={{ color: "var(--brand-primary)" }}>·</span>
              <span>{m.name}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CTABlock({ href, brandName }: { href: string; brandName: string }) {
  return (
    <div
      className="rounded-2xl px-5 py-5"
      style={{
        border: "1px solid var(--brand-card-border)",
        background: "rgba(255,255,255,0.02)",
      }}
    >
      <p
        className="text-[1.1rem] leading-[1.35] text-white font-light"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        Klingt das nach Ihnen?
      </p>
      <p className="mt-1.5 text-[13px] text-white/45 font-light leading-relaxed">
        In 20 Minuten besprechen wir, was für Sie am meisten bringt — unverbindlich.
      </p>
      <Link
        href={href}
        className="group relative mt-4 inline-flex w-full items-center justify-center gap-3 rounded-full px-6 py-3.5 text-[11px] uppercase transition-all duration-500 hover:gap-4 sm:text-[12px]"
        style={{
          color: "rgba(255,255,255,0.92)",
          background: "transparent",
          border: "1px solid var(--brand-card-border)",
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          letterSpacing: "0.22em",
          fontWeight: 500,
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            border: "1px solid var(--brand-line-mid)",
            boxShadow: "0 0 28px var(--brand-glow-mid)",
          }}
        />
        <span className="relative">Kostenlos besprechen</span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          aria-hidden
          className="relative transition-transform duration-500 group-hover:translate-x-0.5"
        >
          <path
            d="M5 12h14M13 6l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>
      <p className="mt-3 text-center text-[10px] text-white/30 font-light">
        {brandName} · persönlich, ohne Verkaufsdruck
      </p>
    </div>
  );
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-4 py-3 text-[13px] leading-[1.5] text-white/50 font-light"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {children}
    </div>
  );
}
