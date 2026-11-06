"use client";
import "../homeflow.css";

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

const AgiCoreServices = dynamic(
  () => import("@/components/sections/AgiCoreServices"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const AgiWorkflowPremium = dynamic(
  () => import("@/components/sections/AgiWorkflowPremium"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const AgiSystemsCarousel = dynamic(() => import("@/components/sections/AgiSystemsCarousel"), {
  ssr: true,
  loading: () => <div className="h-64 bg-transparent" />,
});

const ProjectsShowcase = dynamic(
  () => import("@/components/sections/ProjectsShowcase"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const AgiWhyUsEditorial = dynamic(() => import("@/components/sections/AgiWhyUsEditorial"), {
  ssr: true,
  loading: () => <div className="h-64 bg-transparent" />,
});

const PricingSection = dynamic(
  () => import("@/components/sections/AgiPricingEditorial"),
  { ssr: true, loading: () => <div className="h-64 bg-transparent" /> }
);

const FoundersCta = dynamic(() => import("@/components/sections/AgiFoundersPremium"), {
  ssr: true,
  loading: () => <div className="h-64 bg-transparent" />,
});

export default function AgiWorksPage() {
  const { theme } = useTheme();

  return (
    <main
      className={`ds-app homeflow-main homeflow--agiworks ${theme === "dark" ? "hf-dark" : "hf-light"} relative min-h-screen overflow-x-hidden`}
      style={{
        background: theme === "dark" ? "var(--homeflow-background, transparent)" : "transparent",
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
      <div className="homeflow-logo">
      <SectionErrorBoundary sectionName="Referenzleiste">
        <ReferenceBar />
      </SectionErrorBoundary>
      </div>

      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="AGI Kernleistungen">
        <AgiCoreServices />
      </SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="AGI Premium Workflow">
        <AgiWorkflowPremium />
      </SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Systeme">
        <AgiSystemsCarousel />
      </SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Projekte">
        <ProjectsShowcase />
      </SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Warum wir">
        <AgiWhyUsEditorial />
      </SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Preise">
        <PricingSection />
      </SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Gründerkontakt">
        <FoundersCta />
      </SectionErrorBoundary>
      </div>
      <Footer />
    </main>
  );
}
