/**
 * Discovery-Datenmodell (Bedarfsgespräch).
 *
 * Das Bedarfsgespräch produziert strukturierte Erkenntnisse in klar
 * definierten Themenblöcken (A–Y). Wir halten diese Struktur im bereits
 * existierenden `sales_notes.structured`-JSONB fest — als eine einzige
 * Discovery-Notiz pro Opportunity. Dadurch fließt die gesamte Domain
 * ohne zusätzliches Schema und ohne Datendopplung durch das System:
 *
 *   Live-Call → sales_notes (kind='discovery') → Solution → Proposal.
 *
 * Alles hier ist reines TypeScript, ohne DB-Import, damit sowohl
 * Client- als auch Server-Code darauf zugreifen kann.
 */

export const DISCOVERY_STATUSES = ["open", "partial", "clarified"] as const;
export type DiscoveryStatus = (typeof DISCOVERY_STATUSES)[number];

export const EVIDENCE_KINDS = [
  "customer_statement",
  "verified",
  "indication",
  "hypothesis",
  "open",
  "contradiction",
] as const;
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];

export const EVIDENCE_LABEL: Record<EvidenceKind, string> = {
  customer_statement: "Kundenaussage",
  verified: "Verifiziert",
  indication: "Indiz",
  hypothesis: "Hypothese",
  open: "Offen",
  contradiction: "Widerspruch",
};

export const EVIDENCE_COLOR: Record<EvidenceKind, string> = {
  customer_statement: "#22C55E",
  verified: "#10B981",
  indication: "#60A5FA",
  hypothesis: "#A78BFA",
  open: "#94A3B8",
  contradiction: "#EF4444",
};

export const DISCOVERY_STATUS_LABEL: Record<DiscoveryStatus, string> = {
  open: "Offen",
  partial: "Teilweise geklärt",
  clarified: "Geklärt",
};

/* -------------------------------------------------------------------------- */
/*  Blockdefinition                                                           */
/* -------------------------------------------------------------------------- */

/**
 * Ein Discovery-Block ist ein fachlicher Themenbereich mit einem
 * Freitext-Notizfeld, einem Klärungsstatus, einer Evidenzklasse und
 * optionalen strukturierten Zusatzfeldern (z. B. Ziel, Priorität …).
 */
export interface DiscoveryBlock {
  note: string;
  status: DiscoveryStatus;
  evidence: EvidenceKind;
  fields: Record<string, string>;
}

/**
 * Eine Beratungshypothese: Beobachtung → Frage → Kundenrealität.
 * Wird beim Bedarfsgespräch aktiv validiert.
 */
export interface DiscoveryHypothesis {
  id: string;
  text: string;
  ursprung: string;
  question: string;
  status: "confirmed" | "partial" | "refuted" | "open";
  note: string;
}

/**
 * Vollständige Discovery-Struktur einer Opportunity.
 */
export interface DiscoveryData {
  version: 1;
  blocks: Record<DiscoveryBlockKey, DiscoveryBlock>;
  hypotheses: DiscoveryHypothesis[];
  bestaetigterBedarf: string;
  naechsterSchritt: string;
  updatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/*  Blockkatalog (A–Y)                                                        */
/* -------------------------------------------------------------------------- */

export interface DiscoveryBlockDefinition {
  readonly key: DiscoveryBlockKey;
  readonly letter: string;
  readonly title: string;
  readonly purpose: string;
  readonly question: string;
  readonly fields: readonly { readonly key: string; readonly label: string; readonly placeholder?: string }[];
  readonly criticalForProposal: boolean;
  readonly group: "context" | "pain" | "value" | "decision" | "delivery";
}

const F = (
  key: string,
  label: string,
  placeholder?: string
): { key: string; label: string; placeholder?: string } => ({ key, label, placeholder });

/**
 * Reihenfolge und Inhalt entsprechen exakt der Spec (Abschnitt 9).
 * Jeder Block ist bewusst als Beratungs-Modul formuliert: kurze
 * Erklärung, konkrete Gesprächsfrage, strukturierte Felder.
 */
export const DISCOVERY_BLOCKS = [
  {
    key: "A_ziel",
    letter: "A",
    title: "Ziel des Kunden",
    purpose: "Was möchte der Kunde tatsächlich erreichen?",
    question: "Was wäre für Sie das ideale Ergebnis in 6–12 Monaten?",
    fields: [
      F("ziel", "Kernziel"),
      F("zustand", "Gewünschter Zustand"),
      F("prioritaet", "Geschäftliche Priorität"),
    ],
    criticalForProposal: true,
    group: "value",
  },
  {
    key: "B_warum_jetzt",
    letter: "B",
    title: "Warum jetzt?",
    purpose: "Warum ist das Thema aktuell relevant?",
    question: "Was hat dazu geführt, dass Sie sich jetzt damit beschäftigen?",
    fields: [
      F("trigger", "Konkreter Auslöser"),
      F("zeitdruck", "Zeitdruck / Anlass"),
      F("veraenderung", "Interne Veränderung"),
    ],
    criticalForProposal: false,
    group: "context",
  },
  {
    key: "C_ist_zustand",
    letter: "C",
    title: "Ist-Zustand",
    purpose: "Wie läuft es aktuell?",
    question: "Wie sieht der heutige Ablauf konkret aus — von Anfrage bis Abschluss?",
    fields: [
      F("prozesse", "Wesentliche Prozesse"),
      F("systeme", "Aktuelle Systeme / Tools"),
      F("verantwortliche", "Verantwortliche"),
      F("manuell", "Manuelle Arbeit"),
    ],
    criticalForProposal: true,
    group: "context",
  },
  {
    key: "D_was_funktioniert",
    letter: "D",
    title: "Was funktioniert bereits",
    purpose: "Stärken und Assets, die erhalten bleiben sollen.",
    question: "Was möchten Sie ausdrücklich beibehalten?",
    fields: [
      F("staerken", "Stärken"),
      F("assets", "Bestehende Assets"),
    ],
    criticalForProposal: true,
    group: "context",
  },
  {
    key: "E_pain",
    letter: "E",
    title: "Pain",
    purpose: "Was ist das tatsächliche Problem — nicht nur das Symptom?",
    question: "Wo tut es heute konkret weh?",
    fields: [F("pain", "Konkretes Problem")],
    criticalForProposal: true,
    group: "pain",
  },
  {
    key: "F_ursache",
    letter: "F",
    title: "Ursache",
    purpose: "Warum entsteht dieses Problem?",
    question: "Woran liegt das aus Ihrer Sicht?",
    fields: [F("ursache", "Ursache")],
    criticalForProposal: true,
    group: "pain",
  },
  {
    key: "G_auswirkung",
    letter: "G",
    title: "Auswirkung",
    purpose: "Was verursacht das Problem — Zeit, Kosten, Reibung, Customer Experience?",
    question: "Was bedeutet das für Ihr Geschäft ganz konkret?",
    fields: [
      F("zeit", "Zeit / Aufwand"),
      F("kosten", "Kosten / Fehler"),
      F("cx", "Customer Experience"),
      F("skalierung", "Skalierungsgrenzen"),
    ],
    criticalForProposal: true,
    group: "pain",
  },
  {
    key: "H_konsequenz",
    letter: "H",
    title: "Konsequenz des Nichtstuns",
    purpose: "Was passiert, wenn nichts verändert wird?",
    question: "Angenommen, es bleibt wie es ist — was heißt das für Sie in 12 Monaten?",
    fields: [F("konsequenz", "Konsequenz")],
    criticalForProposal: false,
    group: "pain",
  },
  {
    key: "I_hypothesen",
    letter: "I",
    title: "Expertenhypothesen",
    purpose: "Vorab aus Analysen abgeleitete Hypothesen aktiv validieren.",
    question: "Passt die folgende Hypothese zu Ihrer Realität?",
    fields: [F("notiz", "Gesprächsnotiz")],
    criticalForProposal: false,
    group: "context",
  },
  {
    key: "J_potenzial",
    letter: "J",
    title: "Potenzial / Upside",
    purpose: "Was wird möglich, wenn das Problem gelöst ist?",
    question: "Was könnten Sie machen, wenn dieser Engpass weg wäre?",
    fields: [F("potenzial", "Potenzial")],
    criticalForProposal: true,
    group: "value",
  },
  {
    key: "K_business_value",
    letter: "K",
    title: "Business Value",
    purpose: "Welche geschäftliche Wirkung ist relevant? Keine erfundenen ROI-Werte.",
    question: "Woran würden Sie den geschäftlichen Erfolg festmachen?",
    fields: [F("value", "Business Value")],
    criticalForProposal: true,
    group: "value",
  },
  {
    key: "L_zielzustand",
    letter: "L",
    title: "Zielzustand",
    purpose: "Wie soll die Zukunft aussehen?",
    question: "Wie soll der Ablauf idealerweise laufen?",
    fields: [F("zielzustand", "Zielzustand")],
    criticalForProposal: true,
    group: "value",
  },
  {
    key: "M_erfolgskriterien",
    letter: "M",
    title: "Erfolgskriterien",
    purpose: "Woran erkennt der Kunde später, dass das Projekt erfolgreich war?",
    question: "Woran würden Sie in 3 Monaten sehen, dass es funktioniert?",
    fields: [F("kriterien", "Erfolgskriterien")],
    criticalForProposal: true,
    group: "value",
  },
  {
    key: "N_prioritaet",
    letter: "N",
    title: "Priorität",
    purpose: "Wie wichtig ist das Thema für den Kunden?",
    question: "Wo liegt das Thema aktuell auf Ihrer Prioritätenliste?",
    fields: [F("prioritaet", "Priorität")],
    criticalForProposal: false,
    group: "decision",
  },
  {
    key: "O_timing",
    letter: "O",
    title: "Timing",
    purpose: "Wann soll etwas passieren und warum?",
    question: "Wann würde es Sinn machen zu starten — und was ist der Grund für diesen Zeitpunkt?",
    fields: [
      F("wann", "Startzeitraum"),
      F("warum", "Grund für das Timing"),
    ],
    criticalForProposal: true,
    group: "decision",
  },
  {
    key: "P_systeme",
    letter: "P",
    title: "Systeme / Technische Realität",
    purpose: "Bestehende Systeme, Tools, Integrationen, Datenquellen — nur soweit relevant.",
    question: "Welche Systeme müssen mitspielen oder sollen ersetzt werden?",
    fields: [
      F("systeme", "Systeme / Tools"),
      F("integrationen", "Integrationen / Datenquellen"),
    ],
    criticalForProposal: true,
    group: "delivery",
  },
  {
    key: "Q_stakeholder",
    letter: "Q",
    title: "Entscheider & Stakeholder",
    purpose: "Wer entscheidet, wer beeinflusst, wer arbeitet damit?",
    question: "Wer ist neben Ihnen an dieser Entscheidung beteiligt?",
    fields: [
      F("entscheider", "Entscheider"),
      F("beeinflusser", "Beeinflusser"),
      F("nutzer", "Späterer Nutzer"),
    ],
    criticalForProposal: true,
    group: "decision",
  },
  {
    key: "R_kriterien",
    letter: "R",
    title: "Entscheidungskriterien",
    purpose: "Was ist für die Entscheidung wichtig?",
    question: "Woran werden Sie entscheiden, mit wem Sie das umsetzen?",
    fields: [F("kriterien", "Kriterien")],
    criticalForProposal: false,
    group: "decision",
  },
  {
    key: "S_prozess",
    letter: "S",
    title: "Entscheidungsprozess",
    purpose: "Wie wird intern entschieden?",
    question: "Wie sieht der interne Entscheidungsweg aus?",
    fields: [F("prozess", "Prozess / Freigaben")],
    criticalForProposal: false,
    group: "decision",
  },
  {
    key: "T_budget",
    letter: "T",
    title: "Investitionsrahmen",
    purpose: "Nur soweit der Kunde ihn nennen möchte. Keine aggressive Budgetfrage.",
    question: "Gibt es einen Rahmen, den wir kennen sollten, damit wir sinnvoll planen?",
    fields: [F("rahmen", "Investitionsrahmen")],
    criticalForProposal: true,
    group: "decision",
  },
  {
    key: "U_alternativen",
    letter: "U",
    title: "Alternativen",
    purpose: "Was prüft der Kunde sonst?",
    question: "Was wären Alternativen, die Sie sonst noch erwägen?",
    fields: [F("alternativen", "Alternativen")],
    criticalForProposal: false,
    group: "decision",
  },
  {
    key: "V_risiken",
    letter: "V",
    title: "Risiken / Abhängigkeiten",
    purpose: "Was könnte die Umsetzung beeinflussen?",
    question: "Was könnte uns bei der Umsetzung ausbremsen?",
    fields: [F("risiken", "Risiken / Abhängigkeiten")],
    criticalForProposal: true,
    group: "delivery",
  },
  {
    key: "W_strategisch",
    letter: "W",
    title: "Strategische Erkenntnisse",
    purpose: "Freies Feld für Zusammenhänge, die im Gespräch sichtbar werden.",
    question: "Was fällt Ihnen sonst noch als relevant ein?",
    fields: [F("erkenntnis", "Erkenntnis")],
    criticalForProposal: false,
    group: "context",
  },
  {
    key: "X_bedarf",
    letter: "X",
    title: "Bestätigter Bedarf",
    purpose: "Am Ende gemeinsam kurz zusammenfassen, was bestätigt ist.",
    question: "Habe ich es richtig verstanden: … ?",
    fields: [F("zusammenfassung", "Zusammenfassung")],
    criticalForProposal: true,
    group: "value",
  },
  {
    key: "Y_naechster_schritt",
    letter: "Y",
    title: "Nächster Schritt",
    purpose: "Was passiert konkret danach?",
    question: "Was wäre für Sie ein sinnvoller nächster Schritt?",
    fields: [F("schritt", "Konkreter nächster Schritt")],
    criticalForProposal: false,
    group: "decision",
  },
] as const;

export type DiscoveryBlockKey = (typeof DISCOVERY_BLOCKS)[number]["key"];

export const DISCOVERY_GROUPS: {
  key: DiscoveryBlockDefinition["group"];
  label: string;
  hint: string;
}[] = [
  { key: "context", label: "Kontext", hint: "Was war und wo stehen wir?" },
  { key: "pain", label: "Problem", hint: "Wo tut es weh und warum?" },
  { key: "value", label: "Wirkung", hint: "Was soll besser werden?" },
  { key: "decision", label: "Entscheidung", hint: "Wie und wann wird entschieden?" },
  { key: "delivery", label: "Umsetzung", hint: "Was braucht eine saubere Realisierung?" },
];

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                  */
/* -------------------------------------------------------------------------- */

export function emptyBlock(): DiscoveryBlock {
  return { note: "", status: "open", evidence: "open", fields: {} };
}

export function emptyDiscovery(): DiscoveryData {
  const blocks = {} as Record<DiscoveryBlockKey, DiscoveryBlock>;
  for (const def of DISCOVERY_BLOCKS) blocks[def.key] = emptyBlock();
  return {
    version: 1,
    blocks,
    hypotheses: [],
    bestaetigterBedarf: "",
    naechsterSchritt: "",
  };
}

/**
 * Roh-JSONB in ein sauber initialisiertes DiscoveryData überführen —
 * fehlende Blöcke werden ergänzt, damit die UI stabil rendern kann.
 */
export function coerceDiscovery(raw: unknown): DiscoveryData {
  const base = emptyDiscovery();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<DiscoveryData> & {
    blocks?: Partial<Record<string, Partial<DiscoveryBlock>>>;
  };
  if (r.blocks) {
    for (const def of DISCOVERY_BLOCKS) {
      const src = r.blocks[def.key];
      if (!src) continue;
      base.blocks[def.key] = {
        note: typeof src.note === "string" ? src.note : "",
        status: DISCOVERY_STATUSES.includes(src.status as DiscoveryStatus)
          ? (src.status as DiscoveryStatus)
          : "open",
        evidence: EVIDENCE_KINDS.includes(src.evidence as EvidenceKind)
          ? (src.evidence as EvidenceKind)
          : "open",
        fields:
          src.fields && typeof src.fields === "object"
            ? Object.fromEntries(
                Object.entries(src.fields as Record<string, unknown>)
                  .filter(([, v]) => typeof v === "string")
                  .map(([k, v]) => [k, v as string])
              )
            : {},
      };
    }
  }
  if (Array.isArray(r.hypotheses)) {
    base.hypotheses = r.hypotheses.filter((h): h is DiscoveryHypothesis => {
      return Boolean(h && typeof h === "object" && typeof (h as DiscoveryHypothesis).text === "string");
    });
  }
  if (typeof r.bestaetigterBedarf === "string") base.bestaetigterBedarf = r.bestaetigterBedarf;
  if (typeof r.naechsterSchritt === "string") base.naechsterSchritt = r.naechsterSchritt;
  return base;
}

/**
 * Discovery-Completeness: Fachliche Sicht, was für ein hochwertiges
 * Angebot noch fehlt. Kein künstlicher Score.
 */
export interface DiscoveryCompleteness {
  clarified: DiscoveryBlockKey[];
  partial: DiscoveryBlockKey[];
  open: DiscoveryBlockKey[];
  criticalOpen: DiscoveryBlockKey[];
  ratio: number;
  readyForSolution: boolean;
}

export function analyzeDiscovery(data: DiscoveryData): DiscoveryCompleteness {
  const clarified: DiscoveryBlockKey[] = [];
  const partial: DiscoveryBlockKey[] = [];
  const open: DiscoveryBlockKey[] = [];
  const criticalOpen: DiscoveryBlockKey[] = [];

  for (const def of DISCOVERY_BLOCKS) {
    const block = data.blocks[def.key];
    if (!block) {
      open.push(def.key);
      if (def.criticalForProposal) criticalOpen.push(def.key);
      continue;
    }
    if (block.status === "clarified") clarified.push(def.key);
    else if (block.status === "partial") partial.push(def.key);
    else {
      open.push(def.key);
      if (def.criticalForProposal) criticalOpen.push(def.key);
    }
  }
  const total = DISCOVERY_BLOCKS.length;
  const ratio = (clarified.length + partial.length * 0.5) / total;

  return {
    clarified,
    partial,
    open,
    criticalOpen,
    ratio,
    readyForSolution: criticalOpen.length === 0 && clarified.length >= 6,
  };
}

export function findBlock(key: DiscoveryBlockKey): DiscoveryBlockDefinition {
  return DISCOVERY_BLOCKS.find((b) => b.key === key) as DiscoveryBlockDefinition;
}
