"use client";

/**
 * AgiWorksLogo
 *
 * Full AGI Works brand logo — ring/arrow symbol + "AGI WORKS" wordmark —
 * rendered from a transparent PNG via an SVG <image> element (same approach as
 * NexcelLogoMark / AgiWorksLogoMark, which avoids the next/image lint rule).
 * The PNG ships with a transparent background, so no colour-matrix background
 * removal is needed.
 *
 * Sizing: pass `width`; height auto-derives from the logo's 4:1 aspect ratio.
 */

export interface AgiWorksLogoProps {
  /** Rendered width in px. Default: 160 */
  width?: number;
  /** Explicit height override. Defaults to width × (VB_H / VB_W). */
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * CSS filter for glow/shadow. Pass null to remove completely.
   * Default: subtle blue drop-shadow to match the AGI Works accent.
   */
  glow?: string | null;
}

// Intrinsic PNG dimensions (public/images/logos/agiworks-logo-full.png = 1000×250).
const VB_W = 1000;
const VB_H = 250;

export function AgiWorksLogo({
  width = 160,
  height,
  className,
  style,
  glow = "drop-shadow(0 0 8px rgba(91,184,255,0.40)) drop-shadow(0 1px 4px rgba(0,0,0,0.46))",
}: AgiWorksLogoProps) {
  const h = height ?? Math.round(width * (VB_H / VB_W));

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
      aria-label="AGI Works"
      role="img"
      focusable="false"
    >
      <title>AGI Works</title>
      <image
        href="/images/logos/agiworks-logo-full.png"
        x="0"
        y="0"
        width={VB_W}
        height={VB_H}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
