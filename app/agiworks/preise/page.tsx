import Footer from "@/components/Footer";
import PricingSection from "@/components/sections/PricingSection";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/preise" });

export default function AgiWorksPreisePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <PricingSection />
      </div>
      <Footer />
    </main>
  );
}
