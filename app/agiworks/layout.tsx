import type { Metadata, Viewport } from "next";
import { agiworksBrand } from "@/data/brands/agiworks";
import { BrandProvider } from "@/contexts/BrandContext";

/**
 * AGI WORKS — eigene Metadata, OG-Tags, Theme-Color, Favicon-Set.
 *
 * Diese Werte überschreiben die NEXCEL-Defaults aus dem Root-Layout,
 * solange der User auf einer /agiworks/*-Route ist. Das Brand-Theming
 * (Farben, Glows, Plateaus) wird parallel via `BrandProvider` über
 * `usePathname()` aktiviert.
 */

export const metadata: Metadata = {
  title: agiworksBrand.seo.title,
  description: agiworksBrand.seo.description,
  openGraph: {
    title: agiworksBrand.seo.ogTitle,
    description: agiworksBrand.seo.ogDescription,
    type: "website",
    siteName: "AGI Works",
  },
  twitter: {
    card: "summary_large_image",
    title: agiworksBrand.seo.ogTitle,
    description: agiworksBrand.seo.ogDescription,
  },
  // Eigenes AGI-WORKS-Favicon (silberner Ring, blaues Swoosh-A).
  // SVG skaliert sauber in allen Browser-Tab-Größen; PNG-Fallback für Safari/iOS.
  icons: {
    icon: [
      { url: "/favicons/agiworks.svg", type: "image/svg+xml" },
      { url: "/favicons/agiworks.svg", sizes: "any" },
    ],
    apple: { url: "/favicons/agiworks.svg", sizes: "180x180" },
    shortcut: "/favicons/agiworks.svg",
  },
};

export const viewport: Viewport = {
  themeColor: agiworksBrand.theme.accentPrimary,
};

export default function AgiWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The middleware rewrites agiworks.de/* to /agiworks/* internally,
  // so the user-visible URL stays "/". Because `usePathname()` returns
  // the user-facing path, the outer BrandProvider in the root layout
  // would fall back to the NEXCEL brand. By nesting a BrandProvider with
  // an explicit override here we guarantee every component rendered
  // under /agiworks/* receives the AGI Works brand tokens.
  return <BrandProvider override={agiworksBrand}>{children}</BrandProvider>;
}
