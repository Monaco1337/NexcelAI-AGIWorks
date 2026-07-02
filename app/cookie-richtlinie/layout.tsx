import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "nexcel", path: "/cookie-richtlinie" });

export default function CookieRichtlinieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
