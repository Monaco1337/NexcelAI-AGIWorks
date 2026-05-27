"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";

// ═══════════════════════════════════════════════════════════════
// SYSTEM PANELS
// ═══════════════════════════════════════════════════════════════

const panels = [
  {
    id: "infrastructure",
    label: "Infrastructure",
    visual: "planes",
    material: "violet",
  },
  {
    id: "scheduling",
    label: "Scheduling",
    visual: "segments",
    material: "indigo",
  },
  {
    id: "operations",
    label: "Operations",
    visual: "matrix",
    material: "emerald",
  },
  {
    id: "compliance",
    label: "Compliance",
    visual: "gates",
    material: "teal",
  },
  {
    id: "intelligence",
    label: "Intelligence",
    visual: "topology",
    material: "amber",
  },
];

const materials: Record<string, { accent: string; glow: string }> = {
  violet: { accent: "rgba(139,92,246,0.4)", glow: "rgba(139,92,246,0.08)" },
  indigo: { accent: "rgba(99,102,241,0.4)", glow: "rgba(99,102,241,0.08)" },
  emerald: { accent: "rgba(16,185,129,0.35)", glow: "rgba(16,185,129,0.06)" },
  teal: { accent: "rgba(20,184,166,0.35)", glow: "rgba(20,184,166,0.06)" },
  amber: { accent: "rgba(245,158,11,0.35)", glow: "rgba(245,158,11,0.06)" },
};

// ═══════════════════════════════════════════════════════════════
// SYSTEM GEOMETRY
// ═══════════════════════════════════════════════════════════════

interface GeometryProps {
  type: string;
  material: string;
  isDark: boolean;
}

function SystemGeometry({ type, material, isDark }: GeometryProps) {
  const m = materials[material];
  const stroke = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
  const fill = isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)";

  // Planes: Architectural cross-section
  if (type === "planes") {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
        {/* Base grid - barely visible */}
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke={stroke} strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" opacity="0.3" />
        
        {/* Horizontal planes */}
        <rect x="60" y="55" width="180" height="1" fill={stroke} />
        <rect x="60" y="95" width="180" height="1" fill={m.accent} />
        <rect x="60" y="135" width="180" height="1" fill={stroke} />
        
        {/* Vertical intersection */}
        <rect x="150" y="40" width="1" height="120" fill={stroke} />
        
        {/* Accent block */}
        <rect x="115" y="75" width="70" height="40" fill={fill} stroke={m.accent} strokeWidth="1" rx="2" />
      </svg>
    );
  }

  // Segments: Temporal precision
  if (type === "segments") {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
        {/* Timeline axis */}
        <line x1="40" y1="100" x2="260" y2="100" stroke={stroke} strokeWidth="1" />
        
        {/* Segment blocks */}
        <rect x="55" y="80" width="45" height="40" fill={fill} rx="2" />
        <rect x="110" y="70" width="60" height="60" fill={m.glow} stroke={m.accent} strokeWidth="1" rx="2" />
        <rect x="180" y="85" width="35" height="30" fill={fill} rx="2" />
        <rect x="225" y="82" width="25" height="36" fill={fill} rx="2" />
        
        {/* Markers */}
        <circle cx="55" cy="100" r="2" fill={stroke} />
        <circle cx="140" cy="100" r="3" fill={m.accent} />
        <circle cx="225" cy="100" r="2" fill={stroke} />
      </svg>
    );
  }

  // Matrix: Modular architecture
  if (type === "matrix") {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
        {/* 3x2 Module grid */}
        {[0, 1, 2].map((col) =>
          [0, 1].map((row) => {
            const isActive = col === 1 && row === 0;
            return (
              <rect
                key={`${col}-${row}`}
                x={70 + col * 55}
                y={55 + row * 50}
                width="50"
                height="45"
                fill={isActive ? m.glow : fill}
                stroke={isActive ? m.accent : stroke}
                strokeWidth="1"
                rx="3"
              />
            );
          })
        )}
      </svg>
    );
  }

  // Gates: Sequential checkpoints
  if (type === "gates") {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
        {/* Vertical gates */}
        <rect x="80" y="50" width="1" height="100" fill={stroke} />
        <rect x="140" y="50" width="2" height="100" fill={m.accent} />
        <rect x="200" y="50" width="1" height="100" fill={stroke} />
        
        {/* Horizontal connector */}
        <line x1="60" y1="100" x2="240" y2="100" stroke={stroke} strokeWidth="1" />
        
        {/* Gate markers */}
        <circle cx="80" cy="100" r="4" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="141" cy="100" r="6" fill={m.glow} stroke={m.accent} strokeWidth="1.5" />
        <circle cx="200" cy="100" r="4" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }

  // Topology: Network architecture
  if (type === "topology") {
    return (
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 300 200" preserveAspectRatio="xMidYMid slice">
        {/* Connection lines */}
        <line x1="150" y1="60" x2="90" y2="100" stroke={stroke} strokeWidth="1" />
        <line x1="150" y1="60" x2="210" y2="100" stroke={stroke} strokeWidth="1" />
        <line x1="90" y1="100" x2="120" y2="145" stroke={stroke} strokeWidth="1" />
        <line x1="210" y1="100" x2="180" y2="145" stroke={stroke} strokeWidth="1" />
        <line x1="90" y1="100" x2="210" y2="100" stroke={stroke} strokeWidth="0.5" strokeDasharray="4,4" />
        
        {/* Nodes */}
        <circle cx="150" cy="60" r="8" fill={m.glow} stroke={m.accent} strokeWidth="1.5" />
        <circle cx="90" cy="100" r="5" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="210" cy="100" r="5" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="120" cy="145" r="4" fill={fill} stroke={stroke} strokeWidth="1" />
        <circle cx="180" cy="145" r="4" fill={fill} stroke={stroke} strokeWidth="1" />
      </svg>
    );
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM GALLERY
// ═══════════════════════════════════════════════════════════════

interface SystemGalleryProps {
  className?: string;
}

export default function SystemGallery({ className = "" }: SystemGalleryProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(true);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const autoAdvanceRef = useRef<NodeJS.Timeout | null>(null);
  const cooldownRef = useRef<NodeJS.Timeout | null>(null);

  const itemCount = panels.length;

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + itemCount) % itemCount);
  }, [itemCount]);

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);

  useEffect(() => {
    if (prefersReducedMotion || isInteracting) {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
      return;
    }
    autoAdvanceRef.current = setInterval(goNext, 6000);
    return () => {
      if (autoAdvanceRef.current) clearInterval(autoAdvanceRef.current);
    };
  }, [prefersReducedMotion, isInteracting, goNext]);

  const pauseAutoAdvance = useCallback(() => {
    setIsInteracting(true);
    if (cooldownRef.current) clearTimeout(cooldownRef.current);
    cooldownRef.current = setTimeout(() => setIsInteracting(false), 5000);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { goTo(activeIndex + 1); pauseAutoAdvance(); }
    else if (e.key === "ArrowLeft") { goTo(activeIndex - 1); pauseAutoAdvance(); }
  };

  const getPanelStyle = (index: number): React.CSSProperties => {
    const diff = index - activeIndex;
    const normalizedDiff = ((diff + itemCount + Math.floor(itemCount / 2)) % itemCount) - Math.floor(itemCount / 2);
    
    if (Math.abs(normalizedDiff) > 1) return { display: "none" };

    const isActive = normalizedDiff === 0;
    const isLeft = normalizedDiff === -1;
    const isRight = normalizedDiff === 1;

    let translateX = 0, translateZ = 0, scale = 1, opacity = 1;

    if (isActive) {
      translateZ = 20;
      scale = 1;
      opacity = 1;
    } else if (isLeft) {
      translateX = -170;
      translateZ = -30;
      scale = 0.88;
      opacity = 0.2;
    } else if (isRight) {
      translateX = 170;
      translateZ = -30;
      scale = 0.88;
      opacity = 0.2;
    }

    return {
      position: "absolute",
      left: "50%",
      top: "50%",
      width: "320px",
      height: "210px",
      marginLeft: "-160px",
      marginTop: "-105px",
      transform: `translate3d(${translateX}px, 0, ${translateZ}px) scale(${scale})`,
      opacity,
      zIndex: isActive ? 20 : 5,
      transition: prefersReducedMotion 
        ? "opacity 0.6s ease" 
        : "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
      pointerEvents: isActive ? "auto" : "none",
    };
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[380px] ${className}`}
      style={{ perspective: "1200px", perspectiveOrigin: "50% 45%" }}
      onMouseEnter={pauseAutoAdvance}
      onFocus={pauseAutoAdvance}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
      aria-label="System Panels"
    >
      {/* Panels */}
      <div className="absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
        {panels.map((panel, index) => {
          const style = getPanelStyle(index);
          if (style.display === "none") return null;

          return (
            <div
              key={panel.id}
              className="rounded-3xl overflow-hidden"
              style={{
                ...style,
                background: isDark 
                  ? "#0a0a0c"
                  : "#f5f5f7",
                border: isDark 
                  ? "1px solid rgba(255,255,255,0.03)" 
                  : "1px solid rgba(0,0,0,0.03)",
                boxShadow: isDark
                  ? "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.02)"
                  : "0 25px 50px -12px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)",
              }}
              aria-hidden={index !== activeIndex}
            >
              {/* Geometry */}
              <SystemGeometry
                type={panel.visual}
                material={panel.material}
                isDark={isDark}
              />

              {/* Label - Engraved style */}
              <div className="absolute bottom-5 left-6">
                <span 
                  className={`text-[11px] font-medium tracking-[0.08em] uppercase ${
                    isDark ? "text-white/20" : "text-black/20"
                  }`}
                >
                  {panel.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Indicators - Minimal */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-2">
        {panels.map((panel, index) => (
          <button
            key={panel.id}
            onClick={() => { goTo(index); pauseAutoAdvance(); }}
            className={`rounded-full transition-all duration-700 ${
              index === activeIndex
                ? isDark ? "w-6 h-0.5 bg-white/20" : "w-6 h-0.5 bg-black/20"
                : isDark ? "w-0.5 h-0.5 bg-white/08 hover:bg-white/12" : "w-0.5 h-0.5 bg-black/08 hover:bg-black/12"
            }`}
            aria-label={panel.label}
            aria-selected={index === activeIndex}
          />
        ))}
      </div>
    </div>
  );
}
