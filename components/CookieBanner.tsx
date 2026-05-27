"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";
import {
  getCookieConsent,
  setCookieConsent,
  setEssentialOnly,
  setAllCookies,
  type CookieConsent,
} from "@/lib/cookieConsent";

/**
 * Cookie Banner - Apple iOS 26 / Tesla UI Level
 * 
 * Features:
 * - Permanent fixed position (always visible on scroll)
 * - iOS Safe-Area support
 * - Glassmorphism design
 * - DSGVO-konform
 * - GPU-optimized animations
 * - Mobile-first responsive
 * - No layout shifts (CLS = 0)
 */
export default function CookieBanner() {
  const { theme } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isAdminPage, setIsAdminPage] = useState(false);
  const [hasConsent, setHasConsent] = useState(false);
  const [consent, setConsent] = useState<CookieConsent>({
    essential: true,
    analytics: false,
    marketing: false,
    setAt: new Date().toISOString(),
  });

  useEffect(() => {
    // Hide on admin pages
    if (typeof window !== "undefined") {
      setIsAdminPage(window.location.pathname.startsWith("/admin"));
    }
  }, []);

  useEffect(() => {
    // Don't initialize consent on admin pages
    if (isAdminPage) return;
    
    const existingConsent = getCookieConsent();
    if (existingConsent) {
      setHasConsent(true);
      setConsent(existingConsent);
    } else {
      // Show modal after 2 seconds
      setTimeout(() => setShowModal(true), 2000);
    }
  }, [isAdminPage]);

  const handleEssentialOnly = () => {
    setEssentialOnly();
    setHasConsent(true);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    setAllCookies();
    setHasConsent(true);
    setShowModal(false);
  };

  const handleSaveSettings = () => {
    setCookieConsent(consent);
    setHasConsent(true);
    setShowModal(false);
    setShowSettings(false);
  };

  const handleOpenModal = () => {
    setShowModal(true);
  };

  // Don't render on admin pages - must be after all hooks
  if (isAdminPage) {
    return null;
  }

  return (
    <>
      {/* Cookie Floating Button - Apple iOS 26 Style - Always Visible */}
      <motion.div
        data-cookie-banner
        className="cookie-floating-button"
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 25,
          delay: 0.5 
        }}
      >
          <motion.button
            onClick={handleOpenModal}
            className="cookie-button"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            aria-label="Cookie-Einstellungen"
          >
            <motion.div
              className="cookie-icon-wrapper"
              animate={{
                scale: [1, 1.03, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <svg 
                className="cookie-icon" 
                viewBox="0 0 40 40" 
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <defs>
                  <linearGradient id="cookie-base-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#D4A574" />
                    <stop offset="50%" stopColor="#C4965E" />
                    <stop offset="100%" stopColor="#B8874A" />
                  </linearGradient>
                  <filter id="cookie-shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.2)" />
                  </filter>
                </defs>
                
                {/* Cookie Base */}
                <path
                  d="M 20 5
                     A 15 15 0 0 1 35 20
                     A 15 15 0 0 1 20 35
                     A 15 15 0 0 1 5 20
                     A 15 15 0 0 1 20 5
                     M 30 8
                     Q 32 10 31 12
                     Q 30 14 28 13
                     Q 26 12 27 10
                     Q 28 8 30 8 Z"
                  fill="url(#cookie-base-grad)"
                  stroke="rgba(139, 103, 70, 0.3)"
                  strokeWidth="0.8"
                  filter="url(#cookie-shadow)"
                />
                
                {/* Chocolate Chips */}
                <circle cx="15" cy="16" r="2" fill="#3D2817" />
                <circle cx="25" cy="15" r="1.8" fill="#3D2817" />
                <circle cx="13" cy="21" r="2" fill="#3D2817" />
                <circle cx="27" cy="22" r="1.8" fill="#3D2817" />
                <circle cx="17" cy="25" r="1.6" fill="#3D2817" />
                <circle cx="22" cy="19" r="1.6" fill="#3D2817" />
                <circle cx="19" cy="12" r="1.5" fill="#3D2817" />
                <circle cx="11" cy="18" r="1.5" fill="#3D2817" />
              </svg>
            </motion.div>

            {/* Badge when no consent - Always visible indicator */}
            {!hasConsent && (
              <motion.div
                className="cookie-badge"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="cookie-badge-text">!</span>
              </motion.div>
            )}
          </motion.button>
        </motion.div>

      {/* Cookie Modal - High-End Glassmorphism */}
      <AnimatePresence>
        {showModal && (
          <>
            {/* Backdrop */}
            <motion.div
              className="cookie-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setShowModal(false)}
            />

            {/* Dialog */}
            <motion.div
              className="cookie-dialog"
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ 
                type: "spring", 
                stiffness: 400, 
                damping: 30,
                duration: 0.2 
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="cookie-dialog-content">
                {/* Header */}
                <div className="cookie-dialog-header">
                  <div className="cookie-dialog-header-icon">
                    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="modal-cookie-base-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#D4A574" />
                          <stop offset="50%" stopColor="#C4965E" />
                          <stop offset="100%" stopColor="#B8874A" />
                        </linearGradient>
                        <filter id="modal-cookie-shadow">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.2)" />
                        </filter>
                      </defs>
                      <path
                        d="M 20 5
                           A 15 15 0 0 1 35 20
                           A 15 15 0 0 1 20 35
                           A 15 15 0 0 1 5 20
                           A 15 15 0 0 1 20 5
                           M 30 8
                           Q 32 10 31 12
                           Q 30 14 28 13
                           Q 26 12 27 10
                           Q 28 8 30 8 Z"
                        fill="url(#modal-cookie-base-grad)"
                        stroke="rgba(139, 103, 70, 0.3)"
                        strokeWidth="0.8"
                        filter="url(#modal-cookie-shadow)"
                      />
                      <circle cx="15" cy="16" r="2" fill="#3D2817" />
                      <circle cx="25" cy="15" r="1.8" fill="#3D2817" />
                      <circle cx="13" cy="21" r="2" fill="#3D2817" />
                      <circle cx="27" cy="22" r="1.8" fill="#3D2817" />
                      <circle cx="17" cy="25" r="1.6" fill="#3D2817" />
                      <circle cx="22" cy="19" r="1.6" fill="#3D2817" />
                      <circle cx="19" cy="12" r="1.5" fill="#3D2817" />
                      <circle cx="11" cy="18" r="1.5" fill="#3D2817" />
                    </svg>
                  </div>
                  <div className="cookie-dialog-header-text">
                    <h3 className="cookie-dialog-title">Cookie-Einstellungen</h3>
                    <p className="cookie-dialog-subtitle">DSGVO-konform • EU-konform</p>
                  </div>
                  <motion.button
                    onClick={() => setShowModal(false)}
                    className="cookie-dialog-close"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.15 }}
                  >
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </motion.button>
                </div>

                {/* Body */}
                <div className="cookie-dialog-body">
                  <p className="cookie-dialog-text">
                    Wir verwenden Cookies, um dir die bestmögliche Erfahrung zu bieten. Einige sind technisch notwendig, andere helfen uns, die Website zu verbessern.
                  </p>

                  {/* Quick Actions */}
                  <div className="cookie-dialog-actions">
                    <motion.button
                      onClick={handleEssentialOnly}
                      className="cookie-dialog-button cookie-dialog-button-primary"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      Nur notwendige
                    </motion.button>
                    <motion.button
                      onClick={handleAcceptAll}
                      className="cookie-dialog-button cookie-dialog-button-accept"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                    >
                      Alle akzeptieren
                    </motion.button>
                  </div>

                  {/* Settings Toggle */}
                  <motion.button
                    onClick={() => setShowSettings(!showSettings)}
                    className="cookie-dialog-button cookie-dialog-button-primary"
                    style={{ width: "100%", marginBottom: "1.5rem" }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ duration: 0.15 }}
                  >
                    <span style={{ flex: 1, textAlign: "left" }}>Erweiterte Einstellungen</span>
                    <motion.svg
                      width="20"
                      height="20"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      animate={{ rotate: showSettings ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </motion.svg>
                  </motion.button>

                  {/* Advanced Settings */}
                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        className="cookie-dialog-settings"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Essential Cookies */}
                        <div className="cookie-dialog-setting-item">
                          <div className="cookie-dialog-setting-text">
                            <h5 className="cookie-dialog-setting-title">
                              Notwendige Cookies
                              <span style={{ 
                                marginLeft: "0.5rem",
                                padding: "0.125rem 0.5rem",
                                borderRadius: "0.25rem",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                background: theme === "dark" ? "rgba(164, 92, 255, 0.2)" : "rgba(124, 58, 237, 0.15)",
                                color: theme === "dark" ? "#A45CFF" : "#7C3AED",
                              }}>
                                Immer aktiv
                              </span>
                            </h5>
                            <p className="cookie-dialog-setting-description">
                              Diese Cookies sind für den technischen Betrieb der Website erforderlich und können nicht deaktiviert werden.
                            </p>
                          </div>
                          <button
                            className={`cookie-toggle-switch enabled`}
                            disabled
                            style={{ cursor: "not-allowed" }}
                          >
                            <div className="cookie-toggle-thumb" />
                          </button>
                        </div>

                        {/* Analytics Cookies */}
                        <div className="cookie-dialog-setting-item">
                          <div className="cookie-dialog-setting-text">
                            <h5 className="cookie-dialog-setting-title">Statistik-Cookies</h5>
                            <p className="cookie-dialog-setting-description">
                              Helfen uns zu verstehen, wie Besucher die Website nutzen (z. B. Google Analytics, anonymisierte Daten).
                            </p>
                          </div>
                          <button
                            className={`cookie-toggle-switch ${consent.analytics ? "enabled" : "disabled"}`}
                            onClick={() => setConsent({ ...consent, analytics: !consent.analytics })}
                          >
                            <div className="cookie-toggle-thumb" />
                          </button>
                        </div>

                        {/* Marketing Cookies */}
                        <div className="cookie-dialog-setting-item">
                          <div className="cookie-dialog-setting-text">
                            <h5 className="cookie-dialog-setting-title">Marketing-Cookies</h5>
                            <p className="cookie-dialog-setting-description">
                              Werden für personalisierte Werbung und Marketing-Zwecke verwendet (z. B. Remarketing, Conversion-Tracking).
                            </p>
                          </div>
                          <button
                            className={`cookie-toggle-switch ${consent.marketing ? "enabled" : "disabled"}`}
                            onClick={() => setConsent({ ...consent, marketing: !consent.marketing })}
                          >
                            <div className="cookie-toggle-thumb" />
                          </button>
                        </div>

                        {/* Save Button */}
                        <motion.button
                          onClick={handleSaveSettings}
                          className="cookie-dialog-save-button"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                        >
                          Auswahl speichern
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Legal Link */}
                  <div style={{ marginTop: "1.5rem", paddingTop: "1.5rem", borderTop: "1px solid rgba(0, 0, 0, 0.05)" }}>
                    <Link
                      href="/datenschutz"
                      style={{
                        fontSize: "0.75rem",
                        color: theme === "dark" ? "rgba(156, 163, 175, 1)" : "rgba(107, 114, 128, 1)",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.25rem",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = theme === "dark" ? "#A45CFF" : "#7C3AED";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = theme === "dark" ? "rgba(156, 163, 175, 1)" : "rgba(107, 114, 128, 1)";
                      }}
                    >
                      <span>Mehr Informationen</span>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
