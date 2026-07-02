import Footer from "@/components/Footer";
import PricingSection from "@/components/sections/PricingSection";

export const metadata = {
  title: "Preise – NEXCEL AI",
  description:
    "Transparente Preiskorridore für individuelle digitale Systeme. Websysteme, Buchungssysteme, CRM, ERP und KI-Automatisierungen.",
};

export default function PreisePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <PricingSection />
      </div>
      <Footer />
    </main>
  );
}
