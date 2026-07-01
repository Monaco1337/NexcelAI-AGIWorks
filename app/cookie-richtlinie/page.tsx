"use client";

import CookieRichtlinieView from "@/components/legal/CookieRichtlinieView";
import { NEXCEL_THEME, NEXCEL_ENTITY } from "@/components/legal/legalKit";

export default function CookieRichtliniePage() {
  return <CookieRichtlinieView theme={NEXCEL_THEME} entity={NEXCEL_ENTITY} />;
}
