import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({
  brand: "agiworks",
  path: "/vertragsverarbeitung",
});

export default function AgiWorksVertragsverarbeitungLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
