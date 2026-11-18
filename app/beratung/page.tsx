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
  return <main className="ds-app min-h-screen bg-[#080c15] pt-28 text-white">
    <section className="mx-auto max-w-6xl px-5 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[.23em] text-violet-300">NEXCEL AI · Projektberatung</p>
      <h1 className="mt-5 max-w-4xl text-4xl font-light tracking-tight sm:text-6xl">KI-Beratung: vom konkreten Problem zum passenden System.</h1>
      <p className="mt-6 max-w-3xl text-base leading-8 text-white/65">Sie möchten KI-Agenten einführen, wiederkehrende Abläufe automatisieren oder Sprachmodelle kontrolliert in Ihre Prozesse integrieren? Im Gespräch klären wir Ziel, bestehende Systeme, Datenlage und den nächsten sinnvollen Umsetzungsschritt.</p>
      <ConsultationBooking brand="nexcel" />
      <div className="grid gap-6 py-16 md:grid-cols-3">
        <div><h2 className="text-lg font-medium">Vor dem Gespräch</h2><p className="mt-2 text-sm leading-6 text-white/60">Teilen Sie uns Branche, Ziel, Zeitrahmen und vorhandene technische Systeme mit.</p></div>
        <div><h2 className="text-lg font-medium">Im Gespräch</h2><p className="mt-2 text-sm leading-6 text-white/60">Wir besprechen sinnvolle Anwendungsfälle, Integrationsgrenzen und offene Anforderungen.</p></div>
        <div><h2 className="text-lg font-medium">Danach</h2><p className="mt-2 text-sm leading-6 text-white/60">Die nächsten Schritte werden individuell abgestimmt; kein automatisiertes Produktversprechen.</p></div>
      </div>
      <SeoJsonLd schema={[webPageForUrl({ brand: "nexcel", url, name: title, description }), serviceSchema({ brand: "nexcel", name: title, description, url, serviceType: "KI- und Automatisierungsberatung" })]} />
    </section><Footer />
  </main>;
}
