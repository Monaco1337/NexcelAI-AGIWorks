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
  return getReferencePagesForBrand("agiworks").map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  return generateSeoMetadata({ brand: "agiworks", path: `/projekte/${params.slug}` });
}

export default function AgiWorksReferenceDetailPage({ params }: PageProps) {
  const page = getReferencePage("agiworks", params.slug);
  if (!page) notFound();
  return (
    <>
      <ReferencePageTemplate page={page} />
      <Footer />
    </>
  );
}
