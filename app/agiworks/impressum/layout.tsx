import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.agiworks.de"),
  title: "Impressum | AGI Works",
  description:
    "Impressum von AGI Works – Anbieterkennzeichnung, Kontakt, Verantwortlichkeit und rechtliche Hinweise gemäß § 5 DDG.",
  alternates: { canonical: "/agiworks/impressum" },
  robots: { index: true, follow: true },
};

export default function AgiWorksImpressumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
