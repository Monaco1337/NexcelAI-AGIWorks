"use client";

/**
 * NexcelLogoMark
 *
 * Pure-SVG wordmark for NEXCEL AI.
 * No image dependency — no black background, no blend-mode hacks.
 *
 * Two stacked <text> layers share the same position:
 *   1. Base layer  – metallic vertical gradient (white → lavender)
 *   2. Shine layer – horizontal shimmer band (specular highlight)
 *
 * The outer `filter` prop adds a configurable drop-shadow glow.
 *
 * Sizing: pass `width`; height auto-derived from aspect ratio ≈ 6:1.
 */

import { useId } from "react";

export interface NexcelLogoMarkProps {
  /** Rendered width in px. Default: 150 */
  width?: number;
  /** Explicit height override. Defaults to width × (VB_H / VB_W). */
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * CSS filter for glow/shadow. Pass null to remove completely.
   * Default: subtle lavender drop-shadow.
   */
  glow?: string | null;
}

const VB_W = 192;
const VB_H = 32;

export function NexcelLogoMark({
  width = 150,
  height,
  className,
  style,
  glow = "drop-shadow(0 0 8px rgba(183,140,255,0.40)) drop-shadow(0 1px 4px rgba(0,0,0,0.46))",
}: NexcelLogoMarkProps) {
  const uid = useId().replace(/:/g, "");
  const h = height ?? Math.round(width * (VB_H / VB_W));

  const cx = VB_W / 2;                    // 96 — horizontal center
  const ty = Math.round(VB_H * 0.76);    // 24 — text baseline
  const gId = `nx-g-${uid}`;
  const sId = `nx-s-${uid}`;

  const textProps = {
    x: cx,
    y: ty,
    textAnchor: "middle" as const,
    fontFamily: "system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif",
    fontWeight: "300",
    fontSize: "21",
    letterSpacing: "3.4",
  };

  return (
    <svg
      width={width}
      height={h}
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        flexShrink: 0,
        display: "block",
        userSelect: "none",
        ...style,
        filter: glow ?? undefined,
      }}
      aria-label="NEXCEL AI"
      role="img"
      focusable="false"
    >
      <title>NEXCEL AI</title>

      <defs>
        {/*
          Metallic vertical gradient — top-bright → bottom-lavender.
          gradientUnits="userSpaceOnUse" maps coordinates directly into the viewBox.
        */}
        <linearGradient id={gId} gradientUnits="userSpaceOnUse"
          x1={cx} y1="1" x2={cx} y2={VB_H - 1}>
          <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.97" />
          <stop offset="26%"  stopColor="#EEE8FF" stopOpacity="0.93" />
          <stop offset="62%"  stopColor="#CABDFF" stopOpacity="0.88" />
          <stop offset="100%" stopColor="#AA8AF2" stopOpacity="0.78" />
        </linearGradient>

        {/*
          Horizontal shimmer band — subtle center highlight for a metallic "sheen".
        */}
        <linearGradient id={sId} gradientUnits="userSpaceOnUse"
          x1="0" y1={cx} x2={VB_W} y2={cx}>
          <stop offset="0%"   stopColor="rgba(255,255,255,0.00)" />
          <stop offset="38%"  stopColor="rgba(255,255,255,0.20)" />
          <stop offset="62%"  stopColor="rgba(255,255,255,0.14)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
        </linearGradient>
      </defs>

      {/* Layer 1 — base gradient fill */}
      <text {...textProps} fill={`url(#${gId})`}>NEXCEL AI</text>

      {/* Layer 2 — shimmer overlay (aria-hidden, purely decorative) */}
      <text {...textProps} fill={`url(#${sId})`} aria-hidden="true">NEXCEL AI</text>
    </svg>
  );
}
