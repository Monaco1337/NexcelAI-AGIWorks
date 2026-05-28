import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXCEL AI – Chronex AI Demo anfordern",
  description: "Fordere einen 7-tägigen Testzugang zum Chronex AI Speditionssystem an.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function DemoAnfordernLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

