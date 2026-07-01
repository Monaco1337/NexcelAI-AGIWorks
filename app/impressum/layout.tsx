import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nexcelai.de"),
  title: "Impressum | NEXCEL AI",
  description:
    "Impressum von NEXCEL AI – Anbieterkennzeichnung, Kontakt, Verantwortlichkeit und rechtliche Hinweise gemäß § 5 DDG.",
  alternates: { canonical: "/impressum" },
  robots: { index: true, follow: true },
};

export default function ImpressumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
