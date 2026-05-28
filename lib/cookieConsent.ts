// Cookie Consent Utility
// DSGVO-konforme Cookie-Verwaltung für NEXCEL AI

export interface CookieConsent {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  setAt: string;
}

const COOKIE_CONSENT_KEY = "cookieConsent";

/**
 * Standard-Cookie-Consent (nur essenzielle Cookies aktiv)
 */
const defaultConsent: CookieConsent = {
  essential: true,
  analytics: false,
  marketing: false,
  setAt: new Date().toISOString(),
};

/**
 * Liest den Cookie-Consent aus localStorage
 * @returns CookieConsent-Objekt oder null, wenn kein Consent gesetzt wurde
 */
export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return null;

    const consent = JSON.parse(stored) as CookieConsent;
    return consent;
  } catch (error) {
    console.error("Fehler beim Lesen des Cookie-Consents:", error);
    return null;
  }
}

/**
 * Speichert den Cookie-Consent in localStorage
 * @param consent CookieConsent-Objekt
 */
export function setCookieConsent(consent: CookieConsent): void {
  if (typeof window === "undefined") return;

  try {
    const consentWithDate = {
      ...consent,
      setAt: new Date().toISOString(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentWithDate));
  } catch (error) {
    console.error("Fehler beim Speichern des Cookie-Consents:", error);
  }
}

/**
 * Prüft, ob Analytics-Consent gegeben wurde
 * @returns true, wenn Analytics-Cookies erlaubt sind
 */
export function hasAnalyticsConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.analytics === true;
}

/**
 * Prüft, ob Marketing-Consent gegeben wurde
 * @returns true, wenn Marketing-Cookies erlaubt sind
 */
export function hasMarketingConsent(): boolean {
  const consent = getCookieConsent();
  return consent?.marketing === true;
}

/**
 * Prüft, ob ein Cookie-Consent bereits gesetzt wurde
 * @returns true, wenn Consent bereits vorhanden ist
 */
export function hasCookieConsent(): boolean {
  return getCookieConsent() !== null;
}

/**
 * Setzt nur essenzielle Cookies (Standard)
 */
export function setEssentialOnly(): void {
  setCookieConsent({
    essential: true,
    analytics: false,
    marketing: false,
    setAt: new Date().toISOString(),
  });
}

/**
 * Setzt alle Cookies (alle akzeptieren)
 */
export function setAllCookies(): void {
  setCookieConsent({
    essential: true,
    analytics: true,
    marketing: true,
    setAt: new Date().toISOString(),
  });
}

/**
 * TODO: Hier können später Analytics-Skripte eingebunden werden
 * Beispiel:
 * 
 * if (hasAnalyticsConsent()) {
 *   // Google Analytics initialisieren
 *   // gtag('config', 'GA_MEASUREMENT_ID');
 * }
 */
export function initializeAnalytics(): void {
  if (hasAnalyticsConsent()) {
    // Hier später Analytics-Skripte einbinden
    // z.B. Google Analytics, Plausible, etc.
    console.log("Analytics-Consent vorhanden - Analytics kann initialisiert werden");
  }
}

/**
 * TODO: Hier können später Marketing-Skripte eingebunden werden
 * Beispiel:
 * 
 * if (hasMarketingConsent()) {
 *   // Facebook Pixel, LinkedIn Insight Tag, etc.
 * }
 */
export function initializeMarketing(): void {
  if (hasMarketingConsent()) {
    // Hier später Marketing-Skripte einbinden
    // z.B. Facebook Pixel, LinkedIn Insight Tag, etc.
    console.log("Marketing-Consent vorhanden - Marketing-Tools können initialisiert werden");
  }
}

