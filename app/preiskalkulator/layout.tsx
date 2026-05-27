import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Preiskalkulator • NEXCEL AI",
  description:
    "In wenigen Schritten zu Ihrer groben Kosteneinschätzung: Projektart, Umfang, Features, Zeitrahmen und Qualität. Unverbindliches Angebot anfordern.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function PreiskalkulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="ds-app"
      style={{
        background: "#0a0a0f",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      {children}
    </div>
  );
}
