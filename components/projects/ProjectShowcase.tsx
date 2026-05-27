"use client";

import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { projectNodes, type ProjectNode } from "@/components/hero/heroData";

// Short descriptors for editorial feel (≤ 8 words each)
const projectDescriptors: Record<string, string> = {
  "core-platform": "Foundation for scalable digital systems",
  "chronex-ai": "Intelligent scheduling, real-time coordination",
  "immostripe-ai": "Automated valuation and market analysis",
  "cannaflow-ai": "Compliance automation, full traceability",
  "nextseller-crm": "AI-powered sales intelligence",
  "automation-hub": "Central workflow orchestration",
};

// Monochrome icons - subtle, editorial
const ProjectIcon = ({ type, className }: { type: ProjectNode["icon"]; className?: string }) => {
  const paths: Record<ProjectNode["icon"], string> = {
    platform: "M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25m11.142 0l-5.571 3-5.571-3",
    ai: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
    analytics: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    automation: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    crm: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    flow: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  };
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.25}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type] || paths.platform} />
    </svg>
  );
};

export default function ProjectShowcase() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <section
      className="relative"
      aria-label="Projekt-Showcase"
    >
      {/* Soft fade transition from hero */}
      <div
        className="absolute inset-x-0 top-0 h-32 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(180deg, #07070b 0%, transparent 100%)"
            : "linear-gradient(180deg, #fcfcfd 0%, transparent 100%)",
        }}
      />

      {/* Background - continues hero mood, slightly more matte */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(180deg, #07070b 0%, #09090d 50%, #0a0a0e 100%)"
            : "linear-gradient(180deg, #fcfcfd 0%, #fafafa 50%, #f8f8f8 100%)",
        }}
      />

      {/* Subtle grain - more matte than hero */}
      <div
        className="absolute inset-0 pointer-events-none hero-noise"
        style={{ opacity: isDark ? 0.025 : 0.015, mixBlendMode: "overlay" }}
      />

      {/* Content */}
      <div className="relative z-10 pt-8 pb-20">
        {/* Section label - whisper quiet */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mb-10">
          <p
            className={`text-[10px] font-medium tracking-[0.25em] uppercase ${
              isDark ? "text-white/20" : "text-gray-400/60"
            }`}
          >
            Ausgewählte Projekte
          </p>
        </div>

        {/* Scrollable rail */}
        <div
          className="relative overflow-x-auto scrollbar-hide"
          style={{
            /* Hide scrollbar but keep functionality */
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          <div className="flex gap-4 sm:gap-6 px-6 sm:px-8 lg:px-12 pb-4">
            {/* Left spacer for centering on large screens */}
            <div className="hidden xl:block flex-shrink-0 w-[calc((100vw-1280px)/2-48px)]" />

            {projectNodes.map((project) => (
              <Link
                key={project.id}
                href={project.href}
                className={`
                  group relative flex-shrink-0 w-[280px] sm:w-[320px] p-6 sm:p-7 rounded-2xl
                  transition-all duration-300 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/30 focus-visible:ring-offset-2
                  ${isDark ? "focus-visible:ring-offset-[#09090d]" : "focus-visible:ring-offset-[#fafafa]"}
                `}
                style={{
                  background: isDark
                    ? "rgba(255, 255, 255, 0.02)"
                    : "rgba(0, 0, 0, 0.015)",
                  border: isDark
                    ? "1px solid rgba(255, 255, 255, 0.04)"
                    : "1px solid rgba(0, 0, 0, 0.04)",
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(-2px)";
                  el.style.background = isDark
                    ? "rgba(255, 255, 255, 0.035)"
                    : "rgba(0, 0, 0, 0.025)";
                  el.style.borderColor = isDark
                    ? "rgba(255, 255, 255, 0.06)"
                    : "rgba(0, 0, 0, 0.06)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = "translateY(0)";
                  el.style.background = isDark
                    ? "rgba(255, 255, 255, 0.02)"
                    : "rgba(0, 0, 0, 0.015)";
                  el.style.borderColor = isDark
                    ? "rgba(255, 255, 255, 0.04)"
                    : "rgba(0, 0, 0, 0.04)";
                }}
              >
                {/* Icon - monochrome, subtle */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center mb-5 transition-colors duration-300 ${
                    isDark
                      ? "bg-white/[0.04] group-hover:bg-white/[0.06]"
                      : "bg-black/[0.03] group-hover:bg-black/[0.05]"
                  }`}
                >
                  <ProjectIcon
                    type={project.icon}
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isDark
                        ? "text-white/40 group-hover:text-white/60"
                        : "text-gray-400 group-hover:text-gray-600"
                    }`}
                  />
                </div>

                {/* Project name */}
                <h3
                  className={`text-[15px] sm:text-base font-medium mb-2 transition-colors duration-300 ${
                    isDark
                      ? "text-white/80 group-hover:text-white"
                      : "text-gray-800 group-hover:text-gray-900"
                  }`}
                >
                  {project.title}
                </h3>

                {/* Short descriptor */}
                <p
                  className={`text-[13px] leading-relaxed transition-colors duration-300 ${
                    isDark
                      ? "text-white/35 group-hover:text-white/50"
                      : "text-gray-400 group-hover:text-gray-500"
                  }`}
                >
                  {projectDescriptors[project.id] || project.subtitle}
                </p>

                {/* Subtle arrow indicator on hover */}
                <div
                  className={`absolute bottom-6 right-6 transition-all duration-300 ${
                    isDark ? "text-white/0 group-hover:text-white/30" : "text-gray-900/0 group-hover:text-gray-400"
                  }`}
                  style={{
                    transform: "translateX(-4px)",
                  }}
                >
                  <svg
                    className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}

            {/* Right spacer */}
            <div className="flex-shrink-0 w-6 sm:w-8 lg:w-12" />
          </div>
        </div>

        {/* View all link - understated */}
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 mt-10">
          <Link
            href="/projekte"
            className={`
              inline-flex items-center gap-2 text-[13px] font-medium
              transition-colors duration-200
              focus:outline-none focus-visible:underline
              ${isDark
                ? "text-white/25 hover:text-white/50"
                : "text-gray-400/70 hover:text-gray-500"
              }
            `}
          >
            <span>Alle Projekte ansehen</span>
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div
        className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{
          background: isDark
            ? "linear-gradient(0deg, rgba(10,10,14,1) 0%, transparent 100%)"
            : "linear-gradient(0deg, rgba(248,248,248,1) 0%, transparent 100%)",
        }}
      />

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
