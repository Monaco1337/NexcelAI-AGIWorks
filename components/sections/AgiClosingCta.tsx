"use client";

import Link from "next/link";

export default function AgiClosingCta() {
  return (
    <section
      aria-labelledby="agi-closing-title"
      className="relative isolate overflow-hidden bg-[#080d16] px-5 py-16 sm:px-8 sm:py-20 lg:py-[88px]"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 48% 62% at 50% 70%,rgba(37,100,166,0.13),transparent 85%)"
        }}
      />

      <div className="relative mx-auto max-w-[1080px]">

        <div
          aria-hidden="true"
          className="h-px w-full bg-gradient-to-r from-transparent via-sky-300/20 to-transparent"
        />

        <div className="mx-auto flex max-w-[920px] flex-col items-center pt-12 text-center sm:pt-14">

          {/* EYEBROW */}

          <div className="flex items-center gap-3">

            <span
              aria-hidden="true"
              className="h-px w-7 bg-sky-300/55"
            />

            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sky-300/85 sm:text-[11px]">
              IHR NÄCHSTES SOFTWAREPROJEKT
            </p>

            <span
              aria-hidden="true"
              className="h-px w-7 bg-sky-300/55"
            />

          </div>

          {/* HEADLINE */}

          <h2
            id="agi-closing-title"
            className="mt-7 max-w-[920px] text-balance text-[clamp(2.2rem,4vw,4rem)] font-normal leading-[1.12] tracking-[-0.05em] text-white"
            style={{
              fontFamily:
                "var(--font-headline),system-ui,sans-serif"
            }}
          >
            Sie kennen die Herausforderung.

            <span className="mt-2 block bg-gradient-to-r from-[#dceefe] via-[#a3d0f5] to-[#5ba5e7] bg-clip-text text-transparent">
              Wir entwickeln den Weg zur Lösung.
            </span>

          </h2>

          {/* BESCHREIBUNG */}

          <p className="mt-7 max-w-[670px] text-pretty text-[14px] leading-[1.85] text-white/65 sm:text-[16px]">
            Ob CRM, ERP oder individuelle Plattform:
            Beschreiben Sie uns Ihre Anforderungen.
            Wir klären gemeinsam, welcher Umfang sinnvoll
            ist und wie die Umsetzung aussehen kann.
          </p>

          {/* EIN EINZIGER HAUPTBUTTON */}

          <Link
            href="/agiworks/kontakt"
            className="group mt-9 inline-flex min-h-[54px] w-full items-center justify-center gap-5 rounded-xl border border-sky-300/50 bg-[#234866] px-7 py-3.5 text-[14px] font-medium text-white shadow-[0_10px_35px_rgba(40,120,194,0.13),inset_0_1px_0_rgba(255,255,255,0.10)] transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-200/75 hover:bg-[#305b7d] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 motion-reduce:transform-none sm:w-auto"
          >
            Softwareprojekt besprechen

            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              className="shrink-0 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
            >
              <path
                d="M5 12h14m-6-6 6 6-6 6"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

          </Link>

          {/* QUALIFIZIERENDER ABSCHLUSS */}

          <p className="mt-5 text-[12px] leading-[1.6] text-white/45">
            Direkter Gründerkontakt
            <span
              aria-hidden="true"
              className="mx-2 text-sky-300/45"
            >
              ·
            </span>
            Individuelle Projektplanung
          </p>

        </div>

      </div>
    </section>
  );
}
