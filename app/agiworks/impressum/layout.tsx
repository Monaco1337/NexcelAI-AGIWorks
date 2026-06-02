import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGI Works – Impressum",
  description:
    "Impressum der AGI Works — Anbieterkennzeichnung gemäß § 5 DDG, Kontakt und rechtliche Hinweise.",
  robots: { index: true, follow: true },
};

export default function AgiWorksImpressumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
