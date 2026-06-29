"use client";

import AgbView from "@/components/legal/AgbView";
import { AGI_THEME, AGI_ENTITY } from "@/components/legal/legalKit";

export default function AgiworksAgbPage() {
  return <AgbView theme={AGI_THEME} entity={AGI_ENTITY} />;
}
