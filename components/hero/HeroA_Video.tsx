"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import SystemMap from "./SystemMap";
import { proofChips } from "./heroData";

// Proof chip icons
const ChipIcon = ({ type }: { type: string }) => {
  const paths: Record<string, string> = {
    shield: "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
    server: "M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z",
    eye: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z",
    bolt: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    sparkles: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
  };
  return (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type] || paths.sparkles} />
    </svg>
  );
};

export default function HeroA_Video() {
  const { theme } = useTheme();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);

  const isDark = theme === "dark";

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (videoRef.current && !prefersReducedMotion) {
      videoRef.current.playbackRate = 0.7;
    }
  }, [prefersReducedMotion, videoLoaded]);

  // If video fails or reduced motion, show mesh fallback
  const showMeshFallback = prefersReducedMotion || videoError;

  return (
    <section
      className="relative min-h-[82vh] flex items-center overflow-hidden"
      aria-label="Hero Section"
    >
      {/* ═══════════════════════════════════════════════════════════════
          BACKGROUND: Video or Mesh Fallback
      ═══════════════════════════════════════════════════════════════ */}
      {!showMeshFallback ? (
        <>
          {/* Video element */}
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
            autoPlay
            muted
            loop
            playsInline
            onLoadedData={() => setVideoLoaded(true)}
            onError={() => setVideoError(true)}
            poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Cdefs%3E%3ClinearGradient id='g' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' stop-color='%23050508'/%3E%3Cstop offset='50%25' stop-color='%230a0a10'/%3E%3Cstop offset='100%25' stop-color='%23080810'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill='url(%23g)' width='1920' height='1080'/%3E%3C/svg%3E"
            style={{ opacity: videoLoaded ? 0.7 : 0, transition: "opacity 1.5s ease" }}
          >
            <source src="/videos/hero-ambient.mp4" type="video/mp4" />
            <source src="/videos/hero-ambient.webm" type="video/webm" />
          </video>

          {/* Gradient fallback while video loads */}
          {!videoLoaded && (
            <div
              className="absolute inset-0"
              style={{
                background: isDark
                  ? "linear-gradient(160deg, #05050a 0%, #0a0a10 50%, #08080e 100%)"
                  : "linear-gradient(160deg, #fefefe 0%, #f8f9fc 50%, #fafbfd 100%)",
              }}
            />
          )}
        </>
      ) : (
        /* Mesh fallback for reduced motion or video error */
        <MeshBackground isDark={isDark} />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          PREMIUM OVERLAY LAYERS (on top of video/mesh)
      ═══════════════════════════════════════════════════════════════ */}
      
      {/* Layer 1: Dark gradient overlay for contrast */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.65) 40%, rgba(0,0,0,0.6) 100%)"
            : "linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.85) 40%, rgba(255,255,255,0.8) 100%)",
        }}
      />

      {/* Layer 2: Aurora mesh overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse 100% 80% at 15% 10%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 80% 100% at 85% 90%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 50% 50%, rgba(168, 85, 247, 0.08) 0%, transparent 55%)
            `
            : `
              radial-gradient(ellipse 100% 80% at 15% 10%, rgba(139, 92, 246, 0.08) 0%, transparent 50%),
              radial-gradient(ellipse 80% 100% at 85% 90%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 50% 50%, rgba(168, 85, 247, 0.03) 0%, transparent 55%)
            `,
          filter: "blur(40px)",
        }}
      />

      {/* Layer 3: Spotlight behind headline */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 50% 40% at 25% 45%, rgba(168, 85, 247, 0.1) 0%, transparent 60%)"
            : "radial-gradient(ellipse 50% 40% at 25% 45%, rgba(168, 85, 247, 0.05) 0%, transparent 60%)",
        }}
      />

      {/* Layer 4: Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isDark
            ? `
              linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.45) 100%),
              radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.5) 100%)
            `
            : `
              linear-gradient(to bottom, rgba(0,0,0,0.02) 0%, transparent 15%, transparent 85%, rgba(0,0,0,0.03) 100%),
              radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.05) 100%)
            `,
        }}
      />

      {/* Layer 5: Noise texture */}
      <div
        className="absolute inset-0 hero-noise pointer-events-none"
        style={{ 
          opacity: isDark ? 0.05 : 0.03,
          mixBlendMode: "overlay",
        }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          CONTENT
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column: Text Content */}
          <div className="text-center lg:text-left space-y-6">
            {/* Proof Chips */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center lg:justify-start" role="list" aria-label="Features">
              {proofChips.map((chip) => (
                <span
                  key={chip.label}
                  className={`
                    inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full 
                    text-[10px] sm:text-[11px] font-medium tracking-wide
                    transition-all duration-200 cursor-default
                    ${isDark
                      ? "bg-white/[0.04] text-white/60 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/80 hover:border-white/[0.12]"
                      : "bg-black/[0.03] text-gray-500 border border-black/[0.05] hover:bg-black/[0.06] hover:text-gray-700 hover:border-black/[0.10]"
                    }
                  `}
                  role="listitem"
                >
                  <ChipIcon type={chip.icon} />
                  {chip.label}
                </span>
              ))}
            </div>

            {/* Headline with glow */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-[3.5rem] font-bold tracking-tight leading-[1.08]">
              <span className={isDark ? "text-white" : "text-gray-900"}>
                Digitale Systeme,
              </span>
              <br />
              <span className="relative inline-block">
                <span
                  className="relative z-10 bg-clip-text text-transparent"
                  style={{
                    backgroundImage: "linear-gradient(135deg, #A855F7 0%, #7C3AED 40%, #6366F1 100%)",
                    filter: isDark ? "drop-shadow(0 0 20px rgba(168, 85, 247, 0.4))" : "none",
                  }}
                >
                  die Prozesse übernehmen.
                </span>
                {/* Laser line accent */}
                <span
                  className="absolute -bottom-1 left-0 h-[2px] w-full rounded-full"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, #A855F7 20%, #6366F1 80%, transparent 100%)",
                    opacity: isDark ? 0.6 : 0.4,
                  }}
                />
              </span>
            </h1>

            {/* Subline */}
            <p
              className={`text-base sm:text-lg lg:text-xl max-w-xl mx-auto lg:mx-0 leading-relaxed ${
                isDark ? "text-white/65" : "text-gray-600"
              }`}
            >
              Von Webplattformen bis zu autonomen KI-Workflows – individuell, skalierbar und zukunftssicher.
            </p>

            {/* CTA Buttons - Premium tactile */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start pt-3">
              {/* Primary CTA */}
              <Link
                href="/kontakt"
                className={`
                  group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl 
                  text-sm font-semibold overflow-hidden
                  transition-all duration-300 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2
                  ${isDark ? "focus-visible:ring-offset-black" : "focus-visible:ring-offset-white"}
                `}
                style={{
                  background: "linear-gradient(135deg, #9333EA 0%, #7C3AED 50%, #6366F1 100%)",
                  boxShadow: isDark 
                    ? "0 4px 20px rgba(139, 92, 246, 0.35), inset 0 1px 0 rgba(255,255,255,0.15)"
                    : "0 4px 20px rgba(139, 92, 246, 0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
                }}
              >
                <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                <span 
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                  style={{ background: "linear-gradient(135deg, #A855F7 0%, #8B5CF6 50%, #7C3AED 100%)" }}
                />
                <span className="absolute inset-0 opacity-0 group-active:opacity-100 bg-black/10 transition-opacity duration-100" />
                <span className="relative z-10 text-white flex items-center gap-2">
                  Kontakt aufnehmen
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              {/* Secondary CTA */}
              <Link
                href="/projekte"
                className={`
                  group relative inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl 
                  text-sm font-semibold overflow-hidden
                  transition-all duration-300 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2
                  ${isDark ? "focus-visible:ring-offset-black" : "focus-visible:ring-offset-white"}
                  ${isDark
                    ? "bg-white/[0.06] text-white border border-white/[0.10]"
                    : "bg-black/[0.03] text-gray-900 border border-black/[0.08]"
                  }
                `}
                style={{
                  boxShadow: isDark 
                    ? "inset 0 1px 0 rgba(255,255,255,0.06)"
                    : "inset 0 1px 0 rgba(255,255,255,0.8)",
                }}
              >
                <span 
                  className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                    isDark ? "bg-white/[0.04]" : "bg-black/[0.02]"
                  }`}
                />
                {isDark && (
                  <span 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
                    style={{ boxShadow: "0 0 20px rgba(139, 92, 246, 0.15)" }}
                  />
                )}
                <span className="relative z-10">Projekte entdecken</span>
              </Link>
            </div>
          </div>

          {/* Right Column: System Map */}
          <div className="flex justify-center lg:justify-end">
            <SystemMap />
          </div>
        </div>
      </div>
    </section>
  );
}

// Mesh background fallback component
function MeshBackground({ isDark }: { isDark: boolean }) {
  return (
    <div className="absolute inset-0">
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(160deg, #05050a 0%, #0a0a10 30%, #0d0d14 60%, #08080e 100%)"
            : "linear-gradient(160deg, #fefefe 0%, #f8f9fc 30%, #f4f5f9 60%, #fafbfd 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? `
              radial-gradient(ellipse 100% 80% at 15% 10%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 80% 100% at 85% 90%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 55%)
            `
            : `
              radial-gradient(ellipse 100% 80% at 15% 10%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
              radial-gradient(ellipse 80% 100% at 85% 90%, rgba(59, 130, 246, 0.06) 0%, transparent 50%),
              radial-gradient(ellipse 60% 60% at 50% 50%, rgba(168, 85, 247, 0.04) 0%, transparent 55%)
            `,
          filter: "blur(60px)",
        }}
      />
      <div
        className="absolute inset-0 hero-noise"
        style={{ opacity: isDark ? 0.04 : 0.02 }}
      />
    </div>
  );
}
