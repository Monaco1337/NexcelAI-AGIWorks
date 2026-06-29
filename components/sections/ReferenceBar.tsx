"use client";

/**
 * NEXCEL AI / AGI WORKS · ReferenceBar
 *
 * Dünner Wrapper für Abwärtskompatibilität — rendert die kuratierte
 * Premium-Kundenlogo-Sektion als langsam laufende Logo-Marquee
 * (CustomerLogoMarquee). Die freigestellten Logos liegen unter
 * /public/logos-clean/ und werden dort gepflegt.
 */

import CustomerLogoMarquee from "@/components/sections/CustomerLogoMarquee";

export default function ReferenceBar() {
  return <CustomerLogoMarquee />;
}
