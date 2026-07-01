import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import PricingSection from "@/components/sections/PricingSection";

export const metadata = {
  title: "Preise – AGI Works",
  description:
    "Transparente Preiskorridore für individuelle digitale Systeme. Websysteme, Buchungssysteme, CRM, ERP und KI-Automatisierungen.",
};

export default function AgiWorksPreisePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <Navigation />
      <div className="pt-[76px] sm:pt-[88px]">
        <PricingSection />
      </div>
      <Footer />
    </main>
  );
}
