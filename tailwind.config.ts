import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        'nav-mobile': {'max': '980px'}, // Breakpoint für Mobile Navigation
      },
      colors: {
        purple: {
          neon: "#6B2DB8",
          soft: "#8B6DB8",
          light: "#A68BC7",
          glow: "rgba(107, 45, 184, 0.35)",
          glowSoft: "rgba(139, 109, 184, 0.25)",
        },
        dark: {
          ai: "#0C0F1A",
          navy: "#111622",
          night: "#1B2030",
        },
        text: {
          primary: "#FFFFFF",
          secondary: "#E5E7EB",
          accent: "#8B6DB8",
        },
        primary: {
          purple: "#6B2DB8",
          lavender: "#8B6DB8",
          lilac: "#A68BC7",
        },
      },
      borderRadius: {
        neural: "12px",
        neuralSm: "8px",
        neuralLg: "16px",
      },
      boxShadow: {
        purple: "0 2px 8px rgba(107, 45, 184, 0.15), 0 0 0 1px rgba(139, 109, 184, 0.2)",
        purpleHover: "0 8px 24px rgba(107, 45, 184, 0.25), 0 0 0 1px rgba(107, 45, 184, 0.4)",
        purpleGlow: "0 0 30px rgba(107, 45, 184, 0.3), 0 0 60px rgba(139, 109, 184, 0.15)",
        hologram: "0 0 40px rgba(107, 45, 184, 0.2), inset 0 0 20px rgba(139, 109, 184, 0.1)",
      },
      fontFamily: {
        sans: ['var(--font-body)', '-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        headline: ['var(--font-headline)', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        neuralPulse: "neuralPulse 4s ease-in-out infinite",
        synapseFlow: "synapseFlow 8s ease-in-out infinite",
        hologramFloat: "hologramFloat 6s ease-in-out infinite",
        energyWave: "energyWave 3s ease-in-out infinite",
        magneticPull: "magneticPull 0.3s ease-out",
      },
      keyframes: {
        neuralPulse: {
          "0%, 100%": { opacity: "0.3", transform: "scale(1)" },
          "50%": { opacity: "0.6", transform: "scale(1.05)" },
        },
        synapseFlow: {
          "0%": { transform: "translateX(-100%) translateY(0)" },
          "100%": { transform: "translateX(100%) translateY(-20px)" },
        },
        hologramFloat: {
          "0%, 100%": { transform: "translateY(0px) translateZ(0)" },
          "50%": { transform: "translateY(-8px) translateZ(0)" },
        },
        energyWave: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "0.8", transform: "scale(1.02)" },
        },
        magneticPull: {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.05)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

