"use client";

/**
 * Live-Call-Workspace (Focus Mode).
 *
 * Dreispaltiger, ruhiger Vollbild-Arbeitsplatz für ein echtes Telefonat:
 *
 *   Links   Gesprächsführung — Telefonskript (aus Playbook) + Pre-Call-Kurzbriefing
 *   Mitte   Live-Notizen — Freitext + strukturierte Schnellfelder + Kontaktergebnis
 *   Rechts  Kundenintelligenz — Kontakt, Opportunity, offene Punkte, Timer
 *
 * Persistiert direkt in `sales_notes` (kind='call'). Autosave alle 2 s,
 * sichtbarer Speicherstatus. „Gespräch abschließen" öffnet einen
 * Review-Dialog und übernimmt anschließend Kontaktergebnis, letzten
 * Kontakt und den nächsten Schritt in die Opportunity.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  BrandContext,
  ContactOutcome,
  NextAction,
  SalesCompany,
  SalesContact,
  SalesOpportunity,
  SalesPlaybook,
} from "./shared";
import {
  BRAND_CONTEXT_LABEL,
  CONTACT_OUTCOME_LABEL,
  NEXT_ACTION_LABEL,
} from "./shared";
import PlaybookView from "./PlaybookView";
import {
  Field,
  Pill,
  buttonGhost,
  buttonPrimary,
  buttonSecondary,
  inputClasses,
  selectClasses,
  textareaClasses,
} from "./HelperUI";

type Interest = "positiv" | "neutral" | "kein" | null;

interface LiveCallForm {
  source: "erstkontakt";
  ansprechpartnerBestaetigt: boolean;
  positionNotiz: string;
  entscheider: boolean;
  interesse: Interest;
  unterlagenGewuenscht: boolean;
  rueckrufWunsch: string;
  termin: string;
  aktuellerBedarf: string;
  problem: string;
  timing: string;
  bestehenderAnbieter: string;
  sonstiges: string;
  freieNotiz: string;
  kontaktErgebnis: ContactOutcome | "";
  nextAction: NextAction | "";
  nextActionDueAt: string; // datetime-local
  callStartedAt: string;
}

function emptyForm(): LiveCallForm {
  return {
    source: "erstkontakt",
    ansprechpartnerBestaetigt: false,
    positionNotiz: "",
    entscheider: false,
    interesse: null,
    unterlagenGewuenscht: false,
    rueckrufWunsch: "",
    termin: "",
    aktuellerBedarf: "",
    problem: "",
    timing: "",
    bestehenderAnbieter: "",
    sonstiges: "",
    freieNotiz: "",
    kontaktErgebnis: "",
    nextAction: "",
    nextActionDueAt: "",
    callStartedAt: new Date().toISOString(),
  };
}

interface Props {
  company: SalesCompany;
  contacts: SalesContact[];
  opportunity: SalesOpportunity | null;
  brand: BrandContext;
  accent: string;
  onClose: () => void;
  onCompleted: () => void;
  brandBusinessLabel?: string;
}

export default function LiveCallWorkspace({
  company,
  contacts,
  opportunity,
  brand,
  accent,
  onClose,
  onCompleted,
  brandBusinessLabel,
}: Props) {
  const primaryContact = useMemo(
    () => contacts.find((c) => c.isPrimary) ?? contacts[0] ?? null,
    [contacts]
  );

  const [contactId, setContactId] = useState<string | null>(primaryContact?.id ?? null);
  const contact = useMemo(
    () => contacts.find((c) => c.id === contactId) ?? primaryContact ?? null,
    [contacts, contactId, primaryContact]
  );

  const [form, setForm] = useState<LiveCallForm>(emptyForm);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [phoneScript, setPhoneScript] = useState<SalesPlaybook | null>(null);
  const [preCallSummary, setPreCallSummary] = useState<string | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [showReview, setShowReview] = useState(false);

  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const formRef = useRef<LiveCallForm>(form);
  formRef.current = form;
  const noteIdRef = useRef<string | null>(null);
  noteIdRef.current = noteId;
  const startTsRef = useRef<number>(Date.now());

  /* ───────── Timer ───────── */
  useEffect(() => {
    const t = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTsRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(t);
  }, []);

  /* ───────── Escape → schließen ───────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !showReview) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, showReview]);

  /* ───────── Skript + Pre-Call laden ───────── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/sales/playbooks", { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { playbooks: SalesPlaybook[] };
          const active =
            data.playbooks.find(
              (p) => p.key === "PHONE_SCRIPT" && p.isActive && p.brandContext === brand
            ) ??
            data.playbooks.find(
              (p) => p.key === "PHONE_SCRIPT" && p.isActive && p.brandContext === "any"
            ) ??
            data.playbooks.find((p) => p.key === "PHONE_SCRIPT") ??
            null;
          if (alive) setPhoneScript(active);
        }
      } catch {
        /* Skript ist nice-to-have */
      }
    })();
    return () => {
      alive = false;
    };
  }, [brand]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set("entity", "company");
        params.set("entityId", company.id);
        params.set("promptKey", "PRE_CALL");
        params.set("status", "APPROVED");
        const res = await fetch(`/api/admin/sales/ai/runs?${params.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          runs: { output: Record<string, unknown> | null; outputText: string | null }[];
        };
        if (!alive) return;
        const latest = data.runs[0];
        if (!latest) return;
        const summary =
          (latest.output as { kurzbriefing?: string } | null)?.kurzbriefing ??
          (latest.output ? JSON.stringify(latest.output, null, 2) : latest.outputText);
        setPreCallSummary(typeof summary === "string" ? summary : null);
      } catch {
        /* still leise */
      }
    })();
    return () => {
      alive = false;
    };
  }, [company.id]);

  /* ───────── Autosave (idempotent, sequenziell) ───────── */
  const persist = useCallback(async () => {
    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }
    savingRef.current = true;
    setSaveState("saving");

    try {
      const snapshot = { ...formRef.current };
      const structured = {
        ...snapshot,
        durationSec: Math.floor((Date.now() - startTsRef.current) / 1000),
        contactId: contact?.id ?? null,
        contactName: contact
          ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
          : null,
      };
      const body = summarizeForBody(snapshot, contact);

      let res: Response;
      const currentId = noteIdRef.current;
      if (currentId) {
        res = await fetch(`/api/admin/sales/notes/${currentId}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ body, structured }),
        });
      } else if (opportunity) {
        res = await fetch(
          `/api/admin/sales/opportunities/${opportunity.id}/notes`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ kind: "call", body, structured }),
          }
        );
      } else {
        setSaveState("error");
        savingRef.current = false;
        return;
      }

      if (!res.ok) {
        setSaveState("error");
      } else {
        const data = (await res.json()) as { note?: { id: string } };
        if (data.note?.id) {
          noteIdRef.current = data.note.id;
          setNoteId(data.note.id);
        }
        setSaveState("saved");
      }
    } catch {
      setSaveState("error");
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        window.setTimeout(() => persist(), 100);
      }
    }
  }, [contact, opportunity]);

  const persistRef = useRef(persist);
  persistRef.current = persist;

  // Debounced Autosave
  const autosaveTimer = useRef<number | null>(null);
  const scheduleSave = useCallback(() => {
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      void persistRef.current();
    }, 1500);
  }, []);

  useEffect(() => {
    if (!opportunity) return;
    if (
      form.freieNotiz ||
      form.aktuellerBedarf ||
      form.problem ||
      form.timing ||
      form.sonstiges ||
      form.rueckrufWunsch ||
      form.termin ||
      form.bestehenderAnbieter ||
      form.positionNotiz ||
      form.kontaktErgebnis ||
      form.nextAction ||
      form.nextActionDueAt ||
      form.interesse
    ) {
      scheduleSave();
    }
  }, [
    form.freieNotiz,
    form.aktuellerBedarf,
    form.problem,
    form.timing,
    form.sonstiges,
    form.rueckrufWunsch,
    form.termin,
    form.bestehenderAnbieter,
    form.positionNotiz,
    form.kontaktErgebnis,
    form.nextAction,
    form.nextActionDueAt,
    form.interesse,
    scheduleSave,
    opportunity,
  ]);

  useEffect(
    () => () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    },
    []
  );

  /* ───────── Cmd+S manuell speichern ───────── */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void persist();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [persist]);

  /* ───────── Gespräch abschließen ───────── */
  const finalize = async () => {
    // Zuerst noch einmal speichern, dann Opportunity-Status pflegen.
    await persist();
    if (opportunity && (form.kontaktErgebnis || form.nextAction || form.nextActionDueAt)) {
      try {
        await fetch(`/api/admin/sales/opportunities/${opportunity.id}`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            version: opportunity.version,
            contactOutcome: form.kontaktErgebnis || undefined,
            nextAction: form.nextAction || undefined,
            nextActionDueAt: form.nextActionDueAt
              ? new Date(form.nextActionDueAt).toISOString()
              : undefined,
          }),
        });
      } catch {
        /* nicht kritisch fürs Gesprächsergebnis */
      }
    }
    onCompleted();
  };

  if (!opportunity) {
    return (
      <FocusShell onClose={onClose}>
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-8 text-center">
          <div className="text-lg font-semibold text-white">Keine Opportunity vorhanden</div>
          <p className="mx-auto mt-2 max-w-md text-sm text-white/60">
            Für Live-Notizen brauchen wir eine Opportunity. Lege im Tab Opportunities zuerst eine an — dann kannst du direkt loslegen.
          </p>
          <div className="mt-5">
            <button onClick={onClose} className={buttonSecondary}>
              Zurück
            </button>
          </div>
        </div>
      </FocusShell>
    );
  }

  const primaryName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : null;

  return (
    <FocusShell onClose={onClose}>
      {/* Header */}
      <header className="flex flex-col gap-3 border-b border-white/[0.06] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.16em] text-white/45">
            <span>Erstkontakt</span>
            <span>·</span>
            <span>{BRAND_CONTEXT_LABEL[brand]}</span>
          </div>
          <div className="mt-1 flex flex-wrap items-baseline gap-3">
            <h2 className="text-2xl font-semibold text-white">{company.name}</h2>
            <span className="text-sm text-white/60">
              {contact ? (
                <>
                  {primaryName || "Kontakt"}
                  {contact.position ? ` · ${contact.position}` : ""}
                  {contact.phone ? (
                    <>
                      {" "}
                      · <a href={`tel:${contact.phone}`} className="text-white hover:underline">{contact.phone}</a>
                    </>
                  ) : null}
                </>
              ) : (
                <span className="text-amber-300">Kein Kontakt hinterlegt</span>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 font-mono text-sm text-white/85"
            title="Gesprächsdauer"
          >
            {formatTimer(elapsedSec)}
          </div>
          <SaveIndicator state={saveState} />
          <button onClick={onClose} className={buttonGhost}>
            Fokus verlassen
          </button>
        </div>
      </header>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4 pt-4 lg:grid-cols-[minmax(280px,1fr)_minmax(340px,1.2fr)_minmax(260px,0.9fr)]">
        {/* LINKS: Skript + Pre-Call */}
        <section className="space-y-3">
          {contacts.length > 1 && (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="text-[11px] uppercase tracking-wider text-white/45">Ansprechpartner</div>
              <select
                value={contactId ?? ""}
                onChange={(e) => setContactId(e.target.value || null)}
                className={`mt-1 ${selectClasses}`}
              >
                <option value="">— wählen —</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {[c.firstName, c.lastName].filter(Boolean).join(" ") || "Kontakt"}
                    {c.position ? ` · ${c.position}` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-white/45">Warum rufen wir an?</div>
              {preCallSummary && <Pill color="#22C55E">Pre-Call verfügbar</Pill>}
            </div>
            {preCallSummary ? (
              <div className="max-h-56 overflow-y-auto rounded-lg border border-white/[0.05] bg-black/[0.15] p-3 text-sm leading-relaxed text-white/85 whitespace-pre-wrap">
                {preCallSummary}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/[0.08] p-3 text-xs text-white/50">
                Kein freigegebenes Pre-Call-Briefing vorhanden. Nutze im Tab KI-Analyse den Workflow Pre-Call-Intelligence oder starte das Gespräch mit einer verifizierten Beobachtung.
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-white/45">Telefonskript</div>
              {phoneScript && (
                <Pill color="#0091C2">v{phoneScript.version}</Pill>
              )}
            </div>
            {phoneScript ? (
              <div className="max-h-[520px] overflow-y-auto pr-1">
                <PlaybookView
                  playbookKey="PHONE_SCRIPT"
                  structured={phoneScript.structured}
                  brandLabel={brandBusinessLabel}
                />
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-white/[0.08] p-3 text-xs text-white/50">
                Kein aktives Telefonskript hinterlegt. Pflege eines unter Vertrieb → Playbooks.
              </div>
            )}
          </div>
        </section>

        {/* MITTE: Live-Notizen */}
        <section className="space-y-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-wider text-white/45">Live-Notizen</div>
              <span className="text-[11px] text-white/40">Cmd/Strg + S speichert sofort</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <ToggleChip
                label="Ansprechpartner bestätigt"
                active={form.ansprechpartnerBestaetigt}
                onClick={() =>
                  setForm({ ...form, ansprechpartnerBestaetigt: !form.ansprechpartnerBestaetigt })
                }
              />
              <ToggleChip
                label="Entscheider"
                active={form.entscheider}
                onClick={() => setForm({ ...form, entscheider: !form.entscheider })}
              />
              <ToggleChip
                label="Unterlagen gewünscht"
                active={form.unterlagenGewuenscht}
                onClick={() =>
                  setForm({ ...form, unterlagenGewuenscht: !form.unterlagenGewuenscht })
                }
              />
              <InterestToggle
                value={form.interesse}
                onChange={(v) => setForm({ ...form, interesse: v })}
              />
            </div>

            <div className="mt-3">
              <Field label="Freie Notiz" hint="Zitate willkommen. Autosave alle 2 Sekunden.">
                <textarea
                  value={form.freieNotiz}
                  onChange={(e) => setForm({ ...form, freieNotiz: e.target.value })}
                  className={`${textareaClasses} min-h-[180px]`}
                  placeholder="Was wurde gesagt? Was ist wichtig?"
                  autoFocus
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Field label="Aktueller Bedarf angedeutet">
                <input
                  value={form.aktuellerBedarf}
                  onChange={(e) => setForm({ ...form, aktuellerBedarf: e.target.value })}
                  className={inputClasses}
                  placeholder="z. B. mehr Struktur bei Anfragen …"
                />
              </Field>
              <Field label="Problem genannt">
                <input
                  value={form.problem}
                  onChange={(e) => setForm({ ...form, problem: e.target.value })}
                  className={inputClasses}
                  placeholder="Konkret formuliert"
                />
              </Field>
              <Field label="Timing / Frist">
                <input
                  value={form.timing}
                  onChange={(e) => setForm({ ...form, timing: e.target.value })}
                  className={inputClasses}
                  placeholder="wenn genannt"
                />
              </Field>
              <Field label="Bestehender Anbieter">
                <input
                  value={form.bestehenderAnbieter}
                  onChange={(e) => setForm({ ...form, bestehenderAnbieter: e.target.value })}
                  className={inputClasses}
                  placeholder="wenn genannt"
                />
              </Field>
              <Field label="Rückrufwunsch">
                <input
                  value={form.rueckrufWunsch}
                  onChange={(e) => setForm({ ...form, rueckrufWunsch: e.target.value })}
                  className={inputClasses}
                  placeholder="z. B. Mi nach 14:00 …"
                />
              </Field>
              <Field label="Terminvorschlag">
                <input
                  value={form.termin}
                  onChange={(e) => setForm({ ...form, termin: e.target.value })}
                  className={inputClasses}
                  placeholder="z. B. Do 15:00 online …"
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Sonstige Erkenntnis">
                  <textarea
                    value={form.sonstiges}
                    onChange={(e) => setForm({ ...form, sonstiges: e.target.value })}
                    className={textareaClasses}
                    placeholder="Was wollen wir uns unbedingt merken?"
                  />
                </Field>
              </div>
            </div>
          </div>
        </section>

        {/* RECHTS: Kontaktergebnis + nächster Schritt */}
        <section className="space-y-3">
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/45">Kontaktergebnis</div>
            <select
              value={form.kontaktErgebnis}
              onChange={(e) =>
                setForm({ ...form, kontaktErgebnis: e.target.value as ContactOutcome | "" })
              }
              className={`mt-1 ${selectClasses}`}
            >
              <option value="">Noch offen</option>
              {(Object.keys(CONTACT_OUTCOME_LABEL) as ContactOutcome[]).map((c) => (
                <option key={c} value={c}>
                  {CONTACT_OUTCOME_LABEL[c]}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <div className="text-[11px] uppercase tracking-wider text-white/45">Nächster Schritt</div>
            <select
              value={form.nextAction}
              onChange={(e) => setForm({ ...form, nextAction: e.target.value as NextAction | "" })}
              className={`mt-1 ${selectClasses}`}
            >
              <option value="">— wählen —</option>
              {(Object.keys(NEXT_ACTION_LABEL) as NextAction[]).map((a) => (
                <option key={a} value={a}>
                  {NEXT_ACTION_LABEL[a]}
                </option>
              ))}
            </select>
            <div className="mt-3">
              <Field label="Fälligkeit">
                <input
                  type="datetime-local"
                  value={form.nextActionDueAt}
                  onChange={(e) => setForm({ ...form, nextActionDueAt: e.target.value })}
                  className={inputClasses}
                />
              </Field>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4 text-[13px] leading-relaxed text-white/70">
            <div className="mb-1 text-[11px] uppercase tracking-wider text-white/45">Erinnerung</div>
            <ul className="space-y-1.5">
              <li>· Kurz, natürlich, sympathisch — kein Sales-Pitch.</li>
              <li>· Nur echte, verifizierte Beobachtungen aussprechen.</li>
              <li>· Ziel ist Erkenntnis, nicht Verkauf.</li>
              <li>· Am Ende: Ergebnis eintragen + nächsten Schritt setzen.</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.015] p-4">
            <button
              type="button"
              onClick={() => setShowReview(true)}
              className={buttonPrimary}
              style={{ backgroundColor: accent, width: "100%" }}
            >
              Gespräch abschließen →
            </button>
            <div className="mt-2 text-[11px] text-white/40">
              Prüft alle Angaben in einer Zusammenfassung. Danach wird die Opportunity aktualisiert.
            </div>
          </div>
        </section>
      </div>

      {showReview && (
        <ReviewDialog
          form={form}
          company={company}
          contactName={primaryName || null}
          onCancel={() => setShowReview(false)}
          onConfirm={async () => {
            setShowReview(false);
            await finalize();
          }}
          accent={accent}
        />
      )}
    </FocusShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bausteine                                                                  */
/* -------------------------------------------------------------------------- */

function FocusShell({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 overflow-y-auto bg-[#050508] backdrop-blur-xl"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="mx-auto min-h-screen max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
        {children}
      </div>
    </div>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" | "error" }) {
  const map = {
    idle: { color: "#64748B", label: "Bereit" },
    saving: { color: "#F59E0B", label: "Speichert…" },
    saved: { color: "#22C55E", label: "Gespeichert" },
    error: { color: "#EF4444", label: "Fehler" },
  } as const;
  const cur = map[state];
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[11px] text-white/70">
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${state === "saving" ? "animate-pulse" : ""}`}
        style={{ background: cur.color }}
      />
      {cur.label}
    </div>
  );
}

function ToggleChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
        active
          ? "border-emerald-400/40 bg-emerald-400/[0.08] text-emerald-100"
          : "border-white/[0.06] bg-white/[0.02] text-white/70 hover:bg-white/[0.04]"
      }`}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border ${
            active ? "border-emerald-400/60 bg-emerald-400/40" : "border-white/[0.14]"
          }`}
        >
          {active ? "✓" : ""}
        </span>
        {label}
      </div>
    </button>
  );
}

function InterestToggle({
  value,
  onChange,
}: {
  value: Interest;
  onChange: (v: Interest) => void;
}) {
  const options: { key: Interest; label: string; color: string }[] = [
    { key: "positiv", label: "Interesse", color: "#22C55E" },
    { key: "neutral", label: "Neutral", color: "#94A3B8" },
    { key: "kein", label: "Kein Interesse", color: "#EF4444" },
  ];
  return (
    <div className="col-span-2 flex items-center gap-1 rounded-lg border border-white/[0.06] bg-white/[0.02] p-1">
      {options.map((o) => {
        const active = value === o.key;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(active ? null : o.key)}
            className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
              active ? "text-white" : "text-white/55 hover:text-white/85"
            }`}
            style={active ? { background: `${o.color}22`, color: o.color } : undefined}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function ReviewDialog({
  form,
  company,
  contactName,
  onCancel,
  onConfirm,
  accent,
}: {
  form: LiveCallForm;
  company: SalesCompany;
  contactName: string | null;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  accent: string;
}) {
  const lines: { k: string; v: string }[] = [
    { k: "Firma", v: company.name },
    { k: "Kontakt", v: contactName || "—" },
    { k: "Ergebnis", v: form.kontaktErgebnis ? CONTACT_OUTCOME_LABEL[form.kontaktErgebnis as ContactOutcome] : "Nicht gesetzt" },
    { k: "Nächster Schritt", v: form.nextAction ? NEXT_ACTION_LABEL[form.nextAction as NextAction] : "Nicht gesetzt" },
    { k: "Fällig", v: form.nextActionDueAt ? new Date(form.nextActionDueAt).toLocaleString("de-DE") : "—" },
    { k: "Aktueller Bedarf", v: form.aktuellerBedarf || "—" },
    { k: "Problem", v: form.problem || "—" },
    { k: "Timing", v: form.timing || "—" },
    { k: "Bestehender Anbieter", v: form.bestehenderAnbieter || "—" },
    { k: "Freie Notiz", v: form.freieNotiz || "—" },
    { k: "Sonstiges", v: form.sonstiges || "—" },
  ];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl border border-white/[0.08] bg-[#0a0a0c] p-6">
        <h3 className="text-lg font-semibold text-white">Gespräch abschließen — Zusammenfassung</h3>
        <p className="mt-1 text-sm text-white/60">
          Prüfe die Erkenntnisse. Nach der Bestätigung werden Ergebnis und nächster Schritt in die Opportunity übernommen.
        </p>
        <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-xl border border-white/[0.05]">
          <table className="w-full text-sm">
            <tbody>
              {lines.map((l, i) => (
                <tr key={l.k} className={i > 0 ? "border-t border-white/[0.04]" : ""}>
                  <td className="w-56 px-4 py-2 text-[11px] uppercase tracking-wider text-white/40">
                    {l.k}
                  </td>
                  <td className="px-4 py-2 text-white/85 whitespace-pre-wrap">{l.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onCancel} className={buttonSecondary}>
            Zurück ins Gespräch
          </button>
          <button
            onClick={() => void onConfirm()}
            className={buttonPrimary}
            style={{ backgroundColor: accent }}
          >
            Bestätigen & speichern
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Utility                                                                    */
/* -------------------------------------------------------------------------- */

function summarizeForBody(f: LiveCallForm, contact: SalesContact | null): string {
  const partner = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ")
    : "Unbekannter Ansprechpartner";
  const lines = [`Erstkontakt · ${partner}`];
  if (f.aktuellerBedarf) lines.push(`Bedarf: ${f.aktuellerBedarf}`);
  if (f.problem) lines.push(`Problem: ${f.problem}`);
  if (f.timing) lines.push(`Timing: ${f.timing}`);
  if (f.bestehenderAnbieter) lines.push(`Bestehender Anbieter: ${f.bestehenderAnbieter}`);
  if (f.termin) lines.push(`Termin: ${f.termin}`);
  if (f.rueckrufWunsch) lines.push(`Rückruf: ${f.rueckrufWunsch}`);
  if (f.sonstiges) lines.push(`Sonstiges: ${f.sonstiges}`);
  if (f.freieNotiz) lines.push("", f.freieNotiz);
  return lines.join("\n");
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
