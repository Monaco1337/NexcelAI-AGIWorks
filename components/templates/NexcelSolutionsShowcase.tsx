"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import Link from "@/components/BrandAwareLink";

type Solution = { href: string; title: string; description?: string };

export function NexcelSolutionsHero({ title, intro }: { title: string; intro: string }) {
  return (
    <header className="nxl-solutions-hero" aria-labelledby="nxl-solutions-title">
      <div className="nxl-solutions-hero-atmosphere" aria-hidden="true">
        <span className="nxl-solutions-mesh nxl-solutions-mesh-a" />
        <span className="nxl-solutions-mesh nxl-solutions-mesh-b" />
        <span className="nxl-solutions-halo nxl-solutions-halo-outer" />
        <span className="nxl-solutions-halo nxl-solutions-halo-inner" />
        <span className="nxl-solutions-beam" />
      </div>
      <div className="nxl-solutions-hero-inner">
        <p className="nxl-solutions-eyebrow"><span aria-hidden="true" /> NEXCEL AI <span className="nxl-solutions-eyebrow-divider">/</span> INTELLIGENTE SYSTEME</p>
        <h1 id="nxl-solutions-title">{title}<span className="nxl-solutions-hero-emphasis"> mit Wirkung.</span></h1>
        <p className="nxl-solutions-hero-copy">{intro}</p>
        <div className="nxl-solutions-hero-actions">
          <Link href="/beratung" className="nxl-solutions-hero-primary">KI-Projekt besprechen <span aria-hidden="true">↗</span></Link>
          <a href="#nxl-solutions-collection" className="nxl-solutions-hero-secondary">Lösungen entdecken <span aria-hidden="true">↓</span></a>
        </div>
        <div className="nxl-solutions-hero-baseline" aria-label="Schwerpunkte">
          <span>KI-Systeme</span><span>Agenten</span><span>Automatisierung</span><span>Integration</span>
        </div>
      </div>
      <div className="nxl-solutions-hero-bottom" aria-hidden="true" />
    </header>
  );
}

export function NexcelSolutionsRail({ heading, items }: { heading: string; items: Solution[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const [active, setActive] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(items.length > 1);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const sync = () => {
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
      rafRef.current = window.requestAnimationFrame(() => {
        const max = Math.max(0, rail.scrollWidth - rail.clientWidth);
        const first = rail.querySelector<HTMLElement>("[data-nxl-solution]");
        const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 0;
        const step = (first?.getBoundingClientRect().width ?? rail.clientWidth) + gap;
        setActive(Math.min(items.length - 1, Math.max(0, Math.round(rail.scrollLeft / Math.max(1, step)))));
        setCanPrev(rail.scrollLeft > 3);
        setCanNext(rail.scrollLeft < max - 3);
        rafRef.current = null;
      });
    };
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(sync);
    observer?.observe(rail);
    sync();
    rail.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      rail.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      observer?.disconnect();
      if (rafRef.current !== null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [items.length]);

  const navigate = useCallback((direction: -1 | 1) => {
    const rail = railRef.current;
    if (!rail) return;
    const first = rail.querySelector<HTMLElement>("[data-nxl-solution]");
    const gap = Number.parseFloat(window.getComputedStyle(rail).columnGap) || 0;
    const distance = (first?.getBoundingClientRect().width ?? rail.clientWidth) + gap;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    rail.scrollBy({ left: distance * direction, behavior: reduced ? "auto" : "smooth" });
  }, []);

  const onRailKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "ArrowLeft") { event.preventDefault(); navigate(-1); }
    if (event.key === "ArrowRight") { event.preventDefault(); navigate(1); }
  };

  if (items.length === 0) return null;

  return (
    <section id="nxl-solutions-collection" className="nxl-solutions-collection" aria-labelledby="nxl-solutions-collection-title">
      <div className="nxl-solutions-collection-heading">
        <div>
          <p className="nxl-solutions-eyebrow nxl-solutions-eyebrow-small">DAS PORTFOLIO <span className="nxl-solutions-eyebrow-divider">/</span> {String(items.length).padStart(2, "0")} BEREICHE</p>
          <h2 id="nxl-solutions-collection-title">{heading}<span>.</span></h2>
          <p>Entdecken Sie die passende Lösung. Wischen, navigieren oder direkt auswählen.</p>
        </div>
        <div className="nxl-solutions-rail-controls" aria-label="Lösungen durchblättern">
          <button type="button" onClick={() => navigate(-1)} disabled={!canPrev} aria-label="Vorherige Lösungen" className="nxl-solutions-rail-arrow">←</button>
          <span className="nxl-solutions-rail-counter" aria-live="polite" aria-atomic="true">{String(active + 1).padStart(2, "0")} <span>/</span> {String(items.length).padStart(2, "0")}</span>
          <button type="button" onClick={() => navigate(1)} disabled={!canNext} aria-label="Weitere Lösungen" className="nxl-solutions-rail-arrow">→</button>
        </div>
      </div>
      <div className="nxl-solutions-rail" ref={railRef} tabIndex={0} role="region" aria-roledescription="Karussell" aria-label="Alle NEXCEL AI Lösungen" onKeyDown={onRailKeyDown}>
        {items.map((item, i) => (
          <Link data-nxl-solution="true" key={item.href} href={item.href} className="nxl-solutions-card group" aria-label={`${item.title} – mehr erfahren`}>
            <div className="nxl-solutions-card-visual" aria-hidden="true">
              <span className="nxl-solutions-card-plate nxl-solutions-card-plate-one" />
              <span className="nxl-solutions-card-plate nxl-solutions-card-plate-two" />
              <span className="nxl-solutions-card-plate nxl-solutions-card-plate-three" />
              <span className="nxl-solutions-card-orbit" />
            </div>
            <div className="nxl-solutions-card-content">
              <p className="nxl-solutions-card-meta">NEXCEL / {String(i + 1).padStart(2, "0")} <span>—</span> SYSTEMKOMPONENTE</p>
              <h3>{item.title}</h3>
              {item.description && <p className="nxl-solutions-card-description">{item.description}</p>}
              <span className="nxl-solutions-card-link">Lösung ansehen <span aria-hidden="true">↗</span></span>
            </div>
          </Link>
        ))}
      </div>
      <div className="nxl-solutions-rail-foot">
        <div className="nxl-solutions-rail-track" role="presentation"><span style={{ width: `${Math.max(10, (100 * (active + 1)) / items.length)}%` }} /></div>
        <p>{items.length} Lösungen · jede Leistung direkt erreichbar</p>
      </div>
    </section>
  );
}
