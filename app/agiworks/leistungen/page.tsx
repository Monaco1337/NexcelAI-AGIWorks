import type { Metadata } from "next";
import Footer from "@/components/Footer";
import HubTemplate from "@/components/templates/HubTemplate";
import { getMoneyPagesForBrand } from "@/data/moneyPages";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import { buildCanonical } from "@/lib/seo/canonical";

const BRAND = "agiworks" as const;
const PATH = "/leistungen";

export function generateMetadata(): Metadata {
  return generateSeoMetadata({ brand: BRAND, path: PATH });
}

export default function AgiworksLeistungenHub() {
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
          eyebrow="AGI Works"
          breadcrumbLabel="Leistungen"
          title="Leistungen"
          intro="Softwareentwicklung von Web-Apps über SaaS bis ERP und CRM: individuelle Systeme, die reale Prozesse abbilden — von der Architektur bis zum Betrieb."
          itemsHeading="Alle Leistungen im Überblick"
          items={items}
        />
      </div>
      <Footer />
    </div>
  );
}
