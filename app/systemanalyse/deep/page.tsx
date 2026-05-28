"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/contexts/ThemeContext";
import { useBrand } from "@/contexts/BrandContext";
import Footer from "@/components/Footer";
import { SectionErrorBoundary } from "@/components/ErrorBoundaries";

const SystemAnalyseEngine = dynamic(
  () => import("@/components/sections/SystemAnalyseEngine"),
  { ssr: false, loading: () => <div className="h-64" /> }
);

export default function DeepAnalysePage() {
  const { theme } = useTheme();
  const brand = useBrand();
  const accentRgb = brand.theme.accentRgb;

  return (
    <main
      className="ds-app relative min-h-screen overflow-x-hidden"
      style={{
        background: "transparent",
        color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
      }}
    >
      {/* ────────────────────────────────────────────────
           TOP RETURN BAR — High-end glass strip
            • Sitzt sicher unter der Floating-Navigation
            • Eigene Brand-Hairline-Konstruktion
         ──────────────────────────────────────────────── */}
      <div className="relative z-20 pt-[140px] sm:pt-[156px] lg:pt-[172px] pb-10 sm:pb-12 lg:pb-14">
        <div className="mx-auto max-w-[920px] px-6 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-between gap-4 rounded-2xl px-5 py-3 sm:px-6"
            style={{
              background:
                "linear-gradient(135deg, rgba(20,20,32,0.55) 0%, rgba(12,12,22,0.35) 100%)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.06)",
              boxShadow:
                "0 14px 40px rgba(0,0,0,0.32), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}
          >
            {/* Top hairline */}
            <span
              aria-hidden
              className="absolute inset-x-6 top-0 h-px"
              style={{
                background: `linear-gradient(90deg, transparent, rgba(${accentRgb},0.55), transparent)`,
              }}
            />

            {/* Back link */}
            <Link
              href="/"
              className="group inline-flex items-center gap-2.5 text-[11px] uppercase tracking-[0.22em] text-white/55 hover:text-white transition-colors"
              style={{
                fontFamily:
                  "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                fontWeight: 600,
              }}
            >
              <span
                className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-all"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = `rgba(${accentRgb},0.18)`;
                  e.currentTarget.style.borderColor = `rgba(${accentRgb},0.45)`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                }}
              >
                <svg
                  width="11"
                  height="11"
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-transform group-hover:-translate-x-0.5"
                >
                  <path d="M7.5 2.5 4 6l3.5 3.5" />
                </svg>
              </span>
              <span className="hidden sm:inline">Zurück zur Startseite</span>
              <span className="sm:hidden">Zurück</span>
            </Link>

            {/* Live badge */}
            <div
              className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.24em]"
              style={{
                fontFamily:
                  "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
                fontWeight: 600,
                color: `rgb(${accentRgb})`,
              }}
            >
              <span className="relative inline-flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full rounded-full opacity-70 animate-ping"
                  style={{ background: `rgb(${accentRgb})` }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{
                    background: `rgb(${accentRgb})`,
                    boxShadow: `0 0 10px rgba(${accentRgb},0.85)`,
                  }}
                />
              </span>
              <span className="hidden sm:inline">Deep Analysis · Live</span>
              <span className="sm:hidden">Live</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ─── Engine als Sub-Page-Variante ─── */}
      <SectionErrorBoundary sectionName="Tiefere Systemanalyse">
        <SystemAnalyseEngine variant="subpage" />
      </SectionErrorBoundary>

      <Footer />
    </main>
  );
}
