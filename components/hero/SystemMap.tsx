"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import { projectNodes, type ProjectNode } from "./heroData";

// Icon component
const ProjectIcon = ({ type, className, style }: { type: ProjectNode["icon"]; className?: string; style?: React.CSSProperties }) => {
  const paths: Record<ProjectNode["icon"], string> = {
    platform: "M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0l4.179 2.25L12 21.75l-9.75-5.25 4.179-2.25m11.142 0l-5.571 3-5.571-3",
    ai: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z",
    analytics: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    automation: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    crm: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    flow: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
  };
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={paths[type] || paths.platform} />
    </svg>
  );
};

// Status badge
const StatusBadge = ({ status }: { status: ProjectNode["status"] }) => {
  const config: Record<ProjectNode["status"], { bg: string; text: string; border: string; label: string }> = {
    live: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/25", label: "Live" },
    beta: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/25", label: "Beta" },
    coming: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/25", label: "Soon" },
  };
  const { bg, text, border, label } = config[status];
  return (
    <span className={`text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border ${bg} ${text} ${border}`}>
      {label}
    </span>
  );
};

// SVG Connector overlay - connects Core Platform to other nodes
const ConnectorOverlay = ({ isDark, activeNode }: { isDark: boolean; activeNode: string | null }) => {
  const baseOpacity = isDark ? 0.15 : 0.1;
  const activeOpacity = isDark ? 0.4 : 0.3;
  
  // Core platform is at index 0 (top-left)
  // Grid is 2 columns, so positions are:
  // [0,0] [1,0] = Core, Chronex
  // [0,1] [1,1] = ImmoStripe, CannaFlow
  // [0,2] [1,2] = NextSeller, Automation
  
  const getOpacity = (targetId: string) => {
    if (activeNode === "core-platform") return activeOpacity;
    if (activeNode === targetId) return activeOpacity;
    return baseOpacity;
  };

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="connector-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isDark ? "#A855F7" : "#9333EA"} stopOpacity="0.8" />
          <stop offset="100%" stopColor={isDark ? "#6366F1" : "#4F46E5"} stopOpacity="0.4" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Connector lines from Core Platform (card 0) to other cards */}
      {/* These are decorative curved lines */}
      <g filter="url(#glow)">
        {/* Core to Chronex (horizontal right) */}
        <path
          d="M 25% 16% Q 37% 16%, 50% 16%"
          fill="none"
          stroke="url(#connector-gradient)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity={getOpacity("chronex-ai")}
          className="transition-opacity duration-300"
        />
        {/* Core to ImmoStripe (diagonal down-left) */}
        <path
          d="M 25% 20% Q 20% 35%, 25% 50%"
          fill="none"
          stroke="url(#connector-gradient)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity={getOpacity("immostripe-ai")}
          className="transition-opacity duration-300"
        />
        {/* Core to CannaFlow (diagonal down-right) */}
        <path
          d="M 30% 20% Q 50% 35%, 75% 50%"
          fill="none"
          stroke="url(#connector-gradient)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity={getOpacity("cannaflow-ai")}
          className="transition-opacity duration-300"
        />
        {/* Core to NextSeller (down) */}
        <path
          d="M 25% 22% Q 15% 55%, 25% 83%"
          fill="none"
          stroke="url(#connector-gradient)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity={getOpacity("nextseller-crm")}
          className="transition-opacity duration-300"
        />
        {/* Core to Automation Hub (far diagonal) */}
        <path
          d="M 30% 18% Q 55% 50%, 75% 83%"
          fill="none"
          stroke="url(#connector-gradient)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity={getOpacity("automation-hub")}
          className="transition-opacity duration-300"
        />
      </g>
      
      {/* Node dots at Core Platform position */}
      <circle
        cx="25%"
        cy="16%"
        r="3"
        fill={isDark ? "#A855F7" : "#9333EA"}
        opacity={activeNode === "core-platform" ? 0.8 : 0.4}
        className="transition-opacity duration-300"
      />
    </svg>
  );
};

interface SystemMapProps {
  className?: string;
}

export default function SystemMap({ className = "" }: SystemMapProps) {
  const { theme } = useTheme();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [isKeyboardNav, setIsKeyboardNav] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const activeProject = activeNode ? projectNodes.find((p) => p.id === activeNode) : null;
  const isDark = theme === "dark";

  const handleMouseEnter = useCallback((id: string) => {
    if (!isKeyboardNav) setActiveNode(id);
  }, [isKeyboardNav]);

  const handleMouseLeave = useCallback(() => {
    if (!isKeyboardNav) setActiveNode(null);
  }, [isKeyboardNav]);

  const handleFocus = useCallback((id: string) => {
    setIsKeyboardNav(true);
    setActiveNode(id);
  }, []);

  const handleBlur = useCallback(() => {
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setActiveNode(null);
        setIsKeyboardNav(false);
      }
    }, 10);
  }, []);

  useEffect(() => {
    const handleMouseMove = () => setIsKeyboardNav(false);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className={`w-full max-w-[520px] ${className}`} ref={containerRef}>
      {/* Grid wrapper with connector overlay */}
      <div className="relative">
        {/* SVG Connector Overlay */}
        <ConnectorOverlay isDark={isDark} activeNode={activeNode} />
        
        {/* Grid of project cards */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 sm:gap-3" role="list" aria-label="System-Übersicht">
          {projectNodes.map((project, index) => {
            const isActive = activeNode === project.id;
            const isCore = project.id === "core-platform";
            
            return (
              <Link
                key={project.id}
                href={project.href}
                onMouseEnter={() => handleMouseEnter(project.id)}
                onMouseLeave={handleMouseLeave}
                onFocus={() => handleFocus(project.id)}
                onBlur={handleBlur}
                className={`
                  group relative p-3 sm:p-4 rounded-2xl border
                  transition-all duration-250 ease-out
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
                  ${isActive
                    ? isDark
                      ? "bg-white/[0.10] border-white/[0.20] -translate-y-0.5"
                      : "bg-black/[0.06] border-black/[0.12] -translate-y-0.5"
                    : isDark
                      ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.10]"
                      : "bg-black/[0.02] border-black/[0.05] hover:bg-black/[0.04] hover:border-black/[0.08]"
                  }
                  ${isCore ? "ring-1 ring-purple-500/20" : ""}
                `}
                style={{
                  backdropFilter: "blur(12px)",
                  boxShadow: isActive
                    ? isDark
                      ? `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.06)`
                      : `0 8px 24px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.8)`
                    : isDark
                      ? `0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.03)`
                      : `0 2px 8px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)`,
                }}
                role="listitem"
                aria-describedby={isActive ? `detail-${project.id}` : undefined}
              >
                {/* Accent glow on hover */}
                <div
                  className={`absolute inset-0 rounded-2xl transition-opacity duration-300 pointer-events-none ${
                    isActive ? "opacity-100" : "opacity-0 group-hover:opacity-60"
                  }`}
                  style={{
                    background: `radial-gradient(circle at 50% 0%, ${project.accent}20, transparent 70%)`,
                  }}
                />

                {/* Inner highlight line */}
                <div 
                  className="absolute inset-x-0 top-0 h-px rounded-t-2xl pointer-events-none"
                  style={{
                    background: isDark 
                      ? "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)"
                      : "linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)",
                  }}
                />

                <div className="relative flex items-start gap-2.5 sm:gap-3">
                  {/* Icon */}
                  <div
                    className={`flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all duration-200 ${
                      isActive ? "scale-105" : ""
                    }`}
                    style={{
                      backgroundColor: `${project.accent}${isActive ? "25" : "12"}`,
                      border: `1px solid ${project.accent}${isActive ? "40" : "20"}`,
                      boxShadow: isActive ? `0 0 12px ${project.accent}30` : "none",
                    }}
                  >
                    <ProjectIcon
                      type={project.icon}
                      className="w-4 h-4 sm:w-5 sm:h-5"
                      style={{ color: project.accent }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <h3
                        className={`text-[13px] sm:text-sm font-semibold truncate transition-colors duration-200 ${
                          isDark ? "text-white" : "text-gray-900"
                        }`}
                      >
                        {project.title}
                      </h3>
                      <StatusBadge status={project.status} />
                    </div>
                    <p
                      className={`text-[10px] sm:text-[11px] truncate ${
                        isDark ? "text-white/55" : "text-gray-500"
                      }`}
                    >
                      {project.subtitle}
                    </p>
                  </div>
                </div>

                {/* Arrow indicator */}
                <div
                  className={`absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 transition-all duration-200 ${
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"
                  }`}
                >
                  <svg
                    className={`w-3.5 h-3.5 ${isDark ? "text-white/50" : "text-gray-400"}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Detail panel - appears below grid on hover/focus */}
      <div
        className={`mt-3 overflow-hidden transition-all duration-300 ease-out ${
          activeProject ? "max-h-44 opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-live="polite"
        aria-atomic="true"
      >
        {activeProject && (
          <div
            id={`detail-${activeProject.id}`}
            className={`p-4 rounded-2xl border ${
              isDark
                ? "bg-white/[0.05] border-white/[0.08]"
                : "bg-black/[0.02] border-black/[0.06]"
            }`}
            style={{ 
              backdropFilter: "blur(16px)",
              boxShadow: isDark
                ? "0 4px 16px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)"
                : "0 4px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.7)",
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: `${activeProject.accent}20`,
                  border: `1px solid ${activeProject.accent}35`,
                  boxShadow: `0 0 16px ${activeProject.accent}25`,
                }}
              >
                <ProjectIcon
                  type={activeProject.icon}
                  className="w-5 h-5"
                  style={{ color: activeProject.accent }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold mb-1 ${isDark ? "text-white" : "text-gray-900"}`}>
                  {activeProject.title}
                </h4>
                <p className={`text-xs mb-2.5 leading-relaxed ${isDark ? "text-white/65" : "text-gray-600"}`}>
                  {activeProject.description}
                </p>
                <ul className="space-y-1">
                  {activeProject.bullets.map((bullet, i) => (
                    <li
                      key={i}
                      className={`text-[11px] flex items-center gap-2 ${
                        isDark ? "text-white/50" : "text-gray-500"
                      }`}
                    >
                      <span 
                        className="w-1 h-1 rounded-full flex-shrink-0"
                        style={{ backgroundColor: activeProject.accent }}
                      />
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
