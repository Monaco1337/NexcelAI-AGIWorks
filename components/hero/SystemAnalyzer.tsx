"use client";

import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ScanResult, ScannerMode, FetchedHtml } from "@/lib/scanner/types";
import { analyzeWeb } from "@/lib/scanner/web";
import { analyzeSoftware } from "@/lib/scanner/software";
import { analyzeCloud } from "@/lib/scanner/cloud";
import { toExecutive, type ExecutiveAnalysis } from "@/lib/scanner/business";

interface Props {
  accentRgb: string;
  /** Kept for API compatibility; the console always renders dark cinema look. */
  isDark?: boolean;
}

const MODES: {
  id: ScannerMode;
  label: string;
  blurb: string;
  icon: ReactNode;
}[] = [
  {
    id: "web",
    label: "Webseite",
    blurb: "URL einfügen — wir scannen Performance, SEO, Tech-Stack & Trust.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </svg>
    ),
  },
  {
    id: "software",
    label: "Software",
    blurb: "package.json, Dockerfile oder Snippet — wir prüfen Architektur & Risiken.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="m18 16 4-4-4-4M6 8l-4 4 4 4M14.5 4l-5 16" />
      </svg>
    ),
  },
  {
    id: "cloud",
    label: "Cloud",
    blurb: "Terraform, k8s YAML oder IAM-JSON — wir finden Sicherheits- & Resilienz-Lücken.",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M17 18a5 5 0 0 0-1-9.9A7 7 0 0 0 4 13a5 5 0 0 0 4 5h9z" />
      </svg>
    ),
  },
];

export default function SystemAnalyzer({ accentRgb }: Props) {
  const [mode, setMode] = useState<ScannerMode>("web");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [stage, setStage] = useState<string>("Bereit");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeMode = useMemo(() => MODES.find((m) => m.id === mode)!, [mode]);

  const onFile = useCallback((file: File | null) => {
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError("Datei zu groß (max. 4 MB).");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      setContent(text);
      setFilename(file.name);
      setError(null);
    };
    reader.onerror = () => setError("Datei konnte nicht gelesen werden.");
    reader.readAsText(file);
  }, []);

  const runScan = useCallback(async () => {
    setError(null);
    setResult(null);
    setAiSummary(null);
    if (mode === "web") {
      if (!url.trim()) {
        setError("Bitte URL eintragen.");
        return;
      }
      setRunning(true);
      try {
        setStage("Lade Seite …");
        const res = await fetch("/api/scanner/fetch", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: url.trim() }),
        });
        const data = (await res.json()) as
          | (FetchedHtml & { durationMs?: number })
          | { error: string };
        if ("error" in data) {
          setError(data.error || `Fehler beim Laden (HTTP ${res.status}).`);
          return;
        }
        setStage("Analysiere …");
        const r = analyzeWeb(data);
        setResult(r);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unbekannter Fehler.");
      } finally {
        setRunning(false);
        setStage("Bereit");
      }
      return;
    }

    if (!content.trim()) {
      setError(
        mode === "software"
          ? "Bitte Datei oder Code-Snippet einfügen."
          : "Bitte Konfiguration einfügen oder Datei hochladen.",
      );
      return;
    }
    setRunning(true);
    setStage("Analysiere lokal …");
    try {
      const r =
        mode === "software"
          ? analyzeSoftware({
              source: filename ?? "inline",
              content,
            })
          : analyzeCloud({ source: filename ?? "inline", content });
      setResult(r);
    } finally {
      setRunning(false);
      setStage("Bereit");
    }
  }, [mode, url, content, filename]);

  const enrichWithAI = useCallback(async () => {
    if (!result) return;
    setAiLoading(true);
    try {
      const { synthesizeNarrative } = await import("@/lib/scanner/ai");
      const text = await synthesizeNarrative(result);
      setAiSummary(text);
    } catch (e) {
      setAiSummary(null);
      setError("KI-Synthese fehlgeschlagen.");
    } finally {
      setAiLoading(false);
    }
  }, [result]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="relative mx-auto w-full max-w-[1080px]"
    >
      {/* Holographic rotating border */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-px overflow-hidden rounded-[28px]"
      >
        <motion.div
          className="absolute -inset-[40%] rounded-[40%]"
          animate={{ rotate: 360 }}
          transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
          style={{
            background: `conic-gradient(from 0deg at 50% 50%,
              rgba(${accentRgb},0.55) 0deg,
              rgba(255,255,255,0.04) 80deg,
              rgba(56,189,248,0.35) 160deg,
              rgba(255,255,255,0.04) 240deg,
              rgba(${accentRgb},0.55) 360deg)`,
            opacity: 0.6,
          }}
        />
        <div
          className="absolute inset-px rounded-[27px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,15,24,0.96) 0%, rgba(8,8,14,0.98) 100%)",
          }}
        />
      </div>

      {/* Console panel */}
      <div
        className="relative overflow-hidden rounded-[28px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,15,24,0.72) 0%, rgba(8,8,14,0.65) 100%)",
          backdropFilter: "blur(28px) saturate(160%)",
          WebkitBackdropFilter: "blur(28px) saturate(160%)",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: `0 40px 120px rgba(0,0,0,0.6), 0 0 100px rgba(${accentRgb},0.12), inset 0 1px 0 rgba(255,255,255,0.08)`,
        }}
      >
        {/* Top scanline */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(${accentRgb},0.7) 50%, transparent 100%)`,
            opacity: 0.7,
          }}
        />

        {/* Console header — traffic lights only */}
        <div
          className="flex items-center justify-between gap-4 px-7 py-4 sm:px-9"
          style={{
            borderBottom: "1px solid rgba(255,255,255,0.05)",
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.025), transparent)",
          }}
        >
          <div className="flex items-center gap-1.5">
            {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
              <span
                key={c}
                className="inline-block h-2 w-2 rounded-full"
                style={{
                  background: c,
                  boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.2)",
                }}
              />
            ))}
          </div>
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-white/35">
            <motion.span
              className="inline-block h-1.5 w-1.5 rounded-full"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: running ? `rgb(${accentRgb})` : "#22c55e",
                boxShadow: running
                  ? `0 0 10px rgba(${accentRgb},0.9)`
                  : "0 0 10px rgba(34,197,94,0.7)",
              }}
            />
            {stage}
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-9 sm:px-9 sm:py-11 lg:px-12 lg:py-12">
          {/* Headline */}
          <h2
            className="max-w-[820px] text-[2rem] sm:text-[2.5rem] lg:text-[3rem] leading-[1.02] text-white"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
              letterSpacing: "-0.035em",
            }}
          >
            Was wäre, wenn{" "}
            <span
              style={{
                background: `linear-gradient(120deg, rgb(${accentRgb}) 0%, #ffffff 70%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 28px rgba(${accentRgb},0.45))`,
                fontWeight: 400,
              }}
            >
              dein System schon morgen
            </span>{" "}
            besser wäre?
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] leading-[1.7] text-white/55">
            {activeMode.blurb}
          </p>

          {/* Segmented control */}
          <div className="mt-9">
            <SegmentedControl
              accentRgb={accentRgb}
              value={mode}
              onChange={(m) => {
                setMode(m);
                setResult(null);
                setError(null);
                setAiSummary(null);
              }}
            />
          </div>

          {/* Inputs */}
          <div className="mt-7">
            {mode === "web" ? (
              <UrlInput
                accentRgb={accentRgb}
                value={url}
                onChange={setUrl}
                onSubmit={runScan}
                disabled={running}
              />
            ) : (
              <FileSnippetInput
                accentRgb={accentRgb}
                value={content}
                filename={filename}
                onChange={(t) => {
                  setContent(t);
                  if (!t) setFilename(null);
                }}
                onFile={onFile}
                fileInputRef={fileInputRef}
                placeholder={
                  mode === "software"
                    ? "package.json, Dockerfile oder Code-Snippet hier einfügen …"
                    : "Terraform, k8s YAML oder IAM-JSON hier einfügen …"
                }
              />
            )}
          </div>

          {/* Action row */}
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">
              {mode === "web"
                ? "Server-Fetch · 100% On-Device-Analyse"
                : "100% On-Device — kein Upload, kein API-Call"}
            </div>
            <PremiumCTA
              accentRgb={accentRgb}
              running={running}
              onClick={runScan}
            />
          </div>
          <div className="mt-3 text-center text-[11.5px] text-white/35 sm:text-right">
            Kostenlos · keine Anmeldung · läuft im Browser
          </div>

          {/* Error */}
          <AnimatePresence>
            {error ? (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 rounded-xl px-4 py-3 text-[13px]"
                style={{
                  color: "#fecaca",
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.30)",
                }}
              >
                {error}
              </motion.div>
            ) : null}
          </AnimatePresence>

          {/* Result */}
          <AnimatePresence>
            {result ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="mt-10"
              >
                <ResultPanel
                  accentRgb={accentRgb}
                  result={result}
                  aiSummary={aiSummary}
                  aiLoading={aiLoading}
                  onAi={enrichWithAI}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {/* Bottom edge glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.45), transparent)`,
            opacity: 0.45,
          }}
        />
      </div>
    </motion.div>
  );
}

/* ─── Segmented control ──────────────────────────────────────────── */
function SegmentedControl({
  accentRgb,
  value,
  onChange,
}: {
  accentRgb: string;
  value: ScannerMode;
  onChange: (m: ScannerMode) => void;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex w-full max-w-[460px] items-center rounded-full p-1"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.06)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {MODES.map((m) => {
        const on = m.id === value;
        return (
          <button
            key={m.id}
            role="tab"
            aria-selected={on}
            type="button"
            onClick={() => onChange(m.id)}
            className="group relative flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-[12.5px] transition"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              color: on ? "white" : "rgba(255,255,255,0.55)",
            }}
          >
            {on ? (
              <motion.span
                layoutId="seg-active"
                className="absolute inset-0 rounded-full"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                style={{
                  background: `linear-gradient(135deg, rgba(${accentRgb},0.28), rgba(${accentRgb},0.10))`,
                  border: `1px solid rgba(${accentRgb},0.45)`,
                  boxShadow: `0 6px 22px rgba(${accentRgb},0.25), inset 0 1px 0 rgba(255,255,255,0.10)`,
                }}
              />
            ) : null}
            <span className="relative">{m.icon}</span>
            <span className="relative">{m.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── URL input ──────────────────────────────────────────────────── */
function UrlInput({
  accentRgb,
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  accentRgb: string;
  value: string;
  onChange: (s: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="group relative">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/55">
          Webseite
        </span>
        <span className="text-[10px] uppercase tracking-[0.22em] text-white/30">
          Pflicht
        </span>
      </div>
      <div
        className="relative overflow-hidden rounded-xl px-4"
        style={{
          paddingTop: 16,
          paddingBottom: 16,
          background: "rgba(255,255,255,0.025)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.25)",
        }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = `rgba(${accentRgb},0.55)`;
          (e.currentTarget as HTMLElement).style.boxShadow = `inset 0 1px 0 rgba(255,255,255,0.06), 0 12px 32px rgba(0,0,0,0.35), 0 0 0 4px rgba(${accentRgb},0.14)`;
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.25)";
        }}
      >
        <Corner accentRgb={accentRgb} pos="tl" />
        <Corner accentRgb={accentRgb} pos="br" />
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !disabled) onSubmit();
          }}
          placeholder="deine-firma.de"
          className="w-full bg-transparent text-[15px] text-white placeholder-white/30 outline-none"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* ─── File / snippet input ───────────────────────────────────────── */
function FileSnippetInput({
  accentRgb,
  value,
  filename,
  onChange,
  onFile,
  fileInputRef,
  placeholder,
}: {
  accentRgb: string;
  value: string;
  filename: string | null;
  onChange: (s: string) => void;
  onFile: (f: File | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  placeholder: string;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:gap-6">
      {/* Snippet textarea */}
      <div className="lg:col-span-7">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/55">
            Snippet
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/30">
            Konfiguration · Code · Manifest
          </span>
        </div>
        <div
          className="relative overflow-hidden rounded-xl px-4 py-3"
          style={{
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.25)",
          }}
        >
          <Corner accentRgb={accentRgb} pos="tl" />
          <Corner accentRgb={accentRgb} pos="br" />
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={6}
            className="w-full resize-none bg-transparent font-mono text-[12.5px] leading-[1.55] text-white placeholder-white/30 outline-none"
          />
        </div>
      </div>

      {/* Drop zone */}
      <div className="lg:col-span-5">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/55">
            Datei
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/30">
            Optional
          </span>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              fileInputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            onFile(e.dataTransfer.files?.[0] ?? null);
          }}
          className="relative flex h-[148px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl text-center transition"
          style={{
            background: drag
              ? `radial-gradient(60% 60% at 50% 50%, rgba(${accentRgb},0.18), rgba(255,255,255,0.02))`
              : "rgba(255,255,255,0.025)",
            border: drag
              ? `1px solid rgba(${accentRgb},0.65)`
              : "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Scan line */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 h-[2px]"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.85), transparent)`,
              boxShadow: `0 0 12px rgba(${accentRgb},0.6)`,
              opacity: 0.55,
            }}
          />
          {(["tl", "tr", "bl", "br"] as const).map((c) => (
            <Corner key={c} accentRgb={accentRgb} pos={c} />
          ))}
          <motion.div
            className="mb-2 flex h-10 w-10 items-center justify-center rounded-full"
            animate={{
              boxShadow: [
                `0 0 0 0 rgba(${accentRgb},0.0)`,
                `0 0 0 6px rgba(${accentRgb},0.10)`,
                `0 0 0 0 rgba(${accentRgb},0.0)`,
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            style={{
              background: `radial-gradient(circle, rgba(${accentRgb},0.18), rgba(${accentRgb},0.04))`,
              border: `1px solid rgba(${accentRgb},0.4)`,
              color: `rgb(${accentRgb})`,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M12 16V4M12 4l-4 4M12 4l4 4M4 20h16" />
            </svg>
          </motion.div>
          <div
            className="text-[13px] font-medium text-white"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            {filename ?? "Datei ablegen"}
          </div>
          <div className="mt-1 text-[10.5px] uppercase tracking-[0.22em] text-white/40">
            oder klicken
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.yml,.yaml,.tf,.dockerfile,.env,.txt,.toml,.ini,.config,text/*,application/yaml,application/json"
            className="hidden"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </div>
      </div>
    </div>
  );
}

function Corner({ accentRgb, pos }: { accentRgb: string; pos: "tl" | "tr" | "bl" | "br" }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute h-3 w-3"
      style={{
        top: pos.startsWith("t") ? 6 : "auto",
        bottom: pos.startsWith("b") ? 6 : "auto",
        left: pos.endsWith("l") ? 6 : "auto",
        right: pos.endsWith("r") ? 6 : "auto",
        borderTop: pos.startsWith("t") ? `1.5px solid rgba(${accentRgb},0.7)` : undefined,
        borderBottom: pos.startsWith("b") ? `1.5px solid rgba(${accentRgb},0.7)` : undefined,
        borderLeft: pos.endsWith("l") ? `1.5px solid rgba(${accentRgb},0.7)` : undefined,
        borderRight: pos.endsWith("r") ? `1.5px solid rgba(${accentRgb},0.7)` : undefined,
      }}
    />
  );
}

/* ─── Premium CTA ────────────────────────────────────────────────── */
function PremiumCTA({
  accentRgb,
  running,
  onClick,
}: {
  accentRgb: string;
  running: boolean;
  onClick: () => void;
}) {
  return (
    <div className="group/cta relative isolate inline-block">
      <motion.span
        aria-hidden
        className="pointer-events-none absolute left-1/2 -z-10 -translate-x-1/2 rounded-full"
        style={{
          bottom: -22,
          width: "92%",
          height: 64,
          background: `radial-gradient(ellipse at center, rgba(${accentRgb},0.55) 0%, rgba(${accentRgb},0.18) 40%, transparent 70%)`,
          filter: "blur(22px)",
        }}
        animate={{ opacity: [0.55, 0.95, 0.55], scale: [0.96, 1.04, 0.96] }}
        transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.button
        type="button"
        onClick={onClick}
        disabled={running}
        whileHover={{ scale: running ? 1 : 1.015, y: running ? 0 : -1 }}
        whileTap={{ scale: running ? 1 : 0.985, y: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="group/btn relative inline-flex min-w-[260px] items-center justify-center gap-3 overflow-hidden rounded-2xl px-9 py-[18px] text-[14.5px] font-medium text-white transition-[box-shadow,filter] duration-500 ease-out hover:brightness-[1.06] disabled:cursor-not-allowed disabled:opacity-70"
        style={{
          background: `radial-gradient(120% 100% at 50% 0%, rgba(255,255,255,0.22) 0%, transparent 55%), linear-gradient(180deg, rgba(${accentRgb},1) 0%, rgba(${accentRgb},0.86) 100%)`,
          border: `1px solid rgba(${accentRgb},0.7)`,
          boxShadow: `0 1px 0 rgba(255,255,255,0.45) inset, 0 -12px 24px rgba(0,0,0,0.22) inset, 0 18px 50px rgba(${accentRgb},0.45), 0 6px 18px rgba(${accentRgb},0.35), 0 1px 2px rgba(0,0,0,0.4)`,
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          letterSpacing: "-0.005em",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-1 top-[1px] h-1/2 rounded-t-2xl"
          style={{
            background: "linear-gradient(180deg, rgba(255,255,255,0.32), rgba(255,255,255,0))",
            opacity: 0.7,
          }}
        />
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 transition-all duration-[1100ms] ease-out group-hover/btn:translate-x-[120%] group-hover/btn:opacity-100"
        />
        {running ? (
          <>
            <Spinner />
            <span className="relative">Analysiere …</span>
          </>
        ) : (
          <>
            <span className="relative">System analysieren</span>
            <span
              aria-hidden
              className="relative inline-flex h-6 w-6 items-center justify-center rounded-full transition-all duration-500 ease-out group-hover/btn:translate-x-1 group-hover/btn:bg-white/25"
              style={{
                background: "rgba(255,255,255,0.18)",
                border: "1px solid rgba(255,255,255,0.30)",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
          </>
        )}
      </motion.button>
    </div>
  );
}

function Spinner() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="rgba(255,255,255,0.95)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Result panel — Executive system proposal ────────────────────── */
function ResultPanel({
  accentRgb,
  result,
  aiSummary,
  aiLoading,
  onAi,
}: {
  accentRgb: string;
  result: ScanResult;
  aiSummary: string | null;
  aiLoading: boolean;
  onAi: () => void;
}) {
  const exec: ExecutiveAnalysis = useMemo(() => toExecutive(result), [result]);
  const [techOpen, setTechOpen] = useState(false);

  return (
    <ExecutiveProposal
      accentRgb={accentRgb}
      exec={exec}
      result={result}
      aiSummary={aiSummary}
      aiLoading={aiLoading}
      onAi={onAi}
      techOpen={techOpen}
      onToggleTech={() => setTechOpen((v) => !v)}
    />
  );
}

function ExecutiveProposal({
  accentRgb,
  exec,
  result,
  aiSummary,
  aiLoading,
  onAi,
  techOpen,
  onToggleTech,
}: {
  accentRgb: string;
  exec: ExecutiveAnalysis;
  result: ScanResult;
  aiSummary: string | null;
  aiLoading: boolean;
  onAi: () => void;
  techOpen: boolean;
  onToggleTech: () => void;
}) {
  const confidencePct = Math.round(exec.confidence * 100);
  return (
    <div className="grid gap-7">
      {/* ── 1. EXECUTIVE SUMMARY ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: `0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(60% 50% at 100% 0%, rgba(${accentRgb},0.16) 0%, transparent 60%)`,
          }}
        />
        <div className="relative grid gap-7 p-7 sm:p-9 lg:grid-cols-[auto_1fr] lg:items-center lg:gap-10">
          <PotentialDial value={exec.potentialScore} accentRgb={accentRgb} />
          <div>
            <div className="flex flex-wrap items-center gap-2 text-[10.5px] uppercase tracking-[0.22em] text-white/45">
              <span>Executive Diagnose</span>
              <span className="text-white/25">·</span>
              <span style={{ color: `rgb(${accentRgb})` }}>
                {exec.industryLabel}
              </span>
              <span className="text-white/25">·</span>
              <span className="normal-case tracking-normal text-white/55">{exec.brand}</span>
              <span className="text-white/25">·</span>
              <span>{exec.domain}</span>
            </div>
            <h3
              className="mt-3 text-[1.55rem] leading-[1.18] text-white sm:text-[1.85rem] lg:text-[2.05rem]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
                letterSpacing: "-0.022em",
              }}
            >
              {exec.diagnosis}
            </h3>
            <p className="mt-4 max-w-[680px] text-[14.5px] leading-[1.7] text-white/65">
              {aiSummary ?? exec.diagnosisDetail}
            </p>
            {exec.observations.length ? (
              <ul className="mt-4 grid gap-1.5">
                {exec.observations.slice(0, 4).map((o, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-[12.5px] leading-[1.55] text-white/55"
                  >
                    <span
                      aria-hidden
                      className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full"
                      style={{ background: `rgba(${accentRgb},0.7)` }}
                    />
                    <span>{o}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <ConfidenceBar value={confidencePct} accentRgb={accentRgb} />
              {!aiSummary ? (
                <button
                  type="button"
                  onClick={onAi}
                  disabled={aiLoading}
                  className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] transition disabled:opacity-60"
                  style={{
                    color: `rgb(${accentRgb})`,
                    background: `rgba(${accentRgb},0.10)`,
                    border: `1px solid rgba(${accentRgb},0.30)`,
                  }}
                >
                  {aiLoading ? <Spinner /> : <span aria-hidden>✦</span>}
                  {aiLoading ? "Lade KI" : "KI-Vertiefung"}
                </button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-full bg-white/[0.04] px-3.5 py-1.5 text-[10.5px] uppercase tracking-[0.18em] text-white/55">
                  <span aria-hidden>✦</span> KI-vertieft
                </span>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── 2. BUSINESS SCORES ───────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.05 }}
      >
        <SectionLabel>Geschäftspotenzial</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {exec.scores.map((s, i) => (
            <BusinessScoreCard
              key={s.id}
              accentRgb={accentRgb}
              score={s}
              delay={i * 0.05}
            />
          ))}
        </div>
      </motion.div>

      {/* ── 3. OPPORTUNITY CARDS ─────────────────────────────────── */}
      {exec.opportunities.length ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
        >
          <SectionLabel>Wo Wachstum entstehen kann</SectionLabel>
          <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
            {exec.opportunities.map((o, i) => (
              <OpportunityCard
                key={o.id}
                accentRgb={accentRgb}
                opportunity={o}
                index={i}
              />
            ))}
          </div>
        </motion.div>
      ) : null}

      {/* ── 4 & 5. SYSTEM RECOMMENDATION + MODULES ───────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.15 }}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
          border: `1px solid rgba(${accentRgb},0.22)`,
          boxShadow: `0 40px 100px rgba(0,0,0,0.55), 0 0 80px rgba(${accentRgb},0.10), inset 0 1px 0 rgba(255,255,255,0.06)`,
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `radial-gradient(70% 60% at 0% 100%, rgba(${accentRgb},0.14) 0%, transparent 60%), radial-gradient(50% 50% at 100% 0%, rgba(${accentRgb},0.10) 0%, transparent 70%)`,
          }}
        />
        <div className="relative p-7 sm:p-10">
          <div className="flex flex-wrap items-baseline gap-2 text-[10.5px] uppercase tracking-[0.22em] text-white/45">
            <span style={{ color: `rgb(${accentRgb})` }}>· Empfohlenes System</span>
            <span className="text-white/25">·</span>
            <span>für {exec.domain}</span>
          </div>
          <h3
            className="mt-3 text-[1.7rem] leading-[1.1] text-white sm:text-[2.1rem] lg:text-[2.5rem]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
              letterSpacing: "-0.03em",
            }}
          >
            <span
              style={{
                background: `linear-gradient(120deg, rgb(${accentRgb}) 0%, #ffffff 70%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                filter: `drop-shadow(0 0 24px rgba(${accentRgb},0.4))`,
                fontWeight: 400,
              }}
            >
              {exec.recommendation.name}
            </span>
          </h3>
          <p className="mt-4 max-w-[680px] text-[15.5px] leading-[1.65] text-white/75">
            {exec.recommendation.oneliner}
          </p>

          {/* Modules */}
          <div className="mt-9 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exec.recommendation.modules.map((m, i) => (
              <ModuleCard
                key={m.name}
                accentRgb={accentRgb}
                module={m}
                index={i + 1}
              />
            ))}
          </div>

          {/* Impact */}
          <div
            className="mt-9 rounded-2xl p-5 sm:p-6"
            style={{
              background: `linear-gradient(135deg, rgba(${accentRgb},0.10), rgba(${accentRgb},0.02))`,
              border: `1px solid rgba(${accentRgb},0.25)`,
            }}
          >
            <div className="text-[10.5px] uppercase tracking-[0.22em]" style={{ color: `rgb(${accentRgb})` }}>
              Erwarteter Effekt
            </div>
            <p
              className="mt-2 text-[16px] leading-[1.55] text-white sm:text-[17px]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
                letterSpacing: "-0.012em",
              }}
            >
              {exec.recommendation.impact}
            </p>
          </div>
        </div>
      </motion.div>

      {/* ── 6. NEXT STEPS ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
      >
        <SectionLabel>Nächste Schritte</SectionLabel>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              n: "01",
              title: "System-Potenzial prüfen",
              body: "Wir validieren gemeinsam die Diagnose und priorisieren die größten Hebel.",
            },
            {
              n: "02",
              title: "Passendes System konzipieren",
              body: "Wir entwerfen die Module und den Ablauf — exakt für deinen Betrieb.",
            },
            {
              n: "03",
              title: "Umsetzung starten",
              body: "Wir bauen, integrieren und übergeben das System produktiv.",
            },
          ].map((step, i) => (
            <StepCard key={step.n} step={step} accentRgb={accentRgb} delay={i * 0.05} />
          ))}
        </div>
      </motion.div>

      {/* ── 7. CTA ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
        className="flex flex-col items-stretch gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="text-[12.5px] leading-[1.55] text-white/55">
          {exec.recommendation.name} —{" "}
          <span className="text-white/40">unverbindlicher Vorschlag.</span>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/kontakt"
            className="group/btn relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-3 text-[14px] font-medium text-white transition"
            style={{
              background: `linear-gradient(180deg, rgba(${accentRgb},1) 0%, rgba(${accentRgb},0.85) 100%)`,
              border: `1px solid rgba(${accentRgb},0.7)`,
              boxShadow: `0 1px 0 rgba(255,255,255,0.4) inset, 0 14px 38px rgba(${accentRgb},0.4), 0 4px 14px rgba(${accentRgb},0.3)`,
              fontFamily: "var(--font-headline), system-ui, sans-serif",
            }}
          >
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-0 transition-all duration-[1100ms] ease-out group-hover/btn:translate-x-[120%] group-hover/btn:opacity-100"
            />
            Systemvorschlag besprechen
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3 text-[14px] font-medium transition hover:bg-white/[0.06]"
            style={{
              color: "rgba(255,255,255,0.85)",
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.10)",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
            }}
          >
            Analyse als PDF
          </button>
        </div>
      </motion.div>

      {/* ── Technical details (collapsed) ────────────────────────── */}
      <div
        className="rounded-2xl"
        style={{
          background: "rgba(255,255,255,0.015)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <button
          type="button"
          onClick={onToggleTech}
          className="flex w-full items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-left transition hover:bg-white/[0.02]"
        >
          <span className="flex items-center gap-3">
            <span className="text-[10.5px] uppercase tracking-[0.22em] text-white/40">
              Technische Details
            </span>
            <span className="text-[11px] text-white/30">
              {result.findings.length} Befunde · {result.detected.length} Technologien · {result.durationMs} ms
            </span>
          </span>
          <span
            className="inline-flex h-6 w-6 items-center justify-center rounded-full text-white/55 transition"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              transform: techOpen ? "rotate(45deg)" : "rotate(0deg)",
            }}
            aria-hidden
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </span>
        </button>
        <AnimatePresence initial={false}>
          {techOpen ? (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <TechnicalDetails accentRgb={accentRgb} result={result} />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Helpers ──────────────────────────────────────────────────── */

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="text-[10.5px] uppercase tracking-[0.22em] text-white/45">
      {children}
    </div>
  );
}

function ConfidenceBar({ value, accentRgb }: { value: number; accentRgb: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className="text-[10.5px] uppercase tracking-[0.22em] text-white/40">
        Konfidenz
      </span>
      <div
        className="h-1 w-[100px] overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.08)" }}
      >
        <motion.span
          className="block h-full"
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          style={{
            background: `linear-gradient(90deg, rgba(${accentRgb},0.5), rgba(${accentRgb},0.95))`,
          }}
        />
      </div>
      <span className="text-[11px] text-white/55">{value}%</span>
    </div>
  );
}

function PotentialDial({
  value,
  accentRgb,
}: {
  value: number;
  accentRgb: string;
}) {
  const v = Math.max(0, Math.min(100, Math.round(value)));
  const c = 2 * Math.PI * 50;
  const dash = (v / 100) * c;
  return (
    <div className="relative mx-auto h-[150px] w-[150px] shrink-0 sm:h-[170px] sm:w-[170px]">
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <defs>
          <linearGradient id="dial-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={`rgb(${accentRgb})`} stopOpacity="0.95" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="50" stroke="rgba(255,255,255,0.06)" strokeWidth="6" fill="none" />
        <motion.circle
          cx="60"
          cy="60"
          r="50"
          stroke="url(#dial-grad)"
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c - dash}` }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: `drop-shadow(0 0 14px rgba(${accentRgb},0.55))` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-[44px] leading-none text-white sm:text-[52px]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 300,
            letterSpacing: "-0.04em",
          }}
        >
          {v}
        </span>
        <span className="mt-2 text-[9.5px] uppercase tracking-[0.28em] text-white/45">
          Potenzial
        </span>
      </div>
    </div>
  );
}

function BusinessScoreCard({
  accentRgb,
  score,
  delay,
}: {
  accentRgb: string;
  score: { id: string; label: string; hint: string; value: number };
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.008) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div
        className="text-[14px] text-white"
        style={{
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.005em",
        }}
      >
        {score.label}
      </div>
      <div className="mt-1 text-[11.5px] leading-[1.5] text-white/45">
        {score.hint}
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span
          className="text-[28px] leading-none text-white"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 300,
            letterSpacing: "-0.03em",
          }}
        >
          {score.value}
        </span>
        <span className="text-[11px] text-white/40">/ 100</span>
      </div>
      <div
        className="mt-3 h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: "rgba(255,255,255,0.06)" }}
      >
        <motion.span
          className="block h-full"
          initial={{ width: 0 }}
          animate={{ width: `${score.value}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }}
          style={{
            background: `linear-gradient(90deg, rgba(${accentRgb},0.5), rgba(${accentRgb},0.95))`,
            boxShadow: `0 0 6px rgba(${accentRgb},0.45)`,
          }}
        />
      </div>
    </motion.div>
  );
}

function OpportunityCard({
  accentRgb,
  opportunity,
  index,
}: {
  accentRgb: string;
  opportunity: { problem: string; matters: string; improvement: string; effect: string };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.08 * index }}
      className="relative rounded-2xl p-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-baseline gap-3">
        <span
          className="text-[12px] tabular-nums"
          style={{ color: `rgb(${accentRgb})`, fontFeatureSettings: "'tnum'" }}
        >
          {String(index + 1).padStart(2, "0")}
        </span>
        <h4
          className="text-[16.5px] leading-[1.35] text-white"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.012em",
          }}
        >
          {opportunity.problem}
        </h4>
      </div>
      <p className="mt-3 text-[13.5px] leading-[1.65] text-white/60">
        {opportunity.matters}
      </p>
      <div className="my-5 h-px w-full" style={{ background: "rgba(255,255,255,0.06)" }} />
      <div className="grid gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            Was wir verbessern
          </div>
          <div className="mt-1 text-[13.5px] leading-[1.55] text-white/85">
            {opportunity.improvement}
          </div>
        </div>
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.22em]"
            style={{ color: `rgb(${accentRgb})` }}
          >
            Effekt fürs Geschäft
          </div>
          <div className="mt-1 text-[13.5px] leading-[1.55] text-white/85">
            {opportunity.effect}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ModuleCard({
  accentRgb,
  module,
  index,
}: {
  accentRgb: string;
  module: { name: string; benefit: string };
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.04 * index }}
      className="relative rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="flex items-baseline gap-2">
        <span
          className="text-[11px] tabular-nums"
          style={{ color: `rgb(${accentRgb})` }}
        >
          {String(index).padStart(2, "0")}
        </span>
        <div
          className="text-[14.5px] text-white"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 400,
            letterSpacing: "-0.005em",
          }}
        >
          {module.name}
        </div>
      </div>
      <p className="mt-2 text-[12.5px] leading-[1.6] text-white/60">
        {module.benefit}
      </p>
    </motion.div>
  );
}

function StepCard({
  step,
  accentRgb,
  delay,
}: {
  step: { n: string; title: string; body: string };
  accentRgb: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      className="relative rounded-2xl p-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.008) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <span
        className="text-[11px] tabular-nums"
        style={{ color: `rgb(${accentRgb})`, letterSpacing: "0.18em" }}
      >
        {step.n}
      </span>
      <div
        className="mt-2 text-[15.5px] text-white"
        style={{
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 400,
          letterSpacing: "-0.012em",
        }}
      >
        {step.title}
      </div>
      <p className="mt-2 text-[13px] leading-[1.6] text-white/55">
        {step.body}
      </p>
    </motion.div>
  );
}

function TechnicalDetails({
  accentRgb,
  result,
}: {
  accentRgb: string;
  result: ScanResult;
}) {
  const sevColor: Record<string, string> = {
    critical: "#ef4444",
    high: "#f97316",
    medium: "#eab308",
    low: "#22c55e",
    info: "#94a3b8",
  };
  return (
    <div className="grid gap-5 px-5 pb-6 pt-2 sm:px-6">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {(
          [
            ["UX", result.score.ux],
            ["Performance", result.score.performance],
            ["Conversion", result.score.conversion],
            ["Trust", result.score.trust],
            ["Security", result.score.security],
          ] as [string, number][]
        ).map(([label, v]) => (
          <div
            key={label}
            className="rounded-xl px-3 py-2.5"
            style={{
              background: "rgba(255,255,255,0.025)",
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div className="text-[9.5px] uppercase tracking-[0.18em] text-white/40">
              {label}
            </div>
            <div className="mt-0.5 text-[15px] text-white">
              {v}
              <span className="ml-0.5 text-[10px] text-white/40">/100</span>
            </div>
          </div>
        ))}
      </div>

      {result.detected.length ? (
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/40">
            Erkannter Stack
          </div>
          <div className="flex flex-wrap gap-1.5">
            {result.detected.map((d) => (
              <span
                key={`${d.category}-${d.name}`}
                className="rounded-md px-2.5 py-1 text-[11.5px] text-white/85"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <span className="mr-1.5 text-[9.5px] uppercase tracking-[0.16em] text-white/45">
                  {d.category}
                </span>
                {d.name}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {result.findings.length ? (
        <div>
          <div className="mb-2 text-[10px] uppercase tracking-[0.22em] text-white/40">
            Technische Befunde
          </div>
          <div className="grid gap-1.5">
            {result.findings.map((f) => (
              <div
                key={f.id}
                className="rounded-lg p-3"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-2 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.14em] text-white"
                    style={{ background: sevColor[f.severity] || "#6b7280" }}
                  >
                    {f.severity}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                    {f.area}
                  </span>
                </div>
                <div className="mt-1 text-[12.5px] font-medium text-white">
                  {f.title}
                </div>
                <div className="mt-0.5 text-[12px] leading-[1.5] text-white/55">
                  {f.detail}
                </div>
                {f.fix ? (
                  <div className="mt-1 text-[11.5px]" style={{ color: `rgb(${accentRgb})` }}>
                    → {f.fix}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
