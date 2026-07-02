import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/datenschutz" });

export default function AgiWorksDatenschutzLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
