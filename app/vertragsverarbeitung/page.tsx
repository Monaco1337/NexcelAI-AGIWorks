"use client";

import VertragsverarbeitungView from "@/components/legal/VertragsverarbeitungView";
import { NEXCEL_THEME, NEXCEL_ENTITY } from "@/components/legal/legalKit";

export default function VertragsverarbeitungPage() {
  return <VertragsverarbeitungView theme={NEXCEL_THEME} entity={NEXCEL_ENTITY} />;
}
