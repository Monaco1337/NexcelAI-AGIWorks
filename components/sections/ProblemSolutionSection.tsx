"use client";

/**
 * NEXCEL AI / AGI WORKS · ProblemSolutionSection
 *
 * LINKS   Problem  — „Zu viele Tools. Zu wenig Überblick."
 * MITTE   Klar erkennbares Flow-Diagramm: viele Tools → ein System
 * RECHTS  Lösung   — „Ein System. Alle Prozesse."
 */

import { motion } from "framer-motion";

const PROBLEM_BULLETS = [
  "Informationen sind verstreut",
  "Prozesse nicht verbunden",
  "Keine echten Echtzeitdaten",
  "Wachstum wird blockiert",
];

const SOLUTION_BULLETS = [
  "Eine zentrale Datenbasis",
  "Automatisierte Workflows",
  "Echtzeit-Transparenz",
  "Kontrolle & nachhaltiges Wachstum",
];

export default function ProblemSolutionSection() {
  return (
    <section
      className="relative w-full overflow-hidden pt-10 pb-20 sm:pt-12 sm:pb-28"
      style={{
        background:
          "radial-gradient(ellipse 90% 60% at 50% 50%, rgba(109,40,217,0.07) 0%, transparent 70%)," +
          "linear-gradient(to bottom, rgba(5,3,14,0.92) 0%, #08060f 40%, #08060f 60%, rgba(5,3,14,0.92) 100%)",
      }}
    >
      {/* top fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-24"
        style={{ background: "linear-gradient(to bottom, rgba(5,3,14,0.90) 0%, transparent 100%)" }}
      />
      {/* bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
        style={{ background: "linear-gradient(to top, rgba(5,3,14,0.90) 0%, transparent 100%)" }}
      />

      <div className="relative mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_auto_1fr] lg:gap-8">

          {/* ── Problem ── */}
          <Column
            tone="problem"
            eyebrow="Das Problem"
            title={["Zu viele Tools.", "Zu wenig Überblick."]}
            text="Zersplitterte Anwendungen, doppelte Daten, manuelle Arbeit und Medienbrüche bremsen Ihr Unternehmen aus."
            bullets={PROBLEM_BULLETS}
          />

          {/* ── Flow-Diagram ── */}
          <div className="order-first flex justify-center lg:order-none">
            <CoreVisual />
          </div>

          {/* ── Lösung ── */}
          <Column
            tone="solution"
            eyebrow="Die Lösung"
            title={["Ein System.", "Alle Prozesse."]}
            text="Ein maßgeschneidertes digitales Betriebssystem, das Ihre Abläufe verbindet, automatisiert und skalierbar macht."
            bullets={SOLUTION_BULLETS}
          />

        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   TEXT COLUMN
────────────────────────────────────────────────────────────────────── */
function Column({
  tone, eyebrow, title, text, bullets,
}: {
  tone: "problem" | "solution";
  eyebrow: string;
  title: [string, string];
  text: string;
  bullets: string[];
}) {
  const isSolution = tone === "solution";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={isSolution ? "lg:text-right" : ""}
    >
      <span
        className="text-[10.5px] font-medium uppercase tracking-[0.28em]"
        style={{ color: isSolution ? "var(--accent)" : "rgba(255,255,255,0.45)" }}
      >
        {eyebrow}
      </span>
      <h3
        className="mt-3 text-[1.9rem] leading-[1.1] tracking-[-0.02em] text-white sm:text-[2.2rem]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
      >
        {title[0]}
        <br />
        {isSolution ? (
          <span style={{
            background: "var(--brand-headline-gradient)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            color: "transparent", WebkitTextFillColor: "transparent",
            fontWeight: 400,
          }}>
            {title[1]}
          </span>
        ) : (
          <span className="text-white/55" style={{ fontWeight: 400 }}>{title[1]}</span>
        )}
      </h3>
      <p className={`mt-4 max-w-[400px] text-[14px] leading-[1.65] text-white/58 ${isSolution ? "lg:ml-auto" : ""}`}>
        {text}
      </p>
      <ul className={`mt-6 flex flex-col gap-2.5 ${isSolution ? "lg:items-end" : ""}`}>
        {bullets.map((b) => (
          <li key={b} className={`flex items-center gap-2.5 text-[13px] text-white/72 ${isSolution ? "lg:flex-row-reverse lg:text-right" : ""}`}>
            {isSolution ? <CheckIcon /> : <DotIcon />}
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   CORE VISUAL  —  Many tools → one central system
────────────────────────────────────────────────────────────────────── */

const TOOLS = [
  { label: "CRM",          angle:   0, icon: "crm"      },
  { label: "Mitarbeiter",  angle:  45, icon: "users"    },
  { label: "Kalender",     angle:  90, icon: "calendar" },
  { label: "Google Drive", angle: 135, icon: "drive"    },
  { label: "E-Mail",       angle: 180, icon: "mail"     },
  { label: "WhatsApp",     angle: 225, icon: "chat"     },
  { label: "Formulare",    angle: 270, icon: "form"     },
  { label: "Excel",        angle: 315, icon: "excel"    },
];

function toXY(angle: number, r: number, cx = 200, cy = 200) {
  const rad = (angle * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function CoreVisual() {
  const CX = 200, CY = 200, R = 128;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.94 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
      style={{ width: 320, height: 320 }}
    >
      <svg
        viewBox="-10 -10 420 420"
        width="320"
        height="320"
        fill="none"
        overflow="visible"
        aria-hidden
      >
        <defs>
          {/* per-line gradient: dim at node → bright at center */}
          {TOOLS.map((t, i) => {
            const p = toXY(t.angle, R, CX, CY);
            return (
              <linearGradient
                key={i} id={`psLg${i}`}
                x1={p.x} y1={p.y} x2={CX} y2={CY}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%"   stopColor="rgba(167,139,250,0.15)" />
                <stop offset="100%" stopColor="rgba(196,181,253,0.60)" />
              </linearGradient>
            );
          })}
          {/* center glow */}
          <radialGradient id="psCenterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="var(--brand-glow-strong)" stopOpacity="0.55" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* ambient glow behind center */}
        <circle cx={CX} cy={CY} r="72" fill="url(#psCenterGlow)" />

        {/* connection lines — animated dashes flowing toward center */}
        {TOOLS.map((t, i) => {
          const from = toXY(t.angle, R - 24, CX, CY);
          const to   = toXY(t.angle,      46, CX, CY); // stops at center rect edge
          return (
            <motion.line
              key={i}
              x1={from.x} y1={from.y}
              x2={to.x}   y2={to.y}
              stroke={`url(#psLg${i})`}
              strokeWidth="1"
              strokeDasharray="4 7"
              animate={{ strokeDashoffset: [0, -33] }}
              transition={{
                duration: 2.2 + i * 0.18,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.25,
              }}
            />
          );
        })}

        {/* outer orbit ring — very subtle */}
        <circle
          cx={CX} cy={CY} r={R}
          stroke="rgba(167,139,250,0.10)"
          strokeWidth="1"
          strokeDasharray="3 9"
        />

        {/* tool nodes */}
        {TOOLS.map((t, i) => {
          const p = toXY(t.angle, R, CX, CY);
          const lp = toXY(t.angle, R + 36, CX, CY);
          const isLeft  = p.x < CX - 20;
          const isRight = p.x > CX + 20;
          const anchor  = isLeft ? "end" : isRight ? "start" : "middle";

          return (
            <g key={i}>
              {/* node circle */}
              <circle
                cx={p.x} cy={p.y} r="21"
                fill="rgba(255,255,255,0.042)"
                stroke="rgba(255,255,255,0.13)"
                strokeWidth="1"
              />
              {/* icon */}
              <NodeIcon type={t.icon} cx={p.x} cy={p.y} />
              {/* label */}
              <text
                x={lp.x} y={lp.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fill="rgba(255,255,255,0.52)"
                fontSize="11"
                fontWeight="500"
                letterSpacing="0.01em"
                style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
              >
                {t.label}
              </text>
            </g>
          );
        })}

        {/* CENTER — "Ihr System" */}
        <rect
          x={CX - 44} y={CY - 44}
          width="88" height="88"
          rx="18"
          fill="rgba(255,255,255,0.065)"
          stroke="rgba(196,181,253,0.28)"
          strokeWidth="1"
        />
        {/* inner shimmer top line */}
        <line
          x1={CX - 28} y1={CY - 43.5}
          x2={CX + 28} y2={CY - 43.5}
          stroke="rgba(245,238,255,0.35)"
          strokeWidth="1"
        />
        <text
          x={CX} y={CY - 9}
          textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.88)"
          fontSize="11.5"
          fontWeight="700"
          letterSpacing="0.10em"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          IHR
        </text>
        <text
          x={CX} y={CY + 6}
          textAnchor="middle" dominantBaseline="middle"
          fill="rgba(196,181,253,0.90)"
          fontSize="11.5"
          fontWeight="700"
          letterSpacing="0.10em"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          SYSTEM
        </text>
        <text
          x={CX} y={CY + 22}
          textAnchor="middle" dominantBaseline="middle"
          fill="rgba(255,255,255,0.30)"
          fontSize="8.5"
          fontWeight="400"
          letterSpacing="0.06em"
          style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}
        >
          zentral · digital
        </text>
      </svg>
    </motion.div>
  );
}

/* per-tool icon (14×14 stroke icons centered on cx, cy) */
function NodeIcon({ type, cx, cy }: { type: string; cx: number; cy: number }) {
  const s = 7; // half-size
  const c = "rgba(167,139,250,0.85)";
  const w = "1.5";

  switch (type) {
    case "excel":
      return (
        <g stroke={c} strokeWidth={w} strokeLinecap="round">
          <rect x={cx-s} y={cy-s} width={s*2} height={s*2} rx="2" />
          <line x1={cx} y1={cy-s} x2={cx} y2={cy+s} />
          <line x1={cx-s} y1={cy} x2={cx+s} y2={cy} />
        </g>
      );
    case "form":
      return (
        <g stroke={c} strokeWidth={w} strokeLinecap="round">
          <rect x={cx-s+1} y={cy-s} width={(s-1)*2} height={s*2} rx="2" />
          <line x1={cx-s+3} y1={cy-3} x2={cx+s-3} y2={cy-3} />
          <line x1={cx-s+3} y1={cy}   x2={cx+s-3} y2={cy}   />
          <line x1={cx-s+3} y1={cy+3} x2={cx+1}   y2={cy+3} />
        </g>
      );
    case "chat":
      return (
        <g stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${cx-s} ${cy-s+1} Q${cx-s} ${cy-s-1} ${cx-s+2} ${cy-s-1} H${cx+s-2} Q${cx+s} ${cy-s-1} ${cx+s} ${cy-s+1} V${cy+2} Q${cx+s} ${cy+4} ${cx+s-2} ${cy+4} H${cx-1} L${cx-s} ${cy+s} V${cy+4} H${cx-s+2} Q${cx-s} ${cy+4} ${cx-s} ${cy+2} Z`} />
        </g>
      );
    case "mail":
      return (
        <g stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <rect x={cx-s} y={cy-4} width={s*2} height={s+1} rx="1.5" />
          <path d={`M${cx-s} ${cy-4} L${cx} ${cy+1} L${cx+s} ${cy-4}`} />
        </g>
      );
    case "drive":
      return (
        <g stroke={c} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${cx} ${cy-s} L${cx+s} ${cy+s-1} H${cx-s} Z`} />
          <line x1={cx-4} y1={cy+2} x2={cx+4} y2={cy+2} stroke={c} strokeWidth="1.2" />
        </g>
      );
    case "calendar":
      return (
        <g stroke={c} strokeWidth={w} strokeLinecap="round">
          <rect x={cx-s} y={cy-s+1} width={s*2} height={s*2-1} rx="2" />
          <line x1={cx-s} y1={cy-2} x2={cx+s} y2={cy-2} />
          <line x1={cx-3} y1={cy-s+1} x2={cx-3} y2={cy-s-1} />
          <line x1={cx+3} y1={cy-s+1} x2={cx+3} y2={cy-s-1} />
          <rect x={cx-2} y={cy+0.5} width="4" height="4" rx="1" fill={c} stroke="none" />
        </g>
      );
    case "users":
      return (
        <g stroke={c} strokeWidth={w} strokeLinecap="round">
          <circle cx={cx-2} cy={cy-3} r="3" />
          <path d={`M${cx-7} ${cy+5} Q${cx-7} ${cy+1} ${cx-2} ${cy+1} Q${cx+3} ${cy+1} ${cx+3} ${cy+5}`} />
          <circle cx={cx+4} cy={cy-4} r="2.2" />
          <path d={`M${cx+1} ${cy+4} Q${cx+2} ${cy+1} ${cx+4} ${cy+1} Q${cx+8} ${cy+1} ${cx+8} ${cy+5}`} />
        </g>
      );
    case "crm":
      return (
        <g stroke={c} strokeWidth={w} strokeLinecap="round">
          <circle cx={cx} cy={cy-3} r="3" />
          <path d={`M${cx-6} ${cy+5} Q${cx-6} ${cy+1} ${cx} ${cy+1} Q${cx+6} ${cy+1} ${cx+6} ${cy+5}`} />
          <line x1={cx+3} y1={cy-1} x2={cx+7} y2={cy-5} strokeWidth="1.2" />
          <circle cx={cx+7} cy={cy-5} r="1.5" fill={c} stroke="none" />
        </g>
      );
    default:
      return <circle cx={cx} cy={cy} r="3" fill={c} />;
  }
}

/* ──────────────────────────────────────────────────────────────────────
   SMALL ICONS
────────────────────────────────────────────────────────────────────── */
function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="1.5" opacity="0.9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" stroke="var(--accent)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.35)" />
      <circle cx="12" cy="12" r="8" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
    </svg>
  );
}
