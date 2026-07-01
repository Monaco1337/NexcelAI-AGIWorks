"use client";

/**
 * NEXCEL AI / AGI WORKS · PricingSection
 *
 * „Transparente Orientierung. Keine Baukästen."
 * 6 Preiskorridore als hochwertige Karten. Preise sind Orientierung,
 * jedes System wird individuell kalkuliert. Anker: #preise.
 */

import Link from "next/link";
import { motion } from "framer-motion";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";
import { SectionHeading } from "@/components/sections/SystemsGrid";

type Price = {
  title: string;
  price: string;
  suffix?: string;
  note: string;
  featured?: boolean;
};

const PRICES: Price[] = [
  { title: "Premium-Websystem", price: "ab 3.900 €", note: "Performance, Design und Conversion." },
  { title: "Buchungssystem", price: "ab 7.500 €", note: "Termine, Kunden und Abläufe digital." },
  { title: "Lead-Funnel & CRM", price: "ab 9.500 €", note: "Leads gewinnen und steuern." },
  { title: "Unternehmenssystem", price: "ab 15.000 €", note: "Prozesse zentral verbinden.", featured: true },
  { title: "Individuelles ERP-System", price: "ab 25.000 €", note: "Warenwirtschaft, Finanzen, Ressourcen." },
  { title: "KI & Automatisierung", price: "ab 7.500 €", suffix: "zusätzlich", note: "Ergänzt jedes System." },
];

export default function PricingSection() {
  const brand = useBrand();
  const preiskalkulatorHref = resolveBrandNavHref("/preiskalkulator", brand.id);
  const beratungHref = `${resolveBrandNavHref("/kontakt", brand.id)}?betreff=${encodeURIComponent(
    "Beratung: Passendes System finden"
  )}`;

  return (
    <section id="preise" className="relative w-full scroll-mt-[108px] py-20 sm:py-28">
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Preise"
          title="Transparente Orientierung. Keine Baukästen."
          subtitle="Alle Preise verstehen sich als Projektkorridore. Jedes System wird individuell kalkuliert."
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PRICES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex flex-col overflow-hidden rounded-2xl p-6"
              style={{
                background: p.featured
                  ? "linear-gradient(180deg, var(--brand-glow-mid) 0%, rgba(255,255,255,0.02) 100%)"
                  : "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
                border: p.featured
                  ? "1px solid var(--brand-line-mid)"
                  : "1px solid var(--brand-card-border)",
                boxShadow: p.featured
                  ? "0 24px 60px var(--brand-card-glow), inset 0 1px 0 rgba(255,255,255,0.08)"
                  : "inset 0 1px 0 rgba(255,255,255,0.05)",
              }}
            >
              {p.featured && (
                <span
                  className="mb-3 w-fit rounded-full px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 18%, rgba(255,255,255,0.04))",
                    border: "1px solid color-mix(in srgb, var(--accent) 45%, transparent)",
                  }}
                >
                  Häufig gewählt
                </span>
              )}
              <h3
                className="text-[16px] font-medium text-white"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
              >
                {p.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-[1.55] text-white/50">{p.note}</p>

              <div className="mt-5 flex items-baseline gap-2">
                <span
                  className="text-[1.7rem] font-semibold"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    background: "var(--brand-headline-gradient)",
                    WebkitBackgroundClip: "text",
                    backgroundClip: "text",
                    color: "transparent",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {p.price}
                </span>
                {p.suffix && (
                  <span className="text-[12px] text-white/45">{p.suffix}</span>
                )}
              </div>

              <Link
                href={preiskalkulatorHref}
                prefetch
                className="group/pl mt-6 inline-flex items-center gap-1.5 text-[12.5px] font-medium transition-colors"
                style={{ color: "var(--accent)" }}
              >
                Projektkorridor berechnen
                <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden className="transition-transform duration-300 group-hover/pl:translate-x-0.5">
                  <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* ── Beratungs-CTA · für Unentschlossene ── */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-8%" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative mt-5 flex flex-col items-start gap-6 overflow-hidden rounded-2xl p-7 sm:p-9 md:flex-row md:items-center md:justify-between"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.012) 100%)",
            border: "1px solid var(--brand-card-border)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
          }}
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{
              background:
                "radial-gradient(70% 120% at 0% 0%, var(--brand-card-glow), transparent 60%)",
            }}
          />
          <div className="relative max-w-2xl">
            <h3
              className="text-[1.15rem] leading-snug text-white sm:text-[1.35rem]"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
            >
              Sie wissen nicht, welches System zu Ihnen passt?
            </h3>
            <p className="mt-2.5 text-[13.5px] leading-[1.65] text-white/55">
              Kein Problem. Beschreiben Sie uns kurz Ihr Unternehmen und woran es
              hakt — wir melden uns zeitnah mit einer klaren Empfehlung, welches
              System für Sie wirklich Sinn ergibt. Unverbindlich und ehrlich.
            </p>
          </div>
          <Link
            href={beratungHref}
            className="group relative inline-flex shrink-0 items-center gap-2.5 rounded-full px-7 py-3.5 text-[13px] font-semibold text-white transition-all hover:gap-3.5"
            style={{
              background: "color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.03))",
              border: "1px solid color-mix(in srgb, var(--accent) 48%, transparent)",
              backdropFilter: "blur(10px)",
              boxShadow: "0 4px 20px color-mix(in srgb, var(--accent) 20%, transparent)",
            }}
          >
            Kostenlos beraten lassen
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
