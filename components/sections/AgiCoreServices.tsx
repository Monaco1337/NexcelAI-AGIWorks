"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const services = [
  {
    category: "CRM & VERTRIEB",
    title: "Kunden und Vertrieb zentral steuern.",
    description:
      "Leads, Kontakte, Angebote und Partner in einer individuellen Software verwalten – abgestimmt auf Ihre Vertriebsprozesse.",
    detail: "CRM · Leadmanagement · Kundenportale",
    href: "/leistungen/crm-system-entwicklung",
    linkLabel: "CRM-Entwicklung ansehen",
  },
  {
    category: "ERP & PLATTFORMEN",
    title: "Ein System für Ihr Tagesgeschäft.",
    description:
      "Aufträge, Daten, Rollen und interne Abläufe in einer Unternehmensplattform zusammenführen, die mit Ihren Anforderungen wächst.",
    detail: "ERP · Verwaltung · Betriebsprozesse",
    href: "/leistungen/erp-system-entwicklung",
    linkLabel: "ERP-Entwicklung ansehen",
  },
  {
    category: "SCHNITTSTELLEN & INTEGRATION",
    title: "Ihre Systeme sprechen miteinander.",
    description:
      "Bestehende Anwendungen über Schnittstellen verbinden und wiederkehrende Datenübertragungen automatisieren.",
    detail: "API · Integrationen · Workflows",
    href: "/leistungen/api-entwicklung",
    linkLabel: "Schnittstellen ansehen",
  },
];

export default function AgiCoreServices() {
  const pathname = usePathname();

  const prefix = pathname?.startsWith("/agiworks")
    ? "/agiworks"
    : "";

  return (
    <section
      id="agi-kernleistungen"
      className="relative w-full overflow-hidden py-14 sm:py-16 lg:py-20"
      style={{
        background:
          "linear-gradient(180deg,#08060f,#0b101b 55%,#08060f)",
      }}
     data-homeflow-surface="true">
      <div className="mx-auto max-w-[1240px] px-5 sm:px-8">

        <div className="mx-auto max-w-[800px] text-center">
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.3em]"
            style={{ color: "var(--accent)" }}
          >
            Unsere Kernleistungen
          </p>

          <h2
            className="mt-5 text-[2rem] font-light leading-[1.16] tracking-[-0.035em] text-white sm:text-[2.8rem] lg:text-[3.2rem]"
            style={{
              fontFamily:
                "var(--font-headline),system-ui,sans-serif",
            }}
          >
            Ihre Prozesse sind individuell.
            <br />
            <span
              style={{
                background: "var(--brand-headline-gradient)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Ihre Software sollte es auch sein.
            </span>
          </h2>

          <p className="mx-auto mt-6 max-w-[650px] text-[15px] leading-[1.8] text-white/60">
            Wir entwickeln Anwendungen, die Ihre Abläufe abbilden,
            bestehende Systeme verbinden und die tägliche Arbeit
            vereinfachen.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-5 lg:mt-12 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.category}
              className="group flex min-h-[340px] flex-col rounded-[22px] border border-white/[0.12] bg-white/[0.035] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-sky-400/40 hover:bg-white/[0.055] sm:p-8"
            >
              <div className="mb-8 h-px w-14 bg-sky-400/70" />

              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-300/80">
                {service.category}
              </p>

              <h3
                className="mt-5 text-[25px] font-normal leading-[1.2] tracking-[-0.025em] text-white"
                style={{
                  fontFamily:
                    "var(--font-headline),system-ui,sans-serif",
                }}
              >
                {service.title}
              </h3>

              <p className="mt-5 text-[14px] leading-[1.75] text-white/60">
                {service.description}
              </p>

              <p className="mt-5 text-[11px] text-sky-200/55">
                {service.detail}
              </p>

              <Link
                href={prefix + service.href}
                className="mt-auto flex items-center justify-between gap-4 border-t border-white/10 pt-6 text-[13px] font-medium text-white transition-colors hover:text-sky-300"
              >
                <span>{service.linkLabel}</span>
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-5 border-t border-white/10 pt-8 sm:flex-row sm:items-center">
          <p className="max-w-[560px] text-[14px] leading-[1.7] text-white/55">
            Ihre Anforderungen passen nicht in eine Kategorie?
            Wir entwickeln die passende Lösung für Ihr Unternehmen.
          </p>

          <Link
            href={prefix + "/kontakt"}
            className="inline-flex items-center gap-3 rounded-xl border border-sky-400/40 bg-sky-400/10 px-6 py-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-sky-400/20"
          >
            Softwareprojekt besprechen
            <span aria-hidden="true">→</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
