import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXCEL AI – Über uns",
  description: "NEXCEL AI – KI-Architektur, Systementwicklung unter der Leitung von Celina Siebeneicher. Wir bauen individuelle, intelligente Lösungen für Unternehmen.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function UeberMichLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

