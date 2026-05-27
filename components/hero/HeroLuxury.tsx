"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";

const HeroVideoBackground = dynamic(() => import("./HeroVideoBackground"), {
  ssr: false,
});

const SystemGallery = dynamic(() => import("./SystemGallery"), { ssr: false });

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.18, delayChildren: 0.35 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] },
  },
};

export default function HeroLuxury() {
  const { theme } = useTheme();
  const brand = useBrand();
  const [mounted, setMounted] = useState(false);
  const isDark = theme === "dark";
  const heroRef = useRef<HTMLElement>(null);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const handler = () => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        if (rect.bottom > 0) setScrollY(window.scrollY);
      }
    };
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  const primaryHref = resolveBrandNavHref(
    brand.hero.ctaPrimary.href,
    brand.id,
  );
  const secondaryHref = resolveBrandNavHref(
    brand.hero.ctaSecondary.href,
    brand.id,
  );

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
      aria-label="Hero Section"
    >
      {/* ── Background ───────────────────────────────────────────── */}

      {/* Dark: Fullscreen video with parallax */}
      {isDark && mounted ? (
        <div
          className="absolute inset-x-0 -top-[10vh] -bottom-[10vh]"
          style={{
            transform: `translate3d(0, ${scrollY * -0.18}px, 0)`,
            willChange: "transform",
          }}
        >
          <HeroVideoBackground
            brandAccentRgb={brand.theme.accentRgb}
            brandId={brand.id}
          />
        </div>
      ) : isDark && !mounted ? (
        <div
          className="pointer-events-none absolute inset-0 z-0 bg-[#030308]"
          aria-hidden
        />
      ) : null}

      {/* Light: Clean gradient */}
      {!isDark ? (
        <div className="pointer-events-none absolute inset-0 z-0" aria-hidden>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(165deg, #fefefe 0%, #fafbfc 42%, #f7f8fa 100%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 60% 45% at 70% 30%, color-mix(in srgb, var(--brand-primary) 6%, transparent) 0%, transparent 60%)",
            }}
          />
          <div
            className="hero-noise absolute inset-0"
            style={{ opacity: 0.014, mixBlendMode: "multiply" }}
          />
        </div>
      ) : null}

      {/* ── Content ──────────────────────────────────────────────── */}

      <div
        className={`relative z-10 mx-auto flex w-full max-w-7xl flex-1 px-6 sm:px-8 lg:px-12 ${
          isDark
            ? "flex-col justify-center pb-20 pt-32 lg:pb-28 lg:pt-36"
            : "flex-col justify-center pb-16 pt-28 lg:pb-24 lg:pt-32"
        }`}
      >
        <div
          className={
            isDark
              ? "grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10"
              : "grid grid-cols-1 items-center gap-14 sm:grid-cols-12 sm:gap-12 lg:gap-10 xl:gap-14"
          }
        >
          {/* Right column: Light → SystemGallery, Dark → empty (video fills bg) */}
          {!isDark ? (
            <div className="order-1 hidden sm:order-2 sm:col-span-7 sm:flex sm:justify-end">
              <div className="relative h-[380px] w-full max-w-[640px] lg:h-[440px] lg:translate-x-6 xl:translate-x-12">
                {mounted ? <SystemGallery /> : null}
              </div>
            </div>
          ) : (
            <div
              className="order-1 hidden lg:order-2 lg:col-span-6 lg:block"
              aria-hidden
            />
          )}

          {/* Left column: Content */}
          <div
            className={
              isDark
                ? "order-2 max-w-2xl text-center lg:order-1 lg:col-span-6 lg:text-left max-lg:pt-4"
                : "order-2 text-center sm:order-1 sm:col-span-5 sm:text-left"
            }
          >
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
            >
              {/* Meta tags */}
              <motion.p
                variants={fadeUp}
                className={`mb-10 uppercase tracking-[0.2em] ${
                  isDark ? "text-white/22" : "text-gray-400/70"
                }`}
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  fontSize: "10px",
                  fontWeight: 500,
                }}
              >
                {brand.hero.metaTags.map((tag, i) => (
                  <span key={tag}>
                    {i > 0 && (
                      <span
                        className={`mx-2 ${
                          isDark ? "text-white/10" : "text-gray-300/50"
                        }`}
                      >
                        ·
                      </span>
                    )}
                    {tag}
                  </span>
                ))}
              </motion.p>

              {/* Headline */}
              <motion.h1
                variants={fadeUp}
                className="mb-8"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  fontWeight: 500,
                  lineHeight: 1.14,
                  letterSpacing: "-0.025em",
                  fontSize: "clamp(1.55rem, 3.8vw, 2.65rem)",
                  textRendering: "optimizeLegibility",
                  WebkitFontSmoothing: "antialiased",
                }}
              >
                <span className={isDark ? "text-[#F0F0F4]" : "text-gray-900"}>
                  {brand.hero.headline1}
                </span>
                <br />
                <span
                  className={isDark ? "text-[#F0F0F4]/68" : "text-gray-600"}
                  style={{ display: "inline-block", marginTop: "0.14em" }}
                >
                  {brand.hero.headline2}
                </span>
              </motion.h1>

              {/* Subline */}
              <motion.p
                variants={fadeUp}
                className={`mx-auto mb-14 max-w-[480px] text-[0.92rem] leading-relaxed tracking-wide lg:mx-0 ${
                  isDark ? "text-white/32" : "text-gray-500/80"
                }`}
                style={{
                  fontFamily: "var(--font-body), system-ui, sans-serif",
                }}
              >
                {brand.hero.subline}
              </motion.p>

              {/* CTA buttons — glassmorphism */}
              <motion.div
                variants={fadeUp}
                className="flex w-full flex-col gap-4 sm:flex-row sm:justify-center lg:justify-start"
              >
                {/* Primary */}
                <Link
                  href={primaryHref}
                  className="group inline-flex w-full items-center justify-center gap-2.5 rounded-2xl px-7 py-4 text-[13.5px] font-medium text-white/95 transition-all duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-[#08080d] sm:w-auto sm:min-w-[220px]"
                  style={{
                    fontFamily:
                      "var(--font-headline), system-ui, sans-serif",
                    background: isDark
                      ? `linear-gradient(135deg, rgba(${brand.theme.accentRgb},0.32), rgba(${brand.theme.accentRgb},0.58))`
                      : "var(--brand-gradient)",
                    backdropFilter: isDark ? "blur(24px)" : undefined,
                    WebkitBackdropFilter: isDark ? "blur(24px)" : undefined,
                    border: isDark
                      ? `1px solid rgba(${brand.theme.accentRgb},0.28)`
                      : undefined,
                    boxShadow: isDark
                      ? `0 6px 32px rgba(${brand.theme.accentRgb},0.22), inset 0 1px 0 rgba(255,255,255,0.1)`
                      : `0 2px 16px color-mix(in srgb, var(--brand-glow) 70%, transparent), inset 0 1px 0 rgba(255,255,255,0.12)`,
                  }}
                >
                  <span>{brand.hero.ctaPrimary.text}</span>
                  <span className="text-[11px] text-white/45 transition-colors group-hover:text-white/80">
                    →
                  </span>
                </Link>

                {/* Secondary — ghost glassmorphism */}
                <Link
                  href={secondaryHref}
                  className={`inline-flex w-full items-center justify-center rounded-2xl px-7 py-4 text-[13.5px] font-medium transition-all duration-300 hover:scale-[1.02] focus:outline-none focus-visible:ring-2 sm:w-auto sm:min-w-[220px] ${
                    isDark
                      ? "text-white/60 hover:text-white/88"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  style={{
                    fontFamily:
                      "var(--font-headline), system-ui, sans-serif",
                    letterSpacing: "0.015em",
                    background: isDark
                      ? "rgba(255,255,255,0.04)"
                      : "rgba(0,0,0,0.03)",
                    backdropFilter: "blur(20px)",
                    WebkitBackdropFilter: "blur(20px)",
                    border: isDark
                      ? "1px solid rgba(255,255,255,0.1)"
                      : "1px solid rgba(0,0,0,0.08)",
                    boxShadow: isDark
                      ? `0 2px 20px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.05)`
                      : "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {brand.hero.ctaSecondary.text}
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
