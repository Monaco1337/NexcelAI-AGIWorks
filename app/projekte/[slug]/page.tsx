import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Footer from "@/components/Footer";
import ReferencePageTemplate from "@/components/templates/ReferencePageTemplate";
import { getReferencePage, getReferencePagesForBrand } from "@/data/referencePages";
import { generateSeoMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return getReferencePagesForBrand("nexcel").map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  return generateSeoMetadata({ brand: "nexcel", path: `/projekte/${params.slug}` });
}

export default function NexcelReferenceDetailPage({ params }: PageProps) {
  const page = getReferencePage("nexcel", params.slug);
  if (!page) notFound();
  return (
    <>
      <ReferencePageTemplate page={page} />
      <Footer />
    </>
  );
}
