import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/systemanalyse" });

export default function AgiWorksSystemanalyseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
