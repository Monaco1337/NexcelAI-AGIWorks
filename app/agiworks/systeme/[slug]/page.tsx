import type { Metadata } from "next";
import SystemDetailView from "@/components/sections/SystemDetailView";
import { getSystemBySlug, SYSTEM_SLUGS } from "@/lib/systems-data";

interface PageProps {
  params: { slug: string };
}

export function generateStaticParams() {
  return SYSTEM_SLUGS.map((slug) => ({ slug }));
}

export function generateMetadata({ params }: PageProps): Metadata {
  const system = getSystemBySlug(params.slug);
  if (!system) return { title: "System • AGI Works" };
  return {
    title: `${system.title} • AGI Works`,
    description: system.longDesc,
  };
}

export default function AgiWorksSystemDetailPage({ params }: PageProps) {
  return <SystemDetailView slug={params.slug} />;
}
