import { NextResponse } from "next/server";

/** Admin-only install identity. Deliberately distinct from the public marketing manifest. */
export function GET() {
  return NextResponse.json({
    id: "/admin",
    name: "NEXCEL AI · AGI Works Admin",
    short_name: "NEXCEL Admin",
    description: "Geschützte Verwaltung für NEXCEL AI und AGI Works",
    start_url: "/admin",
    scope: "/admin",
    display: "standalone",
    background_color: "#080c15",
    theme_color: "#080c15",
    icons: [
      { src: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
      { src: "/web-app-manifest-512x512.png", sizes: "512x512", type: "image/png" },
    ],
  }, {
    headers: {
      "Content-Type": "application/manifest+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
