import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "nexcel", path: "/agb" });

export default function AgbLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
