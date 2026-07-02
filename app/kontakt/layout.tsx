import NeuralAIBackground from "@/components/NeuralAIBackground";
import NeuralCursor from "@/components/NeuralCursor";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "nexcel", path: "/kontakt" });

export default function KontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <NeuralAIBackground />
      <NeuralCursor />
      {children}
    </>
  );
}
