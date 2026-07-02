import type { Metadata } from "next";
import Footer from "@/components/Footer";
import HubTemplate from "@/components/templates/HubTemplate";
import { getLocationPagesForBrand } from "@/data/locationPages";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import { buildCanonical } from "@/lib/seo/canonical";

const BRAND = "agiworks" as const;
const PATH = "/standorte";

export function generateMetadata(): Metadata {
  return generateSeoMetadata({ brand: BRAND, path: PATH });
}

export default function AgiworksStandorteHub() {
  const items = getLocationPagesForBrand(BRAND).map((p) => ({
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
          eyebrow="AGI Works"
          breadcrumbLabel="Standorte"
          title="Standorte"
          intro="AGI Works entwickelt Software für Unternehmen in Nordrhein-Westfalen und deutschlandweit — remote und vor Ort nach Vereinbarung. Regionale Schwerpunkte im Überblick."
          itemsHeading="Regionen im Überblick"
          items={items}
        />
      </div>
      <Footer />
    </div>
  );
}
