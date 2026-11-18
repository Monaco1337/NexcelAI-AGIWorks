import type { Metadata } from "next";
import ConsultationBooking from "@/components/consultations/ConsultationBooking";
import Footer from "@/components/Footer";
import SeoJsonLd from "@/components/seo/SeoJsonLd";
import { serviceSchema, webPageForUrl } from "@/lib/seo/jsonld";
import { generateSeoMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = generateSeoMetadata({ brand: "nexcel", path: "/beratung" });
const url = "https://www.nexcelai.de/beratung";
const title = "KI-Beratung und Automatisierung für Unternehmen";
const description = "Beratung für KI-Agenten, Unternehmensautomatisierung und eigene LLM-Systeme: Projektziel, Ausgangslage und mögliche Umsetzung gemeinsam klären.";
export default function BeratungPage() {
  return <main className="ds-app min-h-screen bg-[#080c15] pt-40 text-white sm:pt-44 lg:pt-48">
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <header className="mx-auto mb-11 max-w-3xl text-center sm:mb-14">
        <p className="text-xs font-semibold uppercase tracking-[.23em] text-violet-300">NEXCEL AI · BERATUNGSTERMIN</p>
        <h1 className="mx-auto mt-5 max-w-3xl text-3xl font-medium leading-tight tracking-tight sm:text-5xl">Lassen Sie uns über Ihr Vorhaben sprechen.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">Wählen Sie einen Termin und erzählen Sie uns kurz, wobei wir Sie unterstützen können.</p>
      </header>
      <ConsultationBooking brand="nexcel" />
      <section className="mx-auto max-w-2xl px-2 pb-20 pt-16 text-center sm:pt-20" aria-label="Persönliche Rückmeldung">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-violet-300">PERSÖNLICH. DIREKT. UNKOMPLIZIERT.</p>
        <h2 className="mt-4 text-2xl font-medium tracking-tight text-white sm:text-3xl">Wir freuen uns darauf, Sie kennenzulernen.</h2>
        <p className="mt-4 text-sm leading-7 text-white/60 sm:text-base">Wir prüfen Ihre Anfrage persönlich und melden uns zur Terminbestätigung bei Ihnen.</p>
      </section>
      <SeoJsonLd schema={[webPageForUrl({ brand: "nexcel", url, name: title, description }), serviceSchema({ brand: "nexcel", name: title, description, url, serviceType: "KI- und Automatisierungsberatung" })]} />
    </section><Footer />
  </main>;
}
