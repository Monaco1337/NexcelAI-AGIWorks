import type { Metadata } from "next";
import "./globals.css";
import dynamic from "next/dynamic";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import Navigation from "@/components/Navigation";

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
                  const theme = localStorage.getItem('theme') || 
                    (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                  document.documentElement.classList.remove('dark', 'light');
                  document.documentElement.classList.add(theme);
                } catch (e) {
                  // Fallback to dark if error
                  document.documentElement.classList.add('dark');
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
      <body className={`min-h-screen relative transition-colors duration-500 ${inter.className}`} style={{ 
        position: "relative",
        fontFamily: "var(--font-body)",
        color: "var(--text-0)",
      }}>
        <ThemeProvider>
          <BrandProvider>
          {/* Unified App Background - Consistent across all pages */}
          <AppBackground />
          
          {/* Neural Cursor */}
          <NeuralCursor />

          {/* Navigation: fix oben, z-[100], auf allen Seiten sichtbar */}
          <Navigation />
          
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
          
          {/* DSGVO-konformes Cookie-Banner */}
          <CookieBanner />
          
          {/* Analytics Tracker */}
          <AnalyticsTracker />
          
          {/* Performance Monitor (Development only) */}
          <PerformanceMonitor />
          
          {/* Performance Auditor (PERF_AUDIT mode) */}
          <PerformanceAuditor />
          </BrandProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


