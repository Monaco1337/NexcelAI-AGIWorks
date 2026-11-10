"use client";
// NXL_CONTACT_AGI_PARITY_V3 -- render only on the NEXCEL /kontakt route.
import { usePathname } from "next/navigation";

export function NexcelContactFormIntro() {
  const path = usePathname();
  if (path !== "/kontakt") return null;
  return (
    <header className="nxl-contact-parity-form-intro">
      <p className="nxl-contact-parity-overline">PROJEKTANFRAGE</p>
      <h2>Erzählen Sie uns von Ihrem Vorhaben.</h2>
      <p>Ob Automatisierung, KI-Agent oder eigenes LLM: Beschreiben Sie kurz
        Ihre Anforderungen. Gemeinsam klären wir, welche Lösung sinnvoll ist.</p>
    </header>
  );
}

const reasons = [
  ["Persönlicher Austausch", "Wir besprechen Ihre Anforderungen direkt und verständlich."],
  ["Individuelle KI-Lösungen", "Abgestimmt auf Ihre Daten, Abläufe und vorhandenen Systeme."],
  ["Klare nächste Schritte", "Wir klären die Machbarkeit und den sinnvollen Projektumfang."],
] as const;

const steps = [
  ["Anfrage senden", "Sie schildern kurz Ihr Vorhaben."],
  ["Anforderungen besprechen", "Wir klären gemeinsam Ziele und Rahmenbedingungen."],
  ["Nächstes Vorgehen", "Wir stimmen die sinnvollen weiteren Schritte ab."],
] as const;

export function NexcelContactAsideDetails() {
  const path = usePathname();
  if (path !== "/kontakt") return null;
  return (
    <div className="nxl-contact-parity-aside-more">
      <section className="nxl-contact-parity-list">
        <p className="nxl-contact-parity-overline">DARUM NEXCEL AI</p>
        {reasons.map(([title, description]) => (
          <div className="nxl-contact-parity-reason" key={title}>
            <span className="nxl-contact-parity-check" aria-hidden="true">✓</span>
            <div><strong>{title}</strong><p>{description}</p></div>
          </div>
        ))}
      </section>
      <section className="nxl-contact-parity-list nxl-contact-parity-steps">
        <p className="nxl-contact-parity-overline">SO GEHT ES WEITER</p>
        {steps.map(([title, description], index) => (
          <div className="nxl-contact-parity-reason" key={title}>
            <span className="nxl-contact-parity-step" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div><strong>{title}</strong><p>{description}</p></div>
          </div>
        ))}
      </section>
    </div>
  );
}
