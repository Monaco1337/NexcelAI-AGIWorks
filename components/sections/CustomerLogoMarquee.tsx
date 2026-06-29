"use client";

/**
 * NEXCEL AI / AGI WORKS · CustomerLogoMarquee
 *
 * Originale Kundenlogos aus /public — volle Farben, Originalbranding.
 * Feinjustierung nur über max-h/max-w (className) und CSS filter (style).
 * Keine Umfärbung. Nur Helligkeit, Kontrast, Opacity nach Bedarf.
 */

type CustomerLogo = {
  name: string;
  src: string;
  /** Tailwind-Klassen für max-h / max-w Balance */
  className: string;
  /** Inline filter-Korrekturen für dunklen Hintergrund */
  style?: React.CSSProperties;
};

const customerLogos: CustomerLogo[] = [
  {
    // Transparenter BG, schwarzes Monogramm → invert = sauberes Weiß auf dark
    name: "Lulu's Beauty",
    src: "/lulus-beauty.png",
    className: "max-h-[50px] max-w-[50px] sm:max-h-[60px] sm:max-w-[60px]",
    style: { filter: "invert(1) brightness(0.90) opacity(0.78)" },
  },
  {
    // Transparent, lila+gold Kreis — Originalfarben auf dunklem BG
    name: "BeautyBar Akademie",
    src: "/beautybar-akademie.png",
    className: "max-h-[60px] max-w-[60px] sm:max-h-[70px] sm:max-w-[70px]",
    style: { filter: "brightness(0.95) opacity(0.80)" },
  },
  {
    // Schwarzer Text auf Transparent → invert(1) = weiße Schrift, Farben invertiert aber lesbar
    name: "Impuls Ambulanter Pflegedienst",
    src: "/impuls-pflegedienst.png",
    className: "max-h-[36px] max-w-[180px] sm:max-h-[42px] sm:max-w-[206px]",
    style: { filter: "invert(1) brightness(0.88) opacity(0.78)" },
  },
  {
    // Weißer Hintergrund → brightness(0) invert(1) = sauberes weißes Monochrom, kein Kasten
    name: "PflegeNest Bochum",
    src: "/pflegenest-bochum.png",
    className: "max-h-[64px] max-w-[64px] sm:max-h-[76px] sm:max-w-[76px]",
    style: { filter: "brightness(0) invert(1) opacity(0.78)" },
  },
  {
    // Dunkler Hintergrund — direkt nutzbar
    name: "Borne-Run",
    src: "/borne-run.png",
    className: "max-h-[40px] max-w-[160px] sm:max-h-[46px] sm:max-w-[184px] rounded-lg",
    style: { filter: "brightness(1.05) opacity(0.88)" },
  },
  {
    // brightness(0) invert(1) → sauberes weißes Monochrom-Logo, maximal lesbar auf dark
    name: "Immobilien Weissleder",
    src: "/immobilien-weissleder.png",
    className: "max-h-[38px] max-w-[200px] sm:max-h-[44px] sm:max-w-[228px]",
    style: { filter: "brightness(0) invert(1) opacity(0.75)" },
  },
  {
    // Dunkler Hintergrund — direkt nutzbar, dezent aufgehellt
    name: "AGI Energy",
    src: "/agi-energy.png",
    className: "max-h-[36px] max-w-[168px] sm:max-h-[42px] sm:max-w-[192px] rounded-lg",
    style: { filter: "brightness(1.08) opacity(0.90)" },
  },
  {
    // Weißer Hintergrund → brightness(0) invert(1) = sauberes Weiß, kein Kasten
    name: "Lokführerzentrum",
    src: "/lokfuehrerzentrum.png",
    className: "max-h-[40px] max-w-[200px] sm:max-h-[46px] sm:max-w-[228px] rounded-sm",
    style: { filter: "brightness(0) invert(1) opacity(0.78)" },
  },
  {
    // Freigestelltes Wappen, dunkles Grau → stark aufhellen für dunklen BG
    name: "Cannabbros",
    src: "/cannabbros.png",
    className: "max-h-[64px] max-w-[64px] sm:max-h-[76px] sm:max-w-[76px]",
    style: { filter: "brightness(2.2) contrast(0.80) opacity(0.80)" },
  },
  {
    // Dunkler Hintergrund — direkt nutzbar, leicht aufgehellt für Premium-Wirkung
    name: "Anatoly Mook",
    src: "/anatoly-mook.png",
    className: "max-h-[52px] max-w-[156px] sm:max-h-[62px] sm:max-w-[178px] rounded-lg",
    style: {
      filter: "brightness(1.10) opacity(0.88)",
    },
  },
];

const loop = [...customerLogos, ...customerLogos];

export default function CustomerLogoMarquee() {
  return (
    <section
      className="relative w-full pb-10 pt-6 sm:pb-14 sm:pt-8"
      style={{
        background:
          "linear-gradient(to bottom," +
          "#0b0d12 0%," +
          "rgba(8,6,18,0.95) 30%," +
          "rgba(5,3,14,0.90) 100%)",
      }}
    >
      {/* faint violet carry-over glow from Hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-40 w-2/3 -translate-x-1/2"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 50% 0%,rgba(109,40,217,0.10) 0%,transparent 75%)",
          filter: "blur(1px)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1200px] px-5 sm:px-8">
        <h2
          className="mb-6 text-center text-[1.2rem] font-[300] leading-[1.2] tracking-[-0.015em] text-white/60 sm:mb-7 sm:text-[1.35rem]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          Vertraut von Unternehmen, die wachsen wollen
        </h2>

        {/* ── Slider ── */}
        <div
          className="nxl-marquee-track group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] backdrop-blur"
          style={{
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0, #000 9%, #000 91%, transparent 100%)",
            maskImage:
              "linear-gradient(90deg, transparent 0, #000 9%, #000 91%, transparent 100%)",
          }}
        >
          <div className="nxl-marquee flex w-max items-center">
            {loop.map((logo, i) => (
              <div
                key={`${logo.name}-${i}`}
                className="flex h-[78px] shrink-0 items-center justify-center px-7 sm:h-[100px] sm:px-12"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={logo.src}
                  alt={logo.name}
                  title={logo.name}
                  loading="lazy"
                  draggable={false}
                  aria-hidden={i >= customerLogos.length}
                  className={`h-auto w-auto select-none object-contain transition duration-500 ease-out will-change-transform hover:translate-y-[-1px] hover:opacity-100 hover:brightness-110 ${logo.className}`}
                  style={logo.style}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes nxl-logo-scroll {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-50%, 0, 0); }
        }
        .nxl-marquee {
          animation: nxl-logo-scroll 46s linear infinite;
        }
        .nxl-marquee-track:hover .nxl-marquee {
          animation-play-state: paused;
        }
        @media (max-width: 640px) {
          .nxl-marquee { animation-duration: 38s; }
        }
        @media (prefers-reduced-motion: reduce) {
          .nxl-marquee { animation: none; transform: none; }
        }
      `}</style>
    </section>
  );
}
