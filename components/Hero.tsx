"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useCallback } from "react";

export default function Hero() {
  const handleScrollToServices = useCallback(() => {
    const element = document.getElementById("services");
    element?.scrollIntoView({ behavior: "smooth" });
  }, []);
  
  return (
    <section id="hero" className="hero-bg relative min-h-screen flex items-center justify-center overflow-hidden" style={{ zIndex: 1 }}>
      
      {/* Dedicated Background Layer */}
      <div className="hero-bg-layer" />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 w-full">
        {/* Single motion wrapper for entrance animation - ONCE ONLY */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center"
        >
          {/* LEFT COLUMN: Text + CTAs - KEYNOTE LEVEL */}
          <div className="text-center lg:text-left space-y-5 sm:space-y-6 lg:space-y-7">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-6xl 2xl:text-7xl font-bold tracking-tight leading-[1.1] typography-h1">
              <span className="block text-white">
                Wir entwickeln digitale Systeme,
              </span>
              <span className="block mt-1 sm:mt-2 lg:mt-2 typography-h1-gradient">
                die Prozesse übernehmen.
              </span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-xl typography-body max-w-3xl mx-auto lg:mx-0 leading-[1.6] opacity-90">
              Von Webplattformen bis zu autonomen KI-Workflows – individuell, skalierbar und zukunftssicher.
            </p>

            {/* CTA Buttons - CALM, AUTHORITATIVE */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start pt-4 sm:pt-5 lg:pt-6">
              <Link href="/kontakt" prefetch={true} className="w-full sm:w-auto">
                <button className="btn-primary w-full sm:w-auto">
                  <span className="flex items-center justify-center gap-2">
                    <span>Abhängigkeiten analysieren</span>
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                </button>
              </Link>
              
              <button
                onClick={handleScrollToServices}
                className="btn-secondary w-full sm:w-auto"
              >
                <span className="flex items-center justify-center gap-2">
                  <span>Systeme verstehen</span>
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: System Visualization - MINIMAL, REAL */}
          <div className="hero-screen">
            <div className="hero-screen-inner">
              {/* Left: Mini Log Column - REDUCED */}
              <div className="hero-screen-log">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="hero-screen-log-row" style={{ opacity: 0.4 + (i * 0.1) }}>
                    <div className="hero-screen-log-dot" />
                    <div className="hero-screen-log-line" style={{ width: `${65 + (i * 5)}%` }} />
                  </div>
                ))}
              </div>

              {/* Right: Mini Modules - REDUCED */}
              <div className="hero-screen-modules">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="hero-screen-module">
                    <div className="hero-screen-module-header" />
                    <div className="hero-screen-module-content">
                      {[...Array(2)].map((_, j) => (
                        <div key={j} className="hero-screen-module-line" style={{ width: `${75 + (j * 15)}%` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Connecting Lines - MINIMAL */}
              <div className="hero-screen-connector hero-screen-connector-1" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
