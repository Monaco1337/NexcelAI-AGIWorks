"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import SystemAnalyzer from "./SystemAnalyzer";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.14, delayChildren: 0.25 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 1.1, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HeroLuxury() {
  const brand = useBrand();
  const heroRef = useRef<HTMLElement>(null);

  const useStackedHeadline =
    !!brand.hero.headlineLead && !!brand.hero.headlineStack;
  const accentRgb = brand.theme.accentRgb;

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
      aria-label="Hero Section"
      style={{
        background:
          "radial-gradient(ellipse 90% 70% at 50% 0%, #0a0a14 0%, #050509 60%, #020205 100%)",
      }}
    >
      {/* ───────────────────────────────────────────────────────────
          ENTERPRISE CINEMATIC BACKGROUND
          (no video, layered: aurora · grid · volumetric · vignette)
          ─────────────────────────────────────────────────────────── */}

      {/* Layer 1 — Animated aurora mesh (slow drift) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        animate={{
          backgroundPosition: ["0% 0%", "100% 50%", "0% 100%", "0% 0%"],
        }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        style={{
          background: `
            radial-gradient(60% 50% at 18% 28%, rgba(${accentRgb},0.22) 0%, transparent 60%),
            radial-gradient(45% 40% at 82% 18%, rgba(56,189,248,0.10) 0%, transparent 65%),
            radial-gradient(55% 50% at 75% 78%, rgba(${accentRgb},0.14) 0%, transparent 70%),
            radial-gradient(40% 35% at 25% 85%, rgba(16,185,129,0.06) 0%, transparent 70%)
          `,
          backgroundSize: "200% 200%",
          filter: "blur(2px)",
        }}
      />

      {/* Layer 2 — Subtle grid (enterprise infrastructure feel) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 45%, #000 30%, transparent 80%)",
        }}
      />

      {/* Layer 3 — Volumetric light (top-down beam) */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background: `
            conic-gradient(from 215deg at 30% -10%,
              transparent 0deg,
              rgba(${accentRgb},0.10) 25deg,
              rgba(${accentRgb},0.05) 45deg,
              transparent 90deg)
          `,
          filter: "blur(40px)",
          opacity: 0.9,
        }}
      />

      {/* Layer 4 — Animated horizon glow (slow pulse) */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[60%]"
        animate={{ opacity: [0.55, 0.85, 0.55] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          background: `radial-gradient(ellipse 80% 100% at 50% 100%, rgba(${accentRgb},0.18) 0%, rgba(${accentRgb},0.06) 35%, transparent 70%)`,
          filter: "blur(20px)",
        }}
      />

      {/* Layer 5 — Edge vignette */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(ellipse 100% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Layer 6 — Subtle film grain */}
      <div
        aria-hidden
        className="hero-noise pointer-events-none absolute inset-0 z-[2]"
        style={{ opacity: 0.04, mixBlendMode: "overlay" }}
      />

      {/* Layer 7 — Floating data particles (enterprise live feel) */}
      <DataParticles accentRgb={accentRgb} />

      {/* ───────────────────────────────────────────────────────────
          CONTENT
          ─────────────────────────────────────────────────────────── */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-1 flex-col items-stretch gap-14 px-6 pb-24 pt-32 sm:px-10 lg:gap-20 lg:px-16 lg:pb-32 lg:pt-36">
        {/* ── Hero copy — extreme hierarchy ── */}
        <div className="max-w-[1100px] overflow-visible">
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="show"
            className="overflow-visible"
          >
            {useStackedHeadline ? (
              <motion.h1
                variants={fadeUp}
                className="overflow-visible"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  textRendering: "optimizeLegibility",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                <span className="hero-headline-lead--dark">
                  {brand.hero.headlineLead}
                </span>

                {brand.hero.headlineLeadSuffix && (
                  <>
                    <span
                      aria-hidden
                      className="hero-headline-sep hero-headline-sep--dark"
                    />
                    <span className="hero-headline-suffix--dark">
                      {brand.hero.headlineLeadSuffix}
                    </span>
                  </>
                )}
              </motion.h1>
            ) : (
              <motion.h1
                variants={fadeUp}
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  fontWeight: 300,
                  lineHeight: 1.04,
                  letterSpacing: "-0.04em",
                  fontSize: "clamp(2.6rem, 6vw, 5rem)",
                  color: "#F5F5F8",
                }}
              >
                {brand.hero.headline1}
                <br />
                <span style={{ color: "rgba(245,245,248,0.45)" }}>
                  {brand.hero.headline2}
                </span>
              </motion.h1>
            )}
          </motion.div>
        </div>

        {/* ── ANALYSIS CONSOLE ── */}
        <motion.div
          initial={{ opacity: 0, y: 36 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 1.1,
            ease: [0.22, 1, 0.36, 1],
            delay: 0.55,
          }}
          className="relative w-full"
        >
          <SystemAnalyzer accentRgb={accentRgb} isDark={true} />
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Floating data particles (subtle enterprise motion) ───────────── */
function DataParticles({ accentRgb }: { accentRgb: string }) {
  // Deterministic positions to avoid SSR/CSR mismatch
  const particles = [
    { left: "12%", top: "22%", size: 3, delay: 0 },
    { left: "88%", top: "18%", size: 2, delay: 1.4 },
    { left: "65%", top: "62%", size: 2.5, delay: 2.6 },
    { left: "22%", top: "75%", size: 2, delay: 0.8 },
    { left: "78%", top: "82%", size: 3, delay: 3.2 },
    { left: "48%", top: "28%", size: 2, delay: 2.0 },
    { left: "8%", top: "55%", size: 2.5, delay: 1.0 },
    { left: "92%", top: "48%", size: 2, delay: 3.6 },
  ];
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
    >
      {particles.map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            background: `rgb(${accentRgb})`,
            boxShadow: `0 0 ${p.size * 4}px rgba(${accentRgb},0.85)`,
          }}
          animate={{
            opacity: [0, 0.9, 0],
            y: [0, -40, -80],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeOut",
            delay: p.delay,
          }}
        />
      ))}
    </div>
  );
}
