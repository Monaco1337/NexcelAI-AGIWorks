"use client";

import DatenschutzView from "@/components/legal/DatenschutzView";
import { AGI_THEME, AGI_ENTITY } from "@/components/legal/legalKit";

export default function AgiWorksDatenschutzPage() {
  return <DatenschutzView theme={AGI_THEME} entity={AGI_ENTITY} />;
}
