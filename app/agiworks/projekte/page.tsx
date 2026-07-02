import Footer from "@/components/Footer";
import ProjectsShowcase from "@/components/sections/ProjectsShowcase";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/projekte" });

export default function AgiWorksProjektePage() {
  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <div className="pt-[76px] sm:pt-[88px]">
        <ProjectsShowcase />
      </div>
      <Footer />
    </main>
  );
}
