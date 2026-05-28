import type { Metadata } from "next";
import { agiworksBrand } from "@/data/brands/agiworks";

export const metadata: Metadata = {
  title: "AGI Works – Über uns",
  description:
    "AGI Works — KI-Architektur und Enterprise-Systeme unter der Leitung von Kevin Blazevic. Wir bauen autonome Infrastrukturen, keine Software von der Stange.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "AGI Works – Über uns",
    description: agiworksBrand.about.heroLead,
    type: "website",
    siteName: "AGI Works",
  },
};

export default function AgiWorksUeberMichLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
