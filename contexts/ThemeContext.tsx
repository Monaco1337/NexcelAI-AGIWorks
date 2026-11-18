"use client";

import { createContext, useContext, useEffect } from "react";

/** Public brands deliberately ship a single, stable premium-dark theme. */
type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  /** Backward-compatible API; switching to light has been disabled. */
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
const DARK_THEME: ThemeContextType = {
  theme: "dark",
  toggleTheme: () => {
    // Intentionally inert: a persisted light preference must never alter branding.
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light");
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    try {
      // Remove the old preference so devices cannot revert on the next visit.
      localStorage.removeItem("theme");
    } catch {
      // Private browsing or blocked storage: DOM still remains dark.
    }
  }, []);
  return <ThemeContext.Provider value={DARK_THEME}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextType {
  return useContext(ThemeContext) ?? DARK_THEME;
}
