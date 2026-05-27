import { Metadata } from "next";
import NeuralAIBackground from "@/components/NeuralAIBackground";
import NeuralCursor from "@/components/NeuralCursor";

export const metadata: Metadata = {
  title: "Kontakt • NEXCEL AI",
  description: "Kontaktieren Sie NEXCEL AI für maßgeschneiderte KI-Systeme und Softwarelösungen. Beschreiben Sie Ihr Projekt – wir melden uns persönlich zurück.",
  robots: {
    index: true,
    follow: true,
  },
};

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
