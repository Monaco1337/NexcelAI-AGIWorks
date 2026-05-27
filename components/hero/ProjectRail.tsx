"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { projectNodes, type ProjectNode } from "./heroData";

// Minimal icon for each project
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
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type] || paths.platform} />
    </svg>
  );
};

interface TooltipPosition {
  x: number;
  y: number;
}

export default function ProjectRail() {
  const { theme } = useTheme();
  const [activeProject, setActiveProject] = useState<ProjectNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ x: 0, y: 0 });
  const railRef = useRef<HTMLDivElement>(null);

  const isDark = theme === "dark";

  const handleMouseEnter = (project: ProjectNode, e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const railRect = railRef.current?.getBoundingClientRect();
    if (railRect) {
      setTooltipPos({
        x: rect.left - railRect.left + rect.width / 2,
        y: rect.top - railRect.top,
      });
    }
    setActiveProject(project);
  };

  const handleMouseLeave = () => {
    setActiveProject(null);
  };

  return (
    <section
      className={`relative py-12 sm:py-16 ${isDark ? "bg-black/20" : "bg-gray-50/50"}`}
      aria-label="Projekt-Übersicht"
    >
      {/* Subtle top border */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: isDark
            ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)"
            : "linear-gradient(90deg, transparent, rgba(0,0,0,0.04), transparent)",
        }}
      />

      <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12">
        {/* Section Label */}
        <p
          className={`text-[11px] font-medium tracking-[0.2em] uppercase mb-8 text-center ${
            isDark ? "text-white/30" : "text-gray-400"
          }`}
        >
          Aktuelle Projekte
        </p>

        {/* Project Rail */}
        <div className="relative" ref={railRef}>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            {projectNodes.map((project) => (
              <Link
                key={project.id}
                href={project.href}
                onMouseEnter={(e) => handleMouseEnter(project, e)}
                onMouseLeave={handleMouseLeave}
                onFocus={(e) => handleMouseEnter(project, e as unknown as React.MouseEvent<HTMLAnchorElement>)}
                onBlur={handleMouseLeave}
                className={`
                  group relative inline-flex items-center gap-2 px-4 py-2.5 rounded-full
                  transition-all duration-200 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-2
                  ${isDark ? "focus-visible:ring-offset-black" : "focus-visible:ring-offset-white"}
                  ${activeProject?.id === project.id
                    ? isDark
                      ? "bg-white/[0.08] border-white/[0.15]"
                      : "bg-black/[0.05] border-black/[0.10]"
                    : isDark
                      ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10]"
                      : "bg-black/[0.02] border-black/[0.04] hover:bg-black/[0.04] hover:border-black/[0.06]"
                  }
                `}
                style={{
                  border: "1px solid",
                  borderColor: activeProject?.id === project.id
                    ? isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.10)"
                    : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                }}
              >
                {/* Icon */}
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors duration-200"
                  style={{
                    backgroundColor: `${project.accent}15`,
                    color: project.accent,
                  }}
                >
                  <ProjectIcon type={project.icon} className="w-3 h-3" />
                </span>

                {/* Name */}
                <span
                  className={`text-sm font-medium transition-colors duration-200 ${
                    isDark ? "text-white/70 group-hover:text-white/90" : "text-gray-600 group-hover:text-gray-900"
                  }`}
                >
                  {project.title}
                </span>
              </Link>
            ))}
          </div>

          {/* Tooltip Preview */}
          {activeProject && (
            <div
              className="absolute z-50 pointer-events-none"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y - 8,
                transform: "translate(-50%, -100%)",
              }}
            >
              <div
                className={`
                  px-4 py-3 rounded-xl min-w-[220px] max-w-[280px]
                  transition-all duration-200 ease-out
                  animate-in fade-in slide-in-from-bottom-2 duration-200
                `}
                style={{
                  background: isDark ? "rgba(20, 20, 28, 0.95)" : "rgba(255, 255, 255, 0.98)",
                  border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
                  boxShadow: isDark
                    ? "0 12px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)"
                    : "0 12px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.03)",
                  backdropFilter: "blur(12px)",
                }}
              >
                {/* Title */}
                <p className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                  {activeProject.title}
                </p>

                {/* Subtitle */}
                <p className={`text-xs mb-2.5 ${isDark ? "text-white/50" : "text-gray-500"}`}>
                  {activeProject.subtitle}
                </p>

                {/* Bullets */}
                <ul className="space-y-1">
                  {activeProject.bullets.slice(0, 3).map((bullet, i) => (
                    <li
                      key={i}
                      className={`text-[11px] flex items-start gap-2 ${
                        isDark ? "text-white/40" : "text-gray-400"
                      }`}
                    >
                      <span
                        className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                        style={{ backgroundColor: activeProject.accent }}
                      />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>

                {/* Arrow */}
                <div
                  className="absolute left-1/2 -bottom-1.5 -translate-x-1/2 w-3 h-3 rotate-45"
                  style={{
                    background: isDark ? "rgba(20, 20, 28, 0.95)" : "rgba(255, 255, 255, 0.98)",
                    borderRight: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
                    borderBottom: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.06)",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* View All Link */}
        <div className="mt-8 text-center">
          <Link
            href="/projekte"
            className={`
              inline-flex items-center gap-1.5 text-sm font-medium
              transition-colors duration-200
              ${isDark ? "text-white/40 hover:text-white/70" : "text-gray-400 hover:text-gray-600"}
            `}
          >
            Alle Projekte
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
