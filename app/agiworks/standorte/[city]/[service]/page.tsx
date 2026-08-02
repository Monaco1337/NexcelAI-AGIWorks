import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import CityServiceTemplate from "@/components/templates/CityServiceTemplate";
import { getCityServicePage, getCityServicePagesForBrand } from "@/data/cityServicePages";
import { generateSeoMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: { city: string; service: string };
}

export function generateStaticParams() {
  return getCityServicePagesForBrand("agiworks").map((p) => ({
    city: p.citySlug,
    service: p.serviceSlug,
  }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  return generateSeoMetadata({
    brand: "agiworks",
    path: `/standorte/${params.city}/${params.service}`,
  });
}

export default function AgiWorksCityServicePage({ params }: PageProps) {
  const page = getCityServicePage("agiworks", params.city, params.service);
  if (!page) notFound();
  return (
    <>
      <CityServiceTemplate page={page} />
      <Footer />
    </>
  );
}
