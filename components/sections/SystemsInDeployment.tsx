"use client";

import {
  motion,
  AnimatePresence,
  animate,
  useInView,
  useMotionValue,
  useTransform,
} from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";

/**
 * Systeme im Einsatz — Section 4
 * ────────────────────────────────────────────────────────────────
 *  Mobile-first, hochwertig, ruhig.
 *  Wirkt wie: „echte operative Systeme im Einsatz".
 *  Inspiration: Stripe / Linear / Apple Internal / Raycast.
 */

type CategoryKey =
  | "alle"
  | "ki"
  | "webseiten"
  | "crm"
  | "recruiting"
  | "immobilien"
  | "automation"
  | "pflege"
  | "events"
  | "beauty";

type StatusKind = "live" | "in-entwicklung" | "intern";

interface SystemCase {
  key: string;
  title: string;
  status: StatusKind;
  /** Sehr kurzer Satz — wird direkt auf der Card angezeigt */
  shortDescription: string;
  /** Längerer Beschreibungstext, der im Detail-Modal erscheint */
  longDescription: string;
  /** Kurze Marken-Kategorien (Anzeige als Pills auf der Card) */
  tags: string[];
  /** Detailliertes Feature-Set — nur im Detail-Modal sichtbar */
  features: string[];
  /** Optionaler Live-Link zum System */
  website?: string;
  /** Filter-Kategorien (für Filter-Logik, nicht direkt sichtbar) */
  categories: CategoryKey[];
  /** Echter Screenshot, wenn vorhanden — überschreibt Mockup-Andeutung */
  imageSrc?: string;
  /** object-fit für das Image */
  imageFit?: "cover" | "contain";
  /** Visueller Variant für Mockup-Hintergrund + Border-Glow-Akzent */
  variant: "violet" | "deep" | "mint" | "amber" | "carbon" | "azure";
}

const FILTERS: { key: CategoryKey; label: string }[] = [
  { key: "alle", label: "Alle" },
  { key: "ki", label: "KI-Systeme" },
  { key: "immobilien", label: "Immobilien" },
  { key: "crm", label: "CRM" },
  { key: "beauty", label: "Beauty" },
  { key: "pflege", label: "Pflege" },
  { key: "events", label: "Events" },
  { key: "automation", label: "Automation" },
];

const SYSTEMS: SystemCase[] = [
  {
    key: "weissleder",
    title: "Immobilien Weissleder",
    status: "live",
    shortDescription:
      "Digitale Immobilienplattform mit Verwaltung, Bewertungen und CRM.",
    longDescription:
      "Operatives System für Hausverwaltung und Immobilienvermittlung. Objekte werden eingestellt, Bewertungen angefragt, Anfragen automatisiert geroutet. Regionale SEO sorgt dafür, dass die Plattform auch außerhalb der Region gefunden wird — Leads landen direkt im integrierten CRM.",
    tags: ["Immobilienplattform", "CRM", "Verwaltung"],
    features: [
      "Immobilien hochladen & verwalten",
      "Bewertungen anfragen",
      "Kontaktverwaltung",
      "Mängelmeldungen",
      "Hausverwaltung",
      "Lead-Automation",
      "Regionale SEO-Optimierung",
    ],
    website: "https://www.weissleder-immobilien.de/",
    categories: ["immobilien", "crm", "automation", "webseiten"],
    variant: "amber",
    imageSrc: "/screenshots/immobilien-weissleder.png",
    imageFit: "cover",
  },
  {
    key: "cannabbros",
    title: "CANNABBROS",
    status: "live",
    shortDescription:
      "Cannabis-Club-Plattform mit Mitgliederbereich, Token-System und Automation.",
    longDescription:
      "Digitales Club-System statt klassischer Shop. Mitglieder verwalten ihren Account, buchen Abholtermine, sammeln Token und erhalten automatisierte Benachrichtigungen. Im Hintergrund laufen Dokumentenmanagement, Grow-Tracking und Compliance-Prozesse vollautomatisch.",
    tags: ["Community", "Mitgliederplattform", "Automation"],
    features: [
      "Mitgliederverwaltung",
      "Eigenes Token-System",
      "Terminbuchung für Abholung",
      "Automatische Benachrichtigungen",
      "Community-Funktionen",
      "Dokumentenmanagement",
      "Grow-Tracking",
      "Automatisierte Abläufe",
    ],
    website: "https://www.cannabbros-csc.de/",
    categories: ["automation", "crm", "webseiten"],
    variant: "deep",
    imageSrc: "/screenshots/cannabbros.png",
    imageFit: "cover",
  },
  {
    key: "impuls-pflege",
    title: "Impuls Pflege",
    status: "live",
    shortDescription:
      "Digitale Pflegeplattform mit Bewerbermanagement und CRM.",
    longDescription:
      "Pflegedienste digitalisieren ihren operativen Alltag: Bewerbungen werden vorqualifiziert, Kontaktanfragen automatisch geroutet, alle Leads laufen ins integrierte CRM. Verwaltungsdashboard, automatisierte Prozesse und eine moderne digitale Präsenz auf einer Plattform.",
    tags: ["Pflege", "Bewerbermanagement", "CRM"],
    features: [
      "Bewerbungen & Recruiting",
      "Kontaktanfragen",
      "CRM-System",
      "Leadverwaltung",
      "Verwaltungsdashboard",
      "Automatisierte Prozesse",
      "Digitale Internetpräsenz",
    ],
    website: "https://www.impuls-unna.de/",
    categories: ["pflege", "recruiting", "crm", "automation", "webseiten"],
    variant: "mint",
    imageSrc: "/screenshots/impuls-pflege.png",
    imageFit: "cover",
  },
  {
    key: "borne-run",
    title: "Born to Run",
    status: "live",
    shortDescription:
      "Ultra-Endurance-Eventplattform mit Live-Daten und Teilnehmerverwaltung.",
    longDescription:
      "Eventinfrastruktur für den 48-Stunden-Spendenlauf im Bornekamp Unna. Teilnehmer registrieren sich digital, Veranstalter steuern Strecken, Musik und Live-Daten zentral — inklusive offener Deutscher Meisterschaft im 48h-Lauf. Live-Tracking ist die nächste Ausbaustufe.",
    tags: ["Event", "Tracking", "Live-System"],
    features: [
      "Teilnehmerregistrierung",
      "Live-Anzeige",
      "Streckenübersicht",
      "Musiksteuerung",
      "Eventdaten in Echtzeit",
      "Live-Tracking (Roadmap)",
    ],
    website: "https://www.borne-run.de/",
    categories: ["events", "automation", "crm", "webseiten"],
    variant: "carbon",
    imageSrc: "/screenshots/borne-run.png",
    imageFit: "cover",
  },
  {
    key: "beautybar",
    title: "Beauty Bar Unna",
    status: "live",
    shortDescription:
      "Beauty-Plattform mit Terminbuchung und eigenem Admin-Panel.",
    longDescription:
      "Eigene Webseite mit integriertem Buchungssystem — keine externen Plattformkosten. Kalender, Leistungen und Preise pflegt das Studio selbst über das Admin-Panel. Automatisierte Bestätigungen und CRM-Anbindung sind direkt eingebaut.",
    tags: ["Terminbuchung", "CRM", "Admin-System"],
    features: [
      "Online-Terminbuchung",
      "Automatische Nachrichten",
      "Kalendersteuerung",
      "Leistungen selbst verwalten",
      "Preise selbst bearbeiten",
      "CRM-Anbindung",
      "Keine externen Plattformkosten",
    ],
    website: "https://www.beautybar-unna.de/",
    categories: ["beauty", "webseiten", "crm", "automation"],
    variant: "carbon",
    imageSrc: "/screenshots/beautybar.png",
    imageFit: "cover",
  },
  {
    key: "lulus-beauty",
    title: "Lulus Beauty",
    status: "live",
    shortDescription:
      "Luxus-Wimpernstudio mit Online-Terminbuchung und automatisierten Prozessen.",
    longDescription:
      "Premium-Webauftritt für ein Wimpern- und Beauty-Studio. Voll integrierte Terminbuchung, eigene Verwaltung von Leistungen, Preisen und Kalender. Kundenkommunikation läuft automatisiert — vom Bestätigungs-Flow bis zur Erinnerung.",
    tags: ["Beauty", "Terminbuchung", "Verwaltung"],
    features: [
      "Online-Terminbuchung",
      "Leistungsverwaltung",
      "Preisverwaltung",
      "Kalendersteuerung",
      "Automatisierte Kommunikation",
      "Admin-Panel",
    ],
    website: "https://www.lulusbeauty.de/",
    categories: ["beauty", "webseiten", "crm", "automation"],
    variant: "violet",
    imageSrc: "/screenshots/lulus-beauty.png",
    imageFit: "cover",
  },
  {
    key: "immostripe-ai",
    title: "Immostripe AI",
    status: "in-entwicklung",
    shortDescription:
      "Intelligentes Hausverwaltungs- und Immobilienmanagement-System.",
    longDescription:
      "Operative Plattform für moderne Hausverwaltungen. Mängelmeldungen via QR-Codes, automatisierte Wartungstickets, digitale Dokumentenverwaltung und gesteuertes Putzkraft-Management — alles in einem System statt in Tabellen.",
    tags: ["Hausverwaltung", "KI", "Automatisierung"],
    features: [
      "Mängelmeldungen",
      "Dokumentenverwaltung",
      "Wartungsmanagement",
      "QR-Code-Systeme",
      "Putzkraft-Management",
      "Automatisierungen",
      "Operative Verwaltung",
    ],
    categories: ["immobilien", "ki", "automation"],
    variant: "azure",
  },
  {
    key: "immostripe",
    title: "Immostripe",
    status: "in-entwicklung",
    shortDescription:
      "KI-gestützte Immobiliensuche für intelligentere Entscheidungen.",
    longDescription:
      "KI-Suchsystem für den Immobilienmarkt: personalisierte Ergebnisse, datenbasierte Qualitätsbewertung und intelligente Filterung. Statt Bauchgefühl liefert die Plattform fundierte, vergleichbare Entscheidungsgrundlagen.",
    tags: ["KI", "Immobiliensuche", "Analyse"],
    features: [
      "Intelligente Immobiliensuche",
      "Personalisierte Ergebnisse",
      "Analyse statt Bauchgefühl",
      "Qualitätsbewertung",
      "Datenbasierte Entscheidungen",
      "Intelligente Filterung",
    ],
    categories: ["immobilien", "ki", "automation"],
    variant: "violet",
  },
];

const STATS = [
  { value: "25+", label: "Systeme entwickelt" },
  { value: "100%", label: "Kundenzufriedenheit" },
  { value: "100%", label: "Individuell gebaut" },
];

/* ════════════════════════════════════════════════════════════════════
 *  MAIN SECTION
 *  ════════════════════════════════════════════════════════════════ */
export default function SystemsInDeployment() {
  const [openSystem, setOpenSystem] = useState<SystemCase | null>(null);

  // In-Entwicklung-Cases dürfen NIE im Detail-Modal landen — schützt unsere
  // Roadmap-Konzepte. Jeder Open-Request wird auf live-only gefiltert.
  const openSystemSafe = useCallback((s: SystemCase | null) => {
    if (s && s.status !== "live") return;
    setOpenSystem(s);
  }, []);

  // Body-Scroll-Lock + Navigation-Hide, solange das Detail-Modal offen ist.
  // → Setzt data-modal-open auf <html>, globals.css blendet daraufhin die
  //   gesamte fixe Navigation aus → das Modal ist niemals abgeschnitten.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const prevOverflow = document.body.style.overflow;
    if (openSystem) {
      document.body.style.overflow = "hidden";
      root.setAttribute("data-modal-open", "true");
    } else {
      document.body.style.overflow = prevOverflow || "";
      root.removeAttribute("data-modal-open");
    }
    return () => {
      document.body.style.overflow = prevOverflow || "";
      root.removeAttribute("data-modal-open");
    };
  }, [openSystem]);

  // ESC schließt das Modal
  useEffect(() => {
    if (!openSystem) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSystem(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSystem]);

  return (
    <section
      aria-labelledby="systems-in-deployment-headline"
      className="relative isolate overflow-x-clip"
      style={{
        background:
          "linear-gradient(180deg, var(--brand-bg-mid) 0%, color-mix(in srgb, var(--brand-bg-mid) 80%, var(--brand-bg-top)) 30%, var(--brand-bg-mid) 70%, var(--brand-bg-top) 100%)",
      }}
    >
      <SectionBackdrop />

      <div className="relative mx-auto w-full max-w-[1280px] px-5 pt-14 pb-20 sm:px-8 sm:pt-16 sm:pb-24 lg:pt-20 lg:pb-28">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-16">
          {/* LINKE SPALTE — sticky auf Desktop */}
          <div className="lg:sticky lg:top-[clamp(96px,12vh,140px)] lg:self-start">
            <SectionHeader />
            <StatsBlock />
          </div>

          {/* RECHTE SPALTE — High-End Snap-Slider (alle Systeme) */}
          <div className="relative min-w-0 overflow-visible">
            <SystemsSlider systems={SYSTEMS} onOpen={openSystemSafe} />
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <FooterBar />

      {/* Detail-Modal — öffnet beim Klick auf eine Card */}
      <SystemDetailModal
        system={openSystem}
        onClose={() => setOpenSystem(null)}
      />
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  BACKDROP
 *  ════════════════════════════════════════════════════════════════ */
function SectionBackdrop() {
  return (
    <>
      {/* Top bridge — matched mit Section-3-Bottom */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[28vh]"
        style={{
          background:
            "linear-gradient(180deg, var(--brand-plateau-4) 0%, var(--brand-plateau-2) 40%, var(--brand-plateau-1) 75%, transparent 100%)",
          maskImage:
            "linear-gradient(180deg, #000 0%, #000 60%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(180deg, #000 0%, #000 60%, transparent 100%)",
        }}
      />

      {/* Faint grid */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.16]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)
          `,
          backgroundSize: "140px 140px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #000 10%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, #000 10%, transparent 85%)",
        }}
      />

      {/* Locale violet glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 30% 24% at 16% 20%, var(--brand-glow-mid) 0%, transparent 70%),
            radial-gradient(ellipse 28% 22% at 86% 32%, var(--brand-glow-soft) 0%, transparent 70%),
            radial-gradient(ellipse 36% 28% at 50% 78%, var(--brand-glow-mid) 0%, transparent 75%)
          `,
        }}
      />

      {/* Noise / Particles */}
      <DriftingParticles />
    </>
  );
}

function DriftingParticles() {
  const dots = [
    { x: 18, y: 22, d: 0 },
    { x: 78, y: 16, d: 1.2 },
    { x: 62, y: 64, d: 2.4 },
    { x: 30, y: 70, d: 0.6 },
    { x: 86, y: 78, d: 1.8 },
    { x: 12, y: 50, d: 2.0 },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {dots.map((d, i) => (
        <motion.span
          key={i}
          className="absolute h-[3px] w-[3px] rounded-full"
          style={{
            left: `${d.x}%`,
            top: `${d.y}%`,
            background: "var(--brand-line-mid)",
            boxShadow: "0 0 8px var(--brand-glow-strong)",
          }}
          animate={{
            opacity: [0.14, 0.42, 0.14],
            scale: [0.9, 1.1, 0.9],
          }}
          transition={{
            duration: 6.2 + (i % 3),
            delay: d.d,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  TOP MARKER — small arrow at top
 *  ════════════════════════════════════════════════════════════════ */
function TopMarker() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-[40px] z-[2] flex justify-center sm:top-[48px]">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center"
      >
        <span
          aria-hidden
          className="h-px w-[140px] sm:w-[200px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--brand-line-mid) 50%, transparent 100%)",
          }}
        />
        <span
          className="relative -mx-2 flex h-7 w-7 items-center justify-center rounded-full sm:h-8 sm:w-8"
          style={{
            background:
              "linear-gradient(180deg, rgba(28,22,52,0.95) 0%, rgba(14,10,30,0.95) 100%)",
            border: "1px solid var(--brand-line-mid)",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.10), 0 8px 22px rgba(0,0,0,0.55), 0 0 18px var(--brand-glow-strong)",
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 9l6 7 6-7"
              fill="none"
              stroke="var(--brand-line-bright)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span
          aria-hidden
          className="h-px w-[140px] sm:w-[200px]"
          style={{
            background:
              "linear-gradient(90deg, transparent 0%, var(--brand-line-mid) 50%, transparent 100%)",
          }}
        />
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  HEADER (LEFT COLUMN)
 *  ════════════════════════════════════════════════════════════════ */
function SectionHeader() {
  return (
    <div>
      {/* Eyebrow */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center gap-2"
      >
        <motion.span
          aria-hidden
          className="inline-block h-1.5 w-1.5 rounded-full"
          animate={{
            opacity: [0.55, 1, 0.55],
            boxShadow: [
              "0 0 0 0 var(--brand-pill-active-glow)",
              "0 0 0 5px transparent",
              "0 0 0 0 var(--brand-pill-active-glow)",
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ background: "var(--brand-primary)" }}
        />
        <span
          id="systems-in-deployment-headline"
          className="text-[10.5px] font-medium uppercase tracking-[0.32em] sm:text-[11.5px]"
          style={{
            color: "var(--brand-line-mid)",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
          }}
        >
          Unsere Projekte
        </span>
      </motion.div>

      {/* Headline */}
      <motion.h2
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
        className="mt-5 text-[2.2rem] leading-[1.05] text-white sm:mt-6 sm:text-[2.8rem] lg:text-[3.2rem]"
        style={{
          fontFamily: "var(--font-headline), system-ui, sans-serif",
          fontWeight: 300,
          letterSpacing: "-0.035em",
        }}
      >
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
          Reale
        </span>{" "}
        Systeme.
        <br />
        Für reale Unternehmen.
      </motion.h2>

      {/* Subtext */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1], delay: 0.18 }}
        className="mt-5 max-w-[440px] text-[14.5px] leading-[1.65] text-white/60 sm:text-[15.5px]"
      >
        <p className="text-white/72">
          Keine Templates. Keine Standardlösungen.
        </p>
        <p className="mt-3">
          Wir entwickeln individuelle KI- und Unternehmenssysteme für Prozesse,
          Vertrieb, Automatisierung und operative Skalierung.
        </p>
      </motion.div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  FILTER ROW
 *  ════════════════════════════════════════════════════════════════ */
function FilterRow({
  active,
  onChange,
}: {
  active: CategoryKey;
  onChange: (k: CategoryKey) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: 0.26 }}
      className="mt-8 sm:mt-10"
    >
      {/* Mobile: scroll-snap row with edge gradient mask */}
      <div className="-mx-5 px-5 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0">
        <div
          className="flex gap-2 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-wrap lg:overflow-visible"
          style={{
            scrollbarWidth: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {FILTERS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              isActive={active === f.key}
              onClick={() => onChange(f.key)}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function FilterChip({
  label,
  isActive,
  onClick,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className="relative shrink-0 transition-all"
      style={{
        fontFamily: "var(--font-headline), system-ui, sans-serif",
      }}
    >
      <span
        className="relative inline-flex h-[34px] items-center rounded-full px-[14px] text-[12.5px] font-medium sm:h-[38px] sm:px-[16px] sm:text-[13px]"
        style={
          isActive
            ? {
                color: "rgba(255,255,255,0.98)",
                background:
                  "linear-gradient(160deg, var(--brand-pill-active) 0%, color-mix(in srgb, var(--brand-pill-active) 70%, #000) 100%)",
                border: "1px solid var(--brand-line-mid)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.12), 0 6px 18px var(--brand-glow-mid), 0 0 24px var(--brand-pill-active-glow)",
              }
            : {
                color: "rgba(255,255,255,0.72)",
                background:
                  "linear-gradient(180deg, rgba(22,18,38,0.65) 0%, rgba(12,10,24,0.65) 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }
        }
      >
        {label}
      </span>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  STATS BLOCK — Editorial / Premium / Schlicht
 *  • Kein Container, keine Border, keine Icons
 *  • Nur große, ruhige Typografie
 *  • Eine einzige atmosphärische Aura im Hintergrund
 *  • Zwei haarfeine Trennlinien zwischen den drei Werten
 *  • Animated count-up beim Eintritt — sehr dezent
 *  • Brand-aware (NEXCEL violet ↔ AGI Works cyan)
 *  ════════════════════════════════════════════════════════════════ */
function StatsBlock() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px -10% 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="relative mt-16 sm:mt-20"
    >
      {/* Atmospheric backlight — sehr soft, definiert ihren Raum ohne Rand */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[180%] w-[110%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 50%, var(--brand-glow-soft) 0%, transparent 70%)",
          filter: "blur(32px)",
        }}
      />

      <div className="relative mx-auto grid w-full grid-cols-3 gap-2 sm:gap-4">
        {STATS.map((s, i) => (
          <StatItem
            key={s.label}
            stat={s}
            inView={inView}
            index={i}
            showDivider={i > 0}
          />
        ))}
      </div>
    </motion.div>
  );
}

function StatItem({
  stat,
  inView,
  index,
  showDivider,
}: {
  stat: (typeof STATS)[number];
  inView: boolean;
  index: number;
  showDivider: boolean;
}) {
  // Parse "25+", "100%", … in Zahl + Suffix
  const target = parseInt(stat.value, 10) || 0;
  const suffix = stat.value.replace(/[0-9]/g, "");

  const count = useMotionValue(0);
  const displayText = useTransform(count, (v) => `${Math.round(v)}${suffix}`);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(count, target, {
      duration: 1.8,
      delay: 0.35 + index * 0.12,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, target, count, index]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{
        duration: 0.95,
        delay: 0.3 + index * 0.12,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="relative flex min-w-0 flex-col items-center px-0.5 text-center sm:px-1"
    >
      {/* Ultra-feine Trennlinie zwischen den Stats */}
      {showDivider && (
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-1/2 h-[72%] w-px -translate-y-1/2"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.08) 30%, var(--brand-line-mid) 50%, rgba(255,255,255,0.08) 70%, transparent 100%)",
            opacity: 0.45,
          }}
        />
      )}

      {/* Wert — feste Höhe, alle drei auf derselben Baseline */}
      <div className="flex h-[28px] w-full items-end justify-center sm:h-[32px] lg:h-[34px]">
        <motion.span
          className="block whitespace-nowrap text-[22px] leading-none tracking-[-0.03em] tabular-nums sm:text-[26px] lg:text-[28px]"
          style={{
            background: "var(--brand-headline-gradient)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            color: "transparent",
            WebkitTextFillColor: "transparent",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            fontWeight: 400,
          }}
        >
          {displayText}
        </motion.span>
      </div>

      {/* Label — feste Min-Höhe, alle auf gleicher Unterkante */}
      <div
        className="mt-2.5 flex min-h-[2.4em] w-full items-start justify-center sm:mt-3"
      >
        <span
          className="max-w-[9.5rem] text-[8px] uppercase leading-[1.45] text-white/42 sm:max-w-none sm:text-[9px] sm:leading-[1.4]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            letterSpacing: "0.14em",
            fontWeight: 400,
          }}
        >
          {stat.label}
        </span>
      </div>
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  SYSTEMS SLIDER — horizontaler Snap-Scroller (high-end)
 *  Ersetzt das alte vertikale Card-Grid. Reduziert Scroll-Tiefe massiv.
 *
 *  Features:
 *    • Native scroll-snap (mandatory) — gleicher UX-Standard wie iOS App Store
 *    • Smooth horizontal scroll mit Snap-Targets pro Card
 *    • Premium Prev/Next-Buttons (glassmorph, disabled-state, glow on hover)
 *    • Progress-Dots — eine Position pro Card, aktive = glowing violet
 *    • Keine Edge-Mask — Cards werden nie visuell abgeschnitten
 *    • Eine volle Card pro Viewport-Snap — kein Peek-Cut-off
 *    • Keyboard support: ← / → bewegen den Slider
 *    • Scrollbar versteckt, aber a11y-friendly (role=region + aria-label)
 *  ════════════════════════════════════════════════════════════════ */
function SystemsSlider({
  systems,
  onOpen,
}: {
  systems: SystemCase[];
  onOpen: (system: SystemCase) => void;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const measureStep = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return 0;
    const first = el.querySelector<HTMLElement>("[data-slide]");
    if (!first) return el.clientWidth;
    const gap =
      parseFloat(getComputedStyle(el).columnGap || getComputedStyle(el).gap || "24") ||
      24;
    return first.offsetWidth + gap;
  }, []);

  const updateEdgeState = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth - 1;
    setCanPrev(el.scrollLeft > 2);
    setCanNext(el.scrollLeft < max);

    const step = measureStep();
    if (step > 0) {
      const idx = Math.round(el.scrollLeft / step);
      setActiveIndex(Math.min(Math.max(idx, 0), systems.length - 1));
    }
  }, [measureStep, systems.length]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    updateEdgeState();
    const onScroll = () => updateEdgeState();
    const onResize = () => updateEdgeState();
    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, [updateEdgeState, systems.length]);

  /** Beim Filter-Wechsel: zurück auf Anfang scrollen. */
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: 0, behavior: "smooth" });
    setActiveIndex(0);
  }, [systems]);

  const scrollByStep = useCallback(
    (dir: 1 | -1) => {
      const el = scrollerRef.current;
      if (!el) return;
      const step = measureStep();
      el.scrollBy({ left: dir * step, behavior: "smooth" });
    },
    [measureStep]
  );

  const scrollToIndex = useCallback(
    (idx: number) => {
      const el = scrollerRef.current;
      if (!el) return;
      const step = measureStep();
      el.scrollTo({ left: idx * step, behavior: "smooth" });
    },
    [measureStep]
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        scrollByStep(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        scrollByStep(-1);
      }
    },
    [scrollByStep]
  );

  if (systems.length === 0) {
    return (
      <div
        className="rounded-2xl border border-white/10 px-6 py-10 text-center text-[13px] text-white/55"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,18,32,0.65), rgba(10,8,18,0.65))",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        Keine Systeme in dieser Kategorie. Bald mehr.
      </div>
    );
  }

  return (
    <div className="relative">
      {/* ── Control-Reihe oben: nur noch Pfeile, rechtsbündig ────────────── */}
      <div className="mb-4 flex items-center justify-end sm:mb-5">
        <div className="flex items-center gap-2">
          <SliderArrowButton
            direction="prev"
            disabled={!canPrev}
            onClick={() => scrollByStep(-1)}
          />
          <SliderArrowButton
            direction="next"
            disabled={!canNext}
            onClick={() => scrollByStep(1)}
          />
        </div>
      </div>

      {/* ── Scroll-Container — volle Cards, kein Edge-Cut ──────────────── */}
      <div className="relative overflow-visible">
        <div
          ref={scrollerRef}
          tabIndex={0}
          role="region"
          aria-label="Systeme im Einsatz — horizontaler Slider"
          onKeyDown={onKeyDown}
          className="systems-scroller flex snap-x snap-mandatory overflow-x-auto overflow-y-visible scroll-smooth focus:outline-none"
          style={{
            columnGap: "24px",
            scrollPaddingInline: "0px",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            paddingBlock: "4px 12px",
          }}
        >
          <AnimatePresence mode="popLayout" initial={false}>
            {systems.map((s, i) => (
              <div
                key={s.key}
                data-slide
                className="shrink-0 snap-center w-full min-w-full"
              >
                <SystemCard
                  system={s}
                  index={i}
                  onOpen={() => onOpen(s)}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>

        {/* Scrollbar verstecken (WebKit) */}
        <style jsx>{`
          .systems-scroller::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      {/* ── Progress-Dots unten ─────────────────────────────────────────── */}
      {systems.length > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2 sm:mt-7">
          {systems.map((s, i) => {
            const isActive = i === activeIndex;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => scrollToIndex(i)}
                aria-label={`Zu System ${i + 1}: ${s.title}`}
                aria-current={isActive ? "true" : undefined}
                className="group flex items-center justify-center p-1.5"
              >
                <span
                  className="block rounded-full transition-all duration-500"
                  style={{
                    width: isActive ? "26px" : "6px",
                    height: "6px",
                    background: isActive
                      ? "linear-gradient(90deg, var(--brand-line-bright) 0%, var(--brand-line-mid) 100%)"
                      : "rgba(255,255,255,0.18)",
                    boxShadow: isActive
                      ? "0 0 14px var(--brand-glow-strong), inset 0 0 0 1px rgba(255,255,255,0.18)"
                      : "none",
                  }}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  SLIDER ARROW BUTTON — Glassmorph, disabled-state, Glow on hover
 *  ════════════════════════════════════════════════════════════════ */
function SliderArrowButton({
  direction,
  disabled,
  onClick,
}: {
  direction: "prev" | "next";
  disabled: boolean;
  onClick: () => void;
}) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={isPrev ? "Vorheriges System" : "Nächstes System"}
      className="group relative flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 disabled:cursor-not-allowed sm:h-11 sm:w-11"
      style={{
        background: disabled
          ? "linear-gradient(180deg, rgba(20,16,34,0.55), rgba(10,8,20,0.55))"
          : "linear-gradient(180deg, rgba(28,22,50,0.72), rgba(16,12,32,0.72))",
        border: disabled
          ? "1px solid rgba(255,255,255,0.06)"
          : "1px solid var(--brand-line-mid)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: disabled ? 0.4 : 1,
        boxShadow: disabled
          ? "none"
          : "0 8px 20px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {/* Hover Glow Ring */}
      {!disabled && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-400 group-hover:opacity-100"
          style={{
            boxShadow:
              "inset 0 0 0 1px var(--brand-line-mid), 0 0 22px var(--brand-glow-strong)",
          }}
        />
      )}

      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        aria-hidden
        className="transition-transform duration-300 group-hover:scale-110"
        style={{
          transform: isPrev ? "scaleX(-1)" : "scaleX(1)",
        }}
      >
        <path
          d="M9 6l6 6-6 6"
          fill="none"
          stroke={
            disabled ? "rgba(255,255,255,0.35)" : "rgba(229,222,255,0.95)"
          }
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  SYSTEM CARD — Apple-Showcase / Stripe-Cases Niveau
 *  • Bilddominant
 *  • Minimaler Text (Status · Titel · 1 Satz · 3 Marken-Tags)
 *  • CTA "Mehr ansehen" → öffnet Modal
 *  • Hover: leichte Tiefe + sanfter Bild-Zoom
 *  ════════════════════════════════════════════════════════════════ */
function SystemCard({
  system,
  index,
  onOpen,
}: {
  system: SystemCase;
  index: number;
  onOpen: () => void;
}) {
  const isCapsTitle =
    system.title === system.title.toUpperCase() && system.title.length > 3;
  // In-Entwicklung-Cases bleiben sichtbar, sind aber nicht klickbar.
  // → Schützt das Konzept vor Nachbau, signalisiert „Coming soon".
  const isLocked = system.status !== "live";

  const handleActivate = () => {
    if (isLocked) return;
    onOpen();
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
      transition={{
        duration: 0.75,
        ease: [0.22, 1, 0.36, 1],
        delay: 0.04 + (index % 3) * 0.05,
      }}
      whileHover={isLocked ? undefined : { y: -4 }}
      onClick={handleActivate}
      role={isLocked ? "article" : "button"}
      tabIndex={isLocked ? -1 : 0}
      aria-disabled={isLocked || undefined}
      onKeyDown={(e) => {
        if (isLocked) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={`group relative flex h-full flex-col overflow-hidden rounded-[24px] transform-gpu focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20 ${
        isLocked ? "cursor-default" : "cursor-pointer"
      }`}
      style={{
        background:
          "linear-gradient(180deg, rgba(22,18,42,0.85) 0%, rgba(12,10,26,0.85) 100%)",
        border: "1px solid var(--brand-card-border)",
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.06), 0 28px 56px rgba(0,0,0,0.55), 0 0 32px var(--brand-card-glow)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      {/* Hover glow border — nur bei klickbaren Cards */}
      {!isLocked && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[24px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            boxShadow:
              "inset 0 0 0 1px var(--brand-line-mid), 0 0 38px var(--brand-card-glow-hover)",
          }}
        />
      )}

      {/* Bild — dominant. Wrapper macht den Hover-Zoom (nur wenn klickbar) */}
      <div
        className={`relative overflow-hidden transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isLocked ? "" : "group-hover:scale-[1.015]"
        }`}
      >
        <MockupFrame
          variant={system.variant}
          status={system.status}
          src={system.imageSrc}
          fit={system.imageFit ?? "cover"}
          title={system.title}
        />

        {/* Locked Overlay — schützt unveröffentlichte Konzepte */}
        {isLocked && (
          <>
            {/* Dunkler Tint mit dezenter Blur-Schicht über dem Bild */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-5 rounded-[14px] sm:inset-6"
              style={{
                background:
                  "linear-gradient(180deg, rgba(8,5,18,0.55) 0%, rgba(8,5,18,0.78) 100%)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            />
            {/* Mittiges Lock-Badge */}
            <div className="pointer-events-none absolute inset-5 flex items-center justify-center sm:inset-6">
              <div
                className="flex items-center gap-2.5 rounded-full px-4 py-2 sm:px-5 sm:py-2.5"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(22,18,38,0.86), rgba(12,10,24,0.86))",
                  border: "1px solid var(--brand-line-mid)",
                  boxShadow:
                    "0 14px 30px rgba(0,0,0,0.55), 0 0 22px var(--brand-glow-mid), inset 0 1px 0 rgba(255,255,255,0.08)",
                  backdropFilter: "blur(10px)",
                  WebkitBackdropFilter: "blur(10px)",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  aria-hidden
                  style={{ color: "var(--brand-line-bright)" }}
                >
                  <path
                    d="M7 11V8a5 5 0 0 1 10 0v3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                  <rect
                    x="5"
                    y="11"
                    width="14"
                    height="9"
                    rx="2"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                </svg>
                <span
                  className="text-[10px] uppercase sm:text-[10.5px]"
                  style={{
                    fontFamily:
                      "var(--font-headline), system-ui, sans-serif",
                    letterSpacing: "0.22em",
                    color: "var(--brand-line-bright)",
                    fontWeight: 500,
                  }}
                >
                  Im Aufbau
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Content — reduziert, premium */}
      <div className="flex flex-1 flex-col px-5 pt-5 pb-5 sm:px-6 sm:pt-6 sm:pb-6">
        <StatusBadge status={system.status} />

        <h3
          className="mt-3.5 text-[19px] leading-[1.2] text-white sm:text-[21px]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
            letterSpacing: isCapsTitle ? "0.055em" : "-0.02em",
            fontWeight: isCapsTitle ? 600 : 500,
            background: isCapsTitle
              ? "linear-gradient(105deg, #FFFFFF 0%, #E8ECF4 55%, #B8C0CE 100%)"
              : undefined,
            WebkitBackgroundClip: isCapsTitle ? "text" : undefined,
            WebkitTextFillColor: isCapsTitle ? "transparent" : undefined,
            backgroundClip: isCapsTitle ? "text" : undefined,
            textShadow: isCapsTitle
              ? "0 0 22px var(--brand-glow-soft)"
              : undefined,
          }}
        >
          {system.title}
        </h3>

        {/* Kurzer Satz — keine Bullets mehr */}
        <p
          className="mt-2.5 text-[13.5px] leading-[1.55] text-white/60 sm:text-[14px]"
          style={{
            fontFamily: "var(--font-headline), system-ui, sans-serif",
          }}
        >
          {system.shortDescription}
        </p>

        {/* Marken-Tags */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {system.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10.5px] uppercase leading-none sm:text-[11px]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                letterSpacing: "0.14em",
                color: "var(--brand-line-bright)",
                padding: "6px 10px",
                borderRadius: "999px",
                border: "1px solid var(--brand-card-border)",
                background:
                  "linear-gradient(180deg, rgba(22,18,38,0.55), rgba(12,10,24,0.55))",
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* CTA-Reihe unten — bei Live-Cards „Mehr ansehen", bei Locked-Cards
           reduzierte „Bald verfügbar"-Anzeige ohne klickbares Element. */}
        <div
          className="mt-5 flex items-center justify-between pt-4"
          style={{ borderTop: "1px solid var(--brand-card-border)" }}
        >
          {isLocked ? (
            <>
              <span
                className="flex items-center gap-2 text-[11.5px] uppercase sm:text-[12px]"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  letterSpacing: "0.22em",
                  color: "rgba(255,255,255,0.42)",
                  fontWeight: 500,
                }}
              >
                <motion.span
                  aria-hidden
                  className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{
                    background: "var(--brand-line-mid)",
                    boxShadow: "0 0 8px var(--brand-glow-strong)",
                  }}
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                Bald verfügbar
              </span>
              <span
                aria-hidden
                className="text-[10px] uppercase sm:text-[10.5px]"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  letterSpacing: "0.2em",
                  color: "rgba(255,255,255,0.32)",
                }}
              >
                NEXCEL Lab
              </span>
            </>
          ) : (
            <>
              <span
                className="flex items-center gap-2 text-[12.5px] uppercase sm:text-[13px]"
                style={{
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  letterSpacing: "0.18em",
                  color: "var(--brand-line-bright)",
                  fontWeight: 500,
                }}
              >
                Mehr ansehen
              </span>
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-500 group-hover:bg-white/[0.06]"
                style={{
                  border: "1px solid var(--brand-card-border)",
                  background:
                    "linear-gradient(180deg, rgba(22,18,38,0.55), rgba(12,10,24,0.55))",
                  boxShadow: "0 0 16px var(--brand-card-glow)",
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="transition-transform duration-500 group-hover:translate-x-[1px] group-hover:translate-y-[-1px]"
                >
                  <path
                    d="M7 17 17 7M9 7h8v8"
                    fill="none"
                    stroke="var(--brand-line-bright)"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </>
          )}
        </div>
      </div>
    </motion.article>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  SYSTEM DETAIL MODAL — Apple Showcase / Stripe-Case Niveau
 *  • Animated Overlay (Backdrop-Blur, Fade-in)
 *  • Slide-up Sheet auf Mobile, zentriertes Modal auf Desktop
 *  • Hero-Image, Status, Tags, lange Beschreibung, alle Features
 *  • Optionaler CTA zur Webseite
 *  ════════════════════════════════════════════════════════════════ */
function SystemDetailModal({
  system,
  onClose,
}: {
  system: SystemCase | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {system && (
        <motion.div
          key="systems-detail-modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-0 z-[10000] flex flex-col"
          aria-modal="true"
          role="dialog"
          aria-labelledby="systems-detail-title"
        >
          {/* Backdrop — füllt das gesamte Viewport */}
          <button
            type="button"
            aria-label="Detailansicht schließen"
            onClick={onClose}
            className="absolute inset-0 cursor-pointer"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(8,4,18,0.55) 0%, rgba(4,2,12,0.92) 100%)",
              backdropFilter: "blur(22px)",
              WebkitBackdropFilter: "blur(22px)",
            }}
          />

          {/* Top-Bar — ersetzt die globale Navigation im Modal-State.
             Enthält "Zurück zur Webseite" links + zentriertes Brand-Label. */}
          <div
            className="relative z-[2] flex items-center justify-between px-5 sm:px-8"
            style={{
              paddingTop:
                "max(20px, calc(env(safe-area-inset-top, 0px) + 14px))",
              paddingBottom: "14px",
            }}
          >
            <motion.button
              type="button"
              onClick={onClose}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                duration: 0.5,
                delay: 0.12,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group flex items-center gap-2.5 rounded-full px-4 py-2 transition-all hover:gap-3 sm:px-5 sm:py-2.5"
              style={{
                background:
                  "linear-gradient(180deg, rgba(22,18,38,0.72), rgba(12,10,24,0.72))",
                border: "1px solid var(--brand-card-border)",
                boxShadow:
                  "0 10px 24px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
              }}
              aria-label="Zurück zur Webseite"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                aria-hidden
                className="transition-transform duration-400 group-hover:-translate-x-0.5"
                style={{ color: "var(--brand-line-bright)" }}
              >
                <path
                  d="M15 18l-6-6 6-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="text-[11px] uppercase sm:text-[12px]"
                style={{
                  fontFamily:
                    "var(--font-headline), system-ui, sans-serif",
                  letterSpacing: "0.18em",
                  color: "rgba(255,255,255,0.88)",
                  fontWeight: 500,
                }}
              >
                Zurück zur Webseite
              </span>
            </motion.button>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{
                duration: 0.6,
                delay: 0.2,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="hidden text-[10.5px] uppercase sm:inline-block"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                letterSpacing: "0.32em",
                color: "rgba(255,255,255,0.42)",
              }}
            >
              Case Detail
            </motion.span>
          </div>

          {/* Modal-Wrapper — füllt restlichen Platz, zentriert Sheet */}
          <div className="relative z-[1] flex flex-1 items-end justify-center overflow-hidden px-0 pb-0 sm:items-center sm:px-6 sm:pb-6">
            {/* Sheet / Modal */}
            <motion.div
              initial={{ y: 60, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 30, opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="relative mx-auto flex h-full max-h-full w-full max-w-[920px] flex-col overflow-hidden rounded-t-[26px] sm:h-auto sm:max-h-full sm:rounded-[26px]"
              style={{
                background:
                  "linear-gradient(180deg, rgba(22,18,42,0.96) 0%, rgba(12,10,26,0.98) 100%)",
                border: "1px solid var(--brand-card-border)",
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.08), 0 40px 100px rgba(0,0,0,0.65), 0 0 60px var(--brand-card-glow)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
              }}
            >
            {/* Close button rechts oben — bleibt als zweite Schließen-Option */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Schließen"
              className="absolute right-4 top-4 z-[2] flex h-10 w-10 items-center justify-center rounded-full transition-all hover:bg-white/[0.06] sm:right-5 sm:top-5 sm:h-11 sm:w-11"
              style={{
                border: "1px solid var(--brand-card-border)",
                background:
                  "linear-gradient(180deg, rgba(22,18,38,0.75), rgba(12,10,24,0.75))",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
                <path
                  d="M6 6l12 12M18 6L6 18"
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {/* Scroll-Container */}
            <div className="relative flex-1 overflow-y-auto">
              {/* Hero-Bild */}
              <div className="relative">
                <MockupFrame
                  variant={system.variant}
                  status={system.status}
                  src={system.imageSrc}
                  fit={system.imageFit ?? "cover"}
                  title={system.title}
                />
              </div>

              {/* Inhalt */}
              <div className="px-5 pb-8 pt-6 sm:px-9 sm:pb-10 sm:pt-8">
                <StatusBadge status={system.status} />

                <h2
                  id="systems-detail-title"
                  className="mt-4 text-[26px] leading-[1.1] text-white sm:text-[34px] md:text-[40px]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    letterSpacing:
                      system.title === system.title.toUpperCase() &&
                      system.title.length > 3
                        ? "0.05em"
                        : "-0.025em",
                    fontWeight: 500,
                  }}
                >
                  {system.title}
                </h2>

                {/* Tag-Reihe */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {system.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10.5px] uppercase leading-none sm:text-[11px]"
                      style={{
                        fontFamily:
                          "var(--font-headline), system-ui, sans-serif",
                        letterSpacing: "0.14em",
                        color: "var(--brand-line-bright)",
                        padding: "6px 10px",
                        borderRadius: "999px",
                        border: "1px solid var(--brand-card-border)",
                        background:
                          "linear-gradient(180deg, rgba(22,18,38,0.55), rgba(12,10,24,0.55))",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Lange Beschreibung */}
                <p
                  className="mt-6 text-[14.5px] leading-[1.7] text-white/72 sm:text-[15.5px]"
                  style={{
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                  }}
                >
                  {system.longDescription}
                </p>

                {/* Feature-Liste */}
                <div className="mt-8">
                  <div
                    className="mb-4 text-[10.5px] uppercase tracking-[0.24em] text-white/40 sm:text-[11px]"
                    style={{
                      fontFamily:
                        "var(--font-headline), system-ui, sans-serif",
                    }}
                  >
                    Was im System steckt
                  </div>
                  <ul className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    {system.features.map((f, i) => (
                      <motion.li
                        key={f}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{
                          duration: 0.5,
                          delay: 0.15 + i * 0.04,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="flex items-start gap-3 text-[13.5px] text-white/78 sm:text-[14px]"
                        style={{
                          fontFamily:
                            "var(--font-headline), system-ui, sans-serif",
                        }}
                      >
                        <span
                          aria-hidden
                          className="mt-[7px] inline-block h-1 w-1 shrink-0 rounded-full"
                          style={{
                            background: "var(--brand-line-bright)",
                            boxShadow: "0 0 6px var(--brand-glow-strong)",
                          }}
                        />
                        <span>{f}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                {system.website && (
                  <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <a
                      href={system.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[12.5px] uppercase transition-all sm:text-[13px]"
                      style={{
                        fontFamily:
                          "var(--font-headline), system-ui, sans-serif",
                        letterSpacing: "0.18em",
                        fontWeight: 500,
                        color: "#FFFFFF",
                        background:
                          "linear-gradient(180deg, var(--brand-primary) 0%, var(--brand-plateau-5) 100%)",
                        border: "1px solid var(--brand-line-mid)",
                        boxShadow:
                          "0 12px 28px rgba(0,0,0,0.45), 0 0 26px var(--brand-pill-active-glow), inset 0 1px 0 rgba(255,255,255,0.18)",
                      }}
                    >
                      Live ansehen
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 24 24"
                        aria-hidden
                        className="transition-transform duration-500 group-hover:translate-x-[2px] group-hover:translate-y-[-2px]"
                      >
                        <path
                          d="M7 17 17 7M9 7h8v8"
                          fill="none"
                          stroke="#FFFFFF"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                )}
              </div>
            </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  MOCKUP FRAME — Image Container, später durch echte Screenshots ersetzbar
 *  ════════════════════════════════════════════════════════════════ */
function MockupFrame({
  variant,
  status,
  src,
  fit,
  title,
}: {
  variant: SystemCase["variant"];
  status: StatusKind;
  src?: string;
  fit: "cover" | "contain";
  title: string;
}) {
  const palette = useMemo(() => paletteFor(variant), [variant]);
  const hasImage = Boolean(src);

  return (
    <div className="relative mx-5 mt-5 overflow-hidden rounded-[14px] sm:mx-6 sm:mt-6">
      <div
        className="relative aspect-[16/10] w-full overflow-hidden rounded-[14px]"
        style={{
          background: palette.bg,
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.10), inset 0 -1px 0 rgba(0,0,0,0.50), 0 22px 44px rgba(0,0,0,0.55)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {hasImage ? (
          <ScreenshotMockup
            src={src!}
            fit={fit}
            title={title}
            palette={palette}
          />
        ) : (
          <MockupContent variant={variant} status={status} />
        )}

        {/* Gradient overlay — sichert Lesbarkeit der Bottom-Edge */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[28%]"
          style={{
            background:
              "linear-gradient(180deg, transparent 0%, rgba(8,4,18,0.55) 100%)",
          }}
        />

        {/* Inner Glow border */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[14px]"
          style={{
            boxShadow: `inset 0 0 0 1px ${palette.borderGlow}`,
          }}
        />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  SCREENSHOT MOCKUP — hochwertige Browser-Kapsel mit echtem Bild
 *  Wirkt wie ein Software-Window in einem Premium-Showcase.
 *  ════════════════════════════════════════════════════════════════ */
function ScreenshotMockup({
  src,
  fit,
  title,
  palette,
}: {
  src: string;
  fit: "cover" | "contain";
  title: string;
  palette: ReturnType<typeof paletteFor>;
}) {
  return (
    <div className="absolute inset-0">
      {/* Browser Chrome */}
      <div
        className="absolute inset-x-0 top-0 z-[2] flex items-center gap-2 px-3 py-2 sm:px-3.5 sm:py-2.5"
        style={{
          background:
            "linear-gradient(180deg, rgba(14,12,24,0.85) 0%, rgba(10,8,18,0.75) 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
        }}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "rgba(239,68,68,0.65)" }}
          />
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "rgba(245,158,11,0.65)" }}
          />
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: "rgba(34,197,94,0.65)" }}
          />
        </div>
        <div
          className="ml-1.5 flex flex-1 items-center justify-center rounded-md py-0.5 sm:ml-2"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <span
            className="truncate text-[8.5px] text-white/45 sm:text-[9px]"
            style={{
              fontFamily: "var(--font-headline), system-ui, sans-serif",
            }}
          >
            {urlForTitle(title)}
          </span>
        </div>
      </div>

      {/* Screenshot Image */}
      <div className="absolute inset-0 pt-[26px] sm:pt-[30px]">
        <div className="relative h-full w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`Screenshot: ${title}`}
            loading="lazy"
            decoding="async"
            className={`absolute inset-0 h-full w-full ${
              fit === "cover" ? "object-cover" : "object-contain"
            }`}
            style={{
              objectPosition: "center top",
              filter: "saturate(1.05) contrast(1.02)",
            }}
          />
          {/* Subtle vignette */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              boxShadow: "inset 0 0 64px rgba(0,0,0,0.40)",
            }}
          />
          {/* Variant-color tone-glow nur dezent oben */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[40%]"
            style={{
              background: `linear-gradient(180deg, ${palette.accent.replace(
                /[\d.]+\)$/,
                "0.08)"
              )} 0%, transparent 100%)`,
            }}
          />
        </div>
      </div>
    </div>
  );
}

function urlForTitle(title: string) {
  switch (title) {
    case "Immobilien Weissleder":
      return "immobilien-weissleder.de";
    case "CANNABBROS":
      return "cannabbros.csc";
    case "Webseiten + Terminbuchung":
      return "beautybar-akademie.de";
    case "Borne Run":
      return "bornetorun.de";
    case "Impuls Pflege":
      return "impuls-pflege.de";
    case "Cannaflow AI":
      return "cannaflow.ai";
    case "Bewerber-Orchestrator":
      return "orchestrator.nexcel.ai";
    case "Hausverwaltungssystem":
      return "hausverwaltung.nexcel.ai";
    default:
      return "system.nexcel.ai";
  }
}

/* Variants — Hintergrundfarben & Akzente pro System */
function paletteFor(variant: SystemCase["variant"]) {
  switch (variant) {
    case "violet":
      return {
        bg: "linear-gradient(155deg, #14102A 0%, #1B1340 50%, #0B0822 100%)",
        accent: "var(--brand-line-mid)",
        accent2: "var(--brand-glow-strong)",
        borderGlow: "var(--brand-glow-mid)",
      };
    case "deep":
      return {
        bg: "linear-gradient(155deg, #0F0A24 0%, #1A1340 55%, #08051A 100%)",
        accent: "var(--brand-line-bright)",
        accent2: "rgba(99,102,241,0.55)",
        borderGlow: "var(--brand-card-border)",
      };
    case "mint":
      return {
        bg: "linear-gradient(155deg, #0A1A1E 0%, #102A2E 55%, #050F12 100%)",
        accent: "rgba(110,231,183,0.85)",
        accent2: "rgba(52,211,153,0.55)",
        borderGlow: "rgba(110,231,183,0.14)",
      };
    case "amber":
      return {
        bg: "linear-gradient(155deg, #1A140A 0%, #2A1F0E 55%, #110C04 100%)",
        accent: "rgba(252,211,77,0.85)",
        accent2: "rgba(217,119,6,0.55)",
        borderGlow: "rgba(252,211,77,0.14)",
      };
    case "carbon":
      return {
        bg: "linear-gradient(155deg, #0E0E12 0%, #1A1A22 55%, #050508 100%)",
        accent: "rgba(229,231,235,0.88)",
        accent2: "rgba(156,163,175,0.45)",
        borderGlow: "rgba(229,231,235,0.10)",
      };
    case "azure":
      return {
        bg: "linear-gradient(155deg, #0A1224 0%, #122042 55%, #050918 100%)",
        accent: "rgba(147,197,253,0.88)",
        accent2: "rgba(59,130,246,0.50)",
        borderGlow: "rgba(147,197,253,0.16)",
      };
  }
}

/* ════════════════════════════════════════════════════════════════════
 *  MOCKUP CONTENT — sehr ruhige, abstrakte Repräsentation des Systems
 *  Keine Sport-Fitness-Optik. Keine Klinik-Standardlook.
 *  Premium Operativer Look.
 *  ════════════════════════════════════════════════════════════════ */
function MockupContent({
  variant,
  status,
}: {
  variant: SystemCase["variant"];
  status: StatusKind;
}) {
  const p = paletteFor(variant);

  return (
    <div className="absolute inset-0">
      {/* Soft local glow */}
      <span
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 50% 60% at 50% 30%, ${p.accent2.replace(
            /[\d.]+\)$/,
            "0.16)"
          )} 0%, transparent 70%)`,
        }}
      />

      {/* Top mini-bar (browser/system chrome) */}
      <div className="absolute inset-x-3 top-3 flex items-center gap-1.5 sm:inset-x-4 sm:top-4">
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
        <span className="ml-2 text-[8.5px] uppercase tracking-[0.25em] text-white/35">
          {status === "live" ? "live system" : status === "in-entwicklung" ? "build" : "intern"}
        </span>
      </div>

      {/* Faint baseline grid */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.30]"
        style={{
          backgroundImage: `
            linear-gradient(${p.accent.replace(/[\d.]+\)$/, "0.06)")} 1px, transparent 1px),
            linear-gradient(90deg, ${p.accent.replace(/[\d.]+\)$/, "0.06)")} 1px, transparent 1px)
          `,
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 70% 65% at 50% 60%, #000 20%, transparent 90%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 65% at 50% 60%, #000 20%, transparent 90%)",
        }}
      />

      {/* Animated soft trace line */}
      <svg
        aria-hidden
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 160 100"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={`mock-${variant}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={p.accent.replace(/[\d.]+\)$/, "0)")} />
            <stop offset="40%" stopColor={p.accent.replace(/[\d.]+\)$/, "0.32)")} />
            <stop offset="100%" stopColor={p.accent.replace(/[\d.]+\)$/, "0.55)")} />
          </linearGradient>
        </defs>
        <motion.path
          d="M 0,72 C 30,60 50,80 80,62 C 110,46 130,68 160,52"
          fill="none"
          stroke={`url(#mock-${variant})`}
          strokeWidth="1"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0 }}
          whileInView={{ pathLength: 1, opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          transition={{ duration: 2.2, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.circle
          r="1.2"
          fill={p.accent}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
          transition={{ duration: 0.5, delay: 1.8 }}
        >
          <animateMotion
            dur="6s"
            repeatCount="indefinite"
            path="M 0,72 C 30,60 50,80 80,62 C 110,46 130,68 160,52"
          />
        </motion.circle>
      </svg>

      {/* Mock UI block — sehr ruhige Andeutung */}
      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 sm:bottom-4 sm:left-4 sm:right-4">
        <div className="flex flex-col gap-1.5">
          <span
            className="h-1.5 w-12 rounded-full sm:w-16"
            style={{ background: p.accent.replace(/[\d.]+\)$/, "0.42)") }}
          />
          <span
            className="h-1.5 w-20 rounded-full sm:w-28"
            style={{ background: "rgba(255,255,255,0.10)" }}
          />
          <span
            className="h-1.5 w-16 rounded-full sm:w-24"
            style={{ background: "rgba(255,255,255,0.06)" }}
          />
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-3 w-1 rounded-sm"
                style={{
                  background: p.accent.replace(/[\d.]+\)$/, `${0.18 + i * 0.12})`),
                  height: `${10 + i * 4}px`,
                }}
              />
            ))}
          </div>
          <span
            className="h-1.5 w-10 rounded-full sm:w-14"
            style={{ background: p.accent.replace(/[\d.]+\)$/, "0.32)") }}
          />
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  STATUS BADGE
 *  ════════════════════════════════════════════════════════════════ */
function StatusBadge({ status }: { status: StatusKind }) {
  const meta =
    status === "live"
      ? { label: "LIVE", color: "rgba(110,231,183,0.95)" }
      : status === "in-entwicklung"
      ? { label: "IN ENTWICKLUNG", color: "var(--brand-line-bright)" }
      : { label: "INTERN", color: "rgba(229,231,235,0.85)" };

  return (
    <div className="flex items-center gap-2">
      <motion.span
        aria-hidden
        className="inline-block h-1.5 w-1.5 rounded-full"
        animate={
          status === "live"
            ? {
                opacity: [0.55, 1, 0.55],
                boxShadow: [
                  `0 0 0 0 ${meta.color.replace(/[\d.]+\)$/, "0.45)")}`,
                  `0 0 0 5px ${meta.color.replace(/[\d.]+\)$/, "0)")}`,
                  `0 0 0 0 ${meta.color.replace(/[\d.]+\)$/, "0.45)")}`,
                ],
              }
            : { opacity: [0.5, 0.85, 0.5] }
        }
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        style={{ background: meta.color }}
      />
      <span
        className="text-[9px] font-semibold uppercase tracking-[0.28em] sm:text-[9.5px]"
        style={{
          color: meta.color,
          fontFamily: "var(--font-headline), system-ui, sans-serif",
        }}
      >
        {meta.label}
      </span>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  CATEGORY TAGS — kleine Pills unten in der Card
 *  ════════════════════════════════════════════════════════════════ */
function CategoryTags({ categories }: { categories: CategoryKey[] }) {
  const labels: Record<CategoryKey, string> = {
    alle: "Alle",
    ki: "KI",
    webseiten: "Webseiten",
    crm: "CRM",
    recruiting: "Recruiting",
    immobilien: "Immobilien",
    automation: "Automation",
    pflege: "Pflege",
    events: "Events",
    beauty: "Beauty",
  };
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.slice(0, 2).map((c) => (
        <span
          key={c}
          className="rounded-full px-2.5 py-0.5 text-[9.5px] font-medium uppercase tracking-[0.18em]"
          style={{
            color: "var(--brand-line-bright)",
            background: "var(--brand-glow-mid)",
            border: "1px solid var(--brand-card-border)",
            fontFamily: "var(--font-headline), system-ui, sans-serif",
          }}
        >
          {labels[c]}
        </span>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
 *  FOOTER BAR — Editorial, ohne Box & Stern
 *  • Reine Hairline oben (zarter Trenner, brand-aware)
 *  • Großzügiger Text-CTA links, „Projekt besprechen" als Ghost-Button rechts
 *  • Kein lila/cyan Fill — clean, premium, basic
 *  ════════════════════════════════════════════════════════════════ */
function FooterBar() {
  const brand = useBrand();
  const kontaktHref = resolveBrandNavHref("/kontakt", brand.id);

  return (
    <div className="relative">
      {/* Top hairline — der einzige Trenner */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--brand-line-mid) 50%, transparent 100%)",
          opacity: 0.55,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
        transition={{ duration: 1.0, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto w-full max-w-[1280px] px-5 py-10 sm:px-8 sm:py-14"
      >
        <div className="flex flex-col items-start gap-8 sm:flex-row sm:items-end sm:justify-between sm:gap-12">
          {/* Statement-Text — editorial, typografisch geführt */}
          <div className="max-w-[640px]">
            <p
              className="text-[20px] leading-[1.35] tracking-[-0.01em] sm:text-[24px] md:text-[26px]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
              }}
            >
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
                Jedes System.
              </span>{" "}
              <span style={{ color: "rgba(255,255,255,0.82)" }}>
                Individuell entwickelt.
              </span>
              <br />
              <span style={{ color: "rgba(255,255,255,0.58)" }}>
                100&nbsp;% auf Ihr Unternehmen zugeschnitten.
              </span>
            </p>
          </div>

          {/* CTA — Ghost-Style, ohne Fill, ultra-clean */}
          <Link
            href={kontaktHref}
            prefetch
            className="group relative inline-flex shrink-0 items-center gap-3 rounded-full px-6 py-3 text-[12px] uppercase transition-all duration-500 hover:gap-4 sm:text-[12.5px]"
            style={{
              color: "rgba(255,255,255,0.92)",
              background: "transparent",
              border: "1px solid var(--brand-card-border)",
              fontFamily: "var(--font-headline), system-ui, sans-serif",
              letterSpacing: "0.22em",
              fontWeight: 500,
            }}
          >
            {/* Hover hairline highlight — sehr dezent */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              style={{
                border: "1px solid var(--brand-line-mid)",
                boxShadow: "0 0 26px var(--brand-glow-mid)",
              }}
            />
            <span className="relative">Projekt besprechen</span>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              aria-hidden
              className="relative transition-transform duration-500 group-hover:translate-x-0.5"
            >
              <path
                d="M5 12h14M13 6l6 6-6 6"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
