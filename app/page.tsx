"use client";

import { useTheme } from "@/contexts/ThemeContext";
import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import PremiumHero from "@/components/sections/PremiumHero";
import ReferenceBar from "@/components/sections/ReferenceBar";
import { SectionErrorBoundary } from "@/components/ErrorBoundaries";

// Premium-Enterprise-Startseite — Reihenfolge:
//   PremiumHero            (Hero — Gründerbild + Dual-Brand-Card)
//   → ReferenceBar         (Referenzleiste)
//   → ProblemSolution      (Problem / Lösung)
//   → SystemsGrid          (Systeme · #systeme)
//   → ProjectsShowcase     (Projekte · #projekte)
//   → TrustKpis            (Vertrauens-Kennzahlen)
//   → PricingSection       (Preise · #preise)
//   → FoundersCta          (Gründerkontakt)
//   → Footer

const ProblemSolutionSection = dynamic(
  () => import("@/components/sections/ProblemSolutionSection"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const SystemsGrid = dynamic(() => import("@/components/sections/SystemsGrid"), {
  ssr: true,
  loading: () => <div className="h-64 bg-transparent" />,
});

const ProjectsShowcase = dynamic(
  () => import("@/components/sections/ProjectsShowcase"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const TrustKpis = dynamic(() => import("@/components/sections/TrustKpis"), {
  ssr: true,
  loading: () => <div className="h-40 bg-transparent" />,
});

const PricingSection = dynamic(
  () => import("@/components/sections/PricingSection"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const FoundersCta = dynamic(() => import("@/components/sections/FoundersCta"), {
  ssr: true,
  loading: () => <div className="h-64 bg-transparent" />,
});

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
      <SectionErrorBoundary sectionName="Premium Hero">
        <PremiumHero />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Referenzleiste">
        <ReferenceBar />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Problem / Lösung">
        <ProblemSolutionSection />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Systeme">
        <SystemsGrid />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Projekte">
        <ProjectsShowcase />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Trust KPIs">
        <TrustKpis />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Preise">
        <PricingSection />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Gründerkontakt">
        <FoundersCta />
      </SectionErrorBoundary>
      <Footer />
    </main>
  );
}
