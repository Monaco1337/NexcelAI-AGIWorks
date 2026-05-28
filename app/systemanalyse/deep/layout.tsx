import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tiefere Systemanalyse · NEXCEL AI",
  description:
    "Modulare Diagnose-Engine: Sales · Marketing · Operations · Automation. Live-Maturity-Score und priorisierte Handlungsempfehlungen.",
  openGraph: {
    title: "Tiefere Systemanalyse · NEXCEL AI",
    description:
      "Live-Diagnose-Engine — Modul für Modul, mit Reife-Score und Priority Actions.",
    type: "website",
  },
};

export default function DeepAnalyseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
