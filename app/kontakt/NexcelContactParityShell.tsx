// NXL_CONTACT_AGI_PARITY_V3 -- NEXCEL route only
import type { ReactNode } from "react";
import "./nexcel-contact-parity-v3.css";

export default function NexcelContactParityShell({ children }: { children: ReactNode }) {
  return (
    <div className="nxl-contact-parity" data-nxl-contact-parity="true">
      <header className="nxl-contact-parity-hero" aria-labelledby="nxl-contact-parity-title">
        <p className="nxl-contact-parity-hero-brand">NEXCEL AI</p>
        <h1 id="nxl-contact-parity-title">
          Ihr KI-Projekt. <span>Unser Fokus.</span>
        </h1>
        <p className="nxl-contact-parity-hero-subline">
          Erzählen Sie uns, was Sie automatisieren oder mit KI entwickeln möchten.
          Wir klären gemeinsam, welcher nächste Schritt zu Ihrem Vorhaben passt.
        </p>
        <div className="nxl-contact-parity-signals" aria-label="Ihre Vorteile">
          <span><i aria-hidden="true" /> Persönlicher Kontakt</span>
          <span><i aria-hidden="true" /> Individuelle KI-Konzeption</span>
          <span><i aria-hidden="true" /> Unverbindliche Anfrage</span>
        </div>
      </header>
      {children}
    </div>
  );
}
