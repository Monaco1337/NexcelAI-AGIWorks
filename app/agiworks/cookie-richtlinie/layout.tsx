import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/cookie-richtlinie" });

export default function AgiWorksCookieRichtlinieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
