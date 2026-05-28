const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  compress: true,
  poweredByHeader: false,
  
  // output: 'standalone' deaktiviert – verursacht in Next 14 mit diesem Setup
  // "Cannot find module './1682.js'" (Chunks in server/chunks/, Runtime erwartet server/).
  // Für Docker/Standalone-Deploy: output: 'standalone' ggf. per Umgebungsvariable steuern.
  
  // Optimierte Image-Konfiguration
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000,
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  
  // Experimentelle Features für Performance
  experimental: {
    optimizePackageImports: [
      'framer-motion',
      'lucide-react',
      'three',
      '@react-three/fiber',
    ],
    // Note: PPR requires Next.js canary - removed for stable version
  },
  
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Webpack-Optimierungen
  webpack: (config, { isServer, dev }) => {
    // Stabilität in Dev: verhindert kaputte .next/vendor-chunks (ENOENT)
    if (dev) {
      config.cache = false;
    }

    // ── Transformers.js (HuggingFace) ─────────────────────────
    // Läuft nur clientseitig (WebGPU/WASM) — auf der Server-Seite
    // bricht der Build sonst, weil Node-spezifische Submodule
    // (z.B. onnxruntime-node, sharp) gefordert werden.
    if (isServer) {
      config.externals = config.externals || [];
      // Prevent server-side bundling of @huggingface/transformers
      config.externals.push({
        '@huggingface/transformers': 'commonjs @huggingface/transformers',
        'onnxruntime-node': 'commonjs onnxruntime-node',
        sharp: 'commonjs sharp',
      });
    } else {
      config.resolve = config.resolve || {};
      config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        url: false,
        zlib: false,
      };
    }

    // Production-only Optimierungen
    if (!dev && !isServer) {
      // Aggressives Bundle-Splitting
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
        runtimeChunk: 'single',
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Framer Motion in eigenes Chunk
            framerMotion: {
              name: 'framer-motion',
              test: /[\\/]node_modules[\\/](framer-motion)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // Three.js in eigenes Chunk
            three: {
              name: 'three',
              test: /[\\/]node_modules[\\/](three|@react-three)[\\/]/,
              priority: 30,
              reuseExistingChunk: true,
            },
            // React Vendor Chunk
            react: {
              name: 'react-vendor',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // Andere Vendor Libraries
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              reuseExistingChunk: true,
            },
            // Common Chunk für geteilten Code
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }
    
    return config;
  },
  
  // Headers für Performance & Caching
  headers: async () => {
    return [
      {
        // Headers nur für HTML-Seiten (nicht für _next/JavaScript/Assets)
        source: '/',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
        ],
      },
      {
        // Statische Assets mit langem Caching
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2|ttf|eot)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Fonts mit langem Caching
        source: '/fonts/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = withBundleAnalyzer(nextConfig);

