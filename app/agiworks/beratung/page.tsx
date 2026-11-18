import type { Metadata } from "next";
import ConsultationBooking from "@/components/consultations/ConsultationBooking";
import Footer from "@/components/Footer";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { serviceSchema, webPageForUrl } from "@/lib/seo/jsonld";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateSeoMetadata({ brand: "agiworks", path: "/beratung" });
const url = "https://www.agiworks.de/beratung";
const title = "Softwareberatung und Architekturgespräch für Unternehmen";
const description = "Technisches Erstgespräch zu Softwareentwicklung, ERP, CRM, SaaS, Web-Apps und Systemintegration. Ziele, Bestandssysteme und Projektrahmen strukturiert klären.";
export default function AgiWorksBeratungPage() {
  return <main className="ds-app min-h-screen bg-[#080c15] pt-28 text-white">
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[.23em] text-sky-300">AGI Works · Softwareberatung</p>
      <h1 className="mt-5 max-w-4xl text-4xl font-light tracking-tight sm:text-6xl">Softwareberatung: Architektur, Integrationen und Projektumfang klären.</h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-white/65">Ob ERP, CRM, SaaS-Plattform, Web-Anwendung oder interne Schnittstellen: Beschreiben Sie den aktuellen Stand und die gewünschte Zielarchitektur. Wir besprechen Anforderungen, technische Abhängigkeiten, Risiken und einen realistischen nächsten Schritt.</p>
      <ConsultationBooking brand="agiworks" />
      <div className="grid gap-6 py-16 md:grid-cols-3">
        <div><h2 className="text-lg font-medium">Projektkontext</h2><p className="mt-2 text-sm leading-6 text-white/60">Vorab erfassen wir Ziele, involvierte Systeme und den geplanten Zeitrahmen.</p></div>
        <div><h2 className="text-lg font-medium">Architekturgespräch</h2><p className="mt-2 text-sm leading-6 text-white/60">Wir analysieren Anforderungen, Integrationspunkte und technische Entscheidungsoptionen.</p></div>
        <div><h2 className="text-lg font-medium">Nächste Schritte</h2><p className="mt-2 text-sm leading-6 text-white/60">Ein konkreter Vorschlag entsteht auf Basis des tatsächlich geklärten Leistungsumfangs.</p></div>
      </div>
      <SeoJsonLd schema={[webPageForUrl({ brand: "agiworks", url, name: title, description }), serviceSchema({ brand: "agiworks", name: title, description, url, serviceType: "Software- und Architekturberatung" })]} />
    </section><Footer />
  </main>;
}
