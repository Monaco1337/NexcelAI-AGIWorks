"use client";

import Link from "next/link";

/**
 * Minimal-Navigation falls die Haupt-Navigation (Navigation.tsx) einen Fehler wirft.
 * NICHT ENTFERNEN – Teil des Section-Error-Boundary-Systems.
 * Ermöglicht Nutzern weiterhin Navigation (z.B. zu /kontakt), wenn die volle Nav abstürzt.
 */
export default function MinimalNavFallback() {
  return (
    <header
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-14 px-4 sm:px-6 border-b border-white/[0.08]"
      style={{ background: "rgba(11,13,18,0.85)", backdropFilter: "blur(12px)" }}
      role="banner"
    >
      <Link href="/" className="text-white/90 font-medium text-[15px] hover:text-white transition-colors">
        NEXCEL AI
      </Link>
      <Link
        href="/kontakt"
        className="text-[13px] font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-lg px-3 py-1.5 transition-colors"
      >
        Kontakt
      </Link>
    </header>
  );
}
