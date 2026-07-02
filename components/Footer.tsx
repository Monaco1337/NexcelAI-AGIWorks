"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/contexts/BrandContext";
import { AgiWorksLogoMark } from "@/components/ui/AgiWorksLogoMark";
import { AgiWorksLogo } from "@/components/ui/AgiWorksLogo";
import { NexcelLogoMark } from "@/components/ui/NexcelLogoMark";

const linkedInIcon = (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const SOCIAL_LINKS_BY_BRAND: Record<string, { name: string; href: string; icon: React.ReactNode; color: string }[]> = {
  nexcel: [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/CelinaSiebeneicher",
      icon: linkedInIcon,
      color: "hover:text-[#0077B5]",
    },
  ],
  agiworks: [
    {
      name: "LinkedIn",
      href: "https://www.linkedin.com/in/kevin-blazevic-1b9695ba/",
      icon: linkedInIcon,
      color: "hover:text-[#0077B5]",
    },
  ],
};

export default function Footer() {
  const pathname = usePathname();
  const brand = useBrand();
  const { footer } = brand;
  const accentColor = brand.theme.accentPrimary;
  const socialLinks = SOCIAL_LINKS_BY_BRAND[brand.id] ?? SOCIAL_LINKS_BY_BRAND.nexcel;
  const isContactPage = pathname === "/kontakt" || pathname === "/agiworks/kontakt";
  const isProjektePage = pathname === "/projekte";
  const isImpressumPage = pathname === "/impressum";
  const isCookieRichtliniePage =
    pathname === "/cookie-richtlinie" || pathname === "/agiworks/cookie-richtlinie";
  const isDemoPage = pathname?.startsWith("/demo") || pathname === "/login" || pathname === "/demo-anfordern";
  const isPreiskalkulatorPage =
    pathname === "/preiskalkulator" || pathname === "/agiworks/preiskalkulator" ||
    pathname === "/preise" || pathname === "/agiworks/preise";
  const isSystemanalysePage =
    pathname === "/systemanalyse" || pathname?.startsWith("/agiworks/systemanalyse");

  return (
    <footer className="relative border-t border-[#A45CFF]/10 bg-gradient-to-b from-transparent to-[#0C0F1A]">
      {/* CTA Section */}
      {!isContactPage && !isProjektePage && !isImpressumPage && !isCookieRichtliniePage && !isDemoPage && !isPreiskalkulatorPage && !isSystemanalysePage && (
        <motion.section
          aria-labelledby="footer-cta-title"
          className="relative overflow-hidden px-5 py-[clamp(6rem,13vw,9.5rem)] sm:px-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-12%" }}
          transition={{ duration: 0.9 }}
        >
          {/* Atmosphäre — feine Hairline oben */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-px max-w-[48rem] bg-gradient-to-r from-transparent via-white/[0.08] to-transparent"
            aria-hidden
          />
          {/* Radialer Brand-Glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[150%] w-[120%] -translate-x-1/2 -translate-y-1/2"
            style={{
              background:
                "radial-gradient(45% 55% at 50% 42%, var(--brand-glow-mid) 0%, var(--brand-plateau-1) 30%, transparent 68%)",
              filter: "blur(8px)",
            }}
          />
          {/* Dezentes Raster */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
              maskImage:
                "radial-gradient(ellipse 60% 60% at 50% 45%, #000 20%, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 60% 60% at 50% 45%, #000 20%, transparent 75%)",
            }}
          />

          <div className="relative z-10 mx-auto flex max-w-[680px] flex-col items-center text-center">
            <motion.h3
              id="footer-cta-title"
              className="text-balance text-[clamp(2rem,5.4vw,3.25rem)] leading-[1.06] tracking-[-0.04em] text-white"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
              }}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <span
                style={{
                  background: "var(--brand-headline-gradient)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  fontWeight: 400,
                  filter: "drop-shadow(0 0 32px var(--brand-glow-strong))",
                }}
              >
                {footer.ctaTitle}
              </span>
            </motion.h3>

            <motion.p
              className="mt-5 max-w-[42ch] text-pretty text-[15px] leading-[1.65] text-white/55 sm:text-[16px]"
              style={{
                fontFamily: "var(--font-headline), system-ui, sans-serif",
                fontWeight: 300,
              }}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            >
              {footer.ctaSubline}
            </motion.p>

            <motion.div
              className="mt-11 flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Primary — gefüllter Gradient-Button, clean & edel */}
              <Link
                href={footer.ctaButtonHref}
                prefetch={true}
                className="group/cta-primary relative inline-flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full px-9 py-[15px] text-[12.5px] font-medium uppercase text-white transition-all duration-300 hover:-translate-y-0.5 sm:w-auto sm:text-[13px]"
                style={{
                  background: "color-mix(in srgb, var(--accent) 16%, rgba(255,255,255,0.03))",
                  border: "1px solid color-mix(in srgb, var(--accent) 48%, transparent)",
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  letterSpacing: "0.16em",
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 4px 24px color-mix(in srgb, var(--accent) 20%, transparent), inset 0 1px 0 rgba(255,255,255,0.10)",
                }}
              >
                {/* Feiner Top-Glanz statt grellem Sheen */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-1/2 rounded-t-full"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0) 100%)",
                  }}
                />
                <span className="relative">{footer.ctaButtonText}</span>
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  aria-hidden
                  className="relative transition-transform duration-500 group-hover/cta-primary:translate-x-1"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              {(brand.id === "nexcel" || brand.id === "agiworks") && (
                <Link
                  href="/preiskalkulator"
                  prefetch={true}
                  className="group/secondary relative inline-flex w-full items-center justify-center gap-2.5 rounded-full px-8 py-4 text-[12.5px] uppercase transition-all duration-500 hover:gap-3.5 sm:w-auto sm:text-[13px]"
                  style={{
                    color: "rgba(255,255,255,0.9)",
                    background: "transparent",
                    border: "1px solid var(--brand-card-border)",
                    fontFamily: "var(--font-headline), system-ui, sans-serif",
                    letterSpacing: "0.18em",
                    fontWeight: 500,
                  }}
                >
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-full opacity-0 transition-opacity duration-500 group-hover/secondary:opacity-100"
                    style={{
                      border: "1px solid var(--brand-line-mid)",
                      boxShadow: "0 0 28px var(--brand-glow-mid)",
                    }}
                  />
                  <span className="relative">Preis berechnen</span>
                  <svg
                    className="relative h-3 w-3 shrink-0 transition-transform duration-500 group-hover/secondary:translate-x-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              )}
            </motion.div>

            {/* Trust-Zeile — Conversion-Reassurance */}
            <motion.ul
              className="mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-3"
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.85, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            >
              {[
                "Unverbindlich & kostenlos",
                "Antwort innerhalb von 24 Stunden",
                "Direkt mit den Gründern",
              ].map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 text-[12px] text-white/45 sm:text-[12.5px]"
                  style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden
                    className="shrink-0"
                  >
                    <circle cx="12" cy="12" r="9" stroke="var(--accent)" strokeWidth="1.4" opacity="0.85" />
                    <path
                      d="m8.5 12 2.5 2.5 4.5-5"
                      stroke="var(--accent)"
                      strokeWidth="1.7"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {item}
                </li>
              ))}
            </motion.ul>
          </div>
        </motion.section>
      )}

      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10 md:py-12 lg:py-16">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-x-6 gap-y-8 sm:gap-6 md:gap-8 lg:gap-12 mb-8 sm:mb-10 md:mb-12">
          {/* Brand Column */}
          <motion.div
            className="col-span-2 md:col-span-2 pb-6 border-b border-white/[0.06] md:pb-0 md:border-0"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link href={brand.navigation.baseHref} className="inline-block mb-3 sm:mb-4">
              <div className="flex items-center gap-2 sm:gap-2.5">
                {/* AGI Works: icon mark before text */}
                {brand.navigation.logoMark?.removeWhiteBg && (
                  <AgiWorksLogoMark
                    size={28}
                    className="h-7 w-7 shrink-0 sm:h-8 sm:w-8"
                    glow="drop-shadow(0 1px 6px rgba(0,0,0,0.5)) drop-shadow(0 0 14px rgba(91,184,255,0.45))"
                  />
                )}
                {brand.navigation.wordmark ? (
                  brand.id === "agiworks" ? (
                    <AgiWorksLogo width={176} />
                  ) : (
                    <NexcelLogoMark width={168} />
                  )
                ) : (
                  <div
                    className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight"
                    style={{
                      fontFamily: "var(--font-headline), -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    <span
                      className="inline-block"
                      style={{
                        background: brand.navigation.logoTextGradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {brand.navigation.logoText}
                    </span>
                    <span
                      className="inline-block ml-0.5 sm:ml-1"
                      style={{
                        background: brand.navigation.logoAccentGradient,
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                      }}
                    >
                      {brand.navigation.logoTextAccent}
                    </span>
                  </div>
                )}
              </div>
            </Link>
            <p className="text-[#9CA3AF] text-xs sm:text-sm font-light leading-relaxed mb-4 sm:mb-5 md:mb-6 max-w-xs">
              {footer.tagline}
            </p>
            
            {/* Social Media */}
            <div className="flex items-center gap-3 sm:gap-4">
              {socialLinks.map((social, index) => (
                <motion.a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-[#9CA3AF] transition-all duration-300 ${social.color}`}
                  style={{
                    background: "rgba(255, 255, 255, 0.05)",
                    border: "1px solid rgba(164, 92, 255, 0.1)",
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{
                    scale: 1.1,
                    background: "rgba(255, 255, 255, 0.1)",
                    borderColor: "rgba(164, 92, 255, 0.3)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  aria-label={social.name}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Systeme */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-[#FFFFFF] font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Systeme
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {footer.links.products.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#9CA3AF] transition-colors duration-300 text-xs sm:text-sm font-light group flex items-center gap-2 hover:text-[var(--accent)]"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: accentColor }}>→</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Unternehmen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-[#FFFFFF] font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Unternehmen
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {footer.links.company.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#9CA3AF] transition-colors duration-300 text-xs sm:text-sm font-light group flex items-center gap-2 hover:text-[var(--accent)]"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: accentColor }}>→</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Ressourcen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <h4 className="text-[#FFFFFF] font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Ressourcen
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {footer.links.solutions.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#9CA3AF] transition-colors duration-300 text-xs sm:text-sm font-light group flex items-center gap-2 hover:text-[var(--accent)]"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: accentColor }}>→</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Rechtliches */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <h4 className="text-[#FFFFFF] font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Rechtliches
            </h4>
            <ul className="space-y-2 sm:space-y-3">
              {footer.links.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-[#9CA3AF] transition-colors duration-300 text-xs sm:text-sm font-light group flex items-center gap-2 hover:text-[var(--accent)]"
                  >
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{ color: accentColor }}>→</span>
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          className="pt-6 sm:pt-8 border-t border-[#A45CFF]/10 flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          <p className="text-[#9CA3AF] text-[10px] sm:text-xs font-light text-center md:text-left">
            {footer.copyright.replace(/©\s*\d{4}/, `© ${new Date().getFullYear()}`)}
          </p>
          <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-[#9CA3AF]">
            <span className="font-light">Made with</span>
            <motion.span
              className="text-[#A45CFF]"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              ♥
            </motion.span>
            <span className="font-light">in Deutschland</span>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
