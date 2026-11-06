"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const META_SIGNATURES = [
  "verantwortlich celina siebeneicher",
  "sitz unna, nordrhein-westfalen",
  "service-region unna · kreis unna · dortmund",
  "kontakt info@nexcelai.de",
  "inhaltlich verantwortlich celina siebeneicher",
  "anbieterkennzeichnung / impressum",
];

const SECTION_TITLES = [
  "das wichtigste zuerst",
  "das problem",
  "was gebaut wird",
  "wie wir vorgehen",
  "passende nächste schritte",
  "was wir zusichern",
  "häufige fragen",
  "wann sinnvoll",
  "projektkorridor",
];

function norm(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

function findClosestCard(el: HTMLElement | null): HTMLElement | null {
  let current = el;
  while (current) {
    const tag = current.tagName.toLowerCase();
    const cls = current.className || "";
    const text = norm(current.textContent || "");
    if (
      ["div", "article", "section", "li"].includes(tag) &&
      text.length < 320 &&
      (
        cls.toString().includes("rounded") ||
        cls.toString().includes("border") ||
        cls.toString().includes("card") ||
        cls.toString().includes("panel") ||
        cls.toString().includes("glass")
      )
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return el;
}

function hideMetaCards(main: HTMLElement) {
  const nodes = Array.from(main.querySelectorAll("div, article, section")) as HTMLElement[];
  const matched = new Set<HTMLElement>();

  nodes.forEach((node) => {
    const text = norm(node.textContent || "");
    if (!text || text.length > 320) return;

    const hit = META_SIGNATURES.some((sig) => text.includes(sig));
    if (!hit) return;

    const card = findClosestCard(node);
    if (card) matched.add(card);
  });

  matched.forEach((card) => {
    card.style.display = "none";
    const parent = card.parentElement as HTMLElement | null;
    if (parent) parent.dataset.nxlMetaCleanup = "1";
  });

  const cleanupParents = Array.from(main.querySelectorAll('[data-nxl-meta-cleanup="1"]')) as HTMLElement[];
  cleanupParents.forEach((parent) => {
    const visibleChildren = Array.from(parent.children).filter((child) => {
      const style = window.getComputedStyle(child as Element);
      return style.display !== "none";
    });
    if (visibleChildren.length <= 1) {
      parent.style.display = "none";
    }
  });
}

function markHero(main: HTMLElement) {
  const heroTitle = main.querySelector("h1") as HTMLElement | null;
  if (!heroTitle) return;

  heroTitle.classList.add("nxl-solution-h1");

  const heroSection = heroTitle.closest("section") as HTMLElement | null;
  if (heroSection) {
    heroSection.classList.add("nxl-solution-hero");
    const firstContainer = heroSection.firstElementChild as HTMLElement | null;
    if (firstContainer) firstContainer.classList.add("nxl-solution-hero-grid");
  }
}

function markSections(main: HTMLElement) {
  const sections = Array.from(main.querySelectorAll("section")) as HTMLElement[];
  sections.forEach((section) => {
    const heading = section.querySelector("h2, h3") as HTMLElement | null;
    const text = norm(heading?.textContent || "");

    if (SECTION_TITLES.some((item) => text.includes(item))) {
      section.classList.add("nxl-solution-section");
    }

    if (text.includes("welche aufgabe sollte ihr team nicht länger")) {
      section.classList.add("nxl-final-cta");
    }
  });
}

function renameButtons(main: HTMLElement) {
  const clickable = Array.from(main.querySelectorAll("a, button")) as HTMLElement[];
  clickable.forEach((el) => {
    const text = norm(el.textContent || "");
    if (text === "systemanalyse starten") {
      el.textContent = "Automatisierungspotenzial besprechen";
      el.classList.add("nxl-primary-upgraded");
    }
  });
}

export function SolutionUiEnhancer() {
  const pathname = usePathname();

  useEffect(() => {
    const active = pathname?.startsWith("/loesungen/");
    document.body.classList.toggle("nxl-solutions-enhanced", !!active);

    if (!active) return;

    const main = document.querySelector("main") as HTMLElement | null;
    if (!main) return;

    markHero(main);
    markSections(main);
    renameButtons(main);
    hideMetaCards(main);
  }, [pathname]);

  return null;
}
