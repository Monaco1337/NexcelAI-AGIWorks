"use client";

/**
 * NEXCEL AI / AGI WORKS · PremiumHero
 *
 * Layer-Layout — kein Grid, das das Duo wegdrückt.
 *
 * Desktop
 *   ├─ Hintergrund (z-0)  HeroBg + Orbit-Glow
 *   ├─ Personen   (z-10)  absolut, right-[4vw] top-[120px], w-[min(52vw,820px)]
 *   └─ Content    (z-20)  Text · CTAs · Feature-Bar · Coop-Card  (links, unabhängig)
 *
 * Mobile  (< lg)
 *   Text → Founders (relative, max-w-[440px]) → Feature-Bar → Coop-Card
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";
import { AgiWorksLogoMark } from "@/components/ui/AgiWorksLogoMark";
import { NexcelLogoMark } from "@/components/ui/NexcelLogoMark";

/* ── Feature icons ─────────────────────────────────────────────────── */
function Ico({ d, extra }: { d?: string; extra?: React.ReactNode }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.65"
      strokeLinecap="round" strokeLinejoin="round"
      aria-hidden className="shrink-0">
      {d ? <path d={d} /> : extra}
    </svg>
  );
}

/**
 * Leistungs-Chips im Hero — zeigen in 2–3 Sekunden das volle Spektrum:
 * individuelle digitale Unternehmenssysteme, nicht nur Webseiten.
 * Reihenfolge & Umfang bewusst kuratiert (max. 12 Chips).
 */
const CHIPS = [
  { label: "Webseiten",        icon: <Ico extra={<><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.5 2.5 15.5 0 18M12 3c-2.5 2.5-2.5 15.5 0 18"/></>} /> },
  { label: "Web-Apps",         icon: <Ico extra={<><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14l-2 2 2 2M13 14l2 2-2 2"/></>} /> },
  { label: "Mobile Apps",      icon: <Ico extra={<><rect x="7" y="3" width="10" height="18" rx="2.2"/><path d="M11 18h2"/></>} /> },
  { label: "SaaS",             icon: <Ico d="M7 18a4 4 0 0 1-.5-7.97 5.5 5.5 0 0 1 10.6-1.02A3.75 3.75 0 0 1 17.5 18H7Z" /> },
  { label: "CRM",              icon: <Ico extra={<><circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M16 5a3 3 0 0 1 0 6M21 19c0-2.2-1.4-3.9-3.4-4.6"/></>} /> },
  { label: "ERP",              icon: <Ico extra={<><rect x="4" y="3" width="16" height="18" rx="1.6"/><path d="M9 7h.01M15 7h.01M9 11h.01M15 11h.01M9 15h6"/></>} /> },
  { label: "Kundenportale",    icon: <Ico extra={<><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></>} /> },
  { label: "Admin-Systeme",    icon: <Ico extra={<><path d="M4 8h16M4 16h16"/><circle cx="9" cy="8" r="2.1"/><circle cx="15" cy="16" r="2.1"/></>} /> },
  { label: "KI-Agenten",       icon: <Ico extra={<><rect x="6" y="6" width="12" height="12" rx="2.2"/><path d="M10 10h4v4h-4zM9 3v2M15 3v2M9 19v2M15 19v2M3 9h2M3 15h2M19 9h2M19 15h2"/></>} /> },
  { label: "Automatisierungen",icon: <Ico d="M13 3 4 14h7l-1 7 9-11h-7l1-7Z" /> },
  { label: "Dashboards",       icon: <Ico extra={<><path d="M3 21h18"/><rect x="5" y="11" width="3" height="7" rx="0.6"/><rect x="10.5" y="6" width="3" height="12" rx="0.6"/><rect x="16" y="14" width="3" height="4" rx="0.6"/></>} /> },
  { label: "APIs",             icon: <Ico d="M9 15l6-6M11 6.5 12.5 5a4 4 0 0 1 5.6 5.6L16.6 12M13 17.5 11.5 19a4 4 0 0 1-5.6-5.6L7.4 12" /> },
];

/* ── Main component ─────────────────────────────────────────────────── */
export default function PremiumHero() {
  const brand       = useBrand();
  const analyseHref = resolveBrandNavHref("/systemanalyse", brand.id);

  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden min-h-[680px] lg:min-h-[720px]"
      style={{
        background:
          "radial-gradient(ellipse 80% 60% at 55% 8%, #0d0924 0%, #050412 55%, #020206 100%)",
      }}
    >
      {/* ── z-0  Background grid + animated glow ─────────────────── */}
      <HeroBg />

      {/* ── Nav spacer ───────────────────────────────────────────── */}
      <div aria-hidden style={{ height: "calc(env(safe-area-inset-top,0px) + 116px)" }} />

      {/* ══════════════════════════════════════════════════════════
          DESKTOP: Founders + Orbit  — absolute, z-10
          Completely independent of text flow.
      ══════════════════════════════════════════════════════════ */}

      {/* Orbit / Glow — strictly behind founders (z-[5]) */}
      <div
        aria-hidden
        className="pointer-events-none hidden lg:block absolute z-[5]"
        style={{
          right: "calc(4vw - 100px)",
          top: "30px",
          width: "min(60vw, 960px)",
          height: "min(60vw, 960px)",
        }}
      >
        {/* deep core glow — largest, most diffuse */}
        <div className="absolute inset-[10%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 48%, var(--brand-glow-mid) 0%, rgba(91,33,182,0.08) 52%, transparent 72%)",
            filter: "blur(38px)",
          }}
        />
        {/* mid halo */}
        <div className="absolute inset-[22%] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 50% 46%, var(--brand-glow-strong) 0%, transparent 60%)",
            filter: "blur(18px)",
            opacity: 0.45,
          }}
        />
        {/* SVG orbital rings */}
        <svg aria-hidden className="absolute inset-0 h-full w-full"
          viewBox="0 0 500 500" fill="none">
          <defs>
            {/* primary ring gradient — bright arc on upper-left, fades out */}
            <linearGradient id="phOrb1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%"   stopColor="#C4B5FD" stopOpacity="0"   />
              <stop offset="28%"  stopColor="#C4B5FD" stopOpacity="0.72"/>
              <stop offset="55%"  stopColor="#A78BFA" stopOpacity="0.55"/>
              <stop offset="78%"  stopColor="#7C3AED" stopOpacity="0.28"/>
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"   />
            </linearGradient>
            {/* secondary ring */}
            <linearGradient id="phOrb2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#93C5FD" stopOpacity="0"   />
              <stop offset="35%"  stopColor="#93C5FD" stopOpacity="0.38"/>
              <stop offset="65%"  stopColor="#7C3AED" stopOpacity="0.22"/>
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0"   />
            </linearGradient>
            {/* node dot glow */}
            <radialGradient id="phDot" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#E9D5FF" stopOpacity="1"  />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0"  />
            </radialGradient>
          </defs>

          {/* outer main ring */}
          <circle cx="250" cy="250" r="235"
            stroke="url(#phOrb1)" strokeWidth="1.1" />

          {/* inner ring — slightly tilted ellipse for depth */}
          <ellipse cx="250" cy="250" rx="168" ry="176"
            stroke="url(#phOrb2)" strokeWidth="0.8" opacity="0.7"
            transform="rotate(-18 250 250)" />

          {/* subtle innermost ring */}
          <circle cx="250" cy="250" r="108"
            stroke="#A78BFA" strokeWidth="0.5" opacity="0.18" />

          {/* node dots — accent points on outer ring */}
          <circle cx="250" cy="15"  r="3.5" fill="url(#phDot)" opacity="0.9" />
          <circle cx="484" cy="250" r="2.8" fill="url(#phDot)" opacity="0.65"/>
          <circle cx="250" cy="485" r="2.2" fill="url(#phDot)" opacity="0.4" />
          <circle cx="16"  cy="250" r="2.2" fill="url(#phDot)" opacity="0.4" />

          {/* small accent arc — gives technical / system feel */}
          <path
            d="M 250 15 A 235 235 0 0 1 462 362"
            stroke="#C4B5FD" strokeWidth="0.6" opacity="0.22"
            strokeDasharray="6 10"
          />
        </svg>
      </div>

      {/* Founders image — absolute on desktop, hidden here on mobile */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/team/founders-cutout.png"
        alt="Celina Siebeneicher und Kevin Blazevic — Gründer von NEXCEL AI und AGI Works"
        draggable={false}
        className="
          pointer-events-none select-none
          hidden lg:block
          absolute z-10
          object-contain object-bottom
        "
        style={{
          right: "4vw",
          top: "100px",
          width: "min(52vw, 820px)",
          minWidth: "600px",
          /* tall enough to show both people fully */
          height: "auto",
          maxHeight: "calc(100% - 100px)",
          filter:
            "drop-shadow(0 28px 55px rgba(0,0,0,0.58)) drop-shadow(0 6px 18px rgba(0,0,0,0.42))",
        }}
      />

      {/* ══════════════════════════════════════════════════════════
          CONTENT  — z-20, left-aligned, independent of founders
      ══════════════════════════════════════════════════════════ */}
      <div className="relative z-20 mx-auto w-full max-w-[1300px] px-5 sm:px-8">

        {/* Eyebrow */}
        <motion.p
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="text-[11px] font-semibold uppercase tracking-[0.34em]"
          style={{ color: "var(--accent)" }}
        >
          Individuell · Sicher · Skalierbar
        </motion.p>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
          className="
            mt-5 max-w-[680px]
            text-[2.65rem] font-[300] leading-[1.03] tracking-[-0.038em] text-white
            sm:text-[3.1rem] md:text-[3.5rem] lg:text-[3.9rem]
          "
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          Digitale Betriebssysteme{" "}
          <span style={{ fontWeight: 400 }}>für </span>
          <span style={{
            background: "var(--brand-headline-gradient)",
            WebkitBackgroundClip: "text", backgroundClip: "text",
            color: "transparent", WebkitTextFillColor: "transparent",
            fontWeight: 400,
            filter: "drop-shadow(0 0 26px var(--brand-glow-strong))",
          }}>
            Unternehmen.
          </span>
        </motion.h1>

        {/* Sub */}
        <motion.p
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.13, ease: [0.22, 1, 0.36, 1] }}
          className="mt-5 max-w-[480px] text-[15px] leading-[1.72] text-white/65 sm:text-[16px]"
        >
          Wir entwickeln individuelle Systeme für Kunden, Buchungen, Leads,
          Verwaltung, Kommunikation, Dokumente und Automatisierung — von der
          Premium-Webseite bis zum ERP-ähnlichen Unternehmenssystem.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.19, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"
        >
          <Link href={analyseHref} prefetch className="group/cta">
            <span
              className="relative flex w-fit items-center gap-2.5 overflow-hidden rounded-2xl px-7 py-[16px] text-[14px] font-semibold text-white transition-transform duration-300 group-hover/cta:-translate-y-0.5"
              style={{
                background: "color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.03))",
                border: "1px solid color-mix(in srgb, var(--accent) 50%, transparent)",
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                backdropFilter: "blur(12px)",
                boxShadow: "0 6px 28px color-mix(in srgb, var(--accent) 22%, transparent), inset 0 1px 0 rgba(255,255,255,0.13)",
              }}
            >
              <span aria-hidden
                className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-out group-hover/cta:translate-x-full"
                style={{ background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.13),transparent)" }}
              />
              <span className="relative">Systemanalyse starten</span>
              <svg width="15" height="15" viewBox="0 0 24 24" aria-hidden
                className="relative transition-transform duration-300 group-hover/cta:translate-x-0.5">
                <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </Link>

          <a href="#systeme" className="group/sec">
            <span
              className="flex w-fit items-center gap-2 rounded-2xl px-7 py-[16px] text-[14px] font-medium text-white/85 backdrop-blur-sm transition-all duration-300 hover:text-white"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                background: "linear-gradient(180deg,rgba(255,255,255,0.07) 0%,rgba(255,255,255,0.025) 100%)",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              Lösungen ansehen
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden
                className="transition-transform duration-300 group-hover/sec:translate-y-0.5">
                <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </a>
        </motion.div>

        {/* ── Mobile founders — in flow, after CTAs ──────────────── */}
        <div className="lg:hidden mt-10 flex justify-center">
          {/* mobile orbit glow */}
          <div className="relative w-full max-w-[440px]">
            <div aria-hidden className="pointer-events-none absolute inset-[-12%] rounded-full"
              style={{
                background: "radial-gradient(circle, var(--brand-glow-mid) 0%, transparent 68%)",
                filter: "blur(20px)",
                zIndex: 0,
              }}
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/team/founders-cutout.png"
              alt="Celina Siebeneicher und Kevin Blazevic"
              draggable={false}
              className="relative z-10 block w-full select-none object-contain"
              style={{
                filter:
                  "drop-shadow(0 22px 44px rgba(0,0,0,0.55)) drop-shadow(0 4px 14px rgba(0,0,0,0.4))",
              }}
            />
          </div>
        </div>

        {/* ══ Feature-Leiste + Coop-Card — ein zusammenhängendes System ══ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 mb-4 sm:mb-6 lg:mb-8"
        >
          {/* ── Leistungs-Chips ──────────────────────────────────────
              Desktop: eine Zeile, Umbruch bei Bedarf.
              Mobile: horizontal scrollbar mit Snap, Scrollbar ausgeblendet. */}
          <ul
            className="
              scrollbar-hide
              flex snap-x snap-mandatory gap-2.5 overflow-x-auto pb-1
              lg:max-w-[700px] lg:flex-wrap lg:overflow-visible lg:pb-0
            "
          >
            {CHIPS.map((c) => (
              <li key={c.label} className="shrink-0 snap-start lg:shrink">
                <span
                  className="
                    flex h-9 items-center gap-2 whitespace-nowrap rounded-full px-3.5
                    text-[12.5px] font-medium text-white/70 backdrop-blur
                    border border-white/[0.10]
                    shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]
                    transition-all duration-300
                    hover:scale-[1.03] hover:border-white/20 hover:text-white
                    hover:shadow-[0_0_22px_var(--brand-glow-mid),inset_0_1px_0_rgba(255,255,255,0.12)]
                  "
                  style={{
                    background:
                      "linear-gradient(180deg,rgba(255,255,255,0.06) 0%,rgba(255,255,255,0.02) 100%)",
                    cursor: "default",
                  }}
                >
                  <span style={{ color: "var(--accent)" }}>{c.icon}</span>
                  {c.label}
                </span>
              </li>
            ))}
          </ul>

          {/* subtle glow bridge — visually connects bar to card */}
          <div aria-hidden className="pointer-events-none relative h-[2px] w-full max-w-[460px] lg:ml-auto"
            style={{
              background: "linear-gradient(90deg,transparent 0%,rgba(139,92,246,0.18) 40%,rgba(147,197,253,0.12) 70%,transparent 100%)",
              filter: "blur(1px)",
            }}
          />

          {/* ── Coop Glass-Card ───────────────────────────────────── */}
          {/*   Desktop: ml-auto → right-aligned, docks under Founder-Duo */}
          <div
            className="w-full max-w-[500px] lg:ml-auto lg:max-w-[480px]"
          >
          <div
            className="relative overflow-hidden rounded-[18px] px-4 py-3.5 sm:px-5 sm:py-4"
            style={{
              background: "linear-gradient(160deg,rgba(255,255,255,0.09) 0%,rgba(255,255,255,0.035) 100%)",
              border: "1px solid rgba(255,255,255,0.13)",
              backdropFilter: "blur(32px) saturate(160%)",
              WebkitBackdropFilter: "blur(32px) saturate(160%)",
              boxShadow: "0 24px 56px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.14)",
            }}
          >
            {/* top shimmer */}
            <div aria-hidden
              className="pointer-events-none absolute -top-px left-1/2 h-px w-1/2 -translate-x-1/2"
              style={{
                background: "linear-gradient(90deg,transparent,var(--brand-line-bright),transparent)",
                opacity: 0.55,
              }}
            />

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
              {/* NEXCEL AI */}
              <div className="flex min-w-0 flex-col gap-1">
                <NexcelLogoMark width={88} height={16} />
                <span className="text-[10.5px] leading-snug text-white/48">
                  Strategie, Systeme & Wachstum
                </span>
              </div>

              {/* Infinity — bare symbol, no circle container */}
              <div className="flex items-center justify-center px-1">
                <svg
                  width="36" height="20" viewBox="0 0 40 22" fill="none"
                  aria-hidden className="shrink-0"
                  style={{ filter: "drop-shadow(0 0 8px var(--brand-glow-strong))" }}
                >
                  {/* stroke version — clean, premium */}
                  <path
                    d="M14 11c0 0-2-6-7-6a6 6 0 0 0 0 12c5 0 6.5-3.5 10-6
                       c3.5-2.5 5-6 10-6a6 6 0 0 1 0 12c-5 0-7-6-7-6"
                    stroke="url(#infG)" strokeWidth="1.9"
                    strokeLinecap="round" strokeLinejoin="round"
                    fill="none"
                  />
                  <defs>
                    <linearGradient id="infG" x1="0%" y1="50%" x2="100%" y2="50%">
                      <stop offset="0%"   stopColor="#7C3AED" stopOpacity="0.7" />
                      <stop offset="45%"  stopColor="#C4B5FD" stopOpacity="1"   />
                      <stop offset="100%" stopColor="#93C5FD" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* AGI Works */}
              <div className="flex min-w-0 flex-col items-end gap-1 text-right">
                <span className="flex items-center gap-1.5 text-[12.5px] font-bold tracking-tight text-white/90">
                  <AgiWorksLogoMark
                    size={18}
                    glow="drop-shadow(0 1px 4px rgba(0,0,0,0.5)) drop-shadow(0 0 8px rgba(91,184,255,0.55))"
                  />
                  AGI Works
                </span>
                <span className="text-[10.5px] leading-snug text-white/48">
                  Architektur, Systeme & Skalierung
                </span>
              </div>
            </div>

            {/* subline */}
            <div aria-hidden className="mx-auto mt-3 h-px w-10" style={{ background: "rgba(255,255,255,0.09)" }} />
            <p className="mt-2.5 text-center text-[10px] font-medium uppercase tracking-[0.20em] text-white/36">
              Zwei Partner. Eine Umsetzung.
            </p>
          </div>
          {/* /card inner glass */}
          </div>
          {/* /card outer wrapper */}
        </motion.div>
        {/* /feature+card group */}
      </div>
    </section>
  );
}

/* ── Background ─────────────────────────────────────────────────────── */
function HeroBg() {
  return (
    <>
      {/* grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.021) 1px,transparent 1px)," +
            "linear-gradient(90deg,rgba(255,255,255,0.021) 1px,transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage: "radial-gradient(ellipse 85% 70% at 40% 30%,#000 25%,transparent 85%)",
          WebkitMaskImage: "radial-gradient(ellipse 85% 70% at 40% 30%,#000 25%,transparent 85%)",
        }}
      />
      {/* animated glow */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-0"
        animate={{ backgroundPosition: ["0% 0%", "100% 50%", "0% 0%"] }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
        style={{
          background:
            "radial-gradient(42% 36% at 16% 26%,var(--brand-glow-strong) 0%,transparent 65%)," +
            "radial-gradient(40% 34% at 86% 64%,rgba(91,33,182,0.18) 0%,transparent 65%)",
          backgroundSize: "220% 220%",
          filter: "blur(2px)",
        }}
      />
      {/* bottom-fade — melts Hero into the section below (body bg #0b0d12) */}
      <div aria-hidden className="pointer-events-none absolute bottom-0 left-0 right-0 z-30 h-40"
        style={{
          background:
            "linear-gradient(to bottom," +
            "transparent 0%," +
            "rgba(5,4,16,0.55) 45%," +
            "rgba(7,5,14,0.82) 70%," +
            "#0b0d12 100%)",
        }}
      />
    </>
  );
}
