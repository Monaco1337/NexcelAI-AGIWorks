"use client";

import { useTheme } from "@/contexts/ThemeContext";
import dynamic from "next/dynamic";
import Footer from "@/components/Footer";
import PremiumHero from "@/components/sections/PremiumHero";
import ReferenceBar from "@/components/sections/ReferenceBar";
import { SectionErrorBoundary } from "@/components/ErrorBoundaries";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { organizationSchema, webSiteSchema } from "@/lib/seo/jsonld";

/**
 * AGI WORKS — identische Premium-Enterprise-Architektur wie die NEXCEL-Startseite,
 * unter dem Pfad /agiworks. Differenzierung ausschließlich über Brand-Tokens
 * (BrandProvider). KEINE duplizierten Komponenten.
 *
 * Neue Informationsarchitektur (identisch zu NEXCEL AI):
 *   PremiumHero → ReferenceBar → HowItWorksSection → ProblemSolution
 *   → SystemsGrid → ProjectsShowcase → WhyUsSection → PricingSection
 *   → FoundersCta → Footer
 */

const HowItWorksSection = dynamic(
  () => import("@/components/sections/HowItWorksSection"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

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

const WhyUsSection = dynamic(() => import("@/components/sections/WhyUsSection"), {
  ssr: true,
  loading: () => <div className="h-64 bg-transparent" />,
});

const PricingSection = dynamic(
  () => import("@/components/sections/PricingSection"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const FoundersCta = dynamic(() => import("@/components/sections/FoundersCta"), {
  ssr: true,
  loading: () => <div className="h-64 bg-transparent" />,
});

export default function AgiWorksPage() {
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
      <SeoJsonLd schema={[organizationSchema("agiworks"), webSiteSchema("agiworks")]} />
      <SectionErrorBoundary sectionName="Premium Hero">
        <PremiumHero />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Referenzleiste">
        <ReferenceBar />
      </SectionErrorBoundary>
      <SectionErrorBoundary sectionName="Wie funktioniert das">
        <HowItWorksSection />
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
      <SectionErrorBoundary sectionName="Warum wir">
        <WhyUsSection />
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
