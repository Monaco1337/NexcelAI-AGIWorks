import type { Metadata } from "next";
import Footer from "@/components/Footer";
import PressPageTemplate from "@/components/templates/PressPageTemplate";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return generateSeoMetadata({ brand: "agiworks", path: "/presse" });
}

export default function AgiWorksPressPage() {
  return (
    <>
      <PressPageTemplate brand="agiworks" />
      <Footer />
    </>
  );
}
