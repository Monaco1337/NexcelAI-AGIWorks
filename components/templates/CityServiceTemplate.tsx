/**
 * City × service page — one handpicked combination of a location and a service.
 *
 * Content policy (config/businessLocations.ts): service-area wording only. No
 * office claims, no opening hours, no geo coordinates. Both brands are legally
 * based in Unna and the FAQ says so explicitly.
 *
 * Server component: no client JS.
 */

import Link from "next/link";
import type { CityServicePage } from "@/data/cityServicePages";
import { internalLinks } from "@/lib/seo/internalLinks";

export default function CityServiceTemplate({ page }: { page: CityServicePage }) {
  const links = internalLinks(page.brand, page.relatedPaths);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative px-5 pt-[110px] sm:px-8 md:pt-[140px]">
        <div className="mx-auto w-full max-w-[1240px]">
          <nav aria-label="Brotkrumen" className="text-[12px] text-white/40">
            <Link href="/standorte" className="transition-colors hover:text-white/70">
              Standorte
            </Link>
            <span className="mx-2">/</span>
            <Link
              href={`/standorte/${page.citySlug}`}
              className="transition-colors hover:text-white/70"
            >
              {page.city}
            </Link>
          </nav>

          <p
            className="mt-8 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--accent)" }}
          >
            {page.city} · {page.region}
          </p>

          <h1
            className="mt-4 max-w-4xl text-[1.9rem] leading-tight text-white sm:text-[2.6rem]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            {page.h1}
          </h1>

          <p className="mt-6 max-w-3xl text-[15px] leading-[1.75] text-white/70">
            {page.rationale}
          </p>
        </div>
      </section>

      <section className="relative px-5 pt-16 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 lg:grid-cols-2">
          <div
            className="rounded-3xl p-6 sm:p-8"
            style={{
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
              border: "1px solid var(--brand-card-border)",
            }}
          >
            <p
              className="text-[10.5px] font-semibold uppercase tracking-[0.24em]"
              style={{ color: "var(--accent)" }}
            >
              Was dazugehört
            </p>
            <ul className="mt-5 space-y-3.5">
              {page.deliverables.map((d) => (
                <li
                  key={d}
                  className="flex items-start gap-3 text-[13.5px] leading-[1.55] text-white/75"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="mt-0.5 shrink-0"
                    style={{ color: "var(--accent)" }}
                  >
                    <path
                      d="M5 12l5 5L20 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {d}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2
              className="text-[1.25rem] text-white sm:text-[1.5rem]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
              Häufige Fragen
            </h2>
            <dl className="mt-5 space-y-5">
              {page.faq.map((item) => (
                <div key={item.question}>
                  <dt className="text-[14px] font-medium text-white/90">{item.question}</dt>
                  <dd className="mt-1.5 text-[13.5px] leading-[1.6] text-white/65">
                    {item.answer}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="relative px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/40">
            Weiter
          </p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  title={link.hint}
                  className="inline-flex rounded-xl px-4 py-2 text-[13px] text-white/75 transition-colors hover:text-white"
                  style={{ border: "1px solid var(--brand-card-border)" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </main>
  );
}
