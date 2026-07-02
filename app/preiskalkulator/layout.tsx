import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata = generateSeoMetadata({ brand: "nexcel", path: "/preiskalkulator" });

export default function PreiskalkulatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ds-app" style={{ minHeight: "100vh", overflowX: "hidden" }}>
      {children}
    </div>
  );
}
