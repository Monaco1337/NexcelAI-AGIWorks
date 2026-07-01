"use client";

import CookieRichtlinieView from "@/components/legal/CookieRichtlinieView";
import { AGI_THEME, AGI_ENTITY } from "@/components/legal/legalKit";

export default function AgiWorksCookieRichtliniePage() {
  return <CookieRichtlinieView theme={AGI_THEME} entity={AGI_ENTITY} />;
}
