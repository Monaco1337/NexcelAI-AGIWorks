import NeuralAIBackground from "@/components/NeuralAIBackground";
import NeuralCursor from "@/components/NeuralCursor";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "nexcel", path: "/projekte" });

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

