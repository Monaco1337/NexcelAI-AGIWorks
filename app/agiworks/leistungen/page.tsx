// AGI_PREMIUM_SERVICES_V1
import BrandLlmSpotlight from "@/components/sections/BrandLlmSpotlight";
import type { Metadata } from "next";
import Link from "next/link";
import Footer from "@/components/Footer";
import { getMoneyPagesForBrand } from "@/data/moneyPages";
import { generateSeoMetadata } from "@/lib/seo/metadata";
import { buildCanonical } from "@/lib/seo/canonical";

const BRAND = "agiworks" as const;
const PATH = "/leistungen";

type Service = {
  title: string;
  description: string;
  href: string;
};

export function generateMetadata(): Metadata {
  const metadata = generateSeoMetadata({
    brand: BRAND,
    path: PATH,
  });

  return {
    ...metadata,
    alternates: {
      ...(metadata.alternates ?? {}),
      canonical: buildCanonical(BRAND, PATH),
    },
  };
}

function agiHref(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;

  if (p === "/agiworks" || p.startsWith("/agiworks/")) {
    return p;
  }

  if (p === "/leistungen" || p.startsWith("/leistungen/")) {
    return `/agiworks${p}`;
  }

  return `/agiworks/leistungen${p}`;
}

function shortCopy(title: string, fallback: string) {
  const t = title.toLowerCase();

  if (t.includes("individuelle software"))
    return "Individuelle Anwendungen, die Ihre realen Abläufe abbilden und sich weiterentwickeln lassen.";

  if (t.includes("crm"))
    return "Leads, Kontakte, Angebote und Vertriebsprozesse an einem Ort steuern.";

  if (t.includes("erp"))
    return "Aufträge, Daten, Teams und Ressourcen in einer Betriebszentrale verbinden.";

  if (t.includes("web-app"))
    return "Individuelle Anwendungen für Kunden, Teams und interne Prozesse.";

  if (t.includes("saas"))
    return "Digitale Plattformen mit Nutzern, Rollen und skalierbaren Funktionen.";

  if (t.includes("webseiten"))
    return "Hochwertige Websites mit klarer Nutzerführung, Performance und Conversion.";

  if (t.includes("admin"))
    return "Nutzer, Daten, Freigaben und interne Abläufe übersichtlich verwalten.";

  if (t.includes("api") || t.includes("integration"))
    return "Bestehende Systeme verbinden und manuelle Datenübertragungen reduzieren.";

  if (t.includes("kundenportal"))
    return "Informationen, Dokumente und Services für Ihre Kunden zentral bereitstellen.";

  return fallback;
}

function Arrow() {
  return (
    <span
      aria-hidden="true"
      className="text-sky-300 transition-transform group-hover:translate-x-1 motion-reduce:transform-none"
    >
      →
    </span>
  );
}

function ServiceCard({
  item,
  compact = false,
}: {
  item: Service;
  compact?: boolean;
}) {
  return (
    <Link
      href={item.href}
      className={`group flex justify-between gap-5 border border-white/10 bg-[#121923] transition-colors hover:border-sky-300/40 hover:bg-[#182333] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 motion-reduce:transition-none ${
        compact
          ? "min-h-[133px] items-start rounded-[20px] p-5 sm:p-6"
          : "min-h-[178px] flex-col rounded-[24px] p-6"
      }`}
    >
      <div className="min-w-0">
        <h3 className="text-[18px] font-medium tracking-tight text-white">
          {item.title}
        </h3>

        <p className="mt-2 max-w-[510px] text-[14px] leading-[1.7] text-slate-400">
          {item.description}
        </p>
      </div>

      {compact ? (
        <span className="shrink-0 pt-1">
          <Arrow />
        </span>
      ) : (
        <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-3 text-[13px] text-sky-300">
          <span>Leistung ansehen</span>
          <Arrow />
        </div>
      )}
    </Link>
  );
}

export default function AgiworksLeistungenHub() {
  const items: Service[] = getMoneyPagesForBrand(BRAND).map((p) => ({
    title: p.serviceName,
    description: shortCopy(p.serviceName, p.description),
    href: agiHref(p.path),
  }));

  const featured =
    items.find((p) =>
      /individuelle softwareentwicklung/i.test(p.title)
    ) ?? items[0];

  const main = items
    .filter(
      (p) =>
        p.href !== featured?.href &&
        /crm|erp/i.test(p.title)
    )
    .slice(0, 2);

  const more = items.filter(
    (p) =>
      p.href !== featured?.href &&
      !main.some((m) => m.href === p.href)
  );

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#090d15] text-white">
      <div className="pt-[76px] sm:pt-[88px]">
        <main
          id="main-content"
          className="relative isolate overflow-hidden"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[650px]"
            style={{
              background:
                "radial-gradient(ellipse at 75% 15%,rgba(53,133,209,.17),transparent 55%)",
            }}
          />

          <div className="mx-auto max-w-[1250px] px-5 sm:px-8 lg:px-10">
            <nav
              aria-label="Brotkrumennavigation"
              className="flex gap-3 pt-8 text-[12px] text-slate-400 sm:pt-10"
            >
              <Link
                href="/agiworks"
                className="hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
              >
                Start
              </Link>

              <span aria-hidden="true">/</span>

              <span
                aria-current="page"
                className="text-slate-200"
              >
                Leistungen
              </span>
            </nav>

            <header className="grid items-end gap-8 pb-14 pt-14 lg:grid-cols-[1.4fr_.6fr] lg:gap-14 lg:pt-20">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[.23em] text-sky-400">
                  AGI Works / Softwareentwicklung
                </p>

                <h1 className="mt-5 max-w-[820px] text-[clamp(2.4rem,5.1vw,4.6rem)] font-semibold leading-[1.1] tracking-[-.045em]">
                  Software, die zu Ihrem{" "}
                  <span className="bg-gradient-to-r from-[#d6e2ef] to-[#61a2e6] bg-clip-text text-transparent">
                    Unternehmen passt.
                  </span>
                </h1>

                <p className="mt-6 max-w-[630px] text-[16px] leading-[1.8] text-slate-400 sm:text-[18px]">
                  Individuelle CRM-, ERP- und Unternehmensplattformen.
                  Wir verbinden Ihre Prozesse, Daten und bestehenden Systeme.
                </p>

                <Link
                  href="/agiworks/kontakt"
                  className="mt-8 inline-flex min-h-[52px] items-center gap-5 rounded-xl border border-sky-400/50 bg-[#244d70] px-6 text-[14px] font-medium shadow-[0_14px_44px_rgba(42,125,205,.17)] transition-colors hover:bg-[#32658f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
                >
                  Softwareprojekt besprechen
                  <span aria-hidden="true">→</span>
                </Link>
              </div>

              <div className="border-l border-sky-300/25 pl-6">
                <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-sky-400">
                  Unser Ansatz
                </p>

                <p className="mt-3 max-w-[350px] text-[19px] leading-[1.5] text-slate-200">
                  Nicht Ihre Abläufe an Software anpassen.
                  Sondern Software an Ihre Abläufe.
                </p>
              </div>
            </header>

            <section
              aria-labelledby="agi-focus"
              className="pb-16"
            >
              <div className="mb-7 border-t border-white/10 pt-8">
                <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-sky-400">
                  Unsere Schwerpunkte
                </p>

                <h2
                  id="agi-focus"
                  className="mt-3 text-[clamp(1.7rem,3vw,2.5rem)] font-medium tracking-[-.035em]"
                >
                  Software, die echte Probleme löst.
                </h2>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
                {featured && (
                  <Link
                    href={featured.href}
                    className="group relative flex min-h-[370px] flex-col justify-between overflow-hidden rounded-[26px] border border-sky-300/25 bg-gradient-to-br from-[#193550] via-[#122337] to-[#0d1522] p-7 transition-colors hover:border-sky-300/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400 sm:p-9"
                  >
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-sky-200/10 shadow-[0_0_90px_rgba(77,161,248,.08)]"
                    />

                    <div className="relative z-10">
                      <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-sky-300">
                        Individuelle Softwareentwicklung
                      </p>

                      <h3 className="mt-7 max-w-[410px] text-[clamp(1.8rem,3vw,2.7rem)] font-medium leading-[1.15] tracking-[-.035em]">
                        Nicht irgendein System. Ihr System.
                      </h3>

                      <p className="mt-4 max-w-[450px] text-[15px] leading-7 text-slate-300">
                        {featured.description}
                      </p>
                    </div>

                    <div className="relative z-10 mt-8 flex justify-between gap-4 border-t border-white/15 pt-5 text-[13px] font-medium">
                      <span>
                        Individuelle Software entdecken
                      </span>
                      <Arrow />
                    </div>
                  </Link>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {main.map((item) => (
                    <ServiceCard
                      key={item.href}
                      item={item}
                    />
                  ))}
                </div>
              </div>
            </section>

            {more.length > 0 && (
              <section
                aria-labelledby="agi-more"
                className="pb-20"
              >
                <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-sky-400">
                  Weitere Leistungen
                </p>

                <h2
                  id="agi-more"
                  className="mb-7 mt-3 text-[clamp(1.7rem,3vw,2.35rem)] font-medium tracking-[-.035em]"
                >
                  Alles, was Ihr Unternehmen digital voranbringt.
                </h2>

                <div className="grid gap-3 md:grid-cols-2">
                  {more.map((item) => (
                    <ServiceCard
                      key={item.href}
                      item={item}
                      compact
                    />
                  ))}
                </div>
              </section>
            )}

            <section
              aria-labelledby="agi-cta"
              className="pb-20"
            >
              <div className="flex flex-col gap-6 rounded-[26px] border border-sky-300/20 bg-gradient-to-r from-[#152c44] to-[#111a28] p-7 sm:p-9 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[.2em] text-sky-300">
                    Ihr nächster Schritt
                  </p>

                  <h2
                    id="agi-cta"
                    className="mt-3 text-[clamp(1.65rem,3vw,2.4rem)] font-medium tracking-tight"
                  >
                    Sie haben ein Softwareprojekt im Kopf?
                  </h2>

                  <p className="mt-3 max-w-[620px] text-[15px] leading-7 text-slate-300">
                    Beschreiben Sie uns Ihr Vorhaben.
                    Gemeinsam klären wir die sinnvolle Umsetzung.
                  </p>
                </div>

                <Link
                  href="/agiworks/kontakt"
                  className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-4 self-start rounded-xl border border-sky-400/50 bg-[#244d70] px-6 text-[14px] font-medium transition-colors hover:bg-[#32658f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-400"
                >
                  Softwareprojekt besprechen
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            </section>
          </div>
        </main>
      </div>

      <BrandLlmSpotlight brand="agiworks" compact />
      <Footer />
    </div>
  );
}
