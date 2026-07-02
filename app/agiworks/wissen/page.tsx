import type { Metadata } from "next";
import Footer from "@/components/Footer";
import HubTemplate from "@/components/templates/HubTemplate";
import { getKnowledgePagesForBrand } from "@/data/knowledgePages";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import { buildCanonical } from "@/lib/seo/canonical";

const BRAND = "agiworks" as const;
const PATH = "/wissen";

export function generateMetadata(): Metadata {
  return generateSeoMetadata({ brand: BRAND, path: PATH });
}

export default function AgiworksWissenHub() {
  const items = getKnowledgePagesForBrand(BRAND).map((p) => ({
    href: p.path,
    title: p.title,
    description: p.description,
  }));
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <HubTemplate
          brand={BRAND}
          canonicalUrl={buildCanonical(BRAND, PATH)}
          eyebrow="AGI Works"
          breadcrumbLabel="Wissen"
          title="Wissen"
          intro="Erklärungen und Leitfäden rund um Softwareentwicklung, Web-Apps und ERP — sachlich, ohne Buzzwords, für fundierte Entscheidungen."
          itemsHeading="Alle Beiträge"
          items={items}
        />
      </div>
      <Footer />
    </div>
  );
}
