import type { Metadata } from "next";
import ConsultationBooking from "@/components/consultations/ConsultationBooking";
import Footer from "@/components/Footer";
import ConsultationIntentLinks from "@/components/seo/ConsultationIntentLinks";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { serviceSchema, webPageForUrl } from "@/lib/seo/jsonld";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateSeoMetadata({ brand: "agiworks", path: "/beratung" });
const url = "https://www.agiworks.de/beratung";
const title = "Softwareberatung und Architekturgespräch für Unternehmen";
const description = "Technisches Erstgespräch zu Softwareentwicklung, ERP, CRM, SaaS, Web-Apps und Systemintegration. Ziele, Bestandssysteme und Projektrahmen strukturiert klären.";
export default function AgiWorksBeratungPage() {
  return <main className="ds-app min-h-screen bg-[#080c15] pt-40 text-white sm:pt-44 lg:pt-48">
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <header className="mx-auto mb-11 max-w-3xl text-center sm:mb-14">
        <p className="text-xs font-semibold uppercase tracking-[.23em] text-sky-300">AGI WORKS · BERATUNGSTERMIN</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl">Sprechen wir über Ihr Softwareprojekt.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">Wählen Sie einen Termin und geben Sie uns einen kurzen Einblick in Ihr Unternehmen und Ihr Vorhaben.</p>
      </header>
      <ConsultationBooking brand="agiworks" />
      <ConsultationIntentLinks brand="agiworks" />
      <section className="mx-auto max-w-2xl px-2 pb-20 pt-16 text-center sm:pt-20" aria-label="Persönliche Rückmeldung">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-sky-300">PERSÖNLICH. DIREKT. UNKOMPLIZIERT.</p>
        <h2 className="mt-4 text-2xl font-medium tracking-tight text-white sm:text-3xl">Wir freuen uns auf das Gespräch mit Ihnen.</h2>
        <p className="mt-4 text-sm leading-7 text-white/60 sm:text-base">Wir prüfen Ihre Anfrage persönlich und melden uns zur Terminbestätigung bei Ihnen.</p>
      </section>
      <SeoJsonLd schema={[webPageForUrl({ brand: "agiworks", url, name: title, description }), serviceSchema({ brand: "agiworks", name: title, description, url, serviceType: "Software- und Architekturberatung" })]} />
    </section><Footer />
  </main>;
}
