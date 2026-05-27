"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackAnalyticsEvent } from "@/app/actions/analytics";

export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Track page view - DIREKT über Server Action, keine API!
    trackAnalyticsEvent("page_view", pathname).catch((error) => {
      console.warn("Analytics tracking error (non-critical):", error);
    });
  }, [pathname]);

  return null;
}

