import type { Metadata } from "next";
import Footer from "@/components/Footer";
import SiteOverviewTemplate from "@/components/templates/SiteOverviewTemplate";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return generateSeoMetadata({ brand: "nexcel", path: "/uebersicht" });
}

export default function NexcelSiteOverviewPage() {
  return (
    <>
      <SiteOverviewTemplate brand="nexcel" brandName="NEXCEL AI" />
      <Footer />
    </>
  );
}
