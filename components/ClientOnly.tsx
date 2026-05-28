"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Rendert Kinder erst nach Mount — identisch mit SSR (null), damit keine Hydration-Mismatch
 * bei rein clientseitigen Teilen (localStorage, Window, dynamic ssr:false Kombinationen).
 */
export default function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return <>{children}</>;
}
