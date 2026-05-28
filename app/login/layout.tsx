import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXCEL AI – Login",
  description: "Melde dich mit deinen Chronex AI Demo-Zugangsdaten an.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

