import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import LocationPageTemplate from "@/components/templates/LocationPageTemplate";
import { getLocationPage, getLocationPagesForBrand } from "@/data/locationPages";
import { generateSeoMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: { city: string };
}

export function generateStaticParams() {
  return getLocationPagesForBrand("agiworks").map((p) => ({ city: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  return generateSeoMetadata({ brand: "agiworks", path: `/standorte/${params.city}` });
}

export default function AgiWorksStandortPage({ params }: PageProps) {
  const page = getLocationPage("agiworks", params.city);
  if (!page) notFound();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <LocationPageTemplate page={page} />
      </div>
      <Footer />
    </div>
  );
}
