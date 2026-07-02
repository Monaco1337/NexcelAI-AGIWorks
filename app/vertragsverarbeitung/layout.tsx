import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({
  brand: "nexcel",
  path: "/vertragsverarbeitung",
});

export default function VertragsverarbeitungLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
