"use client";

/**
 * NavigationGate
 *
 * Globale Premium-Navigation auf den Public-Seiten.
 * Auf /admin/* und /login wird die Navigation komplett unterdrückt —
 * der Admin-Bereich liefert seine eigene Top-Leiste (siehe AdminDashboard).
 */

import { usePathname } from "next/navigation";
import Navigation from "@/components/Navigation";

const HIDDEN_PREFIXES = ["/admin", "/login"];

export default function NavigationGate() {
  const pathname = usePathname() ?? "/";
  const hide = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (hide) return null;
  return <Navigation />;
}
