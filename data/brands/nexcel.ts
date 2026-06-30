import type { BrandConfig } from "@/types/brand";
import { nexcelTheme } from "./themePresets";

export const nexcelBrand: BrandConfig = {
  id: "nexcel",
  name: "NEXCEL AI",
  wizardSignatureProduct: "Systemanalyse",
  theme: nexcelTheme(),
  seo: {
    title: "NEXCEL AI • Unternehmenssysteme, Prozesse & Customer Experience",
    description:
      "Wir gestalten Unternehmenssysteme: Systemdesign, Prozessdesign, Branding, Customer Experience und Automatisierung — die Struktur, auf der Ihr Unternehmen läuft.",
    ogTitle: "NEXCEL AI • Unternehmenssysteme",
    ogDescription:
      "Systemdesign, Prozesse, Branding und Automatisierung — digitale Betriebsmodelle für Unternehmen.",
  },
  navigation: {
    logoText: "NEXCEL",
    logoTextAccent: "AI",
    logoTextGradient: "linear-gradient(135deg, #F5F3FF 0%, #C4B5FD 100%)",
    logoAccentGradient: "linear-gradient(135deg, #C4B5FD 0%, #8B5CF6 100%)",
    baseHref: "/",
    partnerLabel: "in Kooperation mit",
    partnerName: "AGI Works",
  },
  hero: {
    metaTags: ["Unternehmenssysteme", "Systemdesign", "Customer Experience"],
    headline1: "Wir gestalten Unternehmenssysteme,",
    headline2: "auf denen Ihr Unternehmen läuft.",
    subline:
      "Systemdesign, Prozessdesign, Branding und Automatisierung – verbunden zu einem digitalen Betriebsmodell, das skaliert.",
    ctaPrimary: { text: "Projekt besprechen", href: "/kontakt" },
    ctaSecondary: { text: "Systemanalyse starten", href: "/systemanalyse" },
  },
  capabilities: {
    headline: "Was NEXCEL AI gestaltet",
    subtext:
      "Vom Systemdesign bis zur Customer Experience – Strukturen, die Prozesse, Menschen und Technologie zusammenführen.",
    cards: [
      {
        id: "ai-systems",
        title: "Unternehmensarchitektur",
        desc: "Systeme, Strukturen und Prozesse als ein durchdachtes Ganzes.",
        bullets: ["Systemdesign", "Prozessdesign", "Digitale Betriebsmodelle"],
        icon: "brain",
      },
      {
        id: "automation",
        title: "Branding & Customer Experience",
        desc: "Marke, Kommunikation und Kundenerlebnis mit klarer Struktur.",
        bullets: ["Markenführung", "CX-Design", "Customer Journeys"],
        icon: "globe",
      },
      {
        id: "platforms",
        title: "Automatisierung & KI-Integration",
        desc: "Wiederkehrende Abläufe werden zu zuverlässigen, skalierbaren Systemen.",
        bullets: ["Workflow-Automation", "KI-Integration", "Skalierbare Strukturen"],
        icon: "gears",
      },
    ],
  },
  portfolio: {
    headline: "Tech Vision Lab",
    subtext: "Ausgewählte Systeme und Produkte im Einsatz.",
    filterTags: ["Alle", "KI", "Plattform", "Automation"],
    projects: [],
  },
  systems: [],
  about: {
    founder: {
      name: "Celina Siebeneicher",
      role: "Gründerin · Systemdesignerin & Unternehmensarchitektin",
      image: "/images/hero/nexcel-system-architecture.png",
      imageAlt: "Celina Siebeneicher — NEXCEL AI",
      imagePosition: "center top",
    },
    heroLead:
      "Systemdesign, Unternehmensarchitektur, Branding und Customer Experience — für Unternehmen, die mehr als Standardsoftware brauchen.",
    heroSecondary:
      "Von der ersten Diagnose bis zum funktionierenden Betriebsmodell: transparent, direkt und ohne Agenturfilter.",
    visionParagraphs: [
      "Wir bauen keine Tools — wir entwickeln Unternehmenssysteme, die Prozesse, Menschen und Technologie in einer funktionierenden Struktur zusammenführen.",
      "Unser Anspruch: Enterprise-Niveau in Architektur, Customer Experience und Prozessdesign — ohne die Komplexität eines Großkonzern-Projekts.",
    ],
    values: [
      { title: "Klare Systeme", description: "Intuitive Architekturen statt komplizierter Lösungen." },
      { title: "Schnelle Umsetzung", description: "Funktionierende Systeme, nicht nur Versprechungen." },
      { title: "Skalierbare Architektur", description: "Lösungen, die mit Ihrem Unternehmen wachsen." },
      { title: "Direkte Zusammenarbeit", description: "Sie arbeiten direkt mit den Entwicklern." },
    ],
    milestones: [
      { year: "2024", title: "NEXCEL AI", description: "Launch der Operations-Intelligence-Plattform." },
      { year: "2025", title: "Systemanalyse", description: "KI-gestützte Unternehmensdiagnostik im Produktivbetrieb." },
    ],
    standForTitle: "Wofür wir stehen",
    standForText:
      "Durchdachte Unternehmenssysteme statt Einheitslösungen — Strukturen, die Prozesse vereinfachen, die Marke schärfen und das Erlebnis verbessern.",
    skills: [
      "Unternehmensarchitektur",
      "Systemdesign & Prozessdesign",
      "Branding & Customer Experience",
      "Automatisierung & KI-Integration",
    ],
  },
  contactPage: {
    headlineAccent: "Kontakt",
    subline: "Beschreiben Sie Ihr Vorhaben — wir melden uns zeitnah mit einem klaren nächsten Schritt.",
    submitLabel: "Nachricht senden",
    successTitle: "Nachricht gesendet",
    successMessage: "Vielen Dank — wir melden uns in Kürze bei Ihnen.",
    directIntro: "Direkt erreichbar:",
    direct: {
      email: "info@nexcelai.de",
      phone: "+49 151 00000000",
      phoneHref: "tel:+4915100000000",
      location: "Ziegelstraße 9, 59423 Unna, Deutschland",
    },
  },
  pricingPage: {
    titleAccent: "Preiskalkulator",
    subline: "Transparente Orientierung für Ihr individuelles System — ohne versteckte Posten.",
    offerCtaLabel: "Angebot anfordern",
    offerSubmitLabel: "Anfrage senden",
    successMessage: "Ihre Anfrage wurde übermittelt. Wir melden uns mit einer ersten Einschätzung.",
  },
  footer: {
    tagline: "Unternehmenssysteme: Systemdesign, Prozesse, Branding und Automatisierung.",
    ctaTitle: "Bereit für Ihr nächstes System?",
    ctaSubline: "Von der Diagnose bis zur produktiven Lösung — ein Ansprechpartner, ein Team.",
    ctaButtonText: "Projekt besprechen",
    ctaButtonHref: "/kontakt",
    links: {
      // Spalte „Systeme"
      products: [
        { label: "Systeme im Überblick", href: "/#systeme" },
        { label: "Projekte", href: "/#projekte" },
        { label: "Preise", href: "/#preise" },
      ],
      // Spalte „Ressourcen"
      solutions: [
        { label: "Systemanalyse", href: "/systemanalyse" },
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
        { label: "AGB", href: "/agb" },
        { label: "Vertragsverarbeitung", href: "/vertragsverarbeitung" },
      ],
    },
    contact: {
      email: "info@nexcelai.de",
    },
    copyright: `© ${new Date().getFullYear()} NEXCEL AI. Alle Rechte vorbehalten.`,
  },
};
