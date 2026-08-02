import type { Metadata } from "next";
import Footer from "@/components/Footer";
import SiteOverviewTemplate from "@/components/templates/SiteOverviewTemplate";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return generateSeoMetadata({ brand: "agiworks", path: "/uebersicht" });
}

export default function AgiWorksSiteOverviewPage() {
  return (
    <>
      <SiteOverviewTemplate brand="agiworks" brandName="AGI Works" />
      <Footer />
    </>
  );
}
