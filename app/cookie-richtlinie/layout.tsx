import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.nexcelai.de"),
  title: "Cookie-Richtlinie | NEXCEL AI",
  description:
    "Cookie-Richtlinie von NEXCEL AI – Informationen zu Cookies, lokalen Speichertechnologien, Einwilligung und Widerruf gemäß § 25 TDDDG und DSGVO.",
  alternates: { canonical: "/cookie-richtlinie" },
  robots: { index: true, follow: true },
};

export default function CookieRichtlinieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
