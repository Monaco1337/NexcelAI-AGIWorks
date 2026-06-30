"use client";

/**
 * NEXCEL AI / AGI WORKS · SystemsGrid
 *
 * 8 Systemkategorien als Premium-Accordion-Cards:
 * – Titel immer sichtbar
 * – Pfeil → Auf-/Zuklappen → Kurzbeschreibung + Feature-Bullets
 * – Bild-Klick → Detail-Modal mit vollständigem Systemüberblick
 */

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState, type ReactNode } from "react";

type SystemCard = {
  slug: string;
  title: string;
  tagline: string;
  desc: string;
  bullets: string[];
  details: string[];
  icon: ReactNode;
  image: string;
  alt: string;
};

const CARDS: SystemCard[] = [
  {
    slug: "premium-websysteme",
    title: "Premium-Websysteme",
    tagline: "Webseiten, die verkaufen.",
    desc: "Maßgeschneiderte Webseiten und Portale mit Fokus auf Conversion, Performance und Markenauftritt.",
    bullets: [
      "Conversion-optimierte Landingpages & Portale",
      "SEO-Architektur & Core Web Vitals",
      "Integriertes Kontakt- & Lead-System",
    ],
    details: [
      "Individuelles Design nach Markenidentität",
      "Conversion-optimierte Seitenstruktur",
      "SEO-Architektur & Core Web Vitals",
      "Integriertes Kontakt- & Lead-System",
      "CMS-Anbindung für eigenständige Pflege",
      "Cookie-Banner, Impressum & Datenschutz",
      "Analytics-Tracking & Ziel-Messung",
      "Mobile-first, responsive auf allen Geräten",
    ],
    icon: <GlobeIcon />,
    image: "/images/system-visuals/premium-websysteme.png",
    alt: "Premium-Websystem — Hero-Landingpage mit Formular und Lead-Strecke",
  },
  {
    slug: "buchungs-beauty-systeme",
    title: "Buchungs- & Beauty-Systeme",
    tagline: "Termine buchen. Rund um die Uhr.",
    desc: "Intelligente Buchungssysteme für Dienstleister, Salons und Studios — automatisiert, übersichtlich.",
    bullets: [
      "Online-Buchung 24/7 ohne Telefonat",
      "Mitarbeiter-Kalender & Ressourcen",
      "Automatische Erinnerungen & Bestätigungen",
    ],
    details: [
      "Online-Buchung 24/7 ohne Telefonat",
      "Mitarbeiter- & Ressourcenverwaltung",
      "Automatische E-Mail- und SMS-Erinnerungen",
      "Leistungs- & Preiskatalog",
      "Kundenprofil & Buchungshistorie",
      "Stornierung & Umbuchung selbstständig",
      "Admin-Dashboard mit Tagesübersicht",
      "Anbindung an Google Kalender & iCal",
    ],
    icon: <CalendarIcon />,
    image: "/images/system-visuals/buchungs-beauty-systeme.png",
    alt: "Buchungssystem — Terminkalender mit Leistungen und Kundenverwaltung",
  },
  {
    slug: "lead-funnels-crm",
    title: "Lead-Funnels & CRM",
    tagline: "Mehr Anfragen. Messbar. Planbar.",
    desc: "Leadgenerierung, qualifizierte Funnels und strukturiertes CRM für nachhaltiges Wachstum.",
    bullets: [
      "GEO- & SEO-optimierte Landingpages",
      "CRM mit Pipeline & Lead-Status",
      "Automatischer Erstkontakt & Follow-up",
    ],
    details: [
      "GEO- & SEO-optimierte Landingpages",
      "Multi-Step-Formulare zur Lead-Qualifizierung",
      "CRM-Pipeline mit Status & Priorität",
      "Automatischer Erstkontakt via E-Mail",
      "Follow-up-Sequenzen & Wiedervorlagen",
      "Lead-Scoring & Priorisierung",
      "Reporting: Conversion-Raten & Quellen",
      "Integration mit bestehenden Systemen",
    ],
    icon: <FunnelIcon />,
    image: "/images/system-visuals/lead-funnels-crm.png",
    alt: "Lead-Funnel & CRM — Landingpage, CRM-Cockpit mit Pipeline",
  },
  {
    slug: "mitglieder-clubverwaltung",
    title: "Mitglieder- & Clubverwaltung",
    tagline: "Community strukturiert verwalten.",
    desc: "Mitgliederbereiche, Rollen, Standorte und Freigaben — alles in einem übersichtlichen System.",
    bullets: [
      "Mitgliederverwaltung mit Rollen & Status",
      "Standorte, Dokumente & Freigaben",
      "Aktivitätsübersicht & Reports",
    ],
    details: [
      "Mitgliederverwaltung mit Rollen & Status",
      "Standort- & Bereichsverwaltung",
      "Dokumenten-Upload & Freigabe-Workflow",
      "Mitglieder-Dashboard & Selbstservice",
      "Admin-Bereich mit Moderationsfunktionen",
      "Aktivitäts-Feed & Benachrichtigungen",
      "Mitglieder-Reporting & Statistiken",
      "Mobile App-taugliche Oberfläche",
    ],
    icon: <UsersIcon />,
    image: "/images/system-visuals/mitglieder-clubverwaltung.png",
    alt: "Mitglieder- & Clubverwaltung — Dashboard mit Rollen, Standorten und Freigaben",
  },
  {
    slug: "branchen-plattformen",
    title: "Branchen-Plattformen",
    tagline: "Ihr Marktplatz. Ihre Regeln.",
    desc: "Digitale Branchenverzeichnisse und Marktplätze mit Listing, Suche, Karte und Admin-Kontrolle.",
    bullets: [
      "Listing-Portal mit Karte & Filtersuche",
      "Anbieter-Onboarding & Profilverwaltung",
      "Anfragen-System & Admin-Moderation",
    ],
    details: [
      "Listing-Portal mit Karte & Geo-Suche",
      "Anbieter-Onboarding & Profil-Editor",
      "Kategorie-, Filter- & Umkreissuche",
      "Bewertungs- & Review-System",
      "Anfragen-Routing an Anbieter",
      "Admin-Dashboard & Content-Moderation",
      "SEO-optimierte Brancheneinträge",
      "Monetarisierung via Premium-Listings",
    ],
    icon: <PlatformIcon />,
    image: "/images/system-visuals/branchen-plattformen.png",
    alt: "Branchen-Plattform — Such-Portal mit Karte, Detailansicht und Admin",
  },
  {
    slug: "erp-systeme",
    title: "Individuelle ERP-Systeme",
    tagline: "Ihr Unternehmen. Ein System.",
    desc: "Kunden, Projekte, Finanzen und Ressourcen gebündelt in einer maßgeschneiderten Betriebszentrale.",
    bullets: [
      "Kunden-, Aufgaben- & Projektverwaltung",
      "Finanzen, Rechnungen & offene Posten",
      "Reports, Dashboards & Auswertungen",
    ],
    details: [
      "Kunden- & Kontaktverwaltung (CRM-Kern)",
      "Aufgaben- & Projektmanagement",
      "Finanzen: Angebote, Rechnungen, Posten",
      "Ressourcen- & Mitarbeiterplanung",
      "Dokumenten- & Dateiablage",
      "Rollenbasierte Zugriffsrechte",
      "Live-Reports & KPI-Dashboards",
      "Anpassbar auf Ihre Branche & Prozesse",
    ],
    icon: <ErpIcon />,
    image: "/images/system-visuals/erp-systeme.png",
    alt: "ERP-System — Betriebszentrale mit Kunden, Projekten und Finanzen",
  },
  {
    slug: "ki-automatisierung",
    title: "KI & Automatisierung",
    tagline: "Prozesse, die sich selbst erledigen.",
    desc: "KI-gestützte Workflows, die Dokumente lesen, priorisieren, antworten und Aktionen auslösen.",
    bullets: [
      "Automatische Eingangsverarbeitung",
      "KI-Klassifizierung & Priorisierung",
      "Workflow-Auslösung & E-Mail-Entwürfe",
    ],
    details: [
      "Automatische Eingangsverarbeitung (E-Mail, Formulare, Dokumente)",
      "KI-Klassifizierung & Priorisierung",
      "Automatische E-Mail-Entwürfe & Antworten",
      "Workflow-Auslösung bei definierten Regeln",
      "Aufgaben automatisch erstellen & zuweisen",
      "Zusammenfassungen & Kernaussagen extrahieren",
      "System-Performance-Monitoring",
      "Vollständig konfigurierbar & erweiterbar",
    ],
    icon: <SparkIcon />,
    image: "/images/system-visuals/ki-automatisierung.png",
    alt: "KI & Automatisierung — KI-Core mit Eingangsquellen und Automatisierungs-Studio",
  },
  {
    slug: "schnittstellen-integrationen",
    title: "Schnittstellen & Integrationen",
    tagline: "Alles verbunden. Sicher. Stabil.",
    desc: "Nahtlose Anbindungen zwischen externen Systemen und Ihrer zentralen Infrastruktur.",
    bullets: [
      "REST-API & Webhook-Verbindungen",
      "Datenmapping & Format-Transformation",
      "Fehler-Handling & automatische Wiederholung",
    ],
    details: [
      "REST-API, GraphQL & Webhook-Anbindungen",
      "Zahlungsanbieter (Stripe, PayPal, SEPA)",
      "CRM- & ERP-Systemintegrationen",
      "Kalender (Google, iCal, CalDAV)",
      "E-Mail-Systeme (IMAP/SMTP, SendGrid)",
      "Datenmapping & Format-Transformation",
      "Fehler-Handling & automatische Wiederholung",
      "DSGVO-konform & SSL-verschlüsselt",
    ],
    icon: <PlugIcon />,
    image: "/images/system-visuals/schnittstellen-integrationen.png",
    alt: "Schnittstellen & Integrationen — Hub verbindet externe Systeme mit dem Unternehmenssystem",
  },
];

export default function SystemsGrid() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [modal, setModal] = useState<SystemCard | null>(null);

  const closeModal = useCallback(() => setModal(null), []);

  const toggleExpand = (slug: string) => {
    setExpanded((prev) => (prev === slug ? null : slug));
  };

  useEffect(() => {
    if (!modal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [modal, closeModal]);

  return (
    <section
      id="systeme"
      className="relative w-full overflow-hidden scroll-mt-[108px] py-20 sm:py-28"
      style={{
        background:
          "linear-gradient(to bottom, rgba(5,3,14,0.92) 0%, transparent 15%, transparent 85%, rgba(5,3,14,0.92) 100%)",
      }}
    >
      <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-8">
        <SectionHeading
          eyebrow="Systeme"
          title="Systeme, die zu Ihrem Unternehmen passen."
        />

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card, i) => {
            const isOpen = expanded === card.slug;
            return (
              <motion.article
                key={card.slug}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-8%" }}
                transition={{ duration: 0.5, delay: (i % 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex flex-col overflow-hidden rounded-2xl"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)",
                  border: `1px solid ${isOpen ? "rgba(255,255,255,0.14)" : "var(--brand-card-border)"}`,
                  boxShadow: isOpen
                    ? "0 0 0 1px rgba(255,255,255,0.04), 0 8px 40px rgba(0,0,0,0.35)"
                    : "inset 0 1px 0 rgba(255,255,255,0.05)",
                  transition: "border-color 0.3s, box-shadow 0.3s",
                }}
              >
                {/* ── Hover-Glow ── */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(80% 50% at 50% 0%, var(--brand-card-glow-hover), transparent 70%)",
                  }}
                />

                {/* ── Header (immer sichtbar) ── */}
                <button
                  type="button"
                  onClick={() => toggleExpand(card.slug)}
                  aria-expanded={isOpen}
                  className="relative flex w-full items-center gap-3 p-5 text-left outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                >
                  {/* Icon */}
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      background:
                        "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                      border: "1px solid var(--brand-card-border)",
                      color: "var(--accent)",
                    }}
                  >
                    {card.icon}
                  </div>

                  {/* Title */}
                  <h3
                    className="flex-1 text-[14.5px] font-medium leading-snug text-white"
                    style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
                  >
                    {card.title}
                  </h3>

                  {/* Chevron */}
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition-all duration-300"
                    style={{
                      background: isOpen
                        ? "var(--accent)"
                        : "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.08)",
                    }}
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                      style={{
                        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 0.3s cubic-bezier(0.22,1,0.36,1)",
                      }}
                    >
                      <path
                        d="M6 9l6 6 6-6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {/* ── Accordion-Body ── */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      key="body"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5">
                        {/* Tagline */}
                        <p
                          className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em]"
                          style={{ color: "var(--accent)" }}
                        >
                          {card.tagline}
                        </p>

                        {/* Description */}
                        <p className="mb-4 text-[12.5px] leading-[1.65] text-white/60">
                          {card.desc}
                        </p>

                        {/* Feature Bullets */}
                        <ul className="mb-5 space-y-2">
                          {card.bullets.map((b) => (
                            <li
                              key={b}
                              className="flex items-start gap-2.5 text-[12px] leading-[1.55] text-white/75"
                            >
                              <span
                                className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: "var(--accent)" }}
                                aria-hidden
                              />
                              {b}
                            </li>
                          ))}
                        </ul>

                        {/* Image (klickbar → Modal) */}
                        <button
                          type="button"
                          onClick={() => setModal(card)}
                          aria-label={`${card.title} — Systemdetails ansehen`}
                          className="group/img relative block w-full overflow-hidden rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                          style={{ border: "1px solid var(--brand-card-border)" }}
                        >
                          <div className="relative aspect-[16/10] w-full">
                            <Image
                              src={card.image}
                              alt={card.alt}
                              fill
                              sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                              className="object-cover object-top transition-transform duration-500 ease-out group-hover/img:scale-[1.03]"
                            />
                            {/* Hover-Overlay mit CTA */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/img:opacity-100"
                              style={{ background: "rgba(3,2,10,0.55)" }}
                            >
                              <span
                                className="flex items-center gap-2 rounded-full px-4 py-2 text-[11.5px] font-semibold text-white"
                                style={{
                                  background: "var(--accent)",
                                  boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                                  <path d="M15 3h6v6M10 14L21 3M9 3H3v18h18v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Details ansehen
                              </span>
                            </div>
                          </div>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.article>
            );
          })}
        </div>
      </div>

      {/* ── Detail-Modal ── */}
      <AnimatePresence>
        {modal && <SystemDetailModal card={modal} onClose={closeModal} />}
      </AnimatePresence>
    </section>
  );
}

function SystemDetailModal({
  card,
  onClose,
}: {
  card: SystemCard;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={card.title}
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto p-4 sm:p-8"
      style={{ background: "rgba(3,2,10,0.88)", backdropFilter: "blur(10px)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 14 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[1100px] overflow-hidden rounded-3xl"
        style={{
          background:
            "linear-gradient(160deg, rgba(18,14,36,0.98) 0%, rgba(8,6,18,0.98) 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow:
            "0 40px 120px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
        }}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Schließen"
          className="absolute right-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white/60 transition-all hover:bg-white/10 hover:text-white"
          style={{ border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>

        <div className="flex flex-col lg:flex-row">
          {/* ── Left: Text ── */}
          <div className="flex flex-col justify-center p-8 lg:w-[42%] lg:p-10">
            {/* Eyebrow */}
            <span
              className="mb-3 inline-block text-[10px] font-semibold uppercase tracking-[0.30em]"
              style={{ color: "var(--accent)" }}
            >
              Systemkategorie
            </span>

            {/* Icon + Title */}
            <div className="mb-2 flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "var(--accent)",
                }}
              >
                {card.icon}
              </div>
              <h2
                className="text-[1.45rem] leading-tight text-white sm:text-[1.7rem]"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
              >
                {card.title}
              </h2>
            </div>

            {/* Tagline */}
            <p
              className="mb-4 text-[14px] font-medium"
              style={{ color: "var(--accent)" }}
            >
              {card.tagline}
            </p>

            {/* Description */}
            <p className="mb-6 text-[13.5px] leading-[1.7] text-white/60">
              {card.desc}
            </p>

            {/* Full Feature List */}
            <div
              className="rounded-2xl p-5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <p
                className="mb-3 text-[10px] font-semibold uppercase tracking-[0.22em]"
                style={{ color: "var(--accent)" }}
              >
                Leistungsumfang
              </p>
              <ul className="space-y-2.5">
                {card.details.map((d) => (
                  <li
                    key={d}
                    className="flex items-start gap-3 text-[12.5px] leading-[1.55] text-white/75"
                  >
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden
                      className="mt-0.5 shrink-0"
                      style={{ color: "var(--accent)" }}
                    >
                      <path
                        d="M5 12l5 5L20 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {d}
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#kontakt"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: "var(--accent)", boxShadow: "0 6px 24px rgba(0,0,0,0.35)" }}
              >
                Anfrage stellen
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-[13px] font-medium text-white/70 transition-colors hover:border-white/20 hover:text-white"
                style={{ borderColor: "rgba(255,255,255,0.1)" }}
              >
                Schließen
              </button>
            </div>
          </div>

          {/* ── Right: Image ── */}
          <div
            className="relative flex-1 overflow-hidden lg:rounded-r-3xl"
            style={{
              borderLeft: "1px solid rgba(255,255,255,0.07)",
              minHeight: "340px",
            }}
          >
            <Image
              src={card.image}
              alt={card.alt}
              fill
              sizes="(min-width: 1024px) 640px, 100vw"
              className="object-cover object-top"
              priority
            />
            {/* subtle bottom fade */}
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-20 lg:hidden"
              style={{
                background:
                  "linear-gradient(to top, rgba(8,6,18,0.95), transparent)",
              }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = true,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-[760px] text-center" : ""}>
      <span
        className="text-[10.5px] font-medium uppercase tracking-[0.30em]"
        style={{ color: "var(--accent)" }}
      >
        {eyebrow}
      </span>
      <h2
        className="mt-3 text-[2rem] leading-[1.12] tracking-[-0.02em] text-white sm:text-[2.5rem]"
        style={{ fontFamily: "var(--font-headline), system-ui, sans-serif", fontWeight: 300 }}
      >
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-[14.5px] leading-[1.6] text-white/55">{subtitle}</p>
      )}
    </div>
  );
}

/* ── Icons ── */
function GlobeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="16" rx="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9h16M8 3v4M16 3v4M9 14h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function FunnelIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function UsersIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.5M16.5 19a5.5 5.5 0 0 0-2-4.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
function PlatformIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="4" width="8" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="13" y="11" width="8" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <rect x="3" y="14" width="8" height="6" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
function ErpIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 7l8-4 8 4-8 4-8-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M4 7v10l8 4 8-4V7M12 11v10" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function SparkIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
function PlugIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 2v5M15 2v5M7 7h10v3a5 5 0 0 1-10 0V7ZM12 15v5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
