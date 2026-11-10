import Footer from "@/components/Footer";
import PricingSection from "@/components/sections/PricingSection";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "nexcel", path: "/preise" });

import NexcelLlmService from "@/components/sections/NexcelLlmService";

export default function PreisePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <PricingSection />
        <NexcelLlmService kind="pricing" />
      </div>
      <Footer />
    </main>
  );
}
