import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | NEXCEL AI",
  description: "NEXCEL AI CMS Dashboard",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

