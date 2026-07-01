"use client";

/**
 * AgiWorksLogoMark
 *
 * Renders the AGI Works transparent PNG logo using an SVG feColorMatrix filter
 * to remove the white background on any dark surface. The filter works by
 * computing: alpha = -3R -3G -3B + 8A - 1
 *   • Pure white  (R=G=B=1, A=1) → alpha = -2  → 0 (transparent) ✓
 *   • Silver      (R≈0.7, A=1)   → alpha ≈ 0.7 → opaque          ✓
 *   • Blue        (R≈0.2, A=1)   → alpha ≈ 2.2 → 1 (opaque)      ✓
 *   • Transparent (A=0)          → alpha ≤ 0   → 0 (transparent) ✓
 *
 * Using React.useId() ensures unique filter IDs when the component
 * is rendered multiple times on the same page.
 */

import { useId } from "react";

interface AgiWorksLogoMarkProps {
  /** Display size in px (square). Default: 32 */
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  /**
   * CSS drop-shadow / glow to apply around the final logo.
   * Pass null to disable all shadow.
   */
  glow?: string | null;
}

export function AgiWorksLogoMark({
  size = 32,
  className,
  style,
  glow = "drop-shadow(0 2px 8px rgba(0,0,0,0.5)) drop-shadow(0 0 16px rgba(91,184,255,0.40))",
}: AgiWorksLogoMarkProps) {
  const uid = useId().replace(/:/g, "");
  const filterId = `aw-bg-${uid}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ flexShrink: 0, ...style, filter: glow ?? undefined }}
      aria-hidden
      focusable="false"
    >
      <defs>
        <filter
          id={filterId}
          colorInterpolationFilters="sRGB"
          x="0%"
          y="0%"
          width="100%"
          height="100%"
        >
          {/*
            Remove near-white pixels while keeping blue / silver metallic tones.
            Last row = alpha channel: A' = -3R -3G -3B + 8A - 1
          */}
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    -3 -3 -3 8 -1"
          />
        </filter>
      </defs>
      <image
        href="/images/logos/agiworks-logo.png"
        x="0"
        y="0"
        width={size}
        height={size}
        filter={`url(#${filterId})`}
        preserveAspectRatio="xMidYMid meet"
      />
    </svg>
  );
}
