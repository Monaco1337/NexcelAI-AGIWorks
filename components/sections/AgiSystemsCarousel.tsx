"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";

import { SYSTEMS } from "@/lib/systems-data";
import type { SystemCardEntry } from "@/lib/systems-store";

type CategoryId =
  | "vertrieb"
  | "kunden"
  | "unternehmen"
  | "ki-plattform";

type Card = {
  slug: string;
  title: string;
  desc: string;
  image: string;
  alt: string;
  category: string;
  isPublished: boolean;
};

const CATEGORIES: {
  id: CategoryId;
  label: string;
  slugs: string[];
}[] = [
  {
    id: "vertrieb",
    label: "Vertrieb",
    slugs: [
      "lead-funnels-crm",
      "vertriebsplattform-partnerportal",
      "angebots-beratungssystem"
    ]
  },
  {
    id: "kunden",
    label: "Kunden",
    slugs: [
      "kundenportal-self-service",
      "buchungs-beauty-systeme",
      "mitglieder-clubverwaltung",
      "service-supportportal",
      "omnichannel-kommunikation"
    ]
  },
  {
    id: "unternehmen",
    label: "Unternehmen",
    slugs: [
      "erp-systeme",
      "admin-operations-system",
      "dokumentenmanagement-freigaben",
      "projekt-aufgabenmanagement",
      "mitarbeiter-hr-system",
      "warenwirtschaft-lagerverwaltung",
      "dashboard-reporting",
      "recruiting-bewerberplattform"
    ]
  },
  {
    id: "ki-plattform",
    label: "KI-Plattform",
    slugs: [
      "ki-automatisierung",
      "ki-telefonagent-voice",
      "premium-websysteme",
      "branchen-plattformen",
      "saas-plattform-multi-tenant",
      "akademie-lernplattform",
      "schnittstellen-integrationen"
    ]
  }
];

function fromStatic(s: (typeof SYSTEMS)[number]): Card {
  const group = CATEGORIES.find((c) =>
    c.slugs.includes(s.slug)
  );

  const category =
    group?.id === "ki-plattform"
      ? s.slug.startsWith("ki-")
        ? "ki"
        : "plattformen"
      : group?.id ?? "unternehmen";

  return {
    slug: s.slug,
    title: s.title,
    desc: s.desc,
    image: s.image,
    alt: s.alt,
    category,
    isPublished: true
  };
}

const initialCards: Card[] = SYSTEMS.map(fromStatic);

export default function AgiSystemsCarousel() {
  const pathname = usePathname();

  const prefix = pathname?.startsWith("/agiworks")
    ? "/agiworks"
    : "";

  const [active, setActive] = useState<CategoryId>("vertrieb");
  const [cards, setCards] = useState<Card[]>(initialCards);
  const [position, setPosition] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const trackRef = useRef<HTMLDivElement>(null);

  // Vorhandene, veröffentlichte Systemdaten laden.
  // Bei Netzwerkfehlern bleiben die statischen Originaldaten.

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/systems", {
      signal: controller.signal
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Systemliste nicht erreichbar");
        }

        return response.json();
      })
      .then((data: { systems?: SystemCardEntry[] }) => {
        if (!Array.isArray(data.systems)) return;

        const known = new Set<string>(
          SYSTEMS.map((item) => item.slug)
        );

        const nextCards: Card[] = data.systems
          .filter(
            (item) =>
              item &&
              known.has(item.slug) &&
              item.isPublished
          )
          .map((item) => {
            const fallback = initialCards.find(
              (card) => card.slug === item.slug
            );

            return {
              slug: item.slug,
              title:
                item.title ||
                fallback?.title ||
                item.slug,
              desc:
                item.desc ||
                fallback?.desc ||
                "",
              image:
                item.image ||
                fallback?.image ||
                "",
              alt:
                item.alt ||
                fallback?.alt ||
                item.title,
              category: item.category,
              isPublished: true
            };
          });

        setCards(nextCards);
      })
      .catch(() => {
        // Statischer Fallback bleibt bestehen.
      });

    return () => controller.abort();
  }, []);

  const selectedGroup =
    CATEGORIES.find((group) => group.id === active) ??
    CATEGORIES[0];

  const visibleCards = useMemo(() => {
    return cards.filter((card) => {
      if (!card.isPublished) return false;

      if (selectedGroup.slugs.includes(card.slug)) {
        return true;
      }

      if (active === "ki-plattform") {
        return (
          card.category === "ki" ||
          card.category === "plattformen"
        );
      }

      return card.category === active;
    });
  }, [cards, active, selectedGroup]);

  // Slider-Position und verfügbare Pfeilrichtung synchronisieren.

  const syncScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;

    const max = Math.max(
      0,
      el.scrollWidth - el.clientWidth
    );

    const left = Math.max(
      0,
      Math.min(el.scrollLeft, max)
    );

    const first = el.children.item(0) as HTMLElement | null;
    const second = el.children.item(1) as HTMLElement | null;

    const distance =
      first && second
        ? second.offsetLeft - first.offsetLeft
        : 1;

    setPosition(
      Math.max(
        0,
        Math.min(
          visibleCards.length - 1,
          Math.round(left / Math.max(1, distance))
        )
      )
    );

    setCanPrev(left > 5);
    setCanNext(left < max - 5);
  }, [visibleCards.length]);

  // Bei Kategorienwechsel wieder am Anfang beginnen.

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;

    el.scrollLeft = 0;
    setPosition(0);

    const frame = requestAnimationFrame(syncScroll);
    const observer = new ResizeObserver(syncScroll);

    observer.observe(el);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [active, visibleCards.length, syncScroll]);

  function move(direction: number) {
    const el = trackRef.current;
    if (!el) return;

    const first = el.children.item(0) as HTMLElement | null;
    const second = el.children.item(1) as HTMLElement | null;

    const step =
      first && second
        ? second.offsetLeft - first.offsetLeft
        : (first?.offsetWidth || 320) + 20;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    el.scrollBy({
      left: direction * step,
      behavior: reduceMotion ? "auto" : "smooth"
    });
  }

  return (
    <section
      id="systeme"
      aria-labelledby="agi-systeme-title"
      className="relative scroll-mt-[110px] overflow-hidden bg-[#080b13] py-16 sm:py-20"
     data-homeflow-surface="true">
      <div className="mx-auto max-w-[1260px]">


        {/* AGI EDITORIAL TABS V2 */}

        <header className="px-5 sm:px-8">

          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-300/85 sm:text-[11px]">
            INDIVIDUELLE SOFTWARELÖSUNGEN
          </p>

          <h2
            id="agi-systeme-title"
            className="mt-4 max-w-[950px] text-[clamp(2.15rem,4vw,3.5rem)] font-light leading-[1.14] tracking-[-0.045em] text-white"
            style={{
              fontFamily:
                "var(--font-headline),system-ui,sans-serif"
            }}
          >
            Was soll Ihre Software{" "}
            <span className="bg-gradient-to-r from-[#d9e9f8] via-[#9ac9f3] to-[#549cdd] bg-clip-text text-transparent">
              leisten?
            </span>
          </h2>

          <p className="mt-4 max-w-[680px] text-[14px] leading-[1.75] text-white/60 sm:text-[16px]">
            Wählen Sie einen Bereich und entdecken Sie
            passende Lösungen für Ihr Unternehmen.
          </p>

        </header>

        {/* Schlanke Tabs statt großer Kategorie-Kästen */}

        <div className="mx-5 mt-9 border-b border-white/[0.13] sm:mx-8 sm:mt-10">

          <div
            role="group"
            aria-label="Softwarebereich wählen"
            className="flex items-center gap-7 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-11"
          >

            {CATEGORIES.map((category) => {
              const selected = active === category.id;

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  aria-controls="agi-carousel-track"
                  onClick={() => setActive(category.id)}
                  className={
                    "relative min-h-12 shrink-0 whitespace-nowrap border-0 bg-transparent px-0.5 pb-4 pt-3 text-[14px] font-medium tracking-[-0.01em] transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-300 sm:text-[15px] " +
                    (selected
                      ? "text-white"
                      : "text-white/45 hover:text-white/85")
                  }
                >
                  {category.label}

                  <span
                    aria-hidden="true"
                    className={
                      "absolute inset-x-0 bottom-[-1px] h-[2px] rounded-full transition-colors duration-200 " +
                      (selected
                        ? "bg-sky-300 shadow-[0_0_16px_rgba(108,187,245,0.3)]"
                        : "bg-transparent")
                    }
                  />

                </button>
              );
            })}

          </div>

        </div>

        {/* SLIDER-NAVIGATION */}

        <div className="mb-5 mt-6 flex items-center justify-between gap-4 px-5 sm:px-8">


          <p className="text-[13px] text-white/50">
            <span className="font-medium text-white/80">
              {visibleCards.length}
            </span>{" "}
            {visibleCards.length === 1
              ? "Softwarelösung"
              : "Softwarelösungen"}
          </p>

          <div className="flex shrink-0 items-center gap-3">

            <span
              className="mr-1 text-[12px] tabular-nums text-white/45"
              aria-live="polite"
            >
              {String(
                visibleCards.length === 0
                  ? 0
                  : position + 1
              ).padStart(2, "0")}{" "}
              /{" "}
              {String(visibleCards.length).padStart(2, "0")}
            </span>

            <button
              type="button"
              onClick={() => move(-1)}
              disabled={!canPrev}
              aria-label="Vorherige Softwarelösung"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.035] text-white/85 transition-colors hover:border-sky-300/40 hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m15 18-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => move(1)}
              disabled={!canNext}
              aria-label="Nächste Softwarelösung"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.035] text-white/85 transition-colors hover:border-sky-300/40 hover:bg-white/[0.09] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 disabled:cursor-not-allowed disabled:opacity-25"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m9 18 6-6-6-6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

          </div>
        </div>

        {/* HORIZONTALER PREMIUM-SLIDER */}

        <div
          id="agi-carousel-track"
          ref={trackRef}
          onScroll={syncScroll}
          onKeyDown={(event) => {
            if (
              event.key === "ArrowRight" ||
              event.key === "ArrowLeft"
            ) {
              event.preventDefault();

              move(
                event.key === "ArrowRight" ? 1 : -1
              );
            }
          }}
          tabIndex={0}
          role="region"
          aria-label={
            "Softwarelösungen: " + selectedGroup.label
          }
          className="flex snap-x snap-mandatory gap-5 overflow-x-auto overscroll-x-contain px-5 pb-3 scroll-smooth motion-reduce:scroll-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-sky-300 sm:px-8"
        >

          {visibleCards.map((card) => (

            <Link
              key={card.slug}
              href={
                prefix + "/systeme/" + card.slug
              }
              aria-label={card.title + " ansehen"}
              className="group flex w-[84%] shrink-0 snap-start flex-col overflow-hidden rounded-[24px] border border-white/[0.12] bg-[#111722] transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/35 hover:bg-[#151e2c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300 sm:w-[57%] lg:w-[calc((100%-1.25rem)/2)]"
            >

              {/* ORIGINALBILD, KEINE EMOJIS */}

              <div className="relative aspect-[16/10] overflow-hidden border-b border-white/10 bg-[#0a101b]">

                {card.image ? (
                  <Image
                    src={card.image}
                    alt={card.alt || card.title}
                    fill
                    sizes="(min-width: 1024px) 560px, (min-width: 640px) 57vw, 84vw"
                    className="object-contain transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transition-none"
                  />
                ) : null}

              </div>

              {/* TEXT UND LINK */}

              <div className="flex min-h-[195px] flex-1 flex-col px-6 pb-6 pt-5 sm:px-7">

                <h3
                  className="text-[21px] font-normal leading-[1.2] tracking-[-0.025em] text-white sm:text-[24px]"
                  style={{
                    fontFamily:
                      "var(--font-headline),system-ui,sans-serif"
                  }}
                >
                  {card.title}
                </h3>

                <p className="mt-3 line-clamp-2 text-[14px] leading-[1.7] text-white/60">
                  {card.desc}
                </p>

                <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/10 pt-5 text-[13px] font-medium text-sky-100">

                  <span>System ansehen</span>

                  <svg
                    width="17"
                    height="17"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14m-6-6 6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>

                </div>

              </div>

            </Link>

          ))}

          {visibleCards.length === 0 && (

            <p className="w-full rounded-xl border border-white/10 px-6 py-10 text-center text-white/60">
              Für diesen Bereich sind aktuell keine Systeme veröffentlicht.
            </p>

          )}

        </div>

        {/* ABSCHLUSS */}

        <div className="mx-5 mt-9 flex flex-col gap-5 border-t border-white/10 pt-7 sm:mx-8 sm:flex-row sm:items-center sm:justify-between">

          <p className="max-w-[540px] text-[14px] leading-[1.7] text-white/55">
            Ihr Projekt passt nicht in eine Kategorie?
            Wir entwickeln Software, die zu Ihren Abläufen passt.
          </p>

          <Link
            href={prefix + "/kontakt"}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-3 rounded-xl border border-sky-300/40 bg-sky-400/[0.12] px-6 py-3 text-[13px] font-medium text-white transition-colors hover:bg-sky-400/[0.2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
          >
            Softwareprojekt besprechen
            <span aria-hidden="true">→</span>
          </Link>

        </div>

      </div>
    </section>
  );
}
