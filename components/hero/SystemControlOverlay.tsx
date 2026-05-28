"use client";

import type { FC, ReactNode } from "react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

/**
 * SystemControlOverlay — high-end „Control-Surface" eines laufenden Systems.
 * Floating glassmorphic panels:
 *   • Pipeline (Lead-Throughput, animiertes Bar-Set + Count-Up)
 *   • Automation Coverage (Ring + sanftes Drift)
 *   • Conversion Track (gleitende Sparkline, neue Punkte rein, alte raus)
 *   • Routing-Layer (Knoten + animierte Edges)
 *   • Connector-Lines mit Glow zwischen Panels
 *   • LIVE SYSTEM-Indikator oben rechts
 */

interface Props {
  brandAccentRgb?: string;
  isDark?: boolean;
}

// ─────────────────────────────────────────────────────────────
// Hooks & Helpers
// ─────────────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, decimals = 0): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      // ease-out-quint
      const eased = 1 - Math.pow(1 - t, 5);
      setValue(target * eased);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return decimals === 0
    ? Math.round(value)
    : parseFloat(value.toFixed(decimals));
}

const Panel: FC<{
  className?: string;
  isDark: boolean;
  accentRgb: string;
  children: ReactNode;
  delay?: number;
  glowStrength?: number;
}> = ({
  className = "",
  isDark,
  accentRgb,
  children,
  delay = 0,
  glowStrength = 0.18,
}) => (
  <motion.div
    className={`absolute rounded-2xl overflow-hidden ${className}`}
    initial={{ opacity: 0, y: 14, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay }}
    style={{
      background: isDark
        ? "linear-gradient(135deg, rgba(20,20,32,0.62) 0%, rgba(12,12,22,0.46) 100%)"
        : "linear-gradient(135deg, rgba(255,255,255,0.86) 0%, rgba(248,248,252,0.74) 100%)",
      backdropFilter: "blur(28px) saturate(180%)",
      WebkitBackdropFilter: "blur(28px) saturate(180%)",
      border: isDark
        ? `1px solid rgba(255,255,255,0.08)`
        : `1px solid rgba(15,15,25,0.06)`,
      boxShadow: isDark
        ? `0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(${accentRgb},0.08), inset 0 1px 0 rgba(255,255,255,0.06), 0 0 32px rgba(${accentRgb},${glowStrength})`
        : `0 18px 48px rgba(15,15,25,0.10), 0 0 0 1px rgba(${accentRgb},0.06), inset 0 1px 0 rgba(255,255,255,0.6), 0 0 28px rgba(${accentRgb},${glowStrength * 0.4})`,
    }}
  >
    <div
      className="absolute inset-x-3 top-0 h-px pointer-events-none"
      style={{
        background: isDark
          ? `linear-gradient(90deg, transparent, rgba(${accentRgb},0.55), transparent)`
          : `linear-gradient(90deg, transparent, rgba(${accentRgb},0.4), transparent)`,
      }}
    />
    {children}
  </motion.div>
);

const PanelLabel: FC<{ children: ReactNode; isDark: boolean }> = ({
  children,
  isDark,
}) => (
  <div
    className={`text-[9px] uppercase tracking-[0.18em] ${
      isDark ? "text-white/40" : "text-gray-500/80"
    }`}
    style={{
      fontFamily: "var(--font-headline), system-ui, sans-serif",
      fontWeight: 500,
    }}
  >
    {children}
  </div>
);

const StatusDot: FC<{ accentRgb: string; pulse?: boolean }> = ({
  accentRgb,
  pulse = true,
}) => (
  <span className="relative inline-flex h-1.5 w-1.5">
    {pulse && (
      <span
        className="absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping"
        style={{ background: `rgb(${accentRgb})` }}
      />
    )}
    <span
      className="relative inline-flex rounded-full h-1.5 w-1.5"
      style={{
        background: `rgb(${accentRgb})`,
        boxShadow: `0 0 8px rgba(${accentRgb},0.7)`,
      }}
    />
  </span>
);

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

export default function SystemControlOverlay({
  brandAccentRgb = "139,92,246",
  isDark = true,
}: Props) {
  const leadsCount = useCountUp(127, 2200);
  const conversionCount = useCountUp(3.2, 2400, 1);
  const [coverage, setCoverage] = useState(0);
  const coverageDisplay = Math.round(coverage);

  // animate coverage from 0 → 68 then drift between 67–71
  useEffect(() => {
    let raf = 0;
    let phase: "in" | "drift" = "in";
    let target = 68;
    const step = () => {
      setCoverage((v) => v + (target - v) * (phase === "in" ? 0.03 : 0.018));
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    const t1 = setTimeout(() => {
      phase = "drift";
    }, 2400);
    const t2 = setInterval(() => {
      target = 67 + Math.random() * 4;
    }, 3500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearInterval(t2);
    };
  }, []);

  // Pipeline bars — animate heights subtly
  const [bars, setBars] = useState<number[]>([42, 56, 38, 64, 71, 52, 78]);
  const [activeBar, setActiveBar] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setActiveBar((i) => (i + 1) % 7);
      setBars((curr) =>
        curr.map((v) => {
          const target = 32 + Math.random() * 56;
          return v + (target - v) * 0.35;
        }),
      );
    }, 1500);
    return () => clearInterval(t);
  }, []);

  // Sliding sparkline (12 points window). Push new value periodically.
  const initialSpark = [38, 32, 41, 30, 36, 26, 33, 22, 28, 18, 24, 14];
  const [sparkPoints, setSparkPoints] = useState<number[]>(initialSpark);
  useEffect(() => {
    const t = setInterval(() => {
      setSparkPoints((prev) => {
        const next = [...prev.slice(1)];
        const last = prev[prev.length - 1] ?? 22;
        const delta = (Math.random() - 0.55) * 8;
        const newVal = Math.max(8, Math.min(46, last + delta));
        next.push(newVal);
        return next;
      });
    }, 1300);
    return () => clearInterval(t);
  }, []);

  const sparkPath = sparkPoints
    .map((y, i) => {
      const x = (i / (sparkPoints.length - 1)) * 100;
      return `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");

  const ringCirc = 2 * Math.PI * 28;
  const ringOffset = ringCirc * (1 - coverage / 100);

  return (
    <div
      className="pointer-events-none relative h-full w-full select-none"
      aria-hidden
      style={{ minHeight: 440 }}
    >
      {/* Ambient halo */}
      <div
        className="absolute inset-0 rounded-[40px]"
        style={{
          background: `radial-gradient(ellipse 70% 60% at 60% 40%, rgba(${brandAccentRgb},0.18) 0%, transparent 65%)`,
          filter: "blur(20px)",
        }}
      />

      {/* ── Routing / Map background ───────────────────────── */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 440"
        fill="none"
        preserveAspectRatio="xMidYMid meet"
        style={{ opacity: isDark ? 0.55 : 0.42 }}
      >
        <defs>
          <linearGradient id="edgeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor={`rgba(${brandAccentRgb},0)`} />
            <stop offset="0.5" stopColor={`rgba(${brandAccentRgb},0.55)`} />
            <stop offset="1" stopColor={`rgba(${brandAccentRgb},0)`} />
          </linearGradient>
          <radialGradient id="nodeGrad" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor={`rgba(${brandAccentRgb},0.85)`} />
            <stop offset="1" stopColor={`rgba(${brandAccentRgb},0)`} />
          </radialGradient>
        </defs>

        {[
          ["M 60 90 Q 180 60 320 110", 1.4],
          ["M 60 90 Q 140 200 280 230", 1],
          ["M 320 110 Q 240 200 280 230", 0.8],
          ["M 280 230 Q 220 320 110 360", 1.1],
          ["M 60 90 Q 90 240 110 360", 0.9],
          ["M 320 110 Q 360 250 110 360", 0.7],
        ].map(([d, w], i) => (
          <motion.path
            key={i}
            d={d as string}
            stroke="url(#edgeGrad)"
            strokeWidth={w as number}
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 2.4, ease: "easeOut", delay: 0.4 + i * 0.12 }}
          />
        ))}

        {[
          [60, 90, 5],
          [320, 110, 4],
          [280, 230, 6],
          [110, 360, 5],
          [200, 180, 3],
          [240, 320, 3],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <circle cx={x} cy={y} r={(r as number) * 4} fill="url(#nodeGrad)" />
            <circle
              cx={x}
              cy={y}
              r={r as number}
              fill={`rgb(${brandAccentRgb})`}
              style={{ filter: `drop-shadow(0 0 6px rgba(${brandAccentRgb},0.8))` }}
            />
          </g>
        ))}

        <circle
          r={2.8}
          fill="#fff"
          style={{ filter: `drop-shadow(0 0 6px rgba(${brandAccentRgb},1))` }}
        >
          <animateMotion
            dur="4.2s"
            repeatCount="indefinite"
            path="M 60 90 Q 180 60 320 110"
          />
        </circle>
      </svg>

      {/* ── Connector lines between panels (glowing curves) ── */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 400 440"
        fill="none"
        preserveAspectRatio="none"
        style={{ pointerEvents: "none" }}
      >
        <defs>
          <linearGradient id="connectorGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={`rgba(${brandAccentRgb},0.0)`} />
            <stop offset="0.5" stopColor={`rgba(${brandAccentRgb},0.55)`} />
            <stop offset="1" stopColor={`rgba(${brandAccentRgb},0.0)`} />
          </linearGradient>
          <filter id="connectorBlur">
            <feGaussianBlur stdDeviation="1.2" />
          </filter>
        </defs>

        {/* Pipeline (top-right) → Coverage (left-mid) */}
        <motion.path
          d="M 240 92 C 200 130 130 150 70 220"
          stroke="url(#connectorGrad)"
          strokeWidth="1.2"
          strokeDasharray="3 6"
          fill="none"
          filter="url(#connectorBlur)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 2, ease: "easeOut", delay: 0.9 }}
        />
        {/* Coverage (left-mid) → Conversion (bottom-right) */}
        <motion.path
          d="M 70 250 C 130 320 220 360 300 380"
          stroke="url(#connectorGrad)"
          strokeWidth="1.2"
          strokeDasharray="3 6"
          fill="none"
          filter="url(#connectorBlur)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.85 }}
          transition={{ duration: 2, ease: "easeOut", delay: 1.1 }}
        />

        {/* Moving signal pulses on connectors */}
        <circle
          r="2"
          fill={`rgb(${brandAccentRgb})`}
          style={{ filter: `drop-shadow(0 0 5px rgba(${brandAccentRgb},1))` }}
        >
          <animateMotion
            dur="3.6s"
            repeatCount="indefinite"
            path="M 240 92 C 200 130 130 150 70 220"
          />
        </circle>
        <circle
          r="2"
          fill={`rgb(${brandAccentRgb})`}
          style={{ filter: `drop-shadow(0 0 5px rgba(${brandAccentRgb},1))` }}
        >
          <animateMotion
            dur="4s"
            begin="1.6s"
            repeatCount="indefinite"
            path="M 70 250 C 130 320 220 360 300 380"
          />
        </circle>
      </svg>

      {/* ── LIVE SYSTEM badge (top right) ───────────────────── */}
      <motion.div
        className="absolute right-[2%] top-[2%] z-20 flex items-center gap-2 px-3 py-1.5 rounded-full"
        initial={{ opacity: 0, x: 8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.4, duration: 0.7 }}
        style={{
          background: isDark
            ? "rgba(15,15,25,0.6)"
            : "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          border: `1px solid rgba(${brandAccentRgb},0.32)`,
          boxShadow: isDark
            ? `0 8px 28px rgba(0,0,0,0.4), 0 0 22px rgba(${brandAccentRgb},0.32)`
            : `0 6px 20px rgba(15,15,25,0.08), 0 0 18px rgba(${brandAccentRgb},0.18)`,
        }}
      >
        <motion.span
          className="relative inline-flex h-1.5 w-1.5 rounded-full"
          style={{
            background: `rgb(${brandAccentRgb})`,
            boxShadow: `0 0 10px rgba(${brandAccentRgb},1)`,
          }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <span
          className={`text-[10px] tracking-[0.22em] uppercase ${
            isDark ? "text-white/85" : "text-gray-800"
          }`}
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 600,
          }}
        >
          Live System
        </span>
      </motion.div>

      {/* ── Pipeline Panel (top right) ──────────────────────── */}
      <Panel
        isDark={isDark}
        accentRgb={brandAccentRgb}
        delay={0.15}
        glowStrength={0.22}
        className="right-0 top-[10%] w-[58%] max-w-[300px] p-4"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <StatusDot accentRgb={brandAccentRgb} />
            <PanelLabel isDark={isDark}>Lead Pipeline</PanelLabel>
          </div>
          <div
            className={`text-[10px] tracking-wide ${
              isDark ? "text-white/40" : "text-gray-500/70"
            }`}
            style={{
              fontFamily:
                "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
            }}
          >
            live
          </div>
        </div>

        <div className="flex items-end gap-1.5 h-[64px] mb-3">
          {bars.map((h, i) => (
            <div key={i} className="flex-1 relative">
              <div
                className="absolute bottom-0 left-0 right-0 rounded-t-[3px]"
                style={{
                  height: `${h}%`,
                  background:
                    i === activeBar
                      ? `linear-gradient(180deg, rgb(${brandAccentRgb}) 0%, rgba(${brandAccentRgb},0.55) 100%)`
                      : isDark
                        ? "linear-gradient(180deg, rgba(255,255,255,0.32) 0%, rgba(255,255,255,0.12) 100%)"
                        : "linear-gradient(180deg, rgba(15,15,25,0.42) 0%, rgba(15,15,25,0.16) 100%)",
                  boxShadow:
                    i === activeBar
                      ? `0 0 14px rgba(${brandAccentRgb},0.55)`
                      : "none",
                  transition:
                    "height 0.9s cubic-bezier(0.22,1,0.36,1), background 0.5s ease, box-shadow 0.5s ease",
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-baseline justify-between">
          <div>
            <div
              className={isDark ? "text-white" : "text-gray-900"}
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 500,
                fontSize: "1.35rem",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {leadsCount}
            </div>
            <div
              className={`text-[9.5px] mt-1 uppercase tracking-[0.16em] ${
                isDark ? "text-white/40" : "text-gray-500/80"
              }`}
            >
              qualifizierte Leads
            </div>
          </div>
          <div
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: `rgba(${brandAccentRgb},0.14)`,
              color: `rgb(${brandAccentRgb})`,
              border: `1px solid rgba(${brandAccentRgb},0.28)`,
              fontFamily:
                "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
            }}
          >
            ↑ 18%
          </div>
        </div>
      </Panel>

      {/* ── Coverage Ring (left middle) ─────────────────────── */}
      <Panel
        isDark={isDark}
        accentRgb={brandAccentRgb}
        delay={0.35}
        glowStrength={0.18}
        className="left-0 top-[42%] w-[48%] max-w-[230px] p-4"
      >
        <div className="flex items-center gap-2 mb-3">
          <StatusDot accentRgb={brandAccentRgb} pulse={false} />
          <PanelLabel isDark={isDark}>Automation Coverage</PanelLabel>
        </div>
        <div className="flex items-center gap-3.5">
          <svg width="76" height="76" viewBox="0 0 76 76">
            <circle
              cx="38"
              cy="38"
              r="28"
              fill="none"
              stroke={
                isDark ? "rgba(255,255,255,0.08)" : "rgba(15,15,25,0.08)"
              }
              strokeWidth="3.5"
            />
            <circle
              cx="38"
              cy="38"
              r="28"
              fill="none"
              stroke={`rgb(${brandAccentRgb})`}
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray={ringCirc}
              strokeDashoffset={ringOffset}
              transform="rotate(-90 38 38)"
              style={{
                filter: `drop-shadow(0 0 5px rgba(${brandAccentRgb},0.55))`,
                transition: "stroke-dashoffset 0.5s ease",
              }}
            />
          </svg>
          <div>
            <div
              className={isDark ? "text-white" : "text-gray-900"}
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 500,
                fontSize: "1.35rem",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {coverageDisplay}%
            </div>
            <div
              className={`text-[9.5px] mt-1 uppercase tracking-[0.16em] ${
                isDark ? "text-white/40" : "text-gray-500/80"
              }`}
            >
              automatisiert
            </div>
          </div>
        </div>
      </Panel>

      {/* ── Conversion Sparkline (bottom right) ─────────────── */}
      <Panel
        isDark={isDark}
        accentRgb={brandAccentRgb}
        delay={0.55}
        glowStrength={0.16}
        className="right-[6%] bottom-[6%] w-[54%] max-w-[260px] p-4"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <StatusDot accentRgb={brandAccentRgb} />
            <PanelLabel isDark={isDark}>Conversion Track</PanelLabel>
          </div>
          <div
            className="text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: `rgba(${brandAccentRgb},0.14)`,
              color: `rgb(${brandAccentRgb})`,
              border: `1px solid rgba(${brandAccentRgb},0.28)`,
              fontFamily:
                "var(--font-mono, ui-monospace, SFMono-Regular), monospace",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {conversionCount.toFixed(1)}× Δ
          </div>
        </div>

        <svg
          viewBox="0 0 100 50"
          className="w-full h-[54px]"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={`rgba(${brandAccentRgb},0.32)`} />
              <stop offset="1" stopColor={`rgba(${brandAccentRgb},0)`} />
            </linearGradient>
            <linearGradient id="sparkLine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={`rgba(${brandAccentRgb},0.45)`} />
              <stop offset="1" stopColor={`rgba(${brandAccentRgb},1)`} />
            </linearGradient>
          </defs>
          <path
            d={`${sparkPath} L 100 50 L 0 50 Z`}
            fill="url(#sparkFill)"
            style={{ transition: "d 1.1s cubic-bezier(0.22,1,0.36,1)" }}
          />
          <path
            d={sparkPath}
            stroke="url(#sparkLine)"
            strokeWidth="1.6"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              filter: `drop-shadow(0 0 4px rgba(${brandAccentRgb},0.5))`,
              transition: "d 1.1s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
          <circle
            cx="100"
            cy={sparkPoints[sparkPoints.length - 1] ?? 22}
            r="2"
            fill="#fff"
            style={{
              filter: `drop-shadow(0 0 6px rgba(${brandAccentRgb},1))`,
              transition: "cy 1.1s cubic-bezier(0.22,1,0.36,1)",
            }}
          />
        </svg>
      </Panel>
    </div>
  );
}
