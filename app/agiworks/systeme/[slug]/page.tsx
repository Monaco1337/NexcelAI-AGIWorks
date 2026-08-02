import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SystemDetailView from "@/components/sections/SystemDetailView";
import SystemRelatedLinks from "@/components/sections/SystemRelatedLinks";
import { SYSTEM_SLUGS } from "@/lib/systems-data";
import { getSystemPage } from "@/data/systemPages";
import { generateSeoMetadata } from "@/lib/seo/metadata";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return SYSTEM_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  return generateSeoMetadata({ brand: "agiworks", path: `/systeme/${params.slug}` });
}

export default function AgiWorksSystemDetailPage({ params }: PageProps) {
  const page = getSystemPage("agiworks", params.slug);
  if (!page) notFound();
  return (
    <SystemDetailView slug={params.slug}>
      <SystemRelatedLinks page={page} />
    </SystemDetailView>
  );
}
