"use client";

import dynamic from "next/dynamic";

// Dynamically import hero variants to enable code splitting
const HeroA_Video = dynamic(() => import("./HeroA_Video"), {
  ssr: true,
  loading: () => <HeroSkeleton />,
});

const HeroB_Mesh = dynamic(() => import("./HeroB_Mesh"), {
  ssr: true,
  loading: () => <HeroSkeleton />,
});

// Feature flag: "A" = Video variant, "B" = Mesh variant
// Set via environment variable NEXT_PUBLIC_HERO_VARIANT
// Default: "B" (Mesh) for best performance
const HERO_VARIANT = (process.env.NEXT_PUBLIC_HERO_VARIANT as "A" | "B") || "B";

// Skeleton loader to prevent layout shift
function HeroSkeleton() {
  return (
    <div 
      className="min-h-[85vh] flex items-center bg-transparent"
      aria-hidden="true"
    >
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left skeleton */}
          <div className="space-y-6 text-center lg:text-left">
            <div className="flex gap-2 justify-center lg:justify-start">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-6 w-20 rounded-full bg-white/5 animate-pulse"
                />
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-12 w-3/4 mx-auto lg:mx-0 rounded-lg bg-white/5 animate-pulse" />
              <div className="h-12 w-2/3 mx-auto lg:mx-0 rounded-lg bg-white/5 animate-pulse" />
            </div>
            <div className="h-6 w-full max-w-md mx-auto lg:mx-0 rounded-lg bg-white/5 animate-pulse" />
            <div className="flex gap-3 justify-center lg:justify-start pt-2">
              <div className="h-12 w-40 rounded-xl bg-white/5 animate-pulse" />
              <div className="h-12 w-36 rounded-xl bg-white/5 animate-pulse" />
            </div>
          </div>
          {/* Right skeleton */}
          <div className="flex justify-center lg:justify-end">
            <div className="w-full max-w-[520px] grid grid-cols-2 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-2xl bg-white/5 animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Hero Component
 * 
 * Renders either HeroA_Video or HeroB_Mesh based on the NEXT_PUBLIC_HERO_VARIANT env var.
 * - "A": Video background with ambient loop (premium feel, higher bandwidth)
 * - "B": Pure CSS mesh/gradient background (max performance, no video)
 * 
 * Default is "B" for optimal Core Web Vitals.
 */
export default function Hero() {
  if (HERO_VARIANT === "A") {
    return <HeroA_Video />;
  }
  return <HeroB_Mesh />;
}

// Re-export for direct usage if needed
export { HeroA_Video, HeroB_Mesh, HERO_VARIANT };
