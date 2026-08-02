/**
 * Reference detail page — the real project record rendered as a case study.
 *
 * Everything factual (before / after / result / modules / tags) comes straight
 * from `lib/references-data.ts`. Nothing is added, rounded or embellished here.
 *
 * Server component: no client JS.
 */

import Image from "next/image";
import Link from "next/link";
import type { ReferencePage } from "@/data/referencePages";
import { internalLinks } from "@/lib/seo/internalLinks";

function Panel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid var(--brand-card-border)",
      }}
    >
      <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/40">
        {label}
      </p>
      <div className="mt-3.5">{children}</div>
    </div>
  );
}

export default function ReferencePageTemplate({ page }: { page: ReferencePage }) {
  const ref = page.reference;
  const links = internalLinks(page.brand, page.relatedPaths);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <section className="relative px-5 pt-[110px] sm:px-8 md:pt-[140px]">
        <div className="mx-auto w-full max-w-[1240px]">
          <Link
            href="/projekte"
            className="inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.2em] text-white/45 transition-colors hover:text-white/80"
          >
            Alle Referenzen
          </Link>

          <p
            className="mt-8 text-[10.5px] font-semibold uppercase tracking-[0.24em]"
            style={{ color: "var(--accent)" }}
          >
            {ref.type}
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

          <p className="mt-5 max-w-3xl text-[15px] leading-[1.7] text-white/70">
            {page.aeoAnswer}
          </p>

          <div className="mt-9 flex flex-wrap gap-2">
            {ref.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-3 py-1 text-[11.5px] text-white/60"
                style={{ border: "1px solid var(--brand-card-border)" }}
              >
                {tag}
              </span>
            ))}
          </div>

          <div
            className="relative mt-10 aspect-[16/9] w-full overflow-hidden rounded-3xl"
            style={{ border: "1px solid var(--brand-card-border)" }}
          >
            <Image
              src={ref.coverImage}
              alt={`${ref.title} — ${ref.type}`}
              fill
              priority
              sizes="(min-width: 1240px) 1240px, 100vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      </section>

      {/* Vorher → Nachher → Ergebnis */}
      <section className="relative px-5 pt-16 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1240px] gap-4 md:grid-cols-3">
          {ref.before && (
            <Panel label="Vorher">
              <p className="text-[14px] leading-[1.6] text-white/70">{ref.before}</p>
            </Panel>
          )}
          {ref.after && ref.after.length > 0 && (
            <Panel label="Nachher">
              <ul className="space-y-2">
                {ref.after.map((a) => (
                  <li key={a} className="text-[14px] leading-[1.6] text-white/70">
                    {a}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
          {ref.result && ref.result.length > 0 && (
            <Panel label="Ergebnis">
              <ul className="space-y-2">
                {ref.result.map((r) => (
                  <li key={r} className="text-[14px] leading-[1.6] text-white/70">
                    {r}
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>
      </section>

      {/* Umfang + brand angle */}
      <section className="relative px-5 pt-16 sm:px-8">
        <div className="mx-auto grid w-full max-w-[1240px] gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <h2
              className="text-[1.25rem] text-white sm:text-[1.5rem]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
              Worauf es bei diesem Projekt ankam
            </h2>
            <p className="mt-5 max-w-2xl text-[14.5px] leading-[1.75] text-white/70">
              {page.focus}
            </p>
            <p className="mt-5 max-w-2xl text-[14.5px] leading-[1.75] text-white/60">
              {ref.fullDescription}
            </p>
            {ref.websiteUrl && (
              <a
                href={ref.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 inline-flex rounded-xl px-4 py-2 text-[13px] text-white/80 transition-colors hover:text-white"
                style={{ border: "1px solid var(--brand-card-border)" }}
              >
                Projekt ansehen
              </a>
            )}
          </div>

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
              Umgesetzte Module
            </p>
            <ul className="mt-5 space-y-3">
              {ref.modules.map((m) => (
                <li
                  key={m}
                  className="flex items-start gap-3 text-[13.5px] leading-[1.5] text-white/75"
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
                  {m}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Internal links */}
      <section className="relative px-5 py-20 sm:px-8">
        <div className="mx-auto w-full max-w-[1240px]">
          <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/40">
            Systeme aus diesem Projekt
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
