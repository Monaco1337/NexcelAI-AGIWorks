"use client";

import { useEffect, useRef } from "react";

/**
 * Performance Auditor Component
 * Only active when PERF_AUDIT=1 or NEXT_PUBLIC_PERF_AUDIT=1
 * Tracks: Web Vitals, Long Tasks, FPS, React Profiler marks
 */
export default function PerformanceAuditor() {
  const fpsRef = useRef({ frames: 0, lastTime: performance.now(), fps: 0 });
  const longTasksRef = useRef<PerformanceEntry[]>([]);
  const marksRef = useRef<string[]>([]);

  useEffect(() => {
    // Only run if PERF_AUDIT is enabled
    if (
      process.env.NODE_ENV !== "development" &&
      process.env.NEXT_PUBLIC_PERF_AUDIT !== "1"
    ) {
      return;
    }

    if (typeof window === "undefined") return;

    const report: {
      route: string;
      webVitals: Record<string, number>;
      longTasks: Array<{ duration: number; startTime: number; name?: string }>;
      fps: number;
      marks: string[];
      timestamp: number;
    } = {
      route: window.location.pathname,
      webVitals: {},
      longTasks: [],
      fps: 0,
      marks: [],
      timestamp: Date.now(),
    };

    // Web Vitals Tracking
    const trackWebVitals = () => {
      // FCP
      const paintEntries = performance.getEntriesByType("paint");
      paintEntries.forEach((entry) => {
        if (entry.name === "first-contentful-paint") {
          report.webVitals.FCP = Math.round(entry.startTime);
          console.log(`🎨 FCP: ${report.webVitals.FCP}ms`);
        }
      });

      // LCP
      if ("PerformanceObserver" in window) {
        try {
          const lcpObserver = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1] as any;
            const lcp = Math.round(
              lastEntry.renderTime || lastEntry.loadTime || 0
            );
            report.webVitals.LCP = lcp;
            console.log(`📊 LCP: ${lcp}ms`);
          });
          lcpObserver.observe({ entryTypes: ["largest-contentful-paint"] });
        } catch (e) {
          // Not supported
        }
      }

      // CLS
      if ("PerformanceObserver" in window) {
        try {
          let clsValue = 0;
          const clsObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (!entry.hadRecentInput) {
                clsValue += entry.value;
              }
            }
            report.webVitals.CLS = Math.round(clsValue * 1000) / 1000;
            console.log(`📐 CLS: ${report.webVitals.CLS}`);
          });
          clsObserver.observe({ entryTypes: ["layout-shift"] });
        } catch (e) {
          // Not supported
        }
      }

      // INP (Interaction to Next Paint) - approximation
      if ("PerformanceObserver" in window) {
        try {
          const inpObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries() as any[]) {
              if (entry.entryType === "event" && entry.duration) {
                const inp = Math.round(entry.duration);
                if (inp > 100) {
                  console.warn(`⚠️ Slow interaction: ${inp}ms (${entry.name})`);
                }
              }
            }
          });
          inpObserver.observe({ entryTypes: ["event"] });
        } catch (e) {
          // Not supported
        }
      }
    };

    // Long Tasks Detection
    const trackLongTasks = () => {
      if ("PerformanceObserver" in window) {
        try {
          const longTaskObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.duration > 50) {
                longTasksRef.current.push(entry);
                report.longTasks.push({
                  duration: Math.round(entry.duration),
                  startTime: Math.round(entry.startTime),
                  name: entry.name,
                });
                console.warn(
                  `🐌 Long Task: ${Math.round(entry.duration)}ms at ${Math.round(entry.startTime)}ms`
                );
              }
            }
          });
          longTaskObserver.observe({ entryTypes: ["longtask"] });
        } catch (e) {
          // Long Tasks API not supported
        }
      }
    };

    // FPS Monitor
    const measureFPS = () => {
      fpsRef.current.frames++;
      const currentTime = performance.now();
      const elapsed = currentTime - fpsRef.current.lastTime;

      if (elapsed >= 1000) {
        fpsRef.current.fps = Math.round(
          (fpsRef.current.frames * 1000) / elapsed
        );
        fpsRef.current.frames = 0;
        fpsRef.current.lastTime = currentTime;

        if (fpsRef.current.fps < 55) {
          console.warn(`⚠️ Low FPS: ${fpsRef.current.fps} fps`);
        }

        report.fps = fpsRef.current.fps;
      }

      requestAnimationFrame(measureFPS);
    };

    // React Profiler Marks
    const trackMarks = () => {
      if ("PerformanceObserver" in window) {
        try {
          const markObserver = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              if (entry.entryType === "mark") {
                marksRef.current.push(entry.name);
              }
            }
          });
          markObserver.observe({ entryTypes: ["mark"] });
        } catch (e) {
          // Not supported
        }
      }
    };

    // Start tracking
    trackWebVitals();
    trackLongTasks();
    trackMarks();
    requestAnimationFrame(measureFPS);

    // Wait for page load
    if (document.readyState === "complete") {
      setTimeout(() => {
        report.marks = marksRef.current;
        console.log("\n📈 Performance Report:", report);
        
        // Send to endpoint if configured
        if (process.env.NEXT_PUBLIC_PERF_AUDIT_ENDPOINT) {
          fetch(process.env.NEXT_PUBLIC_PERF_AUDIT_ENDPOINT, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(report),
          }).catch(() => {
            // Silent fail
          });
        }
      }, 3000);
    } else {
      window.addEventListener("load", () => {
        setTimeout(() => {
          report.marks = marksRef.current;
          console.log("\n📈 Performance Report:", report);
        }, 3000);
      });
    }
  }, []);

  return null;
}
