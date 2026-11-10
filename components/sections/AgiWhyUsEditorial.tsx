"use client";

// AGI_WHYUS_PREMIUM_V3

import Link from "next/link";
import { usePathname } from "next/navigation";

const principles = [
  {
    title: "Direkter Gründerkontakt",
    description:
      "Klare Kommunikation ohne unnötige Übergaben.",
  },
  {
    title: "Architektur für echte Abläufe",
    description:
      "Bestehende Systeme sinnvoll verbinden, gezielt erweitern.",
  },
  {
    title: "Betreuung über den Launch hinaus",
    description:
      "Wartbar, ausbaufähig und langfristig gedacht.",
  },
];

export default function AgiWhyUsEditorial() {
  const pathname = usePathname();

  const contactHref = pathname?.startsWith("/agiworks")
    ? "/agiworks/kontakt"
    : "/kontakt";

  return (
    <section
      aria-labelledby="agi-why-title"
      className="relative isolate overflow-hidden bg-[#070b14] py-16 sm:py-20 lg:py-24"
     data-homeflow-surface="true">

      {/* PREMIUM BACKGROUND */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 43% 60% at 28% 66%,rgba(24,79,135,0.15),transparent 75%),radial-gradient(ellipse 35% 60% at 88% 36%,rgba(28,89,159,0.11),transparent 80%),linear-gradient(180deg,#080c16 0%,#07101b 58%,#070b14 100%)",
        }}
      />

      {/* DEZENTER BLAUER LICHTBOGEN */}

      <svg
        aria-hidden="true"
        focusable="false"
        viewBox="0 0 1040 740"
        className="pointer-events-none absolute -left-[100px] top-0 hidden h-[740px] w-[1040px] opacity-75 lg:block"
      >
        <defs>
          <linearGradient
            id="agi-why-arc-v3"
            x1="0"
            y1="1"
            x2="1"
            y2="0"
          >
            <stop
              offset="0%"
              stopColor="#235C99"
              stopOpacity="0"
            />

            <stop
              offset="40%"
              stopColor="#64B8FF"
              stopOpacity="0.25"
            />

            <stop
              offset="74%"
              stopColor="#87C8FF"
              stopOpacity="0.8"
            />

            <stop
              offset="100%"
              stopColor="#194A87"
              stopOpacity="0"
            />
          </linearGradient>

          <filter
            id="agi-why-glow-v3"
            x="-30%"
            y="-30%"
            width="160%"
            height="160%"
          >
            <feGaussianBlur stdDeviation="13" />
          </filter>
        </defs>

        <path
          d="M-100 80 C-4 490 285 702 567 552 C790 438 885 240 902 -45"
          fill="none"
          stroke="url(#agi-why-arc-v3)"
          strokeWidth="18"
          filter="url(#agi-why-glow-v3)"
        />

        <path
          d="M-100 80 C-4 490 285 702 567 552 C790 438 885 240 902 -45"
          fill="none"
          stroke="url(#agi-why-arc-v3)"
          strokeWidth="1.5"
        />
      </svg>

      <div className="relative mx-auto max-w-[1300px] px-5 sm:px-8">

        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-14 xl:gap-20">

          {/* LINKE PREMIUM HEADLINE */}

          <div className="relative z-10 max-w-[670px] lg:py-5">

            <div className="flex items-center gap-4">

              <span
                aria-hidden="true"
                className="h-px w-9 bg-sky-300/75"
              />

              <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-sky-300/90">
                WARUM AGI WORKS
              </p>

            </div>

            <h2
              id="agi-why-title"
              className="mt-8 text-[clamp(2.3rem,3.35vw,3.8rem)] font-normal leading-[1.105] tracking-[-0.055em]"
              style={{
                fontFamily:
                  "var(--font-headline),system-ui,sans-serif",
              }}
            >

              <span className="block text-white">
                Keine Standardsoftware.
              </span>

              <span className="mt-2 block bg-gradient-to-r from-[#c9e4fa] via-[#91c4ef] to-[#4c9ee4] bg-clip-text text-transparent">
                Eine Lösung, die zu Ihrem Unternehmen passt.
              </span>

            </h2>

            <p className="mt-7 max-w-[530px] text-[15px] leading-[1.85] text-white/70 sm:text-[17px]">
              Wir entwickeln individuelle Software rund um
              Ihre realen Geschäftsprozesse – technisch präzise,
              wirtschaftlich sinnvoll und mit einem klaren Fokus
              auf Ihre Ziele.
            </p>

            <Link
              href={contactHref}
              className="group mt-9 inline-flex min-h-[54px] items-center justify-center gap-6 rounded-xl border border-sky-300/50 bg-[#132d42]/70 px-6 py-3.5 text-[14px] font-medium text-white shadow-[0_12px_30px_rgba(0,0,0,0.18)] transition-colors hover:border-sky-200/80 hover:bg-[#204766]/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300"
            >

              Softwareprojekt besprechen

              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="17"
                height="17"
                fill="none"
                className="transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
              >
                <path
                  d="M4 12h16m-6-6 6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

            </Link>

          </div>

          {/* RECHTE PREMIUM GLASS CARD */}

          <div
            className="relative z-10 overflow-hidden rounded-[28px] border border-sky-300/30 bg-[#0b1523]/90 p-6 shadow-[0_22px_80px_rgba(0,0,0,0.38),0_0_40px_rgba(42,124,210,0.08),inset_0_1px_0_rgba(255,255,255,0.09)] sm:p-9 lg:p-10"
            style={{
              backgroundImage:
                "radial-gradient(ellipse 90% 50% at 100% 0%,rgba(51,119,197,0.19),transparent 80%),linear-gradient(145deg,rgba(17,33,53,0.94),rgba(7,14,26,0.97))",
            }}
          >

            {/* GLASS HIGHLIGHTS */}

            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 h-px w-2/3 bg-gradient-to-r from-sky-300/75 via-sky-300/25 to-transparent"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-0 right-0 h-px w-2/3 bg-gradient-to-l from-sky-300/75 via-sky-300/25 to-transparent"
            />

            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-sky-400/[0.08] blur-3xl"
            />

            {/* CARD HEADER */}

            <div className="relative flex items-center gap-4">

              <span
                aria-hidden="true"
                className="h-px w-9 bg-sky-300/75"
              />

              <p className="text-[11px] font-medium uppercase tracking-[0.23em] text-sky-300/85">
                UNSER ANSATZ
              </p>

            </div>

            {/* PREMIUM BENEFITS */}

            <div className="relative mt-5 divide-y divide-white/[0.11]">

              {principles.map((principle, index) => (

                <div
                  key={principle.title}
                  className="flex items-start gap-5 py-6 first:pt-5 last:pb-2 sm:gap-6 sm:py-7"
                >

                  <div
                    aria-hidden="true"
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-sky-300/25 bg-[#12293b]/80 text-[19px] font-medium tracking-[-0.03em] text-sky-100/95 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:h-16 sm:w-16"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  <div className="min-w-0 pt-1">

                    <h3 className="text-[18px] font-medium leading-[1.3] tracking-[-0.025em] text-white sm:text-[21px]">
                      {principle.title}
                    </h3>

                    <p className="mt-2 max-w-[370px] text-[13px] leading-[1.75] text-white/60 sm:text-[15px]">
                      {principle.description}
                    </p>

                  </div>

                </div>

              ))}

            </div>

          </div>

        </div>

        {/* PREMIUM FOOTER LINE */}

        <div className="mt-14 flex items-center gap-6 border-t border-white/[0.08] pt-7 sm:mt-16">

          <span
            aria-hidden="true"
            className="hidden h-px flex-1 bg-gradient-to-r from-transparent to-sky-300/25 sm:block"
          />

          <p className="text-center text-[10px] font-medium uppercase tracking-[0.21em] text-sky-200/70 sm:text-[11px]">
            Persönlich. Individuell. Langfristig begleitet.
          </p>

          <span
            aria-hidden="true"
            className="hidden h-px flex-1 bg-gradient-to-l from-transparent to-sky-300/25 sm:block"
          />

        </div>

      </div>

    </section>
  );
}
