"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Entry = {
  id: string;
  label: string;
  description: string;
  href: string;
};

type CategoryId = "vertrieb" | "kunden" | "unternehmen" | "ki";

type Category = {
  id: CategoryId;
  label: string;
  description: string;
  patterns: readonly RegExp[];
};

const CATEGORIES: readonly Category[] = [
  {
    id: "vertrieb",
    label: "Vertrieb",
    description: "Anfragen und Abschlüsse",
    patterns: [
      /lead.funnel|crm/i,
      /vertriebsplattform|partnerportal/i,
      /angebots.*beratung/i,
    ],
  },
  {
    id: "kunden",
    label: "Kunden",
    description: "Portale und Service",
    patterns: [
      /kundenportal|self.service/i,
      /service.*supportportal|supportportal/i,
      /omnichannel|kommunikationssystem/i,
    ],
  },
  {
    id: "unternehmen",
    label: "Unternehmen",
    description: "Prozesse und Daten",
    patterns: [
      /erp.system|erp-systeme/i,
      /dokumentenmanagement|freigaben/i,
      /projekt.*aufgabenmanagement/i,
    ],
  },
  {
    id: "ki",
    label: "KI & Automatisierung",
    description: "Weniger manuelle Arbeit",
    patterns: [
      /ki.agent|ki.agenten/i,
      /ki.automatisierung|prozessautomatisierung|automatisierung/i,
      /dashboard|reporting|datenanalyse/i,
    ],
  },
];

export default function NexcelCompactMegaMenu({
  items,
  onNavigate,
}: {
  items: readonly Entry[];
  onNavigate: () => void;
}) {
  const [selected, setSelected] = useState<CategoryId>("vertrieb");

  const group =
    CATEGORIES.find((item) => item.id === selected) ?? CATEGORIES[0];

  const matches = useMemo(() => {
    const used = new Set<string>();
    const output: Entry[] = [];
    if (group.id === "ki") {
      output.push({
        id: "eigene-llms",
        label: "Eigene LLMs & Sprachmodelle",
        description: "Modellentwicklung, Fine-Tuning & private KI",
        href: "/loesungen/eigene-llms",
      });
      used.add("eigene-llms");
    }

    for (const pattern of group.patterns) {
      const found = items.find((entry) => {
        const searchable = `${entry.id} ${entry.label}`;
        return !used.has(entry.id) && pattern.test(searchable);
      });

      if (found) {
        used.add(found.id);
        output.push(found);
      }
    }

    return output.slice(0, 3);
  }, [group, items]);

  return (
    <div
      data-nexcel-premium-menu="true"
      className="overflow-hidden rounded-[20px] bg-[linear-gradient(160deg,#171024_0%,#0d0b18_100%)] text-white"
    >
      <div className="border-b border-violet-200/10 px-5 pb-3 pt-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.21em] text-violet-300/85">
          NEXCEL AI · LÖSUNGEN
        </p>
        <div data-llm-menu-feature="nexcel" className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
<p className="mt-1 text-[15px] font-medium tracking-[-0.02em] text-white/90">
          Was möchten Sie verbessern?
        </p>
<a
  href="/loesungen/eigene-llms"
  aria-label="Eigene LLMs & Private KI ansehen"
  className="group/llm inline-flex min-h-[42px] shrink-0 items-center gap-2.5 rounded-[13px] border border-violet-300/25 bg-violet-400/[0.09] px-3.5 py-2 text-left no-underline transition-colors duration-200 hover:border-violet-300/50 hover:bg-violet-400/[0.16] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
>
  <span aria-hidden="true" className="h-1.5 w-1.5 shrink-0 rounded-full bg-violet-300 shadow-[0_0_12px_currentColor]" />
  <span className="min-w-0">
    <span className="block text-[12px] font-semibold leading-[1.25] text-white">Eigene LLMs & Private KI</span>
    <span className="hidden text-[10px] leading-4 text-white/55 sm:block">Sprachmodelle, Agenten und Unternehmens-KI</span>
  </span>
  <span aria-hidden="true" className="ml-1 text-[15px] text-violet-200 transition-transform duration-200 group-hover/llm:translate-x-0.5">↗</span>
</a>
</div>
      </div>

      <div className="grid grid-cols-[205px_minmax(0,1fr)] gap-2 p-3">
        <div
          className="flex flex-col gap-1"
          role="group"
          aria-label="Lösungskategorien"
        >
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              aria-pressed={selected === category.id}
              onMouseEnter={() => setSelected(category.id)}
              onFocus={() => setSelected(category.id)}
              onClick={() => setSelected(category.id)}
              className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300 ${
                selected === category.id
                  ? "bg-violet-400/[0.12] ring-1 ring-inset ring-violet-300/30"
                  : "hover:bg-white/[0.05]"
              }`}
            >
              <span className="block text-[13px] font-medium text-white/90">
                {category.label}
              </span>

              <span className="mt-0.5 block text-[11px] leading-snug text-white/45">
                {category.description}
              </span>
            </button>
          ))}
        </div>

        <div className="min-w-0 border-l border-violet-200/10 pl-3">
          <p className="mb-2 px-2 pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Passende Lösungen
          </p>

          {matches.length ? (
            matches.map((entry) => (
              <Link
                key={entry.id}
                href={entry.href}
                onClick={onNavigate}
                className="group/nxl-entry flex min-h-[65px] items-center justify-between gap-3 rounded-xl px-3 py-2 transition-colors duration-150 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"
              >
                <span className="min-w-0">
                  <span className="block text-[13px] font-medium leading-snug text-white/90 group-hover/nxl-entry:text-white">
                    {entry.label}
                  </span>

                  <span className="mt-0.5 block truncate text-[11px] text-white/45">
                    {entry.description}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className="shrink-0 text-[16px] text-violet-300/70"
                >
                  →
                </span>
              </Link>
            ))
          ) : (
            <p className="px-3 py-4 text-[12px] text-white/55">
              Alle verfügbaren Lösungen finden Sie in der Übersicht.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-violet-200/10 px-5 py-3">
        <span className="text-[11px] text-white/45">
          Individuell statt Standard.
        </span>

        <Link
          href="/loesungen"
          onClick={onNavigate}
          className="shrink-0 rounded-md text-[12px] font-medium text-violet-300 transition-colors hover:text-violet-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-violet-300"
        >
          Alle Lösungen ansehen <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}
