import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import MoneyPageTemplate from "@/components/templates/MoneyPageTemplate";
import { getMoneyPage, getMoneyPagesForBrand } from "@/data/moneyPages";
import { generateSeoMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getMoneyPagesForBrand("nexcel").map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  return generateSeoMetadata({ brand: "nexcel", path: `/loesungen/${params.slug}` });
}

export default function NexcelLoesungPage({ params }: PageProps) {
  const page = getMoneyPage("nexcel", params.slug);
  if (!page) notFound();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <MoneyPageTemplate page={page} />
      </div>
      <Footer />
    </div>
  );
}
