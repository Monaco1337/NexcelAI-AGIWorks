"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BrandId } from "@/types/brand";
import {
  HERO_MOBILE_POSTER,
  PRIMARY_HERO_SRC,
  selectCuratedHeroPlaylist,
} from "@/lib/hero-video-config";

/**
 * Cinematic hero video field:
 * — kuratierter Multi-Branchen-Pool (siehe lib/hero-video-config.ts)
 * — langsame Crossfades, Ken-Burns nur bei voller Motion
 * — Mobile / prefers-reduced-motion: ein Clip + Poster, kein Bandbreiten-Rotationsspiel
 */

const CLIP_HOLD_MS = 12_000;
const PRIMARY_HOLD_MS = 18_000;
const FADE_MS = 2800;
const PLAYLIST_SIZE = 8;
const KEN_BURNS_S = 28;

interface Props {
  brandAccentRgb?: string;
  brandId?: BrandId;
}

function OverlayStack({ brandAccentRgb }: { brandAccentRgb: string }) {
  return (
    <>
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 130% 90% at 50% 18%, rgba(${brandAccentRgb},0.065) 0%, transparent 55%)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.64) 32%, rgba(0,0,0,0.3) 58%, rgba(0,0,0,0.12) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0.78) 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 h-48"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.62) 0%, transparent 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 82% 72% at 50% 48%, transparent 28%, rgba(0,0,0,0.52) 100%)",
        }}
      />
      <div
        className="hero-noise absolute inset-0"
        style={{ opacity: 0.026, mixBlendMode: "overlay" }}
      />
    </>
  );
}

export default function HeroVideoBackground({
  brandAccentRgb = "139,92,246",
  brandId = "nexcel",
}: Props) {
  const playlist = useMemo(
    () => selectCuratedHeroPlaylist(PLAYLIST_SIZE),
    [],
  );

  const poster =
    brandId === "blaze"
      ? HERO_MOBILE_POSTER.blaze
      : HERO_MOBILE_POSTER.nexcel;

  const [activeSlot, setActiveSlot] = useState<0 | 1>(0);
  const [slotSrc, setSlotSrc] = useState<[string, string]>(() => [
    playlist[0]?.src ?? "",
    playlist[Math.min(1, playlist.length - 1)]?.src ?? "",
  ]);
  const clipIdxRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [primaryReady, setPrimaryReady] = useState(false);
  const videoA = useRef<HTMLVideoElement>(null);
  const videoB = useRef<HTMLVideoElement>(null);
  const [env, setEnv] = useState({
    mobile: false,
    reducedMotion: false,
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mqReduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const read = () =>
      setEnv({
        mobile: window.innerWidth < 768,
        reducedMotion: mqReduce.matches,
      });
    read();
    window.addEventListener("resize", read);
    mqReduce.addEventListener("change", read);
    return () => {
      window.removeEventListener("resize", read);
      mqReduce.removeEventListener("change", read);
    };
  }, []);

  const enableRotation =
    playlist.length > 1 && !env.mobile && !env.reducedMotion;

  const handleFirstReady = useCallback(() => {
    setReady(true);
    if (playlist[0]?.src === PRIMARY_HERO_SRC) {
      setTimeout(() => setPrimaryReady(true), 200);
    } else {
      setPrimaryReady(true);
    }
  }, [playlist]);

  useEffect(() => {
    if (!enableRotation) return;

    const isPrimary = playlist[clipIdxRef.current]?.src === PRIMARY_HERO_SRC;
    const holdMs = isPrimary ? PRIMARY_HOLD_MS : CLIP_HOLD_MS;

    let timeoutId: ReturnType<typeof setTimeout>;

    const scheduleNext = (delay: number) => {
      timeoutId = setTimeout(() => {
        setActiveSlot((prev) => {
          const next: 0 | 1 = prev === 0 ? 1 : 0;

          setTimeout(() => {
            clipIdxRef.current =
              (clipIdxRef.current + 1) % playlist.length;
            const preloadIdx =
              (clipIdxRef.current + 1) % playlist.length;
            const preloadSrc = playlist[preloadIdx]!.src;

            setSlotSrc((s) => {
              const copy: [string, string] = [...s];
              copy[prev] = preloadSrc;
              return copy;
            });

            const nextIsPrimary =
              playlist[clipIdxRef.current]?.src === PRIMARY_HERO_SRC;
            scheduleNext(nextIsPrimary ? PRIMARY_HOLD_MS : CLIP_HOLD_MS);
          }, FADE_MS + 450);

          return next;
        });
      }, delay);
    };

    scheduleNext(holdMs);
    return () => clearTimeout(timeoutId);
  }, [playlist, enableRotation]);

  useEffect(() => {
    const v = activeSlot === 0 ? videoA.current : videoB.current;
    void v?.play().catch(() => {});
  }, [activeSlot]);

  const kenBurns =
    env.reducedMotion || env.mobile
      ? "none"
      : `heroKenBurns ${KEN_BURNS_S}s ease-in-out infinite alternate`;

  const firstSrc = playlist[0]?.src ?? "";

  if (!playlist.length) {
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#030308]">
        <OverlayStack brandAccentRgb={brandAccentRgb} />
      </div>
    );
  }

  if (!enableRotation && firstSrc) {
    const isPrimary = firstSrc === PRIMARY_HERO_SRC;
    return (
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <video
          ref={videoA}
          src={firstSrc}
          poster={poster}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onCanPlay={handleFirstReady}
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            opacity: primaryReady ? 1 : 0,
            transition: isPrimary
              ? "opacity 2.4s cubic-bezier(0.16, 1, 0.3, 1)"
              : "opacity 1.4s ease-out",
            animation: kenBurns,
            willChange: "opacity, transform",
          }}
        />
        <div
          className="absolute inset-0 bg-[#030308] transition-opacity duration-[1800ms]"
          style={{ opacity: primaryReady ? 0 : 1, pointerEvents: "none" }}
        />
        <OverlayStack brandAccentRgb={brandAccentRgb} />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <video
        key={`a-${slotSrc[0]}`}
        ref={videoA}
        src={slotSrc[0]}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onCanPlay={handleFirstReady}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: activeSlot === 0 && primaryReady ? 1 : 0,
          transition:
            slotSrc[0] === PRIMARY_HERO_SRC
              ? "opacity 2.4s cubic-bezier(0.16, 1, 0.3, 1)"
              : `opacity ${FADE_MS}ms cubic-bezier(0.45, 0, 0.2, 1)`,
          animation: kenBurns,
          willChange: "opacity, transform",
        }}
      />

      <video
        key={`b-${slotSrc[1]}`}
        ref={videoB}
        src={slotSrc[1]}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: activeSlot === 1 && primaryReady ? 1 : 0,
          transition:
            slotSrc[1] === PRIMARY_HERO_SRC
              ? "opacity 2.4s cubic-bezier(0.16, 1, 0.3, 1)"
              : `opacity ${FADE_MS}ms cubic-bezier(0.45, 0, 0.2, 1)`,
          animation: kenBurns,
          animationDelay: env.reducedMotion ? "0s" : "-10s",
          willChange: "opacity, transform",
        }}
      />

      <div
        className="absolute inset-0 bg-[#030308] transition-opacity duration-[1800ms]"
        style={{ opacity: primaryReady ? 0 : 1, pointerEvents: "none" }}
      />

      <OverlayStack brandAccentRgb={brandAccentRgb} />
    </div>
  );
}
