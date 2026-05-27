// ═══════════════════════════════════════════════════════════════
// MULTI-BRAND TYPE SYSTEM
// Shared across NEXCEL AI and AGI Works
// ═══════════════════════════════════════════════════════════════

export type BrandId = "nexcel" | "blaze";

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
    /** Semantic tokens for hero + premium UI (NEXCEL lila / Blaze rallye-rot) */
    "--brand-primary"?: string;
    "--brand-accent"?: string;
    "--brand-glow"?: string;
    "--brand-gradient"?: string;
    [key: string]: string | undefined;
  };
}

export interface BrandSEO {
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
}

export interface BrandNavigation {
  logoText: string;
  logoTextAccent: string;
  logoTextGradient: string;
  logoAccentGradient: string;
  baseHref: string;
}

export interface BrandHero {
  metaTags: string[];
  headline1: string;
  headline2: string;
  subline: string;
  ctaPrimary: { text: string; href: string };
  ctaSecondary: { text: string; href: string };
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
  footer: BrandFooter;
}
