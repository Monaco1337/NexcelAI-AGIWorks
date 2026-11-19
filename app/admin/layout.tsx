import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | NEXCEL AI",
  description: "Geschuetztes NEXCEL AI / AGI Works Admin Dashboard",
  manifest: "/admin/manifest.webmanifest",
  appleWebApp: { capable: true, title: "NEXCEL Admin", statusBarStyle: "black-translucent" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

