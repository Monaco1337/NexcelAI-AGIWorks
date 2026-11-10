"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const separateSteps = [
  { task: "Anfrage", tool: "E-Mail" },
  { task: "Kundendaten", tool: "Excel" },
  { task: "Angebot", tool: "Dokument" },
];

const connectedSteps = [
  {
    title: "Anfrage erfassen",
    detail: "Der Erstkontakt landet im richtigen Vorgang.",
  },
  {
    title: "Kundendaten nutzen",
    detail: "Relevante Informationen stehen zentral bereit.",
  },
  {
    title: "Angebot vorbereiten",
    detail: "Vorhandene Daten lassen sich direkt übernehmen.",
  },
];

export default function AgiWorkflowPremium() {
  const pathname = usePathname();

  const contactHref = pathname?.startsWith("/agiworks")
    ? "/agiworks/kontakt"
    : "/kontakt";

  return (
    <section
      id="agi-prozess"
      aria-labelledby="agi-prozess-title"
      className="relative isolate overflow-hidden bg-[#080b13] py-16 sm:py-20 lg:py-24"
     data-homeflow-surface="true">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">

        {/* SECTION INTRO */}

        <header className="mx-auto max-w-[780px] text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.27em] text-sky-300/85 sm:text-[11px]">
            Ein Beispiel aus dem Unternehmensalltag
          </p>

          <h2
            id="agi-prozess-title"
            className="mt-5 text-[clamp(2.15rem,4.3vw,3.8rem)] font-light leading-[1.12] tracking-[-0.045em] text-white"
            style={{
              fontFamily: "var(--font-headline),system-ui,sans-serif",
            }}
          >
            Weniger übertragen.
            <br />

            <span className="bg-gradient-to-r from-[#d8eafb] via-[#9ac9f4] to-[#519de1] bg-clip-text text-transparent">
              Mehr erledigen.
            </span>
          </h2>

          <p className="mx-auto mt-5 max-w-[620px] text-[15px] leading-[1.7] text-white/65 sm:text-[16px]">
            Eine Kundenanfrage, drei Arbeitsschritte.
            Wir zeigen, wie individuelle Software daraus
            einen durchgängigen Ablauf machen kann.
          </p>
        </header>

        {/* MAIN COMPARISON */}

        <div className="relative mt-11 overflow-hidden rounded-[28px] border border-white/[0.12] bg-[#101520] shadow-[0_28px_90px_rgba(0,0,0,0.32)] sm:mt-14 lg:grid lg:grid-cols-[0.85fr_1.15fr]">

          {/* TODAY */}

          <div className="border-b border-white/10 bg-[#121722] px-6 py-9 sm:px-10 sm:py-11 lg:border-b-0 lg:border-r lg:border-white/10 lg:px-11 lg:py-12">

            <p className="text-[11px] font-semibold uppercase tracking-[0.21em] text-white/45">
              Heute
            </p>

            <h3
              className="mt-4 text-[27px] font-normal leading-[1.18] tracking-[-0.035em] text-white sm:text-[33px]"
              style={{
                fontFamily: "var(--font-headline),system-ui,sans-serif",
              }}
            >
              Jeder Schritt.
              <br />
              <span className="text-white/55">
                Ein anderes Tool.
              </span>
            </h3>

            <div className="mt-9 border-y border-white/10">

              {separateSteps.map((step) => (
                <div
                  key={step.task}
                  className="flex items-center justify-between gap-4 border-b border-white/[0.08] py-[18px] last:border-0"
                >
                  <span className="text-[15px] text-white/85">
                    {step.task}
                  </span>

                  <span className="rounded-md border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[12px] text-white/50">
                    {step.tool}
                  </span>
                </div>
              ))}

            </div>

            <p className="mt-7 max-w-[340px] text-[14px] leading-[1.7] text-white/50">
              Informationen werden weitergereicht,
              kopiert und mehrfach eingegeben.
            </p>
          </div>

          {/* WITH AGI WORKS */}

          <div className="relative overflow-hidden bg-gradient-to-br from-[#15263a] via-[#101b2b] to-[#0c131f] px-6 py-9 sm:px-10 sm:py-11 lg:px-11 lg:py-12">

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-24 -top-28 h-[360px] w-[360px] rounded-full bg-sky-400/[0.10] blur-[95px]"
            />

            <div className="relative">

              <p className="text-[11px] font-semibold uppercase tracking-[0.21em] text-sky-300">
                Mit AGI Works
              </p>

              <h3
                className="mt-4 text-[27px] font-normal leading-[1.18] tracking-[-0.035em] text-white sm:text-[33px]"
                style={{
                  fontFamily: "var(--font-headline),system-ui,sans-serif",
                }}
              >
                Ein Vorgang.
                <br />

                <span className="text-[#8fc4f5]">
                  Alles im Blick.
                </span>
              </h3>

              <p className="mt-4 max-w-[480px] text-[14px] leading-[1.7] text-white/65">
                Anfrage, Kundendaten und Angebot greifen
                ineinander – ohne dass Informationen
                ständig übertragen werden müssen.
              </p>

              {/* CONNECTED PROCESS VIEW */}

              <div className="mt-7 overflow-hidden rounded-[19px] border border-sky-200/[0.18] bg-[#0b1320]/85 shadow-[0_18px_45px_rgba(0,0,0,0.24)]">

                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">

                  <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/65">
                    Kundenanfrage
                  </span>

                  <span className="text-[11px] text-sky-200/65">
                    Prozessbeispiel
                  </span>
                </div>

                <ol className="px-5 py-1 sm:px-6">

                  {connectedSteps.map((step) => (
                    <li
                      key={step.title}
                      className="flex items-start gap-4 border-b border-white/[0.075] py-[15px] last:border-0"
                    >

                      <span
                        aria-hidden="true"
                        className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-sky-300/30 bg-sky-300/10 text-sky-200"
                      >
                        <svg
                          viewBox="0 0 24 24"
                          className="h-3.5 w-3.5"
                          fill="none"
                        >
                          <path
                            d="m5 12 4 4L19 6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>

                      <div className="min-w-0">

                        <p className="text-[14px] font-medium text-white/90">
                          {step.title}
                        </p>

                        <p className="mt-1 text-[12px] leading-[1.6] text-white/50">
                          {step.detail}
                        </p>

                      </div>
                    </li>
                  ))}

                </ol>
              </div>

            </div>
          </div>

        </div>

        {/* CONVERSION */}

        <div className="mt-7 flex flex-col items-start justify-between gap-5 sm:flex-row sm:items-center">

          <p className="max-w-[550px] text-[13px] leading-[1.7] text-white/50">
            Beispielhafter Prozess. Die tatsächliche Lösung
            entwickeln wir passend zu Ihrem Unternehmen.
          </p>

          <Link
            href={contactHref}
            className="inline-flex shrink-0 items-center justify-center gap-3 rounded-xl border border-sky-300/45 bg-sky-300/[0.12] px-6 py-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-sky-300/[0.2] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
          >
            Softwareprojekt besprechen
            <span aria-hidden="true">→</span>
          </Link>

        </div>

      </div>
    </section>
  );
}
