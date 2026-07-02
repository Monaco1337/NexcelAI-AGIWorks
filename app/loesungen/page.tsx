import type { Metadata } from "next";
import Footer from "@/components/Footer";
import HubTemplate from "@/components/templates/HubTemplate";
import { getMoneyPagesForBrand } from "@/data/moneyPages";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import { buildCanonical } from "@/lib/seo/canonical";

const BRAND = "nexcel" as const;
const PATH = "/loesungen";

export function generateMetadata(): Metadata {
  return generateSeoMetadata({ brand: BRAND, path: PATH });
}

export default function NexcelLoesungenHub() {
  const items = getMoneyPagesForBrand(BRAND).map((p) => ({
    href: p.path,
    title: p.serviceName,
    description: p.description,
  }));
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <HubTemplate
          brand={BRAND}
          canonicalUrl={buildCanonical(BRAND, PATH)}
          eyebrow="NEXCEL AI"
          breadcrumbLabel="Lösungen"
          title="Lösungen"
          intro="KI-Systeme, Automatisierung und Customer Experience: Lösungen, die reale Prozesse in Unternehmen abbilden — von der Analyse bis zum produktiven Betrieb."
          itemsHeading="Alle Lösungen im Überblick"
          items={items}
        />
      </div>
      <Footer />
    </div>
  );
}
