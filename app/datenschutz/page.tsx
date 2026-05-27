"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";

const IconComponent = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`flex items-center justify-center w-12 h-12 rounded-xl ${className}`} style={{
    background: "linear-gradient(135deg, rgba(164, 92, 255, 0.2) 0%, rgba(196, 132, 252, 0.1) 100%)",
    border: "1px solid rgba(164, 92, 255, 0.3)",
    boxShadow: "0 4px 20px rgba(164, 92, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
  }}>
    {children}
  </div>
);

export default function DatenschutzPage() {
  const sections = [
    {
      title: "1. Einleitung",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Wir freuen uns über Ihr Interesse an unserer Website. Der Schutz Ihrer personenbezogenen Daten ist uns ein wichtiges Anliegen. Nachfolgend informieren wir Sie ausführlich über den Umgang mit Ihren Daten gemäß Art. 13 und 14 DSGVO.
          </p>
        </div>
      ),
    },
    {
      title: "2. Verantwortliche Stelle",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-5 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">Verantwortlich im Sinne der DSGVO ist:</p>
            <p className="text-lg font-semibold text-[#FFFFFF] mb-3">Celina Siebeneicher – NEXCEL AI</p>
            <p className="text-[#E5E7EB] leading-relaxed">
              Hemmerder Dorfstraße 111<br />
              59427 Unna, Deutschland
            </p>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-3 uppercase tracking-wider">E-Mail:</p>
            <div className="space-y-2">
              <a href="mailto:info@nexcelai.com" className="block text-[#E5E7EB] hover:text-[#A45CFF] transition-all duration-300 hover:translate-x-1 transform font-medium">
                info@nexcelai.com
              </a>
              <a href="mailto:kontakt@nexcelai.com" className="block text-[#E5E7EB] hover:text-[#A45CFF] transition-all duration-300 hover:translate-x-1 transform font-medium">
                kontakt@nexcelai.com
              </a>
              <a href="mailto:support@nexcelai.com" className="block text-[#E5E7EB] hover:text-[#A45CFF] transition-all duration-300 hover:translate-x-1 transform font-medium">
                support@nexcelai.com
              </a>
            </div>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">Telefon:</p>
            <a href="tel:+491639166073" className="text-lg font-semibold text-[#FFFFFF] hover:text-[#A45CFF] transition-colors duration-300">
              +49 163 9166073
            </a>
          </div>
        </div>
      ),
    },
    {
      title: "3. Grundsätze der Datenverarbeitung",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Wir verarbeiten personenbezogene Daten ausschließlich auf Grundlage der DSGVO, des BDSG und des TTDSG. Es gelten die Prinzipien der Rechtmäßigkeit, Zweckbindung, Datenminimierung, Richtigkeit, Speicherbegrenzung sowie Integrität und Vertraulichkeit gemäß Art. 5 DSGVO.
          </p>
        </div>
      ),
    },
    {
      title: "4. Hosting und Server (Netlify)",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-[#E5E7EB] mb-4 leading-relaxed text-lg">
              Diese Website wird bei:
            </p>
            <p className="text-lg font-semibold text-[#FFFFFF] mb-2">Netlify Inc.</p>
            <p className="text-[#E5E7EB] leading-relaxed mb-4">
              44 Montgomery Street, Suite 300<br />
              San Francisco, CA 94104, USA
            </p>
            <p className="text-[#E5E7EB] leading-relaxed text-lg">
              gehostet. Netlify ist Auftragsverarbeiter nach Art. 28 DSGVO. Ein AV-Vertrag besteht. Die Datenübertragung erfolgt auf Grundlage des EU-U.S. Data Privacy Framework sowie Standardvertragsklauseln.
            </p>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-3 uppercase tracking-wider">Verarbeitete Daten (Server-Logs):</p>
            <ul className="space-y-2 text-[#E5E7EB]">
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>IP-Adresse</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Datum & Uhrzeit</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Browser & Betriebssystem</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Referrer-URL</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Hostname</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>HTTP-Status</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-[#A45CFF]/20">
              <p className="text-sm text-[#E5E7EB]">
                <strong className="text-[#FFFFFF]">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO<br />
                <strong className="text-[#FFFFFF]">Speicherdauer:</strong> max. 30 Tage
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "5. Datenbank & CRM (Supabase)",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-[#E5E7EB] mb-4 leading-relaxed text-lg">
              Zur Speicherung von Kunden-, Demo- und Buchungsdaten nutzen wir:
            </p>
            <p className="text-lg font-semibold text-[#FFFFFF] mb-2">Supabase Inc.</p>
            <p className="text-[#E5E7EB] leading-relaxed">Singapur / EU-Serverstandorte</p>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-3 uppercase tracking-wider">Verarbeitete Daten:</p>
            <ul className="space-y-2 text-[#E5E7EB]">
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Name, E-Mail, Telefon</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Unternehmen</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Vertrags- & Buchungsdaten</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Kommunikationsdaten</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Nutzungsdaten (Demo-Zugänge)</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-[#A45CFF]/20 space-y-2 text-sm text-[#E5E7EB]">
              <p><strong className="text-[#FFFFFF]">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a, b, f DSGVO</p>
              <p><strong className="text-[#FFFFFF]">Speicherung:</strong> Nur innerhalb der EU</p>
              <p><strong className="text-[#FFFFFF]">Verschlüsselung:</strong> TLS / AES-256 at Rest</p>
              <p><strong className="text-[#FFFFFF]">Speicherdauer:</strong> Nach HGB/AO bis zu 10 Jahre</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "6. SSL/TLS-Verschlüsselung",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Diese Website nutzt eine SSL-Verschlüsselung zur sicheren Übertragung personenbezogener Daten.
          </p>
        </div>
      ),
    },
    {
      title: "7. Demo-Zugänge & Login-System",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-5 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-3 uppercase tracking-wider">Bei Anforderung eines Demo-Zugangs zu Chronex AI werden erhoben:</p>
            <ul className="space-y-2 text-[#E5E7EB]">
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Name</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>E-Mail</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Unternehmen</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>IP-Adresse</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Login-Daten</span>
              </li>
            </ul>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <div className="text-sm text-[#E5E7EB] space-y-2">
              <p><strong className="text-[#FFFFFF]">Zweck:</strong> Bereitstellung eines zeitlich begrenzten Testzugangs</p>
              <p><strong className="text-[#FFFFFF]">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b DSGVO</p>
              <p><strong className="text-[#FFFFFF]">Speicherfrist:</strong> 14 Tage nach Ablauf des Demo-Zugangs</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "8. Kontaktaufnahme",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg mb-4">
            Bei Kontakt per E-Mail, Telefon oder Formular werden die übermittelten Daten zur Bearbeitung gespeichert.
          </p>
          <div className="pt-4 border-t border-[#A45CFF]/20">
            <p className="text-sm text-[#E5E7EB]">
              <strong className="text-[#FFFFFF]">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. b und f DSGVO<br />
              <strong className="text-[#FFFFFF]">Löschung:</strong> Nach Abschluss der Kommunikation
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "9. Cookies & Consent",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg mb-4">
            Wir verwenden technisch notwendige Cookies. Analyse- und Marketing-Cookies werden ausschließlich mit Einwilligung gesetzt (§ 25 TTDSG).
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg mb-4">
            Ein Cookie-Banner regelt:
          </p>
          <ul className="space-y-2 text-[#E5E7EB] mb-4">
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>Essenzielle Cookies</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>Analyse</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>Marketing</span>
            </li>
          </ul>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Einwilligungen sind jederzeit widerrufbar.
          </p>
        </div>
      ),
    },
    {
      title: "10. Google Dienste (Analytics, Tag Manager, Ads, Remarketing, Fonts)",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg mb-4">
            Die Nutzung erfolgt nur nach Einwilligung (Art. 6 Abs. 1 lit. a DSGVO).
          </p>
          <ul className="space-y-2 text-[#E5E7EB]">
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>IP-Anonymisierung ist aktiv.</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>Datenübermittlung erfolgt auf Basis EU-U.S. Data Privacy Framework & SCCs.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "11. CDN",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg mb-4">
            Zur Performance-Optimierung nutzen wir ein CDN.
          </p>
          <p className="text-sm text-[#E5E7EB]">
            <strong className="text-[#FFFFFF]">Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. f DSGVO
          </p>
        </div>
      ),
    },
    {
      title: "12. Ihre Rechte (Art. 15–22 DSGVO)",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-[#E5E7EB] mb-4 leading-relaxed text-lg">
              Sie haben jederzeit das Recht auf:
            </p>
            <ul className="space-y-2 text-[#E5E7EB]">
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Auskunft</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Berichtigung</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Löschung</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Einschränkung</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Datenübertragbarkeit</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Widerspruch</span>
              </li>
              <li className="flex items-start">
                <span className="text-[#A45CFF] mr-2">•</span>
                <span>Widerruf erteilter Einwilligungen</span>
              </li>
            </ul>
          </div>
          <div className="p-5 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">Kontakt:</p>
            <a href="mailto:info@nexcelai.com" className="text-lg font-semibold text-[#FFFFFF] hover:text-[#A45CFF] transition-colors duration-300">
              info@nexcelai.com
            </a>
          </div>
        </div>
      ),
    },
    {
      title: "13. Aufsichtsbehörde",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-lg font-semibold text-[#FFFFFF] mb-3">Landesbeauftragte für Datenschutz NRW</p>
          <p className="text-[#E5E7EB] leading-relaxed">
            Kavalleriestraße 2–4<br />
            40213 Düsseldorf
          </p>
        </div>
      ),
    },
    {
      title: "14. Datensicherheit",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] mb-4 leading-relaxed text-lg">
            Wir nutzen:
          </p>
          <ul className="space-y-2 text-[#E5E7EB]">
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>AES-256 Verschlüsselung</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>Firewalls</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>MFA</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>Logs & Monitoring</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>regelmäßige Backups</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>Zugriffskontrollen</span>
            </li>
            <li className="flex items-start">
              <span className="text-[#A45CFF] mr-2">•</span>
              <span>Notfallpläne nach Art. 33 & 34 DSGVO</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      title: "15. Keine automatisierte Entscheidungsfindung",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Es findet kein Profiling gemäß Art. 22 DSGVO statt.
          </p>
        </div>
      ),
    },
    {
      title: "16. Minderjährige",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Unser Angebot richtet sich ausschließlich an Personen ab 18 Jahren.
          </p>
        </div>
      ),
    },
    {
      title: "17. Änderungen",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Diese Datenschutzerklärung kann bei technischen oder rechtlichen Änderungen angepasst werden.
          </p>
        </div>
      ),
    },
  ];

  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navigation />
      <div className="relative min-h-screen py-24 md:py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-20"
            style={{
              background: "radial-gradient(circle, rgba(164, 92, 255, 0.3) 0%, transparent 70%)",
              filter: "blur(80px)",
            }}
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#FFFFFF] mb-6 tracking-tight">
              <span className="text-[#A45CFF]" style={{ textShadow: "0 0 40px rgba(164, 92, 255, 0.6)" }}>
                Datenschutzerklärung
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-[#E5E7EB] font-light">
              Stand: Dezember 2025
            </p>
          </motion.div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group"
              >
                <div
                  className="rounded-2xl p-6 md:p-8 transition-all duration-500"
                  style={{
                    background: "rgba(255, 255, 255, 0.03)",
                    backdropFilter: "blur(30px)",
                    WebkitBackdropFilter: "blur(30px)",
                    border: "1px solid rgba(164, 92, 255, 0.2)",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "rgba(164, 92, 255, 0.4)";
                    e.currentTarget.style.boxShadow = "0 12px 48px rgba(164, 92, 255, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(164, 92, 255, 0.2)";
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)";
                  }}
                >
                  <div className="flex items-start gap-4 mb-6">
                    <motion.div
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ duration: 0.3 }}
                    >
                      <IconComponent>
                        {section.icon}
                      </IconComponent>
                    </motion.div>
                    <h2 className="text-2xl md:text-3xl font-bold text-[#FFFFFF] tracking-tight flex-1 pt-1">
                      {section.title}
                    </h2>
                  </div>
                  <div className="text-[#E5E7EB] font-light leading-relaxed">
                    {section.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-16 pt-8 border-t border-[#A45CFF]/20 text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-[#A45CFF] hover:text-[#CBA6FF] transition-all duration-300 font-medium group"
            >
              <motion.svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                whileHover={{ x: -4 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </motion.svg>
              <span>Zurück zur Startseite</span>
            </Link>
          </motion.div>
        </div>
      </div>
      <Footer />
    </main>
  );
}
