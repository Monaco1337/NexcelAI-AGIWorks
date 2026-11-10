"use client";
import "./homeflow.css";

import { useTheme } from "@/contexts/ThemeContext";
import Footer from "@/components/Footer";
import dynamic from "next/dynamic";
import PremiumHero from "@/components/sections/PremiumHero";
import ReferenceBar from "@/components/sections/ReferenceBar";
import { SectionErrorBoundary } from "@/components/ErrorBoundaries";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { organizationSchema, webSiteSchema } from "@/lib/seo/jsonld";
import {
  NexcelProblemSection,
  NexcelSolutionsSection,
  NexcelDeliverySection,
  NexcelTrustSection,
  NexcelInvestmentSection,
} from "@/components/sections/NexcelGrowthSections";

const ProjectsShowcase = dynamic(() => import("@/components/sections/ProjectsShowcase"), { ssr: true, loading: () => <div className="min-h-[400px] bg-transparent" /> });
const FoundersCta = dynamic(() => import("@/components/sections/FoundersCta"), { ssr: true, loading: () => <div className="min-h-[360px] bg-transparent" /> });

// Diese Route bedient die NEXCEL-AI-Startseite. AGI Works besitzt /agiworks/page.tsx.

export default function Home() {
  const { theme } = useTheme();
  return (
    <main className={`ds-app homeflow-main homeflow--nexcel ${theme === "dark" ? "hf-dark" : "hf-light"} relative min-h-screen overflow-x-hidden`} style={{ background: theme === "dark" ? "var(--homeflow-background, transparent)" : "transparent", color: theme === "dark" ? "#FFFFFF" : "#0C0F1A", position: "relative", zIndex: 10, minHeight: "100vh" }}>
      <SeoJsonLd schema={[organizationSchema("nexcel"), webSiteSchema("nexcel")]} />
      <SectionErrorBoundary sectionName="NEXCEL AI Hero"><PremiumHero /></SectionErrorBoundary>
      <div className="homeflow-logo">
        <SectionErrorBoundary sectionName="Referenzleiste">
          <ReferenceBar />
        </SectionErrorBoundary>
      </div>

      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="KI und Prozesse"><NexcelProblemSection /></SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Anwendungsfaelle"><NexcelSolutionsSection /></SectionErrorBoundary>
      </div>
      {/* NEXCEL_LLM_SERVICE_V1: eigene LLM-Entwicklung */}

      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Referenzen"><ProjectsShowcase /></SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Vorgehen"><NexcelDeliverySection /></SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Vertrauen"><NexcelTrustSection /></SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Investition"><NexcelInvestmentSection /></SectionErrorBoundary>
      </div>
      <div className="homeflow-segment">
      <SectionErrorBoundary sectionName="Gruenderkontakt"><FoundersCta /></SectionErrorBoundary>
      </div>
      <Footer />
    </main>
  );
}
