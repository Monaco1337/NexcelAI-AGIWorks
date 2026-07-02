import type { BrandConfig } from "@/types/brand";
import { agiworksTheme } from "./themePresets";

export const agiworksBrand: BrandConfig = {
  id: "agiworks",
  name: "AGI Works",
  wizardSignatureProduct: "Systemanalyse",
  theme: agiworksTheme(),
  seo: {
    title: "AGI Works • Digitale Betriebssysteme für Unternehmen",
    description:
      "Individuelle Software- und KI-Systeme — technisch präzise, skalierbar und auf Ihre Prozesse zugeschnitten.",
    ogTitle: "AGI Works • Digitale Betriebssysteme",
    ogDescription:
      "Systementwicklung und Operations Intelligence für den Mittelstand.",
  },
  navigation: {
    logoText: "AGI",
    logoTextAccent: "WORKS",
    logoTextGradient: "linear-gradient(135deg, #F0F7FF 0%, #B5D8FF 100%)",
    logoAccentGradient: "linear-gradient(135deg, #B5D8FF 0%, #3A8EE6 100%)",
    baseHref: "/",
    logoMark: {
      src: "/images/logos/agiworks-logo.png",
      alt: "AGI Works Logo",
      size: 36,
      removeWhiteBg: true,
    },
    partnerLabel: "in Kooperation mit",
    partnerName: "NEXCEL AI",
  },
  hero: {
    metaTags: ["Betriebssysteme", "Enterprise Software", "Operations"],
    headlineLead: "Betriebssysteme",
    headlineLeadSuffix: "für Unternehmen.",
    headlineStack: [
      "Individuell entwickelt.",
      "Technisch präzise.",
      "Skalierbar im Betrieb.",
    ],
    headline1: "Digitale",
    headline2: "Betriebssysteme.",
    subline:
      "Software und KI-Infrastruktur, die Ihre Abläufe strukturieren, automatisieren und messbar beschleunigen.",
    ctaPrimary: { text: "Projekt besprechen", href: "/kontakt" },
    ctaSecondary: { text: "Systemanalyse", href: "/systemanalyse" },
  },
  capabilities: {
    headline: "Was AGI Works liefert",
    subtext:
      "Von der Architektur bis zum Betrieb — Systeme, die in Ihrer Organisation tragen.",
    cards: [
      {
        id: "os-layer",
        title: "Betriebssystem-Layer",
        desc: "Zentrale Steuerung für Daten, Prozesse und Schnittstellen.",
        bullets: ["Single Source of Truth", "API-First", "Observability"],
        icon: "server",
      },
      {
        id: "ai-layer",
        title: "KI-Schicht",
        desc: "Agenten und Automatisierung mit klaren Guardrails.",
        bullets: ["On-Premise-fähig", "RAG-Pipelines", "Human-in-the-loop"],
        icon: "chip",
      },
      {
        id: "delivery",
        title: "Delivery & Betrieb",
        desc: "Schnelle Iterationen mit Enterprise-Qualität.",
        bullets: ["CI/CD", "SLA-Monitoring", "Security by Design"],
        icon: "lock",
      },
    ],
  },
  portfolio: {
    headline: "Systeme im Einsatz",
    subtext: "Referenzarchitekturen und produktive Implementierungen.",
    filterTags: ["Alle", "Plattform", "KI", "Kollaboration"],
    projects: [],
  },
  systems: [],
  about: {
    founder: {
      name: "Kevin Blazevic",
      role: "Gründer · Software- & Plattformarchitekt",
      image: "/images/team/kevin-blazevic.svg",
      imageAlt: "Kevin Blazevic — AGI Works",
      imagePosition: "center",
    },
    heroLead:
      "AGI Works baut das System — Softwarearchitektur, Plattformen, Infrastruktur und Backend-Systeme, die in Ihrer Organisation tragen.",
    heroSecondary:
      "Technische Präzision, saubere Architektur und direkte Umsetzung ohne Umwege.",
    visionParagraphs: [
      "Unternehmen brauchen keine weiteren Tools — sie brauchen ein System, das Daten, Teams und Entscheidungen zusammenführt.",
      "AGI Works liefert diese Schicht: stabil, erweiterbar und auf Ihre Realität zugeschnitten.",
    ],
    values: [
      { title: "Systemdenken", description: "Architektur vor Feature-Listen." },
      { title: "Tempo mit Qualität", description: "Kurze Zyklen, saubere Releases." },
      { title: "Transparenz", description: "Klare Kommunikation auf Augenhöhe." },
      { title: "Langfristigkeit", description: "Wartbarkeit und Skalierung von Tag eins." },
    ],
    milestones: [
      { year: "2025", title: "AGI Works", description: "Launch der Enterprise-Systemmarke." },
    ],
    standForTitle: "Wofür AGI Works steht",
    standForText:
      "Betriebssysteme für digitale Arbeit — individuell, technisch fundiert und betriebsbereit.",
    skills: [
      "Softwarearchitektur",
      "Plattformentwicklung",
      "Infrastruktur & Backend",
      "Systemintegration & DevOps",
    ],
  },
  contactPage: {
    headlineAccent: "Kontakt",
    subline: "Schildern Sie Ihr Vorhaben — wir antworten mit einem konkreten nächsten Schritt.",
    submitLabel: "Nachricht senden",
    successTitle: "Nachricht gesendet",
    successMessage: "Vielen Dank — wir melden uns in Kürze.",
    directIntro: "Direkt erreichbar:",
    direct: {
      email: "info@agiworks.de",
      phone: "+49 176 23280935",
      phoneHref: "tel:+4917623280935",
      location: "Hansastraße 34, 59423 Unna, Deutschland",
    },
  },
  pricingPage: {
    titleAccent: "Preiskalkulator",
    subline: "Orientierung für individuelle Systemprojekte — transparent und nachvollziehbar.",
    offerCtaLabel: "Angebot anfordern",
    offerSubmitLabel: "Anfrage senden",
    successMessage: "Ihre Anfrage wurde übermittelt.",
  },
  footer: {
    tagline: "Digitale Betriebssysteme und KI-Infrastruktur für Unternehmen.",
    ctaTitle: "Ihr nächstes System beginnt hier.",
    ctaSubline: "Von der Analyse bis zum produktiven Betrieb — ein Team, eine Architektur.",
    ctaButtonText: "Projekt besprechen",
    // Public hrefs on agiworks.de are CLEAN. The middleware rewrites clean paths
    // to the internal /agiworks/* app subtree — no /agiworks prefix is ever
    // rendered in a public anchor, sitemap URL or canonical.
    ctaButtonHref: "/kontakt",
    links: {
      // Spalte „Systeme"
      products: [
        { label: "Systeme im Überblick", href: "/#systeme" },
        { label: "Leistungen", href: "/leistungen" },
        { label: "Standorte", href: "/standorte" },
        { label: "Projekte", href: "/projekte" },
        { label: "Preise", href: "/preise" },
      ],
      // Spalte „Ressourcen"
      solutions: [
        { label: "Systemanalyse", href: "/systemanalyse" },
        { label: "Wissen", href: "/wissen" },
        { label: "Preiskalkulator", href: "/preiskalkulator" },
      ],
      // Spalte „Unternehmen"
      company: [
        { label: "Über uns", href: "/ueber-mich" },
        { label: "Kontakt", href: "/kontakt" },
      ],
      // Spalte „Rechtliches"
      legal: [
        { label: "Impressum", href: "/impressum" },
        { label: "Datenschutz", href: "/datenschutz" },
        { label: "Cookie-Richtlinie", href: "/cookie-richtlinie" },
        { label: "AGB", href: "/agb" },
        { label: "Vertragsverarbeitung", href: "/vertragsverarbeitung" },
      ],
    },
    contact: {
      email: "info@agiworks.de",
    },
    copyright: `© ${new Date().getFullYear()} AGI Works. Alle Rechte vorbehalten.`,
  },
};
