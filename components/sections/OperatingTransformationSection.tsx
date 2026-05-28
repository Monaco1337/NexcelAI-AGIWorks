"use client";

import { motion } from "framer-motion";
import { useId } from "react";

/**
 * Operating Transformation — Section 2 (Chaos)
 * ────────────────────────────────────────────────────────────────
 *  Zweispaltiges Layout:
 *    LINKS  → Eyebrow + Headline „Kennen Sie das?" + Subline
 *    RECHTS → Chaos-Canvas mit 8 Tool-Inseln, gebrochenen Bezier-
 *             Verbindungen, roten Friktionspunkten und der zentralen
 *             „Keine Verbindung. Viel Verlust."-Card.
 *
 *  Unten konvergieren violette Lichtströme nach unten heraus — sie
 *  setzen sich als „Pfeile" nahtlos in Section 3 fort.
 */
export default function OperatingTransformationSection() {
  const headlineId = useId();
  return (
    <section
      aria-labelledby={headlineId}
      className="relative isolate overflow-hidden"
      style={{
        // Background-Stufen kommen aus dem aktiven Brand-Theme.
        // → NEXCEL: dunkel-violett (#020205 → #0a0420)
        // → AGI WORKS: dunkel-blau-graphit (#020308 → #031024)
        // Section endet ruhig bei var(--brand-bg-bottom) — kein Plateau-
        // Glow mehr am unteren Rand. Section 3 startet exakt mit demselben
        // Farbwert, die Naht bleibt also nahtlos, aber ohne lila Schein.
        background:
          "linear-gradient(180deg, var(--brand-bg-top) 0%, var(--brand-bg-mid) 55%, color-mix(in srgb, var(--brand-bg-mid) 65%, var(--brand-bg-bottom)) 82%, var(--brand-bg-bottom) 100%)",
      }}
    >
      <SectionBackdrop />

      <div className="relative mx-auto w-full max-w-[1280px] px-5 pt-24 pb-0 sm:px-8 sm:pt-28 lg:pt-32">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-16">
          {/* LINKE SPALTE */}
          <div className="lg:pt-6">
            <Header id={headlineId} />
          </div>

          {/* RECHTE SPALTE */}
          <div className="relative">
            <ChaosCanvas />
          </div>
        </div>
      </div>

      {/* ⬇ Bridge-Übergang — auf Wunsch reduziert.
         Plateau, Side-Fade und Light-Burst sind entfernt: sie haben am
         unteren Section-Rand einen lila/cyan Schein hinter den vier Strömen
         erzeugt. Übrig bleibt jetzt NUR der BridgeOutflow — also die vier
         Striche, die sich beim Scrollen mit dem Core in Section 3 verbinden. */}

      <BridgeOutflow />
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  BACKDROP
 *  ════════════════════════════════════════════════════════════════ */
function SectionBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.22]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: "120px 120px",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 60% 50%, #000 15%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 60% 50%, #000 15%, transparent 85%)",
        }}
      />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          // Nur noch dezente obere Glows (Atmosphäre um die Chaos-Tools).
          // Der frühere untere Glow (radial bei 60% 88%) ist entfernt —
          // er erzeugte am Section-2-Bottom einen lila/cyan Schein hinter
          // den vier BridgeOutflow-Strömen.
          background: `
            radial-gradient(ellipse 30% 22% at 18% 28%, var(--brand-glow-mid) 0%, transparent 70%),
            radial-gradient(ellipse 30% 22% at 82% 22%, var(--brand-glow-mid) 0%, transparent 70%)
          `,
        }}
      />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  HEADER — Eyebrow + Headline + Subline
 *  ════════════════════════════════════════════════════════════════ */
function Header({ id }: { id: string }) {
  return (
    <div className="relative">
      {/* Headline */}
      <motion.h2
        id={id}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        className="mt-6 text-[2.4rem] leading-[1.04] text-white sm:text-[3rem] md:text-[3.4rem] lg:text-[3.6rem]"
        style={{
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 300,
          letterSpacing: "-0.038em",
        }}
      >
        Kennen Sie{" "}
        <span
          className="relative inline-block"
          style={{
            background: "var(--brand-headline-gradient)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            fontWeight: 400,
            filter: "drop-shadow(0 0 22px var(--brand-glow-strong))",
          }}
        >
          das?
        </span>
      </motion.h2>

      {/* Subline mit angedeutetem Unterstrich-Akzent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.22 }}
        className="mt-6 max-w-[440px] text-[15px] leading-[1.65] text-white/65 sm:text-[16px]"
      >
        <p>Viele Tools. Viele Wege. Zu wenig Überblick.</p>
        <p className="mt-1">
          So arbeitet es bei den meisten{" "}
          <span className="relative inline-block text-white/85">
            Unternehmen
            <motion.span
              aria-hidden
              className="absolute inset-x-0 -bottom-1 block h-[2px]"
              initial={{ scaleX: 0, opacity: 0 }}
              whileInView={{ scaleX: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.95,
                ease: [0.22, 1, 0.36, 1],
                delay: 0.5,
              }}
              style={{
                transformOrigin: "left center",
                background: "var(--brand-wash)",
                filter: "drop-shadow(0 0 6px var(--brand-pill-active-glow))",
              }}
            />
          </span>
          .
        </p>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  GEOMETRY
 *  ChaosCanvas verwendet viewBox 100x100 (aspectRatio 1.15/1).
 *  ════════════════════════════════════════════════════════════════ */

type ToolKey =
  | "whatsapp"
  | "pdfs"
  | "excel"
  | "email"
  | "notes"
  | "calendar"
  | "trello"
  | "drive";

interface ToolDef {
  key: ToolKey;
  label: string;
  sub: string;
  x: number;
  y: number;
  delay: number;
  showOnMobile?: boolean;
}

// Acht frei schwebende Tool-Inseln, kontrolliertes operatives Chaos.
const TOOLS: ToolDef[] = [
  { key: "whatsapp", label: "WhatsApp", sub: "Nachrichten",    x: 46, y: 12, delay: 0.05, showOnMobile: true  },
  { key: "email",    label: "E-Mails",  sub: "Kommunikation",  x: 80, y: 22, delay: 0.18, showOnMobile: true  },
  { key: "notes",    label: "Notizen",  sub: "Ideen & To-dos", x: 86, y: 46, delay: 0.30, showOnMobile: false },
  { key: "excel",    label: "Excel",    sub: "Tabellen",       x: 14, y: 38, delay: 0.42, showOnMobile: true  },
  { key: "calendar", label: "Kalender", sub: "Termine",        x: 14, y: 70, delay: 0.54, showOnMobile: false },
  { key: "pdfs",     label: "PDFs",     sub: "Dokumente",      x: 36, y: 82, delay: 0.66, showOnMobile: false },
  { key: "trello",   label: "Trello",   sub: "Projekte",       x: 52, y: 64, delay: 0.78, showOnMobile: true  },
  { key: "drive",    label: "Drive",    sub: "Dateien",        x: 78, y: 76, delay: 0.90, showOnMobile: true  },
];

interface ChaosPath {
  d: string;
  delay: number;
  brokenDot?: { x: number; y: number };
}

const CHAOS_PATHS: ChaosPath[] = [
  { d: "M46,12 C58,16 70,18 80,22",   delay: 0.95, brokenDot: { x: 64, y: 17 } },
  { d: "M46,12 C32,18 22,28 14,38",   delay: 1.02, brokenDot: { x: 28, y: 23 } },
  { d: "M80,22 C84,30 86,38 86,46",   delay: 1.09 },
  { d: "M80,22 C68,30 56,38 52,64",   delay: 1.16, brokenDot: { x: 60, y: 38 } },
  { d: "M14,38 C14,50 14,60 14,70",   delay: 1.23 },
  { d: "M14,38 C24,42 38,46 52,64",   delay: 1.30, brokenDot: { x: 32, y: 47 } },
  { d: "M14,70 C24,76 32,80 36,82",   delay: 1.37 },
  { d: "M86,46 C82,56 74,66 78,76",   delay: 1.44, brokenDot: { x: 80, y: 60 } },
  { d: "M52,64 C62,68 72,72 78,76",   delay: 1.51 },
  { d: "M36,82 C48,80 60,76 52,64",   delay: 1.58, brokenDot: { x: 48, y: 78 } },
  { d: "M86,46 C70,52 60,58 52,64",   delay: 1.65 },
  { d: "M46,12 C42,28 36,44 32,52",   delay: 1.72, brokenDot: { x: 38, y: 32 } },
];

const CHAOS_CENTER = { x: 44, y: 46 };

const ATMOSPHERE_DOTS = [
  { x: 24, y: 18, delay: 1.30, size: 0.55 },
  { x: 72, y: 32, delay: 1.42, size: 0.65 },
  { x: 90, y: 36, delay: 1.55, size: 0.50 },
  { x: 30, y: 26, delay: 1.68, size: 0.55 },
  { x: 60, y: 20, delay: 1.80, size: 0.60 },
  { x: 6,  y: 50, delay: 1.92, size: 0.50 },
  { x: 94, y: 64, delay: 2.05, size: 0.55 },
  { x: 26, y: 60, delay: 2.18, size: 0.50 },
  { x: 64, y: 50, delay: 2.30, size: 0.55 },
  { x: 90, y: 86, delay: 2.42, size: 0.55 },
  { x: 6,  y: 84, delay: 2.55, size: 0.50 },
  { x: 42, y: 92, delay: 2.68, size: 0.55 },
];

/* ════════════════════════════════════════════════════════════════════
 *  CHAOS CANVAS
 *  ════════════════════════════════════════════════════════════════ */
function ChaosCanvas() {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: "1.15 / 1" }}
    >
      <Wireframe />

      {TOOLS.map((t) => (
        <ToolPill
          key={t.key}
          x={t.x}
          y={t.y}
          delay={t.delay}
          label={t.label}
          sub={t.sub}
          icon={<ToolIcon kind={t.key} />}
          hideOnMobile={!t.showOnMobile}
        />
      ))}

      {CHAOS_PATHS.filter((p) => p.brokenDot).map((p, i) => (
        <ErrorDot
          key={`err-${i}`}
          x={p.brokenDot!.x}
          y={p.brokenDot!.y}
          delay={1.65 + i * 0.08}
        />
      ))}

      <ChaosCenterMark />
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────
   Wireframe — gebrochene Bezier-Bahnen + Atmosphäre-Punkte
   ────────────────────────────────────────────────────────────────── */
function Wireframe() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="ot-chaos" x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0%"   stopColor="var(--brand-line-dim)" />
          <stop offset="40%"  stopColor="var(--brand-line-mid)" />
          <stop offset="60%"  stopColor="var(--brand-line-dim)" />
          <stop offset="100%" stopColor="var(--brand-line-dim)" stopOpacity="0.3" />
        </linearGradient>
      </defs>

      {CHAOS_PATHS.map((p, i) => (
        <motion.path
          key={`chaos-${i}`}
          d={p.d}
          fill="none"
          stroke="url(#ot-chaos)"
          strokeWidth="0.32"
          strokeDasharray="0.7 1.1"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 0.72 }}
          viewport={{ once: true, margin: "-15% 0px -15% 0px" }}
          transition={{
            duration: 1.2,
            delay: p.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ willChange: "stroke-dashoffset, opacity" }}
        />
      ))}

      {ATMOSPHERE_DOTS.map((d, i) => (
        <motion.circle
          key={`atmo-${i}`}
          cx={d.x}
          cy={d.y}
          r={d.size}
          fill="var(--brand-line-bright)"
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 0.78, scale: 1 }}
          viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          transition={{
            duration: 1.3,
            delay: d.delay,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{
            filter: "drop-shadow(0 0 1.6px var(--brand-glow-strong))",
          }}
        />
      ))}

      {ATMOSPHERE_DOTS.filter((_, i) => i % 4 === 0).map((d, i) => (
        <motion.circle
          key={`atmo-ring-${i}`}
          cx={d.x}
          cy={d.y}
          r={d.size * 2.2}
          fill="none"
          stroke="var(--brand-line-dim)"
          strokeWidth="0.10"
          initial={{ opacity: 0, scale: 0.4 }}
          whileInView={{ opacity: 0.6, scale: 1 }}
          viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          transition={{
            duration: 1.2,
            delay: d.delay + 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        />
      ))}
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  TOOL PILL
 *  ════════════════════════════════════════════════════════════════ */
function ToolPill({
  x,
  y,
  delay,
  label,
  sub,
  icon,
  hideOnMobile,
}: {
  x: number;
  y: number;
  delay: number;
  label: string;
  sub: string;
  icon: React.ReactNode;
  hideOnMobile?: boolean;
}) {
  return (
    <div
      className={`absolute ${hideOnMobile ? "hidden sm:block" : ""}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 8, filter: "blur(8px)" }}
        whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay }}
        className="flex items-center gap-2 whitespace-nowrap rounded-xl px-2.5 py-1.5 transform-gpu sm:gap-2.5 sm:px-3 sm:py-2"
        style={{
          background:
            "linear-gradient(180deg, rgba(22,22,32,0.94) 0%, rgba(10,10,16,0.94) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 42px rgba(0,0,0,0.58), 0 0 0 1px rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          willChange: "opacity, transform, filter",
        }}
      >
        <span
          className="flex h-6 w-6 items-center justify-center rounded-md sm:h-7 sm:w-7"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          {icon}
        </span>
        <div className="leading-none">
          <div
            className="text-[10.5px] font-medium text-white/95 sm:text-[12px]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            {label}
          </div>
          <div className="mt-0.5 text-[8.5px] uppercase tracking-[0.14em] text-white/45 sm:text-[9.5px]">
            {sub}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  CHAOS CENTER MARK — Glas-Card mit „Keine Verbindung. Viel Verlust."
 *  ════════════════════════════════════════════════════════════════ */
function ChaosCenterMark() {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${CHAOS_CENTER.x}%`,
        top: `${CHAOS_CENTER.y}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 6, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{
          duration: 0.95,
          ease: [0.22, 1, 0.36, 1],
          delay: 1.7,
        }}
        className="transform-gpu rounded-[14px] px-3.5 py-2 sm:px-4 sm:py-2.5"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,8,12,0.72) 0%, rgba(12,4,8,0.72) 100%)",
          border: "1px dashed rgba(248,113,113,0.42)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.04), 0 18px 44px rgba(0,0,0,0.60), 0 0 28px rgba(248,113,113,0.18)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-2">
          <motion.span
            className="inline-block h-1.5 w-1.5 rounded-full"
            animate={{
              opacity: [0.55, 1, 0.55],
              boxShadow: [
                "0 0 0 0 rgba(248,113,113,0.55)",
                "0 0 0 6px rgba(248,113,113,0)",
                "0 0 0 0 rgba(248,113,113,0.55)",
              ],
            }}
            transition={{
              duration: 2.2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            style={{ background: "#f87171" }}
          />
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.26em] sm:text-[10px]"
            style={{
              color: "rgba(254,202,202,0.95)",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
            }}
          >
            Keine Verbindung.
          </span>
        </div>
        <div className="mt-1 pl-3.5">
          <span
            className="text-[9px] font-semibold uppercase tracking-[0.26em] sm:text-[10px]"
            style={{
              color: "rgba(255,255,255,0.62)",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
            }}
          >
            Viel Verlust.
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  ERROR DOT
 *  ════════════════════════════════════════════════════════════════ */
function ErrorDot({
  x,
  y,
  delay,
}: {
  x: number;
  y: number;
  delay: number;
}) {
  return (
    <div
      className="pointer-events-none absolute"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transform: "translate(-50%, -50%)",
      }}
      aria-hidden
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{
          opacity: [0, 1, 0.95, 0.32],
          scale: [0.5, 1, 1, 0.9],
        }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{
          duration: 1.8,
          delay,
          times: [0, 0.2, 0.55, 1],
          ease: [0.22, 1, 0.36, 1],
        }}
        className="block transform-gpu"
        style={{ willChange: "opacity, transform" }}
      >
        <motion.span
          className="flex h-[12px] w-[12px] items-center justify-center rounded-full sm:h-[14px] sm:w-[14px]"
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(248,113,113,0.45)",
              "0 0 0 5px rgba(248,113,113,0)",
              "0 0 0 0 rgba(248,113,113,0.45)",
            ],
          }}
          transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            background:
              "radial-gradient(circle, rgba(248,113,113,0.95) 0%, rgba(220,38,38,0.85) 70%)",
            border: "1px solid rgba(248,113,113,0.6)",
          }}
        >
          <span
            className="text-[7px] font-bold leading-none text-white sm:text-[8px]"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            !
          </span>
        </motion.span>
      </motion.span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  BRIDGE OUTFLOW
 *  Lichtbahnen, die vom Chaos-Bereich nach unten in Section 3 fließen.
 *  Die Pfade konvergieren zur Section-Mitte unten und treten dort als
 *  Stream-Quelle aus → setzen sich in Section 3 als Bridge-Streams fort.
 *  ════════════════════════════════════════════════════════════════ */
function BridgeOutflow() {
  // viewBox 0-100 (x) × 0-100 (y). Vier fokussierte Pfeile, die sich
  // als enges Bündel in der Section-Mitte zu einem Lichtkanal vereinen.
  const STREAMS = [
    { d: "M 41,52 C 44,72 48,90 50,108", delay: 0.0  },
    { d: "M 47,52 C 48,74 49,92 50,108", delay: 0.04 },
    { d: "M 53,52 C 52,74 51,92 50,108", delay: 0.08 },
    { d: "M 59,52 C 56,72 52,90 50,108", delay: 0.12 },
  ];
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[40vh]">
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ot-outflow" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="var(--brand-line-dim)" stopOpacity="0" />
            <stop offset="35%"  stopColor="var(--brand-line-dim)" />
            <stop offset="75%"  stopColor="var(--brand-line-mid)" />
            <stop offset="100%" stopColor="var(--brand-line-bright)" />
          </linearGradient>
          <linearGradient id="ot-outflow-glow" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="var(--brand-line-dim)" stopOpacity="0" />
            <stop offset="55%"  stopColor="var(--brand-glow-mid)" />
            <stop offset="100%" stopColor="var(--brand-glow-strong)" />
          </linearGradient>
        </defs>

        {STREAMS.map((s, i) => (
          <g key={i}>
            {/* Soft glow underlay — schmaler & ruhiger als zuvor */}
            <motion.path
              d={s.d}
              fill="none"
              stroke="url(#ot-outflow-glow)"
              strokeWidth="0.40"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 0.7 }}
              viewport={{ once: true, margin: "-10% 0px -5% 0px" }}
              transition={{
                duration: 1.6,
                delay: 1.85 + s.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
              style={{ filter: "blur(0.5px)" }}
            />
            {/* Crisp line — ultra dünn, ohne Dasharray für klare High-End-Optik */}
            <motion.path
              d={s.d}
              fill="none"
              stroke="url(#ot-outflow)"
              strokeWidth="0.14"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-10% 0px -5% 0px" }}
              transition={{
                duration: 1.6,
                delay: 1.95 + s.delay,
                ease: [0.22, 1, 0.36, 1],
              }}
            />
            {/* OutflowPulse entfernt — die animierten Glow-Punkte wirkten
               zu auffällig. Die Striche stehen jetzt clean für sich. */}
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  ICONS
 *  ════════════════════════════════════════════════════════════════ */
function ToolIcon({ kind }: { kind: ToolKey }) {
  switch (kind) {
    case "whatsapp":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M12 3a9 9 0 0 0-7.6 13.8L3 21l4.4-1.4A9 9 0 1 0 12 3Z"
            fill="rgba(34,197,94,0.95)"
          />
          <path
            d="M9 8.5c.1-.4.5-.7.9-.7h.5c.2 0 .4.1.5.3l.7 1.6c.1.2 0 .4-.1.5l-.5.6c.5 1 1.4 1.8 2.4 2.3l.6-.5c.2-.1.4-.2.5-.1l1.6.7c.2.1.3.3.3.5v.5c0 .4-.3.8-.7.9-1.7.6-3.5-.4-5.1-1.9C8 11.6 7 9.7 9 8.5Z"
            fill="#fff"
          />
        </svg>
      );
    case "email":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <rect
            x="3"
            y="6"
            width="18"
            height="12"
            rx="2"
            fill="var(--brand-line-dim)"
            stroke="var(--brand-line-mid)"
            strokeWidth="1.2"
          />
          <path
            d="M4 8l8 6 8-6"
            fill="none"
            stroke="var(--brand-line-bright)"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "excel":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            fill="rgba(16,124,68,0.95)"
          />
          <path
            d="M8 9l8 6M16 9l-8 6"
            stroke="#fff"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </svg>
      );
    case "pdfs":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <rect
            x="4"
            y="3"
            width="14"
            height="18"
            rx="1.5"
            fill="rgba(220,38,38,0.92)"
          />
          <text
            x="11"
            y="15.5"
            textAnchor="middle"
            fontSize="6"
            fontWeight="700"
            fill="#fff"
            style={{ fontFamily: "system-ui, sans-serif" }}
          >
            PDF
          </text>
        </svg>
      );
    case "calendar":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <rect
            x="3"
            y="5"
            width="18"
            height="16"
            rx="2"
            fill="var(--brand-glow-mid)"
            stroke="var(--brand-line-mid)"
            strokeWidth="1.2"
          />
          <path
            d="M3 10h18"
            stroke="var(--brand-line-mid)"
            strokeWidth="1.2"
          />
          <rect x="7" y="3" width="1.6" height="4" rx="0.6" fill="var(--brand-line-bright)" />
          <rect x="15.4" y="3" width="1.6" height="4" rx="0.6" fill="var(--brand-line-bright)" />
        </svg>
      );
    case "notes":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <rect
            x="4"
            y="4"
            width="16"
            height="16"
            rx="2"
            fill="rgba(251,146,60,0.95)"
          />
          <path
            d="M7 9h10M7 12h10M7 15h6"
            stroke="rgba(120,53,15,0.75)"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "trello":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="3"
            fill="rgba(37,99,235,0.95)"
          />
          <rect x="6" y="6" width="5" height="11" rx="1" fill="#fff" opacity="0.95" />
          <rect x="13" y="6" width="5" height="7" rx="1" fill="#fff" opacity="0.95" />
        </svg>
      );
    case "drive":
      return (
        <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
          <path d="M9 4h6l6 10H15Z" fill="rgba(250,204,21,0.95)" />
          <path d="M3 14l3 6h12l-3-6Z" fill="rgba(34,197,94,0.95)" />
          <path d="M9 4 3 14l3 6 9-16Z" fill="rgba(59,130,246,0.95)" />
        </svg>
      );
  }
}
