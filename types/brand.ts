// ═══════════════════════════════════════════════════════════════
// MULTI-BRAND TYPE SYSTEM
// Shared across NEXCEL AI and AGI Works
// ═══════════════════════════════════════════════════════════════

export type BrandId = "nexcel" | "agiworks";

export interface BrandTheme {
  accentPrimary: string;
  accentSecondary: string;
  accentGlow: string;
  accentRgb: string;
  cssVars: {
    "--accent": string;
    "--accent-2": string;
    "--accent-glow": string;
    "--accent-rgb": string;

    /** Semantic core tokens — Markenname + Default-Akzent */
    "--brand-primary"?: string;
    "--brand-accent"?: string;
    "--brand-glow"?: string;
    "--brand-gradient"?: string;

    /** Section-Backgrounds (durchgehende Atmosphäre) */
    "--brand-bg-top"?: string;
    "--brand-bg-mid"?: string;
    "--brand-bg-bottom"?: string;

    /** Stream- und Linien-Farben (Bezier-Pfade zwischen Sections) */
    "--brand-line-dim"?: string;
    "--brand-line-mid"?: string;
    "--brand-line-bright"?: string;

    /** Glow-Layer für radiale Atmosphäre (z. B. radial-gradients in Backdrops) */
    "--brand-glow-soft"?: string;
    "--brand-glow-mid"?: string;
    "--brand-glow-strong"?: string;

    /** Light-Burst (fokussierter Lichtkanal an Section-Naht) */
    "--brand-burst-core"?: string;
    "--brand-burst-mid"?: string;
    "--brand-burst-tail"?: string;

    /** Plateau-Stufen (5-stufiges violet/cyan Bridge-Plateau zwischen Sections) */
    "--brand-plateau-1"?: string;
    "--brand-plateau-2"?: string;
    "--brand-plateau-3"?: string;
    "--brand-plateau-4"?: string;
    "--brand-plateau-5"?: string;

    /** Card-Tokens (System-Showcase + Hover-States) */
    "--brand-card-border"?: string;
    "--brand-card-glow"?: string;
    "--brand-card-glow-hover"?: string;

    /** Headline-Gradient (Brand-Wash über große Texte) */
    "--brand-headline-gradient"?: string;
    /** Generischer Brand-Wash für Buttons/Pills/Borders */
    "--brand-wash"?: string;

    /** Filter-Pill / Selected-State */
    "--brand-pill-active"?: string;
    "--brand-pill-active-glow"?: string;

    [key: string]: string | undefined;
  };
}

export interface BrandSEO {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

/**
 * Optionales Bild-Logo (Mark), das vor dem Wortmark gerendert wird.
 * Wenn gesetzt, zeigt die Navigation eine Mark+Wordmark-Kombination,
 * sonst nur das Text-Logo (logoText / logoTextAccent).
 */
export interface BrandLogoMark {
  /** Pfad zum SVG/PNG (idealerweise SVG für Skalierung) */
  src: string;
  /** A11y-Label */
  alt: string;
  /** Anzeigegröße (px) im Standard-Header */
  size?: number;
}

export interface BrandNavigation {
  logoText: string;
  logoTextAccent: string;
  logoTextGradient: string;
  logoAccentGradient: string;
  baseHref: string;
  /**
   * Optionales grafisches Logo-Element (Mark) — wird vor dem Wortmark gezeigt.
   * NEXCEL AI: nicht gesetzt → nur Wortmark.
   * AGI WORKS: silberner Ring + blaues Swoosh-A.
   */
  logoMark?: BrandLogoMark;
}

export interface BrandHeroProofStat {
  /** Vorangestellter Marker (z.B. „+", „⌀" oder „×") — optional */
  prefix?: string;
  /** Hauptkennzahl (z.B. „127", „68%", „3.2x") */
  value: string;
  /** Knappes Label (1–3 Wörter) */
  label: string;
}

export interface BrandHero {
  metaTags: string[];
  headline1: string;
  headline2: string;
  /**
   * Optionaler dominanter Lead-Begriff (z.B. „Betriebssysteme").
   * Wenn gesetzt, wird die Hero-Typografie als gestaffelte Hierarchie gerendert
   * und überschreibt die klassische `headline1` / `headline2`-Darstellung.
   */
  headlineLead?: string;
  /** Optionaler kleinerer Suffix direkt nach dem Lead (z.B. „für Unternehmen."). */
  headlineLeadSuffix?: string;
  /** Optionaler vertikal gestackter Sub-Headline-Block mit reduzierter Opazität. */
  headlineStack?: string[];
  /** Optional; wenn leer/fehlend, wird im Hero kein Subtext-Block gerendert. */
  subline?: string;
  /** Optionale Druck-/Tension-Zeile direkt unter Subline (1 Satz, hochkontrastig). */
  pressureLine?: string;
  ctaPrimary: { text: string; href: string };
  ctaSecondary: { text: string; href: string };
  /** Optionaler Proof-Strip oberhalb der CTAs (max. 3 Items) */
  proofStrip?: BrandHeroProofStat[];
}

export type BrandCapabilityIcon =
  | "brain"
  | "phone"
  | "globe"
  | "gears"
  | "chat"
  | "server"
  | "chip"
  | "cloud"
  | "lock";

export interface BrandCapability {
  id: string;
  title: string;
  desc: string;
  bullets: string[];
  icon: BrandCapabilityIcon;
}

export interface BrandCapabilitiesSection {
  headline: string;
  subtext: string;
  cards: BrandCapability[];
}

export type BrandProjectCategory = "own" | "product" | "collaboration";

export interface BrandProject {
  id: string;
  title: string;
  description: string;
  tags: string[];
  image: string;
  href: string;
  cta: string;
  badge?: string;
  category?: BrandProjectCategory;
}

export interface BrandPortfolioSection {
  headline: string;
  subtext: string;
  filterTags: string[];
  projects: BrandProject[];
}

export interface BrandSystem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  category: BrandProjectCategory;
  collaborationBrand?: string;
}

export interface BrandAboutFounder {
  name: string;
  role: string;
  image: string;
  imageAlt: string;
  imagePosition?: string;
}

export interface BrandAboutMilestone {
  year: string;
  title: string;
  description: string;
}

export interface BrandAbout {
  founder: BrandAboutFounder;
  heroLead: string;
  heroSecondary: string;
  visionParagraphs: [string, string];
  values: { title: string; description: string }[];
  milestones: BrandAboutMilestone[];
  standForTitle: string;
  standForText: string;
  skills: string[];
}

export interface BrandContactDirect {
  email: string;
  phone: string;
  phoneHref: string;
  location: string;
}

export interface BrandContactPage {
  headlineAccent: string;
  subline: string;
  submitLabel: string;
  successTitle: string;
  successMessage: string;
  directIntro: string;
  direct: BrandContactDirect;
}

export interface BrandPricingPage {
  titleAccent: string;
  subline: string;
  offerCtaLabel: string;
  offerSubmitLabel: string;
  successMessage: string;
}

export interface BrandFooter {
  tagline: string;
  ctaTitle: string;
  ctaSubline: string;
  ctaButtonText: string;
  ctaButtonHref: string;
  links: {
    products: { label: string; href: string }[];
    solutions: { label: string; href: string }[];
    company: { label: string; href: string }[];
    legal: { label: string; href: string }[];
  };
  contact: {
    email: string;
    phone?: string;
  };
  copyright: string;
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  /** Systemanalyse-Signatur: neutraler Dienst-Text links; „× by {name}“ mit {name} in Markenfarbe */
  wizardSignatureProduct: string;
  theme: BrandTheme;
  seo: BrandSEO;
  navigation: BrandNavigation;
  hero: BrandHero;
  capabilities: BrandCapabilitiesSection;
  portfolio: BrandPortfolioSection;
  systems: BrandSystem[];
  about: BrandAbout;
  contactPage: BrandContactPage;
  pricingPage: BrandPricingPage;
  footer: BrandFooter;
}
