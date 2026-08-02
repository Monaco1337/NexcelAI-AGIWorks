import type { Metadata } from "next";
import Footer from "@/components/Footer";
import PressPageTemplate from "@/components/templates/PressPageTemplate";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export function generateMetadata(): Metadata {
  return generateSeoMetadata({ brand: "nexcel", path: "/presse" });
}

export default function NexcelPressPage() {
  return (
    <>
      <PressPageTemplate brand="nexcel" />
      <Footer />
    </>
  );
}
