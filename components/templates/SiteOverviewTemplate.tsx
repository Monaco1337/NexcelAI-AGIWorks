/**
 * HTML sitemap — every indexable page of a brand, grouped by type.
 *
 * The XML sitemap tells crawlers what exists; this page makes the same set
 * reachable by following links, which is what actually distributes internal
 * link equity. It is generated from the page registry, so a new registered
 * page appears here automatically and can never become an orphan.
 *
 * Server component: no client JS.
 */

import Link from "next/link";
import type { BrandKey } from "@/config/seo/domains";
import type { SeoPageType } from "@/config/seo/pageRegistry";
import { indexableByType } from "@/lib/seo/internalLinks";

const GROUP_LABEL: Record<SeoPageType, string> = {
  home: "Start",
  money: "Leistungen & Lösungen",
  system: "Systeme",
  location: "Standorte",
  knowledge: "Wissen",
  content: "Unternehmen & Referenzen",
  tool: "Werkzeuge",
  legal: "Rechtliches",
};

/** Display order — commercial depth first, legal last. */
const GROUP_ORDER: SeoPageType[] = [
  "home",
  "money",
  "system",
  "location",
  "knowledge",
  "content",
  "tool",
  "legal",
];

export default function SiteOverviewTemplate({
  brand,
  brandName,
}: {
  brand: BrandKey;
  brandName: string;
}) {
  const grouped = indexableByType(brand);
  const total = Array.from(grouped.values()).reduce((n, list) => n + list.length, 0);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative px-5 pt-[110px] sm:px-8 md:pt-[140px]">
        <div className="mx-auto w-full max-w-[1240px]">
          <p
            className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--accent)" }}
          >
            Übersicht
          </p>
          <h1
            className="mt-4 max-w-3xl text-[1.9rem] leading-tight text-white sm:text-[2.6rem]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            Alle Seiten von {brandName} auf einen Blick
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-white/65">
            Diese Übersicht listet jede öffentlich zugängliche Seite — Leistungen,
            Systeme, Standorte, Fachbeiträge und Referenzen. Insgesamt {total} Seiten.
          </p>
        </div>
      </section>

      <section className="relative px-5 py-16 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px] space-y-10">
          {GROUP_ORDER.map((type) => {
            const pages = grouped.get(type);
            if (!pages || pages.length === 0) return null;
            return (
              <div key={type}>
                <h2
                  className="text-[1.1rem] text-white sm:text-[1.3rem]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    fontWeight: 300,
                  }}
                >
                  {GROUP_LABEL[type]}
                </h2>
                <ul className="mt-5 grid grid-cols-1 gap-x-8 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                  {pages.map((page) => (
                    <li key={page.id}>
                      <Link
                        href={page.path}
                        title={page.description}
                        className="block border-b py-2.5 text-[13.5px] text-white/70 transition-colors hover:text-white"
                        style={{ borderColor: "rgba(255,255,255,0.06)" }}
                      >
                        {page.breadcrumbLabel}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
