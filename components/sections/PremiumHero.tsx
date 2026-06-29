"use client";

/**
 * NEXCEL AI / AGI WORKS · PremiumHero
 *
 * Marketing-Hero auf Enterprise-Niveau (Dark Premium).
 *   Links:  Eyebrow · Headline · Subheadline · CTAs · Trustline
 *   Rechts: gemeinsames Gründerbild (Celina + Kevin) mit dunklem Overlay,
 *           subtilen Systemlinien und einer Glassmorphism-Dual-Brand-Card:
 *             NEXCEL AI  = gestaltet das System
 *             AGI Works  = baut das System
 *
 * Brand-aware über CSS-Tokens (--accent / --brand-*), identisch lauffähig für
 * NEXCEL AI (violett) und AGI Works (cyan/blau). Das Analyse-Tool liegt jetzt
 * unter /systemanalyse — der Primär-CTA verlinkt dorthin.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";

const TRUST_ITEMS = [
  "Website",
  "Buchungssystem",
  "CRM",
  "Adminpanel",
  "Lead-Funnel",
  "Automatisierung",
  "ERP",
];

export default function PremiumHero() {
  const brand = useBrand();
  const analyseHref = resolveBrandNavHref("/systemanalyse", brand.id);

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse 75% 55% at 50% 12%, #0c0820 0%, #050410 55%, #020205 100%)",
      }}
    >
      <HeroBackground />

      {/* Reservierter Whitespace für die fixed Premium-Navigation oben. */}
      <div
        aria-hidden
        className="shrink-0"
        style={{ height: "calc(env(safe-area-inset-top, 0px) + 104px)" }}
      />

      <div className="relative z-10 mx-auto grid w-full max-w-[1280px] grid-cols-1 items-center gap-12 px-5 pb-20 pt-4 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:gap-16 lg:pb-28 lg:pt-6">
        {/* ── Linke Spalte: Text ─────────────────────────────────── */}
        <div className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="flex w-fit items-center gap-2 text-[11px] font-medium uppercase tracking-[0.30em]"
            style={{ color: "var(--accent)" }}
          >
            <span
              aria-hidden
              className="inline-block h-1.5 w-1.5 rounded-full"
              style={{
                background: "var(--accent)",
                boxShadow: "0 0 12px var(--brand-glow-strong)",
              }}
            />
            Individuell · Sicher · Skalierbar
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 text-[2.6rem] leading-[1.04] tracking-[-0.035em] text-white sm:text-[3.1rem] sm:leading-[1.02] md:text-[3.5rem] lg:text-[3.8rem]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            Digitale Betriebssysteme
            <br />
            <span style={{ fontWeight: 400 }}>für </span>
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
              Unternehmen.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-[560px] text-[15.5px] leading-[1.65] text-white/65 sm:text-[17px]"
          >
            Wir entwickeln individuelle Systeme für Kunden, Buchungen, Leads,
            Verwaltung, Kommunikation, Dokumente und Automatisierung — von der
            Premium-Webseite bis zum ERP-ähnlichen Unternehmenssystem.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <Link href={analyseHref} prefetch className="group/cta">
              <span
                className="relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-7 py-[16px] text-[14px] font-semibold text-white transition-transform duration-300 group-hover/cta:-translate-y-0.5"
                style={{
                  background: "var(--brand-gradient)",
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  boxShadow:
                    "0 16px 40px var(--brand-glow-strong), inset 0 1px 0 rgba(255,255,255,0.26)",
                }}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-out group-hover/cta:translate-x-full"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(255,255,255,0.24), transparent)",
                  }}
                />
                <span className="relative">Systemanalyse starten</span>
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="relative transition-transform duration-300 group-hover/cta:translate-x-0.5"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>

            <a href="#systeme" className="group/sec">
              <span
                className="relative flex items-center justify-center gap-2 rounded-2xl px-7 py-[16px] text-[14px] font-medium text-white/85 transition-all duration-300 group-hover/sec:text-white"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                }}
              >
                Lösungen ansehen
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="transition-transform duration-300 group-hover/sec:translate-y-0.5"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </a>
          </motion.div>

          {/* Trustline */}
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.7, delay: 0.28 }}
            className="mt-10 flex flex-wrap items-center gap-x-3 gap-y-2 text-[12.5px] text-white/45"
          >
            {TRUST_ITEMS.map((item, i) => (
              <li key={item} className="flex items-center gap-3">
                {i > 0 && (
                  <span aria-hidden className="text-white/20">
                    ·
                  </span>
                )}
                <span>{item}</span>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* ── Rechte Spalte: Gründerbild + Dual-Brand-Card ─────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-[560px] lg:max-w-none"
        >
          <div
            className="relative overflow-hidden rounded-[28px]"
            style={{
              border: "1px solid var(--brand-card-border)",
              boxShadow:
                "0 50px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            {/* Gründerbild */}
            <div className="relative aspect-[4/5] w-full sm:aspect-[5/5] lg:aspect-[4/4.4]">
              <img
                src="/images/team/founders.png"
                alt="Celina Siebeneicher und Kevin Blazevic — Gründer von NEXCEL AI und AGI Works"
                className="absolute inset-0 h-full w-full select-none object-cover object-top"
                draggable={false}
              />
              {/* Dunkles Overlay + Brand-Tint */}
              <div
                aria-hidden
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(5,4,16,0.18) 0%, rgba(5,4,16,0.34) 46%, rgba(5,4,16,0.92) 100%)",
                }}
              />
              <div
                aria-hidden
                className="absolute inset-0 mix-blend-soft-light"
                style={{
                  background:
                    "radial-gradient(70% 60% at 80% 12%, var(--brand-glow-mid), transparent 60%)",
                }}
              />
              {/* subtile Systemlinien */}
              <SystemLines />
            </div>

            {/* Glassmorphism Dual-Brand-Card */}
            <div className="absolute inset-x-4 bottom-4 sm:inset-x-5 sm:bottom-5">
              <div
                className="relative overflow-hidden rounded-2xl p-4 sm:p-5"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.04) 100%)",
                  border: "1px solid rgba(255,255,255,0.14)",
                  backdropFilter: "blur(26px) saturate(160%)",
                  WebkitBackdropFilter: "blur(26px) saturate(160%)",
                  boxShadow:
                    "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.12)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-px left-1/2 h-px w-2/3 -translate-x-1/2"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, var(--brand-line-bright), transparent)",
                    opacity: 0.6,
                  }}
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto_1fr] sm:items-center sm:gap-4">
                  <BrandStatement
                    mark={
                      <span
                        className="text-[12px] font-bold tracking-tight"
                        style={{ color: "#E5E7EB" }}
                      >
                        NEXCEL{" "}
                        <span style={{ color: "#8B5CF6" }}>AI</span>
                      </span>
                    }
                    statement="gestaltet das System"
                  />

                  {/* Connector */}
                  <div className="hidden items-center justify-center sm:flex">
                    <span
                      className="flex h-9 w-9 items-center justify-center rounded-full text-white/80"
                      style={{
                        background: "rgba(255,255,255,0.06)",
                        border: "1px solid rgba(255,255,255,0.14)",
                      }}
                    >
                      <svg width="20" height="14" viewBox="0 0 28 18" fill="none" aria-hidden>
                        <path
                          d="M9 9a4.5 4.5 0 1 1-4.5-4.5C7 4.5 9 9 9 9s2 4.5 4.5 4.5A4.5 4.5 0 1 0 9 9Zm10 0a4.5 4.5 0 1 1 4.5 4.5C21 13.5 19 9 19 9s-2-4.5-4.5-4.5A4.5 4.5 0 0 0 19 9Z"
                          fill="currentColor"
                          opacity="0.85"
                        />
                      </svg>
                    </span>
                  </div>

                  {/* Divider mobile */}
                  <div
                    aria-hidden
                    className="h-px w-full sm:hidden"
                    style={{ background: "rgba(255,255,255,0.10)" }}
                  />

                  <BrandStatement
                    align="right"
                    mark={
                      <span className="flex items-center gap-1.5">
                        <img
                          src="/favicons/agiworks.svg"
                          alt=""
                          width={16}
                          height={16}
                          className="h-4 w-4"
                          draggable={false}
                        />
                        <span
                          className="text-[12px] font-bold tracking-tight"
                          style={{ color: "#E5E7EB" }}
                        >
                          AGI Works
                        </span>
                      </span>
                    }
                    statement="baut das System"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function BrandStatement({
  mark,
  statement,
  align = "left",
}: {
  mark: React.ReactNode;
  statement: string;
  align?: "left" | "right";
}) {
  return (
    <div
      className={`flex flex-col gap-1 ${
        align === "right" ? "sm:items-end sm:text-right" : ""
      }`}
    >
      {mark}
      <span className="text-[12.5px] leading-snug text-white/60">{statement}</span>
    </div>
  );
}

function SystemLines() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 400 480"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient id="hero-line" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--brand-line-bright)" stopOpacity="0.0" />
          <stop offset="50%" stopColor="var(--brand-line-bright)" stopOpacity="0.55" />
          <stop offset="100%" stopColor="var(--brand-line-bright)" stopOpacity="0.0" />
        </linearGradient>
      </defs>
      <path
        d="M-20 90 C 120 70, 220 150, 420 110"
        stroke="url(#hero-line)"
        strokeWidth="1"
      />
      <path
        d="M-20 160 C 140 150, 260 210, 420 175"
        stroke="url(#hero-line)"
        strokeWidth="1"
        opacity="0.7"
      />
      <circle cx="86" cy="84" r="2.2" fill="var(--brand-line-bright)" opacity="0.7" />
      <circle cx="300" cy="128" r="2.2" fill="var(--brand-line-bright)" opacity="0.6" />
      <circle cx="220" cy="186" r="1.8" fill="var(--brand-line-bright)" opacity="0.5" />
    </svg>
  );
}

function HeroBackground() {
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
            "radial-gradient(ellipse 85% 70% at 40% 30%, #000 25%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 70% at 40% 30%, #000 25%, transparent 85%)",
        }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        animate={{ backgroundPosition: ["0% 0%", "100% 50%", "0% 0%"] }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        style={{
          background: `
            radial-gradient(42% 36% at 16% 26%, var(--brand-glow-strong) 0%, transparent 65%),
            radial-gradient(36% 30% at 84% 70%, rgba(91,33,182,0.16) 0%, transparent 65%)
          `,
          backgroundSize: "220% 220%",
          filter: "blur(2px)",
        }}
      />
    </>
  );
}
