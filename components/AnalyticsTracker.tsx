"use client";

/**
 * AnalyticsTracker
 *
 * High-end first-party tracking layer:
 *  - page_view on route change (with referrer + viewport)
 *  - scroll_depth (max % per page, fired throttled + on unload)
 *  - dwell (seconds spent on the page, fired on route change / unload)
 *  - outbound_click delegation (clicks on external links)
 *  - visibility_change (tab hidden/visible)
 *
 * No external SDKs — uses `lib/track.ts` which POSTs to /api/analytics/track
 * via navigator.sendBeacon. Admin panel pages are excluded from tracking.
 */

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { track, trackBatch } from "@/lib/track";

const EXCLUDED_PREFIXES = ["/admin", "/api"];

function isExcluded(pathname: string) {
  return EXCLUDED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function AnalyticsTracker() {
  const pathname = usePathname();
  const startedAtRef = useRef<number>(0);
  const maxScrollRef = useRef<number>(0);
  const lastPageRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname || isExcluded(pathname)) return;

    // Fire dwell + scroll for the previous page (if any).
    if (lastPageRef.current && lastPageRef.current !== pathname) {
      const dwellSec = Math.round((Date.now() - startedAtRef.current) / 1000);
      trackBatch([
        {
          type: "dwell",
          page: lastPageRef.current,
          value: Math.max(0, dwellSec),
        },
        {
          type: "scroll_depth",
          page: lastPageRef.current,
          value: maxScrollRef.current,
        },
      ]);
    }

    // Reset for the new page.
    startedAtRef.current = Date.now();
    maxScrollRef.current = 0;
    lastPageRef.current = pathname;

    track("page_view", {
      meta: {
        path: pathname,
        title: typeof document !== "undefined" ? document.title : undefined,
      },
    });
  }, [pathname]);

  /* Scroll-depth listener (throttled). */
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!pathname || isExcluded(pathname)) return;

    let raf = 0;
    const compute = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      if (total <= 0) return;
      const pct = Math.min(100, Math.round((window.scrollY / total) * 100));
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;
    };
    const onScroll = () => {
      if (raf) return;
      raf = window.requestAnimationFrame(() => {
        raf = 0;
        compute();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    compute();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [pathname]);

  /* Outbound link delegation. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement | null)?.closest("a");
      if (!target) return;
      const href = target.getAttribute("href") || "";
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(href, window.location.href);
        if (url.origin !== window.location.origin) {
          track("outbound_click", { meta: { href: url.href } });
        }
      } catch {
        /* ignore malformed urls */
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  /* Visibility + final unload flush. */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flush = () => {
      if (!lastPageRef.current) return;
      const dwellSec = Math.round((Date.now() - startedAtRef.current) / 1000);
      trackBatch([
        { type: "dwell", page: lastPageRef.current, value: Math.max(0, dwellSec) },
        { type: "scroll_depth", page: lastPageRef.current, value: maxScrollRef.current },
      ]);
    };
    const onVisibility = () => {
      track("visibility_change", {
        meta: { state: document.visibilityState },
      });
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", flush);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return null;
}
