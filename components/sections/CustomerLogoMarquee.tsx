"use client";

/**
 * NEXCEL AI / AGI WORKS · CustomerLogoMarquee
 *
 * Datengetrieben: Logos kommen primär aus der Datenbank (im Admin-Panel per
 * Drag-and-Drop pflegbar). Solange keine DB-Logos existieren oder keine DB
 * verbunden ist, werden die unten hinterlegten Standard-Logos angezeigt —
 * die Sektion ist damit nie leer.
 *
 * Feinjustierung über max-h/max-w (className) und CSS filter (filterStyle).
 */

import { useEffect, useState } from "react";
import { DEFAULT_LOGOS } from "@/lib/default-logos";

type CustomerLogo = {
  name: string;
  src: string;
  /** Tailwind-Klassen für max-h / max-w Balance */
  className: string;
  /** Inline filter-Korrekturen für dunklen Hintergrund */
  style?: React.CSSProperties;
};

const defaultLogos: CustomerLogo[] = DEFAULT_LOGOS.map((l) => ({
  name: l.name,
  src: l.src,
  className: l.className,
  style: { filter: l.filterStyle },
}));

type ApiLogo = {
  id: string;
  name: string;
  src: string;
  className?: string;
  filterStyle?: string;
};

export default function CustomerLogoMarquee() {
  const [logos, setLogos] = useState<CustomerLogo[]>(defaultLogos);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/logos", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        const apiLogos: ApiLogo[] = Array.isArray(data?.logos) ? data.logos : [];
        if (!cancelled && data?.dbConnected && apiLogos.length > 0) {
          setLogos(
            apiLogos.map((l) => ({
              name: l.name,
              src: l.src,
              className:
                l.className ||
                "max-h-[48px] max-w-[160px] sm:max-h-[56px] sm:max-w-[184px]",
              style: l.filterStyle ? { filter: l.filterStyle } : undefined,
            })),
          );
        }
      } catch {
        /* Fallback bleibt: defaultLogos */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loop = [...logos, ...logos];

  return (
    <section
      className="relative w-full pb-10 pt-6 sm:pb-14 sm:pt-8"
      style={{
        background:
          "linear-gradient(to bottom," +
          "#0b0d12 0%," +
          "rgba(8,6,18,0.95) 30%," +
          "rgba(5,3,14,0.90) 100%)",
      }}
    >
      {/* faint violet carry-over glow from Hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-2/3 -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%,rgba(109,40,217,0.10) 0%,transparent 75%)",
          filter: "blur(1px)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <h2
          className="mb-6 text-center text-[1.2rem] font-[300] leading-[1.2] tracking-[-0.015em] text-white/60 sm:mb-7 sm:text-[1.35rem]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          Vertraut von Unternehmen, die wachsen wollen
        </h2>

        {/* ── Slider ── */}
        <div
          className="nxl-marquee-track group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur"
          style={{
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0, #000 9%, #000 91%, transparent 100%)",
            maskImage:
              "linear-gradient(90deg, transparent 0, #000 9%, #000 91%, transparent 100%)",
          }}
        >
          <div className="nxl-marquee flex w-max items-center">
            {loop.map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="flex h-[78px] shrink-0 items-center justify-center px-7 sm:h-[100px] sm:px-12"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.name}
                  title={logo.name}
                  loading="lazy"
                  draggable={false}
                  aria-hidden={i >= logos.length}
                  className={`h-auto w-auto select-none object-contain transition duration-500 ease-out will-change-transform hover:translate-y-[-1px] hover:opacity-100 hover:brightness-110 ${logo.className}`}
                  style={logo.style}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes nxl-logo-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .nxl-marquee {
          animation: nxl-logo-scroll 46s linear infinite;
        }
        .nxl-marquee-track:hover .nxl-marquee {
          animation-play-state: paused;
        }
        @media (max-width: 640px) {
          .nxl-marquee { animation-duration: 38s; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nxl-marquee { animation: none; transform: none; }
        }
      `}</style>
    </section>
  );
}
