"use client";

/**
 * NEXCEL AI · DiagnosticsHero
 *
 * Fullscreen (100svh) Hero — Mobile und Desktop fast identisch.
 * Reduziert. Dominant. Technisch. Premium.
 *
 * Die globale Premium-Navigation (`components/Navigation.tsx`) sitzt fixed
 * über diesem Hero. Der Hero rendert KEINE eigene Top-Leiste — er reserviert
 * lediglich oberen Whitespace für die Navigation.
 *
 * Aufbau (oben → unten):
 *   1. Premium-Eyebrow (Operations Intelligence Marker — keine Systemsprache)
 *   2. Headline + Subtext
 *   3. Input: URL
 *   4. Drop-Zone: Dateien
 *   5. Info-Link
 *   6. CTA "Analyse starten"
 *
 * Nach Klick: Reservierung → Uploads → Start → Redirect auf /diagnose/[id].
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

      {/* Reservierter Whitespace für die fixed Premium-Navigation oben.
          Die Navigation läuft eigenständig in einem fixed-z-[100]-Container. */}
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: "calc(env(safe-area-inset-top, 0px) + 104px)" }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-[680px] flex-1 flex-col px-5 pb-10 pt-2 sm:px-8 sm:pt-6 sm:pb-16 md:max-w-[760px] lg:max-w-[860px]">
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
              <Headline />

              <p className="mt-7 max-w-[560px] text-[15.5px] leading-[1.65] text-white/65 sm:text-[17px]">
                Wir sehen uns an, wie Ihr Betrieb tatsächlich arbeitet —
                über alle Tools, Prozesse und Übergaben hinweg.
              </p>

              <div className="mt-12 sm:mt-14">
                <label
                  htmlFor={urlInputId}
                  className="text-[10.5px] font-medium uppercase tracking-[0.30em]"
                  style={{ color: "#C4B5FD" }}
                >
                  Ihre Website
                </label>
                <UrlField
                  id={urlInputId}
                  value={url}
                  onChange={setUrl}
                  disabled={submitting}
                  onEnter={startAnalysis}
                />
                <PrivacyNote />
              </div>

              <div className="mt-12 sm:mt-14">
                <div
                  className="mb-3.5 text-[10.5px] font-medium uppercase leading-relaxed tracking-[0.30em]"
                  style={{ color: "#C4B5FD" }}
                >
                  So arbeiten Sie heute
                </div>
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

              <InfoLink open={infoOpen} onToggle={() => setInfoOpen((v) => !v)} />
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
                    <div
                      className="mt-3 rounded-xl px-5 py-5 text-[13.5px] leading-[1.7] text-white/70"
                      style={{
                        background: "rgba(255,255,255,0.022)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      Wir sehen uns an, wie Ihre Außenseite funktioniert
                      und welche Systeme dahinter erkennbar sind: wie
                      Anfragen einlaufen, wo Brüche entstehen, was
                      automatisierbar wäre.
                      <br />
                      <br />
                      Was Sie hochladen, bleibt bei uns. Wir nutzen es nur,
                      um das Bild Ihres Betriebs zu schärfen — nicht für
                      Tracking, nicht für Marketing.
                      <br />
                      <br />
                      Jede Bewertung am Ende lässt sich auf eine konkrete
                      Beobachtung zurückführen. Keine geratenen Zahlen,
                      keine erfundenen Scores.
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              <div className="mt-10 sm:mt-12">
                <PrimaryCTA
                  onClick={startAnalysis}
                  loading={submitting}
                  disabled={submitting}
                />
              </div>

              <AnimatePresence>
                {error ? (
                  <motion.div
                    key="err"
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-5 rounded-xl px-4 py-3 text-[13px]"
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
            </motion.div>
          ) : null}

          {stage === "running" && analysisId ? (
            <motion.div
              key="running"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
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
 *  Subcomponents
 *  ────────────────────────────────────────────────────────────────── */


function Headline() {
  return (
    <h1
      className="mt-5 text-[2.6rem] leading-[1.02] tracking-[-0.035em] text-white sm:mt-6 sm:text-[3.2rem] sm:leading-[1.0] md:text-[3.6rem] lg:text-[4rem]"
      style={{
        fontFamily: "var(--font-headline), system-ui, sans-serif",
        fontWeight: 300,
      }}
    >
      Unternehmenssysteme
      <br />
      statt{" "}
      <span
        style={{
          background:
            "var(--brand-headline-gradient)",
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          fontWeight: 400,
          filter: "drop-shadow(0 0 28px var(--brand-glow-strong))",
        }}
      >
        Tool-Chaos.
      </span>
    </h1>
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
      className="relative mt-3.5 flex items-center gap-3 overflow-hidden rounded-2xl px-4 py-4 transition-[border,box-shadow] duration-300 sm:px-5 sm:py-[18px]"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.012) 100%)",
        border: focused
          ? "1px solid var(--brand-line-mid)"
          : "1px solid rgba(255,255,255,0.08)",
        boxShadow: focused
          ? "0 0 0 4px var(--brand-plateau-1), inset 0 1px 0 rgba(255,255,255,0.05), 0 16px 40px var(--brand-glow-mid)"
          : "inset 0 1px 0 rgba(255,255,255,0.05), 0 10px 24px rgba(0,0,0,0.25)",
      }}
    >
      {/* Subtile Glas-Highlight oben */}
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
        placeholder="https://ihre-firma.de"
        className="relative w-full bg-transparent text-[16px] text-white placeholder-white/30 outline-none sm:text-[17px]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        disabled={disabled}
      />
    </div>
  );
}

function PrivacyNote() {
  return (
    <div className="mt-3 flex items-start gap-2 text-[12.5px] leading-[1.55] text-white/55">
      <ShieldIcon />
      <span>Wir lesen nur, was öffentlich zugänglich ist.</span>
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
      className="group/info mt-9 flex w-full items-center justify-between gap-3 border-y border-white/[0.06] py-3.5 text-left transition-colors hover:border-white/[0.12] sm:mt-10"
    >
      <span className="flex items-center gap-3">
        <span
          className="text-[10.5px] font-medium uppercase tracking-[0.30em]"
          style={{ color: "#C4B5FD" }}
        >
          Einblick
        </span>
        <span className="text-[13.5px] text-white/85 transition-colors group-hover/info:text-white">
          Was wir tatsächlich analysieren
        </span>
      </span>
      <motion.span
        aria-hidden
        className="inline-flex h-5 w-5 items-center justify-center text-white/55 transition-colors group-hover/info:text-white"
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
      >
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          className="transition-transform duration-500 ease-out group-hover/info:translate-x-0.5"
        >
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
      className="group/dz relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-12 text-center transition-[border,box-shadow,background,transform] duration-300 sm:py-14"
      style={{
        background: drag
          ? "radial-gradient(75% 85% at 50% 50%, var(--brand-glow-strong), rgba(255,255,255,0.02))"
          : "linear-gradient(180deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.008) 100%)",
        border: drag
          ? "1px dashed var(--brand-line-mid)"
          : hover
            ? "1px dashed var(--brand-line-dim)"
            : "1px dashed rgba(255,255,255,0.14)",
        boxShadow: drag
          ? "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 4px var(--brand-plateau-1), 0 28px 70px var(--brand-glow-strong)"
          : hover
            ? "inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 44px var(--brand-card-glow)"
            : "inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 24px rgba(0,0,0,0.22)",
        transform: drag ? "scale(1.005)" : "scale(1)",
      }}
    >
      {/* Soft Spotlight bei Hover/Drag */}
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

      {/* Corner-Marker — animieren bei Hover/Drag näher zur Mitte */}
      <DropCorner pos="tl" active={active} />
      <DropCorner pos="tr" active={active} />
      <DropCorner pos="bl" active={active} />
      <DropCorner pos="br" active={active} />

      {/* Großer dezenter Aufwärts-Pfeil — Apple/Arc-Look */}
      <UploadArrow active={active} drag={drag} />

      <div
        className="mt-1 text-[14px] text-white sm:text-[15px]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        {drag ? "Loslassen — wir nehmen es auf." : "Einfach hier ablegen"}
      </div>
      <div className="text-[12.5px] leading-[1.6] text-white/55 max-w-[360px]">
        Screenshots, Dokumente, Tabellen, Videos — alles, was Ihre Arbeit zeigt.
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
    <div className="relative mb-1 flex h-14 w-14 items-center justify-center">
      {/* Sanft pulsierender Ring */}
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
      {/* Subtile Bodenplatte/Glas-Disk */}
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
      {/* Pfeil — pulst sanft nach oben */}
      <motion.svg
        width="24"
        height="24"
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
          stroke={active ? "#DDD6FE" : "#C4B5FD"}
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
    <div className="group/cta relative">
      <motion.button
        type="button"
        onClick={onClick}
        disabled={disabled}
        whileTap={{ scale: disabled ? 1 : 0.985 }}
        whileHover={{ scale: disabled ? 1 : 1.008, y: disabled ? 0 : -1 }}
        transition={{ type: "spring", stiffness: 380, damping: 28 }}
        className="group/btn relative flex w-full items-center justify-center gap-3 rounded-2xl px-7 py-[18px] text-[13px] font-medium uppercase transition-all duration-500 disabled:cursor-not-allowed disabled:opacity-50 sm:py-[19px] sm:text-[13.5px]"
        style={{
          color: "rgba(255,255,255,0.92)",
          background: "rgba(255,255,255,0.02)",
          border: "1px solid var(--brand-card-border)",
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          letterSpacing: "0.22em",
          fontWeight: 500,
        }}
      >
        {/* Hover hairline — dezent, brand-aware */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover/btn:opacity-100"
          style={{
            border: "1px solid var(--brand-line-mid)",
            boxShadow: "0 0 32px var(--brand-glow-mid)",
          }}
        />
        {loading ? (
          <>
            <Spinner />
            <span className="relative normal-case tracking-normal">
              Analyse wird gestartet…
            </span>
          </>
        ) : (
          <>
            <span className="relative">Analyse starten</span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              aria-hidden
              className="relative transition-transform duration-500 group-hover/btn:translate-x-0.5"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        )}
      </motion.button>
    </div>
  );
}

function BackgroundLayers() {
  return (
    <>
      {/* Subtile Grid — Operations-Feel */}
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
            "radial-gradient(ellipse 80% 65% at 50% 35%, #000 25%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 80% 65% at 50% 35%, #000 25%, transparent 85%)",
        }}
      />
      {/* Aurora — langsam driftend */}
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
      {/* Horizon Glow */}
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
      {/* Vignette */}
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
      className="mt-[2px] shrink-0"
    >
      <path
        d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"
        stroke="rgba(255,255,255,0.5)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="m9 12 2 2 4-4"
        stroke="rgba(255,255,255,0.5)"
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
