"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/** Ohne gespeicherte Wahl: immer dunkel (Marken-Default, Hero-Video). */
function readThemeFromEnvironment(): Theme {
  if (typeof window === "undefined") {
    return "dark";
  }
  try {
    const saved = localStorage.getItem("theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      return saved;
    }
  } catch {
    /* private mode */
  }
  return "dark";
}

function applyThemeToDom(theme: Theme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(theme);
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* noop */
  }
}

// Erster Render: immer „dark“ = identisch mit SSR (layout: html class dark).
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const next = readThemeFromEnvironment();
    setTheme(next);
    applyThemeToDom(next);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      applyThemeToDom(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { theme: "dark" as Theme, toggleTheme: () => {} };
  }
  return context;
}
