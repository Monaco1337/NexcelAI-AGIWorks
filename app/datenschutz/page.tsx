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

/* Wiederverwendbare, dezente Linien-Icons (kein Branding, neutral) */
const Svg = ({ d }: { d: string }) => (
  <svg className="w-6 h-6 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
    {d.split("|").map((path, i) => (
      <path key={i} strokeLinecap="round" strokeLinejoin="round" d={path} />
    ))}
  </svg>
);

/* Karten-Styling (Glas) – einheitlich */
const cardStyle = {
  background: "rgba(164, 92, 255, 0.05)",
  border: "1px solid rgba(164, 92, 255, 0.15)",
  boxShadow: "0 4px 20px rgba(164, 92, 255, 0.1)",
} as const;

const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 rounded-xl ${className}`} style={cardStyle}>
    {children}
  </div>
);

const Para = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[#E5E7EB] leading-relaxed text-[15px] md:text-base">{children}</p>
);

const Label = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-semibold text-[#A45CFF] mb-2 uppercase tracking-wider">{children}</p>
);

const Bullets = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 text-[#E5E7EB] text-[15px]">
    {items.map((item) => (
      <li key={item} className="flex items-start">
        <span className="text-[#A45CFF] mr-2 mt-0.5">•</span>
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

/* Definitions-Zeilen (Zweck / Rechtsgrundlage / Speicherdauer …) */
const Meta = ({ rows }: { rows: [string, string][] }) => (
  <div className="mt-4 pt-4 border-t border-[#A45CFF]/20 space-y-1.5 text-sm text-[#E5E7EB]">
    {rows.map(([k, v]) => (
      <p key={k}>
        <strong className="text-[#FFFFFF]">{k}:</strong> {v}
      </p>
    ))}
  </div>
);

export default function DatenschutzPage() {
  const sections = [
    /* 1 — Einleitung */
    {
      title: "1. Einleitung",
      icon: <Svg d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>
            Der Schutz personenbezogener Daten hat für AGI Works höchste Priorität. Wir verarbeiten
            personenbezogene Daten ausschließlich im Einklang mit den geltenden datenschutzrechtlichen
            Vorschriften, insbesondere der Datenschutz-Grundverordnung (DSGVO), dem
            Bundesdatenschutzgesetz (BDSG), dem Telekommunikation-Digitale-Dienste-Datenschutz-Gesetz
            (TDDDG) sowie weiteren anwendbaren europäischen und nationalen Bestimmungen. Soweit
            KI-Systeme eingesetzt werden, berücksichtigen wir zusätzlich die Vorgaben der
            Verordnung (EU) 2024/1689 (EU-KI-Verordnung / „AI Act").
          </Para>
          <div className="mt-4">
            <Para>
              Diese Erklärung informiert nach Art. 13 und 14 DSGVO über Art, Umfang, Zwecke und
              Rechtsgrundlagen der Verarbeitung im Zusammenhang mit der Nutzung unserer Website
              (www.agiworks.de), unserer Analyse- und Diagnosesysteme sowie unserer
              Kommunikationskanäle.
            </Para>
          </div>
        </Card>
      ),
    },

    /* 2 — Verantwortlicher */
    {
      title: "2. Verantwortlicher",
      icon: <Svg d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Label>Verantwortlicher im Sinne von Art. 4 Nr. 7 DSGVO</Label>
            <p className="text-lg font-semibold text-[#FFFFFF] mb-2">AGI Works — Kevin Blazevic</p>
            <p className="text-[#E5E7EB] leading-relaxed">
              Hansastraße 34<br />
              59423 Unna, Deutschland
            </p>
          </Card>
          <Card>
            <Label>Kontakt</Label>
            <div className="space-y-2">
              <a href="mailto:info@agiworks.de" className="block text-[#E5E7EB] hover:text-[#A45CFF] transition-colors font-medium">info@agiworks.de</a>
              <a href="mailto:kontakt@agiworks.de" className="block text-[#E5E7EB] hover:text-[#A45CFF] transition-colors font-medium">kontakt@agiworks.de</a>
            </div>
            <p className="mt-3 text-sm text-[#9CA3AF]">
              Weitere Kontaktmöglichkeiten können dem{" "}
              <Link href="/impressum" className="text-[#A45CFF] hover:text-[#CBA6FF] underline">Impressum</Link>{" "}
              entnommen werden.
            </p>
          </Card>
        </div>
      ),
    },

    /* 3 — Datenschutzgrundsätze */
    {
      title: "3. Grundsätze der Verarbeitung (Art. 5 DSGVO)",
      icon: <Svg d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
      content: (
        <Card>
          <Para>Wir verarbeiten personenbezogene Daten ausschließlich nach den Grundsätzen des Art. 5 DSGVO:</Para>
          <div className="mt-4">
            <Bullets items={[
              "Rechtmäßigkeit, Verarbeitung nach Treu und Glauben, Transparenz",
              "Zweckbindung",
              "Datenminimierung",
              "Richtigkeit",
              "Speicherbegrenzung",
              "Integrität und Vertraulichkeit",
              "Rechenschaftspflicht",
            ]} />
          </div>
        </Card>
      ),
    },

    /* 4 — Hosting (Vercel) */
    {
      title: "4. Hosting & technische Bereitstellung (Vercel)",
      icon: <Svg d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Unsere Website und die zugehörigen Server-Funktionen (Serverless Functions) werden
              bereitgestellt durch:
            </Para>
            <p className="mt-3 text-lg font-semibold text-[#FFFFFF]">Vercel Inc.</p>
            <p className="text-[#E5E7EB] leading-relaxed">
              340 S Lemon Ave #4133, Walnut, CA 91789, USA
            </p>
            <p className="mt-3 text-[#E5E7EB] leading-relaxed text-[15px]">
              Die Auslieferung und Ausführung erfolgt vorrangig über das EU-Rechenzentrum in
              Frankfurt am Main (Region <span className="text-white">fra1</span>). Vercel ist
              Auftragsverarbeiter nach Art. 28 DSGVO; ein Auftragsverarbeitungsvertrag besteht.
            </p>
          </Card>
          <Card>
            <Label>Verarbeitete Daten (Server-Logfiles)</Label>
            <Bullets items={[
              "IP-Adresse",
              "Browsertyp und -version",
              "Betriebssystem",
              "Referrer-URL",
              "Datum und Uhrzeit des Zugriffs",
              "Hostname / angefragte URL",
              "HTTP-Statuscodes",
              "übertragene Datenmengen",
            ]} />
            <Meta rows={[
              ["Zweck", "Bereitstellung der Website, Systemsicherheit, Fehleranalyse, Missbrauchserkennung, Performanceoptimierung"],
              ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse)"],
              ["Drittland", "USA — Standardvertragsklauseln (SCC) sowie EU-U.S. Data Privacy Framework"],
              ["Speicherdauer", "max. 30 Tage, sofern keine längere Aufbewahrung aus Sicherheitsgründen erforderlich ist"],
            ]} />
          </Card>
        </div>
      ),
    },

    /* 5 — CDN / Edge Network */
    {
      title: "5. Content-Delivery-Network & Schriftarten",
      icon: <Svg d="M13 10V3L4 14h7v7l9-11h-7z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Statische Inhalte (z. B. Skripte, Bilder, Stylesheets) werden über das global verteilte
              Edge-Netzwerk von Vercel Inc. ausgeliefert, um Ladezeiten zu optimieren und die
              Verfügbarkeit sicherzustellen. Dabei werden technisch notwendige Verbindungsdaten
              (insb. IP-Adresse) verarbeitet.
            </Para>
            <Meta rows={[
              ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. f DSGVO"],
            ]} />
          </Card>
          <Card>
            <Label>Schriftarten (Self-Hosting)</Label>
            <Para>
              Wir verwenden die Schriftarten „Inter" und „Plus Jakarta Sans". Diese werden zum
              Erstellungszeitpunkt lokal eingebunden und ausschließlich von unserer eigenen
              Infrastruktur ausgeliefert. Es findet <span className="text-white">keine</span>{" "}
              Verbindung zu Google-Servern und keine Übermittlung Ihrer IP-Adresse an Dritte zum
              Zweck der Schriftauslieferung statt.
            </Para>
          </Card>
        </div>
      ),
    },

    /* 6 — SSL/TLS */
    {
      title: "6. SSL-/TLS-Verschlüsselung",
      icon: <Svg d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
      content: (
        <Card>
          <Para>
            Unsere Website verwendet moderne SSL-/TLS-Verschlüsselungsverfahren. Die Übertragung
            sämtlicher Daten erfolgt verschlüsselt, um unbefugte Zugriffe durch Dritte zu verhindern.
          </Para>
        </Card>
      ),
    },

    /* 7 — Datenbank / Speicherung (Supabase) */
    {
      title: "7. Datenbank & Speicherung (Supabase / PostgreSQL)",
      icon: <Svg d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Anfragen, Kontakt- und Geschäftsdaten werden in einer PostgreSQL-Datenbank gespeichert,
              die wir über folgenden Dienstleister betreiben:
            </Para>
            <p className="mt-3 text-lg font-semibold text-[#FFFFFF]">Supabase Inc.</p>
            <p className="text-[#E5E7EB] leading-relaxed text-[15px]">
              970 Toa Payoh North #07-04, Singapur 318992 — Datenhaltung in der EU-Region
              (Frankfurt am Main). Supabase ist Auftragsverarbeiter nach Art. 28 DSGVO.
            </p>
          </Card>
          <Card>
            <Label>Verarbeitete Daten</Label>
            <Bullets items={[
              "Vor- und Nachname",
              "E-Mail-Adresse, Telefonnummer (optional)",
              "Unternehmen (optional)",
              "Betreff und Inhalt der Nachricht",
              "Status- und Bearbeitungsinformationen (z. B. gelesen/archiviert)",
              "Zeitstempel der Erstellung und Aktualisierung",
            ]} />
            <Meta rows={[
              ["Zweck", "Verwaltung von Anfragen, Kundenkommunikation, Vertragsanbahnung und -abwicklung"],
              ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. b und lit. f DSGVO"],
              ["Verschlüsselung", "TLS bei Übertragung, AES-256 at Rest"],
              ["Speicherdauer", "bis Zweckfortfall; gesetzliche Aufbewahrungsfristen (HGB/AO, bis zu 10 Jahre) bleiben unberührt"],
            ]} />
          </Card>
        </div>
      ),
    },

    /* 8 — Kontaktaufnahme */
    {
      title: "8. Kontaktaufnahme",
      icon: <Svg d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      content: (
        <Card>
          <Para>
            Bei einer Kontaktaufnahme per Kontaktformular, E-Mail oder Telefon verarbeiten wir die von
            Ihnen übermittelten Daten — insbesondere Name, E-Mail-Adresse, Telefonnummer,
            Unternehmensdaten, Inhalt Ihrer Nachricht sowie die Kommunikationshistorie.
          </Para>
          <Meta rows={[
            ["Zweck", "Bearbeitung Ihrer Anfrage, Vertragsanbahnung, Kundenbetreuung"],
            ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich/vertraglich) bzw. lit. f DSGVO"],
            ["Speicherdauer", "bis zur abschließenden Bearbeitung; darüber hinaus nur bei gesetzlicher Aufbewahrungspflicht"],
          ]} />
        </Card>
      ),
    },

    /* 9 — System-/Unternehmensanalyse (Diagnose) */
    {
      title: "9. System- & Unternehmensanalyse (Diagnose-Tool)",
      icon: <Svg d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Wir bieten eine digitale Unternehmens- und Systemanalyse an. Hierbei können — je nach
              Eingabe — folgende Daten verarbeitet werden:
            </Para>
            <div className="mt-4">
              <Bullets items={[
                "Website-Adresse (URL), die zur Analyse angegeben wird",
                "hochgeladene Dokumente/Dateien (max. 8 MB je Datei, max. 10 Dateien je Analyse)",
                "Angaben zu Unternehmen, Branche, Prozessen und Zielen",
                "technische Sitzungsdaten (z. B. Session-Kennung, Gerätetyp, Referrer)",
                "eine pseudonymisierte, gehashte IP-Adresse (SHA-256, gekürzt) zur Missbrauchsvermeidung",
                "Analyse- und Bewertungsergebnisse, Handlungsempfehlungen",
              ]} />
            </div>
          </Card>
          <Card>
            <Label>Abruf externer Inhalte (URL-Scan)</Label>
            <Para>
              Geben Sie eine Website-Adresse an, ruft unser Server die öffentlich erreichbare Seite
              einmalig serverseitig ab (um technische Beschränkungen aufzulösen). Dabei werden nur
              die öffentlich verfügbaren Inhalte der angegebenen Seite geladen und ausgewertet.
              Private/lokale Adressbereiche werden blockiert.
            </Para>
            <Meta rows={[
              ["Zweck", "Erstellung individueller Analysen, Beratung, Angebots- und Projektplanung"],
              ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. b DSGVO (vorvertraglich) bzw. lit. f DSGVO"],
              ["Speicherort Uploads", "temporäres Verzeichnis der Ausführungsumgebung bzw. projektinterne Ablage; keine Weitergabe an Dritte außerhalb der genannten Auftragsverarbeiter"],
            ]} />
          </Card>
        </div>
      ),
    },

    /* 10 — On-Device-KI */
    {
      title: "10. KI-gestützte Analyse im Browser (On-Device)",
      icon: <Svg d="M12 2a3 3 0 00-3 3v1a3 3 0 00-3 3 3 3 0 000 6 3 3 0 003 3v1a3 3 0 006 0v-1a3 3 0 003-3 3 3 0 000-6 3 3 0 00-3-3V5a3 3 0 00-3-3z|M9 12h6" />,
      content: (
        <Card>
          <Para>
            Teile der Analyse können direkt in Ihrem Browser ausgeführt werden. Hierfür laden wir
            quelloffene KI-Modelle (über die Bibliothek „Transformers.js" von Hugging Face) einmalig
            herunter und führen die Auswertung anschließend <span className="text-white">lokal auf
            Ihrem Endgerät</span> aus.
          </Para>
          <div className="mt-3">
            <Bullets items={[
              "Die Inhalte Ihrer Analyse verlassen für diese Verarbeitung Ihr Gerät nicht.",
              "Es findet lediglich ein technischer Modell-Download vom Anbieter Hugging Face, Inc. (USA) statt; dabei werden keine Analyseinhalte übermittelt.",
              "Telemetrie der Bibliothek ist deaktiviert.",
            ]} />
          </div>
          <Meta rows={[
            ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. b und lit. f DSGVO"],
            ["Drittland (nur Modell-Download)", "USA — Standardvertragsklauseln (SCC)"],
          ]} />
        </Card>
      ),
    },

    /* 11 — Serverseitige KI (OpenAI) — separat dokumentiert */
    {
      title: "11. Serverseitige KI-Verarbeitung (OpenAI)",
      icon: <Svg d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Sofern aktiviert, nutzen wir zur Erstellung textlicher Auswertungen ein großes
              Sprachmodell (LLM) des folgenden Anbieters:
            </Para>
            <p className="mt-3 text-lg font-semibold text-[#FFFFFF]">OpenAI</p>
            <p className="text-[#E5E7EB] leading-relaxed text-[15px]">
              OpenAI Ireland Ltd., 1st Floor, The Liffey Trust Centre, 117–126 Sheriff Street Upper,
              Dublin 1, Irland (für Nutzer im EWR) — ggf. unter Einbindung der OpenAI, L.L.C. (USA).
              Eingesetztes Modell: GPT-4o-mini (bzw. konfiguriertes Modell).
            </p>
          </Card>
          <Card>
            <Label>Übermittelte Daten</Label>
            <Bullets items={[
              "die zur Auswertung aufbereiteten Analyse-Rohdaten (z. B. Angaben zu Unternehmen, Prozessen, Website-Inhalten)",
              "keine bewusste Übermittlung besonderer Kategorien personenbezogener Daten (Art. 9 DSGVO)",
            ]} />
            <Meta rows={[
              ["Zweck", "Erstellung einer verständlichen, strukturierten Auswertung und Systemempfehlung"],
              ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. b und lit. f DSGVO"],
              ["Training", "Keine Nutzung der über die API übermittelten Daten zum Training der Modelle (gemäß den API-Bedingungen von OpenAI)"],
              ["Drittland", "USA — Standardvertragsklauseln (SCC) sowie EU-U.S. Data Privacy Framework"],
            ]} />
          </Card>
          <Card className="!bg-[rgba(164,92,255,0.08)]">
            <Label>Hinweis nach EU-KI-Verordnung (AI Act)</Label>
            <Para>
              Die eingesetzten KI-Systeme dienen ausschließlich der Erstellung von Analysen und
              Empfehlungen zur Unterstützung menschlicher Entscheidungen. Eine ausschließlich
              automatisierte Entscheidung mit rechtlicher Wirkung oder vergleichbarer erheblicher
              Beeinträchtigung im Sinne von Art. 22 DSGVO findet nicht statt. Ergebnisse der
              KI-Auswertung werden vor einer geschäftlichen Verwendung durch uns geprüft (Human
              Oversight).
            </Para>
          </Card>
        </div>
      ),
    },

    /* 12 — E-Mail (Resend) */
    {
      title: "12. E-Mail-Versand (Resend)",
      icon: <Svg d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Für den Versand von Bestätigungs-, Benachrichtigungs- und Systemnachrichten setzen wir
              folgenden E-Mail-Dienstleister ein:
            </Para>
            <p className="mt-3 text-lg font-semibold text-[#FFFFFF]">Resend (Resend, Inc.)</p>
            <p className="text-[#E5E7EB] leading-relaxed text-[15px]">
              2261 Market Street #5039, San Francisco, CA 94114, USA. Auftragsverarbeiter nach
              Art. 28 DSGVO.
            </p>
          </Card>
          <Card>
            <Label>Verarbeitete Daten</Label>
            <Bullets items={[
              "E-Mail-Adresse (Empfänger/Absender)",
              "Betreff und Inhalt der Nachricht",
              "Versandzeitpunkt und Zustellinformationen",
            ]} />
            <Meta rows={[
              ["Zweck", "Zustellung transaktionaler E-Mails (Bestätigungen, Benachrichtigungen)"],
              ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. b und lit. f DSGVO"],
              ["Drittland", "USA — Standardvertragsklauseln (SCC)"],
            ]} />
          </Card>
        </div>
      ),
    },

    /* 13 — First-Party-Analytics */
    {
      title: "13. Reichweitenmessung (First-Party-Analyse)",
      icon: <Svg d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Zur Verbesserung unseres Angebots betreiben wir eine eigene (First-Party-)
              Reichweitenmessung. Es werden <span className="text-white">keine</span> Dienste Dritter
              wie Google Analytics eingesetzt und keine geräteübergreifenden Werbeprofile gebildet.
              Die IP-Adresse wird ausschließlich in <span className="text-white">gehashter</span> Form
              (pseudonymisiert) verarbeitet.
            </Para>
          </Card>
          <Card>
            <Label>Verarbeitete Daten</Label>
            <Bullets items={[
              "Seitenaufrufe, Klick- und Scrollverhalten, Verweildauer",
              "pseudonyme Sitzungs- und Besucher-Kennungen",
              "gehashte IP-Adresse, Referrer, Hostname",
              "Browser-/Gerätetyp (User-Agent), Viewport-Größe",
            ]} />
            <Para>
              <span className="text-[#9CA3AF] text-sm">
                Die Daten werden in einem Key-Value-Speicher (Upstash Redis bzw. Vercel KV) abgelegt.
              </span>
            </Para>
            <Meta rows={[
              ["Zweck", "statistische Auswertung, Optimierung von Inhalten und Performance"],
              ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an pseudonymer Reichweitenmessung)"],
              ["Drittland", "EU/USA — Standardvertragsklauseln (SCC), soweit Verarbeitung außerhalb der EU erfolgt"],
            ]} />
          </Card>
        </div>
      ),
    },

    /* 14 — Cookies & lokale Speichertechnologien */
    {
      title: "14. Cookies & lokale Speichertechnologien",
      icon: <Svg d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>
            Wir setzen technisch notwendige Cookies sowie — zur Speicherung Ihrer
            Datenschutz-Einstellungen — den lokalen Browserspeicher (localStorage) ein. Nicht
            erforderliche Technologien (Analyse/Marketing) werden ausschließlich nach Ihrer
            ausdrücklichen Einwilligung verwendet.
          </Para>
          <div className="mt-4">
            <Label>Kategorien</Label>
            <Bullets items={[
              "Essenziell (technisch notwendig, z. B. Sitzung/Authentifizierung)",
              "Analyse (nur mit Einwilligung)",
              "Marketing (nur mit Einwilligung)",
            ]} />
          </div>
          <Meta rows={[
            ["Rechtsgrundlage", "§ 25 Abs. 2 TDDDG (technisch notwendig) bzw. § 25 Abs. 1 TDDDG i. V. m. Art. 6 Abs. 1 lit. a DSGVO (Einwilligung)"],
            ["Widerruf", "jederzeit über die Cookie-Einstellungen mit Wirkung für die Zukunft möglich"],
          ]} />
        </Card>
      ),
    },

    /* 15 — Consent-Management */
    {
      title: "15. Consent-Management",
      icon: <Svg d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>
            Zur Verwaltung Ihrer Einwilligungen verwenden wir ein eigenes
            Consent-Management. Ihre Auswahl wird lokal in Ihrem Browser (localStorage) gespeichert;
            dabei werden insbesondere die gewählten Kategorien sowie der Zeitpunkt der Einwilligung
            festgehalten. Eine Übermittlung an Dritte findet hierbei nicht statt.
          </Para>
          <Meta rows={[
            ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. c und lit. f DSGVO (Nachweis- und Dokumentationspflicht)"],
          ]} />
        </Card>
      ),
    },

    /* 16 — Login / Authentifizierung */
    {
      title: "16. Zugänge, Login & Authentifizierung",
      icon: <Svg d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />,
      content: (
        <Card>
          <Para>
            Für geschützte Bereiche (z. B. Demo-Zugänge, Administration) verarbeiten wir
            Anmeldedaten. Passwörter werden ausschließlich als kryptografischer Hash (bcrypt)
            gespeichert; die Sitzungsverwaltung erfolgt über signierte Token (JWT).
          </Para>
          <div className="mt-3">
            <Bullets items={[
              "Name / Benutzerkennung",
              "E-Mail-Adresse",
              "Unternehmen (sofern angegeben)",
              "gehashtes Passwort, Sitzungs-Token",
            ]} />
          </div>
          <Meta rows={[
            ["Zweck", "Bereitstellung gesicherter Zugänge, Authentifizierung, Schutz vor unbefugtem Zugriff"],
            ["Rechtsgrundlage", "Art. 6 Abs. 1 lit. b und lit. f DSGVO"],
          ]} />
        </Card>
      ),
    },

    /* 17 — Auftragsverarbeiter-Tabelle */
    {
      title: "17. Auftragsverarbeiter (Art. 28 DSGVO)",
      icon: <Svg d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>
              Wir setzen ausschließlich sorgfältig ausgewählte Dienstleister ein, mit denen
              Verträge zur Auftragsverarbeitung gemäß Art. 28 DSGVO bestehen. Die nachfolgende
              Übersicht bildet die tatsächlich eingesetzten Dienste ab.
            </Para>
          </Card>
          <div className="rounded-xl overflow-hidden" style={cardStyle}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13.5px] text-[#E5E7EB]">
                <thead>
                  <tr className="border-b border-[#A45CFF]/25 text-[#A45CFF] uppercase tracking-wider text-[11px]">
                    <th className="p-3 font-semibold">Anbieter</th>
                    <th className="p-3 font-semibold">Zweck</th>
                    <th className="p-3 font-semibold">Daten</th>
                    <th className="p-3 font-semibold">Standort / Garantie</th>
                  </tr>
                </thead>
                <tbody className="align-top">
                  {[
                    ["Vercel Inc.", "Hosting, Serverless Functions, CDN/Edge", "Server-Logs, IP-Adresse, Nutzungsdaten", "USA / EU (Frankfurt) — SCC, DPF"],
                    ["Supabase Inc.", "Datenbank (PostgreSQL)", "Kontakt-/Stammdaten, Kommunikationsinhalte", "EU (Frankfurt) — AVV, SCC"],
                    ["Upstash, Inc. / Vercel KV", "Reichweiten- & Sitzungsspeicher (Key-Value)", "gehashte IP, pseudonyme Event-/Sitzungsdaten", "EU/USA — SCC"],
                    ["Resend, Inc.", "Versand transaktionaler E-Mails", "E-Mail-Adresse, Inhalt, Zustelldaten", "USA — SCC"],
                    ["OpenAI Ireland Ltd. / OpenAI L.L.C.", "Serverseitige KI-Auswertung (LLM)", "aufbereitete Analyse-Eingaben", "EU/USA — SCC, DPF; kein Training"],
                    ["Hugging Face, Inc.", "Bereitstellung der On-Device-KI-Modelle", "nur Modell-Download (keine Analyseinhalte)", "USA — SCC"],
                  ].map((row) => (
                    <tr key={row[0]} className="border-b border-[#A45CFF]/10 last:border-0">
                      <td className="p-3 font-medium text-[#FFFFFF]">{row[0]}</td>
                      <td className="p-3">{row[1]}</td>
                      <td className="p-3">{row[2]}</td>
                      <td className="p-3">{row[3]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-[#9CA3AF]">
            SCC = EU-Standardvertragsklauseln · DPF = EU-U.S. Data Privacy Framework · AVV = Auftragsverarbeitungsvertrag
          </p>
        </div>
      ),
    },

    /* 18 — Datenflüsse */
    {
      title: "18. Datenflüsse (Überblick)",
      icon: <Svg d="M4 7h11M4 7l3-3M4 7l3 3M20 17H9m11 0l-3-3m3 3l-3 3" />,
      content: (
        <Card>
          <Bullets items={[
            "Website-Aufruf → Vercel (Auslieferung, Server-Logs).",
            "Kontaktanfrage → Speicherung in Supabase (PostgreSQL) → Benachrichtigung per Resend.",
            "Systemanalyse → optionaler serverseitiger Abruf der angegebenen URL → lokale Auswertung im Browser (Hugging Face Transformers.js) und/oder serverseitige Auswertung über OpenAI.",
            "Reichweitenmessung → pseudonyme Ereignisdaten (gehashte IP) → Upstash Redis / Vercel KV.",
            "Geschützte Zugänge → Authentifizierung über JWT, Passwörter als bcrypt-Hash.",
          ]} />
        </Card>
      ),
    },

    /* 19 — Drittland */
    {
      title: "19. Drittlandübermittlungen",
      icon: <Svg d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z|M3.6 9h16.8M3.6 15h16.8M12 3a15 15 0 010 18M12 3a15 15 0 000 18" />,
      content: (
        <Card>
          <Para>
            Soweit personenbezogene Daten in Staaten außerhalb der EU/des EWR übermittelt werden
            (insbesondere USA), erfolgt dies ausschließlich auf Grundlage geeigneter Garantien:
          </Para>
          <div className="mt-3">
            <Bullets items={[
              "EU-U.S. Data Privacy Framework (sofern der Empfänger zertifiziert ist)",
              "EU-Standardvertragsklauseln (SCC) gemäß Art. 46 DSGVO",
              "ergänzende technische und organisatorische Schutzmaßnahmen",
            ]} />
          </div>
        </Card>
      ),
    },

    /* 20 — Speicherdauer */
    {
      title: "20. Speicherdauer",
      icon: <Svg d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>
            Personenbezogene Daten werden nur so lange gespeichert, wie dies für die jeweiligen Zwecke
            erforderlich ist. Gesetzliche Aufbewahrungsfristen bleiben unberührt:
          </Para>
          <div className="mt-3">
            <Bullets items={[
              "Handelsrechtliche Aufbewahrung: bis zu 10 Jahre",
              "Steuerrechtliche Aufbewahrung: bis zu 10 Jahre",
              "Vertragsbezogene Daten: bis zum Ablauf gesetzlicher Verjährungsfristen",
              "Server-Logfiles: i. d. R. max. 30 Tage",
            ]} />
          </div>
        </Card>
      ),
    },

    /* 21 — Datensicherheit */
    {
      title: "21. Datensicherheit (Art. 32 DSGVO)",
      icon: <Svg d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />,
      content: (
        <Card>
          <Para>Wir setzen angemessene technische und organisatorische Maßnahmen ein, insbesondere:</Para>
          <div className="mt-3">
            <Bullets items={[
              "TLS-Verschlüsselung bei der Übertragung, AES-256 at Rest",
              "Pseudonymisierung (z. B. IP-Hashing) und Datenminimierung",
              "rollenbasierte Zugriffskontrolle und Least-Privilege-Prinzip",
              "kryptografische Passwortspeicherung (bcrypt) und Token-basierte Sitzungen",
              "Monitoring, Protokollierung und regelmäßige Backups",
              "Schutzmaßnahmen der eingesetzten Cloud-Plattformen (Firewalls, DDoS-Schutz)",
            ]} />
          </div>
        </Card>
      ),
    },

    /* 22 — Datenschutzverletzungen */
    {
      title: "22. Datenschutzverletzungen",
      icon: <Svg d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>
            Im Falle einer Verletzung des Schutzes personenbezogener Daten erfolgen die erforderlichen
            Meldungen gemäß Art. 33 DSGVO (an die Aufsichtsbehörde) und Art. 34 DSGVO (an die
            betroffenen Personen) innerhalb der gesetzlichen Fristen.
          </Para>
        </Card>
      ),
    },

    /* 23 — Automatisierte Entscheidungen / AI Act */
    {
      title: "23. Automatisierte Entscheidungen & Profiling",
      icon: <Svg d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
      content: (
        <Card>
          <Para>
            Eine ausschließlich automatisierte Entscheidung im Einzelfall einschließlich Profiling mit
            rechtlicher Wirkung oder vergleichbarer erheblicher Beeinträchtigung gemäß Art. 22 DSGVO
            findet nicht statt. KI-gestützte Auswertungen dienen ausschließlich als Entscheidungshilfe
            und unterliegen menschlicher Kontrolle (Human Oversight) im Sinne der EU-KI-Verordnung.
          </Para>
        </Card>
      ),
    },

    /* 24 — Minderjährige */
    {
      title: "24. Minderjährige",
      icon: <Svg d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
      content: (
        <Card>
          <Para>
            Unser Angebot richtet sich ausschließlich an volljährige Personen. Wir verarbeiten
            wissentlich keine personenbezogenen Daten von Minderjährigen.
          </Para>
        </Card>
      ),
    },

    /* 25 — Betroffenenrechte */
    {
      title: "25. Ihre Rechte (Art. 15–22 DSGVO)",
      icon: <Svg d="M12 6v6m0 0v6m0-6h6m-6 0H6" />,
      content: (
        <div className="space-y-4">
          <Card>
            <Para>Sie haben jederzeit das Recht auf:</Para>
            <div className="mt-3">
              <Bullets items={[
                "Auskunft (Art. 15 DSGVO)",
                "Berichtigung (Art. 16 DSGVO)",
                "Löschung (Art. 17 DSGVO)",
                "Einschränkung der Verarbeitung (Art. 18 DSGVO)",
                "Datenübertragbarkeit (Art. 20 DSGVO)",
                "Widerspruch (Art. 21 DSGVO)",
                "Widerruf erteilter Einwilligungen (Art. 7 Abs. 3 DSGVO)",
              ]} />
            </div>
          </Card>
          <Card>
            <Label>Kontakt zur Wahrnehmung Ihrer Rechte</Label>
            <a href="mailto:info@agiworks.de" className="text-base font-semibold text-[#FFFFFF] hover:text-[#A45CFF] transition-colors">
              info@agiworks.de
            </a>
          </Card>
        </div>
      ),
    },

    /* 26 — Beschwerderecht */
    {
      title: "26. Beschwerderecht",
      icon: <Svg d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
      content: (
        <Card>
          <Para>
            Sie haben das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Zuständig
            ist insbesondere:
          </Para>
          <div className="mt-3">
            <p className="text-base font-semibold text-[#FFFFFF] mb-1">
              Landesbeauftragte für Datenschutz und Informationsfreiheit Nordrhein-Westfalen
            </p>
            <p className="text-[#E5E7EB] leading-relaxed">
              Kavalleriestraße 2–4<br />
              40213 Düsseldorf, Deutschland
            </p>
          </div>
        </Card>
      ),
    },

    /* 27 — Änderungen */
    {
      title: "27. Änderungen dieser Datenschutzerklärung",
      icon: <Svg d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />,
      content: (
        <Card>
          <Para>
            Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn dies aufgrund
            technischer, rechtlicher oder organisatorischer Änderungen erforderlich wird. Es gilt
            jeweils die aktuelle, auf unserer Website veröffentlichte Fassung.
          </Para>
        </Card>
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
              Stand: Juni 2026
            </p>
          </motion.div>

          <div className="space-y-6">
            {sections.map((section, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3) }}
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
