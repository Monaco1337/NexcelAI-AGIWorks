import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.agiworks.de"),
  title: "Cookie-Richtlinie | AGI Works",
  description:
    "Cookie-Richtlinie von AGI Works – Informationen zu Cookies, lokalen Speichertechnologien, Einwilligung und Widerruf gemäß § 25 TDDDG und DSGVO.",
  alternates: { canonical: "/agiworks/cookie-richtlinie" },
  robots: { index: true, follow: true },
};

export default function AgiWorksCookieRichtlinieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
