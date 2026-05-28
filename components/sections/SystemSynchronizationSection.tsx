"use client";

import {
  motion,
  useScroll,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useId, useRef } from "react";

/* ════════════════════════════════════════════════════════════════════
 *  System Synchronization — Section 3
 *  ════════════════════════════════════════════════════════════════
 *  High-End, leicht verständliche Visualisierung der Operating-Story:
 *
 *    ┌────────────────────────────────────────────────────────┐
 *    │  VORHER · 6 isolierte Tools                            │
 *    │  [WhatsApp] [E-Mail] [Excel] [Termine] [Drive] [Trello]│
 *    │       │       │       │        │       │       │      │
 *    │       └───────┴───────┐│┌──────┴───────┴───────┘      │
 *    │                       ▼▼▼                              │
 *    │                ╔═══════════╗                           │
 *    │                ║ OPERATING ║   ● SYSTEM ACTIVE         │
 *    │                ║   CORE    ║                           │
 *    │                ╚═══════════╝                           │
 *    │                  │ │ │ │ │ │                           │
 *    │       ┌──────────┘ │ │ │ │ └──────────┐                │
 *    │       ▼            ▼ ▼ ▼ ▼            ▼                │
 *    │  [Kunden] [Nachrichten] … [Überblick]                  │
 *    │  NACHHER · 1 zentrales System                          │
 *    └────────────────────────────────────────────────────────┘
 *
 *  • Brand-aware: NEXCEL = Violett, AGI Works = Cyan
 *  • Scroll-tied Choreografie via useScroll + useTransform
 *  • Sticky Stage über die gesamte Section
 *  • Keine Stockfotos, keine organischen Formen — präzise
 *    Hardware-Sprache (Hexagon, Konzentrik, Rings)
 *  ════════════════════════════════════════════════════════════ */

/* ════════════════════════════════════════════════════════════════════
 *  DATA
 *  ════════════════════════════════════════════════════════════════ */

interface ToolDef {
  key: ToolKey;
  label: string;
  sub: string;
}
type ToolKey =
  | "whatsapp"
  | "email"
  | "excel"
  | "calendar"
  | "drive"
  | "trello";

const TOOLS: ToolDef[] = [
  { key: "whatsapp", label: "WhatsApp", sub: "Chat" },
  { key: "email",    label: "E-Mail",   sub: "Outlook · Gmail" },
  { key: "excel",    label: "Excel",    sub: "Tabellen" },
  { key: "calendar", label: "Termine",  sub: "Calendar" },
  { key: "drive",    label: "Drive",    sub: "Dokumente" },
  { key: "trello",   label: "Trello",   sub: "Boards" },
];

interface ModuleDef {
  key: ModuleKey;
  label: string;
  sub: string;
}
type ModuleKey =
  | "crm"
  | "messages"
  | "documents"
  | "processes"
  | "tasks"
  | "analytics";

const MODULES: ModuleDef[] = [
  { key: "crm",        label: "Kunden",      sub: "1 Profil pro Person" },
  { key: "messages",   label: "Nachrichten", sub: "1 Posteingang" },
  { key: "documents",  label: "Unterlagen",  sub: "Schnell griffbereit" },
  { key: "processes",  label: "Abläufe",     sub: "Läuft von alleine" },
  { key: "tasks",      label: "Aufgaben",    sub: "Nichts geht verloren" },
  { key: "analytics",  label: "Überblick",   sub: "Immer wissen, was läuft" },
];

/* ════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 *  ════════════════════════════════════════════════════════════════ */

export default function SystemSynchronizationSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const headlineId = useId();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // ────────────────────────────────────────────────────────────────
  //  CHOREOGRAFIE
  //  Reihenfolge: Header → Tools → Flow-In → Core → Flow-Out → Module
  //  → PoweredBy. Alles scroll-tied innerhalb der Sticky-Stage.
  // ────────────────────────────────────────────────────────────────
  const headerOpacity     = useTransform(scrollYProgress, [0.00, 0.10, 0.62], [0.4, 1, 1]);
  const toolsOpacity      = useTransform(scrollYProgress, [0.04, 0.14],       [0, 1]);
  const toolsY            = useTransform(scrollYProgress, [0.04, 0.14],       [12, 0]);
  const flowInOpacity     = useTransform(scrollYProgress, [0.10, 0.22],       [0, 1]);
  const flowInLength      = useTransform(scrollYProgress, [0.10, 0.24],       [0, 1]);
  const coreOpacity       = useTransform(scrollYProgress, [0.16, 0.26],       [0, 1]);
  const coreScale         = useTransform(scrollYProgress, [0.16, 0.32],       [0.75, 1]);
  const coreActiveOpacity = useTransform(scrollYProgress, [0.20, 0.30],       [0, 1]);
  const flowOutOpacity    = useTransform(scrollYProgress, [0.22, 0.34],       [0, 1]);
  const flowOutLength     = useTransform(scrollYProgress, [0.22, 0.36],       [0, 1]);
  const modulesOpacity    = useTransform(scrollYProgress, [0.26, 0.38],       [0, 1]);
  const modulesY          = useTransform(scrollYProgress, [0.26, 0.40],       [14, 0]);
  const poweredOpacity    = useTransform(scrollYProgress, [0.34, 0.46],       [0, 1]);
  const poweredY          = useTransform(scrollYProgress, [0.34, 0.46],       [10, 0]);

  // Atmosphere — Lokaler Glow um den Core (kein full-section purple)
  const atmosphereOpacity = useTransform(
    scrollYProgress,
    [0.0, 0.30, 0.50, 0.75, 1.0],
    [0, 0, 0.35, 0.40, 0.20]
  );

  return (
    <section
      ref={sectionRef}
      aria-labelledby={headlineId}
      className="relative isolate overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--brand-bg-bottom) 0%, color-mix(in srgb, var(--brand-bg-bottom) 55%, var(--brand-bg-mid)) 22%, var(--brand-bg-mid) 60%, var(--brand-bg-mid) 100%)",
        minHeight: "150vh",
      }}
    >
      <SectionAtmosphere opacity={atmosphereOpacity} />

      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-between px-5 py-[clamp(20px,3.2vh,48px)] sm:px-8 sm:py-[clamp(28px,4vh,56px)]">
        <Header id={headlineId} opacity={headerOpacity} />

        <Stage
          toolsOpacity={toolsOpacity}
          toolsY={toolsY}
          flowInOpacity={flowInOpacity}
          flowInLength={flowInLength}
          coreOpacity={coreOpacity}
          coreScale={coreScale}
          coreActiveOpacity={coreActiveOpacity}
          flowOutOpacity={flowOutOpacity}
          flowOutLength={flowOutLength}
          modulesOpacity={modulesOpacity}
          modulesY={modulesY}
        />

        <PoweredBy opacity={poweredOpacity} y={poweredY} />
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  ATMOSPHERE — sehr dezenter Glow um den Core herum
 *  ════════════════════════════════════════════════════════════════ */
function SectionAtmosphere({ opacity }: { opacity: MotionValue<number> }) {
  return (
    <>
      <motion.div
        aria-hidden
        style={{ opacity }}
        className="pointer-events-none absolute inset-0"
      >
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 36% 22% at 50% 50%, var(--brand-glow-strong) 0%, transparent 65%),
              radial-gradient(ellipse 18% 12% at 24% 42%, var(--brand-glow-soft) 0%, transparent 70%),
              radial-gradient(ellipse 18% 12% at 76% 58%, var(--brand-glow-soft) 0%, transparent 70%)
            `,
          }}
        />
      </motion.div>

      {/* Faintes Grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px)
          `,
          backgroundSize: "160px 160px",
          maskImage:
            "radial-gradient(ellipse 55% 45% at 50% 50%, #000 5%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 55% 45% at 50% 50%, #000 5%, transparent 80%)",
        }}
      />
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  HEADER
 *  ════════════════════════════════════════════════════════════════ */
function Header({ id, opacity }: { id: string; opacity: MotionValue<number> }) {
  return (
    <motion.div
      style={{ opacity }}
      className="relative z-10 mx-auto w-full max-w-[720px] text-center"
    >
      <motion.h2
        id={id}
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20% 0px -10% 0px" }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        className="text-[1.85rem] leading-[1.06] text-white sm:text-[2.4rem] md:text-[2.9rem]"
        style={{
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 300,
          letterSpacing: "-0.035em",
        }}
      >
        Alles arbeitet endlich{" "}
        <span
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
          zusammen.
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20% 0px -10% 0px" }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
        className="mx-auto mt-4 max-w-[520px] text-[13.5px] leading-[1.6] text-white/55 sm:mt-5 sm:text-[14.5px]"
      >
        Aus 6 getrennten Tools wird 1 zentrales System.
        <br className="hidden sm:block" />
        <span className="sm:hidden"> </span>
        Kommunikation, Daten und Prozesse — vereint.
      </motion.p>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  STAGE — die eigentliche 3-Zonen-Visualisierung
 *  ════════════════════════════════════════════════════════════════ */
interface StageProps {
  toolsOpacity: MotionValue<number>;
  toolsY: MotionValue<number>;
  flowInOpacity: MotionValue<number>;
  flowInLength: MotionValue<number>;
  coreOpacity: MotionValue<number>;
  coreScale: MotionValue<number>;
  coreActiveOpacity: MotionValue<number>;
  flowOutOpacity: MotionValue<number>;
  flowOutLength: MotionValue<number>;
  modulesOpacity: MotionValue<number>;
  modulesY: MotionValue<number>;
}

function Stage(p: StageProps) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[1100px] flex-col items-center gap-[clamp(16px,2.4vh,30px)]">
      {/* ── ZONE 1 — Eingehende Quellen (Typografie-Pills) ───────────── */}
      <ToolsRow opacity={p.toolsOpacity} y={p.toolsY} />

      {/* ── ZONE 2 — Flow in + CORE + Flow out ──────────────────────── */}
      <div className="relative mx-auto flex w-full max-w-[860px] flex-col items-center">
        <FlowLines
          opacity={p.flowInOpacity}
          length={p.flowInLength}
          direction="down"
          count={TOOLS.length}
        />
        <OperatingCore
          opacity={p.coreOpacity}
          scale={p.coreScale}
          activeOpacity={p.coreActiveOpacity}
        />
        <FlowLines
          opacity={p.flowOutOpacity}
          length={p.flowOutLength}
          direction="down"
          count={MODULES.length}
        />
      </div>

      {/* ── ZONE 3 — Strukturierte Module (nummerierte Tiles) ───────── */}
      <ModulesRow opacity={p.modulesOpacity} y={p.modulesY} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  TOOLS ROW — 6 Quell-Pills, reine Typografie
 *  ════════════════════════════════════════════════════════════════ */
function ToolsRow({
  opacity,
  y,
}: {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <motion.div
      style={{ opacity, y }}
      className="relative flex w-full flex-col items-center gap-2.5"
    >
      {/* Architectural Header — minimaler System-Tick + Caption */}
      <div className="flex items-center gap-3 text-white/35">
        <span
          aria-hidden
          className="h-px w-[28px] sm:w-[48px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.22) 100%)",
          }}
        />
        <span
          className="text-[9.5px] font-medium uppercase tracking-[0.36em] sm:text-[10px]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          Eingehende Quellen
        </span>
        <span
          aria-hidden
          className="h-px w-[28px] sm:w-[48px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.22) 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Pill-Reihe — reine Typografie, Status-Dot, Hairline-Glas */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
        {TOOLS.map((tool, i) => (
          <ToolPill key={tool.key} tool={tool} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function ToolPill({ tool, index }: { tool: ToolDef; index: number }) {
  return (
    <motion.div
      className="relative"
      animate={{ opacity: [0.65, 0.92, 0.65] }}
      transition={{
        duration: 3.4 + (index % 3) * 0.6,
        delay: index * 0.18,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1 sm:gap-2 sm:px-3.5 sm:py-1.5"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
          border: "1px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 2px 12px rgba(0,0,0,0.18)",
        }}
      >
        <span
          aria-hidden
          className="inline-block h-[4px] w-[4px] rounded-full sm:h-[5px] sm:w-[5px]"
          style={{
            background: "rgba(255,255,255,0.50)",
            boxShadow: "0 0 4px rgba(255,255,255,0.30)",
          }}
        />
        <span
          className="text-[10px] font-medium leading-none text-white/80 sm:text-[11.5px]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            letterSpacing: "0.04em",
          }}
        >
          {tool.label}
        </span>
        <span
          aria-hidden
          className="hidden h-[10px] w-px sm:inline-block"
          style={{ background: "rgba(255,255,255,0.10)" }}
        />
        <span
          className="hidden text-[9px] font-light leading-none text-white/35 sm:inline sm:text-[10px]"
          style={{ letterSpacing: "0.08em" }}
        >
          {tool.sub}
        </span>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  FLOW LINES — präzise vertikale Datenströme mit wandernden Lichtpunkten
 *  ════════════════════════════════════════════════════════════════ */
function FlowLines({
  opacity,
  length,
  direction,
  count,
}: {
  opacity: MotionValue<number>;
  length: MotionValue<number>;
  direction: "down" | "up";
  count: number;
}) {
  // Konvergiert nach unten zum Center; Up-Direction wäre Divergenz vom Center.
  // Wir nutzen immer "down" — die Linien beginnen oben gespreizt und enden
  // alle exakt am Center (50%, 100%). Symmetrisches Fächern.
  const SPREAD = 90; // %, wie weit die Linien oben gespreizt sind

  const startXs = Array.from({ length: count }, (_, i) => {
    const t = count === 1 ? 0.5 : i / (count - 1);
    return 50 - SPREAD / 2 + t * SPREAD;
  });

  return (
    <div
      className="relative w-full"
      style={{ height: "clamp(36px, 5vh, 64px)" }}
    >
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full overflow-visible"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`flow-${direction}`} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="var(--brand-line-dim)"    stopOpacity="0.55" />
            <stop offset="55%"  stopColor="var(--brand-line-mid)"    stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--brand-line-bright)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={`flow-${direction}-glow`} x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%"   stopColor="var(--brand-glow-mid)"    stopOpacity="0.05" />
            <stop offset="100%" stopColor="var(--brand-glow-strong)" stopOpacity="0.45" />
          </linearGradient>
        </defs>

        {startXs.map((sx, i) => {
          // Bezier von (sx, 0) zu (50, 100) — sanftes Fächern
          const cx1 = sx;
          const cy1 = 38;
          const cx2 = 50 + (sx - 50) * 0.16;
          const cy2 = 82;
          const d = `M ${sx},0 C ${cx1},${cy1} ${cx2},${cy2} 50,100`;
          return (
            <g key={i}>
              {/* Glow-Underlay (sehr dezent) */}
              <motion.path
                d={d}
                fill="none"
                stroke={`url(#flow-${direction}-glow)`}
                strokeWidth="0.38"
                strokeLinecap="round"
                style={{
                  pathLength: length,
                  opacity,
                  filter: "blur(0.7px)",
                }}
              />
              {/* Scharfe Hairline */}
              <motion.path
                d={d}
                fill="none"
                stroke={`url(#flow-${direction})`}
                strokeWidth="0.10"
                strokeLinecap="round"
                style={{ pathLength: length, opacity }}
              />
              {/* Terminal-Knoten oben (Tool-Ankerpunkt) */}
              <motion.circle
                cx={sx}
                cy={0}
                r="0.55"
                fill="var(--brand-line-bright)"
                style={{ opacity, filter: "drop-shadow(0 0 2px var(--brand-glow-strong))" }}
              />
            </g>
          );
        })}

        {/* Zentraler Konvergenz-Knoten */}
        <motion.circle
          cx={50}
          cy={100}
          r="0.95"
          fill="var(--brand-line-bright)"
          style={{
            opacity,
            filter: "drop-shadow(0 0 4px var(--brand-glow-strong))",
          }}
        />

        {/* EIN eleganter Light-Pulse pro Reihe (nicht überfrachtet) */}
        <FlowPulse
          path={`M ${startXs[Math.floor(startXs.length / 2)]},0 C ${startXs[Math.floor(startXs.length / 2)]},38 50,82 50,100`}
          opacity={opacity}
        />
      </svg>
    </div>
  );
}

function FlowPulse({
  path,
  opacity,
}: {
  path: string;
  opacity: MotionValue<number>;
}) {
  return (
    <motion.g style={{ opacity }}>
      <circle r="0.85" fill="var(--brand-glow-strong)" style={{ filter: "blur(0.5px)" }}>
        <animateMotion dur="2.8s" repeatCount="indefinite" path={path} />
      </circle>
      <circle r="0.36" fill="#FFFFFF" fillOpacity="0.98">
        <animateMotion dur="2.8s" repeatCount="indefinite" path={path} />
      </circle>
    </motion.g>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  OPERATING CORE — premium hexagonales Glas-Element
 *  ════════════════════════════════════════════════════════════════ */
function OperatingCore({
  opacity,
  scale,
  activeOpacity,
}: {
  opacity: MotionValue<number>;
  scale: MotionValue<number>;
  activeOpacity: MotionValue<number>;
}) {
  return (
    <motion.div
      className="relative"
      style={{
        opacity,
        scale,
        width: "clamp(240px, 30vh, 300px)",
        height: "clamp(108px, 14vh, 134px)",
      }}
    >
      {/* Außen-Aura */}
      <span
        aria-hidden
        className="absolute inset-[-46%] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, var(--brand-glow-strong) 0%, var(--brand-glow-mid) 38%, transparent 78%)",
          filter: "blur(32px)",
        }}
      />

      {/* Hexagon-Keystone */}
      <div className="relative h-full w-full">
        <svg
          aria-hidden
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 320 140"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Tiefen-Fill (Obsidian + Brand-Tiefenton) */}
            <linearGradient id="core-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(32,22,58,0.94)" />
              <stop offset="50%"  stopColor="rgba(14,10,30,0.96)" />
              <stop offset="100%" stopColor="rgba(6,4,16,0.99)" />
            </linearGradient>
            {/* Edge-Stroke (Brillant → Brand) */}
            <linearGradient id="core-edge" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.95" />
              <stop offset="45%"  stopColor="var(--brand-line-bright)" stopOpacity="0.55" />
              <stop offset="100%" stopColor="var(--brand-line-mid)" stopOpacity="0.30" />
            </linearGradient>
            {/* Top-Glass Reflection */}
            <linearGradient id="core-glass" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="rgba(255,255,255,0.22)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
            {/* Innen-Vignette */}
            <radialGradient id="core-inner-glow" cx="0.5" cy="0.5" r="0.55">
              <stop offset="0%"   stopColor="var(--brand-glow-strong)" stopOpacity="0.32" />
              <stop offset="100%" stopColor="var(--brand-glow-strong)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Hexagon-Außenkontur */}
          <path
            d="M 28,10 L 292,10 L 316,70 L 292,130 L 28,130 L 4,70 Z"
            fill="url(#core-fill)"
            stroke="url(#core-edge)"
            strokeWidth="1.1"
          />
          {/* Innere Glasreflexion oben */}
          <path
            d="M 30,12 L 290,12 L 308,42 L 12,42 Z"
            fill="url(#core-glass)"
          />
          {/* Innere Hex-Linie (doppelter Rahmen) */}
          <path
            d="M 38,22 L 282,22 L 302,70 L 282,118 L 38,118 L 18,70 Z"
            fill="none"
            stroke="var(--brand-line-mid)"
            strokeWidth="0.35"
            strokeOpacity="0.32"
          />
          {/* Innen-Vignetten-Glow */}
          <rect x="0" y="0" width="320" height="140" fill="url(#core-inner-glow)" />

          {/* Eck-Akzente (Brillant-Tickmarks) */}
          {[
            ["M 28,10 L 40,10 M 28,10 L 28,22",  "tl"],
            ["M 292,10 L 280,10 M 292,10 L 292,22", "tr"],
            ["M 28,130 L 40,130 M 28,130 L 28,118", "bl"],
            ["M 292,130 L 280,130 M 292,130 L 292,118", "br"],
          ].map(([d, k]) => (
            <path
              key={k as string}
              d={d as string}
              stroke="var(--brand-line-bright)"
              strokeWidth="0.9"
              strokeLinecap="round"
              fill="none"
              opacity="0.95"
            />
          ))}

          {/* Mikro-Indexstriche an Ober-/Unterkante (Architektur-Detail) */}
          {Array.from({ length: 7 }).map((_, i) => (
            <g key={i} stroke="rgba(255,255,255,0.20)" strokeWidth="0.4">
              <line x1={80 + i * 26} y1="10" x2={80 + i * 26} y2="14" />
              <line x1={80 + i * 26} y1="130" x2={80 + i * 26} y2="126" />
            </g>
          ))}
        </svg>

        {/* Inhalt — minimalistische Komposition */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center"
          style={{ opacity: activeOpacity }}
        >
          {/* Top-Mikro-Caption */}
          <div className="absolute top-[12%] flex items-center gap-1.5 text-white/35">
            <span className="h-px w-[10px]" style={{ background: "rgba(255,255,255,0.35)" }} />
            <span
              className="text-[7px] font-medium uppercase tracking-[0.40em] sm:text-[7.5px]"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            >
              Operating Core
            </span>
            <span className="h-px w-[10px]" style={{ background: "rgba(255,255,255,0.35)" }} />
          </div>

          {/* Center-Wortmarke — schlicht, premium */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <span
              className="text-[17px] font-light leading-none sm:text-[19px]"
              style={{
                background:
                  "linear-gradient(155deg, #FFFFFF 0%, #F1ECFF 55%, #C4B5FD 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                letterSpacing: "0.06em",
              }}
            >
              NEXCEL
            </span>
            <span
              className="inline-block h-[12px] w-px sm:h-[14px]"
              style={{
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.35) 50%, transparent 100%)",
              }}
              aria-hidden
            />
            <span
              className="text-[17px] font-light leading-none sm:text-[19px]"
              style={{
                background:
                  "linear-gradient(155deg, var(--brand-line-bright) 0%, var(--brand-line-mid) 100%)",
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                color: "transparent",
                WebkitTextFillColor: "transparent",
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                letterSpacing: "0.06em",
                filter: "drop-shadow(0 0 8px var(--brand-glow-strong))",
              }}
            >
              AGI
            </span>
          </div>

          {/* Bottom-Status — gepulster Indikator */}
          <div className="absolute bottom-[12%] flex items-center gap-1.5">
            <motion.span
              aria-hidden
              className="inline-block h-[5px] w-[5px] rounded-full"
              style={{
                background: "var(--brand-line-bright)",
                boxShadow: "0 0 8px var(--brand-glow-strong)",
              }}
              animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.15, 1] }}
              transition={{ duration: 2.0, repeat: Infinity, ease: "easeInOut" }}
            />
            <span
              className="text-[7.5px] font-medium uppercase tracking-[0.34em] text-white/55 sm:text-[8px]"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            >
              Live · Synchronisiert
            </span>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  MODULES ROW — 6 strukturierte Module-Karten
 *  ════════════════════════════════════════════════════════════════ */
function ModulesRow({
  opacity,
  y,
}: {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <motion.div
      style={{ opacity, y }}
      className="relative flex w-full flex-col items-center gap-3 sm:gap-3.5"
    >
      {/* Architectural Header — symmetrisch zu „Eingehende Quellen" */}
      <div className="flex items-center gap-3 text-white/35">
        <span
          aria-hidden
          className="h-px w-[28px] sm:w-[48px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--brand-line-mid) 100%)",
            opacity: 0.85,
          }}
        />
        <span
          className="text-[9.5px] font-medium uppercase tracking-[0.36em] sm:text-[10px]"
          style={{
            color: "var(--brand-line-bright)",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            filter: "drop-shadow(0 0 6px var(--brand-glow-strong))",
          }}
        >
          Strukturierte Module
        </span>
        <span
          aria-hidden
          className="h-px w-[28px] sm:w-[48px]"
          style={{
            background:
              "linear-gradient(90deg, var(--brand-line-mid) 0%, transparent 100%)",
            opacity: 0.85,
          }}
        />
      </div>

      {/* Numbered-Tile-Grid — 3×2 mobile, 6×1 desktop */}
      <div className="grid w-full grid-cols-3 gap-2 px-2 sm:gap-3 md:grid-cols-6 md:gap-3.5">
        {MODULES.map((m, i) => (
          <NumberedTile key={m.key} module={m} index={i} />
        ))}
      </div>
    </motion.div>
  );
}

function NumberedTile({
  module: m,
  index,
}: {
  module: ModuleDef;
  index: number;
}) {
  const number = String(index + 1).padStart(2, "0");
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: 0.65,
        delay: index * 0.07,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative"
    >
      <div
        className="relative overflow-hidden rounded-[14px] px-3 pb-3 pt-2.5 sm:px-3.5 sm:pb-3.5 sm:pt-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(22,16,42,0.88) 0%, rgba(10,8,22,0.92) 100%)",
          border: "1px solid var(--brand-card-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 14px 28px rgba(0,0,0,0.42), 0 0 22px var(--brand-card-glow)",
        }}
      >
        {/* Top-Hairline (Brand-Bright) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, var(--brand-line-bright), transparent)",
          }}
        />

        {/* Soft Top-Glow Reflektion */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-0 h-[40%] rounded-t-[14px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, transparent 100%)",
          }}
        />

        {/* Header: Nummer + Live-Dot */}
        <div className="relative flex items-center justify-between">
          <span
            className="text-[20px] font-extralight leading-none sm:text-[24px]"
            style={{
              background:
                "linear-gradient(155deg, #FFFFFF 0%, #E9E3FF 55%, var(--brand-line-bright) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              letterSpacing: "-0.03em",
            }}
          >
            {number}
          </span>
          <motion.span
            aria-hidden
            className="inline-block h-[4px] w-[4px] rounded-full sm:h-[5px] sm:w-[5px]"
            style={{
              background: "var(--brand-line-bright)",
              boxShadow: "0 0 6px var(--brand-glow-strong)",
            }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{
              duration: 2 + (index % 3) * 0.4,
              delay: index * 0.18,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Body: Modul-Name + Sub */}
        <div className="relative mt-2 sm:mt-2.5">
          <p
            className="text-[11px] font-medium leading-tight text-white sm:text-[12.5px]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              letterSpacing: "0.005em",
            }}
          >
            {m.label}
          </p>
          <p
            className="mt-1 text-[8.5px] font-light leading-snug text-white/45 sm:text-[9.5px]"
            style={{ letterSpacing: "0.025em" }}
          >
            {m.sub}
          </p>
        </div>

        {/* Bottom-Hairline (sehr dezent) */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          }}
        />
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  POWERED BY — Kooperations-Block (unverändert in der Story)
 *  ════════════════════════════════════════════════════════════════ */
function PoweredBy({
  opacity,
  y,
}: {
  opacity: MotionValue<number>;
  y: MotionValue<number>;
}) {
  return (
    <motion.div
      style={{ opacity, y }}
      className="relative z-10 mx-auto flex flex-col items-center"
    >
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="h-px w-[44px] sm:w-[60px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--brand-line-mid) 100%)",
          }}
        />
        <span
          className="text-[9px] font-medium uppercase tracking-[0.36em] sm:text-[10px]"
          style={{
            color: "var(--brand-line-mid)",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
          }}
        >
          Strategische Kooperation
        </span>
        <span
          aria-hidden
          className="h-px w-[44px] sm:w-[60px]"
          style={{
            background:
              "linear-gradient(90deg, var(--brand-line-mid) 0%, transparent 100%)",
          }}
        />
      </div>

      <div
        className="mt-3 flex items-center gap-3 rounded-full px-4 py-2 sm:mt-3.5 sm:gap-4 sm:px-5 sm:py-2.5"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,16,38,0.85) 0%, rgba(10,8,22,0.85) 100%)",
          border: "1px solid var(--brand-card-border)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 38px rgba(0,0,0,0.55), 0 0 24px var(--brand-glow-mid)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <div className="flex items-center gap-2 sm:gap-2.5">
          <BrandMark letter="N" />
          <span
            className="text-[11.5px] font-medium tracking-[0.18em] sm:text-[13px]"
            style={{
              background:
                "linear-gradient(120deg, #FFFFFF 0%, #F5F3FF 50%, #C4B5FD 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
            }}
          >
            NEXCEL&nbsp;AI
          </span>
        </div>

        <span
          aria-hidden
          className="text-[14px] font-light leading-none text-white/70 sm:text-[16px]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            filter: "drop-shadow(0 0 8px var(--brand-glow-strong))",
          }}
        >
          ×
        </span>

        <div className="flex items-center gap-2 sm:gap-2.5">
          <span
            className="text-[11.5px] font-medium tracking-[0.18em] sm:text-[13px]"
            style={{
              background:
                "linear-gradient(120deg, #C4B5FD 0%, #A78BFA 55%, #8B5CF6 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
            }}
          >
            AGI&nbsp;WORKS
          </span>
          <BrandMark letter="A" variant="agi" />
        </div>
      </div>
    </motion.div>
  );
}

function BrandMark({
  letter,
  variant = "nexcel",
}: {
  letter: string;
  variant?: "nexcel" | "agi";
}) {
  const bgGradient =
    variant === "nexcel"
      ? "linear-gradient(155deg, rgba(34,26,62,0.96) 0%, rgba(16,12,34,0.97) 60%, rgba(8,6,20,0.98) 100%)"
      : "linear-gradient(155deg, rgba(46,28,80,0.96) 0%, rgba(28,18,52,0.97) 60%, rgba(12,8,26,0.98) 100%)";
  const letterGradient =
    variant === "nexcel"
      ? "linear-gradient(155deg, #FFFFFF 0%, #E9E3FF 60%, #C4B5FD 100%)"
      : "linear-gradient(155deg, #DDD6FE 0%, #A78BFA 55%, #7C3AED 100%)";

  return (
    <span
      className="relative inline-flex h-[24px] w-[24px] items-center justify-center overflow-hidden rounded-[7px] sm:h-[26px] sm:w-[26px]"
      style={{
        background: bgGradient,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -8px 14px rgba(0,0,0,0.40), 0 6px 14px rgba(0,0,0,0.40), 0 0 18px var(--brand-glow-mid)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-1 top-[1px] h-[40%]"
        style={{
          borderRadius: "6px 6px 18px 18px",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.02) 70%, transparent 100%)",
          filter: "blur(0.6px)",
        }}
      />
      <span
        className="relative text-[12.5px] font-semibold leading-none sm:text-[13.5px]"
        style={{
          background: letterGradient,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
          WebkitTextFillColor: "transparent",
          fontFamily: "var(--font-headline), system-ui, sans-serif",
        }}
      >
        {letter}
      </span>
    </span>
  );
}

