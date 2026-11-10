import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import AgiWorksPremiumDetail from "@/components/templates/AgiWorksPremiumDetail";
import { getMoneyPage, getMoneyPagesForBrand } from "@/data/moneyPages";
import { generateSeoMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getMoneyPagesForBrand("agiworks").map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  return generateSeoMetadata({ brand: "agiworks", path: `/leistungen/${params.slug}` });
}

export default function AgiWorksLeistungPage({ params }: PageProps) {
  const page = getMoneyPage("agiworks", params.slug);
  if (!page) notFound();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <AgiWorksPremiumDetail page={page} />
      </div>
      <Footer />
    </div>
  );
}
