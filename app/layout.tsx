import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import NavigationGate from "@/components/NavigationGate";
import ClientOnly from "@/components/ClientOnly";

// Headline Font - Future-Premium
// Optimiert für Performance: preload, display swap, subset optimization
const generalSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-headline",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'system-ui', 'sans-serif'],
});

// Body Font - Inter (Future-Premium)
// Optimiert für Performance: preload, display swap, subset optimization
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ['-apple-system', 'BlinkMacSystemFont', 'Inter', 'system-ui', 'sans-serif'],
});

// Lazy load heavy components
const AppBackground = dynamic(() => import("@/components/background/AppBackground"), {
  ssr: false,
  loading: () => null,
});

const NeuralCursor = dynamic(() => import("@/components/NeuralCursor"), {
  ssr: false,
  loading: () => null,
});

const CookieBanner = dynamic(() => import("@/components/CookieBanner"), {
  ssr: false,
});

const AnalyticsTracker = dynamic(() => import("@/components/AnalyticsTracker"), {
  ssr: false,
});

const PerformanceMonitor = dynamic(() => import("@/components/PerformanceMonitor"), {
  ssr: false,
});

const PerformanceAuditor = dynamic(() => import("@/components/PerformanceAuditor"), {
  ssr: false,
});

export const metadata: Metadata = {
  title: "NEXCEL AI • Individuelle KI-Systeme & Softwarelösungen",
  description: "Intelligente Software. Maßgeschneiderte KI. Zukunft, die funktioniert. Individuelle KI-Systeme, Automationen und digitale Produkte für Unternehmen.",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-16x16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/favicon-32x32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/favicon-96x96.svg', sizes: '96x96', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon-57x57.svg', sizes: '57x57', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-60x60.svg', sizes: '60x60', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-72x72.svg', sizes: '72x72', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-76x76.svg', sizes: '76x76', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-114x114.svg', sizes: '114x114', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-120x120.svg', sizes: '120x120', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-144x144.svg', sizes: '144x144', type: 'image/svg+xml' },
      { url: '/apple-touch-icon-152x152.svg', sizes: '152x152', type: 'image/svg+xml' },
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#6B2DB8' },
    ],
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`dark ${generalSans.variable} ${inter.variable}`} suppressHydrationWarning>
      <head>
        {/* Nur Poster preload: Das Hero-MP4 ist groß (~34MB) — Video-Preload blockiert
            Bandbreite/Parsing und wirkt wie „Seite lädt nicht“. Poster reicht für LCP. */}
        <link rel="preload" as="image" href="/images/hero/nexcel-system-architecture.png" />

        {/* Standard Favicons - SVG wird bevorzugt, ICO als Fallback */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="alternate icon" type="image/x-icon" href="/favicon.ico" />
        <link rel="icon" type="image/svg+xml" sizes="16x16" href="/favicon-16x16.svg" />
        <link rel="icon" type="image/svg+xml" sizes="32x32" href="/favicon-32x32.svg" />
        <link rel="icon" type="image/svg+xml" sizes="96x96" href="/favicon-96x96.svg" />
        
        {/* Apple Touch Icons - Alle Größen */}
        <link rel="apple-touch-icon" sizes="57x57" href="/apple-touch-icon-57x57.svg" />
        <link rel="apple-touch-icon" sizes="60x60" href="/apple-touch-icon-60x60.svg" />
        <link rel="apple-touch-icon" sizes="72x72" href="/apple-touch-icon-72x72.svg" />
        <link rel="apple-touch-icon" sizes="76x76" href="/apple-touch-icon-76x76.svg" />
        <link rel="apple-touch-icon" sizes="114x114" href="/apple-touch-icon-114x114.svg" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon-120x120.svg" />
        <link rel="apple-touch-icon" sizes="144x144" href="/apple-touch-icon-144x144.svg" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon-152x152.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
        
        {/* Android Chrome Icons */}
        <link rel="icon" type="image/svg+xml" sizes="192x192" href="/android-chrome-192x192.svg" />
        <link rel="icon" type="image/svg+xml" sizes="512x512" href="/android-chrome-512x512.svg" />
        
        {/* Safari */}
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#6B2DB8" />
        
        {/* Manifest */}
        <link rel="manifest" href="/manifest.json" />
        
        {/* Theme Colors */}
        <meta name="theme-color" content="#6B2DB8" />
        <meta name="msapplication-TileColor" content="#6B2DB8" />
        <meta name="msapplication-TileImage" content="/android-chrome-192x192.svg" />
        
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme');
                  var theme = (saved === 'light' || saved === 'dark') ? saved : 'dark';
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        {/* Brand-Detection vor First Paint:
            1. Setzt data-brand="agiworks" auf <html> → CSS-Tokens switchen.
            2. Auf /agiworks: ersetzt ALLE NEXCEL-Favicon-Links durch das AGI-Works-Icon.
               Läuft NACH den hardcoded <link>-Tags (siehe HTML-Reihenfolge), aber
               BEVOR der Browser die Icons fetcht → kein NEXCEL-N im AGI-Works-Tab. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var p = window.location.pathname || "/";
                  var h = (window.location.hostname || "").toLowerCase();
                  var isAgiHost = h.indexOf("agiworks") !== -1;
                  var isAgiPath = (p === "/agiworks" || p.indexOf("/agiworks/") === 0);
                  var isAgi = isAgiHost || isAgiPath;
                  var brand = isAgi ? "agiworks" : "nexcel";
                  document.documentElement.setAttribute("data-brand", brand);

                  if (isAgi) {
                    var head = document.head;
                    // Alle bestehenden Icon/Touch-Icon/Mask-Icon/Manifest-Links entfernen
                    var SELECTORS = [
                      'link[rel="icon"]',
                      'link[rel="alternate icon"]',
                      'link[rel="shortcut icon"]',
                      'link[rel="apple-touch-icon"]',
                      'link[rel="apple-touch-icon-precomposed"]',
                      'link[rel="mask-icon"]',
                      'link[rel="manifest"]',
                      'meta[name="theme-color"]',
                      'meta[name="msapplication-TileColor"]',
                      'meta[name="msapplication-TileImage"]'
                    ];
                    SELECTORS.forEach(function(sel) {
                      head.querySelectorAll(sel).forEach(function(el) { el.parentNode.removeChild(el); });
                    });

                    // AGI Works Favicon-Set injizieren
                    function addLink(rel, href, type, sizes) {
                      var l = document.createElement("link");
                      l.rel = rel;
                      l.href = href;
                      if (type) l.type = type;
                      if (sizes) l.setAttribute("sizes", sizes);
                      head.appendChild(l);
                    }
                    function addMeta(name, content) {
                      var m = document.createElement("meta");
                      m.name = name;
                      m.content = content;
                      head.appendChild(m);
                    }

                    addLink("icon", "/favicons/agiworks.svg", "image/svg+xml", "any");
                    addLink("icon", "/favicons/agiworks.svg", "image/svg+xml", "16x16");
                    addLink("icon", "/favicons/agiworks.svg", "image/svg+xml", "32x32");
                    addLink("icon", "/favicons/agiworks.svg", "image/svg+xml", "96x96");
                    addLink("shortcut icon", "/favicons/agiworks.svg", "image/svg+xml");
                    addLink("apple-touch-icon", "/favicons/agiworks.svg", null, "180x180");
                    addLink("mask-icon", "/favicons/agiworks.svg");
                    addMeta("theme-color", "#5BB8FF");
                    addMeta("msapplication-TileColor", "#1E5A99");

                    // Cache-Buster: Tab-Title-Touch triggert Favicon-Refresh in einigen Browsern
                    var t = document.title;
                    document.title = t + " ";
                    document.title = t;
                  }
                } catch (e) {
                  document.documentElement.setAttribute("data-brand", "nexcel");
                }
              })();
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Ensure nextjs-portal appears after #__next-build-watcher (DOM order fix)
                // Target: Index 5, directly after #__next-build-watcher
                // Specifically targets: nextjs-portal[data-cursor-element-id="cursor-el-10"]
                function reorderPortal() {
                  try {
                    // Find the specific portal with data-cursor-element-id="cursor-el-10"
                    const portal = document.querySelector('nextjs-portal[data-cursor-element-id="cursor-el-10"]');
                    const buildWatcher = document.getElementById('__next-build-watcher');
                    
                    if (!portal || !buildWatcher) {
                      return;
                    }
                    
                    // Only process if portal is a direct child of body
                    if (portal.parentNode === document.body && buildWatcher.parentNode === document.body) {
                      const bodyChildren = Array.from(document.body.children);
                      const watcherIndex = bodyChildren.indexOf(buildWatcher);
                      const portalIndex = bodyChildren.indexOf(portal);
                      
                      // Target: Portal should be at index 5 (directly after build watcher)
                      // Check if portal is already in correct position (watcherIndex + 1)
                      if (portalIndex !== watcherIndex + 1 && portalIndex !== -1 && watcherIndex !== -1) {
                        // Insert portal directly after build watcher
                        // This ensures nextSiblingPath is "div#__next-build-watcher" and index is 5
                        if (buildWatcher.nextSibling) {
                          buildWatcher.parentNode.insertBefore(portal, buildWatcher.nextSibling);
                        } else {
                          buildWatcher.parentNode.appendChild(portal);
                        }
                      }
                    }
                  } catch (e) {
                    console.warn('Portal reordering error:', e);
                  }
                }
                
                // Run immediately and on DOMContentLoaded
                if (document.readyState === 'loading') {
                  document.addEventListener('DOMContentLoaded', reorderPortal);
                } else {
                  reorderPortal();
                }
                
                // Also run after delays to catch dynamically added portals
                setTimeout(reorderPortal, 100);
                setTimeout(reorderPortal, 300);
                setTimeout(reorderPortal, 500);
                setTimeout(reorderPortal, 1000);
                
                // MutationObserver DEAKTIVIERT - verursacht Fehler
                // Portal-Reordering läuft nur über setTimeout
              })();
            `,
          }}
        />
      </head>
      <body
        className={`min-h-screen relative transition-colors duration-500 ${inter.className}`}
        style={{
          position: "relative",
          fontFamily: "var(--font-body)",
          color: "var(--text-0)",
        }}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <BrandProvider>
          {/* Nur-Client: vermeidet Hydration-Mismatch mit dynamic(..., { ssr: false }) */}
          <ClientOnly>
            <AppBackground />
            <NeuralCursor />
          </ClientOnly>

          {/* Navigation: fix oben, z-[100], auf allen Seiten sichtbar
              außer auf der Diagnose-Plattform (`/`, `/diagnose/*`) — dort
              übernimmt der Hero die Top-Leiste. */}
          <NavigationGate />
          
          {/* Content */}
          <div
            style={{
              minHeight: "100vh",
              position: "relative",
              zIndex: 10,
              background: "#0B0D12",
            }}
          >
            {children}
          </div>
          
          <ClientOnly>
            <CookieBanner />
            <AnalyticsTracker />
            <PerformanceMonitor />
            <PerformanceAuditor />
          </ClientOnly>
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


