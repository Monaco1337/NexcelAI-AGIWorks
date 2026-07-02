/**
 * Knowledge pages (Phase 8) — AEO/GEO editorial content as CANDIDATE (noindex).
 *
 * Purpose: answer-engine (AEO) and generative-engine (GEO) visibility through
 * genuinely helpful, factual explainer content. Each page leads with a direct
 * answer, gives key takeaways, then long-form sections and an FAQ.
 *
 * Hard rules (enforced by `seo:knowledge-pages`):
 *  - Real author (E-E-A-T): author is the legally responsible brand owner
 *    (defaults from the brand config); no invented experts.
 *  - No fake metrics (no invented %, €, "3x", "N Kunden", "spart N Stunden").
 *  - No ranking guarantees, superlatives or placeholders.
 *  - AGI Works (technical) and NEXCEL AI (strategic) topics must differ
 *    (cross-domain duplicate guard) and not be generic templated clones.
 *  - Candidate by default: approved=false, manualIndexApproval=false → noindex.
 */

import type { BrandKey } from "@/config/seo/domains";
import type { FaqItem } from "@/lib/templates/types";

export interface KnowledgeSection {
  heading: string;
  /** Long-form body; blank lines separate paragraphs. */
  body: string;
}

export interface KnowledgePage {
  id: string;
  brand: BrandKey;
  slug: string;
  path: string;
  topic: string;
  title: string;
  description: string;
  eyebrow: string;
  h1: string;
  heroIntro: string;
  /** AEO direct answer — concise, self-contained, quotable. */
  aeoAnswer: string;
  /** Key takeaways (scannable, quotable bullets). */
  takeaways: string[];
  sections: KnowledgeSection[];
  faq: FaqItem[];
  /** Optional explicit author; defaults to the brand owner (E-E-A-T). */
  authorName?: string;
  /** Real ISO dates (YYYY-MM-DD). */
  datePublished: string;
  dateModified: string;
  relatedPaths: string[];
  tags: string[];
  approved: boolean;
  manualIndexApproval: boolean;
}

const PUBLISHED = "2026-07-02";

/* ── AGI Works — technical explainers, /wissen/* ───────────────────────────── */

const AGI_KNOWLEDGE: KnowledgePage[] = [
  {
    id: "agiworks:/wissen/was-ist-eine-web-app",
    brand: "agiworks",
    slug: "was-ist-eine-web-app",
    path: "/wissen/was-ist-eine-web-app",
    topic: "Web-Apps",
    title: "Was ist eine Web-App? Definition & Abgrenzung",
    description:
      "Was eine Web-App ist, wie sie sich von Website und nativer App unterscheidet und wann sich individuelle Entwicklung für Unternehmen lohnt.",
    eyebrow: "Wissen",
    h1: "Was ist eine Web-App?",
    heroIntro:
      "Eine kompakte Einordnung: Definition, Abgrenzung zu Website und nativer App und typische Einsatzfälle im Unternehmen.",
    aeoAnswer:
      "Eine Web-App ist eine Anwendung, die im Browser läuft und wie ein Programm bedient wird: mit Login, Benutzerrollen und Datenlogik. Anders als eine reine Website, die vor allem Informationen darstellt, verarbeitet eine Web-App Eingaben, speichert Daten und bildet Abläufe ab. Im Gegensatz zu einer nativen App muss sie nicht installiert werden und funktioniert geräteübergreifend über den Browser.",
    takeaways: [
      "Web-App = im Browser lauffähige Anwendung mit Login, Rollen und Datenlogik.",
      "Website informiert, Web-App verarbeitet und speichert Daten.",
      "Keine Installation nötig, geräteübergreifend nutzbar.",
      "Sinnvoll, wenn Standardsoftware die eigenen Abläufe nicht sauber abbildet.",
    ],
    sections: [
      {
        heading: "Web-App, Website und native App im Vergleich",
        body:
          "Eine klassische Website ist in erster Linie darauf ausgelegt, Inhalte darzustellen. Eine Web-App geht darüber hinaus: Nutzer melden sich an, arbeiten mit Daten und lösen Aufgaben – zum Beispiel Angebote erstellen, Buchungen verwalten oder Projekte verfolgen.\n\nEine native App wird aus einem App-Store installiert und ist an ein Betriebssystem gebunden. Eine Web-App läuft im Browser und ist damit sofort erreichbar, ohne Installation und ohne Freigabeprozess eines Stores.",
      },
      {
        heading: "Woran man Bedarf für eine Web-App erkennt",
        body:
          "Typische Anzeichen sind verstreute Excel-Tabellen, doppelte Dateneingaben und Abläufe, die nur einzelne Personen im Kopf haben. Wenn Standardtools mit Workarounds am Laufen gehalten werden, kann eine individuelle Web-App die Prozesse sauber abbilden.\n\nEntscheidend ist, ob der Prozess spezifisch genug ist, dass sich eigene Logik lohnt. Für Standardaufgaben ist fertige Software oft die günstigere Wahl; für eigene, differenzierende Abläufe spielt eine Web-App ihre Stärken aus.",
      },
      {
        heading: "Was eine gute Web-App ausmacht",
        body:
          "Eine tragfähige Web-App hat ein sauberes Datenmodell, ein klares Rollen- und Rechtekonzept und eine wartbare Architektur. So bleibt sie erweiterbar, wenn Anforderungen wachsen.\n\nEbenso wichtig sind Sicherheit und Nachvollziehbarkeit: Eingaben werden validiert, Zugriffe geschützt und Änderungen bleiben nachvollziehbar. Diese Grundlagen entscheiden, ob eine Anwendung über Jahre trägt.",
      },
    ],
    faq: [
      { question: "Ist eine Web-App dasselbe wie eine Website?", answer: "Nein. Eine Website stellt Inhalte dar, eine Web-App verarbeitet Eingaben, speichert Daten und bildet Abläufe mit Login und Rollen ab." },
      { question: "Muss eine Web-App installiert werden?", answer: "Nein, sie läuft im Browser und ist ohne Installation geräteübergreifend nutzbar." },
      { question: "Wann lohnt sich eine individuelle Web-App?", answer: "Wenn Standardsoftware die eigenen Prozesse nicht sauber abbildet und Abläufe heute über Insellösungen wie Excel laufen." },
      { question: "Ist eine Web-App sicher?", answer: "Sicherheit hängt von der Umsetzung ab: Zugriffsschutz, Eingabevalidierung und ein Rollenkonzept sollten von Beginn an eingeplant sein." },
    ],
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    relatedPaths: ["/leistungen/web-app-entwicklung", "/leistungen/softwareentwicklung", "/systemanalyse", "/kontakt"],
    tags: ["Web-App", "Grundlagen", "Softwareentwicklung"],
    approved: false,
    manualIndexApproval: false,
  },
  {
    id: "agiworks:/wissen/individualsoftware-vs-standardsoftware",
    brand: "agiworks",
    slug: "individualsoftware-vs-standardsoftware",
    path: "/wissen/individualsoftware-vs-standardsoftware",
    topic: "Software-Entscheidung",
    title: "Individualsoftware oder Standardsoftware?",
    description:
      "Wann sich Individualsoftware lohnt und wann Standardsoftware ausreicht: Kriterien, Vor- und Nachteile und eine ehrliche Entscheidungshilfe.",
    eyebrow: "Wissen",
    h1: "Individualsoftware oder Standardsoftware?",
    heroIntro:
      "Eine sachliche Entscheidungshilfe entlang der Fragen, die wirklich zählen: Prozess, Differenzierung, Betrieb und Zukunft.",
    aeoAnswer:
      "Standardsoftware ist sinnvoll für verbreitete, wenig differenzierende Aufgaben: Sie ist schnell verfügbar und geteilt in den Kosten. Individualsoftware lohnt sich, wenn Abläufe spezifisch sind, einen Wettbewerbsvorteil darstellen oder sich nicht sauber in ein Standardprodukt pressen lassen. Die Entscheidung hängt weniger vom Budget als vom Prozess ab: Je eigener der Ablauf, desto stärker spricht er für individuelle Entwicklung.",
    takeaways: [
      "Standardsoftware: schnell, geteilt in den Kosten, gut für verbreitete Aufgaben.",
      "Individualsoftware: passt exakt zum Prozess, differenzierend, erweiterbar.",
      "Leitfrage: Ist der Ablauf spezifisch oder Standard?",
      "Mischformen sind üblich: Standard nutzen, Eigenes ergänzen.",
    ],
    sections: [
      {
        heading: "Die eigentliche Frage: Standard oder differenzierend?",
        body:
          "Der wichtigste Faktor ist nicht der Preis, sondern der Prozess. Aufgaben wie Buchhaltung oder E-Mail sind weitgehend standardisiert – hier ist fertige Software fast immer die richtige Wahl.\n\nAnders sieht es aus, wenn ein Ablauf zum Kern des Geschäfts gehört und sich von anderen unterscheidet. Wird dieser Prozess in ein Standardprodukt gezwängt, entstehen Workarounds, die langfristig bremsen.",
      },
      {
        heading: "Vor- und Nachteile ehrlich betrachtet",
        body:
          "Standardsoftware punktet mit schneller Verfügbarkeit und geteilten Weiterentwicklungskosten. Sie bringt aber Kompromisse mit: Man passt sich der Software an, nicht umgekehrt.\n\nIndividualsoftware bildet den eigenen Prozess exakt ab und lässt sich gezielt erweitern. Dafür braucht sie eine bewusste Entscheidung für Aufbau und Betrieb. Wer beides ehrlich abwägt, trifft die tragfähigere Wahl.",
      },
      {
        heading: "Der pragmatische Mittelweg",
        body:
          "In der Praxis ist es selten entweder-oder. Viele Unternehmen nutzen Standardsoftware für Querschnittsaufgaben und ergänzen sie um individuelle Bausteine für ihre differenzierenden Abläufe.\n\nEntscheidend ist eine saubere Verbindung über Schnittstellen, damit Daten nicht doppelt gepflegt werden. So entsteht ein System, das Standardvorteile und eigene Stärken kombiniert.",
      },
    ],
    faq: [
      { question: "Ist Individualsoftware immer teurer?", answer: "Nicht zwangsläufig langfristig: Sie vermeidet Workarounds und Lizenzketten. Kurzfristig ist Standardsoftware meist günstiger verfügbar." },
      { question: "Woran erkenne ich, dass Standard nicht mehr reicht?", answer: "An wachsenden Workarounds, doppelter Datenpflege und Abläufen, die das Tool eigentlich nicht vorsieht." },
      { question: "Kann ich beides kombinieren?", answer: "Ja, das ist der Normalfall: Standard für Querschnittsaufgaben, Eigenes für differenzierende Prozesse, verbunden über Schnittstellen." },
      { question: "Wie starte ich die Entscheidung?", answer: "Mit einer Analyse der Prozesse: Welche sind Standard, welche differenzierend und wo entstehen heute die meisten Reibungen?" },
    ],
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    relatedPaths: ["/leistungen/softwareentwicklung", "/leistungen/saas-entwicklung", "/systemanalyse", "/kontakt"],
    tags: ["Individualsoftware", "Standardsoftware", "Entscheidung"],
    approved: false,
    manualIndexApproval: false,
  },
  {
    id: "agiworks:/wissen/was-kostet-softwareentwicklung",
    brand: "agiworks",
    slug: "was-kostet-softwareentwicklung",
    path: "/wissen/was-kostet-softwareentwicklung",
    topic: "Kosten",
    title: "Was kostet Softwareentwicklung?",
    description:
      "Was den Preis von Softwareentwicklung wirklich bestimmt: die Kostentreiber, warum Fixpreise selten seriös sind und wie ein Projektkorridor entsteht.",
    eyebrow: "Wissen",
    h1: "Was kostet Softwareentwicklung?",
    heroIntro:
      "Eine ehrliche Einordnung ohne Scheinpräzision: welche Faktoren den Aufwand treiben und wie sich ein belastbarer Rahmen bilden lässt.",
    aeoAnswer:
      "Die Kosten von Softwareentwicklung hängen vom Umfang und der Komplexität ab, nicht von einem pauschalen Listenpreis. Wesentliche Treiber sind die Zahl und Tiefe der Funktionen, die Datenlogik, benötigte Schnittstellen, Anforderungen an Sicherheit sowie Betrieb und Weiterentwicklung. Statt eines unseriösen Fixpreises ist ein Projektkorridor sinnvoll, der nach einer Analyse der Anforderungen gebildet und im Verlauf präzisiert wird.",
    takeaways: [
      "Preis folgt aus Umfang und Komplexität, nicht aus einer Preisliste.",
      "Wichtige Treiber: Funktionsumfang, Datenlogik, Schnittstellen, Sicherheit, Betrieb.",
      "Pauschale Fixpreise ohne Analyse sind selten belastbar.",
      "Ein Projektkorridor wird nach Analyse gebildet und laufend präzisiert.",
    ],
    sections: [
      {
        heading: "Warum es keinen Listenpreis gibt",
        body:
          "Software wird nicht als fertiges Regalprodukt verkauft, sondern für einen konkreten Zweck gebaut. Der gleiche Titel – etwa ein „Kundenportal“ – kann je nach Anforderungen sehr unterschiedliche Aufwände bedeuten.\n\nDeshalb ist ein pauschaler Preis ohne Kenntnis der Anforderungen wenig aussagekräftig. Seriöser ist es, zuerst zu verstehen, was genau entstehen soll, und daraus einen Rahmen abzuleiten.",
      },
      {
        heading: "Die wichtigsten Kostentreiber",
        body:
          "Den Aufwand bestimmen vor allem der Funktionsumfang und dessen Tiefe, die Komplexität der Datenlogik sowie die Zahl der Schnittstellen zu anderen Systemen. Auch Anforderungen an Sicherheit, Datenschutz und Nachvollziehbarkeit wirken sich aus.\n\nHinzu kommt der Blick über den Launch hinaus: Betrieb, Wartung und geplante Weiterentwicklung gehören zu einer ehrlichen Kostenbetrachtung dazu.",
      },
      {
        heading: "Vom Rahmen zum belastbaren Angebot",
        body:
          "Am Anfang steht eine Analyse der Anforderungen. Daraus entsteht ein Projektkorridor – eine ehrliche Spanne statt einer Scheingenauigkeit. Mit fortschreitender Klärung wird dieser Rahmen präziser.\n\nWer eine erste Orientierung sucht, kann den Preiskalkulator nutzen; die verbindliche Einordnung folgt aus der gemeinsamen Analyse des Vorhabens.",
      },
    ],
    faq: [
      { question: "Warum bekomme ich keinen Fixpreis am Telefon?", answer: "Weil der Aufwand vom konkreten Umfang abhängt. Ohne Kenntnis der Anforderungen wäre eine Zahl geraten, nicht belastbar." },
      { question: "Was treibt die Kosten am stärksten?", answer: "Funktionsumfang und -tiefe, Komplexität der Datenlogik, Schnittstellen sowie Anforderungen an Sicherheit und Betrieb." },
      { question: "Wie bekomme ich eine erste Orientierung?", answer: "Über den Preiskalkulator für einen groben Rahmen und anschließend eine Systemanalyse für eine belastbare Einordnung." },
      { question: "Gehört der Betrieb zu den Kosten?", answer: "Ja. Wartung, Betrieb und geplante Weiterentwicklung sollten von Anfang an mitgedacht werden." },
    ],
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    relatedPaths: ["/leistungen/softwareentwicklung", "/preiskalkulator", "/systemanalyse", "/kontakt"],
    tags: ["Kosten", "Projektkorridor", "Softwareentwicklung"],
    approved: false,
    manualIndexApproval: false,
  },
  {
    id: "agiworks:/wissen/erp-system-einfuehren",
    brand: "agiworks",
    slug: "erp-system-einfuehren",
    path: "/wissen/erp-system-einfuehren",
    topic: "ERP",
    title: "ERP-System einführen: Leitfaden",
    description:
      "Wie Unternehmen ein ERP-System strukturiert einführen: Ausgangslage klären, Prozesse abbilden, Daten migrieren und den Betrieb absichern.",
    eyebrow: "Wissen",
    h1: "ERP-System einführen: ein strukturierter Leitfaden",
    heroIntro:
      "Von der Ausgangslage bis zum stabilen Betrieb: die Schritte, die eine ERP-Einführung tragfähig machen.",
    aeoAnswer:
      "Ein ERP-System wird eingeführt, indem zuerst die realen Prozesse und Rollen aufgenommen werden, dann ein Datenmodell und die Systemarchitektur festgelegt und schrittweise umgesetzt werden. Vorhandene Daten werden bereinigt und migriert, Mitarbeitende eingebunden und der Betrieb nach dem Start überwacht und weiterentwickelt. Eine ERP-Einführung ist weniger ein Softwarekauf als ein Prozessprojekt.",
    takeaways: [
      "ERP-Einführung ist ein Prozessprojekt, kein reiner Softwarekauf.",
      "Start mit Aufnahme realer Prozesse und Rollen.",
      "Datenmodell und Architektur vor der Umsetzung festlegen.",
      "Datenmigration, Schulung und Betrieb gehören dazu.",
    ],
    sections: [
      {
        heading: "Ausgangslage und Ziele klären",
        body:
          "Am Anfang steht das Verständnis der realen Abläufe: Wer arbeitet womit, wo entstehen Brüche und welche Ziele soll das System erreichen? Ohne diese Klärung wird ein ERP-Projekt schnell zur Abbildung von Chaos.\n\nWichtig ist, zwischen echten Anforderungen und liebgewonnenen Gewohnheiten zu unterscheiden. Nicht jeder bestehende Ablauf muss eins zu eins übernommen werden.",
      },
      {
        heading: "Datenmodell, Architektur und Umsetzung",
        body:
          "Auf Basis der Prozesse werden Datenmodell und Systemarchitektur festgelegt. Ein sauberes Fundament entscheidet darüber, ob das System später erweiterbar bleibt.\n\nDie Umsetzung erfolgt am besten in überschaubaren Schritten mit früh nutzbaren Teilergebnissen, statt in einem großen Wurf am Ende. So bleibt das Projekt steuerbar.",
      },
      {
        heading: "Migration, Einführung und Betrieb",
        body:
          "Vorhandene Daten werden geprüft, bereinigt und migriert – oft der unterschätzte Teil eines ERP-Projekts. Parallel werden Mitarbeitende eingebunden und geschult, damit das System angenommen wird.\n\nNach dem Start folgen Beobachtung, Feinjustierung und Weiterentwicklung. Ein ERP-System ist kein Endzustand, sondern wächst mit dem Unternehmen.",
      },
    ],
    faq: [
      { question: "Wie lange dauert eine ERP-Einführung?", answer: "Das hängt von Umfang und Komplexität ab. Ein schrittweises Vorgehen mit früh nutzbaren Teilergebnissen macht den Verlauf planbarer." },
      { question: "Was ist der häufigste Fehler?", answer: "Bestehende Abläufe unreflektiert abzubilden und die Datenmigration zu unterschätzen." },
      { question: "Muss ich alle Prozesse sofort umstellen?", answer: "Nein. Ein schrittweiser Rollout mit klaren Prioritäten reduziert Risiko und Widerstand." },
      { question: "Ist ERP nur etwas für große Unternehmen?", answer: "Nein. Auch kleinere Betriebe profitieren, wenn verstreute Insellösungen zusammengeführt werden sollen." },
    ],
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    relatedPaths: ["/leistungen/erp-system-entwicklung", "/leistungen/crm-system-entwicklung", "/systemanalyse", "/kontakt"],
    tags: ["ERP", "Einführung", "Leitfaden"],
    approved: false,
    manualIndexApproval: false,
  },
];

/* ── NEXCEL AI — KI/automation explainers, /wissen/* ───────────────────────── */

const NEXCEL_KNOWLEDGE: KnowledgePage[] = [
  {
    id: "nexcel:/wissen/was-ist-ki-automatisierung",
    brand: "nexcel",
    slug: "was-ist-ki-automatisierung",
    path: "/wissen/was-ist-ki-automatisierung",
    topic: "KI-Automatisierung",
    title: "Was ist KI-Automatisierung?",
    description:
      "Was KI-Automatisierung bedeutet, wie sie sich von klassischer Automatisierung unterscheidet und wo sie im Unternehmen sinnvoll eingesetzt wird.",
    eyebrow: "Wissen",
    h1: "Was ist KI-Automatisierung?",
    heroIntro:
      "Eine klare Einordnung: Definition, Abgrenzung zur regelbasierten Automatisierung und typische Einsatzfelder mit menschlicher Kontrolle.",
    aeoAnswer:
      "KI-Automatisierung verbindet regelbasierte Abläufe mit KI-Modellen, die Sprache und unstrukturierte Informationen verarbeiten können. Während klassische Automatisierung festen Wenn-dann-Regeln folgt, kann KI-Automatisierung zum Beispiel Anfragen einordnen, Texte entwerfen oder Inhalte zusammenfassen. Sinnvoll eingesetzt übernimmt sie Routine, während Menschen an sensiblen Stellen die Kontrolle behalten.",
    takeaways: [
      "KI-Automatisierung = Regeln plus KI für Sprache und unstrukturierte Daten.",
      "Klassische Automatisierung folgt festen Wenn-dann-Regeln.",
      "Typisch: Anfragen einordnen, Entwürfe erstellen, zusammenfassen.",
      "Mensch behält an sensiblen Stellen die Kontrolle.",
    ],
    sections: [
      {
        heading: "Klassische vs. KI-gestützte Automatisierung",
        body:
          "Klassische Automatisierung ist ideal für klar definierte, wiederkehrende Schritte mit eindeutigen Regeln – etwa das Weiterleiten einer Datei oder das Auslösen einer Benachrichtigung.\n\nKI-Automatisierung ergänzt das um Fähigkeiten, die Regeln allein nicht abdecken: freie Texte verstehen, Anliegen einordnen oder Formulierungen vorschlagen. Beides zusammen ergibt Abläufe, die robust und zugleich flexibel sind.",
      },
      {
        heading: "Typische Einsatzfelder",
        body:
          "Häufige Anwendungen sind das Sortieren und Priorisieren eingehender Anfragen, das Vorbereiten von Antwortentwürfen, das Zusammenfassen von Dokumenten oder das Anreichern von Datensätzen.\n\nDer Wert entsteht dort, wo viel gleichartige, textlastige Routine anfällt. Die KI übernimmt den ersten Schritt, Menschen prüfen und entscheiden dort, wo es darauf ankommt.",
      },
      {
        heading: "Verantwortung und Kontrolle",
        body:
          "Verlässliche KI-Automatisierung arbeitet nach klaren Regeln, mit definierten Grenzen und einer menschlichen Freigabe an kritischen Punkten. So bleibt nachvollziehbar, was warum passiert.\n\nDatenschutz und Transparenz gehören von Beginn an dazu: Welche Daten verarbeitet werden und wie Ergebnisse zustande kommen, sollte immer klar sein.",
      },
    ],
    faq: [
      { question: "Ist KI-Automatisierung dasselbe wie klassische Automatisierung?", answer: "Nein. Klassische Automatisierung folgt festen Regeln; KI-Automatisierung ergänzt das um das Verstehen von Sprache und unstrukturierten Daten." },
      { question: "Ersetzt KI-Automatisierung Mitarbeitende?", answer: "In der Regel nicht. Sie übernimmt Routine, während Menschen an sensiblen Stellen prüfen und entscheiden." },
      { question: "Wo fängt man am besten an?", answer: "Bei einem klar umrissenen, wiederkehrenden und textlastigen Ablauf mit hohem Volumen." },
      { question: "Wie steht es um Datenschutz?", answer: "Datenschutz, klare Grenzen und Nachvollziehbarkeit sollten von Beginn an Teil des Konzepts sein." },
    ],
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    relatedPaths: ["/loesungen/automatisierung", "/loesungen/ki-systeme", "/systemanalyse", "/kontakt"],
    tags: ["KI", "Automatisierung", "Grundlagen"],
    approved: false,
    manualIndexApproval: false,
  },
  {
    id: "nexcel:/wissen/was-ist-ein-ki-agent",
    brand: "nexcel",
    slug: "was-ist-ein-ki-agent",
    path: "/wissen/was-ist-ein-ki-agent",
    topic: "KI-Agenten",
    title: "Was ist ein KI-Agent?",
    description:
      "Was ein KI-Agent ist, wie er sich von einem einfachen Chatbot unterscheidet und welche Aufgaben er unter klaren Regeln übernehmen kann.",
    eyebrow: "Wissen",
    h1: "Was ist ein KI-Agent?",
    heroIntro:
      "Definition und Abgrenzung: vom einfachen Chatbot zum handlungsfähigen Assistenten mit Werkzeugen und Grenzen.",
    aeoAnswer:
      "Ein KI-Agent ist ein Softwarebaustein, der ein Ziel entgegennimmt, dafür Schritte plant und mithilfe von Werkzeugen ausführt – etwa Daten nachschlagen, Einträge anlegen oder eine Antwort vorbereiten. Anders als ein einfacher Chatbot, der nur antwortet, kann ein Agent Handlungen anstoßen. In seriösen Anwendungen arbeitet er innerhalb klar definierter Grenzen und mit menschlicher Freigabe bei kritischen Schritten.",
    takeaways: [
      "KI-Agent nimmt ein Ziel entgegen, plant Schritte und nutzt Werkzeuge.",
      "Chatbot antwortet, Agent kann Handlungen anstoßen.",
      "Immer innerhalb definierter Grenzen und Rechte.",
      "Kritische Schritte bleiben mit menschlicher Freigabe.",
    ],
    sections: [
      {
        heading: "Agent vs. Chatbot",
        body:
          "Ein klassischer Chatbot reagiert auf Fragen mit Antworten. Ein KI-Agent geht weiter: Er zerlegt ein Ziel in Schritte und kann Werkzeuge nutzen, um diese Schritte auszuführen.\n\nDer Unterschied ist Handlungsfähigkeit. Damit steigt der Nutzen, aber auch die Verantwortung, klare Grenzen und Rechte festzulegen.",
      },
      {
        heading: "Wie ein Agent arbeitet",
        body:
          "Ein Agent erhält ein Ziel, plant mögliche Schritte, greift auf definierte Werkzeuge zu und prüft Zwischenergebnisse. So kann er zum Beispiel Informationen zusammentragen und einen Vorgang vorbereiten.\n\nWichtig ist, welche Werkzeuge und Daten ein Agent nutzen darf. Diese Rechte bewusst zu setzen, ist Teil eines verantwortungsvollen Einsatzes.",
      },
      {
        heading: "Grenzen und Sicherheit",
        body:
          "Seriöse Agenten arbeiten in einem klar abgesteckten Rahmen: definierte Aufgaben, begrenzte Rechte und eine menschliche Freigabe an kritischen Punkten.\n\nSo bleibt nachvollziehbar, was der Agent tut, und Fehler haben begrenzte Auswirkungen. Transparenz und Kontrolle sind wichtiger als maximale Autonomie.",
      },
    ],
    faq: [
      { question: "Ist ein KI-Agent nur ein Chatbot?", answer: "Nein. Ein Chatbot antwortet, ein Agent plant Schritte und kann mit Werkzeugen Handlungen anstoßen." },
      { question: "Handelt ein Agent völlig eigenständig?", answer: "In seriösen Anwendungen nicht. Er arbeitet in definierten Grenzen, mit begrenzten Rechten und menschlicher Freigabe bei kritischen Schritten." },
      { question: "Wofür eignen sich KI-Agenten?", answer: "Für mehrstufige, wiederkehrende Aufgaben, bei denen Informationen zusammengeführt und Vorgänge vorbereitet werden." },
      { question: "Wie bleibt das kontrollierbar?", answer: "Über klar definierte Aufgaben, begrenzte Rechte, nachvollziehbare Schritte und Freigaben an sensiblen Stellen." },
    ],
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    relatedPaths: ["/loesungen/ki-agenten", "/loesungen/automatisierung", "/systemanalyse", "/kontakt"],
    tags: ["KI-Agent", "Grundlagen", "Automatisierung"],
    approved: false,
    manualIndexApproval: false,
  },
  {
    id: "nexcel:/wissen/prozesse-automatisieren-im-mittelstand",
    brand: "nexcel",
    slug: "prozesse-automatisieren-im-mittelstand",
    path: "/wissen/prozesse-automatisieren-im-mittelstand",
    topic: "Automatisierung",
    title: "Prozesse automatisieren im Mittelstand",
    description:
      "Wie mittelständische Unternehmen Prozesse sinnvoll automatisieren: geeignete Abläufe erkennen, klein starten und den Nutzen messbar machen.",
    eyebrow: "Wissen",
    h1: "Prozesse automatisieren im Mittelstand",
    heroIntro:
      "Ein pragmatischer Weg: den richtigen Ablauf wählen, klein anfangen, sauber messen und dann ausweiten.",
    aeoAnswer:
      "Mittelständische Unternehmen automatisieren Prozesse am besten, indem sie mit einem klar umrissenen, wiederkehrenden Ablauf beginnen, statt alles auf einmal umzustellen. Geeignet sind Aufgaben mit hohem Volumen, klaren Regeln und wenig Ausnahmen. Wichtig sind messbare Ziele, die Einbindung der Mitarbeitenden und ein schrittweises Vorgehen, das den Nutzen früh sichtbar macht.",
    takeaways: [
      "Klein starten: ein klar umrissener, wiederkehrender Ablauf zuerst.",
      "Geeignet: hohes Volumen, klare Regeln, wenige Ausnahmen.",
      "Ziele vorab definieren und den Effekt messen.",
      "Mitarbeitende früh einbinden, dann ausweiten.",
    ],
    sections: [
      {
        heading: "Welche Prozesse sich eignen",
        body:
          "Gut automatisierbar sind Abläufe, die häufig vorkommen, klaren Regeln folgen und wenige Sonderfälle haben – etwa das Erfassen und Weiterleiten von Anfragen oder das Nachfassen nach einem festen Muster.\n\nWeniger geeignet sind stark variantenreiche Aufgaben mit vielen Ausnahmen. Hier lohnt sich zunächst, den Prozess zu vereinfachen, bevor man ihn automatisiert.",
      },
      {
        heading: "Klein anfangen und messen",
        body:
          "Statt eines großen Programms empfiehlt sich ein überschaubarer erster Anwendungsfall. So lassen sich Wirkung und Aufwand realistisch bewerten, bevor investiert wird.\n\nEntscheidend sind vorher definierte Ziele: Was soll besser werden und woran erkennt man das? Ohne Messgröße bleibt der Nutzen Behauptung.",
      },
      {
        heading: "Menschen mitnehmen",
        body:
          "Automatisierung gelingt, wenn die Betroffenen sie als Entlastung erleben. Deshalb sollten Mitarbeitende früh eingebunden und der Zweck klar kommuniziert werden.\n\nRoutine wird abgegeben, verantwortungsvolle Entscheidungen bleiben beim Team. So entsteht Akzeptanz statt Widerstand.",
      },
    ],
    faq: [
      { question: "Muss ich alles auf einmal automatisieren?", answer: "Nein. Ein klar umrissener erster Anwendungsfall ist sinnvoller und risikoärmer als eine Komplettumstellung." },
      { question: "Welche Prozesse eignen sich zuerst?", answer: "Wiederkehrende Abläufe mit hohem Volumen, klaren Regeln und wenigen Ausnahmen." },
      { question: "Wie erkenne ich den Nutzen?", answer: "Über vorab definierte Ziele und Messgrößen, die vor und nach der Automatisierung verglichen werden." },
      { question: "Ist das nur für große Unternehmen sinnvoll?", answer: "Nein. Gerade im Mittelstand entlasten schon einzelne automatisierte Abläufe spürbar." },
    ],
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    relatedPaths: ["/loesungen/automatisierung", "/loesungen/digitale-betriebssysteme", "/systemanalyse", "/kontakt"],
    tags: ["Automatisierung", "Mittelstand", "Prozesse"],
    approved: false,
    manualIndexApproval: false,
  },
  {
    id: "nexcel:/wissen/customer-experience-mit-ki-verbessern",
    brand: "nexcel",
    slug: "customer-experience-mit-ki-verbessern",
    path: "/wissen/customer-experience-mit-ki-verbessern",
    topic: "Customer Experience",
    title: "Customer Experience mit KI verbessern",
    description:
      "Wie KI die Customer Experience konsistenter und schneller macht, ohne die persönliche Note zu verlieren: Ansatzpunkte, Grenzen und Vorgehen.",
    eyebrow: "Wissen",
    h1: "Customer Experience mit KI verbessern",
    heroIntro:
      "Wo KI im Kundenerlebnis wirklich hilft, wo der Mensch bleiben sollte und wie man beides sinnvoll verbindet.",
    aeoAnswer:
      "KI verbessert die Customer Experience vor allem durch Konsistenz und Geschwindigkeit: schnellere erste Reaktionen, einheitliche Informationen über alle Kanäle und weniger Wartezeit bei Standardanliegen. Der Schlüssel ist die Kombination aus Automatik für Routine und Menschen für alles, was Empathie oder Urteilsvermögen braucht. Gut umgesetzt entlastet KI das Team, ohne das Kundenerlebnis unpersönlich zu machen.",
    takeaways: [
      "KI-Stärken: Konsistenz, Tempo und Verfügbarkeit bei Standardanliegen.",
      "Menschen bleiben für Empathie und Urteilsvermögen zentral.",
      "Einheitliche Informationen über alle Kanäle hinweg.",
      "Ziel ist Entlastung, nicht Entpersonalisierung.",
    ],
    sections: [
      {
        heading: "Wo KI im Kundenerlebnis hilft",
        body:
          "KI kann erste Reaktionen beschleunigen, häufige Fragen einordnen und dem Team relevante Informationen bereitstellen. Über alle Kanäle hinweg sorgt sie für konsistente Auskünfte.\n\nGerade bei Standardanliegen verkürzt das Wartezeiten und sorgt für ein gleichmäßig gutes Erlebnis – unabhängig davon, wann und wie ein Kunde Kontakt aufnimmt.",
      },
      {
        heading: "Wo der Mensch bleiben sollte",
        body:
          "Nicht jedes Anliegen eignet sich für Automatik. Bei sensiblen Themen, Beschwerden oder komplexen Entscheidungen sind Empathie und Urteilsvermögen gefragt.\n\nEin gutes Konzept erkennt diese Fälle und übergibt sie an Menschen – mit dem Kontext, den die KI bereits gesammelt hat, damit Kunden sich nicht wiederholen müssen.",
      },
      {
        heading: "So gelingt die Verbindung",
        body:
          "Der Ausgangspunkt ist die Customer Journey: Wo entstehen Reibung und Wartezeit, und welche Schritte sind wirklich standardisierbar? Dort setzt Automatik an, der Rest bleibt beim Team.\n\nWichtig sind konsistente Daten und eine klare Übergabe zwischen Automatik und Mensch. So wirkt das Erlebnis aus einem Guss statt zusammengestückelt.",
      },
    ],
    faq: [
      { question: "Macht KI den Kundenkontakt unpersönlich?", answer: "Nicht, wenn sie richtig eingesetzt wird: Automatik übernimmt Routine, persönliche Kommunikation bleibt beim Team." },
      { question: "Wo hilft KI am meisten?", answer: "Bei schnellen ersten Reaktionen, konsistenten Auskünften über alle Kanäle und der Entlastung bei Standardanliegen." },
      { question: "Wann sollte ein Mensch übernehmen?", answer: "Bei sensiblen Themen, Beschwerden und komplexen Entscheidungen, die Empathie und Urteilsvermögen erfordern." },
      { question: "Wie fange ich an?", answer: "Mit einer Betrachtung der Customer Journey: Wo entstehen Reibung und Wartezeit und was ist wirklich standardisierbar?" },
    ],
    datePublished: PUBLISHED,
    dateModified: PUBLISHED,
    relatedPaths: ["/loesungen/customer-experience-systeme", "/loesungen/crm-automation", "/systemanalyse", "/kontakt"],
    tags: ["Customer Experience", "KI", "Service"],
    approved: false,
    manualIndexApproval: false,
  },
];

export const KNOWLEDGE_PAGES: KnowledgePage[] = [...AGI_KNOWLEDGE, ...NEXCEL_KNOWLEDGE];

export function getKnowledgePagesForBrand(brand: BrandKey): KnowledgePage[] {
  return KNOWLEDGE_PAGES.filter((p) => p.brand === brand);
}

export function getKnowledgePage(brand: BrandKey, slug: string): KnowledgePage | undefined {
  return KNOWLEDGE_PAGES.find((p) => p.brand === brand && p.slug === slug);
}
