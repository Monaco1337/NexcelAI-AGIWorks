"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
/**
 * SystemDiagnosisLab — Quick Diagnose v2
 * ─────────────────────────────────────────────────────────────
 * Schnelle 3-Klick-Diagnose mit optionalem Free-Text.
 * Ziel: Kunde erkennt in <60s die Reife seines Unternehmens
 * und bekommt Lust auf die volle Analyse.
 *
 * Bei Interesse: Curiosity-Hook „Tiefere Analyse starten" verlinkt
 * auf die dedizierte Deep-Analyse-Seite (/systemanalyse/deep).
 */

type StepId = "leads" | "scoring" | "automation";

interface StepOption {
  id: string;
  label: string;
  /** 0..100 — wie gut der Status ist (höher = besser). */
  weight: number;
  /** Insight, abhängig vom Weight (Schwäche/Stärke). */
  insight: { weakness?: string; strength?: string };
}

interface Step {
  id: StepId;
  question: string;
  options: StepOption[];
}

const STEPS: Step[] = [
  {
    id: "leads",
    question: "Wie generieren Sie aktuell Leads?",
    options: [
      {
        id: "manuell",
        label: "Manuell",
        weight: 18,
        insight: { weakness: "Hohe manuelle Abhängigkeit in der Akquise" },
      },
      {
        id: "ads",
        label: "Ads",
        weight: 55,
        insight: { weakness: "Lead-Strom hängt am Werbebudget" },
      },
      {
        id: "empfehlungen",
        label: "Empfehlungen",
        weight: 50,
        insight: { weakness: "Wachstum nicht skalierbar steuerbar" },
      },
      {
        id: "mischung",
        label: "Mischung",
        weight: 80,
        insight: { strength: "Mehrkanalige Lead-Generierung etabliert" },
      },
    ],
  },
  {
    id: "scoring",
    question: "Wie werden Leads bewertet?",
    options: [
      {
        id: "gar-nicht",
        label: "Gar nicht",
        weight: 8,
        insight: { weakness: "Keine strukturierte Lead-Bewertung" },
      },
      {
        id: "bauchgefuehl",
        label: "Bauchgefühl",
        weight: 28,
        insight: { weakness: "Bewertung subjektiv – schlecht reproduzierbar" },
      },
      {
        id: "crm",
        label: "CRM",
        weight: 65,
        insight: { weakness: "CRM ohne automatische Priorisierung" },
      },
      {
        id: "automatisiert",
        label: "Automatisiert",
        weight: 92,
        insight: { strength: "Lead-Scoring datenbasiert & automatisiert" },
      },
    ],
  },
  {
    id: "automation",
    question: "Wie viel ist automatisiert?",
    options: [
      {
        id: "lt20",
        label: "<20%",
        weight: 14,
        insight: { weakness: "Skalierung durch manuelle Prozesse limitiert" },
      },
      {
        id: "20-50",
        label: "20–50%",
        weight: 42,
        insight: { weakness: "Halb-automatisiert – wertvolle Brüche im Ablauf" },
      },
      {
        id: "50-80",
        label: "50–80%",
        weight: 70,
        insight: { strength: "Solide Automatisierungsbasis vorhanden" },
      },
      {
        id: "gt80",
        label: ">80%",
        weight: 95,
        insight: { strength: "Sehr hoher Automatisierungsgrad" },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────
// Animations
// ─────────────────────────────────────────────────────────────
const stepVariants = {
  enter: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction * 36,
    filter: "blur(8px)",
  }),
  center: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
  exit: (direction: 1 | -1) => ({
    opacity: 0,
    x: direction * -36,
    filter: "blur(8px)",
    transition: { duration: 0.38, ease: [0.4, 0, 0.6, 1] },
  }),
};

// Score band labels
function getScoreBand(score: number) {
  if (score < 30) return { label: "Hochrisiko", tone: "danger" as const };
  if (score < 55) return { label: "Manuell-getrieben", tone: "warn" as const };
  if (score < 75) return { label: "Teilweise systematisch", tone: "neutral" as const };
  return { label: "System-orientiert", tone: "good" as const };
}

export default function SystemDiagnosisLab() {
  const brand = useBrand();
  const accentRgb = brand.theme.accentRgb;
  const [stepIdx, setStepIdx] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [selections, setSelections] = useState<Record<StepId, string | null>>({
    leads: null,
    scoring: null,
    automation: null,
  });
  const totalSteps = STEPS.length;
  const isResult = stepIdx >= totalSteps;

  // Modal-State: Result öffnet sich als Pop-up sobald isResult true wird.
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    if (isResult) {
      const t = setTimeout(() => setModalOpen(true), 280);
      return () => clearTimeout(t);
    }
    setModalOpen(false);
  }, [isResult]);

  // Body-Scroll-Lock wenn Modal offen
  useEffect(() => {
    if (typeof document === "undefined") return;
    if (modalOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [modalOpen]);

  // ESC zum Schließen
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);
  const score = useMemo(() => {
    const weights: number[] = [];
    for (const step of STEPS) {
      const sel = selections[step.id];
      if (!sel) continue;
      const opt = step.options.find((o) => o.id === sel);
      if (opt) weights.push(opt.weight);
    }
    if (!weights.length) return 0;
    return Math.round(weights.reduce((a, b) => a + b, 0) / weights.length);
  }, [selections]);

  const insights = useMemo(() => {
    const list: { type: "weakness" | "strength"; text: string }[] = [];
    for (const step of STEPS) {
      const sel = selections[step.id];
      if (!sel) continue;
      const opt = step.options.find((o) => o.id === sel);
      if (!opt) continue;
      if (opt.weight < 65 && opt.insight.weakness) {
        list.push({ type: "weakness", text: opt.insight.weakness });
      } else if (opt.weight >= 65 && opt.insight.strength) {
        list.push({ type: "strength", text: opt.insight.strength });
      } else if (opt.insight.weakness) {
        list.push({ type: "weakness", text: opt.insight.weakness });
      } else if (opt.insight.strength) {
        list.push({ type: "strength", text: opt.insight.strength });
      }
    }
    return list;
  }, [selections]);

  const handleSelect = (step: Step, optionId: string) => {
    setSelections((prev) => ({ ...prev, [step.id]: optionId }));
    setTimeout(() => {
      setDirection(1);
      setStepIdx((i) => i + 1);
    }, 300);
  };

  const handleBack = () => {
    if (stepIdx === 0) return;
    setDirection(-1);
    setStepIdx((i) => i - 1);
  };

  // Score count-up
  const [scoreDisplay, setScoreDisplay] = useState(0);
  useEffect(() => {
    if (!isResult) {
      setScoreDisplay(0);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const duration = 1600;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 5);
      setScoreDisplay(Math.round(score * eased));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isResult, score]);

  const currentStep = isResult ? null : STEPS[stepIdx];
  const band = isResult ? getScoreBand(score) : null;

  // Score ring color depending on band
  const ringColor = useMemo(() => {
    if (!band) return `rgb(${accentRgb})`;
    if (band.tone === "danger") return "rgb(255,90,90)";
    if (band.tone === "warn") return "rgb(255,170,80)";
    return `rgb(${accentRgb})`;
  }, [band, accentRgb]);

  return (
    <section
      className="relative py-24 sm:py-28 lg:py-36 overflow-hidden"
      aria-labelledby="diagnosis-heading"
      style={{
        background:
          "linear-gradient(180deg, #050509 0%, #07070d 30%, #06060c 70%, #050509 100%)",
        isolation: "isolate",
      }}
    >
      {/* ─── BG LAYER 1 · Section seam (top fade) ─────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
        }}
      />

      {/* ─── BG LAYER 2 · Aurora mesh — drifting brand bloom (slow parallax) */}
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
          background: `radial-gradient(ellipse 60% 60% at 50% 50%, rgba(${accentRgb},0.28) 0%, rgba(${accentRgb},0.12) 35%, transparent 70%)`,
          filter: "blur(90px)",
          opacity: 0.85,
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
          background: `radial-gradient(ellipse, rgba(140,90,255,0.20) 0%, rgba(${accentRgb},0.10) 40%, transparent 70%)`,
          filter: "blur(110px)",
          opacity: 0.8,
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute"
        animate={{
          x: [0, 30, -25, 0],
          y: [0, -15, 25, 0],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
        style={{
          top: "40%",
          left: "-10%",
          width: "45%",
          height: "55%",
          background:
            "radial-gradient(ellipse, rgba(80,140,255,0.14) 0%, transparent 65%)",
          filter: "blur(120px)",
          opacity: 0.75,
        }}
      />

      {/* ─── BG LAYER 3 · Ultra-fine grid (constellation hint) ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.18) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
          opacity: 0.06,
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 0%, transparent 75%)",
        }}
      />

      {/* ─── BG LAYER 4 · Concentric radar field (very subtle) ── */}
      <svg
        aria-hidden
        className="pointer-events-none absolute"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(1400px, 130vw)",
          height: "min(1400px, 130vw)",
          opacity: 0.35,
          maskImage:
            "radial-gradient(circle, black 0%, black 35%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(circle, black 0%, black 35%, transparent 70%)",
        }}
        viewBox="0 0 1000 1000"
      >
        <defs>
          <radialGradient id="radarFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
        </defs>
        {[120, 220, 320, 420, 520].map((r, i) => (
          <motion.circle
            key={r}
            cx="500"
            cy="500"
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.25, 0.55, 0.25] }}
            transition={{
              duration: 6 + i * 0.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
        {/* Sweep beam */}
        <motion.g
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          style={{ originX: "500px", originY: "500px" }}
        >
          <defs>
            <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={`rgb(${accentRgb})`} stopOpacity="0" />
              <stop
                offset="1"
                stopColor={`rgb(${accentRgb})`}
                stopOpacity="0.45"
              />
            </linearGradient>
          </defs>
          <path
            d="M 500 500 L 1020 500 A 520 520 0 0 0 870 132 Z"
            fill="url(#sweep)"
            opacity="0.18"
          />
        </motion.g>
      </svg>

      {/* ─── BG LAYER 6 · Soft top vignette + bottom seam ── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 70% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* ─── BG LAYER 7 · Color grading wash (cool teal lift) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(80,120,180,0.04) 0%, transparent 30%, transparent 70%, rgba(20,10,40,0.08) 100%)",
          mixBlendMode: "overlay",
        }}
      />

      {/* ─── BG LAYER 8 · Film grain ──────────────────────── */}
      <div
        aria-hidden
        className="hero-noise pointer-events-none absolute inset-0"
        style={{ opacity: 0.045, mixBlendMode: "overlay" }}
      />

      {/* ─── BG LAYER 9 · Bottom seam highlight ───────────── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
        }}
      />

      <div className="relative z-10 mx-auto max-w-5xl px-6 sm:px-8 lg:px-12">
        {/* ── Section heading — centered, cinematic, high-end ── */}
        <header className="relative max-w-3xl mx-auto mb-12 text-center sm:mb-14 lg:mb-16">
          <motion.h2
            id="diagnosis-heading"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto max-w-[560px] text-balance font-light leading-[1.65] text-white/65"
            style={{
              fontFamily: "var(--font-body), system-ui, sans-serif",
              fontSize: "clamp(0.95rem, 1.05vw, 1.12rem)",
              fontWeight: 300,
              letterSpacing: "0.01em",
              textShadow: `0 1px 24px rgba(0,0,0,0.35), 0 0 40px rgba(${accentRgb},0.06)`,
            }}
          >
            Die meisten Unternehmen arbeiten ohne System — sondern mit isolierten
            Tools und manuellen Prozessen.
          </motion.h2>
        </header>

        {/* ── Container ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[820px]"
        >
          {/* Outer halo — atmender Brand-Glow */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 rounded-[32px]"
            animate={{
              opacity: [0.55, 0.85, 0.55],
              scale: [1, 1.012, 1],
            }}
            transition={{ duration: 5.2, repeat: Infinity, ease: "easeInOut" }}
            style={{
              boxShadow: `0 30px 90px rgba(0,0,0,0.55), 0 0 80px rgba(${accentRgb},0.28)`,
            }}
          />

          {/* Container */}
          <div
            className="relative rounded-[28px] overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(20,20,32,0.7) 0%, rgba(12,12,22,0.5) 100%)",
              backdropFilter: "blur(40px) saturate(190%)",
              WebkitBackdropFilter: "blur(40px) saturate(190%)",
              border: `1px solid rgba(255,255,255,0.07)`,
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), inset 0 0 0 1px rgba(${accentRgb},0.08)`,
            }}
          >
            {/* Top hairline highlight */}
            <div
              aria-hidden
              className="absolute inset-x-8 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.65), transparent)`,
                boxShadow: `0 0 14px rgba(${accentRgb},0.55)`,
              }}
            />
            {/* Soft brand corner glows */}
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
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                bottom: "-15%",
                left: "-8%",
                width: "45%",
                height: "45%",
                background: `radial-gradient(circle, rgba(${accentRgb},0.10) 0%, transparent 60%)`,
                filter: "blur(50px)",
              }}
            />
            {/* Inner ambient noise */}
            <div
              aria-hidden
              className="hero-noise pointer-events-none absolute inset-0"
              style={{ opacity: 0.04, mixBlendMode: "overlay" }}
            />

            {/* TOP BAR */}
            <div
              className="relative flex items-center justify-between gap-4 px-6 sm:px-8 lg:px-10 py-5 sm:py-6"
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
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    fontWeight: 600,
                  }}
                >
                  System Analyse
                </span>
                {isResult && (
                  <>
                    <span
                      className="hidden sm:inline-block h-3 w-px mx-1"
                      style={{ background: "rgba(255,255,255,0.12)" }}
                    />
                    <span
                      className="hidden sm:inline-block text-[10px] uppercase tracking-[0.18em] text-white/35"
                      style={{
                        fontFamily:
                          "var(--font-headline), system-ui, sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      Auswertung läuft
                    </span>
                  </>
                )}
              </div>

              <div
                className="flex items-center gap-3 text-[10.5px] uppercase tracking-[0.18em] text-white/55"
                style={{
                  fontFamily:
                    "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {/* Step pips */}
                <div className="hidden sm:flex items-center gap-1.5">
                  {Array.from({ length: totalSteps }).map((_, i) => {
                    const active = isResult ? true : i <= stepIdx;
                    const current = !isResult && i === stepIdx;
                    return (
                      <span
                        key={i}
                        className="block h-1.5 rounded-full transition-all duration-500"
                        style={{
                          width: current ? 22 : 8,
                          background: active
                            ? `rgb(${accentRgb})`
                            : "rgba(255,255,255,0.14)",
                          boxShadow: active
                            ? `0 0 8px rgba(${accentRgb},0.7)`
                            : "none",
                        }}
                      />
                    );
                  })}
                </div>
                {isResult && <span>Ergebnis</span>}
              </div>
            </div>

            {/* PROGRESS LINE — animated energy edge */}
            <div className="relative h-[2px] w-full overflow-hidden">
              <div
                className="absolute inset-0"
                style={{ background: "rgba(255,255,255,0.05)" }}
              />
              <motion.div
                className="absolute inset-y-0 left-0"
                animate={{
                  width: isResult
                    ? "100%"
                    : `${((stepIdx + 1) / totalSteps) * 100}%`,
                }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: `linear-gradient(90deg, rgba(${accentRgb},0.4), rgb(${accentRgb}) 80%, #fff)`,
                  boxShadow: `0 0 14px rgba(${accentRgb},0.75)`,
                }}
              />
              {/* Traveling shimmer on the edge */}
              {!isResult && (
                <motion.div
                  className="absolute inset-y-0 w-12 pointer-events-none"
                  initial={{ x: "-50%" }}
                  animate={{
                    x: [`-10%`, `${((stepIdx + 1) / totalSteps) * 100}%`],
                  }}
                  transition={{
                    duration: 1.2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                  style={{
                    background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.45), transparent)`,
                    mixBlendMode: "overlay",
                  }}
                />
              )}
            </div>

            {/* BODY */}
            <div className="relative px-6 sm:px-10 lg:px-14 py-12 sm:py-14 lg:py-16 min-h-[440px]">
              <AnimatePresence mode="wait" custom={direction}>
                {!isResult && currentStep ? (
                  <motion.div
                    key={currentStep.id}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex flex-col"
                  >
                    {/* Question */}
                    <h3
                      className="text-white mb-10"
                      style={{
                        fontFamily:
                          "var(--font-headline), system-ui, sans-serif",
                        fontWeight: 400,
                        letterSpacing: "-0.03em",
                        lineHeight: 1.15,
                        fontSize: "clamp(1.5rem, 2.9vw, 2.05rem)",
                        textShadow: "0 2px 16px rgba(0,0,0,0.4)",
                      }}
                    >
                      {currentStep.question}
                    </h3>

                    {/* Options */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      {currentStep.options.map((option, i) => {
                        const isSelected =
                          selections[currentStep.id] === option.id;
                        return (
                          <motion.button
                            key={option.id}
                            type="button"
                            onClick={() => handleSelect(currentStep, option.id)}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                              delay: 0.12 + i * 0.06,
                              duration: 0.55,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            whileHover={{
                              scale: 1.025,
                              transition: { duration: 0.2 },
                            }}
                            whileTap={{ scale: 0.985 }}
                            className="group relative rounded-2xl px-5 py-5 text-left overflow-hidden focus:outline-none focus-visible:ring-2"
                            style={{
                              background: isSelected
                                ? `linear-gradient(135deg, rgba(${accentRgb},0.22), rgba(${accentRgb},0.10))`
                                : "linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 100%)",
                              border: isSelected
                                ? `1px solid rgba(${accentRgb},0.6)`
                                : "1px solid rgba(255,255,255,0.07)",
                              boxShadow: isSelected
                                ? `0 14px 36px rgba(${accentRgb},0.34), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 28px rgba(${accentRgb},0.36)`
                                : "0 6px 20px rgba(0,0,0,0.22), inset 0 1px 0 rgba(255,255,255,0.05)",
                              transition:
                                "background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease",
                            }}
                          >
                            {/* Hover glow */}
                            <span
                              aria-hidden
                              className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                              style={{
                                background: `radial-gradient(circle at 50% 0%, rgba(${accentRgb},0.18), transparent 70%)`,
                              }}
                            />
                            {/* Top hairline shimmer (only when selected) */}
                            {isSelected && (
                              <span
                                aria-hidden
                                className="absolute inset-x-3 top-0 h-px"
                                style={{
                                  background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.85), transparent)`,
                                }}
                              />
                            )}

                            <div className="relative flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <span
                                  className="inline-flex h-6 min-w-[22px] items-center justify-center rounded-md px-1 text-[10px] uppercase tracking-[0.14em]"
                                  style={{
                                    background: isSelected
                                      ? `rgba(${accentRgb},0.22)`
                                      : "rgba(255,255,255,0.05)",
                                    color: isSelected
                                      ? `rgb(${accentRgb})`
                                      : "rgba(255,255,255,0.4)",
                                    border: isSelected
                                      ? `1px solid rgba(${accentRgb},0.4)`
                                      : "1px solid rgba(255,255,255,0.08)",
                                    fontFamily:
                                      "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                                    fontWeight: 600,
                                    fontVariantNumeric: "tabular-nums",
                                  }}
                                >
                                  {String.fromCharCode(65 + i)}
                                </span>
                                <span
                                  className="text-white/92 truncate"
                                  style={{
                                    fontFamily:
                                      "var(--font-headline), system-ui, sans-serif",
                                    fontWeight: 400,
                                    fontSize: "1.02rem",
                                    letterSpacing: "-0.005em",
                                  }}
                                >
                                  {option.label}
                                </span>
                              </div>

                              {/* Indicator */}
                              <span
                                className="inline-flex h-5 w-5 items-center justify-center rounded-full transition-all duration-300 flex-shrink-0"
                                style={{
                                  background: isSelected
                                    ? `rgb(${accentRgb})`
                                    : "rgba(255,255,255,0.06)",
                                  boxShadow: isSelected
                                    ? `0 0 12px rgba(${accentRgb},0.75)`
                                    : "none",
                                  border: isSelected
                                    ? `1px solid rgba(${accentRgb},0.7)`
                                    : "1px solid rgba(255,255,255,0.12)",
                                }}
                              >
                                {isSelected && (
                                  <svg
                                    width="10"
                                    height="10"
                                    viewBox="0 0 12 12"
                                    fill="none"
                                    stroke="white"
                                    strokeWidth="2.4"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  >
                                    <path d="M2.5 6.2l2.5 2.5L9.5 3.7" />
                                  </svg>
                                )}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {/* Back row */}
                    <div className="mt-9 flex items-center justify-end">
                      {stepIdx > 0 ? (
                        <button
                          type="button"
                          onClick={handleBack}
                          className="group inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-white/45 hover:text-white/85 transition-colors"
                          style={{
                            fontFamily:
                              "var(--font-headline), system-ui, sans-serif",
                            fontWeight: 500,
                          }}
                        >
                          <span className="transition-transform group-hover:-translate-x-0.5">
                            ←
                          </span>
                          Zurück
                        </button>
                      ) : (
                        <span />
                      )}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="result-placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col items-center justify-center text-center min-h-[280px]"
                  >
                    <motion.div
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="text-[11px] uppercase tracking-[0.28em]"
                      style={{
                        color: `rgb(${accentRgb})`,
                        fontFamily:
                          "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                        fontWeight: 600,
                      }}
                    >
                      System Score wird berechnet …
                    </motion.div>
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="mt-6 text-[10.5px] uppercase tracking-[0.22em] text-white/35 hover:text-white/75 transition-colors"
                      style={{
                        fontFamily:
                          "var(--font-headline), system-ui, sans-serif",
                        fontWeight: 500,
                      }}
                    >
                      Ergebnis öffnen
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ───────────────────────────────────────────────────────
           RESULT MODAL — Desktop & Mobile optimiert
           ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            key="modal-root"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="result-modal-title"
          >
            {/* Backdrop */}
            <motion.div
              aria-hidden
              onClick={() => setModalOpen(false)}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(8,8,16,0.6) 0%, rgba(4,4,9,0.92) 100%)",
                backdropFilter: "blur(24px) saturate(140%)",
                WebkitBackdropFilter: "blur(24px) saturate(140%)",
              }}
            />
            {/* Brand bloom behind dialog */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                top: "20%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "60vw",
                height: "60vh",
                background: `radial-gradient(ellipse, rgba(${accentRgb},0.18) 0%, transparent 65%)`,
                filter: "blur(80px)",
                mixBlendMode: "screen",
              }}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="relative w-full max-w-[640px] max-h-[92vh] overflow-y-auto rounded-3xl"
              style={{
                background:
                  "linear-gradient(135deg, rgba(20,20,32,0.78) 0%, rgba(12,12,22,0.62) 100%)",
                backdropFilter: "blur(40px) saturate(190%)",
                WebkitBackdropFilter: "blur(40px) saturate(190%)",
                border: `1px solid rgba(255,255,255,0.08)`,
                boxShadow: `0 40px 100px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08), 0 0 60px rgba(${accentRgb},0.22)`,
              }}
            >
              {/* Top hairline */}
              <div
                aria-hidden
                className="absolute inset-x-10 top-0 h-px"
                style={{
                  background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.7), transparent)`,
                  boxShadow: `0 0 14px rgba(${accentRgb},0.55)`,
                }}
              />
              {/* Brand corner glow */}
              <div
                aria-hidden
                className="pointer-events-none absolute"
                style={{
                  top: "-12%",
                  right: "-8%",
                  width: "55%",
                  height: "55%",
                  background: `radial-gradient(circle, rgba(${accentRgb},0.22) 0%, transparent 60%)`,
                  filter: "blur(50px)",
                }}
              />

              {/* Header */}
              <div
                className="relative flex items-center justify-between gap-4 px-6 sm:px-8 py-5"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="relative inline-flex h-2 w-2">
                    <span
                      className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
                      style={{ background: `rgb(${accentRgb})` }}
                    />
                    <span
                      className="relative inline-flex h-2 w-2 rounded-full"
                      style={{
                        background: `rgb(${accentRgb})`,
                        boxShadow: `0 0 10px rgba(${accentRgb},0.85)`,
                      }}
                    />
                  </span>
                  <h3
                    id="result-modal-title"
                    className="text-white truncate"
                    style={{
                      fontFamily:
                        "var(--font-headline), system-ui, sans-serif",
                      fontWeight: 500,
                      letterSpacing: "0.005em",
                      fontSize: "0.95rem",
                    }}
                  >
                    System-Diagnose · Ergebnis
                  </h3>
                </div>
                <button
                  type="button"
                  aria-label="Schließen"
                  onClick={() => setModalOpen(false)}
                  className="group relative flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `rgba(${accentRgb},0.18)`;
                    e.currentTarget.style.borderColor = `rgba(${accentRgb},0.45)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                    e.currentTarget.style.borderColor =
                      "rgba(255,255,255,0.08)";
                  }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    className="text-white/85 transition-transform group-hover:rotate-90"
                  >
                    <path d="M2 2 L12 12 M12 2 L2 12" />
                  </svg>
                </button>
              </div>

              {/* Body — Score */}
              <div className="relative px-6 sm:px-8 pt-8 sm:pt-10 pb-6 flex flex-col items-center text-center">
                {/* Score Ring */}
                <div className="relative w-[200px] h-[200px] sm:w-[220px] sm:h-[220px] mb-5">
                  <motion.div
                    aria-hidden
                    className="absolute inset-0 rounded-full"
                    animate={{
                      opacity: [0.4, 0.85, 0.4],
                      scale: [1, 1.05, 1],
                    }}
                    transition={{
                      duration: 4.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      boxShadow: `0 0 48px ${ringColor.replace("rgb(", "rgba(").replace(")", ",0.45)")}`,
                    }}
                  />
                  <svg
                    viewBox="0 0 220 220"
                    className="absolute inset-0 -rotate-90"
                  >
                    <defs>
                      <linearGradient
                        id="ringGradientModal"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop offset="0" stopColor={ringColor} stopOpacity="0.55" />
                        <stop offset="1" stopColor={ringColor} stopOpacity="1" />
                      </linearGradient>
                    </defs>
                    <circle
                      cx="110"
                      cy="110"
                      r="100"
                      fill="none"
                      stroke="rgba(255,255,255,0.04)"
                      strokeWidth="1"
                    />
                    <circle
                      cx="110"
                      cy="110"
                      r="90"
                      fill="none"
                      stroke="rgba(255,255,255,0.06)"
                      strokeWidth="1"
                      strokeDasharray="2 6"
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
                      stroke="url(#ringGradientModal)"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 78}
                      initial={{ strokeDashoffset: 2 * Math.PI * 78 }}
                      animate={{
                        strokeDashoffset:
                          2 * Math.PI * 78 * (1 - score / 100),
                      }}
                      transition={{
                        duration: 1.6,
                        ease: [0.22, 1, 0.36, 1],
                        delay: 0.2,
                      }}
                      style={{
                        filter: `drop-shadow(0 0 10px ${ringColor.replace("rgb(", "rgba(").replace(")", ",0.85)")})`,
                      }}
                    />
                    {Array.from({ length: 12 }).map((_, i) => {
                      const angle = (i / 12) * 360;
                      const rad = (angle * Math.PI) / 180;
                      const x1 = 110 + 65 * Math.cos(rad);
                      const y1 = 110 + 65 * Math.sin(rad);
                      const x2 = 110 + 70 * Math.cos(rad);
                      const y2 = 110 + 70 * Math.sin(rad);
                      return (
                        <line
                          key={i}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="rgba(255,255,255,0.16)"
                          strokeWidth="1"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div
                      className="text-[10px] uppercase tracking-[0.26em] text-white/45 mb-1.5"
                      style={{
                        fontFamily:
                          "var(--font-headline), system-ui, sans-serif",
                        fontWeight: 600,
                      }}
                    >
                      System Score
                    </div>
                    <div
                      className="text-white"
                      style={{
                        fontFamily:
                          "var(--font-headline), system-ui, sans-serif",
                        fontWeight: 500,
                        fontSize: "clamp(2.6rem, 9vw, 3.6rem)",
                        letterSpacing: "-0.05em",
                        lineHeight: 1,
                        fontVariantNumeric: "tabular-nums",
                        textShadow: `0 2px 24px rgba(0,0,0,0.45), 0 0 38px ${ringColor.replace("rgb(", "rgba(").replace(")", ",0.55)")}`,
                      }}
                    >
                      {scoreDisplay}
                      <span
                        className="text-white/45"
                        style={{
                          fontSize: "1.4rem",
                          marginLeft: "0.05em",
                        }}
                      >
                        %
                      </span>
                    </div>
                    {band && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.3, duration: 0.5 }}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                        style={{
                          background:
                            band.tone === "good"
                              ? `rgba(${accentRgb},0.16)`
                              : band.tone === "warn"
                                ? "rgba(255,170,80,0.14)"
                                : band.tone === "danger"
                                  ? "rgba(255,90,90,0.14)"
                                  : "rgba(255,255,255,0.05)",
                          border:
                            band.tone === "good"
                              ? `1px solid rgba(${accentRgb},0.36)`
                              : band.tone === "warn"
                                ? "1px solid rgba(255,170,80,0.36)"
                                : band.tone === "danger"
                                  ? "1px solid rgba(255,90,90,0.36)"
                                  : "1px solid rgba(255,255,255,0.1)",
                        }}
                      >
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ background: ringColor }}
                        />
                        <span
                          className="text-[10px] uppercase tracking-[0.18em]"
                          style={{
                            fontFamily:
                              "var(--font-headline), system-ui, sans-serif",
                            fontWeight: 600,
                            color:
                              band.tone === "good"
                                ? `rgb(${accentRgb})`
                                : band.tone === "warn"
                                  ? "rgb(255,170,80)"
                                  : band.tone === "danger"
                                    ? "rgb(255,90,90)"
                                    : "rgba(255,255,255,0.7)",
                          }}
                        >
                          {band.label}
                        </span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Insights */}
                <div className="w-full flex flex-col gap-2.5 mt-2 mb-7">
                  {insights.map((ins, i) => (
                    <motion.div
                      key={`m-${ins.text}-${i}`}
                      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      transition={{
                        delay: 0.6 + i * 0.12,
                        duration: 0.55,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="relative flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left"
                      style={{
                        background:
                          ins.type === "weakness"
                            ? "linear-gradient(135deg, rgba(255,90,90,0.06), rgba(255,90,90,0.02))"
                            : `linear-gradient(135deg, rgba(${accentRgb},0.10), rgba(${accentRgb},0.04))`,
                        border:
                          ins.type === "weakness"
                            ? "1px solid rgba(255,90,90,0.24)"
                            : `1px solid rgba(${accentRgb},0.26)`,
                        boxShadow:
                          ins.type === "weakness"
                            ? "0 6px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)"
                            : `0 6px 18px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 16px rgba(${accentRgb},0.12)`,
                      }}
                    >
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full flex-shrink-0"
                        style={{
                          background:
                            ins.type === "weakness"
                              ? "rgba(255,90,90,0.14)"
                              : `rgba(${accentRgb},0.18)`,
                          border:
                            ins.type === "weakness"
                              ? "1px solid rgba(255,90,90,0.32)"
                              : `1px solid rgba(${accentRgb},0.34)`,
                          color:
                            ins.type === "weakness"
                              ? "rgb(255,90,90)"
                              : `rgb(${accentRgb})`,
                        }}
                      >
                        {ins.type === "weakness" ? (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 9v3.5" />
                            <path d="M12 16h.01" />
                            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                          </svg>
                        ) : (
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M5 12l5 5L20 7" />
                          </svg>
                        )}
                      </span>
                      <span
                        className="text-white/88 flex-1"
                        style={{
                          fontFamily:
                            "var(--font-body), system-ui, sans-serif",
                          fontSize: "0.92rem",
                          fontWeight: 300,
                          letterSpacing: "0.005em",
                          lineHeight: 1.5,
                        }}
                      >
                        {ins.text}
                      </span>
                      <span
                        className="hidden sm:inline-block text-[9.5px] uppercase tracking-[0.18em] flex-shrink-0"
                        style={{
                          fontFamily:
                            "var(--font-headline), system-ui, sans-serif",
                          fontWeight: 600,
                          color:
                            ins.type === "weakness"
                              ? "rgba(255,90,90,0.78)"
                              : `rgb(${accentRgb})`,
                        }}
                      >
                        {ins.type === "weakness" ? "Schwäche" : "Stärke"}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Footer CTA */}
              <div
                className="relative px-6 sm:px-8 py-6"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                <motion.div
                  className="relative w-full"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1, duration: 0.6 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.985 }}
                >
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    animate={{
                      boxShadow: [
                        `0 0 0 0 rgba(${accentRgb},0.0), 0 10px 32px rgba(${accentRgb},0.32)`,
                        `0 0 0 8px rgba(${accentRgb},0.20), 0 18px 56px rgba(${accentRgb},0.55)`,
                        `0 0 0 0 rgba(${accentRgb},0.0), 0 10px 32px rgba(${accentRgb},0.32)`,
                      ],
                    }}
                    transition={{
                      duration: 3.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                  <Link
                    href="/systemanalyse/deep"
                    onClick={() => setModalOpen(false)}
                    className="group relative flex w-full items-center justify-center gap-2.5 rounded-2xl px-7 py-[15px] text-[13.5px] font-medium text-white overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                    style={{
                      fontFamily:
                        "var(--font-headline), system-ui, sans-serif",
                      letterSpacing: "0.01em",
                      background: `linear-gradient(135deg, rgba(${accentRgb},0.55), rgba(${accentRgb},0.9))`,
                      backdropFilter: "blur(24px)",
                      WebkitBackdropFilter: "blur(24px)",
                      border: `1px solid rgba(${accentRgb},0.55)`,
                      boxShadow: `inset 0 1px 0 rgba(255,255,255,0.18)`,
                    }}
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent opacity-0 transition-all duration-700 group-hover:translate-x-full group-hover:opacity-100"
                    />
                    <span className="relative">Tiefere Analyse starten</span>
                    <span className="relative text-[12px] text-white/85 transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </Link>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
