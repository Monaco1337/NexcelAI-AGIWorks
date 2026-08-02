/**
 * SEO/AEO block for system detail pages.
 *
 * Two jobs:
 *  1. Render the brand-specific direct answer. This is the text that makes the
 *     two brands' versions of a system genuinely different (and it is what
 *     answer engines quote).
 *  2. Render contextual internal links with real anchor text resolved from the
 *     page registry — never a raw path.
 *
 * Server component: no client JS, no layout shift.
 */

import Link from "next/link";
import type { SystemPage } from "@/data/systemPages";
import { SYSTEM_CATEGORY_LABEL } from "@/data/systemPages";
import { internalLinks } from "@/lib/seo/internalLinks";

export default function SystemRelatedLinks({ page }: { page: SystemPage }) {
  const links = internalLinks(page.brand, page.relatedPaths);

  return (
    <section className="relative px-5 pb-24 sm:px-8">
      <div className="mx-auto w-full max-w-[1240px]">
        <div
          className="rounded-3xl p-6 sm:p-10"
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
            {SYSTEM_CATEGORY_LABEL[page.category]}
          </p>

          <h2
            className="mt-4 max-w-3xl text-[1.35rem] leading-snug text-white sm:text-[1.75rem]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              fontWeight: 300,
            }}
          >
            {page.h1}
          </h2>

          <p className="mt-5 max-w-3xl text-[14.5px] leading-[1.7] text-white/70">
            {page.aeoAnswer}
          </p>

          <div
            className="mt-9 border-t pt-8"
            style={{ borderColor: "var(--brand-card-border)" }}
          >
            <p className="text-[10.5px] font-semibold uppercase tracking-[0.24em] text-white/40">
              Passende nächste Schritte
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
        </div>
      </div>
    </section>
  );
}
