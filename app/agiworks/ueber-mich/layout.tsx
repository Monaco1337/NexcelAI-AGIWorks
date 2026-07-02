import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/ueber-mich" });

export default function AgiWorksUeberMichLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
