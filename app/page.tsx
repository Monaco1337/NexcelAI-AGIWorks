"use client";

import { useTheme } from "@/contexts/ThemeContext";
import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import DiagnosticsHero from "@/components/diagnostics/DiagnosticsHero";
import { SectionErrorBoundary } from "@/components/ErrorBoundaries";

// Reihenfolge:
//   DiagnosticsHero            (Hero — Unternehmensdiagnostik)
//   → OperatingTransformation  (Section 2 — Chaos)
//   → SystemSynchronization    (Section 3 — Synchronisation, Übergang)
//   → SystemsInDeployment      (Section 4 — Systeme im Einsatz)
//   → Footer

const OperatingTransformationSection = dynamic(
  () => import("@/components/sections/OperatingTransformationSection"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const SystemSynchronizationSection = dynamic(
  () => import("@/components/sections/SystemSynchronizationSection"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const SystemsInDeployment = dynamic(
  () => import("@/components/sections/SystemsInDeployment"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

export default function Home() {
  const { theme } = useTheme();
  return (
    <main
      className="ds-app relative min-h-screen overflow-x-hidden"
      style={{
        background: "transparent",
        color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
        position: "relative",
        zIndex: 10,
        minHeight: "100vh",
      }}
    >
      <DiagnosticsHero />
      <SectionErrorBoundary sectionName="Operating Transformation">
        <OperatingTransformationSection />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="System Synchronisation">
        <SystemSynchronizationSection />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Systeme im Einsatz">
        <SystemsInDeployment />
      </SectionErrorBoundary>
      <Footer />
    </main>
  );
}
