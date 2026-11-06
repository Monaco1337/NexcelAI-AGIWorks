"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";

const VISUALS = [
  {
    match: /lead|funnel|vertrieb|sales|akquise/i,
    image: "/images/nexcel/usecase-1.svg",
    caption: "Anfragen strukturiert zu qualifizierten Leads weiterfuehren",
  },
  {
    match: /agent|chat|voice|telefon|assist/i,
    image: "/images/nexcel/usecase-2.svg",
    caption: "KI-Unterstuetzung mit klarer Freigabe durch Ihr Team",
  },
  {
    match: /kommunikation|mail|service|kontakt/i,
    image: "/images/nexcel/usecase-3.svg",
    caption: "Kommunikation, Rueckfragen und Antworten sauber organisieren",
  },
  {
    match: /crm|erp|prozess|workflow|daten|integration/i,
    image: "/images/nexcel/usecase-4.svg",
    caption: "Systeme, Status und Prozesse in einem Ablauf verbinden",
  },
] as const;

function closestSection(el: Element | null): HTMLElement | null {
  if (!el) return null;
  return (el.closest("section") || el.closest("main > div") || el.parentElement) as HTMLElement | null;
}

export default function NexcelSolutionTemplate({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "";
  const slug = pathname.split("/").filter(Boolean).pop() ?? "";
  const visual = VISUALS.find((item) => item.match.test(slug)) ?? VISUALS[3];

  useEffect(() => {
    const root = document.querySelector(".nxl-premium-solution-route") as HTMLElement | null;
    if (!root) return;

    const h1 = root.querySelector("h1");
    closestSection(h1)?.setAttribute("data-nxl-solution-hero", "true");

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
    <div className="nxl-premium-solution-route">
      <aside className="nxl-premium-solution-visual" aria-label="Illustrativer Prozess fuer diesen Anwendungsbereich">
        <div className="nxl-premium-solution-visual-top">
          <span className="nxl-premium-visual-dot" aria-hidden />
          ANWENDUNGSBEISPIEL
        </div>

        <div className="nxl-premium-solution-visual-frame">
          <img
            src={visual.image}
            alt={visual.caption}
            className="nxl-premium-solution-visual-image"
            loading="eager"
          />
        </div>

        <div className="nxl-premium-solution-visual-bottom">
          <span>{visual.caption}</span>
          <Link href="/kontakt?betreff=KI-Projekt%20besprechen">
            Projekt besprechen <span aria-hidden>↗</span>
          </Link>
        </div>
      </aside>

      {children}
    </div>
  );
}
