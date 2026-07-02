import Footer from "@/components/Footer";
import ProjectsShowcase from "@/components/sections/ProjectsShowcase";

export const metadata = {
  title: "Referenzen – NEXCEL AI",
  description:
    "Reale Projekte, reale Ergebnisse. Entdecke unsere Case Studies: Buchungssysteme, CRM, Lead-Funnels, SaaS-Plattformen und mehr.",
};

export default function ProjektePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <ProjectsShowcase />
        </div>
      <Footer />
    </main>
  );
}
