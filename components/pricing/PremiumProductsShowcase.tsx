"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

/* ════════════════════════════════════════════════════════════════════
 *  Premium Products Showcase
 *  ════════════════════════════════════════════════════════════════
 *  Festpreis-Katalog für den Preiskalkulator:
 *
 *    ┌──────────────────────────────────────────────────────────┐
 *    │  Eyebrow · Headline · Subline · 4 Trust-Badges           │
 *    │                                                          │
 *    │  ┌─────┐ ┌─────┐ ┌─FEATURED─┐ ┌─────┐                    │
 *    │  │START│ │BUSI-│ │ ADVANCED │ │CUSTOM│                   │
 *    │  │     │ │NESS │ │ Bestsel. │ │ SYS. │                   │
 *    │  └─────┘ └─────┘ └──────────┘ └─────┘                    │
 *    │                                                          │
 *    │  ── BETREUUNG & WEITERENTWICKLUNG ──                     │
 *    │  ┌─Basic─┐ ┌─Growth─┐ ┌─Infra─┐                          │
 *    │                                                          │
 *    │  ┌──────┐ ┌──KEY─┐ ┌──────┐                              │
 *    │  │Andere│ │STONE │ │Unser │  ← Warum NEXCEL/AGI WORKS    │
 *    │  │ vs.  │ │ ◆◆◆  │ │Ansatz│                              │
 *    │  └──────┘ └──────┘ └──────┘                              │
 *    │                                                          │
 *    │  Schneller · Mehr · Sicher · Besser  ← Bottom-Benefits   │
 *    └──────────────────────────────────────────────────────────┘
 *
 *  • Brand-aware: alle Farben über CSS-Vars (NEXCEL = Violett, AGI = Cyan)
 *  • Keine Stockfotos, keine Marken-Logos — präzise SVG-Architektur
 *  • Subtile Framer-Motion-Animationen, kein visueller Lärm
 *  ════════════════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────
 *  DATA
 *  ─────────────────────────────────────────────────────────────── */

type TierIconName = "rocket" | "chart" | "layers" | "brain";

interface Tier {
  key: string;
  badge: string;
  title: string;
  subtitle: string;
  priceFrom: number;
  icon: TierIconName;
  inheritsLabel?: string;
  featuresLabel: string;
  features: string[];
  idealFor: string;
  featured?: boolean;
}

const TIERS: Tier[] = [
  {
    key: "start",
    badge: "Start",
    title: "Premium Onepager",
    subtitle: "Für einen professionellen Auftritt, der überzeugt.",
    priceFrom: 2490,
    icon: "rocket",
    featuresLabel: "Enthalten:",
    features: [
      "Individuelles Design",
      "Mobile Optimierung",
      "SEO-Grundstruktur",
      "Kontakt- & Anfrageformulare",
      "Terminbuchung",
      "Conversion-Optimierung",
      "Kleine Automationen",
      "Schnelle Ladezeiten",
      "Moderne Infrastruktur",
      "Persönliche Betreuung",
    ],
    idealFor:
      "Ideal für lokale Unternehmen, Dienstleister & Selbstständige.",
  },
  {
    key: "business",
    badge: "Business",
    title: "Unternehmenswebsite + CRM",
    subtitle: "Mehr Kontrolle, mehr Prozesse, mehr Wachstum.",
    priceFrom: 4900,
    icon: "chart",
    inheritsLabel: "Alles aus Start, plus:",
    featuresLabel: "Erweiterungen:",
    features: [
      "Individuelles CRM-System",
      "Adminpanel",
      "Automatisierte E-Mails",
      "Bewerbermanagement",
      "Leadverwaltung",
      "Interne Prozesse",
      "Analyse & Übersicht",
      "SEO & Struktur",
      "Conversion-System",
      "Skalierbare Architektur",
    ],
    idealFor:
      "Ideal für wachsende Unternehmen, Teams & Organisationen.",
  },
  {
    key: "advanced",
    badge: "Advanced",
    title: "Plattformen & Unternehmenssysteme",
    subtitle: "Individuelle Plattformen und operative Systeme.",
    priceFrom: 10000,
    icon: "layers",
    featuresLabel: "Beispiele:",
    features: [
      "Immobilienplattformen",
      "Mitgliederbereiche",
      "Hausverwaltungssysteme",
      "Eventsysteme",
      "Interne Dashboards",
      "u. v. m.",
    ],
    idealFor:
      "Ideal für Unternehmen mit komplexen Prozessen und Anforderungen.",
    featured: true,
  },
  {
    key: "custom",
    badge: "Custom Systems",
    title: "Individuelle KI- & Unternehmenssysteme",
    subtitle: "Für spezielle Prozesse, Workflows und KI-gestützte Systeme.",
    priceFrom: 15000,
    icon: "brain",
    featuresLabel: "Möglich:",
    features: [
      "KI-gestützte Prozesse",
      "Operative Unternehmenssysteme",
      "Sales- & Delivery-Systeme",
      "Analyseplattformen",
      "Interne Tools",
      "Automatisierungszentralen",
      "Intelligente Dashboards",
      "Prozessdigitalisierung",
      "Unternehmens-KI",
    ],
    idealFor:
      "Ideal für Unternehmen mit besonderen Anforderungen und Visionen.",
  },
];

type SupportIconName = "shield" | "growth" | "stack";

interface SupportTier {
  key: string;
  title: string;
  priceLabel: string;
  icon: SupportIconName;
  features: string[];
}

const SUPPORT_TIERS: SupportTier[] = [
  {
    key: "basic",
    title: "Basic Support",
    priceLabel: "149 – 290 € / Monat",
    icon: "shield",
    features: [
      "Updates",
      "Kleine Änderungen",
      "Technischer Support",
      "Sicherheitsupdates",
    ],
  },
  {
    key: "growth",
    title: "Growth",
    priceLabel: "490 – 990 € / Monat",
    icon: "growth",
    features: [
      "Laufende Optimierung",
      "Neue Funktionen",
      "SEO & Conversion-Optimierung",
      "Automationen",
      "Analyse & Betreuung",
    ],
  },
  {
    key: "infra",
    title: "Infrastruktur & Skalierung",
    priceLabel: "ab 1.500 € / Monat",
    icon: "stack",
    features: [
      "Komplexe Infrastruktur",
      "Mehrere Prozesse",
      "KI-Systeme",
      "Skalierung & Weiterentwicklung",
      "Priorisierter Support",
    ],
  },
];

const WHY_DATA = {
  othersTitle: "Andere verkaufen",
  others: [
    "Templates",
    "Baukästen",
    "Standard-Webseiten",
    "Isolierte Tools",
    "Einmalige Lösungen",
  ],
  weTitle: "Wir entwickeln",
  we: [
    "Systeme",
    "Prozesse",
    "Automatisierung",
    "Infrastruktur",
    "Operative Lösungen",
  ],
  approachLabel: "Unser Ansatz",
  approach: [
    "Weniger Chaos.",
    "Mehr Übersicht.",
    "Mehr Automatisierung.",
    "Mehr Kontrolle.",
  ],
  approachClosing: "Ein zentrales System statt isolierter Tools.",
};

type BenefitIconName = "rocket" | "target" | "shield" | "chart";

interface Benefit {
  title: string;
  subtitle: string;
  icon: BenefitIconName;
}

const BOTTOM_BENEFITS: Benefit[] = [
  {
    title: "Schneller starten",
    subtitle: "Durch klare Prozesse und erprobte Systeme.",
    icon: "rocket",
  },
  {
    title: "Mehr erreichen",
    subtitle: "Durch Automatisierung und smarte Strukturen.",
    icon: "target",
  },
  {
    title: "Sicher wachsen",
    subtitle: "Durch saubere und stabile Systeme.",
    icon: "shield",
  },
  {
    title: "Besser entscheiden",
    subtitle: "Durch Daten, Analysen und echte Transparenz.",
    icon: "chart",
  },
];

const TRUST_BADGES = [
  "Individuell entwickelt",
  "Mobil optimiert",
  "Automatisiert",
  "Zukunftssicher",
];

/* ─────────────────────────────────────────────────────────────────────
 *  HELPERS
 *  ─────────────────────────────────────────────────────────────── */

function formatPriceFrom(n: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-10% 0px" },
  transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/* ════════════════════════════════════════════════════════════════════
 *  MAIN COMPONENT
 *  ════════════════════════════════════════════════════════════════ */

export default function PremiumProductsShowcase() {
  return (
    <section
      aria-labelledby="products-headline"
      className="relative w-full"
    >
      {/* Atmosphäre — sehr dezenter Brand-Glow im Hintergrund */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-50"
        style={{
          background: `
            radial-gradient(ellipse 40% 25% at 50% 18%, var(--brand-glow-strong) 0%, transparent 70%),
            radial-gradient(ellipse 30% 20% at 20% 55%, var(--brand-glow-mid) 0%, transparent 70%),
            radial-gradient(ellipse 30% 20% at 80% 75%, var(--brand-glow-mid) 0%, transparent 70%)
          `,
        }}
      />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-[clamp(48px,7vh,80px)] px-4 sm:px-6">
        <ShowcaseHeader />
        <MainTiersGrid />
        <SupportTiersSection />
        <WhySection />
        <BottomBenefitsRow />
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  HEADER — Eyebrow + Headline + Subline + Trust-Badges
 *  ════════════════════════════════════════════════════════════════ */

function ShowcaseHeader() {
  return (
    <div className="flex flex-col items-center text-center">
      {/* Eyebrow-Chip */}
      <motion.div
        {...fadeUp(0)}
        className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5"
        style={{
          background: "rgba(12, 8, 24, 0.65)",
          border: "1px solid var(--brand-card-border)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 8px 24px rgba(0,0,0,0.30), 0 0 18px var(--brand-glow-mid)",
        }}
      >
        <span
          aria-hidden
          className="inline-block h-[5px] w-[5px] rounded-full"
          style={{
            background: "var(--brand-line-bright)",
            boxShadow: "0 0 8px var(--brand-glow-strong)",
          }}
        />
        <span
          className="text-[10px] font-medium uppercase tracking-[0.36em] sm:text-[10.5px]"
          style={{
            color: "var(--brand-line-bright)",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
          }}
        >
          Produkte &amp; Festpreise
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h2
        id="products-headline"
        {...fadeUp(0.08)}
        className="mt-6 max-w-[820px] text-[2rem] leading-[1.08] text-white sm:text-[2.6rem] md:text-[3.1rem]"
        style={{
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 300,
          letterSpacing: "-0.035em",
        }}
      >
        Digitale{" "}
        <span
          style={{
            background: "var(--brand-headline-gradient)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            fontWeight: 400,
            filter: "drop-shadow(0 0 22px var(--brand-glow-strong))",
          }}
        >
          Unternehmenssysteme
        </span>{" "}
        statt Standard-Webseiten.
      </motion.h2>

      {/* Subline */}
      <motion.p
        {...fadeUp(0.16)}
        className="mt-5 max-w-[620px] text-[13.5px] leading-[1.65] text-white/55 sm:text-[14.5px]"
      >
        Wir entwickeln keine Templates. Wir entwickeln moderne Systeme für
        Unternehmen, die wachsen wollen. Individuell. Skalierbar. Automatisiert.
      </motion.p>

      {/* Trust-Badges */}
      <motion.div
        {...fadeUp(0.24)}
        className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 sm:gap-x-8"
      >
        {TRUST_BADGES.map((badge, i) => (
          <div
            key={badge}
            className="flex items-center gap-2 text-white/55"
          >
            <TrustBadgeIcon index={i} />
            <span
              className="text-[10.5px] font-medium uppercase tracking-[0.18em] sm:text-[11px]"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            >
              {badge}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

function TrustBadgeIcon({ index }: { index: number }) {
  const common = {
    width: 14,
    height: 14,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "var(--brand-line-bright)",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (index === 0)
    return (
      <svg {...common}>
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 113 3L7 19l-4 1 1-4 12.5-12.5z" />
      </svg>
    );
  if (index === 1)
    return (
      <svg {...common}>
        <rect x="7" y="3" width="10" height="18" rx="2" />
        <line x1="12" y1="18" x2="12" y2="18.01" />
      </svg>
    );
  if (index === 2)
    return (
      <svg {...common}>
        <path d="M13 2L4.5 13H12l-1 9 8.5-11H12l1-9z" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  MAIN TIERS GRID — 4 Premium-Karten
 *  ════════════════════════════════════════════════════════════════ */

function MainTiersGrid() {
  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 xl:grid-cols-4">
      {TIERS.map((tier, i) => (
        <TierCard key={tier.key} tier={tier} index={i} />
      ))}
    </div>
  );
}

function TierCard({ tier, index }: { tier: Tier; index: number }) {
  const featured = !!tier.featured;
  return (
    <motion.article
      {...fadeUp(0.08 + index * 0.08)}
      className="relative flex h-full flex-col rounded-2xl"
      style={{
        background: featured
          ? "linear-gradient(180deg, rgba(20,14,42,0.95) 0%, rgba(8,5,20,0.96) 100%)"
          : "linear-gradient(180deg, rgba(16,12,30,0.85) 0%, rgba(8,6,20,0.90) 100%)",
        border: featured
          ? "1px solid color-mix(in srgb, var(--brand-line-bright) 35%, transparent)"
          : "1px solid var(--brand-card-border)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        boxShadow: featured
          ? "inset 0 1px 0 rgba(255,255,255,0.08), 0 24px 48px rgba(0,0,0,0.50), 0 0 36px var(--brand-glow-strong)"
          : "inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 28px rgba(0,0,0,0.40), 0 0 22px var(--brand-card-glow)",
      }}
    >
      {/* Top-Hairline Akzent */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background: featured
            ? "linear-gradient(90deg, transparent, var(--brand-line-bright), transparent)"
            : "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
        }}
      />

      {/* Featured-Aura unter der Karte */}
      {featured && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-4 -bottom-6 h-12 rounded-full opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 60% 100% at 50% 0%, var(--brand-glow-strong), transparent 70%)",
            filter: "blur(20px)",
          }}
        />
      )}

      {/* Featured-Badge "Bestseller" */}
      {featured && (
        <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
          <div
            className="flex items-center gap-1.5 rounded-full px-3 py-1"
            style={{
              background: "linear-gradient(155deg, rgba(28,18,52,0.98), rgba(12,8,26,0.99))",
              border: "1px solid color-mix(in srgb, var(--brand-line-bright) 45%, transparent)",
              boxShadow: "0 6px 18px rgba(0,0,0,0.45), 0 0 18px var(--brand-glow-strong)",
            }}
          >
            <span
              aria-hidden
              className="inline-block h-[4px] w-[4px] rounded-full"
              style={{
                background: "var(--brand-line-bright)",
                boxShadow: "0 0 6px var(--brand-glow-strong)",
              }}
            />
            <span
              className="text-[9px] font-medium uppercase tracking-[0.30em] sm:text-[9.5px]"
              style={{
                color: "var(--brand-line-bright)",
                fontFamily: "var(--font-headline), system-ui, sans-serif",
              }}
            >
              Beliebteste Wahl
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        {/* Tier-Badge oben */}
        <div className="flex items-center justify-center">
          <span
            className="inline-flex items-center rounded-full px-3 py-1"
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid var(--brand-card-border)",
            }}
          >
            <span
              className="text-[9.5px] font-semibold uppercase tracking-[0.30em] sm:text-[10px]"
              style={{
                color: featured ? "var(--brand-line-bright)" : "var(--brand-line-mid)",
                fontFamily: "var(--font-headline), system-ui, sans-serif",
              }}
            >
              {tier.badge}
            </span>
          </span>
        </div>

        {/* Icon */}
        <div className="mt-5 flex justify-center">
          <TierIconShell icon={tier.icon} featured={featured} />
        </div>

        {/* Titel + Subtitle */}
        <h3
          className="mt-4 text-center text-[18px] font-medium leading-tight text-white sm:text-[19px]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            letterSpacing: "-0.005em",
          }}
        >
          {tier.title}
        </h3>
        <p className="mt-2 text-center text-[12.5px] leading-snug text-white/55 sm:text-[13px]">
          {tier.subtitle}
        </p>

        {/* Preis */}
        <div className="mt-5 flex flex-col items-center">
          <span
            className="text-[9.5px] font-medium uppercase tracking-[0.30em] text-white/40 sm:text-[10px]"
            style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
          >
            ab
          </span>
          <span
            className="mt-1 text-[28px] font-light leading-none tracking-tight sm:text-[32px]"
            style={{
              background:
                "linear-gradient(155deg, #FFFFFF 0%, #F1ECFF 50%, var(--brand-line-bright) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              filter: featured
                ? "drop-shadow(0 0 16px var(--brand-glow-strong))"
                : "drop-shadow(0 0 10px var(--brand-glow-mid))",
            }}
          >
            {formatPriceFrom(tier.priceFrom)}
          </span>
        </div>

        {/* Trennlinie */}
        <span
          aria-hidden
          className="mt-5 h-px w-full"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.10), transparent)",
          }}
        />

        {/* Inherits-Label (z.B. "Alles aus Start, plus:") */}
        {tier.inheritsLabel && (
          <p
            className="mt-4 text-center text-[10.5px] font-medium uppercase tracking-[0.22em] sm:text-[11px]"
            style={{
              color: "var(--brand-line-mid)",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
            }}
          >
            {tier.inheritsLabel}
          </p>
        )}

        {/* Features-Liste */}
        <div className={`${tier.inheritsLabel ? "mt-3" : "mt-5"} flex-1`}>
          {!tier.inheritsLabel && (
            <p
              className="mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-white/40 sm:text-[11px]"
              style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
            >
              {tier.featuresLabel}
            </p>
          )}
          <ul className="space-y-2">
            {tier.features.map((f, i) => (
              <li
                key={i}
                className="flex items-start gap-2.5 text-[12px] leading-snug text-white/75 sm:text-[12.5px]"
              >
                <CheckMark featured={featured} />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ideal-für Footer */}
        <p className="mt-5 border-t border-white/[0.06] pt-4 text-center text-[11px] italic leading-snug text-white/45 sm:text-[11.5px]">
          {tier.idealFor}
        </p>
      </div>
    </motion.article>
  );
}

function CheckMark({ featured }: { featured: boolean }) {
  return (
    <span
      aria-hidden
      className="mt-[3px] inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: featured
          ? "linear-gradient(155deg, var(--brand-primary), var(--brand-accent))"
          : "rgba(255,255,255,0.06)",
        border: featured
          ? "1px solid color-mix(in srgb, var(--brand-line-bright) 60%, transparent)"
          : "1px solid var(--brand-card-border)",
        boxShadow: featured ? "0 0 8px var(--brand-glow-strong)" : "none",
      }}
    >
      <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
        <path
          d="M2 5l2 2 4-4"
          stroke={featured ? "#FFFFFF" : "var(--brand-line-bright)"}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function TierIconShell({
  icon,
  featured,
}: {
  icon: TierIconName;
  featured: boolean;
}) {
  return (
    <span
      aria-hidden
      className="relative inline-flex h-[58px] w-[58px] items-center justify-center rounded-2xl sm:h-[62px] sm:w-[62px]"
      style={{
        background: featured
          ? "linear-gradient(155deg, rgba(40,28,82,0.95), rgba(14,10,30,0.98))"
          : "linear-gradient(155deg, rgba(28,22,52,0.85), rgba(12,10,28,0.92))",
        border: featured
          ? "1px solid color-mix(in srgb, var(--brand-line-bright) 40%, transparent)"
          : "1px solid var(--brand-card-border)",
        boxShadow: featured
          ? "inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 18px rgba(0,0,0,0.45), 0 0 22px var(--brand-glow-strong)"
          : "inset 0 1px 0 rgba(255,255,255,0.06), 0 6px 14px rgba(0,0,0,0.35), 0 0 14px var(--brand-glow-mid)",
      }}
    >
      <TierIcon name={icon} />
      {/* Glas-Reflex oben */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-2 top-[2px] h-[40%] rounded-t-2xl"
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 100%)",
        }}
      />
    </span>
  );
}

function TierIcon({ name }: { name: TierIconName }) {
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "var(--brand-line-bright)",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "rocket":
      return (
        <svg {...common}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case "layers":
      return (
        <svg {...common}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    case "brain":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <circle cx="6" cy="6" r="1.6" />
          <circle cx="18" cy="6" r="1.6" />
          <circle cx="6" cy="18" r="1.6" />
          <circle cx="18" cy="18" r="1.6" />
          <line x1="9.6" y1="9.6" x2="7.1" y2="7.1" />
          <line x1="14.4" y1="9.6" x2="16.9" y2="7.1" />
          <line x1="9.6" y1="14.4" x2="7.1" y2="16.9" />
          <line x1="14.4" y1="14.4" x2="16.9" y2="16.9" />
        </svg>
      );
  }
}

/* ════════════════════════════════════════════════════════════════════
 *  SUPPORT TIERS — 3 monatliche Tarife
 *  ════════════════════════════════════════════════════════════════ */

function SupportTiersSection() {
  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <SectionDivider label="Betreuung & Weiterentwicklung" />
      <div className="grid w-full grid-cols-1 gap-4 sm:gap-5 md:grid-cols-3">
        {SUPPORT_TIERS.map((tier, i) => (
          <SupportCard key={tier.key} tier={tier} index={i} />
        ))}
      </div>
    </div>
  );
}

function SupportCard({ tier, index }: { tier: SupportTier; index: number }) {
  return (
    <motion.article
      {...fadeUp(0.06 + index * 0.06)}
      className="relative flex flex-col rounded-2xl p-5 sm:p-6"
      style={{
        background:
          "linear-gradient(180deg, rgba(16,12,30,0.85) 0%, rgba(8,6,20,0.90) 100%)",
        border: "1px solid var(--brand-card-border)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.04), 0 14px 28px rgba(0,0,0,0.38), 0 0 20px var(--brand-card-glow)",
      }}
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--brand-line-mid), transparent)",
        }}
      />

      <div className="flex items-center gap-3.5">
        <SupportIconShell icon={tier.icon} />
        <div>
          <h4
            className="text-[15px] font-medium text-white sm:text-[16px]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              letterSpacing: "-0.005em",
            }}
          >
            {tier.title}
          </h4>
          <p
            className="mt-0.5 text-[13.5px] font-light tracking-tight sm:text-[14.5px]"
            style={{
              background:
                "linear-gradient(155deg, #FFFFFF 0%, var(--brand-line-bright) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              WebkitTextFillColor: "transparent",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              filter: "drop-shadow(0 0 8px var(--brand-glow-mid))",
            }}
          >
            {tier.priceLabel}
          </p>
        </div>
      </div>

      <span
        aria-hidden
        className="mt-5 h-px w-full"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
        }}
      />

      <ul className="mt-5 space-y-2">
        {tier.features.map((f, i) => (
          <li
            key={i}
            className="flex items-start gap-2.5 text-[12.5px] leading-snug text-white/75 sm:text-[13px]"
          >
            <CheckMark featured={false} />
            <span>{f}</span>
          </li>
        ))}
      </ul>
    </motion.article>
  );
}

function SupportIconShell({ icon }: { icon: SupportIconName }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl"
      style={{
        background:
          "linear-gradient(155deg, rgba(28,22,52,0.85), rgba(12,10,28,0.92))",
        border: "1px solid var(--brand-card-border)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 12px rgba(0,0,0,0.30), 0 0 12px var(--brand-glow-mid)",
      }}
    >
      <SupportIcon name={icon} />
    </span>
  );
}

function SupportIcon({ name }: { name: SupportIconName }) {
  const common = {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "var(--brand-line-bright)",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "growth":
      return (
        <svg {...common}>
          <path d="M3 17l6-6 4 4 8-8" />
          <path d="M14 7h7v7" />
        </svg>
      );
    case "stack":
      return (
        <svg {...common}>
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
  }
}

/* ════════════════════════════════════════════════════════════════════
 *  WHY-SECTION — Andere vs. Wir + Premium-Keystone in der Mitte
 *  ════════════════════════════════════════════════════════════════ */

function WhySection() {
  return (
    <div className="flex flex-col gap-6 sm:gap-7">
      <SectionDivider label="Warum NEXCEL AI / AGI Works?" emphasized />

      <motion.div
        {...fadeUp(0.08)}
        className="relative grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-3"
        style={{
          background:
            "linear-gradient(180deg, rgba(16,12,30,0.78) 0%, rgba(8,6,20,0.86) 100%)",
          border: "1px solid var(--brand-card-border)",
          borderRadius: "20px",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.05), 0 22px 44px rgba(0,0,0,0.45), 0 0 32px var(--brand-card-glow)",
          padding: "clamp(20px, 3.5vh, 36px)",
        }}
      >
        {/* Left — Andere */}
        <WhyColumn
          eyebrow={WHY_DATA.othersTitle}
          items={WHY_DATA.others}
          variant="cross"
        />

        {/* Center — Premium-Keystone */}
        <div className="relative flex items-center justify-center py-2 lg:py-0">
          <BrandKeystoneVisual />
        </div>

        {/* Right — Wir entwickeln + Unser Ansatz */}
        <div className="flex flex-col gap-6">
          <WhyColumn
            eyebrow={WHY_DATA.weTitle}
            items={WHY_DATA.we}
            variant="check"
          />

          {/* Unser Ansatz Block */}
          <div
            className="rounded-xl p-4"
            style={{
              background:
                "linear-gradient(180deg, rgba(24,18,48,0.85) 0%, rgba(12,8,26,0.92) 100%)",
              border: "1px solid color-mix(in srgb, var(--brand-line-bright) 22%, transparent)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 18px var(--brand-glow-mid)",
            }}
          >
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.30em] sm:text-[10.5px]"
              style={{
                color: "var(--brand-line-bright)",
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                filter: "drop-shadow(0 0 6px var(--brand-glow-strong))",
              }}
            >
              {WHY_DATA.approachLabel}
            </p>
            <ul className="mt-3 space-y-1.5">
              {WHY_DATA.approach.map((a, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-[12.5px] leading-snug text-white/85"
                >
                  <span
                    aria-hidden
                    className="mt-[7px] inline-block h-[3px] w-[3px] shrink-0 rounded-full"
                    style={{
                      background: "var(--brand-line-bright)",
                      boxShadow: "0 0 4px var(--brand-glow-strong)",
                    }}
                  />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
            <p
              className="mt-3 border-t border-white/[0.08] pt-3 text-[12px] italic leading-snug text-white/65 sm:text-[12.5px]"
            >
              {WHY_DATA.approachClosing}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function WhyColumn({
  eyebrow,
  items,
  variant,
}: {
  eyebrow: string;
  items: string[];
  variant: "cross" | "check";
}) {
  return (
    <div>
      <p
        className="text-[10px] font-semibold uppercase tracking-[0.30em] text-white/55 sm:text-[10.5px]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
      >
        {eyebrow}
      </p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex items-center gap-2.5 text-[13px] leading-snug text-white/80 sm:text-[13.5px]"
          >
            {variant === "cross" ? <CrossMark /> : <CheckMark featured />}
            <span
              style={
                variant === "cross"
                  ? { color: "rgba(255,255,255,0.55)", textDecoration: "line-through", textDecorationColor: "rgba(255,255,255,0.20)" }
                  : undefined
              }
            >
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CrossMark() {
  return (
    <span
      aria-hidden
      className="inline-flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-full"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <svg width="7" height="7" viewBox="0 0 10 10" fill="none">
        <path
          d="M2 2l6 6M8 2l-6 6"
          stroke="rgba(255,255,255,0.45)"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}

/* ─────────────────────────────────────────────────────────────────────
 *  BRAND KEYSTONE VISUAL — isometrisches Premium-3D-Element
 *  ─────────────────────────────────────────────────────────────── */

function BrandKeystoneVisual() {
  // Stabile (server- und client-deterministische) Sparkle-Positionen
  const sparkles = useMemo(
    () =>
      Array.from({ length: 6 }).map((_, i) => ({
        x: 14 + ((i * 47) % 70),
        y: 18 + ((i * 61) % 60),
        size: 1.6 + (i % 3) * 0.6,
        delay: (i % 5) * 0.35,
      })),
    []
  );

  return (
    <motion.div
      className="relative"
      style={{ width: "clamp(180px, 22vh, 220px)", height: "clamp(200px, 24vh, 240px)" }}
      animate={{ y: [0, -4, 0, 3, 0] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    >
      {/* Aura */}
      <span
        aria-hidden
        className="absolute inset-[-30%] rounded-full"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, var(--brand-glow-strong) 0%, var(--brand-glow-mid) 38%, transparent 75%)",
          filter: "blur(30px)",
          opacity: 0.85,
        }}
      />

      {/* Floor-Reflex */}
      <span
        aria-hidden
        className="absolute inset-x-6 bottom-0 h-3 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse 50% 100% at 50% 50%, var(--brand-glow-strong) 0%, transparent 70%)",
          filter: "blur(8px)",
          opacity: 0.5,
        }}
      />

      <svg
        aria-hidden
        viewBox="0 0 200 220"
        className="relative h-full w-full"
      >
        <defs>
          {/* Top-Face (am hellsten) */}
          <linearGradient id="key-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="50%"  stopColor="var(--brand-line-bright)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--brand-line-mid)" stopOpacity="0.30" />
          </linearGradient>
          {/* Front-Left Face */}
          <linearGradient id="key-left" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(34,24,68,0.96)" />
            <stop offset="55%"  stopColor="rgba(18,14,42,0.97)" />
            <stop offset="100%" stopColor="rgba(8,6,22,0.99)" />
          </linearGradient>
          {/* Front-Right Face (etwas dunkler für Tiefe) */}
          <linearGradient id="key-right" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="rgba(26,18,54,0.96)" />
            <stop offset="55%"  stopColor="rgba(14,10,32,0.98)" />
            <stop offset="100%" stopColor="rgba(6,4,18,0.99)" />
          </linearGradient>
          {/* Edge-Stroke */}
          <linearGradient id="key-edge" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="var(--brand-line-bright)" stopOpacity="0.45" />
          </linearGradient>
          {/* Top-Glow innen */}
          <radialGradient id="key-topGlow" cx="0.5" cy="0.5" r="0.6">
            <stop offset="0%"   stopColor="var(--brand-line-bright)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--brand-line-bright)" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* === Geometrie: Isometrisches Hexagon-Prisma ===
            Top-Hex-Vertices (cy=70, depth=24, width=58):
              N  = (100,  46)     // top-north
              NE = (158,  70)     // top-northeast
              SE = (158, 118)     // bottom-southeast (front)
              S  = (100, 142)     // bottom-south
              SW = ( 42, 118)     // bottom-southwest (front)
              NW = ( 42,  70)     // top-northwest
            Extrusion 56 Einheiten nach unten für Front-Faces:
              B_SE = (158, 174)
              B_S  = (100, 198)
              B_SW = ( 42, 174)
        */}

        {/* Top-Hex (Hauptfläche) */}
        <path
          d="M 100,46 L 158,70 L 158,118 L 100,142 L 42,118 L 42,70 Z"
          fill="url(#key-top)"
          stroke="url(#key-edge)"
          strokeWidth="1.0"
        />
        {/* Top-Glow (innerer Kern) */}
        <circle cx="100" cy="94" r="42" fill="url(#key-topGlow)" />

        {/* Front-Right Face (von S nach SE nach B_SE nach B_S) */}
        <path
          d="M 100,142 L 158,118 L 158,174 L 100,198 Z"
          fill="url(#key-right)"
          stroke="url(#key-edge)"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />
        {/* Front-Left Face (von SW nach S nach B_S nach B_SW) */}
        <path
          d="M 42,118 L 100,142 L 100,198 L 42,174 Z"
          fill="url(#key-left)"
          stroke="url(#key-edge)"
          strokeWidth="0.8"
          strokeOpacity="0.6"
        />

        {/* Hervorgehobene Vorder-Kante (S → B_S) */}
        <line
          x1="100" y1="142" x2="100" y2="198"
          stroke="var(--brand-line-bright)"
          strokeWidth="0.9"
          opacity="0.85"
        />

        {/* Innere Hex-Reflektion auf der Oberfläche (verkleinerte konzentrische Hex) */}
        <path
          d="M 100,60 L 144,78 L 144,114 L 100,132 L 56,114 L 56,78 Z"
          fill="none"
          stroke="var(--brand-line-bright)"
          strokeWidth="0.4"
          strokeOpacity="0.55"
        />
        <path
          d="M 100,76 L 128,87 L 128,107 L 100,118 L 72,107 L 72,87 Z"
          fill="none"
          stroke="var(--brand-line-bright)"
          strokeWidth="0.35"
          strokeOpacity="0.30"
        />

        {/* Zentrum: stilisiertes Mark ("◆") als Premium-Akzent */}
        <g transform="translate(100 96)">
          <path
            d="M 0,-8 L 8,0 L 0,8 L -8,0 Z"
            fill="var(--brand-line-bright)"
            opacity="0.95"
            style={{ filter: "drop-shadow(0 0 6px var(--brand-glow-strong))" }}
          />
          <path
            d="M 0,-4 L 4,0 L 0,4 L -4,0 Z"
            fill="#FFFFFF"
            opacity="0.85"
          />
        </g>

        {/* Mikro-Sparkles innerhalb der Top-Fläche */}
        {sparkles.map((s, i) => (
          <circle
            key={i}
            cx={50 + s.x}
            cy={60 + s.y}
            r={s.size * 0.5}
            fill="#FFFFFF"
            opacity={0.55}
          >
            <animate
              attributeName="opacity"
              values="0.15;0.85;0.15"
              dur="3.2s"
              begin={`${s.delay}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

        {/* Vorder-Vertices als kleine Brillant-Knoten */}
        {[
          [100, 142],
          [158, 118],
          [42, 118],
          [100, 198],
          [158, 174],
          [42, 174],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="1.4"
            fill="var(--brand-line-bright)"
            style={{ filter: "drop-shadow(0 0 4px var(--brand-glow-strong))" }}
          />
        ))}

        {/* Top-Vertices */}
        {[
          [100, 46],
          [158, 70],
          [42, 70],
        ].map(([x, y], i) => (
          <circle
            key={`t-${i}`}
            cx={x}
            cy={y}
            r="1.6"
            fill="#FFFFFF"
            style={{ filter: "drop-shadow(0 0 5px var(--brand-glow-strong))" }}
          />
        ))}
      </svg>

      {/* Untertitel-Caption */}
      <div className="absolute inset-x-0 -bottom-2 flex flex-col items-center">
        <span
          className="text-[9px] font-medium uppercase tracking-[0.36em] text-white/40 sm:text-[9.5px]"
          style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
        >
          NEXCEL × AGI Works
        </span>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  BOTTOM BENEFITS — 4 Closing-Items
 *  ════════════════════════════════════════════════════════════════ */

function BottomBenefitsRow() {
  return (
    <div className="grid w-full grid-cols-2 gap-4 sm:gap-5 md:grid-cols-4">
      {BOTTOM_BENEFITS.map((b, i) => (
        <BenefitItem key={b.title} benefit={b} index={i} />
      ))}
    </div>
  );
}

function BenefitItem({ benefit, index }: { benefit: Benefit; index: number }) {
  return (
    <motion.div
      {...fadeUp(0.05 + index * 0.05)}
      className="flex items-start gap-3.5"
    >
      <BenefitIconShell icon={benefit.icon} />
      <div className="flex-1">
        <p
          className="text-[13px] font-medium leading-tight text-white sm:text-[14px]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            letterSpacing: "-0.005em",
          }}
        >
          {benefit.title}
        </p>
        <p className="mt-1 text-[11.5px] font-light leading-snug text-white/50 sm:text-[12px]">
          {benefit.subtitle}
        </p>
      </div>
    </motion.div>
  );
}

function BenefitIconShell({ icon }: { icon: BenefitIconName }) {
  return (
    <span
      aria-hidden
      className="inline-flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-xl"
      style={{
        background:
          "linear-gradient(155deg, rgba(28,22,52,0.85), rgba(12,10,28,0.92))",
        border: "1px solid var(--brand-card-border)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 4px 10px rgba(0,0,0,0.30), 0 0 10px var(--brand-glow-mid)",
      }}
    >
      <BenefitIcon name={icon} />
    </span>
  );
}

function BenefitIcon({ name }: { name: BenefitIconName }) {
  const common = {
    width: 16,
    height: 16,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "var(--brand-line-bright)",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "rocket":
      return (
        <svg {...common}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </svg>
      );
    case "target":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="1.5" fill="var(--brand-line-bright)" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
      );
    case "chart":
      return (
        <svg {...common}>
          <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
        </svg>
      );
  }
}

/* ════════════════════════════════════════════════════════════════════
 *  SECTION DIVIDER — kleine Caption-Linie
 *  ════════════════════════════════════════════════════════════════ */

function SectionDivider({
  label,
  emphasized = false,
}: {
  label: string;
  emphasized?: boolean;
}) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-4">
      <span
        aria-hidden
        className="h-px max-w-[200px] flex-1"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--brand-line-mid) 100%)",
          opacity: 0.7,
        }}
      />
      <span
        aria-hidden
        className="inline-block h-[5px] w-[5px] rounded-full"
        style={{
          background: emphasized ? "var(--brand-line-bright)" : "var(--brand-line-mid)",
          boxShadow: emphasized ? "0 0 8px var(--brand-glow-strong)" : "none",
        }}
      />
      <span
        className="text-[10px] font-semibold uppercase tracking-[0.36em] sm:text-[10.5px]"
        style={{
          color: emphasized ? "var(--brand-line-bright)" : "var(--brand-line-mid)",
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          filter: emphasized ? "drop-shadow(0 0 6px var(--brand-glow-strong))" : undefined,
        }}
      >
        {label}
      </span>
      <span
        aria-hidden
        className="inline-block h-[5px] w-[5px] rounded-full"
        style={{
          background: emphasized ? "var(--brand-line-bright)" : "var(--brand-line-mid)",
          boxShadow: emphasized ? "0 0 8px var(--brand-glow-strong)" : "none",
        }}
      />
      <span
        aria-hidden
        className="h-px max-w-[200px] flex-1"
        style={{
          background:
            "linear-gradient(90deg, var(--brand-line-mid) 0%, transparent 100%)",
          opacity: 0.7,
        }}
      />
    </div>
  );
}
