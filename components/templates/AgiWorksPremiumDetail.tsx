import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import {
  breadcrumbSchema,
  faqSchema,
  serviceSchema,
  webPageForUrl,
} from "@/lib/seo/jsonld";
import { toAbsoluteUrl } from "@/config/seo/domains";
import {
  MONEY_PAGES,
  MONEY_PROOF_CONSTRAINTS,
  type MoneyPage,
} from "@/data/moneyPages";
import { internalLinkLabel } from "@/lib/seo/internalLinks";

const VISUALS: Record<string, string> = {
  "webseiten-erstellen-lassen": "premium-websysteme",
  "web-app-entwicklung": "admin-operations-system",
  "saas-entwicklung": "saas-plattform-multi-tenant",
  "erp-system-entwicklung": "erp-systeme",
  "crm-system-entwicklung": "lead-funnels-crm",
  "admin-panel-entwicklung": "admin-operations-system",
  "api-entwicklung": "schnittstellen-integrationen",
  "kundenportal-entwicklung": "kundenportal-self-service",
  softwareentwicklung: "projekt-aufgabenmanagement",
};

function agiUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  if (path === "/agiworks" || path.startsWith("/agiworks/")) {
    return path;
  }
  return `/agiworks${path.startsWith("/") ? path : `/${path}`}`;
}

function relatedLabel(path: string): string {
  const item = MONEY_PAGES.find(
    (p) => p.brand === "agiworks" && p.path === path
  );
  return item?.serviceName ?? internalLinkLabel("agiworks", path);
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <span aria-hidden="true" className={className}>
      ↗
    </span>
  );
}

function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[#79c6ff]">
      {children}
    </p>
  );
}

export default function AgiWorksPremiumDetail({
  page,
}: {
  page: MoneyPage;
}) {
  const canonical = toAbsoluteUrl("agiworks", page.path);
  const visual =
    VISUALS[page.slug] ??
    page.systemSlug ??
    "projekt-aufgabenmanagement";

  const imageSrc = `/images/system-visuals/${visual}.png`;

  const related = Array.from(new Set(page.relatedPaths))
    .filter((path) => path.startsWith("/") && path !== page.path)
    .slice(0, 4);

  const sectionWidth = "mx-auto max-w-[1260px] px-5 sm:px-8 lg:px-10";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#080c13] text-white">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[860px] bg-[radial-gradient(ellipse_at_78%_25%,rgba(37,112,172,.21),transparent_45%),linear-gradient(180deg,#0b1320_0%,#080c13_94%)]"
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[800px] opacity-[.045] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:80px_80px]"
      />

      {/* BREADCRUMB */}
      <nav
        aria-label="Pfadnavigation"
        className={`relative ${sectionWidth} pt-9`}
      >
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-slate-500">
          <li>
            <Link href="/agiworks" className="hover:text-white">
              Start
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href="/agiworks/leistungen"
              className="hover:text-white"
            >
              Leistungen
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li aria-current="page" className="text-slate-300">
            {page.serviceName}
          </li>
        </ol>
      </nav>

      {/* PREMIUM HERO */}
      <section
        className={`relative grid items-center gap-12 pb-20 pt-16 lg:grid-cols-[1.02fr_.98fr] lg:gap-14 lg:pb-28 lg:pt-24 ${sectionWidth}`}
      >
        <div>
          <Kicker>AGI WORKS / {page.serviceName}</Kicker>

          <h1 className="mt-7 max-w-[720px] text-[clamp(2.7rem,4.65vw,4.9rem)] font-medium leading-[1.065] tracking-[-0.05em] text-white">
            {page.h1}
          </h1>

          <p className="mt-7 max-w-[570px] text-[clamp(1rem,1.35vw,1.2rem)] leading-[1.75] text-slate-300">
            {page.heroIntro}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              href="/agiworks/kontakt"
              className="group inline-flex min-h-[54px] items-center justify-center gap-5 rounded-[13px] border border-sky-300/40 bg-gradient-to-r from-[#244a68] to-[#17314b] px-6 text-[14px] font-medium text-white shadow-[0_12px_42px_rgba(21,109,175,.17)] transition-colors hover:border-sky-200/75 hover:from-[#30648c] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
            >
              Softwareprojekt besprechen
              <Arrow className="text-[#91d2ff]" />
            </Link>

            <a
              href="#umfang"
              className="inline-flex min-h-[54px] items-center justify-center gap-4 rounded-[13px] border border-white/15 px-6 text-[14px] text-slate-200 transition-colors hover:border-white/35 hover:bg-white/[.045] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
            >
              Funktionsumfang ansehen
              <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-white/10 pt-5 text-[12px] text-slate-400">
            <span>Individuelle Architektur</span>
            <span>Klare Prozesse</span>
            <span>Erweiterbare Systeme</span>
          </div>
        </div>

        {/* REALES VORHANDENES SYSTEMBILD */}
        <div className="relative min-w-0">
          <div
            aria-hidden="true"
            className="absolute -inset-5 rounded-[36px] bg-sky-400/[.075] blur-3xl"
          />

          <div className="relative overflow-hidden rounded-[28px] border border-sky-300/20 bg-[#101a28] shadow-[0_30px_90px_rgba(0,0,0,.42)]">
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
              <span className="text-[10px] font-semibold uppercase tracking-[.19em] text-sky-300">
                Systemvisualisierung
              </span>
              <span className="text-[11px] text-slate-500">
                Beispielansicht
              </span>
            </div>

            <div className="relative aspect-[16/10] bg-[#0a1020]">
              <Image
                src={imageSrc}
                alt={`Beispielvisualisierung: ${page.serviceName}`}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-contain"
              />
            </div>

            <div className="border-t border-white/10 px-5 py-5 sm:px-7">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[.17em] text-slate-500">
                    Für Ihren Anwendungsfall
                  </p>
                  <p className="mt-1 text-[15px] font-medium text-slate-200">
                    {page.serviceName}
                  </p>
                </div>
                <div
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-sky-300/25 bg-sky-300/10 text-sky-300"
                >
                  ↗
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AUSGANGSLAGE / LOESUNG */}
      <section className="relative border-y border-white/[.075] bg-[#0b111b]">
        <div
          className={`grid gap-10 py-20 lg:grid-cols-[.9fr_1.1fr] lg:gap-24 lg:py-28 ${sectionWidth}`}
        >
          <div>
            <Kicker>DIE HERAUSFORDERUNG</Kicker>
            <h2 className="mt-5 text-[clamp(2rem,3.1vw,3rem)] font-medium leading-tight tracking-[-.04em]">
              Weniger Umwege.
              <span className="block text-[#80bff1]">
                Mehr Klarheit.
              </span>
            </h2>
            <p className="mt-6 max-w-[520px] text-[16px] leading-8 text-slate-400">
              {page.problem}
            </p>
          </div>

          <div className="border-t border-sky-300/25 pt-6 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-1">
            <Kicker>WAS SICH ÄNDERT</Kicker>
            <h3 className="mt-5 text-[clamp(1.6rem,2.2vw,2.45rem)] font-medium tracking-[-.03em]">
              Eine Lösung für Ihren Ablauf.
            </h3>
            <p className="mt-5 text-[16px] leading-8 text-slate-300">
              {page.solutionIntro}
            </p>
            <p className="mt-6 text-[14px] leading-7 text-slate-400">
              {page.aeoAnswer}
            </p>
          </div>
        </div>
      </section>

      {/* LEISTUNGSUMFANG - BENTO */}
      <section
        id="umfang"
        className={`relative scroll-mt-28 py-20 lg:py-28 ${sectionWidth}`}
      >
        <Kicker>DER FUNKTIONSUMFANG</Kicker>

        <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <h2 className="max-w-[760px] text-[clamp(2rem,3.6vw,3.7rem)] font-medium leading-tight tracking-[-.045em]">
            Alles greift ineinander.
          </h2>
          <p className="max-w-[330px] text-[14px] leading-6 text-slate-400">
            Die konkreten Bausteine richten sich nach Ihrem Projekt,
            nicht nach einem starren Paket.
          </p>
        </div>

        <div className="mt-10 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {page.modules.map((module, i) => (
            <article
              key={`${module.title}-${i}`}
              className={`group relative flex min-h-[215px] flex-col justify-between overflow-hidden rounded-[22px] border border-white/10 bg-[#111a26] p-7 transition-colors hover:border-sky-300/30 hover:bg-[#162235] ${
                i === 0 ? "lg:col-span-2" : ""
              }`}
            >
              <span
                aria-hidden="true"
                className="text-[12px] font-medium tracking-widest text-[#77b8e8]"
              >
                {String(i + 1).padStart(2, "0")}
              </span>

              <div>
                <h3 className="text-[20px] font-medium tracking-[-.025em] text-white">
                  {module.title}
                </h3>
                {module.description && (
                  <p className="mt-3 max-w-[610px] text-[14px] leading-7 text-slate-400">
                    {module.description}
                  </p>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* TECHNISCHER ANSATZ */}
      <section className="border-y border-white/[.07] bg-[#0b1421]">
        <div
          className={`grid gap-10 py-20 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:py-24 ${sectionWidth}`}
        >
          <div>
            <Kicker>UNSER ANSATZ</Kicker>
            <h2 className="mt-5 text-[clamp(2rem,3.1vw,3rem)] font-medium leading-tight tracking-[-.04em]">
              Für Ihre Realität.
              <span className="block text-[#81bdeb]">
                Nicht für eine Demo.
              </span>
            </h2>
            <p className="mt-6 max-w-[430px] text-[15px] leading-7 text-slate-400">
              Wir verbinden technische Qualität mit den Anforderungen
              Ihres täglichen Betriebs.
            </p>
          </div>

          <ol className="divide-y divide-white/10 border-t border-white/10">
            {page.approach.map((item, i) => (
              <li
                key={i}
                className="grid grid-cols-[42px_1fr] gap-4 py-5"
              >
                <span className="text-[12px] text-[#83bfe8]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-[15px] leading-7 text-slate-200">
                  {item}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* PROJEKTABLAUF */}
      <section className={`${sectionWidth} py-20 lg:py-28`}>
        <Kicker>VON DER IDEE ZUM BETRIEB</Kicker>
        <h2 className="mt-5 text-[clamp(2rem,3.2vw,3.15rem)] font-medium tracking-[-.04em]">
          So läuft Ihr Projekt.
        </h2>

        <ol className="mt-12 grid gap-7 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-5">
          {page.process.map((step, i) => (
            <li key={`${i}-${step.title}`}>
              <span className="text-[12px] font-medium tracking-[.18em] text-sky-300">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-6 text-[17px] font-medium tracking-tight">
                {step.title}
              </h3>
              <p className="mt-3 text-[13px] leading-6 text-slate-400">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ENTSCHEIDUNGSHILFE */}
      <section className="border-y border-white/[.07] bg-[#0c121e]">
        <div className={`${sectionWidth} py-20 lg:py-24`}>
          <Kicker>ENTSCHEIDUNGSHILFE</Kicker>
          <h2 className="mt-5 text-[clamp(2rem,3.2vw,3.15rem)] font-medium tracking-[-.04em]">
            Ist das der richtige Weg?
          </h2>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className="rounded-[22px] border border-sky-300/20 bg-[#112235] p-7 sm:p-9">
              <h3 className="text-[19px] font-medium">
                Sinnvoll, wenn …
              </h3>
              <ul className="mt-6 space-y-4">
                {page.decision.suitable.map((entry, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[14px] leading-6 text-slate-300"
                  >
                    <span aria-hidden="true" className="text-sky-300">
                      ✓
                    </span>
                    {entry}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-[#111821] p-7 sm:p-9">
              <h3 className="text-[19px] font-medium">
                Nicht immer notwendig, wenn …
              </h3>
              <ul className="mt-6 space-y-4">
                {page.decision.notSuitable.map((entry, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[14px] leading-6 text-slate-400"
                  >
                    <span aria-hidden="true">—</span>
                    {entry}
                  </li>
                ))}
              </ul>
              <p className="mt-5 border-t border-white/10 pt-5 text-[13px] leading-6 text-slate-500">
                {page.decision.alternative}
              </p>
            </div>
          </div>

          {page.industries.length > 0 && (
            <div className="mt-9 flex flex-wrap items-center gap-2">
              <span className="mr-3 text-[12px] text-slate-500">
                Typische Einsatzbereiche:
              </span>
              {page.industries.map((industry) => (
                <span
                  key={industry}
                  className="rounded-full border border-white/10 px-3 py-1.5 text-[12px] text-slate-400"
                >
                  {industry}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* KOSTEN UND ANGEBOT */}
      <section className={`${sectionWidth} py-20 lg:py-28`}>
        <div className="grid gap-8 rounded-[28px] border border-sky-300/20 bg-[linear-gradient(135deg,#142b42,#0d1624_65%)] p-8 sm:p-12 lg:grid-cols-[.95fr_1.05fr] lg:gap-16">
          <div>
            <Kicker>PROJEKTUMFANG & KOSTEN</Kicker>
            <h2 className="mt-5 text-[clamp(2rem,3vw,3.1rem)] font-medium leading-tight tracking-[-.04em]">
              Individuell geplant.
              <span className="block text-[#83bff0]">
                Transparent kalkuliert.
              </span>
            </h2>
          </div>

          <div className="flex flex-col justify-between gap-7">
            <p className="text-[15px] leading-8 text-slate-300">
              {page.costNote}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/agiworks/preiskalkulator"
                className="inline-flex min-h-[48px] items-center gap-3 rounded-xl border border-sky-300/30 px-5 text-[13px] font-medium text-white transition-colors hover:border-sky-200/70"
              >
                Projektkorridor berechnen <Arrow />
              </Link>
              <Link
                href="/agiworks/kontakt"
                className="inline-flex min-h-[48px] items-center gap-3 text-[13px] text-slate-300 hover:text-white"
              >
                Projekt besprechen <Arrow />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <p className={`${sectionWidth} pb-16 text-center text-[12px] leading-6 text-slate-600`}>
        {MONEY_PROOF_CONSTRAINTS}
      </p>

      {/* FAQ */}
      {page.faq.length > 0 && (
        <section className="mx-auto max-w-[960px] px-5 pb-24 sm:px-8 lg:pb-28">
          <Kicker>HÄUFIGE FRAGEN</Kicker>
          <h2 className="mb-9 mt-5 text-[clamp(2rem,3vw,2.9rem)] font-medium tracking-[-.04em]">
            Gut zu wissen.
          </h2>

          <div className="divide-y divide-white/10 border-y border-white/10">
            {page.faq.map((item, i) => (
              <details key={`${item.question}-${i}`} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[15px] font-medium leading-7 text-slate-200 marker:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-300 [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span
                    aria-hidden="true"
                    className="text-2xl font-light text-sky-300 transition-transform group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-[790px] pb-3 pt-4 text-[14px] leading-7 text-slate-400">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* WEITERE LEISTUNGEN */}
      {related.length > 0 && (
        <section className="border-t border-white/[.07] bg-[#0c1420]">
          <div className={`${sectionWidth} py-16`}>
            <Kicker>WEITERE MÖGLICHKEITEN</Kicker>
            <h2 className="mt-5 text-[clamp(1.8rem,2.8vw,2.7rem)] font-medium tracking-[-.035em]">
              Passende Lösungen entdecken.
            </h2>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {related.map((href) => (
                <Link
                  key={href}
                  href={agiUrl(href)}
                  className="group flex min-h-[95px] items-center justify-between gap-4 rounded-[18px] border border-white/10 bg-white/[.025] p-5 text-[15px] text-slate-200 transition-colors hover:border-sky-300/35 hover:bg-white/[.055]"
                >
                  <span>{relatedLabel(href)}</span>
                  <Arrow className="shrink-0 text-sky-300" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINALER KONTAKTBEREICH */}
      <section className="relative overflow-hidden border-t border-white/[.075] bg-[#0b1726]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_120%,rgba(59,143,210,.25),transparent_65%)]"
        />
        <div className="relative mx-auto max-w-[960px] px-5 py-24 text-center sm:px-8 lg:py-28">
          <Kicker>IHR NÄCHSTES SOFTWAREPROJEKT</Kicker>
          <h2 className="mt-6 text-[clamp(2.2rem,4.25vw,4.2rem)] font-medium leading-[1.12] tracking-[-.05em]">
            Ihre Herausforderung.
            <span className="block text-[#8fc7f1]">
              Unsere nächste Lösung.
            </span>
          </h2>
          <p className="mx-auto mt-6 max-w-[610px] text-[16px] leading-8 text-slate-400">
            Schildern Sie uns Ihr Vorhaben. Wir klären mit Ihnen den
            sinnvollen Umfang und die nächsten Schritte.
          </p>
          <Link
            href="/agiworks/kontakt"
            className="mt-9 inline-flex min-h-[54px] items-center justify-center gap-5 rounded-[13px] border border-sky-300/40 bg-[#234c6d] px-7 text-[14px] font-medium transition-colors hover:bg-[#30688e]"
          >
            Softwareprojekt besprechen <Arrow />
          </Link>
        </div>
      </section>

      {/* BESTEHENDE SEO-STRUKTUR BEIBEHALTEN */}
      <SeoJsonLd
        schema={[
          webPageForUrl({
            brand: "agiworks",
            url: canonical,
            name: page.h1,
            description: page.heroIntro,
          }),
          serviceSchema({
            brand: "agiworks",
            name: page.serviceName,
            description: page.heroIntro,
            url: canonical,
            serviceType: page.serviceName,
          }),
          breadcrumbSchema([
            {
              name: "Start",
              url: "https://www.agiworks.de/",
            },
            {
              name: "Leistungen",
              url: "https://www.agiworks.de/leistungen",
            },
            {
              name: page.serviceName,
              url: canonical,
            },
          ]),
          ...(page.faq.length > 0 ? [faqSchema(page.faq)] : []),
        ]}
      />
    </main>
  );
}
