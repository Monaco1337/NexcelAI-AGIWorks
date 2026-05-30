"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  getCookieConsent,
  setCookieConsent,
  setEssentialOnly,
  setAllCookies,
  type CookieConsent,
} from "@/lib/cookieConsent";

/**
 * Cookie Consent — Premium, dezent.
 * - Kein permanenter Floating-Button auf der Seite
 * - Einmalige Auswahl → localStorage, danach unsichtbar
 * - Kompaktes, zentriertes Modal (kein Fullscreen-Gefühl)
 * - Brand-aware über CSS-Variablen (--accent, --brand-*)
 */
export default function CookieBanner() {
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
    if (typeof window !== "undefined") {
      setIsAdminPage(window.location.pathname.startsWith("/admin"));
    }
  }, []);

  useEffect(() => {
    if (isAdminPage) return;

    const existingConsent = getCookieConsent();
    if (existingConsent) {
      setHasConsent(true);
      setConsent(existingConsent);
      return;
    }

    const timer = window.setTimeout(() => setShowModal(true), 1400);
    return () => window.clearTimeout(timer);
  }, [isAdminPage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const reopen = () => {
      const existing = getCookieConsent();
      if (existing) setConsent(existing);
      setShowSettings(false);
      setShowModal(true);
    };
    window.addEventListener("open-cookie-settings", reopen);
    return () => window.removeEventListener("open-cookie-settings", reopen);
  }, []);

  const finalizeConsent = useCallback(() => {
    setHasConsent(true);
    setShowModal(false);
    setShowSettings(false);
  }, []);

  const handleEssentialOnly = () => {
    setEssentialOnly();
    finalizeConsent();
  };

  const handleAcceptAll = () => {
    setAllCookies();
    finalizeConsent();
  };

  const handleSaveSettings = () => {
    setCookieConsent(consent);
    finalizeConsent();
  };

  const handleBackdropClick = () => {
    if (hasConsent) setShowModal(false);
  };

  if (isAdminPage) return null;

  return (
    <AnimatePresence>
      {showModal && (
        <div className="cookie-consent-root" role="presentation">
          <motion.button
            type="button"
            className="cookie-backdrop"
            aria-label="Cookie-Dialog schließen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={handleBackdropClick}
          />

          <motion.div
            className="cookie-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-dialog-title"
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 34 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cookie-dialog-content">
              <header className="cookie-dialog-header">
                <div className="cookie-dialog-header-icon" aria-hidden>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m9 12 2 2 4-4"
                    />
                  </svg>
                </div>
                <div className="cookie-dialog-header-text">
                  <h3 id="cookie-dialog-title" className="cookie-dialog-title">
                    Datenschutz &amp; Cookies
                  </h3>
                  <p className="cookie-dialog-subtitle">
                    DSGVO-konform · Einmalige Auswahl
                  </p>
                </div>
                {hasConsent ? (
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="cookie-dialog-close"
                    aria-label="Schließen"
                  >
                    <svg
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                ) : null}
              </header>

              <div className="cookie-dialog-body">
                <p className="cookie-dialog-text">
                  Wir verwenden technisch notwendige Cookies für den Betrieb
                  dieser Website. Mit Ihrer Einwilligung analysieren wir die
                  Nutzung anonymisiert, um die Plattform zu verbessern.
                </p>

                <div className="cookie-dialog-actions">
                  <button
                    type="button"
                    onClick={handleEssentialOnly}
                    className="cookie-dialog-button cookie-dialog-button-secondary"
                  >
                    Nur notwendige
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptAll}
                    className="cookie-dialog-button cookie-dialog-button-accept"
                  >
                    Alle akzeptieren
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowSettings(!showSettings)}
                  className="cookie-dialog-settings-toggle"
                  aria-expanded={showSettings}
                >
                  <span>Einstellungen anpassen</span>
                  <motion.svg
                    width="16"
                    height="16"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                    animate={{ rotate: showSettings ? 180 : 0 }}
                    transition={{ duration: 0.25 }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19 9l-7 7-7-7"
                    />
                  </motion.svg>
                </button>

                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      className="cookie-dialog-settings"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="cookie-dialog-setting-item">
                        <div className="cookie-dialog-setting-text">
                          <h5 className="cookie-dialog-setting-title">
                            Notwendige Cookies
                            <span className="cookie-dialog-setting-badge">
                              Immer aktiv
                            </span>
                          </h5>
                          <p className="cookie-dialog-setting-description">
                            Erforderlich für Sicherheit und Grundfunktionen.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="cookie-toggle-switch enabled"
                          disabled
                          aria-label="Notwendige Cookies — immer aktiv"
                        >
                          <div className="cookie-toggle-thumb" />
                        </button>
                      </div>

                      <div className="cookie-dialog-setting-item">
                        <div className="cookie-dialog-setting-text">
                          <h5 className="cookie-dialog-setting-title">
                            Statistik
                          </h5>
                          <p className="cookie-dialog-setting-description">
                            Anonymisierte Nutzungsdaten zur Verbesserung der
                            Website.
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`cookie-toggle-switch ${consent.analytics ? "enabled" : "disabled"}`}
                          onClick={() =>
                            setConsent({
                              ...consent,
                              analytics: !consent.analytics,
                            })
                          }
                          aria-pressed={consent.analytics}
                        >
                          <div className="cookie-toggle-thumb" />
                        </button>
                      </div>

                      <div className="cookie-dialog-setting-item">
                        <div className="cookie-dialog-setting-text">
                          <h5 className="cookie-dialog-setting-title">
                            Marketing
                          </h5>
                          <p className="cookie-dialog-setting-description">
                            Für personalisierte Inhalte und Conversion-Messung.
                          </p>
                        </div>
                        <button
                          type="button"
                          className={`cookie-toggle-switch ${consent.marketing ? "enabled" : "disabled"}`}
                          onClick={() =>
                            setConsent({
                              ...consent,
                              marketing: !consent.marketing,
                            })
                          }
                          aria-pressed={consent.marketing}
                        >
                          <div className="cookie-toggle-thumb" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveSettings}
                        className="cookie-dialog-save-button"
                      >
                        Auswahl speichern
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                <footer className="cookie-dialog-footer">
                  <Link href="/datenschutz" className="cookie-dialog-link">
                    Datenschutzerklärung
                  </Link>
                </footer>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
