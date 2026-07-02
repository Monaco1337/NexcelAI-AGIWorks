import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import KnowledgePageTemplate from "@/components/templates/KnowledgePageTemplate";
import { getKnowledgePage, getKnowledgePagesForBrand } from "@/data/knowledgePages";
import { generateSeoMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getKnowledgePagesForBrand("nexcel").map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  return generateSeoMetadata({ brand: "nexcel", path: `/wissen/${params.slug}` });
}

export default function NexcelWissenPage({ params }: PageProps) {
  const page = getKnowledgePage("nexcel", params.slug);
  if (!page) notFound();
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <KnowledgePageTemplate page={page} />
      </div>
      <Footer />
    </div>
  );
}
