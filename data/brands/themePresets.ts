import type { BrandTheme } from "@/types/brand";

/** CSS custom properties injected by BrandProvider — mirrors app/globals.css presets. */
export function nexcelTheme(): BrandTheme {
  return {
    accentPrimary: "#B78CFF",
    accentSecondary: "#8F6BFF",
    accentGlow: "rgba(183, 140, 255, 0.45)",
    accentRgb: "139, 92, 246",
    cssVars: {
      "--accent": "#B78CFF",
      "--accent-2": "#8F6BFF",
      "--accent-glow": "rgba(183, 140, 255, 0.45)",
      "--accent-rgb": "139, 92, 246",
      "--brand-primary": "#B78CFF",
      "--brand-accent": "#A855F7",
      "--brand-glow": "rgba(124, 92, 255, 0.25)",
      "--brand-gradient": "linear-gradient(135deg, #B78CFF 0%, #6D28D9 100%)",
      "--brand-bg-top": "#020205",
      "--brand-bg-mid": "#050518",
      "--brand-bg-bottom": "#0a0420",
      "--brand-line-dim": "rgba(167, 139, 250, 0.30)",
      "--brand-line-mid": "rgba(167, 139, 250, 0.65)",
      "--brand-line-bright": "rgba(245, 238, 255, 0.95)",
      "--brand-glow-soft": "rgba(124, 58, 237, 0.06)",
      "--brand-glow-mid": "rgba(124, 58, 237, 0.18)",
      "--brand-glow-strong": "rgba(124, 58, 237, 0.42)",
      "--brand-burst-core": "rgba(245, 238, 255, 0.40)",
      "--brand-burst-mid": "rgba(196, 181, 253, 0.32)",
      "--brand-burst-tail": "rgba(124, 58, 237, 0.10)",
      "--brand-plateau-1": "rgba(76, 29, 149, 0.05)",
      "--brand-plateau-2": "rgba(109, 40, 217, 0.14)",
      "--brand-plateau-3": "rgba(124, 58, 237, 0.26)",
      "--brand-plateau-4": "rgba(139, 92, 246, 0.36)",
      "--brand-plateau-5": "rgba(167, 139, 250, 0.42)",
      "--brand-card-border": "rgba(196, 181, 253, 0.14)",
      "--brand-card-glow": "rgba(124, 58, 237, 0.10)",
      "--brand-card-glow-hover": "rgba(124, 58, 237, 0.30)",
      "--brand-headline-gradient":
        "linear-gradient(120deg, #F5F3FF 0%, #C4B5FD 50%, #8B5CF6 100%)",
      "--brand-wash":
        "linear-gradient(90deg, rgba(167, 139, 250, 0.95) 0%, rgba(124, 58, 237, 0.85) 60%, rgba(124, 58, 237, 0) 100%)",
      "--brand-pill-active": "rgba(124, 58, 237, 0.85)",
      "--brand-pill-active-glow": "rgba(167, 139, 250, 0.40)",
    },
  };
}

export function agiworksTheme(): BrandTheme {
  return {
    accentPrimary: "#5BB8FF",
    accentSecondary: "#3A8EE6",
    accentGlow: "rgba(58, 142, 230, 0.30)",
    accentRgb: "91, 184, 255",
    cssVars: {
      "--accent": "#5BB8FF",
      "--accent-2": "#3A8EE6",
      "--accent-glow": "rgba(58, 142, 230, 0.30)",
      "--accent-rgb": "91, 184, 255",
      "--brand-primary": "#5BB8FF",
      "--brand-accent": "#3A8EE6",
      "--brand-glow": "rgba(58, 142, 230, 0.30)",
      "--brand-gradient": "linear-gradient(135deg, #7CCBFF 0%, #1E5A99 100%)",
      "--brand-bg-top": "#020308",
      "--brand-bg-mid": "#04081a",
      "--brand-bg-bottom": "#031024",
      "--brand-line-dim": "rgba(125, 190, 255, 0.30)",
      "--brand-line-mid": "rgba(125, 190, 255, 0.65)",
      "--brand-line-bright": "rgba(235, 245, 255, 0.95)",
      "--brand-glow-soft": "rgba(58, 142, 230, 0.06)",
      "--brand-glow-mid": "rgba(58, 142, 230, 0.18)",
      "--brand-glow-strong": "rgba(58, 142, 230, 0.42)",
      "--brand-burst-core": "rgba(235, 245, 255, 0.40)",
      "--brand-burst-mid": "rgba(165, 205, 245, 0.32)",
      "--brand-burst-tail": "rgba(58, 142, 230, 0.10)",
      "--brand-plateau-1": "rgba(30, 90, 153, 0.05)",
      "--brand-plateau-2": "rgba(40, 110, 180, 0.14)",
      "--brand-plateau-3": "rgba(58, 142, 230, 0.26)",
      "--brand-plateau-4": "rgba(91, 184, 255, 0.36)",
      "--brand-plateau-5": "rgba(124, 203, 255, 0.42)",
      "--brand-card-border": "rgba(165, 205, 245, 0.14)",
      "--brand-card-glow": "rgba(58, 142, 230, 0.10)",
      "--brand-card-glow-hover": "rgba(58, 142, 230, 0.30)",
      "--brand-headline-gradient":
        "linear-gradient(120deg, #F0F7FF 0%, #B5D8FF 50%, #3A8EE6 100%)",
      "--brand-wash":
        "linear-gradient(90deg, rgba(125, 190, 255, 0.95) 0%, rgba(58, 142, 230, 0.85) 60%, rgba(58, 142, 230, 0) 100%)",
      "--brand-pill-active": "rgba(58, 142, 230, 0.85)",
      "--brand-pill-active-glow": "rgba(125, 190, 255, 0.40)",
    },
  };
}
