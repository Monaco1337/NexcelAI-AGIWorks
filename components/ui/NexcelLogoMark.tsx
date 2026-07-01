"use client";

/**
 * NexcelLogoMark
 *
 * Renders the NEXCEL AI metallic wordmark PNG.
 * mix-blend-mode: screen removes the black background:
 *   • Black  (0,0,0) on dark bg  → result = dark bg   → invisible ✓
 *   • Silver (0.9,…) on dark bg  → result = bright     → glows    ✓
 *
 * The source image has significant black padding. We use a fixed-size
 * overflow-hidden container with object-fit: cover + object-position: center
 * to zoom into the metallic text area. The black margins are invisible
 * thanks to the screen blend mode.
 */

import Image from "next/image";

interface NexcelLogoMarkProps {
  /**
   * Container width in px. The metallic "NEXCELAI" text fills ~60 % of the
   * source image width, so at 160 px the text occupies ~96 px — ideal for nav.
   * Default: 150
   */
  width?: number;
  /**
   * Container height in px. Keep it < 30 % of width for best results.
   * Default: 28
   */
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function NexcelLogoMark({
  width = 150,
  height = 28,
  className,
  style,
}: NexcelLogoMarkProps) {
  return (
    <span
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        width: `${width}px`,
        height: `${height}px`,
        overflow: "hidden",
        flexShrink: 0,
        ...style,
      }}
    >
      <Image
        src="/images/logos/nexcel-logo.png"
        alt="NEXCEL AI"
        width={width}
        height={height}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center center",
          mixBlendMode: "screen",
          display: "block",
          userSelect: "none",
        }}
        draggable={false}
        priority={false}
      />
    </span>
  );
}
