"use client";

/**
 * Solution Review Workspace.
 *
 * Vollwertige Redaktions-Oberfläche für Lösungs- & Leistungsumfang.
 * Jede Sektion ist einzeln editierbar; die Daten fließen exakt in die
 * bestehende `sales_solutions.structured`-Struktur (mit `challengeMode`
 * separat). Aus dem freigegebenen Bedarf werden Ziel, Pain, Auswirkung
 * und Zielzustand vorgeschlagen — der Benutzer entscheidet, was in die
 * finale Lösung übernommen wird.
 *
 * Solution-Readiness prüft, ob die für ein Angebot kritischen Themen
 * geklärt sind, bevor die Lösung erstellt werden kann.
 */

import { useEffect, useMemo, useState } from "react";
import type { SalesOpportunity, SalesSolution } from "./shared";
import { QUALITY_GATE_LABEL, type QualityGate } from "./shared";
import {
  DISCOVERY_BLOCKS,
  analyzeDiscovery,
  coerceDiscovery,
  emptyDiscovery,
  findBlock,
  type DiscoveryBlockKey,
  type DiscoveryData,
} from "@/lib/sales/discoveryModel";
import {
  DangerButton,
  Field,
  Pill,
  Section,
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  inputClasses,
  selectClasses,
  textareaClasses,
} from "./HelperUI";

/* -------------------------------------------------------------------------- */
/*  Structured payload                                                         */
/* -------------------------------------------------------------------------- */

interface SolutionStructured {
  ausgangslage: string;
  pain: string;
  zielzustand: string;
  topHebel: string[];
  loesungsarchitektur: string;
  loesungsbausteine: { name: string; beschreibung: string }[];
  leistungenNexcel: string[];
  leistungenAgi: string[];
  businessValue: string;
  roadmap: { phase: string; ziel: string }[];
  deliverables: string[];
  definitionOfDone: string[];
  inScope: string[];
  outOfScope: string[];
  annahmen: string[];
  risiken: string[];
  abhaengigkeiten: string[];
  offenePunkte: string[];
  executiveSummary: string;
}

interface ChallengeStructured {
  gepruefteAnnahmen: string[];
  notizen: string;
}

function emptySolutionStructured(): SolutionStructured {
  return {
    ausgangslage: "",
    pain: "",
    zielzustand: "",
    topHebel: [],
    loesungsarchitektur: "",
    loesungsbausteine: [],
    leistungenNexcel: [],
    leistungenAgi: [],
    businessValue: "",
    roadmap: [],
    deliverables: [],
    definitionOfDone: [],
    inScope: [],
    outOfScope: [],
    annahmen: [],
    risiken: [],
    abhaengigkeiten: [],
    offenePunkte: [],
    executiveSummary: "",
  };
}

function coerceSolutionStructured(raw: unknown): SolutionStructured {
  const base = emptySolutionStructured();
  if (!raw || typeof raw !== "object") return base;
  const r = raw as Partial<SolutionStructured>;
  return {
    ausgangslage: str(r.ausgangslage),
    pain: str(r.pain),
    zielzustand: str(r.zielzustand),
    topHebel: strArray(r.topHebel),
    loesungsarchitektur: str(r.loesungsarchitektur),
    loesungsbausteine: Array.isArray(r.loesungsbausteine)
      ? r.loesungsbausteine.map((b) => ({
          name: str((b as { name?: unknown })?.name),
          beschreibung: str((b as { beschreibung?: unknown })?.beschreibung),
        }))
      : [],
    leistungenNexcel: strArray(r.leistungenNexcel),
    leistungenAgi: strArray(r.leistungenAgi),
    businessValue: str(r.businessValue),
    roadmap: Array.isArray(r.roadmap)
      ? r.roadmap.map((b) => ({
          phase: str((b as { phase?: unknown })?.phase),
          ziel: str((b as { ziel?: unknown })?.ziel),
        }))
      : [],
    deliverables: strArray(r.deliverables),
    definitionOfDone: strArray(r.definitionOfDone),
    inScope: strArray(r.inScope),
    outOfScope: strArray(r.outOfScope),
    annahmen: strArray(r.annahmen),
    risiken: strArray(r.risiken),
    abhaengigkeiten: strArray(r.abhaengigkeiten),
    offenePunkte: strArray(r.offenePunkte),
    executiveSummary: str(r.executiveSummary),
  };
}

function coerceChallengeStructured(raw: unknown): ChallengeStructured {
  if (!raw || typeof raw !== "object") return { gepruefteAnnahmen: [], notizen: "" };
  const r = raw as Partial<ChallengeStructured> & { geprueft?: unknown };
  const arr = strArray(r.gepruefteAnnahmen ?? r.geprueft);
  return {
    gepruefteAnnahmen: arr,
    notizen: str(r.notizen),
  };
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function strArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((s): s is string => typeof s === "string");
}

/* -------------------------------------------------------------------------- */
/*  Solution-Readiness                                                         */
/* -------------------------------------------------------------------------- */

interface Readiness {
  ready: boolean;
  missing: DiscoveryBlockKey[];
  clarifiedCount: number;
}

function computeReadiness(discovery: DiscoveryData | null): Readiness {
  if (!discovery) return { ready: false, missing: [], clarifiedCount: 0 };
  const analysis = analyzeDiscovery(discovery);
  return {
    ready: analysis.readyForSolution,
    missing: analysis.criticalOpen,
    clarifiedCount: analysis.clarified.length,
  };
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

interface Props {
  opportunity: SalesOpportunity;
  solution: SalesSolution | null;
  accent: string;
  onChanged: () => void;
}

export default function SolutionReview({ opportunity, solution, accent, onChanged }: Props) {
  const [structured, setStructured] = useState<SolutionStructured>(() =>
    coerceSolutionStructured(solution?.structured)
  );
  const [challenge, setChallenge] = useState<ChallengeStructured>(() =>
    coerceChallengeStructured(solution?.challengeMode)
  );
  const [gate, setGate] = useState<QualityGate | "">(solution?.qualityGate ?? "");
  const [gateNote, setGateNote] = useState(solution?.qualityGateNote ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const [discoveryLoaded, setDiscoveryLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(
          `/api/admin/sales/opportunities/${opportunity.id}/discovery`,
          { cache: "no-store" }
        );
        if (res.ok) {
          const payload = (await res.json()) as { discovery: DiscoveryData };
          if (alive) setDiscovery(coerceDiscovery(payload.discovery));
        }
      } finally {
        if (alive) setDiscoveryLoaded(true);
      }
    })();
    return () => {
      alive = false;
    };
  }, [opportunity.id]);

  useEffect(() => {
    setStructured(coerceSolutionStructured(solution?.structured));
    setChallenge(coerceChallengeStructured(solution?.challengeMode));
    setGate(solution?.qualityGate ?? "");
    setGateNote(solution?.qualityGateNote ?? "");
  }, [solution]);

  const readiness = useMemo(
    () => (discoveryLoaded ? computeReadiness(discovery ?? emptyDiscovery()) : null),
    [discovery, discoveryLoaded]
  );

  const proposedFromDiscovery = useMemo(() => {
    if (!discovery) return null;
    const b = discovery.blocks;
    return {
      ausgangslage: b?.C_ist_zustand?.note || "",
      pain: b?.E_pain?.note || "",
      zielzustand: b?.L_zielzustand?.note || "",
      businessValue: b?.K_business_value?.note || "",
      erfolg: b?.M_erfolgskriterien?.note || "",
    };
  }, [discovery]);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/sales/opportunities/${opportunity.id}/solution`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            structured,
            challengeMode: challenge,
            qualityGate: gate || null,
            qualityGateNote: gateNote || null,
          }),
        }
      );
      if (res.ok) {
        setMessage("Lösung gespeichert.");
        onChanged();
      } else {
        const t = await res.text();
        setMessage(t || "Speichern fehlgeschlagen.");
      }
    } finally {
      setSaving(false);
    }
  };

  const approve = async () => {
    if (!solution) return;
    if (gate !== "angebotsreif") {
      alert("Nur mit Quality-Gate 'Angebotsreif' freigebbar.");
      return;
    }
    const res = await fetch(`/api/admin/sales/solutions/${solution.id}/approve`, {
      method: "POST",
    });
    if (res.ok) {
      setMessage("Lösung freigegeben.");
      onChanged();
    }
  };

  const applyDiscoveryToBlank = () => {
    if (!proposedFromDiscovery) return;
    setStructured((s) => ({
      ...s,
      ausgangslage: s.ausgangslage || proposedFromDiscovery.ausgangslage,
      pain: s.pain || proposedFromDiscovery.pain,
      zielzustand: s.zielzustand || proposedFromDiscovery.zielzustand,
      businessValue: s.businessValue || proposedFromDiscovery.businessValue,
    }));
  };

  return (
    <div className="space-y-4">
      {/* Readiness-Karte */}
      {readiness && !solution?.approvedAt && (
        <div
          className={`rounded-2xl border p-4 ${
            readiness.ready
              ? "border-emerald-400/25 bg-emerald-400/[0.06]"
              : "border-amber-400/25 bg-amber-400/[0.06]"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div
                className={`text-[11px] uppercase tracking-wider ${
                  readiness.ready ? "text-emerald-300/80" : "text-amber-300/80"
                }`}
              >
                Lösungsbereitschaft
              </div>
              <div className="mt-1 text-sm text-white">
                {readiness.ready ? (
                  <>Alle angebotsrelevanten Themen sind geklärt — Lösung kann erstellt werden.</>
                ) : readiness.missing.length > 0 ? (
                  <>Für ein hochwertiges Angebot fehlen noch {readiness.missing.length} kritische Themen.</>
                ) : (
                  <>Bedarf ist noch nicht ausreichend geklärt.</>
                )}
              </div>
              {readiness.missing.length > 0 && (
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {readiness.missing.map((k) => (
                    <li
                      key={k}
                      className="rounded-md border border-amber-400/25 bg-amber-400/10 px-2 py-0.5 text-[11px] text-amber-100"
                    >
                      {findBlock(k).title}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {proposedFromDiscovery &&
              (proposedFromDiscovery.ausgangslage ||
                proposedFromDiscovery.pain ||
                proposedFromDiscovery.zielzustand ||
                proposedFromDiscovery.businessValue) && (
                <button onClick={applyDiscoveryToBlank} className={buttonSecondary}>
                  Bedarf in Lösung übernehmen
                </button>
              )}
          </div>
        </div>
      )}

      <Section
        title="Ausgangslage, Pain, Zielzustand"
        actions={<StatusChip approved={Boolean(solution?.approvedAt)} />}
      >
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <Field label="Ausgangslage">
            <textarea
              value={structured.ausgangslage}
              onChange={(e) => setStructured({ ...structured, ausgangslage: e.target.value })}
              className={textareaClasses}
              placeholder={proposedFromDiscovery?.ausgangslage || "Wie sieht die aktuelle Situation aus?"}
            />
          </Field>
          <Field label="Pain">
            <textarea
              value={structured.pain}
              onChange={(e) => setStructured({ ...structured, pain: e.target.value })}
              className={textareaClasses}
              placeholder={proposedFromDiscovery?.pain || "Was tut heute weh?"}
            />
          </Field>
          <Field label="Zielzustand">
            <textarea
              value={structured.zielzustand}
              onChange={(e) => setStructured({ ...structured, zielzustand: e.target.value })}
              className={textareaClasses}
              placeholder={proposedFromDiscovery?.zielzustand || "Wie soll es künftig laufen?"}
            />
          </Field>
        </div>
      </Section>

      <Section title="Top-Hebel & Lösungsarchitektur">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr]">
          <StringListEditor
            label="Top-Hebel"
            hint="Was bringt den größten Nutzen?"
            values={structured.topHebel}
            onChange={(v) => setStructured({ ...structured, topHebel: v })}
          />
          <Field label="Lösungsarchitektur">
            <textarea
              value={structured.loesungsarchitektur}
              onChange={(e) => setStructured({ ...structured, loesungsarchitektur: e.target.value })}
              className={`${textareaClasses} min-h-[140px]`}
              placeholder="Wie funktioniert die Lösung im Ganzen? Welche Rollen spielen welche Systeme?"
            />
          </Field>
        </div>
      </Section>

      <Section title="Lösungsbausteine">
        <PairListEditor
          entries={structured.loesungsbausteine.map((b) => ({ a: b.name, b: b.beschreibung }))}
          onChange={(next) =>
            setStructured({
              ...structured,
              loesungsbausteine: next.map((n) => ({ name: n.a, beschreibung: n.b })),
            })
          }
          aLabel="Baustein"
          bLabel="Was liefert er?"
          placeholderA="z. B. Lead-Portal"
          placeholderB="Nutzen kurz beschreiben"
        />
      </Section>

      <Section title="Leistungsverteilung">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StringListEditor
            label="NEXCEL AI"
            hint="Strategie, Struktur, Prozesse, Skalierung."
            values={structured.leistungenNexcel}
            onChange={(v) => setStructured({ ...structured, leistungenNexcel: v })}
          />
          <StringListEditor
            label="AGI Works"
            hint="Engineering, Integrationen, Plattformen, KI-Systeme."
            values={structured.leistungenAgi}
            onChange={(v) => setStructured({ ...structured, leistungenAgi: v })}
          />
        </div>
      </Section>

      <Section title="Business Value & Roadmap">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.5fr]">
          <Field label="Business Value">
            <textarea
              value={structured.businessValue}
              onChange={(e) => setStructured({ ...structured, businessValue: e.target.value })}
              className={`${textareaClasses} min-h-[140px]`}
              placeholder={proposedFromDiscovery?.businessValue || "Welchen geschäftlichen Effekt schafft die Lösung? Keine erfundenen Zahlen."}
            />
          </Field>
          <PairListEditor
            entries={structured.roadmap.map((r) => ({ a: r.phase, b: r.ziel }))}
            onChange={(next) =>
              setStructured({
                ...structured,
                roadmap: next.map((n) => ({ phase: n.a, ziel: n.b })),
              })
            }
            aLabel="Phase"
            bLabel="Ziel"
            placeholderA="z. B. Discovery, Aufbau, Rollout"
            placeholderB="Was ist am Ende erreicht?"
          />
        </div>
      </Section>

      <Section title="Ergebnis & Umfang">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <StringListEditor
            label="Deliverables"
            values={structured.deliverables}
            onChange={(v) => setStructured({ ...structured, deliverables: v })}
          />
          <StringListEditor
            label="Definition of Done"
            values={structured.definitionOfDone}
            onChange={(v) => setStructured({ ...structured, definitionOfDone: v })}
          />
          <StringListEditor
            label="In Scope"
            values={structured.inScope}
            onChange={(v) => setStructured({ ...structured, inScope: v })}
          />
          <StringListEditor
            label="Out of Scope"
            values={structured.outOfScope}
            onChange={(v) => setStructured({ ...structured, outOfScope: v })}
          />
          <StringListEditor
            label="Annahmen"
            values={structured.annahmen}
            onChange={(v) => setStructured({ ...structured, annahmen: v })}
          />
          <StringListEditor
            label="Risiken"
            values={structured.risiken}
            onChange={(v) => setStructured({ ...structured, risiken: v })}
          />
          <StringListEditor
            label="Abhängigkeiten"
            values={structured.abhaengigkeiten}
            onChange={(v) => setStructured({ ...structured, abhaengigkeiten: v })}
          />
          <StringListEditor
            label="Offene Punkte"
            values={structured.offenePunkte}
            onChange={(v) => setStructured({ ...structured, offenePunkte: v })}
          />
        </div>
      </Section>

      <Section title="Executive Summary">
        <Field label="Executive Summary" hint="Ein Absatz — auf den Punkt. Wird im Angebot oben verwendet.">
          <textarea
            value={structured.executiveSummary}
            onChange={(e) => setStructured({ ...structured, executiveSummary: e.target.value })}
            className={`${textareaClasses} min-h-[140px]`}
            placeholder="Kurz, klar, exekutiv."
          />
        </Field>
      </Section>

      <Section title="Challenge-Mode">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.4fr]">
          <StringListEditor
            label="Geprüfte Annahmen"
            hint="Welche Annahmen sind bewusst hinterfragt worden?"
            values={challenge.gepruefteAnnahmen}
            onChange={(v) => setChallenge({ ...challenge, gepruefteAnnahmen: v })}
          />
          <Field label="Challenge-Notiz">
            <textarea
              value={challenge.notizen}
              onChange={(e) => setChallenge({ ...challenge, notizen: e.target.value })}
              className={textareaClasses}
              placeholder="Wo hätten wir uns fast geirrt? Was war die kritische Frage?"
            />
          </Field>
        </div>
      </Section>

      <Section
        title="Quality Gate"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {message && (
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/70">
                {message}
              </span>
            )}
            <button onClick={save} disabled={saving} className={buttonSecondary}>
              {saving ? "Speichert…" : "Änderungen speichern"}
            </button>
            <button
              onClick={approve}
              disabled={!solution || Boolean(solution?.approvedAt) || gate !== "angebotsreif"}
              className={buttonPrimary}
              style={{ backgroundColor: accent }}
            >
              Lösung freigeben
            </button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Field label="Bewertung">
            <select
              value={gate}
              onChange={(e) => setGate(e.target.value as QualityGate | "")}
              className={selectClasses}
            >
              <option value="">Noch offen</option>
              {(Object.keys(QUALITY_GATE_LABEL) as QualityGate[]).map((g) => (
                <option key={g} value={g}>
                  {QUALITY_GATE_LABEL[g]}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Kurzbegründung">
              <textarea
                value={gateNote}
                onChange={(e) => setGateNote(e.target.value)}
                className={textareaClasses}
                placeholder="Warum bereit — oder was fehlt?"
              />
            </Field>
          </div>
        </div>
      </Section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Kleine, eigenständige Editor-Bausteine                                     */
/* -------------------------------------------------------------------------- */

function StatusChip({ approved }: { approved: boolean }) {
  return approved ? (
    <Pill color="#22C55E">Freigegeben</Pill>
  ) : (
    <Pill color="#F59E0B">Entwurf</Pill>
  );
}

function StringListEditor({
  label,
  hint,
  values,
  onChange,
}: {
  label: string;
  hint?: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/[0.15] p-3">
      <div className="mb-2 flex items-baseline justify-between">
        <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
        {hint && <span className="text-[11px] text-white/35">{hint}</span>}
      </div>
      <ul className="mb-2 space-y-1">
        {values.map((v, i) => (
          <li key={`${i}-${v}`} className="flex items-start gap-2 rounded-md border border-white/[0.05] bg-white/[0.02] px-2 py-1.5 text-sm text-white/85">
            <span className="mt-[6px] h-1 w-1 flex-shrink-0 rounded-full bg-white/40" />
            <span className="min-w-0 flex-1 whitespace-pre-wrap">{v}</span>
            <button
              type="button"
              onClick={() => onChange(values.filter((_, j) => j !== i))}
              className={buttonGhost}
              aria-label="Entfernen"
            >
              ✕
            </button>
          </li>
        ))}
        {values.length === 0 && <li className="text-[11px] text-white/40">Noch nichts hinzugefügt.</li>}
      </ul>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onChange([...values, draft.trim()]);
              setDraft("");
            }
          }}
          className={inputClasses}
          placeholder="Neuer Eintrag · Enter zum Hinzufügen"
        />
        <button
          type="button"
          onClick={() => {
            if (draft.trim()) {
              onChange([...values, draft.trim()]);
              setDraft("");
            }
          }}
          className={buttonSecondary}
        >
          +
        </button>
      </div>
    </div>
  );
}

function PairListEditor({
  entries,
  onChange,
  aLabel,
  bLabel,
  placeholderA,
  placeholderB,
}: {
  entries: { a: string; b: string }[];
  onChange: (next: { a: string; b: string }[]) => void;
  aLabel: string;
  bLabel: string;
  placeholderA?: string;
  placeholderB?: string;
}) {
  const [a, setA] = useState("");
  const [b, setB] = useState("");
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/[0.15] p-3">
      <ul className="mb-2 space-y-2">
        {entries.map((e, i) => (
          <li key={`${i}`} className="rounded-md border border-white/[0.05] bg-white/[0.02] p-2 text-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="text-white/90">{e.a || <span className="text-white/40">{aLabel}</span>}</div>
                <div className="mt-0.5 text-[12px] text-white/60">{e.b || <span className="text-white/40">{bLabel}</span>}</div>
              </div>
              <button
                type="button"
                onClick={() => onChange(entries.filter((_, j) => j !== i))}
                className={buttonGhost}
                aria-label="Entfernen"
              >
                ✕
              </button>
            </div>
          </li>
        ))}
        {entries.length === 0 && <li className="text-[11px] text-white/40">Noch nichts hinzugefügt.</li>}
      </ul>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_2fr_auto]">
        <input value={a} onChange={(e) => setA(e.target.value)} className={inputClasses} placeholder={placeholderA ?? aLabel} />
        <input value={b} onChange={(e) => setB(e.target.value)} className={inputClasses} placeholder={placeholderB ?? bLabel} />
        <button
          type="button"
          onClick={() => {
            if (a.trim() || b.trim()) {
              onChange([...entries, { a: a.trim(), b: b.trim() }]);
              setA("");
              setB("");
            }
          }}
          className={buttonSecondary}
        >
          Hinzufügen
        </button>
      </div>
    </div>
  );
}
