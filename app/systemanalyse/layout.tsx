import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Systemanalyse · Strategischer Intake",
  description:
    "Geführte Architektur-Diagnose für Prozesse, Systeme, Daten und Automatisierung — strukturierter Premium-Intake für Unternehmen.",
  openGraph: {
    title: "Systemanalyse · Strategischer Intake",
    description:
      "Strukturierte Erfassung von Ausgangslage, Schmerzpunkten und Zielen — Basis für Architektur und Umsetzung.",
    type: "website",
  },
};

export default function SystemanalyseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
