import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/kontakt" });

export default function AgiWorksKontaktLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
