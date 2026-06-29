"use client";

/**
 * NEXCEL AI / AGI WORKS · CustomerLogoCloud
 *
 * Kuratierte Referenz-/Kundenlogo-Sektion auf Premium-Enterprise-Niveau.
 * Einheitliche Glass-Tiles, ruhige Typografie, dezente Brand-Anmutung —
 * bewusst KEINE zufällige Sponsorleiste.
 *
 * Alle Logos liegen direkt im /public-Ordner. Pfade sind root-relativ
 * (z. B. "/lulus-beauty.png"), die Dateinamen entsprechen exakt den
 * tatsächlich vorhandenen Dateien.
 */

import { motion } from "framer-motion";

type CustomerLogo = {
  name: string;
  src: string;
  /** Tailwind-Klassen für individuelle, ausbalancierte Logo-Größe */
  logoClassName: string;
};

const customerLogos: CustomerLogo[] = [
  { name: "Lulu’s Beauty", src: "/lulus-beauty.png", logoClassName: "max-h-12 max-w-[150px]" },
  { name: "BeautyBar Akademie", src: "/beautybar-akademie.png", logoClassName: "max-h-14 max-w-[180px]" },
  { name: "Impuls Ambulanter Pflegedienst", src: "/impuls-pflegedienst.png", logoClassName: "max-h-12 max-w-[210px]" },
  { name: "PflegeNest Bochum", src: "/pflegenest-bochum.png", logoClassName: "max-h-16 max-w-[150px]" },
  { name: "Borne-Run", src: "/borne-run.png", logoClassName: "max-h-14 max-w-[170px]" },
  { name: "Immobilien Weissleder", src: "/immobilien-weissleder.png", logoClassName: "max-h-12 max-w-[230px]" },
  { name: "AGI Energy", src: "/agi-energy.png", logoClassName: "max-h-11 max-w-[200px]" },
  { name: "Lokführerzentrum", src: "/lokfuehrerzentrum.png", logoClassName: "max-h-14 max-w-[240px]" },
  { name: "Cannabbros CSC", src: "/cannabbros.png", logoClassName: "max-h-16 max-w-[130px]" },
  { name: "Anatoly Mook", src: "/anatoly-mook.png", logoClassName: "max-h-14 max-w-[180px]" },
];

export default function CustomerLogoCloud() {
  return (
    <section className="relative w-full py-20 sm:py-24">
      <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        {/* ── Überschrift ── */}
        <div className="mx-auto max-w-[640px] text-center">
          <div className="flex items-center justify-center gap-4">
            <span
              aria-hidden
              className="h-px w-10 sm:w-12"
              style={{ background: "linear-gradient(90deg, transparent, var(--brand-line-dim))" }}
            />
            <span
              className="text-[10.5px] font-medium uppercase tracking-[0.30em]"
              style={{ color: "var(--accent)" }}
            >
              Referenzen
            </span>
            <span
              aria-hidden
              className="h-px w-10 sm:w-12"
              style={{ background: "linear-gradient(90deg, var(--brand-line-dim), transparent)" }}
            />
          </div>

          <h2
            className="mt-5 text-[1.6rem] leading-[1.15] tracking-[-0.02em] text-white sm:text-[2rem]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
          >
            Vertraut von Unternehmen, die wachsen wollen
          </h2>
          <p className="mx-auto mt-4 max-w-[520px] text-[13.5px] leading-[1.6] text-white/50 sm:text-[14.5px]">
            Ausgewählte Projekte, Plattformen und Systeme, die wir bereits
            mitentwickelt oder digital unterstützt haben.
          </p>
        </div>

        {/* ── Logo-Grid ── */}
        <div className="mt-14 grid grid-cols-2 gap-px overflow-hidden rounded-[24px] sm:grid-cols-3 lg:grid-cols-5"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid var(--brand-card-border)",
            boxShadow: "0 30px 80px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
          }}
        >
          {customerLogos.map((logo, i) => (
            <motion.div
              key={logo.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-8%" }}
              transition={{ duration: 0.5, delay: (i % 5) * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className="group relative flex h-[110px] items-center justify-center p-6 sm:h-[128px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(10,8,22,0.7) 0%, rgba(5,4,16,0.7) 100%)",
              }}
            >
              {/* Hover-Glow */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    "radial-gradient(80% 90% at 50% 0%, var(--brand-card-glow-hover), transparent 70%)",
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logo.src}
                alt={logo.name}
                title={logo.name}
                loading="lazy"
                draggable={false}
                className={`relative h-auto w-auto select-none object-contain opacity-80 transition-all duration-500 group-hover:scale-[1.04] group-hover:opacity-100 ${logo.logoClassName}`}
                style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.45))" }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
