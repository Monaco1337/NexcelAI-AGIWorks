"use client";

import dynamic from "next/dynamic";

const AppBackground = dynamic(() => import("@/components/background/AppBackground"), {
  ssr: false,
  loading: () => null,
});
const NeuralCursor = dynamic(() => import("@/components/NeuralCursor"), {
  ssr: false,
  loading: () => null,
});
const CookieBanner = dynamic(() => import("@/components/CookieBanner"), { ssr: false });
const AnalyticsTracker = dynamic(() => import("@/components/AnalyticsTracker"), { ssr: false });
const PerformanceMonitor = dynamic(() => import("@/components/PerformanceMonitor"), { ssr: false });
const PerformanceAuditor = dynamic(() => import("@/components/PerformanceAuditor"), { ssr: false });

export function LayoutClientAmbient() {
  return (
    <>
      <AppBackground />
      <NeuralCursor />
    </>
  );
}

export function LayoutClientRuntime() {
  return (
    <>
      <CookieBanner />
      <AnalyticsTracker />
      <PerformanceMonitor />
      <PerformanceAuditor />
    </>
  );
}
