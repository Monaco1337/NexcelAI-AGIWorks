"use client";

import { useEffect } from "react";

/**
 * Performance Monitor Component
 * Tracks Core Web Vitals and Performance Metrics
 * Only runs in development mode or when explicitly enabled
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in development or if explicitly enabled
    if (process.env.NODE_ENV !== "development" && !process.env.NEXT_PUBLIC_ENABLE_PERF_MONITOR) {
      return;
    }

    // Check if Performance API is available
    if (typeof window === "undefined" || !("performance" in window)) {
      return;
    }

    // Track Core Web Vitals
    const trackWebVitals = () => {
      // FCP - First Contentful Paint
      const paintEntries = performance.getEntriesByType("paint");
      paintEntries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          console.log(`🎨 FCP: ${entry.startTime.toFixed(2)}ms`);
        }
      });

      // LCP - Largest Contentful Paint
      if ("PerformanceObserver" in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            console.log(`📊 LCP: ${lastEntry.renderTime?.toFixed(2) || lastEntry.loadTime?.toFixed(2)}ms`);
          });
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        } catch (e) {
          // PerformanceObserver not supported
        }
      }

      // CLS - Cumulative Layout Shift
      if ("PerformanceObserver" in window) {
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
          });
          clsObserver.observe({ entryTypes: ["layout-shift"] });
        } catch (e) {
          // PerformanceObserver not supported
        }
      }

      // TTI - Time to Interactive (approximation)
      if ("PerformanceObserver" in window) {
        try {
          const ttiObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach((entry: any) => {
              if (entry.entryType === "measure" && entry.name === "tti") {
                console.log(`⚡ TTI: ${entry.duration.toFixed(2)}ms`);
              }
            });
          });
          ttiObserver.observe({ entryTypes: ["measure"] });
        } catch (e) {
          // PerformanceObserver not supported
        }
      }

      // FPS Monitor (Development only)
      if (process.env.NODE_ENV === "development") {
        let lastTime = performance.now();
        let frames = 0;
        let fps = 0;

        const measureFPS = () => {
          frames++;
          const currentTime = performance.now();
          if (currentTime >= lastTime + 1000) {
            fps = Math.round((frames * 1000) / (currentTime - lastTime));
            if (fps < 55) {
              console.warn(`⚠️ Low FPS: ${fps} fps`);
            }
            frames = 0;
            lastTime = currentTime;
          }
          requestAnimationFrame(measureFPS);
        };
        requestAnimationFrame(measureFPS);
      }
    };

    // Wait for page load
    if (document.readyState === "complete") {
      trackWebVitals();
    } else {
      window.addEventListener("load", trackWebVitals);
    }

    // Track navigation timing
    const trackNavigationTiming = () => {
      const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
      if (navigation) {
        console.log("📈 Navigation Timing:", {
          DNS: `${(navigation.domainLookupEnd - navigation.domainLookupStart).toFixed(2)}ms`,
          TCP: `${(navigation.connectEnd - navigation.connectStart).toFixed(2)}ms`,
          TTFB: `${(navigation.responseStart - navigation.requestStart).toFixed(2)}ms`,
          Download: `${(navigation.responseEnd - navigation.responseStart).toFixed(2)}ms`,
          DOMContentLoaded: `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`,
          Load: `${navigation.loadEventEnd - navigation.loadEventStart}ms`,
        });
      }
    };

    if (document.readyState === "complete") {
      trackNavigationTiming();
    } else {
      window.addEventListener("load", trackNavigationTiming);
    }
  }, []);

  return null;
}
