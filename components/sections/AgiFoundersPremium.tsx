"use client";

// AGI_FOUNDERS_PREMIUM_V1

import Image from "next/image";
import Link from "next/link";

import {
  NexcelLogoMark
} from "@/components/ui/NexcelLogoMark";

import {
  AgiWorksLogo
} from "@/components/ui/AgiWorksLogo";

const founders = [
  {
    firstName: "Celina",
    lastName: "Siebeneicher",
    name: "Celina Siebeneicher",
    image: "/images/team/celina-v2.jpg",
    brand: "NEXCEL AI",
    role: "Systemdesign · Unternehmensarchitektur",
  },
  {
    firstName: "Kevin",
    lastName: "Blazevic",
    name: "Kevin Blazevic",
    image: "/images/team/kevin.png",
    brand: "AGI Works",
    role: "Softwarearchitektur · Plattformen",
  },
];

export default function AgiFoundersPremium() {
  return (
    <section
      aria-labelledby="agi-founders-title"
      className="relative isolate overflow-hidden bg-[#080b13] py-12 sm:py-16 lg:py-20"
    >
      <div className="mx-auto max-w-[1320px] px-5 sm:px-8">

        <div
          className="relative overflow-hidden rounded-[28px] border border-white/[0.12] bg-[#101722] px-6 py-9 shadow-[0_26px_90px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.06)] sm:rounded-[34px] sm:px-10 sm:py-11 lg:px-14 lg:py-14"
          style={{
            backgroundImage:
              "radial-gradient(ellipse 58% 85% at 85% 45%,rgba(37,97,157,0.13),transparent 80%),linear-gradient(130deg,#121925 0%,#0b111d 65%,#080e18 100%)"
          }}
        >

          {/* Subtiler oberer Lichtakzent */}

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/45 to-transparent"
          />

          <div
            className="relative grid items-center gap-11 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14"
          >

            {/* LINKE SEITE */}

            <div className="max-w-[540px]">

              <div className="flex items-center gap-3">

                <span
                  aria-hidden="true"
                  className="h-px w-8 bg-sky-300/80"
                />

                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-300/90 sm:text-[11px]"
                >
                  PERSÖNLICHER GRÜNDERKONTAKT
                </p>

              </div>

              <h2
                id="agi-founders-title"
                className="mt-7 text-[clamp(2.6rem,3.6vw,4.35rem)] font-normal leading-[1.08] tracking-[-0.055em] text-white"
                style={{
                  fontFamily:
                    "var(--font-headline),system-ui,sans-serif"
                }}
              >
                Ihre Idee.

                <span
                  className="mt-1 block bg-gradient-to-r from-[#e1f0ff] via-[#a2cdf3] to-[#559fdf] bg-clip-text text-transparent"
                >
                  Unsere Verantwortung.
                </span>
              </h2>

              <p
                className="mt-7 max-w-[460px] text-[15px] leading-[1.85] text-white/75 sm:text-[17px]"
              >
                Gute Software beginnt mit einem Gespräch.
                Nicht mit einem Standardpaket.
              </p>

              <p
                className="mt-4 max-w-[470px] text-[14px] leading-[1.85] text-white/55 sm:text-[15px]"
              >
                Ob CRM, ERP oder individuelle Plattform:
                Wir klären mit Ihnen Ziele, Anforderungen
                und die passende technische Umsetzung.
                Direkt mit den Menschen, die Ihr Projekt gestalten.
              </p>

              {/* EIN EINZIGER KLARER CTA */}

              <Link
                href="/agiworks/kontakt"
                className="group mt-9 inline-flex min-h-[54px] items-center justify-center gap-5 rounded-xl border border-sky-300/55 bg-[#244965]/85 px-6 py-3.5 text-[14px] font-medium text-white shadow-[0_10px_35px_rgba(30,108,177,0.17),inset_0_1px_0_rgba(255,255,255,0.12)] transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-sky-200/80 hover:bg-[#315d80] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-300 motion-reduce:transform-none"
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

              <p
                className="mt-4 text-[12px] leading-[1.6] text-white/45"
              >
                Beschreiben Sie uns kurz Ihr Vorhaben.
                Wir besprechen gemeinsam die nächsten Schritte.
              </p>

            </div>

            {/* RECHTE SEITE: ORIGINALPORTRAETS */}

            <div className="grid grid-cols-2 gap-3 sm:gap-4">

              {founders.map((founder) => (

                <figure
                  key={founder.name}
                  className="group relative min-w-0 overflow-hidden rounded-[20px] border border-white/[0.16] bg-[#0a1019] shadow-[0_20px_45px_rgba(0,0,0,0.3)] sm:rounded-[24px]"
                >

                  <div
                    className="relative aspect-[3/4] w-full overflow-hidden sm:aspect-[4/5] lg:aspect-[3/4]"
                  >

                    <Image
                      src={founder.image}
                      alt={"Porträt von " + founder.name}
                      fill
                      sizes="(min-width: 1280px) 290px, (min-width: 1024px) 23vw, (min-width: 640px) 42vw, 43vw"
                      className="object-cover object-top transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none"
                    />

                    {/* Nur der untere Bildrand wird abgedunkelt */}

                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[57%]"
                      style={{
                        background:
                          "linear-gradient(180deg,transparent 0%,rgba(4,8,17,0.25) 22%,rgba(4,8,17,0.88) 73%,rgba(4,8,17,0.98) 100%)"
                      }}
                    />

                    {/* Hochwertige, gut lesbare Bildbeschriftung */}

                    <figcaption
                      className="absolute inset-x-0 bottom-0 z-10 px-3 pb-4 sm:px-5 sm:pb-5"
                    >

                      <p
                        className="text-[14px] font-medium leading-[1.25] tracking-[-0.02em] text-white sm:text-[19px]"
                        style={{
                          fontFamily:
                            "var(--font-headline),system-ui,sans-serif"
                        }}
                      >
                        <span className="block">
                          {founder.firstName}
                        </span>

                        <span className="block">
                          {founder.lastName}
                        </span>
                      </p>

                      <div
                        className="mt-2 flex min-h-[20px] items-center"
                      >
                        {founder.brand === "NEXCEL AI" ? (
                          <NexcelLogoMark
                            width={86}
                            className="-ml-0.5"
                          />
                        ) : (
                          <AgiWorksLogo
                            width={86}
                            className="-ml-0.5"
                          />
                        )}
                      </div>

                      <p
                        className="mt-2 text-[10px] leading-[1.45] text-white/75 sm:text-[12px]"
                      >
                        {founder.role}
                      </p>

                    </figcaption>

                  </div>

                </figure>

              ))}

            </div>

          </div>

          {/* DEZENTER ABSCHLUSS */}

          <div
            className="relative mt-10 flex items-center gap-4 border-t border-white/[0.09] pt-6 sm:mt-12"
          >

            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300/80"
            />

            <p
              className="text-[11px] font-medium tracking-[0.08em] text-white/45 sm:text-[12px]"
            >
              Zwei Perspektiven. Eine gemeinsame Umsetzung.
            </p>

          </div>

        </div>

      </div>

    </section>
  );
}
