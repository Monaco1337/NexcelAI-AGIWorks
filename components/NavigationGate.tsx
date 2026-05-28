"use client";

/**
 * NavigationGate
 *
 * Globale Premium-Navigation auf ALLEN Seiten — inkl. Diagnose-Plattform.
 * Die Hero-Komponente liefert KEINE eigene Top-Leiste mehr; sie reserviert
 * lediglich oberen Whitespace, sodass die fixierte Navigation darüber liegt.
 */

import Navigation from "@/components/Navigation";

export default function NavigationGate() {
  return <Navigation />;
}
