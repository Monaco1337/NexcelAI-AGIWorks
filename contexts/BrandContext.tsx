"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { BrandConfig } from "@/types/brand";
import { getBrandFromPathname, agiworksBrand } from "@/data/brands";

// ─── Context ─────────────────────────────────────────────────────────────────

const BrandContext = createContext<BrandConfig | null>(null);

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useBrand(): BrandConfig {
  const ctx = useContext(BrandContext);
  if (!ctx) {
    throw new Error("useBrand() must be used inside <BrandProvider>");
  }
  return ctx;
}

// ─── Provider ────────────────────────────────────────────────────────────────

interface BrandProviderProps {
  children: ReactNode;
  /**
   * Optional: Force a specific brand config (e.g. in nested route layouts).
   * If not provided, the brand is auto-detected from the current pathname.
   */
  override?: BrandConfig;
}

export function BrandProvider({ children, override }: BrandProviderProps) {
  const pathname = usePathname();

  const brand = useMemo(() => {
    if (override) return override;
    // Host-based detection mirrors the middleware rewrite:
    // when the URL hostname is agiworks.de the user-facing pathname is "/",
    // but the active brand must still be AGI Works.
    if (typeof window !== "undefined") {
      const host = window.location.hostname.toLowerCase();
      if (host.includes("agiworks")) return agiworksBrand;
    }
    return getBrandFromPathname(pathname ?? "/");
  }, [pathname, override]);

  // Inject CSS variables onto :root so all components with var(--accent) etc.
  // automatically pick up the brand's accent colors.
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(brand.theme.cssVars).forEach(([key, value]) => {
      if (value !== undefined) root.style.setProperty(key, value);
    });

    // Store the active brand id as a data attribute for conditional CSS if needed.
    root.setAttribute("data-brand", brand.id);

    return () => {
      // On unmount reset to nexcel defaults (safety net).
      // In practice this only fires on hot-reload or full unmount.
    };
  }, [brand]);

  return (
    <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>
  );
}
