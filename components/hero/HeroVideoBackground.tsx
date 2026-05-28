"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { BrandId } from "@/types/brand";
import {
  HERO_MOBILE_POSTER,
  PRIMARY_HERO_SRC,
} from "@/lib/hero-video-config";

/**
 * Sicheres Auto-Play: ein einmaliger play()-Aufruf, falls der Browser
 * das `autoplay`-Attribut in einem Edge-Case blockiert (z.B. Safari iOS,
 * wenn das Element noch nicht im aktiven Tab war). Da das Video `muted`
 * ist, ist autoplay erlaubt; play() ist hier nur Versicherung.
 */
function tryPlay(el: HTMLVideoElement | null) {
  if (!el) return;
  const p = el.play();
  if (p && typeof p.catch === "function") {
    p.catch(() => {
      /* Autoplay-Blockade ist tolerierbar — Poster bleibt sichtbar. */
    });
  }
}

/**
 * Hero video background:
 * — exklusiv ein einziger Clip (PRIMARY_HERO_SRC)
 * — kein Pool, keine Rotation, keine Crossfades
 * — kein transform/CSS-Keyframe am Video (WebKit/GPU-Streifen)
 */

interface Props {
  brandAccentRgb?: string;
  brandId?: BrandId;
}

function OverlayStack({ brandAccentRgb }: { brandAccentRgb: string }) {
  return (
    <>
      {/* Subtle brand bloom — top left */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 110% 70% at 28% 28%, rgba(${brandAccentRgb},0.12) 0%, transparent 60%)`,
        }}
      />

      {/* Light, even darkening — keeps video clearly visible */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(0,0,0,0.42)",
        }}
      />

      {/* Reading gradient — slightly stronger on the left for headline contrast */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.22) 28%, rgba(0,0,0,0.06) 58%, rgba(0,0,0,0) 100%)",
        }}
      />

      {/* Soft cinema vignette (subtle) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 110% 90% at 50% 50%, transparent 50%, rgba(0,0,0,0.32) 100%)",
        }}
      />

      {/* Light bloom — soft brand glow (ohne mix-blend: vermeidet WebKit-Streifen-Artefakte) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 55% 42% at 72% 36%, rgba(${brandAccentRgb},0.12) 0%, transparent 65%)`,
          opacity: 0.85,
        }}
      />
    </>
  );
}

export default function HeroVideoBackground({
  brandAccentRgb = "139,92,246",
  brandId = "nexcel",
}: Props) {
  const poster =
    brandId === "agiworks" ? HERO_MOBILE_POSTER.agiworks : HERO_MOBILE_POSTER.nexcel;

  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  // Sofort beim Mount: Auto-Play sichern + bereits gepufferte Frames erkennen.
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    // Falls das Video bereits beim Mount lieferbereit ist (Cache, schnelle Verbindung),
    // direkt einblenden — ohne auf canplay-Event warten zu müssen.
    if (el.readyState >= 2) {
      setReady(true);
    }
    tryPlay(el);
  }, []);

  // Sobald das Tab in den Vordergrund kommt, sicherstellen, dass das Video läuft.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const onVisible = () => {
      if (!document.hidden) tryPlay(videoRef.current);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const handleReady = useCallback(() => {
    setReady(true);
    tryPlay(videoRef.current);
  }, []);

  /**
   * Keine CSS-Keyframe-Animation auf dem <video>-Tag: Auf Safari/WebKit machen
   * `transform`-Animation + Video-Layer oft die klassischen vertikalen Streifen.
   * Optional: sehr subtile Bewegung später nur auf einem Wrapper ohne Video-Transform.
   */
  const motionStyle = { animation: "none" as const };

  /* Kein blur()/filter auf dem Video: verhindert GPU-Streifen auf manchen GPUs. */
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Sofort sichtbares Poster als visueller Anker, bis das erste Video-Frame da ist.
          Liegt unter dem Video — das Video überdeckt es, sobald es eingeblendet ist. */}
      <div
        className="absolute inset-0 h-full w-full bg-cover bg-center"
        style={{
          backgroundImage: `url(${poster})`,
          opacity: ready ? 0 : 1,
          transition: "opacity 600ms cubic-bezier(0.16, 1, 0.3, 1)",
          willChange: "opacity",
        }}
        aria-hidden
      />
      <video
        ref={videoRef}
        src={PRIMARY_HERO_SRC}
        poster={poster}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        disableRemotePlayback
        onLoadedData={handleReady}
        onCanPlay={handleReady}
        onPlaying={handleReady}
        className="absolute inset-0 h-full w-full object-cover"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 700ms cubic-bezier(0.16, 1, 0.3, 1)",
          ...motionStyle,
        }}
      />
      <OverlayStack brandAccentRgb={brandAccentRgb} />
    </div>
  );
}
