"use client";

import DatenschutzView from "@/components/legal/DatenschutzView";
import { NEXCEL_THEME, NEXCEL_ENTITY } from "@/components/legal/legalKit";

export default function DatenschutzPage() {
  return <DatenschutzView theme={NEXCEL_THEME} entity={NEXCEL_ENTITY} />;
}
