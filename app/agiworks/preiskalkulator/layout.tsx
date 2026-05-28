import type { Metadata } from "next";
import { agiworksBrand } from "@/data/brands/agiworks";

export const metadata: Metadata = {
  title: `Preiskalkulator • ${agiworksBrand.name}`,
  description: agiworksBrand.pricingPage.subline,
  robots: {
    index: true,
    follow: true,
  },
};

export default function AgiWorksPreiskalkulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
