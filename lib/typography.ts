/**
 * Central Typography System
 * Based on Contact Page as the visual benchmark
 * Apple/Tesla-level consistency across all pages
 */

export const typography = {
  // Gradient Colors - Pure Purple Only (No Blue)
  gradient: {
    from: "#F1E9FF",
    via: "#C6A8FF", 
    to: "#8A5CFF",
    // Contact page uses pure purple
    contact: {
      from: "#F1E9FF",
      via: "#C6A8FF",
      to: "#8A5CFF",
    },
  },

  // Animation Durations
  animation: {
    headline: {
      duration: 0.7,
      delay: 0.1,
      easing: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
    gradient: {
      duration: 5,
      easing: "linear",
    },
  },

  // Text Colors
  colors: {
    primary: "rgba(255, 255, 255, 0.95)",
    secondary: "rgba(229, 231, 235, 0.9)",
    body: "rgba(255, 255, 255, 0.85)",
  },

  // Glow Effects - Pure Purple Only
  glow: {
    soft: "0 0 20px rgba(180, 140, 255, 0.25), 0 0 40px rgba(138, 92, 255, 0.15)",
    medium: "0 0 30px rgba(180, 140, 255, 0.35), 0 0 60px rgba(138, 92, 255, 0.25)",
  },
};

/**
 * Get gradient text styles for H1 headlines
 */
export function getGradientTextStyles(variant: "default" | "contact" = "contact") {
  const colors = variant === "contact" ? typography.gradient.contact : typography.gradient;
  
  return {
    background: `linear-gradient(to right, ${colors.from}, ${colors.via}, ${colors.to})`,
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    backgroundClip: "text",
    backgroundSize: "200%",
    filter: "drop-shadow(0 0 20px rgba(164, 92, 255, 0.3))",
  };
}

/**
 * Get animation props for headlines
 */
export function getHeadlineAnimation() {
  return {
    initial: { opacity: 0, y: 20, filter: "blur(6px)" },
    animate: { opacity: 1, y: 0, filter: "blur(0px)" },
    transition: {
      duration: typography.animation.headline.duration,
      delay: typography.animation.headline.delay,
      ease: typography.animation.headline.easing,
    },
  };
}

/**
 * Get gradient animation for text
 */
export function getGradientAnimation() {
  return {
    backgroundPosition: ["0%", "100%", "0%"],
    transition: {
      duration: typography.animation.gradient.duration,
      repeat: Infinity,
      ease: typography.animation.gradient.easing,
    },
  };
}

