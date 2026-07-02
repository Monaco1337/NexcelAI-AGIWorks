import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "nexcel", path: "/impressum" });

export default function ImpressumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
