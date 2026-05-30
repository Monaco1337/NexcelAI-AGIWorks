"use client";

import { Fragment, useState } from "react";
import Image from "next/image";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";

const heroStats = [
  { icon: "users", label: "Zwei Gründer" },
  { icon: "buildings", label: "Zwei Unternehmen" },
  { icon: "link", label: "Ein gemeinsames Ziel" },
  { icon: "rocket", label: "Ihr Wachstum" },
] as const;

function HeroStatIcon({ name }: { name: (typeof heroStats)[number]["icon"] }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "users":
      return (
        <svg {...common}>
          <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5" />
        </svg>
      );
    case "buildings":
      return (
        <svg {...common}>
          <path d="M4 21V7l6-3v17M10 21h10V11l-6-2" />
          <path d="M14 21V9M7 9v.01M7 12v.01M7 15v.01M17 13v.01M17 16v.01" />
        </svg>
      );
    case "link":
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
          <path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...common}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
  }
}

function HeroStats() {
  return (
    <div className="mt-10 grid grid-cols-2 gap-x-6 gap-y-7 sm:flex sm:flex-wrap sm:gap-x-9 lg:gap-x-10">
      {heroStats.map((stat, index) => (
        <motion.div
          key={stat.label}
          className="flex flex-col items-center gap-2.5 sm:items-start"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.35 + index * 0.08,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <span
            className="flex h-11 w-11 items-center justify-center rounded-2xl"
            style={{
              color: "var(--accent)",
              background: "color-mix(in srgb, var(--accent) 10%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
              boxShadow:
                "0 8px 24px var(--brand-glow-soft), inset 0 1px 0 rgba(255,255,255,0.06)",
            }}
          >
            <HeroStatIcon name={stat.icon} />
          </span>
          <span
            className="text-center text-[12px] text-white/55 sm:text-left sm:text-[12.5px]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            {stat.label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}

function BrandBridge() {
  return (
    <motion.div
      className="relative mx-auto mt-16 w-full max-w-4xl overflow-hidden rounded-[28px] p-7 sm:p-9"
      style={{
        background:
          "linear-gradient(180deg, rgba(10,10,18,0.72) 0%, rgba(6,6,12,0.82) 100%)",
        border: "1px solid var(--brand-card-border)",
        boxShadow:
          "0 30px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 48px var(--brand-glow-soft)",
        backdropFilter: "blur(28px) saturate(140%)",
        WebkitBackdropFilter: "blur(28px) saturate(140%)",
      }}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex flex-col items-center gap-7 md:flex-row md:justify-between md:gap-5">
        {/* NEXCEL AI */}
        <div className="text-center md:text-left">
          <div
            className="text-[20px] font-semibold tracking-[-0.01em] sm:text-[22px]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            <span className="text-white">NEXCEL </span>
            <span style={{ color: "#B78CFF" }}>AI</span>
          </div>
          <div className="mt-1.5 text-[12.5px] text-white/45">
            Gestaltet das System
          </div>
        </div>

        {/* Bridge connector */}
        <div className="flex items-center gap-3">
          <BridgeArrow direction="left" />
          <span
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full"
            style={{
              background:
                "radial-gradient(circle at 50% 35%, rgba(255,255,255,0.10), rgba(255,255,255,0.02) 60%, transparent 80%)",
              border: "1px solid var(--brand-line-mid)",
              boxShadow:
                "0 0 28px var(--brand-glow-mid), inset 0 1px 0 rgba(255,255,255,0.10)",
            }}
          >
            <InfinityIcon />
          </span>
          <BridgeArrow direction="right" />
        </div>

        {/* AGI Works */}
        <div className="text-center md:text-right">
          <div
            className="text-[20px] font-semibold tracking-[-0.01em] sm:text-[22px]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            <span className="text-white">AGI </span>
            <span style={{ color: "#5BB8FF" }}>Works</span>
          </div>
          <div className="mt-1.5 text-[12.5px] text-white/45">
            Baut das System
          </div>
        </div>
      </div>

      <p className="mt-7 text-center text-[13px] leading-[1.65] text-white/50">
        Zwei Spezialisierungen, eine Umsetzung — ein vollständiges
        Betriebssystem für Ihr Unternehmen.
      </p>
    </motion.div>
  );
}

function BridgeArrow({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="46"
      height="14"
      viewBox="0 0 46 14"
      fill="none"
      aria-hidden
      style={{
        transform: direction === "left" ? "scaleX(-1)" : undefined,
      }}
    >
      <defs>
        <linearGradient id={`bridge-arrow-${direction}`} x1="0" y1="0" x2="46" y2="0">
          <stop offset="0%" stopColor="var(--brand-line-dim)" />
          <stop offset="100%" stopColor="var(--brand-line-bright)" />
        </linearGradient>
      </defs>
      <path
        d="M0 7h40M34 2l6 5-6 5"
        stroke={`url(#bridge-arrow-${direction})`}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function InfinityIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6.5 9a3 3 0 1 0 0 6c1.7 0 2.8-1.3 4-3 1.2-1.7 2.3-3 4-3a3 3 0 1 1 0 6c-1.7 0-2.8-1.3-4-3-1.2-1.7-2.3-3-4-3z"
        stroke="var(--accent)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ── Warum zwei Unternehmen — Eyebrow + gestaffelte Headline ───────── */
function WhyHeading() {
  return (
    <>
      <span
        className="block text-[11px] font-medium uppercase tracking-[0.32em]"
        style={{ color: "var(--accent)" }}
      >
        Warum zwei Unternehmen?
      </span>
      <h2
        className="mt-5 text-[1.9rem] font-light leading-[1.12] tracking-[-0.03em] text-white sm:text-[2.3rem] lg:text-[2.6rem]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        Zwei Spezialisierungen.
        <br />
        <span
          style={{
            background: "var(--brand-headline-gradient)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            fontWeight: 400,
          }}
        >
          Eine Lösung.
        </span>
      </h2>
    </>
  );
}

function WhyBody() {
  return (
    <div className="space-y-5">
      <p
        className="text-[15px] leading-[1.75] text-white/62 sm:text-[16px]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
      >
        Viele Agenturen versuchen alles selbst zu machen. Wir nicht. NEXCEL AI
        gestaltet das System — Unternehmensarchitektur, Prozessdesign, Branding
        und Customer Experience. AGI Works baut das System —
        Softwarearchitektur, Plattformen und Infrastruktur.
      </p>
      <p
        className="text-[15px] leading-[1.75] sm:text-[16px]"
        style={{
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 400,
          background: "var(--brand-headline-gradient)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        Gemeinsam entstehen Lösungen, die weder klassische Agenturen noch
        Einzelpersonen in dieser Tiefe liefern können.
      </p>
    </div>
  );
}

/* ── Die Menschen hinter den Systemen — Founder Positioning ───────── */
const founders = [
  {
    brandId: "nexcel",
    name: "Celina Siebeneicher",
    role: "Gründerin · Unternehmensarchitektin",
    company: "NEXCEL AI",
    image: "/images/team/celina.png",
    accent: "#B78CFF",
    accentRgb: "183, 140, 255",
    responsibilities: [
      "Unternehmenssysteme",
      "Systemdesign",
      "Prozessdesign",
      "Branding",
      "Customer Experience",
      "Automatisierung",
    ],
  },
  {
    brandId: "agiworks",
    name: "Kevin Blazevic",
    role: "Gründer · Softwarearchitekt",
    company: "AGI Works",
    image: "/images/team/kevin.png",
    accent: "#5BB8FF",
    accentRgb: "91, 184, 255",
    responsibilities: [
      "Softwarearchitektur",
      "Plattformentwicklung",
      "Enterprise-Systeme",
      "Infrastruktur",
      "Backend-Systeme",
      "Systemintegration",
    ],
  },
] as const;

function FounderColumn({
  founder,
  index,
}: {
  founder: (typeof founders)[number];
  index: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Dezenter Hover-Glow (markenfarben, sehr zurückhaltend) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 rounded-[40px] opacity-0 transition-opacity duration-700 group-hover:opacity-100"
        style={{
          background: `radial-gradient(60% 50% at 50% 30%, rgba(${founder.accentRgb}, 0.16), transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Großes Porträt — primäres visuelles Element */}
      <div
        className="relative h-[420px] w-full overflow-hidden rounded-[28px] sm:h-[520px] lg:h-[600px]"
        style={{
          border: `1px solid rgba(${founder.accentRgb}, 0.22)`,
          boxShadow: `0 40px 100px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)`,
        }}
      >
        <Image
          src={founder.image}
          alt={founder.name}
          fill
          quality={100}
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover object-[center_22%] transition-transform duration-[1200ms] ease-out group-hover:scale-[1.03]"
        />
        {/* Boden-Verlauf für Tiefe */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/3"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(2,2,8,0.55))",
          }}
        />
        {/* Markenfarbener Tint, nur bei Hover sichtbar */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-700 group-hover:opacity-100"
          style={{
            background: `radial-gradient(70% 60% at 50% 20%, rgba(${founder.accentRgb}, 0.4), transparent 70%)`,
          }}
        />
      </div>

      {/* Name + Rolle — Executive */}
      <div className="mt-8">
        <h3
          className="text-[1.9rem] font-light leading-[1.05] tracking-[-0.03em] text-white sm:text-[2.2rem]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          {founder.name}
        </h3>
        <p className="mt-3 text-[14px] leading-[1.5] text-white/55">
          {founder.role}
          <br />
          <span className="font-medium" style={{ color: founder.accent }}>
            {founder.company}
          </span>
        </p>
      </div>

      {/* Verantwortungsbereiche — Premium Expand */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-7 inline-flex items-center gap-2.5 text-[12px] font-medium uppercase tracking-[0.18em] transition-colors duration-300"
        style={{ color: founder.accent }}
      >
        <span>Verantwortungsbereiche</span>
        <motion.svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          animate={{ rotate: open ? 90 : 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <path
            d="M9 6l6 6-6 6"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="resp"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className="mt-5 rounded-2xl p-6 sm:p-7"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
                border: `1px solid rgba(${founder.accentRgb}, 0.18)`,
                boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05), 0 0 40px rgba(${founder.accentRgb}, 0.06)`,
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
              }}
            >
              <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {founder.responsibilities.map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="h-3.5 w-px shrink-0"
                      style={{ background: founder.accent }}
                    />
                    <span
                      className="text-[14.5px] text-white/78"
                      style={{
                        fontFamily: "var(--font-headline), system-ui, sans-serif",
                      }}
                    >
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}

const sharedResponsibilities = [
  "Analyse",
  "Konzeption",
  "Entwicklung",
  "Implementierung",
  "Betreuung",
] as const;

function WhoDoesWhat() {
  const brand = useBrand();
  // Aktive Marke zuerst: AGI Works → Kevin voran, NEXCEL AI → Celina voran.
  const orderedFounders =
    brand.id === "agiworks" ? [founders[1], founders[0]] : [founders[0], founders[1]];

  return (
    <section className="relative px-6 pb-28 md:pb-36">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Headline + Subheadline — zentriert, großzügig */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.h2
            className="text-[clamp(2rem,5vw,3.25rem)] font-light leading-[1.08] tracking-[-0.035em] text-white"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            Die Menschen hinter den{" "}
            <span
              style={{
                background: "var(--brand-headline-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 400,
              }}
            >
              Systemen
            </span>
          </motion.h2>

          <motion.p
            className="mx-auto mt-7 text-[17px] font-light leading-[1.5] text-white/80 sm:text-[19px]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Zwei Unternehmen. Zwei Spezialisierungen. Eine gemeinsame Mission.
          </motion.p>

          <motion.p
            className="mx-auto mt-5 max-w-2xl text-[15px] leading-[1.7] text-white/52 sm:text-[16px]"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            Wir entwickeln Unternehmenssysteme, die Prozesse, Menschen und
            Technologie in einer funktionierenden Struktur zusammenführen.
          </motion.p>
        </div>

        {/* Zwei Founder-Spalten — 50/50 */}
        <div className="mt-20 grid grid-cols-1 gap-12 md:mt-24 md:grid-cols-2 md:gap-10 lg:gap-16">
          {orderedFounders.map((founder, index) => (
            <FounderColumn key={founder.name} founder={founder} index={index} />
          ))}
        </div>

        {/* Gemeinsame Verantwortung */}
        <div className="mx-auto mt-28 max-w-3xl text-center md:mt-36">
          <div
            aria-hidden
            className="mx-auto mb-12 h-px max-w-xs"
            style={{
              background:
                "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
              opacity: 0.5,
            }}
          />

          <motion.h3
            className="text-[clamp(1.6rem,4vw,2.4rem)] font-light leading-[1.1] tracking-[-0.03em] text-white"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            Gemeinsame{" "}
            <span
              style={{
                background: "var(--brand-headline-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                fontWeight: 400,
              }}
            >
              Verantwortung
            </span>
          </motion.h3>

          <motion.p
            className="mx-auto mt-5 max-w-xl text-[15px] leading-[1.7] text-white/55 sm:text-[16px]"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            Dort, wo Strategie und technische Umsetzung zusammenkommen.
          </motion.p>

          {/* Premium Typografie-Blöcke (keine Pills/Chips) */}
          <motion.div
            className="mt-12 flex flex-col items-center gap-y-5 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-10 sm:gap-y-6"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.85, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          >
            {sharedResponsibilities.map((item, i) => (
              <span key={item} className="inline-flex items-center gap-x-10">
                {i > 0 && (
                  <span
                    aria-hidden
                    className="hidden h-4 w-px sm:inline-block"
                    style={{
                      background:
                        "linear-gradient(180deg, transparent, var(--brand-line-dim), transparent)",
                    }}
                  />
                )}
                <span
                  className="text-[15px] tracking-[-0.01em] text-white/75 sm:text-[16px]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {item}
                </span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function WhyTwoCompanies() {
  const [open, setOpen] = useState(false);

  return (
    <section className="relative px-6 py-20 md:py-28">
      <div className="relative z-10 mx-auto max-w-6xl">
        {/* Desktop / Tablet — zweispaltig, editorial */}
        <motion.div
          className="hidden md:grid md:grid-cols-2 md:items-start md:gap-16 lg:gap-24"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <WhyHeading />
          </div>
          <WhyBody />
        </motion.div>

        {/* Mobile — edles Akkordeon zum Aufklappen */}
        <div className="md:hidden">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="flex w-full items-start justify-between gap-4 border-y py-6 text-left"
            style={{ borderColor: "var(--brand-card-border)" }}
          >
            <span className="flex-1">
              <WhyHeading />
            </span>
            <motion.span
              aria-hidden
              className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{
                color: "var(--accent)",
                background: "color-mix(in srgb, var(--accent) 10%, transparent)",
                border: "1px solid color-mix(in srgb, var(--accent) 20%, transparent)",
              }}
              animate={{ rotate: open ? 180 : 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.span>
          </button>

          <AnimatePresence initial={false}>
            {open ? (
              <motion.div
                key="why-body"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="pt-6">
                  <WhyBody />
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

/* ── Gemeinsame Icons für Prozess & Gründe ────────────────────────── */
function LineIcon({
  name,
  size = 22,
}: {
  name: string;
  size?: number;
}) {
  const c = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "search":
      return (
        <svg {...c}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      );
    case "building":
      return (
        <svg {...c}>
          <path d="M4 21V7l6-3v17M10 21h10V11l-6-2" />
          <path d="M14 21V9" />
        </svg>
      );
    case "code":
      return (
        <svg {...c}>
          <path d="M9 8l-4 4 4 4M15 8l4 4-4 4" />
        </svg>
      );
    case "robot":
      return (
        <svg {...c}>
          <rect x="5" y="9" width="14" height="10" rx="2.5" />
          <path d="M12 9V5M9 14h.01M15 14h.01M10 17h4" />
          <circle cx="12" cy="4" r="1" />
        </svg>
      );
    case "chart":
      return (
        <svg {...c}>
          <path d="M4 19h16M7 15l3.2-3.6 2.6 2L18 8" />
          <path d="M15.4 8H18v2.6" />
        </svg>
      );
    case "users":
      return (
        <svg {...c}>
          <path d="M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1" />
          <circle cx="9" cy="7" r="3" />
          <path d="M22 19v-1a4 4 0 0 0-3-3.87M16 4.13A4 4 0 0 1 16 11.5" />
        </svg>
      );
    case "x":
      return (
        <svg {...c}>
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      );
    case "sliders":
      return (
        <svg {...c}>
          <path d="M4 8h8M16 8h4M4 16h4M12 16h8" />
          <circle cx="14" cy="8" r="2.2" />
          <circle cx="10" cy="16" r="2.2" />
        </svg>
      );
    case "lock":
      return (
        <svg {...c}>
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      );
    case "rocket":
      return (
        <svg {...c}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        </svg>
      );
    default:
      return null;
  }
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      className="block text-[11px] font-medium uppercase tracking-[0.32em]"
      style={{ color: "var(--accent)" }}
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.span>
  );
}

/* ── Wie wir zusammenarbeiten — 5-Schritt-Prozess ─────────────────── */
const processSteps = [
  {
    icon: "search",
    title: "Analyse",
    desc: "Wir verstehen Ihr Unternehmen, Ihre Prozesse und Ihre Ziele.",
  },
  {
    icon: "building",
    title: "Architektur",
    desc: "Wir entwickeln die optimale Systemarchitektur für Ihre Anforderungen.",
  },
  {
    icon: "code",
    title: "Entwicklung",
    desc: "Wir setzen individuelle Lösungen technisch hochwertig um.",
  },
  {
    icon: "robot",
    title: "Automatisierung",
    desc: "Wir automatisieren Prozesse und schaffen Effizienz auf allen Ebenen.",
  },
  {
    icon: "chart",
    title: "Betrieb & Optimierung",
    desc: "Wir begleiten Sie langfristig, optimieren und skalieren Ihre Systeme.",
  },
] as const;

function StepNode({
  step,
  index,
}: {
  step: (typeof processSteps)[number];
  index: number;
}) {
  return (
    <motion.div
      className="flex flex-1 flex-col items-center px-3 text-center"
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="relative mb-5 flex h-[68px] w-[68px] items-center justify-center rounded-full"
        style={{
          color: "var(--accent)",
          background: "color-mix(in srgb, var(--accent) 8%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent) 30%, transparent)",
          boxShadow:
            "0 0 30px var(--brand-glow-soft), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <LineIcon name={step.icon} size={24} />
      </div>
      <span
        className="mb-3 text-[11px] font-medium tracking-[0.3em]"
        style={{
          color: "rgba(255,255,255,0.34)",
          fontFamily: "var(--font-headline), system-ui, sans-serif",
        }}
      >
        {String(index + 1).padStart(2, "0")}
      </span>
      <h3
        className="mb-2 text-[15px] font-medium text-white"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        {step.title}
      </h3>
      <p className="max-w-[210px] text-[13px] leading-[1.65] text-white/52">
        {step.desc}
      </p>
    </motion.div>
  );
}

function StepConnector() {
  return (
    <div aria-hidden className="flex flex-1 items-start pt-[28px]">
      <svg
        width="100%"
        height="12"
        viewBox="0 0 80 12"
        preserveAspectRatio="none"
        fill="none"
      >
        <line
          x1="0"
          y1="6"
          x2="70"
          y2="6"
          stroke="var(--brand-line-dim)"
          strokeWidth="1.4"
          strokeDasharray="4 5"
        />
        <path
          d="M67 2l5 4-5 4"
          stroke="var(--brand-line-mid)"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    </div>
  );
}

function HowWeWork() {
  return (
    <section className="relative px-6 pb-24 md:pb-28">
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionEyebrow>Wie wir zusammenarbeiten</SectionEyebrow>

        {/* Desktop — horizontale Prozesskette mit Verbindern */}
        <div className="mt-14 hidden lg:flex lg:items-start">
          {processSteps.map((step, i) => (
            <Fragment key={step.title}>
              <StepNode step={step} index={i} />
              {i < processSteps.length - 1 ? <StepConnector /> : null}
            </Fragment>
          ))}
        </div>

        {/* Tablet / Mobile — Raster */}
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-3 lg:hidden">
          {processSteps.map((step, i) => (
            <StepNode key={step.title} step={step} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Warum Kunden mit uns arbeiten — 6 Gründe ─────────────────────── */
const reasons = [
  {
    icon: "users",
    title: "Direkter Kontakt",
    desc: "Direkter Austausch mit den Gründern.",
  },
  {
    icon: "x",
    title: "Keine Zwischenebenen",
    desc: "Keine Projektmanager. Keine Agenturketten.",
  },
  {
    icon: "sliders",
    title: "Individuelle Lösungen",
    desc: "Keine Templates. Keine Standardpakete.",
  },
  {
    icon: "lock",
    title: "Vertraulich & Sicher",
    desc: "Höchste Standards für Datenschutz und Sicherheit.",
  },
  {
    icon: "rocket",
    title: "Langfristige Partnerschaft",
    desc: "Wir denken mit, wachsen mit und bleiben an Ihrer Seite.",
  },
  {
    icon: "chart",
    title: "Messbare Ergebnisse",
    desc: "Mehr Effizienz, weniger Kosten, mehr Wachstum.",
  },
] as const;

function ReasonCard({
  reason,
  index,
}: {
  reason: (typeof reasons)[number];
  index: number;
}) {
  return (
    <motion.div
      className="group relative overflow-hidden rounded-2xl p-7"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid var(--brand-card-border)",
        boxShadow:
          "0 24px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-8%" }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.6, delay: index * 0.07, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Hover-Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(circle, var(--brand-glow-mid), transparent 70%)",
          filter: "blur(8px)",
        }}
      />

      <span
        className="relative mb-5 flex h-12 w-12 items-center justify-center rounded-xl"
        style={{
          color: "var(--accent)",
          background: "color-mix(in srgb, var(--accent) 9%, transparent)",
          border: "1px solid color-mix(in srgb, var(--accent) 22%, transparent)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        <LineIcon name={reason.icon} size={22} />
      </span>

      <h3
        className="relative mb-2 text-[16px] font-medium text-white"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        {reason.title}
      </h3>
      <p className="relative text-[13.5px] leading-[1.65] text-white/52">
        {reason.desc}
      </p>
    </motion.div>
  );
}

function WhyClients() {
  return (
    <section className="relative px-6 pb-28 md:pb-36">
      <div className="relative z-10 mx-auto max-w-6xl">
        <SectionEyebrow>Warum Kunden mit uns arbeiten</SectionEyebrow>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {reasons.map((reason, i) => (
            <ReasonCard key={reason.title} reason={reason} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function AboutPageContent() {
  return (
    <main className="relative min-h-screen overflow-x-clip">
      <Navigation />

      {/* Hero — Founders (Fullscreen-Background) */}
      <section className="relative flex min-h-screen flex-col justify-center overflow-hidden px-6 pb-14 pt-28 sm:pt-32 md:pb-20">
        {/* Gründerfoto — Fullscreen-Hintergrund über den gesamten Hero */}
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <motion.div
            className="relative h-full w-full"
            initial={{ opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src="/images/team/founders.png"
              alt="Die Gründer von NEXCEL AI und AGI Works"
              fill
              priority
              quality={100}
              sizes="100vw"
              className="object-cover object-[64%_28%] sm:object-[58%_30%] md:object-[center_34%]"
              style={{ transform: "scale(1.2)", transformOrigin: "center top" }}
            />

            {/* 1 — Lesbarkeits-Verlauf links → rechts (Text-Seite abdunkeln) */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg, var(--brand-bg-top) 0%, color-mix(in srgb, var(--brand-bg-top) 82%, transparent) 26%, color-mix(in srgb, var(--brand-bg-top) 40%, transparent) 52%, transparent 78%)",
              }}
            />
            {/* 2 — Vertikaler Verlauf: oben (Nav) + unten (Bridge) einbetten */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(180deg, var(--brand-bg-top) 0%, transparent 20%, transparent 50%, color-mix(in srgb, var(--brand-bg-top) 88%, transparent) 84%, var(--brand-bg-top) 100%)",
              }}
            />
            {/* 3 — Mobile-Scrim: zusätzliche Abdunklung für Textlesbarkeit */}
            <div
              className="absolute inset-0 md:hidden"
              style={{
                background:
                  "linear-gradient(180deg, color-mix(in srgb, var(--brand-bg-top) 55%, transparent) 0%, color-mix(in srgb, var(--brand-bg-top) 78%, transparent) 100%)",
              }}
            />
            {/* 4 — Brand-Tint (edle, markenfarbene Einbettung) */}
            <div
              className="absolute inset-0 mix-blend-soft-light"
              style={{
                background:
                  "radial-gradient(70% 60% at 72% 32%, var(--brand-glow-mid), transparent 70%)",
              }}
            />
            {/* 5 — Vignette */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 100% 80% at 50% 45%, transparent 55%, rgba(0,0,0,0.45) 100%)",
              }}
            />
          </motion.div>
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl">
          <div className="max-w-xl">
            <motion.span
              className="block text-[11px] font-medium uppercase tracking-[0.34em]"
              style={{ color: "var(--accent)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              Über uns
            </motion.span>

            <motion.h1
              className="mt-6 text-[2.7rem] font-light leading-[1.02] tracking-[-0.035em] text-white sm:text-[3.3rem] md:text-[3.7rem] lg:text-[4rem]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                textShadow: "0 2px 40px rgba(0,0,0,0.5)",
              }}
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.75, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              Hinter jedem System
              <br />
              stehen{" "}
              <span
                style={{
                  background: "var(--brand-headline-gradient)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 400,
                  filter: "drop-shadow(0 0 28px var(--brand-glow-strong))",
                }}
              >
                Menschen.
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 max-w-md text-[15.5px] leading-[1.7] text-white/72 sm:text-[16.5px]"
              style={{ textShadow: "0 1px 24px rgba(0,0,0,0.55)" }}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              NEXCEL AI gestaltet das System — Prozesse, Strukturen und
              Customer Experience. AGI Works baut es — Architektur,
              Infrastruktur und Software.
            </motion.p>

            <HeroStats />
          </div>

          <BrandBridge />
        </div>
      </section>

      {/* Warum zwei Unternehmen? */}
      <WhyTwoCompanies />

      {/* Wer macht was? */}
      <WhoDoesWhat />

      {/* Wie wir zusammenarbeiten */}
      <HowWeWork />

      {/* Warum Kunden mit uns arbeiten */}
      <WhyClients />

      <Footer />
    </main>
  );
}
