"use client";

/**
 * NEXCEL AI / AGI WORKS · ProblemSolutionSection
 *
 *   LINKS   Problem  — „Zu viele Tools. Zu wenig Überblick."
 *   MITTE   System-Core-Visual (Cube / Orbit / Nodes)
 *   RECHTS  Lösung   — „Ein System. Alle Prozesse."
 *
 * Mobile: vertikal gestapelt (Problem → Visual → Lösung).
 * Brand-aware über CSS-Tokens.
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
    <section className="relative w-full py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-10">
          {/* ── Problem ── */}
          <Column
            tone="problem"
            eyebrow="Das Problem"
            title={["Zu viele Tools.", "Zu wenig Überblick."]}
            text="Zersplitterte Anwendungen, doppelte Daten, manuelle Arbeit und Medienbrüche bremsen Ihr Unternehmen aus."
            bullets={PROBLEM_BULLETS}
          />

          {/* ── Core Visual ── */}
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

function Column({
  tone,
  eyebrow,
  title,
  text,
  bullets,
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
          <span
            style={{
              background: "var(--brand-headline-gradient)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              fontWeight: 400,
            }}
          >
            {title[1]}
          </span>
        ) : (
          <span className="text-white/55" style={{ fontWeight: 400 }}>
            {title[1]}
          </span>
        )}
      </h3>
      <p className="mt-4 max-w-[420px] text-[14.5px] leading-[1.65] text-white/60 lg:ml-auto">
        {text}
      </p>
      <ul
        className={`mt-6 flex flex-col gap-2.5 ${
          isSolution ? "lg:items-end" : ""
        }`}
      >
        {bullets.map((b) => (
          <li
            key={b}
            className={`flex items-center gap-2.5 text-[13.5px] text-white/75 ${
              isSolution ? "lg:flex-row-reverse lg:text-right" : ""
            }`}
          >
            {isSolution ? (
              <CheckIcon />
            ) : (
              <DotIcon />
            )}
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function CoreVisual() {
  return (
    <div className="relative flex h-[260px] w-[260px] items-center justify-center sm:h-[300px] sm:w-[300px]">
      {/* Glow */}
      <div
        aria-hidden
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, var(--brand-glow-mid), transparent 65%)",
          filter: "blur(8px)",
        }}
      />
      {/* Orbit-Ringe */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          aria-hidden
          className="absolute rounded-full"
          style={{
            inset: 18 + i * 32,
            border: "1px solid var(--brand-line-dim)",
            opacity: 0.6 - i * 0.12,
          }}
          animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
          transition={{ duration: 40 + i * 14, repeat: Infinity, ease: "linear" }}
        >
          <span
            className="absolute h-2 w-2 rounded-full"
            style={{
              top: -4,
              left: "50%",
              marginLeft: -4,
              background: "var(--brand-line-bright)",
              boxShadow: "0 0 10px var(--brand-glow-strong)",
            }}
          />
        </motion.div>
      ))}
      {/* Zentraler Cube */}
      <motion.div
        className="relative flex h-24 w-24 items-center justify-center rounded-[22px]"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
          border: "1px solid var(--brand-card-border)",
          boxShadow:
            "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12), 0 0 50px var(--brand-card-glow)",
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      >
        <svg width="40" height="40" viewBox="0 0 48 48" fill="none" aria-hidden>
          <path
            d="M24 4 42 14v20L24 44 6 34V14L24 4Z"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M6 14l18 10 18-10M24 24v20"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinejoin="round"
            opacity="0.8"
          />
        </svg>
      </motion.div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="1.5" opacity="0.9" />
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

function DotIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.35)" />
      <circle cx="12" cy="12" r="8" stroke="rgba(255,255,255,0.18)" strokeWidth="1.2" />
    </svg>
  );
}
