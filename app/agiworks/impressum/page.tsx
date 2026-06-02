"use client";

import ImpressumView from "@/components/legal/ImpressumView";
import { AGI_THEME, AGI_ENTITY } from "@/components/legal/legalKit";

export default function AgiWorksImpressumPage() {
  return <ImpressumView theme={AGI_THEME} entity={AGI_ENTITY} />;
}
