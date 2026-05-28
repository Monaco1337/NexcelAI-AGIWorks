/**
 * Gesprächsbasierter Kontext-Schritt — eine Frage nach der anderen, klare Alltagssprache.
 * Mappt auf bestehende situationDrivers + situationNarrative (keine neuen Persist-Felder nötig außer UI-State).
 */

export type ContextConvoOption = {
  id: string;
  label: string;
  hint: string;
  /** Bestehende Situation-Treiber-IDs (lib/config SITUATION_DRIVERS) */
  drivers: string[];
  /** Fließtext-Zeile für die automatische Ausgangslage */
  narrativeLine: string;
};

export type ContextConvoQuestion = {
  id: string;
  title: string;
  subtitle: string;
  options: ContextConvoOption[];
};

export const CONTEXT_CONVERSATION: ContextConvoQuestion[] = [
  {
    id: "q1",
    title: "Wie arbeiten Sie aktuell am meisten?",
    subtitle: "Wählen Sie die Antwort, die am besten passt — Sie können später noch ergänzen.",
    options: [
      {
        id: "q1_manual",
        label: "Viel manuell",
        hint: "Viele Schritte laufen per Hand, Copy & Paste oder Excel.",
        drivers: ["digitalisierung", "optimierung"],
        narrativeLine:
          "Aktuell ist ein großer Teil der Arbeit noch manuell oder stark manuell unterstützt.",
      },
      {
        id: "q1_tools",
        label: "Verschiedene Tools",
        hint: "Mehrere Programme, die nicht nahtlos zusammenspielen.",
        drivers: ["modernisierung", "digitalisierung"],
        narrativeLine:
          "Es werden mehrere unterschiedliche Tools genutzt; der Zusammenhalt zwischen den Systemen ist eine Herausforderung.",
      },
      {
        id: "q1_auto",
        label: "Teilweise automatisiert",
        hint: "Einiges läuft automatisch, aber lückenhaft oder mit Ausnahmen.",
        drivers: ["automatisierung", "optimierung"],
        narrativeLine:
          "Es gibt bereits Teile der Automatisierung, insgesamt ist der Ablauf aber noch nicht durchgängig.",
      },
      {
        id: "q1_overview",
        label: "Schwer zu überblicken",
        hint: "Status, Verantwortung oder nächste Schritte sind oft unklar.",
        drivers: ["umbruch", "digitalisierung"],
        narrativeLine:
          "Die Gesamtübersicht über Abläufe und Zuständigkeiten fällt schwer; Transparenz ist begrenzt.",
      },
    ],
  },
  {
    id: "q2",
    title: "Wo verlieren Sie aktuell am meisten Zeit?",
    subtitle: "Denken Sie an typische Wochen — nicht an Einzelfälle.",
    options: [
      {
        id: "q2_coord",
        label: "Abstimmung & Rückfragen",
        hint: "Warten auf Freigaben, Klären per Chat/E-Mail, Meetings.",
        drivers: ["optimierung", "digitalisierung"],
        narrativeLine:
          "Besonders viel Zeit geht für Abstimmung, Rückfragen und Warten auf Rückmeldungen drauf.",
      },
      {
        id: "q2_double",
        label: "Doppelte Erfassung",
        hint: "Dieselben Daten mehrfach eintragen oder übertragen.",
        drivers: ["digitalisierung", "automatisierung"],
        narrativeLine:
          "Zeit fließt in doppelte Datenerfassung und manuelle Übertragung zwischen Systemen.",
      },
      {
        id: "q2_search",
        label: "Suchen & Dokumente",
        hint: "Informationen finden, Versionen, Ablagechaos.",
        drivers: ["modernisierung", "digitalisierung"],
        narrativeLine:
          "Auffinden von Informationen und Dokumenten kostet spürbar Zeit.",
      },
      {
        id: "q2_ops",
        label: "Operativer Tagesbetrieb",
        hint: "Routineaufgaben fressen Kapazität für Wichtigeres.",
        drivers: ["optimierung", "plattform"],
        narrativeLine:
          "Der operative Tagesbetrieb bindet viel Kapazität und lässt wenig Raum für strategische Themen.",
      },
    ],
  },
  {
    id: "q3",
    title: "Was verursacht aktuell die meisten Probleme?",
    subtitle: "Was würden Sie zuerst entschärfen, wenn Sie könnten?",
    options: [
      {
        id: "q3_errors",
        label: "Fehler & Nacharbeit",
        hint: "Korrekturschleifen, Qualität leidet unter dem Tempo.",
        drivers: ["optimierung", "digitalisierung"],
        narrativeLine:
          "Fehler, Nacharbeit und Qualitätsthemen belasten den Alltag merklich.",
      },
      {
        id: "q3_growth",
        label: "Wachstum überfordert Abläufe",
        hint: "Was früher ging, bricht bei mehr Volumen ein.",
        drivers: ["wachstum", "plattform"],
        narrativeLine:
          "Mit Wachstum oder mehr Volumen funktionieren bisherige Abläufe nur noch eingeschränkt.",
      },
      {
        id: "q3_change",
        label: "Umbruch & neue Anforderungen",
        hint: "Markt, Regeln oder Geschäftsmodell verändern sich.",
        drivers: ["umbruch", "modernisierung"],
        narrativeLine:
          "Umbruch oder neue Rahmenbedingungen machen bestehende Abläufe fragil.",
      },
      {
        id: "q3_legacy",
        label: "Technik & Altlasten",
        hint: "Alte Systeme bremsen oder lassen sich schwer anpassen.",
        drivers: ["modernisierung", "automatisierung"],
        narrativeLine:
          "Technische Altlasten und eingefahrene Systeme bremsen Veränderungen.",
      },
    ],
  },
  {
    id: "q4",
    title: "Was möchten Sie am meisten verbessern?",
    subtitle: "Ihr wichtigstes Ziel für die nächsten Monate.",
    options: [
      {
        id: "q4_speed",
        label: "Schneller & effizienter werden",
        hint: "Weniger Reibung, klarere Abläufe.",
        drivers: ["optimierung", "automatisierung"],
        narrativeLine:
          "Priorität liegt auf mehr Tempo und Effizienz im Tagesgeschäft.",
      },
      {
        id: "q4_clarity",
        label: "Mehr Klarheit & Steuerung",
        hint: "Transparenz, KPIs, bessere Entscheidungsgrundlage.",
        drivers: ["digitalisierung", "plattform"],
        narrativeLine:
          "Es soll mehr Klarheit, Steuerbarkeit und belastbare Daten für Entscheidungen geben.",
      },
      {
        id: "q4_scale",
        label: "Skalieren ohne Chaos",
        hint: "Wachstum ohne proportional mehr Aufwand.",
        drivers: ["wachstum", "plattform"],
        narrativeLine:
          "Skalierung soll ohne proportional wachsendes Chaos möglich sein.",
      },
      {
        id: "q4_future",
        label: "Zukunftssicher aufstellen",
        hint: "Moderne Architektur, KI, Automatisierung sinnvoll nutzen.",
        drivers: ["digitalisierung", "automatisierung"],
        narrativeLine:
          "Der Fokus liegt auf einer zukunftsfähigen, digitalen Ausrichtung inkl. sinnvoller Automatisierung.",
      },
    ],
  },
];

export function contextChoiceKeys(): ("q1" | "q2" | "q3" | "q4")[] {
  return ["q1", "q2", "q3", "q4"];
}

export function getContextOption(questionIndex: number, optionId: string): ContextConvoOption | undefined {
  const q = CONTEXT_CONVERSATION[questionIndex];
  return q?.options.find((o) => o.id === optionId);
}

export function composeContextNarrative(choices: Partial<Record<"q1" | "q2" | "q3" | "q4", string>>): string {
  const parts: string[] = [];
  const keys: ("q1" | "q2" | "q3" | "q4")[] = ["q1", "q2", "q3", "q4"];
  for (let i = 0; i < keys.length; i++) {
    const id = choices[keys[i]];
    if (!id) continue;
    const opt = getContextOption(i, id);
    if (opt?.narrativeLine) parts.push(opt.narrativeLine);
  }
  return parts.join("\n\n");
}

export function driversFromContextChoices(choices: Partial<Record<"q1" | "q2" | "q3" | "q4", string>>): string[] {
  const set = new Set<string>();
  const keys: ("q1" | "q2" | "q3" | "q4")[] = ["q1", "q2", "q3", "q4"];
  for (let i = 0; i < keys.length; i++) {
    const id = choices[keys[i]];
    if (!id) continue;
    const opt = getContextOption(i, id);
    opt?.drivers.forEach((d) => set.add(d));
  }
  return Array.from(set);
}
