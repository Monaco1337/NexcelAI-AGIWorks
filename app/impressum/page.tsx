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

export default function ImpressumPage() {
  const sections = [
    {
      title: "Angaben gemäß § 5 TMG",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-5 rounded-xl group hover:scale-[1.02] transition-all duration-300" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">Unternehmen</p>
            <p className="text-xl font-bold text-[#FFFFFF]">NEXCEL AI</p>
          </div>
          <div className="p-5 rounded-xl group hover:scale-[1.02] transition-all duration-300" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">Inhaberin</p>
            <p className="text-lg font-semibold text-[#FFFFFF]">Celina Siebeneicher</p>
          </div>
          <div className="p-5 rounded-xl group hover:scale-[1.02] transition-all duration-300" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">Anschrift</p>
            <p className="text-[#E5E7EB] leading-relaxed">
              Hemmerder Dorfstraße 111<br />
              59427 Unna<br />
              Deutschland
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Kontakt",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-5 rounded-xl group hover:scale-[1.02] transition-all duration-300" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">Telefon</p>
            <a href="tel:+491639166073" className="text-lg font-semibold text-[#FFFFFF] hover:text-[#A45CFF] transition-colors duration-300 inline-flex items-center gap-2">
              <span>+49 163 9166073</span>
              <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </a>
          </div>
          <div className="p-5 rounded-xl group hover:scale-[1.02] transition-all duration-300" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-3 uppercase tracking-wider">E-Mail</p>
            <div className="space-y-2.5">
              <a
                href="mailto:info@nexcelai.com"
                className="block text-[#E5E7EB] hover:text-[#A45CFF] transition-all duration-300 hover:translate-x-1 transform font-medium"
              >
                info@nexcelai.com
              </a>
              <a
                href="mailto:kontakt@nexcelai.com"
                className="block text-[#E5E7EB] hover:text-[#A45CFF] transition-all duration-300 hover:translate-x-1 transform font-medium"
              >
                kontakt@nexcelai.com
              </a>
              <a
                href="mailto:support@nexcelai.com"
                className="block text-[#E5E7EB] hover:text-[#A45CFF] transition-all duration-300 hover:translate-x-1 transform font-medium"
              >
                support@nexcelai.com
              </a>
            </div>
          </div>
          <div className="p-5 rounded-xl group hover:scale-[1.02] transition-all duration-300" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-sm font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">Website</p>
            <p className="text-lg font-semibold text-[#FFFFFF]">www.nexcelai.com</p>
          </div>
        </div>
      ),
    },
    {
      title: "Umsatzsteuer",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Gemäß § 19 UStG wird keine Umsatzsteuer erhoben (Kleinunternehmerregelung).
          </p>
        </div>
      ),
    },
    {
      title: "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Celina Siebeneicher<br />
            Hemmerder Dorfstraße 111<br />
            59427 Unna<br />
            Deutschland
          </p>
        </div>
      ),
    },
    {
      title: "EU-Streitschlichtung",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
            <p className="text-[#E5E7EB] mb-4 leading-relaxed text-lg">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit:
            </p>
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#A45CFF] hover:text-[#CBA6FF] transition-all duration-300 font-semibold group"
            >
              <span>https://ec.europa.eu/consumers/odr</span>
              <motion.svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                whileHover={{ x: 2 }}
                transition={{ duration: 0.2 }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </motion.svg>
            </a>
          </div>
          <div className="p-4 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)" }}>
            <p className="text-sm text-[#E5E7EB]">
              Unsere E-Mail-Adressen finden Sie oben im Impressum.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: "Verbraucherstreitbeilegung / Universalschlichtungsstelle",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      content: (
        <div className="p-6 rounded-xl" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)", boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)" }}>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Wir sind nicht bereit oder verpflichtet, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
          </p>
        </div>
      ),
    },
    {
      title: "Haftung für Inhalte",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Nach §§ 8 bis 10 TMG sind wir jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Verpflichtungen zur Entfernung oder Sperrung der Nutzung von Informationen nach den allgemeinen Gesetzen bleiben hiervon unberührt.
            Eine Haftung ist jedoch erst ab dem Zeitpunkt der Kenntnis einer konkreten Rechtsverletzung möglich.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Bei Bekanntwerden entsprechender Rechtsverletzungen werden wir diese Inhalte umgehend entfernen.
          </p>
        </div>
      ),
    },
    {
      title: "Haftung für Links",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen.
            Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Die verlinkten Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
            Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Eine permanente inhaltliche Kontrolle ist ohne konkrete Anhaltspunkte einer Rechtsverletzung nicht zumutbar.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Bei Bekanntwerden von Rechtsverletzungen werden wir derartige Links umgehend entfernen.
          </p>
        </div>
      ),
    },
    {
      title: "Urheberrecht",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung der jeweiligen Autorin bzw. Erstellerin.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Downloads und Kopien dieser Seite sind nur für den privaten, nicht kommerziellen Gebrauch gestattet.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Soweit Inhalte nicht vom Betreiber erstellt wurden, werden die Urheberrechte Dritter beachtet.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Bei Bekanntwerden von Urheberrechtsverletzungen werden derartige Inhalte umgehend entfernt.
          </p>
        </div>
      ),
    },
    {
      title: "Datenschutz – Kurzfassung",
      icon: (
        <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      content: (
        <div className="space-y-4">
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Die Nutzung unserer Webseite ist in der Regel ohne Angabe personenbezogener Daten möglich.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Sofern personenbezogene Daten erhoben werden, erfolgt dies auf freiwilliger Basis.
            Diese Daten werden ohne ausdrückliche Zustimmung nicht an Dritte weitergegeben.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Die Datenübertragung im Internet kann Sicherheitslücken aufweisen.
            Einen vollständigen Schutz der Daten vor dem Zugriff durch Dritte gibt es nicht.
          </p>
          <p className="text-[#E5E7EB] leading-relaxed text-lg">
            Weitere Informationen finden Sie in der{" "}
            <Link href="/datenschutz" className="text-[#A45CFF] hover:text-[#CBA6FF] transition-colors duration-300 underline font-semibold">
              Datenschutzerklärung
            </Link>.
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
                Impressum
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-[#E5E7EB] font-light">
              Rechtliche Informationen gemäß TMG, RStV & UStG
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
            <p className="text-sm text-[#9CA3AF] mb-6">Stand: Dezember 2025</p>
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
