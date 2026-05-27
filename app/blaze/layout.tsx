import type { Metadata } from "next";
import { blazeBrand } from "@/data/brands/blaze";

export const metadata: Metadata = {
  title: blazeBrand.seo.title,
  description: blazeBrand.seo.description,
  openGraph: {
    title: blazeBrand.seo.ogTitle,
    description: blazeBrand.seo.ogDescription,
    type: "website",
  },
};

export default function BlazeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
