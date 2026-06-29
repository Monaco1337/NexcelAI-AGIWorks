"use client";

import VertragsverarbeitungView from "@/components/legal/VertragsverarbeitungView";
import { AGI_THEME, AGI_ENTITY } from "@/components/legal/legalKit";

export default function AgiworksVertragsverarbeitungPage() {
  return <VertragsverarbeitungView theme={AGI_THEME} entity={AGI_ENTITY} />;
}
