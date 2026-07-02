import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "nexcel", path: "/systemanalyse" });

export default function SystemanalyseLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
