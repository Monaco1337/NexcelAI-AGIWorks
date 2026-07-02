import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "agiworks", path: "/agb" });

export default function AgiWorksAgbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
