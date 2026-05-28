"use client";

import { useEffect } from "react";

/**
 * Performance Monitor — nur Development oder NEXT_PUBLIC_ENABLE_PERF_MONITOR.
 * Sauberes Teardown: verhindert doppelte rAF-Schleifen / Observer unter Strict Mode.
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "development" &&
      !process.env.NEXT_PUBLIC_ENABLE_PERF_MONITOR
    ) {
      return;
    }

    if (typeof window === "undefined" || !("performance" in window)) {
      return;
    }

    const observers: PerformanceObserver[] = [];
    let fpsRaf = 0;
    let cancelled = false;

    const trackWebVitals = () => {
      const paintEntries = performance.getEntriesByType("paint");
      paintEntries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          console.log(`🎨 FCP: ${entry.startTime.toFixed(2)}ms`);
        }
      });

      if ("PerformanceObserver" in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as {
              renderTime?: number;
              loadTime?: number;
            };
            console.log(
              `📊 LCP: ${lastEntry.renderTime?.toFixed(2) || lastEntry.loadTime?.toFixed(2)}ms`,
            );
          });
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
          observers.push(lcpObserver);
        } catch {
          /* unsupported */
        }
      }

      if ("PerformanceObserver" in window) {
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as unknown as Array<{
              hadRecentInput?: boolean;
              value: number;
            }>) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            console.log(`📐 CLS: ${clsValue.toFixed(4)}`);
          });
          clsObserver.observe({ entryTypes: ["layout-shift"] });
          observers.push(clsObserver);
        } catch {
          /* unsupported */
        }
      }

      if ("PerformanceObserver" in window) {
        try {
          const ttiObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as Array<{
              entryType: string;
              name?: string;
              duration?: number;
            }>) {
              if (entry.entryType === "measure" && entry.name === "tti") {
                console.log(`⚡ TTI: ${entry.duration?.toFixed(2)}ms`);
              }
            }
          });
          ttiObserver.observe({ entryTypes: ["measure"] });
          observers.push(ttiObserver);
        } catch {
          /* unsupported */
        }
      }

      if (process.env.NODE_ENV === "development") {
        let lastTime = performance.now();
        let frames = 0;

        const measureFPS = () => {
          if (cancelled) return;
          frames++;
          const currentTime = performance.now();
          if (currentTime >= lastTime + 1000) {
            const fps = Math.round((frames * 1000) / (currentTime - lastTime));
            if (fps < 55) {
              console.warn(`⚠️ Low FPS: ${fps} fps`);
            }
            frames = 0;
            lastTime = currentTime;
          }
          fpsRaf = requestAnimationFrame(measureFPS);
        };
        fpsRaf = requestAnimationFrame(measureFPS);
      }
    };

    const trackNavigationTiming = () => {
      const navigation = performance.getEntriesByType(
        "navigation",
      )[0] as PerformanceNavigationTiming | undefined;
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

    const onLoadVitals = () => trackWebVitals();
    const onLoadNav = () => trackNavigationTiming();

    if (document.readyState === "complete") {
      trackWebVitals();
    } else {
      window.addEventListener("load", onLoadVitals);
    }

    if (document.readyState === "complete") {
      trackNavigationTiming();
    } else {
      window.addEventListener("load", onLoadNav);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(fpsRaf);
      window.removeEventListener("load", onLoadVitals);
      window.removeEventListener("load", onLoadNav);
      observers.forEach((o) => {
        try {
          o.disconnect();
        } catch {
          /* noop */
        }
      });
    };
  }, []);

  return null;
}
