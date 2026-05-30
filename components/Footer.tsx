"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useBrand } from "@/contexts/BrandContext";
import { resolveBrandNavHref } from "@/lib/brandNav";

const socialLinks = [
  {
    name: "LinkedIn",
    href: "https://www.linkedin.com/in/CelinaSiebeneicher",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
    color: "hover:text-[#0077B5]",
  },
  {
    name: "Instagram",
    href: "https://instagram.com/nexcel.ai",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
      </svg>
    ),
    color: "hover:text-[#E4405F]",
  },
  {
    name: "YouTube",
    href: "https://youtube.com/@nexcelai",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    ),
    color: "hover:text-[#FF0000]",
  },
];

export default function Footer() {
  const pathname = usePathname();
  const brand = useBrand();
  const { footer } = brand;
  const accentColor = brand.theme.accentPrimary;
  const isContactPage = pathname === "/kontakt" || pathname === "/agiworks/kontakt";
  const isProjektePage = pathname === "/projekte";
  const isImpressumPage = pathname === "/impressum";
  const isDemoPage = pathname?.startsWith("/demo") || pathname === "/login" || pathname === "/demo-anfordern";
  const isPreiskalkulatorPage =
    pathname === "/preiskalkulator" || pathname === "/agiworks/preiskalkulator";
  const isSystemanalysePage =
    pathname === "/systemanalyse" || pathname?.startsWith("/agiworks/systemanalyse");

  return (
    <footer className="relative border-t border-[#A45CFF]/10 bg-gradient-to-b from-transparent to-[#0C0F1A]">
      {/* CTA Section */}
      {!isContactPage && !isProjektePage && !isImpressumPage && !isDemoPage && !isPreiskalkulatorPage && !isSystemanalysePage && (
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
                  background: "var(--brand-gradient)",
                  fontFamily: "var(--font-headline), system-ui, sans-serif",
                  letterSpacing: "0.16em",
                  border: "1px solid color-mix(in srgb, #ffffff 16%, transparent)",
                  boxShadow:
                    "0 10px 30px var(--brand-glow-mid), inset 0 1px 0 rgba(255,255,255,0.18)",
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
                  href={resolveBrandNavHref("/preiskalkulator", brand.id)}
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
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 sm:gap-6 md:gap-8 lg:gap-12 mb-8 sm:mb-10 md:mb-12">
          {/* Brand Column */}
          <motion.div
            className="col-span-2 md:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link href={brand.navigation.baseHref} className="inline-block mb-3 sm:mb-4">
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

          {/* Produkte */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <h4 className="text-[#FFFFFF] font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Produkte
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

          {/* Lösungen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h4 className="text-[#FFFFFF] font-semibold text-xs sm:text-sm uppercase tracking-wider mb-3 sm:mb-4">
              Lösungen
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

          {/* Unternehmen */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
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
          <div className="flex items-center gap-4 sm:gap-6 text-[10px] sm:text-xs text-[#9CA3AF]">
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
