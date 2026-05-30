"use client";

/**
 * NEXCEL AI / AGI WORKS · DiagnosticsHero (High-End)
 *
 * Zweispaltiges Premium-Layout:
 *   ┌──────────────────────────────┬───────────────────────────┐
 *   │  Eyebrow                      │                           │
 *   │  Headline (gestaffelt)        │   Analyse-Card            │
 *   │  Subtext                      │   (URL · Upload · CTA)    │
 *   │  Trust-Badges                 │                           │
 *   └──────────────────────────────┴───────────────────────────┘
 *   │  SO FUNKTIONIERT ES — 4 Schritte                          │
 *   │  BEISPIEL AUSWERTUNG — Metrik-Karten                      │
 *   └───────────────────────────────────────────────────────────┘
 *
 * Brand-aware: alle Farben über --brand-* / --accent CSS-Variablen,
 * dadurch identisch lauffähig für NEXCEL AI (violett) und AGI Works (cyan).
 *
 * WICHTIG: Die Analyse-/Upload-/Live-Logik ist unverändert. Nach Klick:
 * Reservierung → Uploads → Start → LiveAnalysisStage.
 */

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LiveAnalysisStage from "./LiveAnalysisStage";

type Stage = "input" | "running";

interface Upload {
  uploadId: string;
  filename: string;
  bytes: number;
  mimeType: string;
}

export default function DiagnosticsHero() {
  const [stage, setStage] = useState<Stage>("input");
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const urlInputId = useId();

  /** Sanft zum Hero-Anfang scrollen — damit die Live-Analyse sichtbar bleibt. */
  const scrollToAnalysisView = useCallback(() => {
    requestAnimationFrame(() => {
      const el = heroRef.current;
      if (!el) return;
      const navClearance = 108;
      const top =
        el.getBoundingClientRect().top + window.scrollY - navClearance;
      const prefersReducedMotion =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({
        top: Math.max(0, top),
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });
  }, []);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;
    setPendingFiles((prev) => [...prev, ...Array.from(files)].slice(0, 10));
    setError(null);
  }, []);

  const removeFile = useCallback((idx: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const startAnalysis = useCallback(async () => {
    setError(null);
    const cleanUrl = url.trim();
    if (!cleanUrl && pendingFiles.length === 0) {
      setError("Bitte URL eingeben oder Dateien hochladen.");
      return;
    }

    scrollToAnalysisView();
    setSubmitting(true);
    try {
      const sessionId =
        typeof window !== "undefined"
          ? window.sessionStorage.getItem("nx-sid") ??
            (() => {
              const id = `s_${crypto.randomUUID()}`;
              window.sessionStorage.setItem("nx-sid", id);
              return id;
            })()
          : null;
      try {
        const { track } = await import("@/lib/track");
        track("event", {
          meta: {
            kind: "diagnostics_start",
            url: cleanUrl,
            fileCount: pendingFiles.length,
            totalBytes: pendingFiles.reduce((a, f) => a + f.size, 0),
          },
        });
      } catch {
        /* swallow */
      }
      const createRes = await fetch("/api/diagnostics/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: cleanUrl || null,
          sessionId,
          device: typeof navigator !== "undefined" ? navigator.userAgent : null,
          referrer:
            typeof document !== "undefined" ? document.referrer || null : null,
        }),
      });
      if (!createRes.ok) {
        const j = await safeJson(createRes);
        throw new Error(j?.error || `Server-Fehler (${createRes.status})`);
      }
      const created = (await createRes.json()) as { analysisId: string };
      const aid = created.analysisId;

      const acceptedUploads: Upload[] = [];
      for (const f of pendingFiles) {
        const fd = new FormData();
        fd.append("file", f);
        const { track } = await import("@/lib/track");
        track("upload_start", {
          value: f.size,
          meta: { name: f.name, size: f.size, mime: f.type, analysisId: aid },
        });
        const upRes = await fetch(
          `/api/diagnostics/upload?analysisId=${encodeURIComponent(aid)}`,
          { method: "POST", body: fd },
        );
        if (!upRes.ok) {
          const j = await safeJson(upRes);
          track("upload_fail", {
            meta: { name: f.name, size: f.size, mime: f.type, status: upRes.status },
          });
          throw new Error(j?.error || `Upload fehlgeschlagen (${upRes.status})`);
        }
        const j = (await upRes.json()) as Upload;
        acceptedUploads.push(j);
        track("upload_complete", {
          value: f.size,
          meta: { name: f.name, size: f.size, mime: f.type, analysisId: aid },
        });
      }
      setUploads(acceptedUploads);

      const startRes = await fetch(
        `/api/diagnostics/start?analysisId=${encodeURIComponent(aid)}`,
        { method: "POST" },
      );
      if (!startRes.ok) {
        const j = await safeJson(startRes);
        throw new Error(j?.error || "Analyse konnte nicht gestartet werden.");
      }

      setAnalysisId(aid);
      setStage("running");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unbekannter Fehler.");
    } finally {
      setSubmitting(false);
    }
  }, [url, pendingFiles, scrollToAnalysisView]);

  // Nach Stage-Wechsel erneut einrasten — DOM-Update + Exit-Animation abwarten.
  useEffect(() => {
    if (stage !== "running") return;
    const t = window.setTimeout(scrollToAnalysisView, 120);
    return () => window.clearTimeout(t);
  }, [stage, scrollToAnalysisView]);

  return (
    <section
      ref={heroRef}
      id="diagnostik-hero"
      className="relative flex w-full flex-col overflow-hidden scroll-mt-[108px]"
      style={{
        minHeight: "100svh",
        background:
          "radial-gradient(ellipse 70% 50% at 50% 20%, #0c0820 0%, #050410 55%, #020205 100%)",
      }}
    >
      <BackgroundLayers />

      {/* Reservierter Whitespace für die fixed Premium-Navigation oben. */}
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: "calc(env(safe-area-inset-top, 0px) + 104px)" }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col px-5 pb-16 pt-2 sm:px-8 sm:pt-4">
        <AnimatePresence mode="wait">
          {stage === "input" ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="flex flex-col"
            >
              {/* ── Oberer Bereich: Headline links · Analyse-Card rechts ── */}
              <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
                {/* Linke Spalte */}
                <div className="flex flex-col">
                  <Eyebrow>
                    Unternehmensanalyse für Wachstum und Effizienz
                  </Eyebrow>
                  <Headline />
                  <p className="mt-6 max-w-[560px] text-[15.5px] leading-[1.65] text-white/65 sm:text-[17px]">
                    Unsere Analyse zeigt innerhalb weniger Minuten, wo Prozesse
                    bremsen, Systeme nicht zusammenarbeiten und wertvolle Zeit
                    verloren geht.
                    <br />
                    <br />
                    Sie erhalten konkrete Handlungsempfehlungen für
                    Automatisierung, CRM, Prozesse und nachhaltiges Wachstum.
                  </p>
                  <TrustBadges />
                </div>

                {/* Rechte Spalte: Analyse-Card */}
                <div className="lg:pl-2">
                  <AnalysisCard>
                    <UrlField
                      id={urlInputId}
                      value={url}
                      onChange={setUrl}
                      disabled={submitting}
                      onEnter={startAnalysis}
                    />

                    <div className="mt-4">
                      <DropZone
                        fileInputRef={fileInputRef}
                        onFiles={onFiles}
                        disabled={submitting}
                      />
                      {pendingFiles.length > 0 ? (
                        <ul className="mt-3 grid gap-1.5">
                          {pendingFiles.map((f, i) => (
                            <li
                              key={`${f.name}-${i}`}
                              className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[12.5px]"
                              style={{
                                background: "rgba(255,255,255,0.03)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.85)",
                              }}
                            >
                              <span className="truncate">{f.name}</span>
                              <span className="flex shrink-0 items-center gap-3">
                                <span className="text-white/40">
                                  {formatBytes(f.size)}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => removeFile(i)}
                                  className="text-white/40 transition hover:text-white"
                                  aria-label="Datei entfernen"
                                >
                                  ×
                                </button>
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>

                    <div className="mt-5">
                      <PrimaryCTA
                        onClick={startAnalysis}
                        loading={submitting}
                        disabled={submitting}
                      />
                    </div>

                    <Reassurance />

                    <AnimatePresence>
                      {error ? (
                        <motion.div
                          key="err"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="mt-4 rounded-xl px-4 py-3 text-[13px]"
                          style={{
                            color: "#fecaca",
                            background: "rgba(239,68,68,0.08)",
                            border: "1px solid rgba(239,68,68,0.28)",
                          }}
                        >
                          {error}
                        </motion.div>
                      ) : null}
                    </AnimatePresence>

                    <InfoLink
                      open={infoOpen}
                      onToggle={() => setInfoOpen((v) => !v)}
                    />
                    <AnimatePresence>
                      {infoOpen ? (
                        <motion.div
                          key="info"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mt-3 text-[13px] leading-[1.7] text-white/65">
                            Wir sehen uns an, wie Ihre Außenseite funktioniert
                            und welche Systeme dahinter erkennbar sind: wie
                            Anfragen einlaufen, wo Brüche entstehen, was
                            automatisierbar wäre. Was Sie hochladen, bleibt bei
                            uns — keine Weitergabe, kein Marketing. Jede
                            Bewertung lässt sich auf eine konkrete Beobachtung
                            zurückführen.
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </AnalysisCard>
                </div>
              </div>

              {/* ── So funktioniert es ── */}
              <HowItWorks />

              {/* ── Beispiel Auswertung ── */}
              <ExampleReport />
            </motion.div>
          ) : null}

          {stage === "running" && analysisId ? (
            <motion.div
              key="running"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mx-auto w-full max-w-[860px]"
            >
              <LiveAnalysisStage
                analysisId={analysisId}
                url={url}
                uploads={uploads}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────
 *  Präsentations-Komponenten
 *  ────────────────────────────────────────────────────────────────── */

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-fit text-[11px] font-medium uppercase tracking-[0.34em]"
      style={{ color: "var(--accent)" }}
    >
      {children}
    </div>
  );
}

function Headline() {
  return (
    <h1
      className="mt-6 text-[2.5rem] leading-[1.04] tracking-[-0.035em] text-white sm:text-[3rem] sm:leading-[1.02] md:text-[3.4rem] lg:text-[3.7rem]"
      style={{
        fontFamily: "var(--font-headline), system-ui, sans-serif",
        fontWeight: 300,
      }}
    >
      Die meisten Unternehmen verlieren jeden Monat Geld durch ihre Prozesse.
      <br className="hidden sm:block" />{" "}
      <span
        style={{
          background: "var(--brand-headline-gradient)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          fontWeight: 400,
          filter: "drop-shadow(0 0 28px var(--brand-glow-strong))",
        }}
      >
        Finden Sie heraus, wo.
      </span>
    </h1>
  );
}

function TrustBadges() {
  const items = [
    "100 % kostenlos",
    "Keine Registrierung erforderlich",
    "Ergebnisse in wenigen Minuten",
    "Für wachsende Unternehmen entwickelt",
  ];
  return (
    <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
      {items.map((label) => (
        <li
          key={label}
          className="flex items-center gap-2 text-[13px] text-white/70"
        >
          <CheckCircle />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}

function AnalysisCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-[26px] p-6 sm:p-7"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid var(--brand-card-border)",
        boxShadow:
          "0 40px 100px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.07)",
        backdropFilter: "blur(28px)",
        WebkitBackdropFilter: "blur(28px)",
      }}
    >
      {/* Brand-Glow oben */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--brand-line-bright), transparent)",
          opacity: 0.55,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-48 w-48 rounded-full"
        style={{
          background:
            "radial-gradient(circle, var(--brand-glow-mid), transparent 70%)",
          filter: "blur(10px)",
        }}
      />

      <h2
        className="relative text-[20px] font-medium tracking-[-0.01em] text-white sm:text-[22px]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        Erhalten Sie Ihre individuelle Potenzialanalyse
      </h2>
      <p className="relative mt-2 text-[13.5px] leading-[1.6] text-white/55">
        Wir analysieren öffentlich sichtbare Unternehmensdaten und optional
        bereitgestellte Informationen, um Engpässe, Automatisierungspotenziale und
        Wachstumsbremsen sichtbar zu machen.
      </p>

      <div className="relative mt-6">{children}</div>
    </motion.div>
  );
}

function Reassurance() {
  return (
    <div className="mt-3.5 flex items-center justify-center gap-2 text-[12px] text-white/45">
      <ShieldIcon />
      <span>
        Keine Verpflichtung. Keine Verkaufsgespräche. Nur Ergebnisse.
      </span>
    </div>
  );
}

function UrlField({
  id,
  value,
  onChange,
  onEnter,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (s: string) => void;
  onEnter: () => void;
  disabled?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div
      className="relative flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-4 transition-[border,box-shadow] duration-300 sm:px-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
        border: focused
          ? "1px solid var(--brand-line-mid)"
          : "1px solid rgba(255,255,255,0.10)",
        boxShadow: focused
          ? "0 0 0 4px var(--brand-plateau-1), inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 40px var(--brand-glow-mid)"
          : "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 24px rgba(0,0,0,0.25)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-px h-1/2 rounded-t-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 100%)",
        }}
      />
      <LinkIcon />
      <input
        id={id}
        type="url"
        inputMode="url"
        autoComplete="url"
        spellCheck={false}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !disabled) {
            e.preventDefault();
            onEnter();
          }
        }}
        placeholder="Ihre Website (z. B. ihrefirma.de)"
        className="relative w-full bg-transparent text-[15.5px] text-white placeholder-white/35 outline-none sm:text-[16px]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        disabled={disabled}
      />
    </div>
  );
}

/**
 * InfoLink — kein FAQ-Geschmack, kein Box-Look. Sehr ruhig, mit dezenter
 * Pfeil-Animation bei Hover (Pfeil rotiert leicht nach unten, wenn offen).
 */
function InfoLink({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="group/info mt-5 flex w-full items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-left transition-colors hover:border-white/[0.12]"
    >
      <span className="flex items-center gap-2.5">
        <span
          className="text-[10px] font-medium uppercase tracking-[0.26em]"
          style={{ color: "var(--accent)" }}
        >
          Einblick
        </span>
        <span className="text-[12.5px] text-white/70 transition-colors group-hover/info:text-white">
          Was wir tatsächlich analysieren
        </span>
      </span>
      <motion.span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center text-white/55 transition-colors group-hover/info:text-white"
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>
    </button>
  );
}

function DropZone({
  fileInputRef,
  onFiles,
  disabled,
}: {
  fileInputRef: React.RefObject<HTMLInputElement>;
  onFiles: (files: FileList | null) => void;
  disabled?: boolean;
}) {
  const [drag, setDrag] = useState(false);
  const [hover, setHover] = useState(false);
  const active = drag || hover;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !disabled && fileInputRef.current?.click()}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !disabled)
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
        onFiles(e.dataTransfer.files);
      }}
      className="group/dz relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl px-6 py-7 text-center transition-[border,box-shadow,background,transform] duration-300"
      style={{
        background: drag
          ? "radial-gradient(75% 85% at 50% 50%, var(--brand-glow-strong), rgba(255,255,255,0.02))"
          : "linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0.006) 100%)",
        border: drag
          ? "1px dashed var(--brand-line-mid)"
          : hover
            ? "1px dashed var(--brand-line-dim)"
            : "1px dashed rgba(255,255,255,0.14)",
        boxShadow: drag
          ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 4px var(--brand-plateau-1), 0 24px 60px var(--brand-glow-strong)"
          : hover
            ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 40px var(--brand-card-glow)"
            : "inset 0 1px 0 rgba(255,255,255,0.04), 0 8px 20px rgba(0,0,0,0.22)",
        transform: drag ? "scale(1.005)" : "scale(1)",
      }}
    >
      <motion.span
        aria-hidden
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: active ? 1 : 0 }}
        transition={{ duration: 0.45 }}
        style={{
          background:
            "radial-gradient(60% 70% at 50% 40%, var(--brand-glow-mid), transparent 70%)",
        }}
      />

      <DropCorner pos="tl" active={active} />
      <DropCorner pos="tr" active={active} />
      <DropCorner pos="bl" active={active} />
      <DropCorner pos="br" active={active} />

      <UploadArrow active={active} drag={drag} />

      <div
        className="mt-0.5 text-[13.5px] text-white"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        {drag
          ? "Loslassen — wir nehmen es auf."
          : "Zusätzliche Informationen bereitstellen (optional)"}
      </div>
      <div className="text-[12px] leading-[1.55] text-white/50">
        Screenshots, Prozessübersichten, Excel-Dateien oder Dokumente für eine
        präzisere Analyse.
      </div>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
    </div>
  );
}

function UploadArrow({ active, drag }: { active: boolean; drag: boolean }) {
  return (
    <div className="relative mb-0.5 flex h-11 w-11 items-center justify-center">
      <motion.span
        aria-hidden
        className="absolute inset-0 rounded-full"
        animate={{
          scale: active ? [1, 1.18, 1] : [1, 1.08, 1],
          opacity: active ? [0.5, 0, 0.5] : [0.25, 0, 0.25],
        }}
        transition={{
          duration: active ? 1.6 : 3.2,
          repeat: Infinity,
          ease: "easeOut",
        }}
        style={{
          background:
            "radial-gradient(circle, var(--brand-glow-strong), transparent 70%)",
        }}
      />
      <span
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 30%, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 60%, transparent 80%)",
          border: "1px solid var(--brand-line-mid)",
          boxShadow: drag
            ? "0 14px 38px var(--brand-glow-strong), inset 0 1px 0 rgba(255,255,255,0.10)"
            : "0 10px 26px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      />
      <motion.svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden
        className="relative"
        animate={{ y: drag ? [-1, -5, -1] : [0, -4, 0] }}
        transition={{
          duration: drag ? 1.2 : 2.6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <path
          d="M12 19V5M12 5l-6 6M12 5l6 6"
          stroke={active ? "var(--brand-line-bright)" : "var(--accent)"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </motion.svg>
    </div>
  );
}

function DropCorner({
  pos,
  active,
}: {
  pos: "tl" | "tr" | "bl" | "br";
  active: boolean;
}) {
  const color = active ? "var(--brand-line-mid)" : "var(--brand-line-dim)";
  const inset = active ? 6 : 9;
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute h-3 w-3 transition-[top,bottom,left,right,border-color] duration-500 ease-out"
      style={{
        top: pos.startsWith("t") ? inset : "auto",
        bottom: pos.startsWith("b") ? inset : "auto",
        left: pos.endsWith("l") ? inset : "auto",
        right: pos.endsWith("r") ? inset : "auto",
        borderTop: pos.startsWith("t") ? `1.5px solid ${color}` : undefined,
        borderBottom: pos.startsWith("b") ? `1.5px solid ${color}` : undefined,
        borderLeft: pos.endsWith("l") ? `1.5px solid ${color}` : undefined,
        borderRight: pos.endsWith("r") ? `1.5px solid ${color}` : undefined,
      }}
    />
  );
}

function PrimaryCTA({
  onClick,
  loading,
  disabled,
}: {
  onClick: () => void;
  loading: boolean;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.985 }}
      whileHover={{ scale: disabled ? 1 : 1.01, y: disabled ? 0 : -1 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="group/btn relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-7 py-[17px] text-[13.5px] font-semibold uppercase text-white transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-60 sm:py-[18px]"
      style={{
        background: "var(--brand-gradient)",
        fontFamily: "var(--font-headline), system-ui, sans-serif",
        letterSpacing: "0.16em",
        boxShadow:
          "0 16px 40px var(--brand-glow-strong), inset 0 1px 0 rgba(255,255,255,0.28)",
      }}
    >
      {/* Sheen bei Hover */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-out group-hover/btn:translate-x-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent)",
        }}
      />
      {loading ? (
        <>
          <Spinner />
            <span className="relative normal-case tracking-normal">
              Potenzialanalyse wird gestartet…
            </span>
        </>
      ) : (
        <>
          <span className="relative">Potenzialanalyse starten</span>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            aria-hidden
            className="relative transition-transform duration-500 group-hover/btn:translate-x-0.5"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </>
      )}
    </motion.button>
  );
}

/* ─── So funktioniert es ──────────────────────────────────────────── */

function HowItWorks() {
  const steps = [
    {
      icon: <StepGlobeIcon />,
      title: "Website analysieren",
      desc: "Wir erfassen die digitale Struktur Ihres Unternehmens.",
    },
    {
      icon: <StepUploadIcon />,
      title: "Zusätzliche Informationen hinzufügen",
      desc: "Optional für präzisere Ergebnisse.",
    },
    {
      icon: <StepSparkIcon />,
      title: "Potenziale identifizieren",
      desc: "Prozesse, Systeme und Engpässe werden bewertet.",
    },
    {
      icon: <StepChartIcon />,
      title: "Konkrete Empfehlungen erhalten",
      desc: "Mit klaren nächsten Schritten für Wachstum und Effizienz.",
    },
  ];
  return (
    <div className="mt-20 sm:mt-24">
      <SectionLabel>So funktioniert es</SectionLabel>
      <div className="relative mt-8 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 lg:grid-cols-4">
        {/* Verbindungs-Hairline (nur Desktop) */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-0 right-0 top-6 hidden h-px lg:block"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--brand-line-dim) 12%, var(--brand-line-dim) 88%, transparent)",
            opacity: 0.6,
          }}
        />
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-12%" }}
            transition={{
              duration: 0.55,
              delay: i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="relative flex flex-col items-start"
          >
            <div className="relative mb-5 flex items-center gap-3">
              <StepBadge index={i + 1} icon={s.icon} />
            </div>
            <h3
              className="text-[15px] font-medium text-white"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            >
              {s.title}
            </h3>
            <p className="mt-2 max-w-[260px] text-[13px] leading-[1.6] text-white/55">
              {s.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function StepBadge({ index, icon }: { index: number; icon: React.ReactNode }) {
  return (
    <span
      className="relative flex h-12 w-12 items-center justify-center rounded-2xl"
      style={{
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.015))",
        border: "1px solid var(--brand-card-border)",
        boxShadow:
          "0 12px 30px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.07), 0 0 24px var(--brand-card-glow)",
        color: "var(--accent)",
      }}
    >
      {icon}
      <span
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold text-white"
        style={{
          background: "var(--brand-gradient)",
          boxShadow: "0 4px 12px var(--brand-glow-strong)",
          fontFamily: "var(--font-headline), system-ui, sans-serif",
        }}
      >
        {index}
      </span>
    </span>
  );
}

/* ─── Beispiel Auswertung ─────────────────────────────────────────── */

function ExampleReport() {
  const gauges = [
    { label: "CRM", value: 82 },
    { label: "Automatisierung", value: 41 },
    { label: "Lead Management", value: 38 },
  ];
  return (
    <div className="mt-20 sm:mt-24">
      <SectionLabel>So könnte Ihre Analyse aussehen</SectionLabel>

      <div
        className="mt-8 rounded-[26px] p-5 sm:p-7"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.008) 100%)",
          border: "1px solid var(--brand-card-border)",
          boxShadow:
            "0 30px 80px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)",
        }}
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
          {gauges.map((g, i) => (
            <MetricCard key={g.label} delay={i * 0.07}>
              <GaugeRing value={g.value} />
              <div
                className="mt-3 text-[13px] font-medium text-white"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                }}
              >
                {g.label}
              </div>
              <div className="mt-0.5 text-[11.5px] text-white/45">
                Optimierungspotenzial
              </div>
            </MetricCard>
          ))}

          {/* Zeitverlust */}
          <MetricCard delay={0.21}>
            <div
              className="flex h-[78px] w-[78px] flex-col items-center justify-center rounded-full"
              style={{
                border: "1px solid var(--brand-card-border)",
                background:
                  "radial-gradient(circle at 50% 35%, var(--brand-glow-soft), transparent 70%)",
              }}
            >
              <span
                className="text-[20px] font-semibold text-white"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                }}
              >
                12h
              </span>
              <span className="text-[10px] text-white/45">/ Woche</span>
            </div>
            <div
              className="mt-3 text-[13px] font-medium text-white"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
              }}
            >
              Zeitverlust
            </div>
            <div className="mt-0.5 text-[11.5px] text-white/45">
              Durch ineffiziente Prozesse
            </div>
          </MetricCard>

          {/* Empfehlung */}
          <div
            className="col-span-2 flex flex-col justify-center rounded-2xl p-4 md:col-span-3 lg:col-span-1"
            style={{
              background:
                "linear-gradient(160deg, var(--brand-glow-mid), rgba(255,255,255,0.01))",
              border: "1px solid var(--brand-line-dim)",
              boxShadow: "0 0 30px var(--brand-card-glow)",
            }}
          >
            <div
              className="text-[10px] font-medium uppercase tracking-[0.22em]"
              style={{ color: "var(--accent)" }}
            >
              Empfehlung
            </div>
            <div
              className="mt-1.5 text-[14px] font-medium leading-[1.35] text-white"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
              }}
            >
              CRM-System + Automatisierung
            </div>
            <div className="mt-3 text-[11px] text-white/50">
              Erwartetes Potenzial
            </div>
            <div
              className="text-[15px] font-semibold"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                background: "var(--brand-headline-gradient)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
              }}
            >
              +20–35&nbsp;% Effizienz
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[11.5px] text-white/35">
          Jedes Unternehmen erhält eine individuelle Auswertung basierend auf
          seiner tatsächlichen Situation.
        </p>
      </div>
    </div>
  );
}

function MetricCard({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center rounded-2xl px-3 py-5 text-center"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {children}
    </motion.div>
  );
}

function GaugeRing({ value }: { value: number }) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - value / 100);
  return (
    <div className="relative flex h-[78px] w-[78px] items-center justify-center">
      <svg width="78" height="78" viewBox="0 0 78 78" className="-rotate-90">
        <circle
          cx="39"
          cy="39"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth="6"
        />
        <motion.circle
          cx="39"
          cy="39"
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
          style={{ filter: "drop-shadow(0 0 6px var(--brand-glow-strong))" }}
        />
      </svg>
      <span
        className="absolute text-[17px] font-semibold text-white"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        {value}%
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-4">
      <span
        aria-hidden
        className="h-px w-12"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--brand-line-dim))",
        }}
      />
      <span
        className="text-[10.5px] font-medium uppercase tracking-[0.30em]"
        style={{ color: "var(--accent)" }}
      >
        {children}
      </span>
      <span
        aria-hidden
        className="h-px w-12"
        style={{
          background:
            "linear-gradient(90deg, var(--brand-line-dim), transparent)",
        }}
      />
    </div>
  );
}

function BackgroundLayers() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.022) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.022) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 80% 65% at 50% 30%, #000 25%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 65% at 50% 30%, #000 25%, transparent 85%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        animate={{
          backgroundPosition: ["0% 0%", "100% 50%", "0% 100%", "0% 0%"],
        }}
        transition={{ duration: 70, repeat: Infinity, ease: "linear" }}
        style={{
          background: `
            radial-gradient(45% 38% at 18% 22%, var(--brand-glow-strong) 0%, transparent 65%),
            radial-gradient(38% 32% at 82% 78%, rgba(91,33,182,0.18) 0%, transparent 65%)
          `,
          backgroundSize: "220% 220%",
          filter: "blur(2px)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[55%]"
        animate={{ opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 100%, var(--brand-glow-mid) 0%, var(--brand-plateau-1) 35%, transparent 70%)",
          filter: "blur(22px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />
    </>
  );
}

/* ─── Tiny SVG components ───────────────────────────────────────── */

function CheckCircle() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="var(--accent)"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <path
        d="m8.5 12 2.5 2.5 4.5-5"
        stroke="var(--accent)"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"
        stroke="var(--brand-line-mid)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepGlobeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StepUploadIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 16V5m0 0-4 4m4-4 4 4M5 19h14"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepSparkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StepChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 19V5m0 14h16M8 19v-6m4 6V9m4 10v-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function Spinner() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="rgba(255,255,255,0.95)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
