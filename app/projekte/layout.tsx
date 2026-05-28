import type { Metadata } from "next";
import NeuralAIBackground from "@/components/NeuralAIBackground";
import NeuralCursor from "@/components/NeuralCursor";

export const metadata: Metadata = {
  title: "NEXCEL AI – Projekte",
  description: "Systeme, die Zukunft bauen. NEXCEL OS, AI-Automation Engine, CRM-System, Projektmanagement, Speditionssystem und Website-Development.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function ProjekteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* Neural AI Energy Background */}
      <NeuralAIBackground />
      
      {/* Neural Cursor */}
      <NeuralCursor />
      
      {/* Content with proper z-index */}
      <div className="relative z-10">
        {children}
      </div>
    </>
  );
}

