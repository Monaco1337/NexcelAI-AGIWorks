"use client";

import { motion } from "framer-motion";
import { useId } from "react";

/* ════════════════════════════════════════════════════════════════════
 *  System Synchronization — „Alles kommt zusammen"
 *  ════════════════════════════════════════════════════════════════
 *  High-End, premium, ruhig: eingehende Kanäle (echte App-Icons)
 *  → ein zentrales System → strukturierte Module (Symbol-Karten)
 *  → strategische Kooperation NEXCEL AI × AGI Works.
 *
 *  • Brand-aware Theme über CSS-Variablen (NEXCEL Violett / AGI Cyan)
 *  • Kanal- & Marken-Logos behalten ihre eigene Identität
 *  • Scroll-Reveal via whileInView, keine technische Optik
 *  ════════════════════════════════════════════════════════════════ */

const EASE = [0.22, 1, 0.36, 1] as const;

/* ─────────────────────────── DATA ─────────────────────────── */

type ChannelKey =
  | "whatsapp"
  | "email"
  | "phone"
  | "calendar"
  | "documents"
  | "forms";

const CHANNELS: { key: ChannelKey; label: string; color: string }[] = [
  { key: "whatsapp", label: "WhatsApp", color: "#25D366" },
  { key: "email", label: "E-Mail", color: "#5B8DEF" },
  { key: "phone", label: "Telefon", color: "#2DD4BF" },
  { key: "calendar", label: "Kalender", color: "#FB7185" },
  { key: "documents", label: "Dokumente", color: "#60A5FA" },
  { key: "forms", label: "Formulare", color: "#A78BFA" },
];

type FeatureKey =
  | "customers"
  | "comms"
  | "documents"
  | "automation"
  | "tasks"
  | "control";

const FEATURES: { key: FeatureKey; title: string; desc: string }[] = [
  { key: "customers", title: "Kunden", desc: "Alle Kontakte und Informationen zentral an einem Ort." },
  { key: "comms", title: "Kommunikation", desc: "E-Mails, WhatsApp und Anfragen strukturiert und nachvollziehbar." },
  { key: "documents", title: "Dokumente", desc: "Verträge, Angebote und Dateien jederzeit verfügbar." },
  { key: "automation", title: "Automatisierung", desc: "Wiederkehrende Aufgaben werden automatisch erledigt." },
  { key: "tasks", title: "Aufgaben", desc: "Nichts geht verloren. Alles hat einen klaren Status." },
  { key: "control", title: "Kontrolle", desc: "Jederzeit wissen, was im Unternehmen passiert." },
];

/* ─────────────────────── MAIN COMPONENT ────────────────────── */

export default function SystemSynchronizationSection() {
  const headlineId = useId();

  return (
    <section
      aria-labelledby={headlineId}
      className="relative isolate overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, var(--brand-bg-bottom) 0%, color-mix(in srgb, var(--brand-bg-bottom) 55%, var(--brand-bg-mid)) 18%, var(--brand-bg-mid) 55%, var(--brand-bg-mid) 100%)",
      }}
    >
      <Atmosphere />

      <div className="relative z-10 mx-auto w-full max-w-[1180px] px-5 py-[clamp(72px,12vh,150px)] sm:px-8">
        <Header id={headlineId} />
        <Channels />
        <Converging />
        <CentralSystem />
        <FeatureGrid />
        <Cooperation />
      </div>
    </section>
  );
}

/* ─────────────────────────── ATMOSPHERE ─────────────────────── */
function Atmosphere() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 50% 30% at 50% 38%, var(--brand-glow-mid) 0%, transparent 70%),
            radial-gradient(ellipse 40% 24% at 50% 62%, var(--brand-glow-soft) 0%, transparent 72%)
          `,
          opacity: 0.5,
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.12]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
          `,
          backgroundSize: "150px 150px",
          maskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, #000 5%, transparent 80%)",
          WebkitMaskImage: "radial-gradient(ellipse 60% 50% at 50% 40%, #000 5%, transparent 80%)",
        }}
      />
    </>
  );
}

/* ─────────────────────────── HEADER ─────────────────────────── */
function Header({ id }: { id: string }) {
  return (
    <div className="mx-auto max-w-[760px] text-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.7, ease: EASE }}
        className="flex items-center justify-center gap-3 text-white/45"
      >
        <span aria-hidden className="h-px w-[26px] sm:w-[40px]" style={{ background: "linear-gradient(90deg, transparent, var(--brand-line-mid))" }} />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.34em] sm:text-[11px]"
          style={{ color: "var(--brand-line-bright)", fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          Alles kommt zusammen
        </span>
        <span aria-hidden className="h-px w-[26px] sm:w-[40px]" style={{ background: "linear-gradient(90deg, var(--brand-line-mid), transparent)" }} />
      </motion.div>

      <motion.h2
        id={id}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.9, ease: EASE, delay: 0.05 }}
        className="mt-5 text-[2rem] leading-[1.07] text-white sm:text-[2.7rem] md:text-[3.2rem]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300, letterSpacing: "-0.035em" }}
      >
        Ein System. Alle Informationen.
        <br />
        <span
          style={{
            background: "var(--brand-headline-gradient)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            fontWeight: 400,
            filter: "drop-shadow(0 0 26px var(--brand-glow-strong))",
          }}
        >
          Volle Kontrolle.
        </span>
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-15% 0px" }}
        transition={{ duration: 0.85, ease: EASE, delay: 0.15 }}
        className="mx-auto mt-5 max-w-[540px] text-[14px] leading-[1.65] text-white/55 sm:text-[15px]"
      >
        Anfragen, Nachrichten und Daten kommen aus vielen Kanälen. Unser System bringt
        alles zusammen — automatisch, sicher und übersichtlich.
      </motion.p>
    </div>
  );
}

/* ─────────────────────────── CHANNELS ───────────────────────── */
function Channels() {
  return (
    <motion.div
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-12% 0px" }}
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07 } } }}
      className="mx-auto mt-[clamp(40px,7vh,72px)] flex flex-wrap items-start justify-center gap-3 sm:gap-4 md:gap-5"
    >
      {CHANNELS.map((c) => (
        <ChannelTile key={c.key} channel={c} />
      ))}
      <MoreTile />
    </motion.div>
  );
}

function ChannelTile({ channel }: { channel: { key: ChannelKey; label: string; color: string } }) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.6, ease: EASE }}
      className="group flex w-[64px] flex-col items-center gap-2 sm:w-[76px]"
    >
      <motion.div
        whileHover={{ y: -4 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="relative flex h-[52px] w-[52px] items-center justify-center rounded-[16px] sm:h-[60px] sm:w-[60px]"
        style={{
          background: `linear-gradient(160deg, ${channel.color}26 0%, rgba(255,255,255,0.02) 100%)`,
          border: `1px solid ${channel.color}40`,
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 26px rgba(0,0,0,0.45), 0 0 22px ${channel.color}1F`,
          backdropFilter: "blur(10px)",
          WebkitBackdropFilter: "blur(10px)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-2 top-0 h-[42%] rounded-t-[16px]"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.16), transparent)" }}
        />
        <span style={{ color: channel.color }} className="relative">
          <ChannelIcon k={channel.key} />
        </span>
      </motion.div>
      <span className="text-[10px] font-medium text-white/55 sm:text-[11px]" style={{ letterSpacing: "0.02em" }}>
        {channel.label}
      </span>
    </motion.div>
  );
}

function MoreTile() {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
      transition={{ duration: 0.6, ease: EASE }}
      className="flex w-[64px] flex-col items-center gap-2 sm:w-[76px]"
    >
      <div
        className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] sm:h-[60px] sm:w-[60px]"
        style={{
          background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
          border: "1px dashed rgba(255,255,255,0.18)",
        }}
      >
        <span className="flex gap-[3px]">
          <span className="h-[4px] w-[4px] rounded-full bg-white/40" />
          <span className="h-[4px] w-[4px] rounded-full bg-white/40" />
          <span className="h-[4px] w-[4px] rounded-full bg-white/40" />
        </span>
      </div>
      <span className="text-[10px] font-medium text-white/35 sm:text-[11px]">mehr</span>
    </motion.div>
  );
}

/* ─────────────────── CONVERGING LINES (dekorativ) ───────────── */
function Converging() {
  return (
    <div
      aria-hidden
      className="relative mx-auto w-full max-w-[640px]"
      style={{ height: "clamp(48px, 8vh, 84px)" }}
    >
      <svg className="absolute inset-0 h-full w-full overflow-visible" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="sync-flow" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="var(--brand-line-dim)" stopOpacity="0.0" />
            <stop offset="40%" stopColor="var(--brand-line-mid)" stopOpacity="0.6" />
            <stop offset="100%" stopColor="var(--brand-line-bright)" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        {[8, 26, 42, 58, 74, 92].map((sx, i) => {
          const d = `M ${sx},0 C ${sx},42 50,70 50,100`;
          return (
            <motion.path
              key={i}
              d={d}
              fill="none"
              stroke="url(#sync-flow)"
              strokeWidth="0.4"
              strokeLinecap="round"
              initial={{ pathLength: 0, opacity: 0 }}
              whileInView={{ pathLength: 1, opacity: 1 }}
              viewport={{ once: true, margin: "-10% 0px" }}
              transition={{ duration: 1, ease: EASE, delay: 0.1 + i * 0.05 }}
            />
          );
        })}
        <circle cx="50" cy="100" r="1.1" fill="var(--brand-line-bright)" style={{ filter: "drop-shadow(0 0 4px var(--brand-glow-strong))" }} />
        <g>
          <circle r="0.9" fill="var(--brand-glow-strong)" style={{ filter: "blur(0.4px)" }}>
            <animateMotion dur="3s" repeatCount="indefinite" path="M 50,0 C 50,42 50,70 50,100" />
          </circle>
          <circle r="0.4" fill="#FFFFFF">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 50,0 C 50,42 50,70 50,100" />
          </circle>
        </g>
      </svg>
    </div>
  );
}

/* ─────────────────────── CENTRAL SYSTEM ─────────────────────── */
function CentralSystem() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.9, ease: EASE }}
      className="relative mx-auto w-full max-w-[520px]"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-[-30%] rounded-full"
        style={{
          background: "radial-gradient(ellipse 50% 50% at 50% 50%, var(--brand-glow-strong) 0%, var(--brand-glow-mid) 38%, transparent 75%)",
          filter: "blur(40px)",
          opacity: 0.7,
        }}
      />
      <div
        className="relative overflow-hidden rounded-[26px] px-7 py-8 text-center sm:px-10 sm:py-10"
        style={{
          background: "linear-gradient(180deg, rgba(24,18,46,0.92) 0%, rgba(10,8,22,0.96) 100%)",
          border: "1px solid var(--brand-card-border)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08), 0 30px 70px rgba(0,0,0,0.55), 0 0 50px var(--brand-card-glow)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{ background: "linear-gradient(90deg, transparent, var(--brand-line-bright), transparent)" }}
        />
        <div className="flex justify-center">
          <SystemMark />
        </div>
        <div className="mt-5 flex items-center justify-center gap-2 text-white/40">
          <span className="h-px w-[14px]" style={{ background: "rgba(255,255,255,0.3)" }} />
          <span
            className="text-[8.5px] font-medium uppercase tracking-[0.4em] sm:text-[9.5px]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            Ihr Unternehmen
          </span>
          <span className="h-px w-[14px]" style={{ background: "rgba(255,255,255,0.3)" }} />
        </div>
        <h3
          className="mt-2 text-[1.4rem] leading-none text-white sm:text-[1.7rem]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 400, letterSpacing: "-0.02em" }}
        >
          Ein zentrales System
        </h3>
        <p className="mt-2.5 text-[12.5px] text-white/50 sm:text-[13.5px]">
          Alle Informationen. Ein Ort. Volle Kontrolle.
        </p>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <motion.span
            aria-hidden
            className="inline-block h-[5px] w-[5px] rounded-full"
            style={{ background: "var(--brand-line-bright)", boxShadow: "0 0 8px var(--brand-glow-strong)" }}
            animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="text-[9px] font-medium uppercase tracking-[0.28em] text-white/55 sm:text-[10px]">
            Live · Synchronisiert
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function SystemMark() {
  return (
    <div
      className="relative flex h-[64px] w-[64px] items-center justify-center rounded-[18px]"
      style={{
        background: "linear-gradient(155deg, var(--brand-glow-strong) 0%, rgba(12,8,26,0.9) 70%)",
        border: "1px solid var(--brand-card-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.18), 0 12px 28px rgba(0,0,0,0.5), 0 0 28px var(--brand-glow-mid)",
      }}
    >
      <svg width="34" height="34" viewBox="0 0 32 32" fill="none" aria-hidden>
        <path
          d="M16 3 L27 9 V23 L16 29 L5 23 V9 Z"
          stroke="var(--brand-line-bright)"
          strokeWidth="1.4"
          strokeLinejoin="round"
          fill="rgba(255,255,255,0.03)"
        />
        <path
          d="M11.5 21 V12 L20.5 20 V11"
          stroke="#FFFFFF"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: "drop-shadow(0 0 6px var(--brand-glow-strong))" }}
        />
      </svg>
    </div>
  );
}

/* ─────────────────────────── FEATURES ───────────────────────── */
function FeatureGrid() {
  return (
    <div className="mt-[clamp(44px,7vh,76px)] grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
      {FEATURES.map((f, i) => (
        <FeatureCard key={f.key} feature={f} index={i} />
      ))}
    </div>
  );
}

function FeatureCard({ feature, index }: { feature: { key: FeatureKey; title: string; desc: string }; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8% 0px" }}
      transition={{ duration: 0.6, ease: EASE, delay: (index % 3) * 0.06 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-[20px] p-5 sm:p-6"
      style={{
        background: "linear-gradient(180deg, rgba(22,16,42,0.6) 0%, rgba(10,8,22,0.72) 100%)",
        border: "1px solid var(--brand-card-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 18px 40px rgba(0,0,0,0.4)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{ boxShadow: "inset 0 0 30px var(--brand-card-glow)", borderRadius: "20px" }}
      />
      <div
        className="relative flex h-[46px] w-[46px] items-center justify-center rounded-[13px]"
        style={{
          background: "linear-gradient(160deg, var(--brand-glow-mid) 0%, rgba(255,255,255,0.02) 100%)",
          border: "1px solid var(--brand-card-border)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
        }}
      >
        <span style={{ color: "var(--brand-line-bright)" }}>
          <FeatureIcon k={feature.key} />
        </span>
      </div>
      <h4
        className="relative mt-4 text-[15px] font-medium text-white sm:text-[16px]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", letterSpacing: "-0.01em" }}
      >
        {feature.title}
      </h4>
      <p className="relative mt-1.5 text-[12.5px] leading-[1.55] text-white/50 sm:text-[13px]">
        {feature.desc}
      </p>
    </motion.div>
  );
}

/* ──────────────────────── COOPERATION ───────────────────────── */
function Cooperation() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.85, ease: EASE }}
      className="relative mx-auto mt-[clamp(64px,11vh,128px)] w-full max-w-[840px]"
    >
      <div className="flex items-center justify-center gap-3.5 text-white/45">
        <span aria-hidden className="h-px w-[36px] sm:w-[56px]" style={{ background: "linear-gradient(90deg, transparent, var(--brand-line-mid))" }} />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.42em] sm:text-[11px]"
          style={{ color: "var(--brand-line-mid)", fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          Strategische Kooperation
        </span>
        <span aria-hidden className="h-px w-[36px] sm:w-[56px]" style={{ background: "linear-gradient(90deg, var(--brand-line-mid), transparent)" }} />
      </div>

      <h3
        className="mt-5 text-center text-[1.55rem] leading-[1.12] text-white sm:text-[2rem]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300, letterSpacing: "-0.03em" }}
      >
        Zwei Unternehmen.{" "}
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
          Eine Umsetzung.
        </span>
      </h3>

      <div className="mt-[clamp(36px,5vh,56px)] grid grid-cols-1 items-stretch gap-y-12 sm:grid-cols-[1fr_auto_1fr] sm:gap-y-0">
        <BrandColumn
          mark={<NexcelMark />}
          name="NEXCEL AI"
          tagline="Gestaltet das System"
          nameGradient="linear-gradient(120deg, #FFFFFF 0%, #F5F3FF 45%, #C4B5FD 100%)"
          accent="#A78BFA"
          align="end"
          capabilities={[
            { label: "Unternehmenssysteme", icon: "system" },
            { label: "Prozessdesign", icon: "process" },
            { label: "Branding & Customer Experience", icon: "brand" },
            { label: "Automatisierung", icon: "automation" },
          ]}
        />

        {/* Trenner mit ×-Glyphe — offen, ohne Kasten */}
        <div className="flex items-center justify-center sm:h-full sm:flex-col sm:px-[clamp(28px,5vw,64px)]">
          <span aria-hidden className="h-px w-12 sm:h-full sm:w-px sm:min-h-[180px]" style={{ background: "rgba(255,255,255,0.10)" }} />
          <span
            className="mx-4 my-0 text-[15px] font-light leading-none text-white/35 sm:mx-0 sm:my-4"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            ×
          </span>
          <span aria-hidden className="h-px w-12 sm:h-full sm:w-px sm:min-h-[180px]" style={{ background: "rgba(255,255,255,0.10)" }} />
        </div>

        <BrandColumn
          mark={<AgiMark />}
          name="AGI Works"
          tagline="Baut das System"
          nameGradient="linear-gradient(120deg, #FFFFFF 0%, #DBEAFE 45%, #60A5FA 100%)"
          accent="#5BB8FF"
          align="start"
          capabilities={[
            { label: "Softwarearchitektur", icon: "code" },
            { label: "Plattformen", icon: "layers" },
            { label: "Infrastruktur", icon: "server" },
            { label: "Entwicklung", icon: "build" },
          ]}
        />
      </div>

      {/* Gemeinsam — ein durchgängiger Prozess */}
      <div className="mt-[clamp(44px,7vh,72px)]">
        <div className="mx-auto mb-7 h-px max-w-xs" aria-hidden style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }} />
        <p
          className="text-center text-[10px] font-medium uppercase tracking-[0.34em] text-white/45 sm:text-[11px]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          Gemeinsam — von der Idee bis zum Betrieb
        </p>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-3 sm:gap-x-6">
          {["Analyse", "Konzeption", "Entwicklung", "Implementierung", "Betreuung"].map((step, i) => (
            <div key={step} className="flex items-center gap-x-4 sm:gap-x-6">
              {i > 0 && (
                <span aria-hidden className="text-white/25" style={{ color: "var(--brand-line-mid)" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              )}
              <span
                className="text-[13.5px] font-light text-white/80 sm:text-[14.5px]"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", letterSpacing: "0.005em" }}
              >
                {step}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mx-auto mt-[clamp(40px,6vh,64px)] max-w-[620px] text-center text-[14px] font-light leading-[1.7] text-white/45 sm:text-[15px]">
        Zusammen entsteht daraus ein vollständiges{" "}
        <span className="text-white/80" style={{ fontWeight: 400 }}>Betriebssystem für Unternehmen</span> —
        das Prozesse, Menschen und Technologie in einer funktionierenden Struktur zusammenführt.
      </p>
    </motion.div>
  );
}

function BrandColumn({
  mark,
  name,
  tagline,
  nameGradient,
  accent,
  align,
  capabilities,
}: {
  mark: React.ReactNode;
  name: string;
  tagline: string;
  nameGradient: string;
  accent: string;
  align: "start" | "end";
  capabilities: { label: string; icon: CapabilityIconKey }[];
}) {
  const desktopAlign = align === "end" ? "sm:items-end sm:text-right" : "sm:items-start sm:text-left";
  return (
    <div className={`flex flex-col items-center text-center ${desktopAlign}`}>
      <div className={`flex items-center gap-3.5 ${align === "end" ? "sm:flex-row-reverse" : ""}`}>
        {mark}
        <span
          className="text-[22px] font-medium leading-none sm:text-[27px]"
          style={{
            background: nameGradient,
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </span>
      </div>
      <span
        className="mt-2.5 text-[11px] font-medium uppercase tracking-[0.2em]"
        style={{ color: accent }}
      >
        {tagline}
      </span>
      <ul className="mt-6 flex flex-col gap-3.5">
        {capabilities.map((cap) => (
          <li key={cap.label} className={`flex items-center gap-3 ${align === "end" ? "sm:flex-row-reverse" : ""}`}>
            <span style={{ color: accent, filter: `drop-shadow(0 0 6px ${accent}55)` }} className="flex-shrink-0">
              <CapabilityIcon k={cap.icon} />
            </span>
            <span
              className="text-[15px] font-light text-white/80 sm:text-[15.5px]"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", letterSpacing: "0.005em" }}
            >
              {cap.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ─────────────────────── LOGO MARKS ─────────────────────────── */
function NexcelMark() {
  return (
    <span
      className="relative flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-[12px]"
      style={{
        background: "linear-gradient(155deg, #2A1E54 0%, #15102E 60%, #0A0718 100%)",
        border: "1px solid rgba(167,139,250,0.4)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 18px rgba(0,0,0,0.45), 0 0 22px rgba(139,92,246,0.4)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-1 top-[1px] h-[42%]"
        style={{ borderRadius: "10px 10px 18px 18px", background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent)" }}
      />
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="relative">
        <path
          d="M6 18 V6 L18 18 V6"
          stroke="url(#nx-grad)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <defs>
          <linearGradient id="nx-grad" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="55%" stopColor="#C4B5FD" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

function AgiMark() {
  return (
    <span
      className="relative flex h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-[12px]"
      style={{
        background: "linear-gradient(155deg, #102444 0%, #0A1730 60%, #040A1A 100%)",
        border: "1px solid rgba(91,184,255,0.4)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.16), 0 8px 18px rgba(0,0,0,0.45), 0 0 22px rgba(31,122,224,0.4)",
      }}
    >
      <span
        aria-hidden
        className="absolute inset-x-1 top-[1px] h-[42%]"
        style={{ borderRadius: "10px 10px 18px 18px", background: "linear-gradient(180deg, rgba(255,255,255,0.18), transparent)" }}
      />
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden className="relative">
        <path
          d="M6 19 L12 5 L18 19 M8.5 14 H15.5"
          stroke="url(#ag-letter)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4 13.5 C8 10.5, 16 10.5, 20 13.5"
          stroke="url(#ag-swoosh)"
          strokeWidth="1.8"
          strokeLinecap="round"
          fill="none"
        />
        <defs>
          <linearGradient id="ag-letter" x1="6" y1="5" x2="18" y2="19" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#BFD9F2" />
          </linearGradient>
          <linearGradient id="ag-swoosh" x1="4" y1="11" x2="20" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#9BD0FF" />
            <stop offset="100%" stopColor="#1F7AE0" />
          </linearGradient>
        </defs>
      </svg>
    </span>
  );
}

/* ─────────────────────── ICON LIBRARY ───────────────────────── */
function ChannelIcon({ k }: { k: ChannelKey }) {
  switch (k) {
    case "whatsapp":
      return (
        <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M19.05 4.91A9.82 9.82 0 0 0 12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.97L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.004c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.02ZM12.04 20.15h-.003a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.82 2.42a8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.69 8.23-8.22 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.42l-.48-.01c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07s.89 2.4 1.01 2.56c.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29Z" />
        </svg>
      );
    case "email":
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="5.5" width="18" height="13" rx="2.2" />
          <path d="M4 7l8 5.5L20 7" />
        </svg>
      );
    case "phone":
      return (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M6.6 2.5a1.4 1.4 0 0 1 1.36.96l1.1 3.05a1.4 1.4 0 0 1-.37 1.5l-1.4 1.27a12.5 12.5 0 0 0 4.78 4.78l1.27-1.4a1.4 1.4 0 0 1 1.5-.37l3.05 1.1a1.4 1.4 0 0 1 .96 1.36V19a2.5 2.5 0 0 1-2.7 2.5C9.2 20.9 3.1 14.8 2.5 6.7A2.5 2.5 0 0 1 5 4h1.6Z" />
        </svg>
      );
    case "calendar":
      return (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3.5" y="4.5" width="17" height="16" rx="2.4" />
          <path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" />
          <circle cx="8.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
        </svg>
      );
    case "documents":
      return (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v4h4M9.5 13h5M9.5 16.5h5" />
        </svg>
      );
    case "forms":
      return (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="5" y="4" width="14" height="17" rx="2.2" />
          <path d="M9 3.5h6v3H9zM8.5 12h7M8.5 16h4" />
        </svg>
      );
    default:
      return null;
  }
}

function FeatureIcon({ k }: { k: FeatureKey }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (k) {
    case "customers":
      return (
        <svg {...common} aria-hidden>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M16 6.2a3 3 0 0 1 0 5.6" />
          <path d="M18.5 19a5 5 0 0 0-2.7-4.4" />
        </svg>
      );
    case "comms":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 5h11a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2H8l-4 3z" />
          <path d="M20 9v6a2 2 0 0 1-2 2h-1" />
        </svg>
      );
    case "documents":
      return (
        <svg {...common} aria-hidden>
          <path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v4h4M9.5 13h5M9.5 16.5h5" />
        </svg>
      );
    case "automation":
      return (
        <svg {...common} aria-hidden>
          <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
        </svg>
      );
    case "tasks":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 6.5l1.5 1.5L8 5.5M4 12.5l1.5 1.5L8 11.5M4 18.5l1.5 1.5L8 17.5" />
          <path d="M11 7h9M11 13h9M11 19h9" />
        </svg>
      );
    case "control":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 20V4" />
          <path d="M4 20h16" />
          <path d="M8 17v-5M12.5 17V8M17 17v-7" />
        </svg>
      );
    default:
      return null;
  }
}

type CapabilityIconKey =
  | "ai"
  | "analytics"
  | "automation"
  | "code"
  | "layers"
  | "server"
  | "system"
  | "process"
  | "brand"
  | "build";

function CapabilityIcon({ k }: { k: CapabilityIconKey }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (k) {
    case "ai":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z" />
          <path d="M18 15l.8 1.8L20.5 17.5 18.7 18.3 18 20l-.8-1.7L15.5 17.5 17.2 16.8z" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...common} aria-hidden>
          <path d="M4 20V4M4 20h16" />
          <path d="M8 16l3-4 3 2 4-6" />
        </svg>
      );
    case "automation":
      return (
        <svg {...common} aria-hidden>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
        </svg>
      );
    case "code":
      return (
        <svg {...common} aria-hidden>
          <path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13 5l-2 14" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 3l9 5-9 5-9-5z" />
          <path d="M3 13l9 5 9-5" />
        </svg>
      );
    case "server":
      return (
        <svg {...common} aria-hidden>
          <rect x="3.5" y="4" width="17" height="6" rx="1.5" />
          <rect x="3.5" y="14" width="17" height="6" rx="1.5" />
          <path d="M7 7h.01M7 17h.01" />
        </svg>
      );
    case "system":
      return (
        <svg {...common} aria-hidden>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.4" />
          <rect x="13.5" y="3.5" width="7" height="7" rx="1.4" />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.4" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.4" />
        </svg>
      );
    case "process":
      return (
        <svg {...common} aria-hidden>
          <circle cx="5" cy="6" r="2" />
          <circle cx="5" cy="18" r="2" />
          <circle cx="19" cy="12" r="2" />
          <path d="M7 6h6a3 3 0 0 1 3 3v.5M7 18h6a3 3 0 0 0 3-3v-.5" />
        </svg>
      );
    case "brand":
      return (
        <svg {...common} aria-hidden>
          <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );
    case "build":
      return (
        <svg {...common} aria-hidden>
          <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" />
          <path d="M4 7.5l8 4.5 8-4.5M12 12v9" />
        </svg>
      );
    default:
      return null;
  }
}
