import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/impressum" });

export default function AgiWorksImpressumLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
