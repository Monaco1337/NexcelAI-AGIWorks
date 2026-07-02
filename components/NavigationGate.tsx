"use client";

/**
 * NavigationGate
 *
 * Globale Premium-Navigation auf den Public-Seiten.
 * Auf /admin/* und /login wird die Navigation komplett unterdrückt —
 * der Admin-Bereich liefert seine eigene Top-Leiste (siehe AdminDashboard).
 *
 * /systemanalyse und /agiworks/systemanalyse (der kurze "SimpleSystemanalyse"-
 * Flow) bringen ebenfalls ihren eigenen minimalen Header mit (Logo +
 * Schließen-Button). Ohne diesen Ausschluss läge die fixierte globale
 * Navigation über diesem Header und erzeugte ein doppeltes Logo.
 * /systemanalyse/deep ist bewusst NICHT ausgeschlossen — dieser Flow hat
 * keinen eigenen Logo-Header und verlässt sich auf die globale Navigation
 * (siehe Top-Padding in app/systemanalyse/deep/page.tsx).
 */

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";

const HIDDEN_EXACT = ["/admin", "/login", "/systemanalyse", "/agiworks/systemanalyse"];
const HIDDEN_PREFIXES = ["/admin", "/login"];

export default function NavigationGate() {
  const pathname = usePathname() ?? "/";
  const hide =
    HIDDEN_EXACT.includes(pathname) ||
    HIDDEN_PREFIXES.some((p) => pathname.startsWith(`${p}/`));
  if (hide) return null;
  return <Navigation />;
}
