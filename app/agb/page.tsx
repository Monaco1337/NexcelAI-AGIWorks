"use client";

import AgbView from "@/components/legal/AgbView";
import { NEXCEL_THEME, NEXCEL_ENTITY } from "@/components/legal/legalKit";

export default function AgbPage() {
  return <AgbView theme={NEXCEL_THEME} entity={NEXCEL_ENTITY} />;
}
