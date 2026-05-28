"use client";

/**
 * SystemAnalyseEngine — Business Operating System
 * ─────────────────────────────────────────────────────────────
 * Modulare Diagnose-Engine. Kein Formular, kein Stepper.
 * Kontinuierlicher Diagnose-Stream aus „System Scan Cards".
 *
 * Architektur:
 *   - Engine: lib/systemanalyse/engine/{types,modules,engine}
 *   - UI:     diese Datei (System-Scan-Cards + Live-Score + Report)
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";
import {
  buildInitialQueue,
  generateReport,
  getModuleById,
  resolveFollowUps,
} from "@/lib/systemanalyse/engine/engine";
import type {
  AnalysisModule,
  AnalysisOption,
  ModuleAnswer,
  ModuleCategory,
  ReportInsight,
} from "@/lib/systemanalyse/engine/types";

const CATEGORY_LABEL_DE: Record<ModuleCategory, string> = {
  growth: "Wachstum & neue Kunden",
  sales: "Vertrieb",
  marketing: "Marketing",
  operations: "Abläufe & Organisation",
  automation: "Automatisierung",
  finance: "Finanzen (Überblick)",
  product: "Angebot & Positionierung",
  team: "Team & Aufbau",
  crm: "Kunden & CRM",
  "digital-maturity": "Digitaler Systemgrad",
};

function categoryLabelDE(cat: ModuleCategory): string {
  return CATEGORY_LABEL_DE[cat] ?? String(cat);
}

// ─────────────────────────────────────────────────────────────
// Sub-Component: SystemScanCard
// Eine Diagnose-Frage als Analyse-Modul — nicht als Formular.
// ─────────────────────────────────────────────────────────────
function SystemScanCard({
  module: mod,
  answer,
  onAnswer,
  onFreeText,
  isActive,
  index,
  accentRgb,
  isAnalyzing,
  layout = "default",
  totalSteps,
}: {
  module: AnalysisModule;
  answer?: ModuleAnswer;
  onAnswer: (optionId: string) => void;
  onFreeText: (text: string) => void;
  isActive: boolean;
  index: number;
  accentRgb: string;
  isAnalyzing: boolean;
  layout?: "default" | "immersive";
  /** Für „Schritt 3 von 8" in der immersive Variante */
  totalSteps?: number;
}) {
  const [showFreeText, setShowFreeText] = useState(false);
  const selectedId = answer?.optionId;
  const isAnswered = !!selectedId;
  const immersive = layout === "immersive";

  const stepLine = immersive
    ? totalSteps !== undefined && totalSteps > 0
      ? `Schritt ${index + 1} von ${totalSteps}`
      : `Schritt ${index + 1}`
    : String(index + 1).padStart(2, "0");

  const categoryLine = immersive
    ? categoryLabelDE(mod.category)
    : mod.scanLabel ?? `Scan · ${mod.category}`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      animate={{
        opacity: isActive ? 1 : immersive ? 0.58 : 0.72,
        y: 0,
        filter: immersive && !isActive ? "blur(1px)" : "blur(0px)",
      }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full"
      style={{
        transition: immersive ? "transform 0.35s ease" : undefined,
        transform: immersive && !isActive ? "scale(0.985)" : "scale(1)",
      }}
    >
      {/* Card Body */}
      <div
        className={immersive ? "relative rounded-3xl overflow-hidden" : "relative rounded-2xl overflow-hidden"}
        style={{
          background: immersive
            ? "linear-gradient(145deg, rgba(26,26,42,0.72) 0%, rgba(14,14,26,0.55) 50%, rgba(12,12,22,0.50) 100%)"
            : "linear-gradient(135deg, rgba(20,20,32,0.62) 0%, rgba(12,12,22,0.42) 100%)",
          backdropFilter: immersive ? "blur(40px) saturate(185%)" : "blur(36px) saturate(180%)",
          WebkitBackdropFilter: immersive ? "blur(40px) saturate(185%)" : "blur(36px) saturate(180%)",
          border: isActive
            ? `1px solid rgba(${accentRgb},${immersive ? 0.42 : 0.35})`
            : "1px solid rgba(255,255,255,0.06)",
          boxShadow: isActive
            ? immersive
              ? `0 28px 70px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.09), 0 0 50px rgba(${accentRgb},0.22)`
              : `0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 40px rgba(${accentRgb},0.18)`
            : immersive
              ? "0 12px 32px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)"
              : "0 14px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
          transition: "border-color 0.45s ease, box-shadow 0.45s ease, opacity 0.35s ease",
        }}
      >
        {/* Top hairline */}
        <div
          aria-hidden
          className={immersive ? "absolute inset-x-10 top-0 h-px" : "absolute inset-x-6 top-0 h-px"}
          style={{
            background: isActive
              ? `linear-gradient(90deg, transparent, rgba(${accentRgb},0.75), transparent)`
              : "linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)",
          }}
        />

        {/* Kopfzeile */}
        <div
          className={
            immersive
              ? "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between px-8 sm:px-10 pt-8 sm:pt-10 pb-2"
              : "flex items-center justify-between gap-4 px-7 sm:px-9 pt-7 pb-3"
          }
        >
          <div
            className={
              immersive
                ? "flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 min-w-0"
                : "flex items-center gap-3 min-w-0"
            }
          >
            {!immersive && (
              <span
                className="inline-flex h-6 min-w-[28px] items-center justify-center rounded-md px-1.5 text-[10px] tracking-[0.18em]"
                style={{
                  background: isActive
                    ? `rgba(${accentRgb},0.16)`
                    : "rgba(255,255,255,0.04)",
                  color: isActive ? `rgb(${accentRgb})` : "rgba(255,255,255,0.4)",
                  border: isActive
                    ? `1px solid rgba(${accentRgb},0.36)`
                    : "1px solid rgba(255,255,255,0.08)",
                  fontFamily:
                    "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 600,
                }}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            )}
            {immersive && (
              <span
                className="inline-flex w-fit rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold tracking-wide"
                style={{
                  background: `rgba(${accentRgb},0.14)`,
                  color: `rgb(${accentRgb})`,
                  border: `1px solid rgba(${accentRgb},0.38)`,
                  fontFamily:
                    "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {stepLine}
              </span>
            )}
            <span
              className={
                immersive
                  ? "text-[13px] sm:text-sm font-medium tracking-wide text-white/55 leading-snug max-w-xl"
                  : "text-[10.5px] uppercase tracking-[0.24em] text-white/45"
              }
              style={
                immersive
                  ? { fontFamily: "var(--font-headline), system-ui, sans-serif" }
                  : {
                      fontFamily:
                        "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                      fontWeight: 600,
                    }
              }
            >
              {!immersive ? categoryLine : `Thema · ${categoryLine}`}
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 sm:justify-center flex-shrink-0">
            {isActive && isAnalyzing && (
              <motion.span
                className={immersive ? "text-[11.5px] font-semibold tracking-wide" : "text-[10px] uppercase tracking-[0.22em]"}
                style={{
                  color: `rgb(${accentRgb})`,
                  fontFamily:
                    immersive
                      ? "var(--font-headline), system-ui, sans-serif"
                      : "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontWeight: immersive ? 500 : 600,
                }}
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                {immersive ? "Wird gespeichert …" : "Analyzing…"}
              </motion.span>
            )}
            {isAnswered && !isAnalyzing && (
              <span
                className={`inline-flex items-center gap-1.5 ${immersive ? "text-[11.5px] font-semibold" : "text-[10px] uppercase tracking-[0.22em]"}`}
                style={{
                  color: `rgb(${accentRgb})`,
                  fontFamily: immersive
                    ? "var(--font-headline), system-ui, sans-serif"
                    : "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontWeight: immersive ? 500 : 600,
                }}
              >
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
                  <path
                    d="M2.5 6.2l2.5 2.5L9.5 3.7"
                    stroke={`rgb(${accentRgb})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {immersive ? "Übernommen" : "Logged"}
              </span>
            )}
          </div>
        </div>

        {/* Frage */}
        <div className={immersive ? "px-8 sm:px-10" : "px-7 sm:px-9"}>
          <h3
            className="text-white"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: immersive ? 500 : 400,
              letterSpacing: immersive ? "-0.03em" : "-0.025em",
              lineHeight: immersive ? 1.22 : 1.18,
              fontSize: immersive
                ? "clamp(1.45rem, 4.2vw, 2rem)"
                : "clamp(1.25rem, 2.4vw, 1.7rem)",
            }}
          >
            {mod.question}
          </h3>

          {/* Kurz-Erklärung */}
          <div
            className={
              immersive
                ? "mt-5 rounded-2xl px-5 py-4 sm:p-5 border border-white/[0.08] bg-white/[0.035]"
                : undefined
            }
            style={
              immersive ? { boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)" } : undefined
            }
          >
            <p
              className={immersive ? "mt-0 text-white/62 leading-relaxed text-[15px]" : "mt-3 text-white/45 leading-[1.6]"}
              style={{
                fontFamily: "var(--font-body), system-ui, sans-serif",
                fontSize: immersive ? undefined : "0.92rem",
                fontWeight: 300,
                letterSpacing: immersive ? undefined : "0.005em",
                maxWidth: "640px",
              }}
            >
              {immersive && (
                <span className="block mb-2 text-[10px] uppercase tracking-[0.22em] text-white/38">
                  Kurz erklärt
                </span>
              )}
              {mod.explanation}
            </p>
          </div>
        </div>

        {/* Antworten */}
        <div className={(immersive ? "px-8 sm:px-10 pt-8 pb-1" : "px-7 sm:px-9 pt-7 pb-2")}>
          {!immersive && (
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/32 mb-3">
              Eine Option wählen
            </p>
          )}
          {immersive && (
            <p
              className="text-[12.5px] font-medium text-white/50 mb-4"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            >
              Tippen oder klicken – eine Antwort reicht aus.
            </p>
          )}
          <div
            className={
              immersive ? "grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5" : "flex flex-wrap gap-2"
            }
          >
            {mod.options.map((opt) => (
              <Chip
                key={opt.id}
                option={opt}
                selected={selectedId === opt.id}
                accentRgb={accentRgb}
                onClick={() => onAnswer(opt.id)}
                layout={immersive ? "comfortable" : "compact"}
              />
            ))}
          </div>
        </div>

        {/* Freitext optional */}
        {mod.freeText && (
          <div className={(immersive ? "px-8 sm:px-10 pt-4 pb-8 sm:pb-10" : "px-7 sm:px-9 pt-3 pb-7")}>
            {!showFreeText ? (
              <button
                type="button"
                onClick={() => setShowFreeText(true)}
                className={
                  immersive
                    ? "group inline-flex items-center gap-3 rounded-xl w-full sm:w-auto justify-center sm:justify-start px-5 py-3.5 border border-white/[0.1] bg-white/[0.03] text-[14px] text-white/70 hover:bg-white/[0.06] hover:border-white/[0.16] hover:text-white/92 transition-colors"
                    : "group inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] text-white/35 hover:text-white/70 transition-colors"
                }
                style={
                  !immersive
                    ? {
                        fontFamily:
                          "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                        fontWeight: 500,
                      }
                    : { fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 500 }
                }
              >
                {!immersive && (
                  <span
                    className="inline-block h-[1px] w-5 transition-all group-hover:w-7"
                    style={{ background: "currentColor" }}
                  />
                )}
                {immersive && (
                  <span className="text-lg leading-none opacity-55 group-hover:opacity-90 transition-opacity">
                    +
                  </span>
                )}
                {immersive ? "Optional: einen Satz Kontext ergänzen" : mod.freeText.label}
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
              >
                <label
                  className="block mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-white/42"
                  style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
                >
                  {mod.freeText.label}
                </label>
                <textarea
                  rows={immersive ? 3 : 2}
                  defaultValue={answer?.freeText ?? ""}
                  onBlur={(e) => onFreeText(e.target.value.trim())}
                  placeholder={mod.freeText.placeholder}
                  className={
                    immersive
                      ? "w-full min-h-[112px] resize-none rounded-xl px-4 py-3.5 text-[15px] text-white placeholder:text-white/28 focus:outline-none focus-visible:ring-2"
                      : "w-full resize-none rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 focus:outline-none"
                  }
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: `1px solid rgba(${accentRgb},0.15)`,
                    fontFamily:
                      "var(--font-body), system-ui, sans-serif",
                    fontWeight: 300,
                    letterSpacing: "0.005em",
                    ...(immersive ? { outlineColor: `rgba(${accentRgb},0.45)` } : {}),
                  }}
                />
              </motion.div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Chip: Auswahlfeld (compact = Inline, comfortable = gut bedienbar)
// ─────────────────────────────────────────────────────────────
function Chip({
  option,
  selected,
  accentRgb,
  onClick,
  layout = "compact",
}: {
  option: AnalysisOption;
  selected: boolean;
  accentRgb: string;
  onClick: () => void;
  layout?: "compact" | "comfortable";
}) {
  const large = layout === "comfortable";
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: large ? 1.012 : 1.025 }}
      whileTap={{ scale: large ? 0.992 : 0.97 }}
      className={
        large
          ? "group relative flex w-full min-h-[54px] sm:min-h-[52px] items-center gap-4 rounded-2xl px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent focus-visible:ring-white/35"
          : "group relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12.5px] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      }
      style={{
        background: selected
          ? `linear-gradient(135deg, rgba(${accentRgb},${large ? 0.26 : 0.22}), rgba(${accentRgb},${large ? 0.12 : 0.10}))`
          : large
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.035)",
        border: selected
          ? `1px solid rgba(${accentRgb},${large ? 0.65 : 0.55})`
          : "1px solid rgba(255,255,255,0.1)",
        color: selected ? "white" : "rgba(255,255,255,0.86)",
        boxShadow: selected
          ? large
            ? `0 10px 28px rgba(${accentRgb},0.28), inset 0 1px 0 rgba(255,255,255,0.12)`
            : `0 6px 20px rgba(${accentRgb},0.3), inset 0 1px 0 rgba(255,255,255,0.1), 0 0 16px rgba(${accentRgb},0.32)`
          : large
            ? "inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 2px 6px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)",
        fontFamily: "var(--font-headline), system-ui, sans-serif",
        fontWeight: large ? 550 : 500,
        letterSpacing: large ? "-0.01em" : "0.01em",
        fontSize: large ? "clamp(14.5px, 3.9vw, 16px)" : undefined,
        transition:
          "background 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease, color 0.35s ease",
      }}
    >
      <span
        className={`inline-block rounded-full shrink-0 transition-all duration-300 ${large ? "h-2.5 w-2.5" : "h-1.5 w-1.5"}`}
        style={{
          background: selected
            ? `rgb(${accentRgb})`
            : "rgba(255,255,255,0.35)",
          boxShadow: selected ? `0 0 10px rgba(${accentRgb},0.85)` : "none",
        }}
      />
      <span className={large ? "flex-1 leading-snug" : undefined}>{option.label}</span>
      {large && selected && (
        <svg
          className="shrink-0 opacity-95"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M20 7L10 17l-5-5"
            stroke={`rgb(${accentRgb})`}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────
// System Report Card
// ─────────────────────────────────────────────────────────────
function SystemReportCard({
  answers,
  accentRgb,
  primaryHref,
  secondaryHref,
  onReset,
}: {
  answers: ModuleAnswer[];
  accentRgb: string;
  primaryHref: string;
  secondaryHref: string;
  onReset: () => void;
}) {
  const report = useMemo(() => generateReport(answers), [answers]);
  const [scoreDisplay, setScoreDisplay] = useState(0);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const target = report.score.total;
    const duration = 1700;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 5);
      setScoreDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [report.score.total]);

  const ringColor =
    report.score.band === "critical"
      ? "rgb(255,90,90)"
      : report.score.band === "manual"
        ? "rgb(255,170,80)"
        : `rgb(${accentRgb})`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
      className="relative w-full rounded-3xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, rgba(20,20,32,0.7) 0%, rgba(12,12,22,0.5) 100%)",
        backdropFilter: "blur(40px) saturate(190%)",
        WebkitBackdropFilter: "blur(40px) saturate(190%)",
        border: `1px solid rgba(${accentRgb},0.22)`,
        boxShadow: `0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 50px rgba(${accentRgb},0.16)`,
      }}
    >
      {/* Brand corner glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: "-15%",
          right: "-8%",
          width: "55%",
          height: "55%",
          background: `radial-gradient(circle, rgba(${accentRgb},0.22) 0%, transparent 60%)`,
          filter: "blur(50px)",
        }}
      />

      {/* Header */}
      <div
        className="relative flex items-center justify-between gap-4 px-8 py-5"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div className="flex items-center gap-3">
          <span className="relative inline-flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
              style={{ background: `rgb(${accentRgb})` }}
            />
            <span
              className="relative inline-flex rounded-full h-2 w-2"
              style={{
                background: `rgb(${accentRgb})`,
                boxShadow: `0 0 10px rgba(${accentRgb},0.85)`,
              }}
            />
          </span>
          <span
            className="text-[10.5px] uppercase tracking-[0.24em] text-white/75"
            style={{
              fontFamily:
                "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
              fontWeight: 600,
            }}
          >
            System Report · Generated
          </span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[10.5px] uppercase tracking-[0.2em] text-white/35 hover:text-white/75 transition-colors"
          style={{
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
            fontWeight: 500,
          }}
        >
          Re-run Scan
        </button>
      </div>

      {/* Score block */}
      <div className="relative grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-10 px-8 py-12">
        {/* Score Ring */}
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-[220px] h-[220px]">
            <svg viewBox="0 0 220 220" className="absolute inset-0 -rotate-90">
              <defs>
                <linearGradient
                  id="ringGradReport"
                  x1="0"
                  y1="0"
                  x2="1"
                  y2="1"
                >
                  <stop offset="0" stopColor={ringColor} stopOpacity="0.5" />
                  <stop offset="1" stopColor={ringColor} stopOpacity="1" />
                </linearGradient>
              </defs>
              <circle
                cx="110"
                cy="110"
                r="90"
                fill="none"
                stroke="rgba(255,255,255,0.04)"
                strokeWidth="1"
              />
              <circle
                cx="110"
                cy="110"
                r="78"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="4"
              />
              <motion.circle
                cx="110"
                cy="110"
                r="78"
                fill="none"
                stroke="url(#ringGradReport)"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 78}
                initial={{ strokeDashoffset: 2 * Math.PI * 78 }}
                animate={{
                  strokeDashoffset:
                    2 * Math.PI * 78 * (1 - report.score.total / 100),
                }}
                transition={{
                  duration: 1.7,
                  ease: [0.22, 1, 0.36, 1],
                  delay: 0.2,
                }}
                style={{
                  filter: `drop-shadow(0 0 10px ${ringColor.replace("rgb(", "rgba(").replace(")", ",0.85)")})`,
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div
                className="text-[10px] uppercase tracking-[0.24em] text-white/40 mb-1"
                style={{
                  fontFamily:
                    "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontWeight: 600,
                }}
              >
                Maturity
              </div>
              <div
                className="text-white"
                style={{
                  fontFamily:
                    "var(--font-headline), system-ui, sans-serif",
                  fontWeight: 500,
                  fontSize: "3.4rem",
                  letterSpacing: "-0.05em",
                  lineHeight: 1,
                  fontVariantNumeric: "tabular-nums",
                  textShadow: `0 2px 24px rgba(0,0,0,0.45), 0 0 38px ${ringColor.replace("rgb(", "rgba(").replace(")", ",0.55)")}`,
                }}
              >
                {scoreDisplay}
                <span
                  className="text-white/45"
                  style={{ fontSize: "1.4rem", marginLeft: "0.05em" }}
                >
                  %
                </span>
              </div>
              <div
                className="mt-2 text-[10px] uppercase tracking-[0.2em]"
                style={{
                  color: ringColor,
                  fontFamily:
                    "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontWeight: 600,
                }}
              >
                {report.score.bandLabel}
              </div>
            </div>
          </div>
        </div>

        {/* Insight Buckets */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InsightBucket
            title="Growth Bottlenecks"
            insights={report.growthBottlenecks}
            tone="warn"
            accentRgb={accentRgb}
          />
          <InsightBucket
            title="Automation Gaps"
            insights={report.automationGaps}
            tone="brand"
            accentRgb={accentRgb}
          />
          <InsightBucket
            title="Revenue Leakage"
            insights={report.revenueLeakage}
            tone="danger"
            accentRgb={accentRgb}
          />
          <InsightBucket
            title="Structure Gaps"
            insights={report.structureGaps}
            tone="neutral"
            accentRgb={accentRgb}
          />
        </div>
      </div>

      {/* Priority Actions */}
      {report.priorityActions.length > 0 && (
        <div
          className="relative px-8 py-9"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.24em] text-white/45 mb-5"
            style={{
              fontFamily:
                "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
              fontWeight: 600,
            }}
          >
            Priority Actions · Top {report.priorityActions.length}
          </div>
          <div className="grid grid-cols-1 gap-3">
            {report.priorityActions.map((action, i) => (
              <motion.div
                key={`${action.category}-${i}`}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.55 }}
                className="flex items-center gap-4 rounded-xl px-4 py-3.5"
                style={{
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.08), rgba(${accentRgb},0.02))`,
                  border: `1px solid rgba(${accentRgb},0.22)`,
                  boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 12px rgba(${accentRgb},0.08)`,
                }}
              >
                <span
                  className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[10px]"
                  style={{
                    background: `rgba(${accentRgb},0.22)`,
                    border: `1px solid rgba(${accentRgb},0.4)`,
                    color: `rgb(${accentRgb})`,
                    fontFamily:
                      "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span
                  className="flex-1 text-white/85"
                  style={{
                    fontFamily:
                      "var(--font-body), system-ui, sans-serif",
                    fontSize: "0.94rem",
                    fontWeight: 300,
                    lineHeight: 1.5,
                  }}
                >
                  {action.text}
                </span>
                {action.recommendedModule && (
                  <span
                    className="hidden sm:inline-block text-[10px] uppercase tracking-[0.2em] flex-shrink-0"
                    style={{
                      color: `rgb(${accentRgb})`,
                      fontFamily:
                        "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                      fontWeight: 600,
                    }}
                  >
                    {action.recommendedModule}
                  </span>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Setup */}
      {report.recommendedSetup.length > 0 && (
        <div
          className="relative px-8 py-7"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="text-[10px] uppercase tracking-[0.24em] text-white/45 mb-4"
            style={{
              fontFamily:
                "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
              fontWeight: 600,
            }}
          >
            Recommended NEXUS Setup
          </div>
          <div className="flex flex-wrap gap-2">
            {report.recommendedSetup.map((mod) => (
              <span
                key={mod}
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.18em]"
                style={{
                  background: `rgba(${accentRgb},0.10)`,
                  border: `1px solid rgba(${accentRgb},0.32)`,
                  color: `rgb(${accentRgb})`,
                  fontFamily:
                    "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontWeight: 600,
                  boxShadow: `0 0 14px rgba(${accentRgb},0.18)`,
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: `rgb(${accentRgb})`,
                    boxShadow: `0 0 8px rgba(${accentRgb},0.85)`,
                  }}
                />
                {mod}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA Footer */}
      <div
        className="relative flex flex-col sm:flex-row items-center justify-between gap-4 px-8 py-7"
        style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="text-[11px] uppercase tracking-[0.2em] text-white/45"
          style={{
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
            fontWeight: 500,
          }}
        >
          Ready to deploy your operating system?
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={secondaryHref}
            className="text-[12px] uppercase tracking-[0.18em] text-white/55 hover:text-white/95 transition-colors"
            style={{
              fontFamily:
                "var(--font-headline), system-ui, sans-serif",
              fontWeight: 500,
            }}
          >
            Live-System ansehen
          </Link>
          <motion.div whileHover={{ scale: 1.025 }} whileTap={{ scale: 0.985 }}>
            <Link
              href={primaryHref}
              className="group relative inline-flex items-center gap-2 rounded-2xl px-6 py-[12px] text-[13px] font-medium text-white overflow-hidden"
              style={{
                fontFamily:
                  "var(--font-headline), system-ui, sans-serif",
                background: `linear-gradient(135deg, rgba(${accentRgb},0.55), rgba(${accentRgb},0.9))`,
                border: `1px solid rgba(${accentRgb},0.5)`,
                boxShadow: `0 10px 32px rgba(${accentRgb},0.34), inset 0 1px 0 rgba(255,255,255,0.18)`,
              }}
            >
              <span
                aria-hidden
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
              />
              <span className="relative">System aufbauen</span>
              <span className="relative transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function InsightBucket({
  title,
  insights,
  tone,
  accentRgb,
}: {
  title: string;
  insights: ReportInsight[];
  tone: "warn" | "brand" | "danger" | "neutral";
  accentRgb: string;
}) {
  const colorMap = {
    warn: "rgb(255,170,80)",
    brand: `rgb(${accentRgb})`,
    danger: "rgb(255,90,90)",
    neutral: "rgba(255,255,255,0.7)",
  };
  const color = colorMap[tone];

  return (
    <div
      className="rounded-xl px-4 py-4"
      style={{
        background: "rgba(255,255,255,0.025)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{
            color,
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
            fontWeight: 600,
          }}
        >
          {title}
        </div>
        <div
          className="text-[10px] tracking-[0.18em] text-white/35"
          style={{
            fontFamily:
              "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {insights.length.toString().padStart(2, "0")}
        </div>
      </div>
      {insights.length === 0 ? (
        <div
          className="text-white/25 text-[12px]"
          style={{
            fontFamily:
              "var(--font-body), system-ui, sans-serif",
            fontWeight: 300,
          }}
        >
          Keine Auffälligkeiten.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {insights.slice(0, 3).map((ins, i) => (
            <li
              key={`${ins.moduleId}-${i}`}
              className="flex items-start gap-2.5 text-white/75 text-[12.5px] leading-[1.5]"
              style={{
                fontFamily:
                  "var(--font-body), system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
              <span
                className="mt-[7px] inline-block h-1 w-1 rounded-full flex-shrink-0"
                style={{
                  background: color,
                  boxShadow:
                    ins.severity === "high"
                      ? `0 0 8px ${color}`
                      : "none",
                }}
              />
              <span>{ins.text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function SystemAnalyseEngine({
  variant = "section",
}: {
  /**
   * `section`  → eingebettet auf der Homepage (volle Hero-Headline + großes Padding)
   * `subpage`  → eigene Sub-Route (kompaktere Headline, geringeres Top-Padding,
   *               weil die Page bereits eine Return-Bar liefert)
   */
  variant?: "section" | "subpage";
} = {}) {
  const isSubpage = variant === "subpage";
  const brand = useBrand();
  const accentRgb = brand.theme.accentRgb;
  const primaryHref = resolveBrandNavHref(
    brand.hero.ctaPrimary.href,
    brand.id
  );
  const secondaryHref = resolveBrandNavHref(
    brand.hero.ctaSecondary.href,
    brand.id
  );

  // Engine State
  const [queue, setQueue] = useState<string[]>(() => buildInitialQueue());
  const [answers, setAnswers] = useState<ModuleAnswer[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [reportShown, setReportShown] = useState(false);

  // Refs für Auto-Scroll zur nächsten Card
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const activeIndex = answers.length;
  const activeModuleId =
    activeIndex < queue.length ? queue[activeIndex] : null;
  const allDone = activeIndex >= queue.length;

  // Trigger Report
  useEffect(() => {
    if (allDone && !reportShown && answers.length >= 3) {
      const t = setTimeout(() => setReportShown(true), 700);
      return () => clearTimeout(t);
    }
  }, [allDone, reportShown, answers.length]);

  // Nach Abschluss: zurück nach Seitenkopf scrollen (Report sitzt weiter unten durch auto-scroll zur letzten Karte)
  useEffect(() => {
    if (!reportShown) return;
    const t = window.setTimeout(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(t);
  }, [reportShown]);

  const handleAnswer = useCallback(
    (moduleId: string, optionId: string) => {
      const mod = getModuleById(moduleId);
      if (!mod) return;

      // Add answer
      const newAnswer: ModuleAnswer = {
        moduleId,
        optionId,
        timestamp: Date.now(),
      };
      setAnswers((prev) => {
        const filtered = prev.filter((a) => a.moduleId !== moduleId);
        return [...filtered, newAnswer];
      });

      // Resolve follow-ups (kontextabhängiges Nachladen)
      setQueue((prev) => resolveFollowUps(mod, optionId, prev));

      // Analyzing-Pulse + Auto-Scroll
      setIsAnalyzing(true);
      setTimeout(() => setIsAnalyzing(false), 800);
    },
    []
  );

  const handleFreeText = useCallback(
    (moduleId: string, text: string) => {
      setAnswers((prev) =>
        prev.map((a) =>
          a.moduleId === moduleId ? { ...a, freeText: text } : a
        )
      );
    },
    []
  );

  const handleReset = useCallback(() => {
    setQueue(buildInitialQueue());
    setAnswers([]);
    setReportShown(false);
    setIsAnalyzing(false);
  }, []);

  // Auto-scroll to active card when new one appears
  useEffect(() => {
    if (!activeModuleId) return;
    const el = cardRefs.current[activeModuleId];
    if (!el) return;
    // Smooth scroll into view (mit Offset für sticky bar)
    setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 200);
  }, [activeModuleId]);

  // Visible modules: alle bisher beantworteten + den aktuellen
  const visibleQueue = useMemo(() => {
    if (allDone) return queue;
    return queue.slice(0, activeIndex + 1);
  }, [queue, activeIndex, allDone]);

  return (
    <section
      className={
        isSubpage
          ? "relative pt-6 pb-20 sm:pb-24 lg:pb-28 overflow-hidden"
          : "relative py-24 sm:py-28 lg:py-36 overflow-hidden"
      }
      aria-labelledby="diagnosis-heading"
      style={{
        background:
          "linear-gradient(180deg, #050509 0%, #07070d 30%, #06060c 70%, #050509 100%)",
        isolation: "isolate",
      }}
    >
      {/* ───── BG: Aurora Mesh ───── */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute"
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -25, 20, 0],
          scale: [1, 1.06, 0.97, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        style={{
          top: "-15%",
          left: "20%",
          width: "60%",
          height: "75%",
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(${accentRgb},0.22) 0%, rgba(${accentRgb},0.08) 35%, transparent 70%)`,
          filter: "blur(90px)",
          mixBlendMode: "screen",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute"
        animate={{
          x: [0, -50, 35, 0],
          y: [0, 30, -20, 0],
          scale: [1, 0.94, 1.05, 1],
        }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
        style={{
          bottom: "-20%",
          right: "10%",
          width: "55%",
          height: "70%",
          background: `radial-gradient(ellipse, rgba(140,90,255,0.16) 0%, rgba(${accentRgb},0.06) 40%, transparent 70%)`,
          filter: "blur(110px)",
          mixBlendMode: "screen",
        }}
      />

      {/* Grid hint */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.05,
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 75%)",
        }}
      />

      {/* Vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Film grain */}
      <div
        aria-hidden
        className="hero-noise pointer-events-none absolute inset-0"
        style={{ opacity: 0.045, mixBlendMode: "overlay" }}
      />

      <div className="relative z-10 mx-auto max-w-[920px] px-6 sm:px-8 lg:px-12">
        {/* ── Heading ── */}
        {isSubpage ? (
          <header className="relative max-w-3xl mx-auto mb-10 sm:mb-12 lg:mb-14 text-center">
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-3"
            >
              <span
                aria-hidden
                className="block h-px w-10"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.7))`,
                }}
              />
              <span
                className="text-[10.5px] uppercase tracking-[0.32em]"
                style={{
                  fontFamily:
                    "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontWeight: 600,
                  color: `rgb(${accentRgb})`,
                }}
              >
                Tiefere Systemanalyse
              </span>
              <span
                aria-hidden
                className="block h-px w-10"
                style={{
                  background: `linear-gradient(90deg, rgba(${accentRgb},0.7), transparent)`,
                }}
              />
            </motion.div>

            {/* H1 für a11y, visuell versteckt — der Sub-Page-Header bleibt minimal */}
            <h1 id="diagnosis-heading" className="sr-only">
              Tiefere Systemanalyse
            </h1>
          </header>
        ) : (
          <header className="relative max-w-3xl mx-auto mb-12 sm:mb-14 lg:mb-16 text-center">
            <motion.h2
              id="diagnosis-heading"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
              className="font-medium tracking-[-0.04em] text-white"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontSize: "clamp(28px, 2.85vw, 44px)",
                lineHeight: 1.12,
                letterSpacing: "-0.035em",
                textShadow: `0 1px 20px rgba(0,0,0,0.45), 0 0 48px rgba(${accentRgb},0.08)`,
              }}
            >
              <span
                className="block"
                style={{ color: "rgba(255,255,255,0.94)" }}
              >
                Wo Ihr Unternehmen
              </span>
              <span
                className="block"
                style={{
                  background:
                    "linear-gradient(125deg, #D4B4FF 0%, #C084FC 42%, #A855F7 72%, #9333EA 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  filter: "drop-shadow(0 0 18px rgba(168,85,247,0.28))",
                }}
              >
                gerade verliert.
              </span>
            </motion.h2>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              whileInView={{ opacity: 1, scaleX: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 1.1,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.25,
              }}
              className="mx-auto mt-7 h-px w-24 origin-center"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.85), transparent)`,
                boxShadow: `0 0 10px rgba(${accentRgb},0.55)`,
              }}
            />

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.9,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.35,
              }}
              className="mx-auto mt-5 max-w-[560px] text-white/60 leading-[1.65]"
              style={{
                fontFamily: "var(--font-body), system-ui, sans-serif",
                fontSize: "clamp(0.9rem, 0.95vw, 1.05rem)",
                fontWeight: 300,
                letterSpacing: "0.01em",
              }}
            >
              Diese Engine analysiert Ihr Unternehmen Modul für Modul
              <span className="text-white/30"> – </span>
              kein Formular, sondern ein Diagnose-Stream.
            </motion.p>
          </header>
        )}

        {/* ── Diagnose Stream ── */}
        {!reportShown ? (
          <div className={isSubpage ? "flex flex-col gap-8" : "flex flex-col gap-5"}>
            <AnimatePresence initial={false}>
              {visibleQueue.map((moduleId, i) => {
                const mod = getModuleById(moduleId);
                if (!mod) return null;
                const answer = answers.find((a) => a.moduleId === moduleId);
                const isActive = i === activeIndex;
                return (
                  <div
                    key={moduleId}
                    ref={(el) => {
                      cardRefs.current[moduleId] = el;
                    }}
                  >
                    <SystemScanCard
                      module={mod}
                      answer={answer}
                      onAnswer={(optId) => handleAnswer(moduleId, optId)}
                      onFreeText={(t) => handleFreeText(moduleId, t)}
                      isActive={isActive}
                      index={i}
                      accentRgb={accentRgb}
                      isAnalyzing={isActive && isAnalyzing}
                      layout={isSubpage ? "immersive" : "default"}
                      totalSteps={queue.length}
                    />
                  </div>
                );
              })}
            </AnimatePresence>

            {/* Manual finish button if user wants to wrap up early after 3+ answers */}
            {answers.length >= 3 && !allDone && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                type="button"
                onClick={() => setReportShown(true)}
                className="self-center mt-6 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.2em] text-white/65 hover:text-white transition-colors"
                style={{
                  fontFamily:
                    "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontWeight: 600,
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid rgba(${accentRgb},0.32)`,
                  boxShadow: `0 0 14px rgba(${accentRgb},0.16)`,
                }}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{
                    background: `rgb(${accentRgb})`,
                    boxShadow: `0 0 8px rgba(${accentRgb},0.85)`,
                  }}
                />
                {isSubpage ? "Auswertung jetzt anzeigen" : "Generate System Report"}
              </motion.button>
            )}
          </div>
        ) : (
          <SystemReportCard
            answers={answers}
            accentRgb={accentRgb}
            primaryHref={primaryHref}
            secondaryHref={secondaryHref}
            onReset={handleReset}
          />
        )}
      </div>
    </section>
  );
}
