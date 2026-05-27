"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "@/contexts/ThemeContext";
import { useBrand } from "@/contexts/BrandContext";

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
  const { theme } = useTheme();
  const brand = useBrand();
  const { footer } = brand;
  const accentRgb = brand.theme.accentRgb;
  const accentColor = brand.theme.accentPrimary;

  const isContactPage = pathname === "/kontakt" || pathname === "/blaze/kontakt";
  const isProjektePage = pathname === "/projekte";
  const isImpressumPage = pathname === "/impressum";
  const isDemoPage = pathname?.startsWith("/demo") || pathname === "/login" || pathname === "/demo-anfordern";
  const isPreiskalkulatorPage = pathname === "/preiskalkulator";
  const isSystemanalysePage =
    pathname === "/systemanalyse" || pathname?.startsWith("/blaze/systemanalyse");

  return (
    <footer className="relative border-t border-[#A45CFF]/10 bg-gradient-to-b from-transparent to-[#0C0F1A]">
      {/* CTA Section */}
      {!isContactPage && !isProjektePage && !isImpressumPage && !isDemoPage && !isPreiskalkulatorPage && !isSystemanalysePage && (
        <motion.div
          className="relative py-16 px-6 border-b border-[#A45CFF]/10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <motion.h3
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#FFFFFF] mb-3 sm:mb-4 tracking-tight px-2"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              {footer.ctaTitle}
            </motion.h3>
            <motion.p
              className="text-[#E5E7EB] text-sm sm:text-base md:text-lg font-light leading-relaxed mb-6 sm:mb-8 max-w-2xl mx-auto px-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              {footer.ctaSubline}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link href={footer.ctaButtonHref} prefetch={true} className="w-full sm:w-auto">
                <motion.button
                  className="relative px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 rounded-[16px] sm:rounded-[18px] lg:rounded-[20px] font-semibold text-xs sm:text-sm md:text-base tracking-wide overflow-hidden group/cta-footer whitespace-nowrap w-full sm:w-auto"
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ scale: 1.06, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  style={{ willChange: "transform" }}
                >
                  {/* Base Gradient Background - Apple Intelligence Style */}
                  <div
                    className="absolute inset-0 rounded-[20px] transition-all duration-500"
                    style={{
                      background: theme === "dark"
                        ? "linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(139, 92, 246, 0.45) 25%, rgba(99, 102, 241, 0.40) 50%, rgba(139, 92, 246, 0.45) 75%, rgba(168, 85, 247, 0.35) 100%)"
                        : "linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(139, 92, 246, 0.5) 25%, rgba(99, 102, 241, 0.45) 50%, rgba(139, 92, 246, 0.5) 75%, rgba(124, 58, 237, 0.4) 100%)",
                      backdropFilter: "blur(40px) saturate(200%)",
                      WebkitBackdropFilter: "blur(40px) saturate(200%)",
                    }}
                  />

                  {/* Glassmorphic Overlay */}
                  <div
                    className="absolute inset-0 rounded-[20px] transition-all duration-500"
                    style={{
                      background: theme === "dark"
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.12) 30%, rgba(255, 255, 255, 0.08) 60%, rgba(255, 255, 255, 0.04) 100%)"
                        : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.90) 30%, rgba(255, 255, 255, 0.85) 60%, rgba(255, 255, 255, 0.80) 100%)",
                      border: theme === "dark"
                        ? "1px solid rgba(255, 255, 255, 0.25)"
                        : "1px solid rgba(255, 255, 255, 0.4)",
                      boxShadow: theme === "dark"
                        ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset, 0 1px 3px rgba(255, 255, 255, 0.1) inset"
                        : "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 0.3) inset, 0 1px 3px rgba(255, 255, 255, 0.2) inset",
                    }}
                  />

                  {/* Pulsing Neon Outline - Ultra Subtle */}
                  <motion.div
                    className="absolute -inset-[2px] rounded-[22px] pointer-events-none -z-10"
                    animate={{
                      opacity: [0.5, 0.8, 0.5],
                      boxShadow: [
                        "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(99, 102, 241, 0.2)",
                        "0 0 35px rgba(168, 85, 247, 0.6), 0 0 70px rgba(139, 92, 246, 0.5), 0 0 100px rgba(99, 102, 241, 0.4)",
                        "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(99, 102, 241, 0.2)",
                      ],
                    }}
                    transition={{
                      duration: 3.5,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{
                      background: theme === "dark"
                        ? "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.3))"
                        : "linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(139, 92, 246, 0.45), rgba(99, 102, 241, 0.35))",
                      filter: "blur(8px)",
                    }}
                  />

                  {/* Horizontal Highlight - Lying Effect - Ultra Refined */}
                  <motion.div
                    className="absolute top-0 left-0 h-full rounded-[20px] pointer-events-none"
                    animate={{
                      opacity: [0.3, 0.5, 0.3],
                      x: ["-50%", "150%", "-50%"],
                    }}
                    transition={{
                      duration: 5,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{
                      width: "40%",
                      background: theme === "dark"
                        ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.25), transparent)"
                        : "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.4), transparent)",
                      filter: "blur(6px)",
                    }}
                  />

                  {/* Radial Glow from Center */}
                  <motion.div
                    className="absolute inset-0 rounded-[20px] pointer-events-none opacity-0 group-hover/cta-footer:opacity-100 transition-opacity duration-500"
                    style={{
                      background: theme === "dark"
                        ? "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.25), transparent 70%)"
                        : "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.2), transparent 70%)",
                      filter: "blur(20px)",
                    }}
                  />

                  {/* Content - Responsive Text */}
                  <span className="relative z-10 flex items-center justify-center gap-1.5 lg:gap-2 xl:gap-2.5" style={{ color: "#FFFFFF" }}>
                    <span className="font-semibold tracking-wide">{footer.ctaButtonText}</span>
                    <motion.svg
                      className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                      initial={{ x: 0 }}
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                  </span>

                  {/* Hover State Enhancement */}
                  <motion.div
                    className="absolute inset-0 rounded-[20px] pointer-events-none opacity-0 group-hover/cta-footer:opacity-100 transition-opacity duration-500"
                    style={{
                      boxShadow: theme === "dark"
                        ? "0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.2) inset, 0 0 60px rgba(168, 85, 247, 0.3), 0 0 100px rgba(139, 92, 246, 0.2)"
                        : "0 12px 48px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.4) inset, 0 0 50px rgba(124, 58, 237, 0.25), 0 0 80px rgba(139, 92, 246, 0.15)",
                    }}
                  />
                </motion.button>
              </Link>
              {brand.id === "nexcel" && (
                <Link href="/preiskalkulator" prefetch={true} className="inline-block mt-4 sm:mt-0 sm:ml-4">
                  <span className="text-sm font-medium text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-xl px-4 py-2.5 inline-flex items-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]">
                    Preis berechnen
                    <span className="text-white/50 text-xs">(Im Vollbild öffnen)</span>
                  </span>
                </Link>
              )}
            </motion.div>
          </div>
        </motion.div>
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
