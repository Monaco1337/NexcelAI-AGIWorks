"use client";

import ImpressumView from "@/components/legal/ImpressumView";
import { NEXCEL_THEME, NEXCEL_ENTITY } from "@/components/legal/legalKit";

export default function ImpressumPage() {
  return <ImpressumView theme={NEXCEL_THEME} entity={NEXCEL_ENTITY} />;
}
