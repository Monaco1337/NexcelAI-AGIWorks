"use client";

/**
 * NEXCEL AI / AGI WORKS · FoundersCta
 *
 * Persönlicher Gründerkontakt auf höchstem Niveau — beide Gründer
 * (Celina Siebeneicher + Kevin Blazevic) als hochwertige Portraits,
 * mit klarer Conversion-Führung.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";
import { NexcelLogoMark } from "@/components/ui/NexcelLogoMark";
import { AgiWorksLogo } from "@/components/ui/AgiWorksLogo";

const FOUNDERS = [
  {
    name: "Celina Siebeneicher",
    firstName: "Celina",
    lastName: "Siebeneicher",
    role: "Systemdesign · Unternehmensarchitektur · Customer Experience",
    brand: "NEXCEL AI",
    isAgiWorks: false,
    isNexcel: true,
    image: "/images/team/celina-v2.jpg",
  },
  {
    name: "Kevin Blazevic",
    firstName: "Kevin",
    lastName: "Blazevic",
    role: "Softwarearchitektur · Plattformen · Infrastruktur",
    brand: "AGI Works",
    isAgiWorks: true,
    isNexcel: false,
    image: "/images/team/kevin.png",
  },
];

export default function FoundersCta() {
  const brand = useBrand();
  const analyseHref = resolveBrandNavHref("/systemanalyse", brand.id);
  const kontaktHref = resolveBrandNavHref("/kontakt", brand.id);

  return (
    <section className="relative w-full py-20 sm:py-28 lg:py-36">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <div
          className="relative overflow-hidden rounded-[32px] p-7 sm:p-10 lg:p-14"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.012) 100%)",
            border: "1px solid var(--brand-card-border)",
            boxShadow:
              "0 50px 120px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          {/* Brand-Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[120%] -translate-x-1/2"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 0%, var(--brand-glow-mid), transparent 70%)",
            }}
          />

          <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
            {/* Text + CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                className="text-[10.5px] font-medium uppercase tracking-[0.30em]"
                style={{ color: "var(--accent)" }}
              >
                Persönlicher Gründerkontakt
              </span>
              <h2
                className="mt-3 text-[2rem] leading-[1.1] tracking-[-0.02em] text-white sm:text-[2.6rem]"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
              >
                Direkt mit den Gründern.{" "}
                <span
                  style={{
                    background: "var(--brand-headline-gradient)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                    fontWeight: 400,
                  }}
                >
                  Keine Agentur-Schleife.
                </span>
              </h2>
              <p className="mt-5 max-w-[520px] text-[15px] leading-[1.65] text-white/65">
                Wir begleiten Ihr System persönlich – von der Analyse bis zum Livebetrieb.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href={analyseHref} prefetch className="group/cta">
                  <span
                    className="relative flex items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-7 py-[16px] text-[14px] font-semibold text-white transition-transform duration-300 group-hover/cta:-translate-y-0.5"
                    style={{
                      background: "color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.03))",
                      border: "1px solid color-mix(in srgb, var(--accent) 48%, transparent)",
                      fontFamily: "var(--font-headline), system-ui, sans-serif",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 6px 28px color-mix(in srgb, var(--accent) 20%, transparent), inset 0 1px 0 rgba(255,255,255,0.12)",
                    }}
                  >
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full transition-transform duration-700 ease-out group-hover/cta:translate-x-full"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)",
                      }}
                    />
                    <span className="relative">Kostenlose Systemanalyse starten</span>
                  </span>
                </Link>

                <Link href={kontaktHref} prefetch className="group/sec">
                  <span
                    className="flex items-center justify-center gap-2 rounded-2xl px-7 py-[16px] text-[14px] font-medium text-white/85 transition-colors duration-300 group-hover/sec:text-white"
                    style={{
                      fontFamily: "var(--font-headline), system-ui, sans-serif",
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                      border: "1px solid rgba(255,255,255,0.12)",
                    }}
                  >
                    Projekt besprechen
                  </span>
                </Link>
              </div>
            </motion.div>

            {/* Beide Gründer */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-12%" }}
              transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="grid grid-cols-2 gap-4"
            >
              {FOUNDERS.map((f) => (
                <div
                  key={f.name}
                  className="relative flex flex-col overflow-hidden rounded-3xl"
                  style={{
                    border: "1px solid var(--brand-card-border)",
                    boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
                  }}
                >
                  <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
                    <img
                      src={f.image}
                      alt={`${f.name} — ${f.brand}`}
                      className="absolute inset-0 h-full w-full select-none object-cover object-top"
                      draggable={false}
                    />
                    {/* Dezente Tiefe auf Mobile (Text steht darunter) */}
                    <div
                      aria-hidden
                      className="absolute inset-0 sm:hidden"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(5,4,16,0) 55%, rgba(5,4,16,0.55) 100%)",
                      }}
                    />
                    {/* Kräftiger Verlauf für das Overlay ab sm */}
                    <div
                      aria-hidden
                      className="absolute inset-0 hidden sm:block"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(5,4,16,0.05) 30%, rgba(5,4,16,0.92) 100%)",
                      }}
                    />
                  </div>

                  {/* Info: unter dem Bild auf Mobile, Overlay ab sm */}
                  <div className="p-4 sm:absolute sm:inset-x-0 sm:bottom-0">
                    {/* Vor-/Nachname stets zweizeilig — einheitliche Kartenhöhe für beide Gründer */}
                    <div
                      className="text-[13px] leading-[1.25] sm:text-[14px] font-semibold text-white"
                      style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
                    >
                      <span className="block">{f.firstName}</span>
                      <span className="block">{f.lastName}</span>
                    </div>
                    {/* Brand-Zeile: feste Höhe damit beide Namen auf gleicher Höhe landen */}
                    <div className="mt-1 flex min-h-[18px] items-center">
                      {f.isNexcel && (
                        <NexcelLogoMark width={78} className="-ml-0.5" />
                      )}
                      {f.isAgiWorks && (
                        <AgiWorksLogo width={78} className="-ml-0.5" />
                      )}
                    </div>
                    <div
                      lang="de"
                      className="mt-1.5 text-[11px] leading-[1.5] text-white/60 [hyphens:auto] [overflow-wrap:break-word]"
                    >
                      {f.role}
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
