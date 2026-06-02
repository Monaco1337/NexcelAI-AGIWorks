import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGI Works – Datenschutzerklärung",
  description:
    "Datenschutzerklärung der AGI Works — Informationen zur Verarbeitung personenbezogener Daten nach DSGVO, BDSG, TDDDG und EU-KI-Verordnung.",
  robots: { index: true, follow: true },
};

export default function AgiWorksDatenschutzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
