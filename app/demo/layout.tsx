import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXCEL AI – Chronex AI Demo",
  description: "Chronex AI Demo-Dashboard – Speditionssystem im Testzugang.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

