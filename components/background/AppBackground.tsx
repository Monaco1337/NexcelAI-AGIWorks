"use client";

/**
 * Unified App Background Component
 *
 * Stabile Darstellung: fester dunkler Hintergrund ohne Canvas/Blur,
 * um Render-Fehler (z. B. vertikale Streifen) zu vermeiden.
 */
export default function AppBackground() {
  return (
    <div
      className="fixed inset-0 -z-10"
      style={{
        background: "var(--bg-0, #0B0D12)",
      }}
      aria-hidden
    />
  );
}

