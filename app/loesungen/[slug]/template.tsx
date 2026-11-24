"use client";

import "./premium-detail-v11.css";
import { useEffect, type ReactNode } from "react";

// NXL_DETAIL_PREMIUM_V11_SCOPED: the preview visual is rendered in the real hero, not overlaid.

function closestSection(el: Element | null): HTMLElement | null {
  if (!el) return null;
  return (el.closest("section") || el.closest("main > div") || el.parentElement) as HTMLElement | null;
}

export default function NexcelSolutionTemplate({ children }: { children: ReactNode }) {
  useEffect(() => {
    const root = document.querySelector(".nxl-premium-solution-route") as HTMLElement | null;
    if (!root) return;

    root.querySelector(".v6-template-hero")?.setAttribute("data-nxl-solution-hero", "true");

    const markers: Array<[RegExp, string]> = [
      [/Das Problem/i, "data-nxl-problem-section"],
      [/Was gebaut wird/i, "data-nxl-build-section"],
      [/Wie wir vorgehen/i, "data-nxl-approach-section"],
      [/Passende Einsatzbereiche/i, "data-nxl-fit-section"],
      [/Wann sinnvoll/i, "data-nxl-when-section"],
      [/Projektkorridor statt Fixpreis/i, "data-nxl-pricing-section"],
      [/Wie ein Projekt laeuft|Wie ein Projekt läuft/i, "data-nxl-process-section"],
      [/Passende naechste Schritte|Passende nächste Schritte/i, "data-nxl-next-section"],
      [/Was wir zusichern/i, "data-nxl-trust-section"],
      [/Haeufige Fragen|Häufige Fragen/i, "data-nxl-faq-section"],
      [/Welche Aufgabe sollte Ihr Team nicht laenger|Welche Aufgabe sollte Ihr Team nicht länger/i, "data-nxl-final-cta"],
    ];

    Array.from(root.querySelectorAll("h2, h3")).forEach((heading) => {
      const text = (heading.textContent || "").trim();
      for (const [pattern, attr] of markers) {
        if (pattern.test(text)) {
          closestSection(heading)?.setAttribute(attr, "true");
          break;
        }
      }
    });


  }, []);

  return (
    <div className="nxl-premium-solution-route nxl-detail-v11">
      {children}
    </div>
  );
}
