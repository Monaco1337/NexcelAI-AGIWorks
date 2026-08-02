/**
 * City × service pages — /standorte/<city>/<service>.
 *
 * These are deliberately NOT a generated matrix. A matrix of 11 cities × 20
 * services would be doorway pages: the same text with a city name swapped in.
 * Instead each entry is one handpicked combination where the city's actual
 * economy makes that specific service the relevant one, and the copy is written
 * for that pairing.
 *
 * Rules inherited from the location layer (config/businessLocations.ts,
 * lib/seo/locationGuard.ts): no office claims, no opening hours, no geo
 * coordinates, no invented metrics. Both brands are legally based in Unna and
 * say so.
 */

import type { BrandKey } from "@/config/seo/domains";
import { getLocationPage } from "@/data/locationPages";

export interface CityServicePage {
  id: string;
  brand: BrandKey;
  citySlug: string;
  serviceSlug: string;
  path: string;
  city: string;
  region: string;
  serviceLabel: string;
  title: string;
  description: string;
  h1: string;
  /** Why this service matters specifically in this city. */
  aeoAnswer: string;
  /** The local reasoning, written for this city+service pair. */
  rationale: string;
  /** Concrete deliverables for this pairing. */
  deliverables: string[];
  faq: { question: string; answer: string }[];
  relatedPaths: string[];
  approved: boolean;
  manualIndexApproval: boolean;
}

interface Pairing {
  citySlug: string;
  serviceSlug: string;
  /** Commercial page this pairing maps to (same brand). */
  moneyPath: string;
  /** System page this pairing maps to. */
  systemPath: string;
  serviceLabel: string;
  h1: string;
  rationale: string;
  deliverables: string[];
  faq: { question: string; answer: string }[];
}

const AGI_PAIRINGS: Pairing[] = [
  {
    citySlug: "dortmund",
    serviceSlug: "web-app-entwicklung",
    moneyPath: "/leistungen/web-app-entwicklung",
    systemPath: "/systeme/premium-websysteme",
    serviceLabel: "Web-App-Entwicklung",
    h1: "Web-App-Entwicklung für Dortmunder Unternehmen",
    rationale:
      "Dortmunds Wirtschaft wird stark von Logistik, Versicherungen und technischen Dienstleistern getragen. In diesen Branchen laufen viele interne Abläufe über Tabellen und E-Mail-Ketten, obwohl mehrere Personen gleichzeitig daran arbeiten. Genau dafür ist eine Web-App das passende Format: ein gemeinsamer Stand, Rechte je Rolle und eine Historie, wer wann was geändert hat — erreichbar im Browser, ohne Installation auf jedem Rechner.",
    deliverables: [
      "Rollen- und Rechtemodell für Innendienst, Außendienst und Leitung",
      "Formulare und Listen, die reale Vorgänge abbilden statt generischer Tabellen",
      "Anbindung vorhandener Systeme über Schnittstellen",
      "Zugriff über Browser, ohne lokale Installation",
    ],
    faq: [
      { question: "Warum eine Web-App statt einer Tabelle?", answer: "Sobald mehrere Personen gleichzeitig arbeiten, entstehen in Tabellen widersprüchliche Stände. Eine Web-App hält einen gemeinsamen Stand und protokolliert Änderungen nachvollziehbar." },
      { question: "Läuft die Zusammenarbeit in Dortmund vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der rechtliche Sitz von AGI Works ist Unna." },
      { question: "Können bestehende Systeme angebunden werden?", answer: "Ja, vorhandene Systeme werden über Schnittstellen integriert, sodass Daten nicht doppelt gepflegt werden müssen." },
    ],
  },
  {
    citySlug: "essen",
    serviceSlug: "erp-system-entwicklung",
    moneyPath: "/leistungen/erp-system-entwicklung",
    systemPath: "/systeme/erp-systeme",
    serviceLabel: "ERP-Entwicklung",
    h1: "ERP-Entwicklung für Unternehmen in Essen",
    rationale:
      "Essen ist Sitz großer Energie- und Industrieunternehmen und eines Zuliefernetzes, das über Jahrzehnte gewachsen ist. Viele dieser Betriebe arbeiten mit einer Mischung aus Branchensoftware, Eigenentwicklungen und Tabellen, die historisch entstanden ist. Ein individuelles ERP ersetzt diese Landschaft nicht in einem Schritt, sondern übernimmt zuerst den Kern und bindet die verbleibenden Systeme an, bis sie ablösbar sind.",
    deliverables: [
      "Datenmodell für Aufträge, Ressourcen und Abrechnung",
      "Schrittweise Ablösung gewachsener Insellösungen",
      "Migration bestehender Stammdaten",
      "Schnittstellen zu Buchhaltung und vorhandener Branchensoftware",
    ],
    faq: [
      { question: "Muss der Betrieb für die Umstellung pausieren?", answer: "Nein. Die Ablösung erfolgt schrittweise: Der neue Kern übernimmt zuerst einen abgegrenzten Bereich, die übrigen Systeme bleiben angebunden, bis sie ersetzt sind." },
      { question: "Was passiert mit den Altdaten?", answer: "Stammdaten werden migriert und vor der Übernahme auf Vollständigkeit und Widersprüche geprüft." },
      { question: "Warum kein Standard-ERP?", answer: "Standard-ERP lohnt sich bei üblichen Abläufen. Sobald ein Betrieb Prozesse hat, für die teure Anpassungen nötig wären, ist eine individuelle Lösung meist wirtschaftlicher." },
    ],
  },
  {
    citySlug: "bochum",
    serviceSlug: "kundenportal-entwicklung",
    moneyPath: "/leistungen/kundenportal-entwicklung",
    systemPath: "/systeme/kundenportal-self-service",
    serviceLabel: "Kundenportal-Entwicklung",
    h1: "Kundenportal-Entwicklung für Bochumer Organisationen",
    rationale:
      "In Bochum prägen Hochschulen, Gesundheitswirtschaft und IT-Sicherheit das Umfeld. Organisationen, die dort mit personenbezogenen Daten arbeiten, brauchen ein Portal, dessen Zugriffsschutz nicht nachträglich aufgesetzt wurde. Entscheidend ist, dass jede Datenbankabfrage die Berechtigung des Anfragenden berücksichtigt — nicht nur die Oberfläche, die bestimmte Menüpunkte ausblendet.",
    deliverables: [
      "Authentifizierung mit abgestuften Rollen",
      "Berechtigungsprüfung auf Datenebene, nicht nur in der Oberfläche",
      "Protokollierung von Zugriffen auf sensible Datensätze",
      "Löschfristen und Auskunftsfunktionen nach Datenschutzvorgaben",
    ],
    faq: [
      { question: "Reicht es, Menüpunkte je Rolle auszublenden?", answer: "Nein. Sichtbarkeit in der Oberfläche ist kein Schutz. Die Berechtigung muss bei jeder Datenabfrage serverseitig geprüft werden, sonst sind Daten über direkte Aufrufe erreichbar." },
      { question: "Wird die Protokollierung mitgeliefert?", answer: "Ja, Zugriffe auf sensible Datensätze werden protokolliert, sodass im Prüffall nachvollziehbar ist, wer wann was gesehen hat." },
      { question: "Arbeitet AGI Works in Bochum vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der rechtliche Sitz ist Unna." },
    ],
  },
  {
    citySlug: "duesseldorf",
    serviceSlug: "webseiten-erstellen-lassen",
    moneyPath: "/leistungen/webseiten-erstellen-lassen",
    systemPath: "/systeme/premium-websysteme",
    serviceLabel: "Website-Entwicklung",
    h1: "Website-Entwicklung für Düsseldorfer Unternehmen",
    rationale:
      "In Düsseldorf sitzen Agenturen, Beratungen und Handelsunternehmen, für die der eigene Auftritt Teil des Angebots ist. Der Anspruch an Gestaltung ist entsprechend hoch — und genau dort scheitern Baukastenlösungen: Sie erzwingen Kompromisse im Layout und liefern Ladezeiten, die sich nicht beeinflussen lassen. Eine eigene Codebasis gibt beides zurück, Gestaltungsfreiheit und Kontrolle über die technische Qualität.",
    deliverables: [
      "Umsetzung eines eigenen Gestaltungskonzepts ohne Template-Zwang",
      "Messbare Ladezeiten und optimierte Bildauslieferung",
      "Redaktionsbereich passend zum internen Freigabeprozess",
      "Technische SEO-Grundlagen: Struktur, Metadaten, strukturierte Daten",
    ],
    faq: [
      { question: "Was spricht gegen einen Baukasten?", answer: "Baukästen begrenzen Gestaltung und Ladezeit. Wo der Auftritt Teil des Angebots ist, wiegen diese Kompromisse schwerer als die geringeren Anfangskosten." },
      { question: "Können Inhalte selbst gepflegt werden?", answer: "Ja, der Redaktionsbereich wird an den internen Freigabeprozess angepasst, damit Änderungen ohne Entwicklung möglich sind." },
      { question: "Ist technisches SEO enthalten?", answer: "Ja, Seitenstruktur, Metadaten, strukturierte Daten und Ladezeit-Optimierung gehören zum Umfang." },
    ],
  },
  {
    citySlug: "koeln",
    serviceSlug: "api-entwicklung",
    moneyPath: "/leistungen/api-entwicklung",
    systemPath: "/systeme/schnittstellen-integrationen",
    serviceLabel: "API-Entwicklung",
    h1: "API- und Schnittstellenentwicklung in Köln",
    rationale:
      "Kölner Medienhäuser, Versicherer und Handelsbetriebe betreiben oft über Jahre gewachsene Systemlandschaften, in denen jedes einzelne System fachlich funktioniert. Das Problem liegt zwischen ihnen: Daten werden exportiert, umformatiert und wieder importiert. Eine Integrationsschicht macht diesen Umweg überflüssig — und muss dabei vor allem den Fehlerfall beherrschen, weil ein Zielsystem irgendwann nicht antwortet.",
    deliverables: [
      "Festlegung, welches System für welche Daten führend ist",
      "REST- und Webhook-Schnittstellen mit dokumentiertem Vertrag",
      "Wiederholungslogik und Idempotenz gegen doppelte Verarbeitung",
      "Überwachung mit Alarmierung, wenn ein Abgleich ausfällt",
    ],
    faq: [
      { question: "Was passiert, wenn ein System nicht erreichbar ist?", answer: "Die Übertragung wird wiederholt und der Vorgang bleibt bis zur erfolgreichen Zustellung offen. Bleibt sie aus, wird alarmiert, statt den Datensatz stillschweigend zu verlieren." },
      { question: "Wie werden doppelte Datensätze verhindert?", answer: "Über Idempotenz: Jeder Vorgang trägt eine eindeutige Kennung, sodass eine wiederholte Zustellung nicht zu einem zweiten Datensatz führt." },
      { question: "Müssen die Altsysteme ersetzt werden?", answer: "Nein. Eine Integrationsschicht verbindet vorhandene Systeme und ist meist deutlich günstiger als deren Ablösung." },
    ],
  },
  {
    citySlug: "berlin",
    serviceSlug: "saas-entwicklung",
    moneyPath: "/leistungen/saas-entwicklung",
    systemPath: "/systeme/saas-plattform-multi-tenant",
    serviceLabel: "SaaS-Entwicklung",
    h1: "SaaS-Entwicklung für Berliner Unternehmen",
    rationale:
      "Berlin bringt regelmäßig Produkte hervor, die als interne Lösung beginnen und später an Dritte verkauft werden sollen. Genau an diesem Übergang wird es teuer: Mandantenfähigkeit betrifft jede Datenbankabfrage und jede Rechteprüfung und lässt sich nachträglich nur mit erheblichem Aufwand einziehen. Wird sie von Beginn an im Datenmodell angelegt, ist der spätere Schritt zum Produkt eine Erweiterung statt eines Umbaus.",
    deliverables: [
      "Mandantentrennung im Datenmodell statt in der Oberfläche",
      "Abo- und Abrechnungslogik inklusive Zahlungsanbieter",
      "Self-Service-Registrierung und Bereitstellung neuer Mandanten",
      "Deployment und Überwachung für wachsende Nutzerzahlen",
    ],
    faq: [
      { question: "Lässt sich Mandantenfähigkeit später nachrüsten?", answer: "Technisch ja, wirtschaftlich selten sinnvoll. Sie betrifft jede Abfrage und Rechteprüfung, weshalb eine nachträgliche Einführung meist einem Neubau nahekommt." },
      { question: "Ist die Abrechnung enthalten?", answer: "Ja, Abo-Logik und Anbindung eines Zahlungsanbieters gehören zum Umfang, inklusive Mahnwesen und Kündigung." },
      { question: "Arbeitet AGI Works in Berlin vor Ort?", answer: "Nein, Projekte außerhalb von Nordrhein-Westfalen laufen vollständig remote. Der rechtliche Sitz ist Unna." },
    ],
  },
  {
    citySlug: "stuttgart",
    serviceSlug: "softwareentwicklung",
    moneyPath: "/leistungen/softwareentwicklung",
    systemPath: "/systeme/projekt-aufgabenmanagement",
    serviceLabel: "Individualsoftware",
    h1: "Individualsoftware für den Raum Stuttgart",
    rationale:
      "Der Maschinenbau und die Zulieferindustrie rund um Stuttgart arbeiten mit Verfahren, die über Jahre verfeinert wurden und häufig einen echten Wettbewerbsvorteil darstellen. Standardsoftware zwingt solche Betriebe dazu, dieses Verfahren zu vereinfachen, damit es in ein fremdes Modell passt. Individuelle Entwicklung geht den umgekehrten Weg und bildet die vorhandene Fachlogik ab, statt sie zu glätten.",
    deliverables: [
      "Aufnahme der bestehenden Fachlogik gemeinsam mit den Anwendern",
      "Abbildung von Arbeitsfolgen, Prüfschritten und Sonderfällen",
      "Anbindung an Maschinen- und Warenwirtschaftsdaten, wo vorhanden",
      "Übergabe von Quellcode und Dokumentation",
    ],
    faq: [
      { question: "Wie wird das Fachwissen erfasst?", answer: "In strukturierten Terminen mit den Personen, die den Ablauf täglich ausführen. Das Ergebnis wird schriftlich festgehalten und vor der Umsetzung freigegeben." },
      { question: "Wem gehört der Quellcode?", answer: "Dem Auftraggeber. Quellcode und Dokumentation werden übergeben, eine Anbieterbindung entsteht dadurch nicht." },
      { question: "Gibt es Termine vor Ort in Stuttgart?", answer: "Nein, außerhalb von Nordrhein-Westfalen läuft die Zusammenarbeit vollständig remote. Der rechtliche Sitz ist Unna." },
    ],
  },
];

const NEXCEL_PAIRINGS: Pairing[] = [
  {
    citySlug: "dortmund",
    serviceSlug: "automatisierung",
    moneyPath: "/loesungen/automatisierung",
    systemPath: "/systeme/admin-operations-system",
    serviceLabel: "Prozessautomatisierung",
    h1: "Prozessautomatisierung für Dortmunder Betriebe",
    rationale:
      "Dienstleister und Logistiker in Dortmund verbringen einen erheblichen Teil des Arbeitstags mit Vorgängen, die immer gleich ablaufen: Anfrage aufnehmen, zuordnen, bestätigen, erinnern. Diese Schritte sind vollständig beschreibbar und damit automatisierbar. Der Gewinn liegt weniger im einzelnen gesparten Handgriff als darin, dass nichts mehr liegen bleibt, wenn im Tagesgeschäft etwas dazwischenkommt.",
    deliverables: [
      "Aufnahme der Abläufe mit dem größten Zeitanteil",
      "Regelwerk: was läuft automatisch, wo entscheidet ein Mensch",
      "Automatische Bestätigungen, Zuordnung und Erinnerungen",
      "Auswertung der Wirkung an vorab definierten Kennzahlen",
    ],
    faq: [
      { question: "Wo beginnt Automatisierung sinnvoll?", answer: "Bei Abläufen, die häufig vorkommen, klar beschreibbar sind und deren Ergebnis überprüfbar bleibt. Dort ist die Entlastung am schnellsten spürbar." },
      { question: "Verliert das Team die Kontrolle?", answer: "Nein. Vorab wird festgelegt, welche Schritte automatisch laufen und an welchen Stellen eine Person entscheidet." },
      { question: "Arbeitet NEXCEL AI in Dortmund vor Ort?", answer: "Überwiegend remote; Termine vor Ort sind nach Vereinbarung möglich. Der rechtliche Sitz ist Unna." },
    ],
  },
  {
    citySlug: "unna",
    serviceSlug: "lead-automation",
    moneyPath: "/loesungen/lead-automation",
    systemPath: "/systeme/lead-funnels-crm",
    serviceLabel: "Lead-Automatisierung",
    h1: "Lead-Automatisierung für Betriebe in Unna",
    rationale:
      "Im Kreis Unna kommen Anfragen häufig über Telefon, E-Mail und Empfehlung herein und landen bei der Person, die gerade Zeit hat. Bei ruhiger Auftragslage funktioniert das. Sobald es voll wird, bleiben Anfragen liegen — meist genau die, bei denen eine schnelle Antwort den Ausschlag gegeben hätte. Eine strukturierte Erfassung mit automatischem Erstkontakt stellt sicher, dass jede Anfrage denselben Startpunkt bekommt.",
    deliverables: [
      "Einheitliche Erfassung aller Anfragen unabhängig vom Kanal",
      "Automatische Eingangsbestätigung mit realistischer Antwortzeit",
      "Priorisierung nach hinterlegten Kriterien",
      "Wiedervorlagen, die ohne manuelles Nachhalten auslösen",
    ],
    faq: [
      { question: "Geht die persönliche Note verloren?", answer: "Nein. Automatisiert wird die Erfassung und Erinnerung, das eigentliche Gespräch bleibt beim Team." },
      { question: "Lohnt sich das für kleine Betriebe?", answer: "Häufig schon bei einem einzelnen wiederkehrenden Ablauf, wenn dieser regelmäßig Anfragen kostet." },
      { question: "Ist NEXCEL AI in Unna ansässig?", answer: "Ja, der rechtliche Sitz des Unternehmens ist Unna. Das ist eine Rechtsadresse und kein öffentliches Ladenlokal." },
    ],
  },
  {
    citySlug: "bochum",
    serviceSlug: "customer-experience-systeme",
    moneyPath: "/loesungen/customer-experience-systeme",
    systemPath: "/systeme/service-supportportal",
    serviceLabel: "Customer-Experience-Systeme",
    h1: "Customer Experience für Bochumer Einrichtungen",
    rationale:
      "Gesundheits- und Bildungseinrichtungen in Bochum stehen vor einer besonderen Anforderung: Sie sollen schnell und persönlich antworten, arbeiten dabei aber mit sensiblen Daten. Automatisierung ist hier nur dann tragfähig, wenn jeder Schritt begründbar bleibt und klar ist, welche Angaben ein System überhaupt verarbeitet. Transparenz ist in diesem Umfeld kein Zusatz, sondern Voraussetzung.",
    deliverables: [
      "Festlegung, welche Daten automatisiert verarbeitet werden dürfen",
      "Automatische Einordnung von Anliegen mit menschlicher Freigabe",
      "Konsistente Antwortqualität über alle Kontaktwege",
      "Nachvollziehbare Protokollierung jedes automatischen Schritts",
    ],
    faq: [
      { question: "Ist Automatisierung bei sensiblen Daten vertretbar?", answer: "Ja, wenn vorab definiert ist, welche Angaben verarbeitet werden und an welcher Stelle ein Mensch freigibt. Entscheidend ist, dass kein Schritt eine Blackbox bleibt." },
      { question: "Was wird protokolliert?", answer: "Jeder automatische Schritt wird festgehalten, sodass im Nachhinein rekonstruierbar ist, warum ein Vorgang so bearbeitet wurde." },
      { question: "Wer setzt technisch um?", answer: "NEXCEL AI konzipiert die Systeme, die technische Umsetzung erfolgt gemeinsam mit AGI Works." },
    ],
  },
  {
    citySlug: "duesseldorf",
    serviceSlug: "crm-automation",
    moneyPath: "/loesungen/crm-automation",
    systemPath: "/systeme/angebots-beratungssystem",
    serviceLabel: "CRM-Automatisierung",
    h1: "CRM-Automatisierung für Düsseldorfer Dienstleister",
    rationale:
      "Agenturen und Beratungen in Düsseldorf arbeiten mit langen Entscheidungswegen auf Kundenseite: Zwischen erstem Gespräch und Auftrag liegen oft mehrere Monate und viele Berührungspunkte. Genau in dieser Zeit gehen Kontakte verloren, weil das Nachfassen im Tagesgeschäft untergeht. Ein CRM mit automatischer Wiedervorlage hält den Faden, ohne dass jemand eine Liste pflegt.",
    deliverables: [
      "Pipeline entlang der tatsächlichen Entscheidungsstufen",
      "Automatische Wiedervorlagen nach definierter Wartezeit",
      "Vollständige Kontakthistorie je Kunde",
      "Auswertung, an welcher Stufe Abschlüsse ausbleiben",
    ],
    faq: [
      { question: "Wirkt automatisches Nachfassen aufdringlich?", answer: "Nicht, wenn Zeitpunkt und Inhalt zum Verlauf passen. Automatisiert wird die Erinnerung an das Nachfassen, nicht zwingend die Nachricht selbst." },
      { question: "Muss das bestehende CRM ersetzt werden?", answer: "Nicht unbedingt. Häufig lässt sich ein vorhandenes System über Schnittstellen ergänzen, statt es abzulösen." },
      { question: "Was wird messbar?", answer: "An welcher Stufe Kontakte abspringen und wie sich die Abschlussquote je Quelle entwickelt." },
    ],
  },
  {
    citySlug: "frankfurt",
    serviceSlug: "ki-agenten",
    moneyPath: "/loesungen/ki-agenten",
    systemPath: "/systeme/ki-telefonagent-voice",
    serviceLabel: "KI-Agenten",
    h1: "KI-Agenten für Frankfurter Dienstleister",
    rationale:
      "Im Frankfurter Finanz- und Beratungsumfeld gilt für automatische Entscheidungen dieselbe Anforderung wie für manuelle: Sie müssen im Nachhinein begründbar sein. Ein KI-Agent ist hier deshalb nur dann einsetzbar, wenn sein Handlungsrahmen eng gefasst ist und jeder Schritt protokolliert wird. Sinnvoll ist er dort, wo er Vorgänge vorbereitet und einordnet — die Entscheidung selbst bleibt beim Menschen.",
    deliverables: [
      "Eng abgegrenzter Handlungsrahmen mit definierten Grenzen",
      "Vorbereitung und Einordnung von Vorgängen statt Letztentscheidung",
      "Vollständige Protokollierung jeder Aktion",
      "Definiertes Rückfallverhalten bei Unsicherheit",
    ],
    faq: [
      { question: "Trifft ein KI-Agent Entscheidungen allein?", answer: "In diesem Zuschnitt nicht. Er bereitet Vorgänge vor und ordnet sie ein; die Entscheidung bleibt bei einer verantwortlichen Person." },
      { question: "Was passiert bei Unsicherheit?", answer: "Der Vorgang wird an einen Menschen übergeben, statt eine unsichere Antwort auszuliefern. Dieses Verhalten wird vorab festgelegt." },
      { question: "Arbeitet NEXCEL AI in Frankfurt vor Ort?", answer: "Nein, außerhalb von Nordrhein-Westfalen läuft die Zusammenarbeit vollständig remote. Der rechtliche Sitz ist Unna." },
    ],
  },
  {
    citySlug: "hamburg",
    serviceSlug: "email-automation",
    moneyPath: "/loesungen/email-automation",
    systemPath: "/systeme/omnichannel-kommunikation",
    serviceLabel: "E-Mail-Automatisierung",
    h1: "E-Mail-Automatisierung für Hamburger Betriebe",
    rationale:
      "Im Hamburger Handels- und Logistikumfeld besteht ein großer Teil des E-Mail-Aufkommens aus Statusanfragen: Wo ist die Sendung, wann kommt die Lieferung, ist die Buchung bestätigt. Diese Nachrichten sind inhaltlich immer gleich und lassen sich aus den vorhandenen Daten beantworten. Wird das automatisiert, sinkt nicht nur die Arbeitslast in der Disposition — die Auftraggeber bekommen ihre Antwort auch sofort statt am nächsten Werktag.",
    deliverables: [
      "Erkennung wiederkehrender Anfragetypen im Posteingang",
      "Antworten direkt aus dem führenden System erzeugt",
      "Weiterleitung abweichender Fälle an die zuständige Person",
      "Auswertung, welche Anfragetypen den größten Anteil ausmachen",
    ],
    faq: [
      { question: "Werden alle E-Mails automatisch beantwortet?", answer: "Nein, nur klar erkennbare wiederkehrende Anfragetypen. Alles andere wird weitergeleitet." },
      { question: "Woher stammen die Angaben in der Antwort?", answer: "Aus dem System, das die Daten führt, sodass die Antwort den aktuellen Stand widerspiegelt." },
      { question: "Arbeitet NEXCEL AI in Hamburg vor Ort?", answer: "Nein, außerhalb von Nordrhein-Westfalen läuft die Zusammenarbeit vollständig remote. Der rechtliche Sitz ist Unna." },
    ],
  },
];

const PAIRINGS: Record<BrandKey, Pairing[]> = {
  agiworks: AGI_PAIRINGS,
  nexcel: NEXCEL_PAIRINGS,
};

const BRAND_NAME: Record<BrandKey, string> = {
  nexcel: "NEXCEL AI",
  agiworks: "AGI Works",
};

function buildCityServicePages(): CityServicePage[] {
  const pages: CityServicePage[] = [];
  (["nexcel", "agiworks"] as BrandKey[]).forEach((brand) => {
    PAIRINGS[brand].forEach((p) => {
      const location = getLocationPage(brand, p.citySlug);
      if (!location) return;
      const path = `/standorte/${p.citySlug}/${p.serviceSlug}`;
      pages.push({
        id: `${brand}:${path}`,
        brand,
        citySlug: p.citySlug,
        serviceSlug: p.serviceSlug,
        path,
        city: location.city,
        region: location.region,
        serviceLabel: p.serviceLabel,
        title: `${p.serviceLabel} ${location.city} | ${BRAND_NAME[brand]}`,
        description:
          brand === "agiworks"
            ? `${p.serviceLabel} für Unternehmen in ${location.city}: individuell entwickelt, mit Übergabe von Quellcode und Dokumentation.`
            : `${p.serviceLabel} für Unternehmen in ${location.city}: klar abgegrenzte Regeln, überprüfbare Ergebnisse, Kontrolle bleibt im Team.`,
        h1: p.h1,
        aeoAnswer: p.rationale,
        rationale: p.rationale,
        deliverables: p.deliverables,
        faq: p.faq,
        relatedPaths: [
          p.moneyPath,
          p.systemPath,
          `/standorte/${p.citySlug}`,
          "/systemanalyse",
          "/kontakt",
        ],
        approved: true,
        manualIndexApproval: true,
      });
    });
  });
  return pages;
}

export const CITY_SERVICE_PAGES: CityServicePage[] = buildCityServicePages();

export function getCityServicePage(
  brand: BrandKey,
  citySlug: string,
  serviceSlug: string
): CityServicePage | undefined {
  return CITY_SERVICE_PAGES.find(
    (p) => p.brand === brand && p.citySlug === citySlug && p.serviceSlug === serviceSlug
  );
}

export function getCityServicePagesForBrand(brand: BrandKey): CityServicePage[] {
  return CITY_SERVICE_PAGES.filter((p) => p.brand === brand);
}

/** City-service pages that belong to a given city page (for its internal links). */
export function getCityServicePagesForCity(
  brand: BrandKey,
  citySlug: string
): CityServicePage[] {
  return CITY_SERVICE_PAGES.filter((p) => p.brand === brand && p.citySlug === citySlug);
}
