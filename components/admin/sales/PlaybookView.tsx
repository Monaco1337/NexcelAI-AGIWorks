"use client";

/**
 * Menschenlesbare Playbook-Darstellung.
 *
 * Rendert Playbooks je nach Key als hochwertige Business-UI:
 *   ICP                   → Kriterien + Scoring-Tabelle
 *   PHONE_SCRIPT          → Gesprächsabschnitte
 *   DISCOVERY_GUIDE       → Themen als Karten
 *   CLIENT_PREVIEW_STORY  → Storyline in Schritten
 *
 * Alles andere fällt auf ein sauberes Key/Value-Layout zurück.
 * Kein JSON in der operativen Ansicht.
 */

import type { ReactNode } from "react";

interface Props {
  playbookKey: string;
  structured: Record<string, unknown>;
  brandLabel?: string;
}

export default function PlaybookView({ playbookKey, structured, brandLabel }: Props) {
  switch (playbookKey) {
    case "ICP":
      return <IcpView data={structured} />;
    case "PHONE_SCRIPT":
      return <PhoneScriptView data={structured} brandLabel={brandLabel} />;
    case "DISCOVERY_GUIDE":
      return <DiscoveryGuideView data={structured} />;
    case "CLIENT_PREVIEW_STORY":
      return <ClientPreviewStoryView data={structured} />;
    default:
      return <FallbackView data={structured} />;
  }
}

/* -------------------------------------------------------------------------- */
/*  ICP                                                                        */
/* -------------------------------------------------------------------------- */

function IcpView({ data }: { data: Record<string, unknown> }) {
  const titel = str(data.titel) ?? "Ideal Customer Profile";
  const grundsatz = str(data.grundsatz);
  const merkmale = arr<string>(data.merkmale);
  const segmente = arr<string>(data.segmente);
  const scoring = data.scoring as
    | {
        maximum?: number;
        kriterien?: { name: string; max: number }[];
        klassifizierung?: { klasse: string; von: number; bis: number; label: string }[];
        regeln?: string[];
      }
    | undefined;

  return (
    <div className="space-y-6">
      <PlaybookHero title={titel} lead={grundsatz ?? undefined} />

      {segmente.length > 0 && (
        <PlaybookSection title="Zielsegmente" hint="Priorisierte Marktsegmente">
          <div className="flex flex-wrap gap-2">
            {segmente.map((s) => (
              <span
                key={s}
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-sm text-white/85"
              >
                {s}
              </span>
            ))}
          </div>
        </PlaybookSection>
      )}

      {merkmale.length > 0 && (
        <PlaybookSection title="Merkmale eines A-Kunden">
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {merkmale.map((m) => (
              <li
                key={m}
                className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-black/[0.15] px-3 py-2 text-sm text-white/85"
              >
                <span
                  className="mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full"
                  style={{ background: "#22C55E" }}
                />
                {m}
              </li>
            ))}
          </ul>
        </PlaybookSection>
      )}

      {scoring?.kriterien && scoring.kriterien.length > 0 && (
        <PlaybookSection
          title={`Scoring (max ${scoring.maximum ?? 100})`}
          hint="Gewichtung pro Kriterium"
        >
          <div className="overflow-hidden rounded-xl border border-white/[0.06]">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.03] text-[11px] uppercase tracking-wider text-white/45">
                <tr>
                  <th className="px-3 py-2 text-left">Kriterium</th>
                  <th className="px-3 py-2 text-right w-24">max</th>
                </tr>
              </thead>
              <tbody>
                {scoring.kriterien.map((k) => (
                  <tr key={k.name} className="border-t border-white/[0.05]">
                    <td className="px-3 py-2 text-white/85">{k.name}</td>
                    <td className="px-3 py-2 text-right text-white/70">{k.max}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </PlaybookSection>
      )}

      {scoring?.klassifizierung && scoring.klassifizierung.length > 0 && (
        <PlaybookSection title="Klassifizierung">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {scoring.klassifizierung.map((k) => (
              <div
                key={k.klasse}
                className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-lg font-semibold text-white">{k.klasse}</span>
                  <span className="text-[11px] text-white/40">{k.von}–{k.bis}</span>
                </div>
                <div className="mt-1 text-[11px] text-white/60">{k.label}</div>
              </div>
            ))}
          </div>
        </PlaybookSection>
      )}

      {scoring?.regeln && scoring.regeln.length > 0 && (
        <PlaybookSection title="Regeln">
          <ul className="space-y-1.5 text-sm text-white/80">
            {scoring.regeln.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-white/50" />
                {r}
              </li>
            ))}
          </ul>
        </PlaybookSection>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  PHONE_SCRIPT                                                               */
/* -------------------------------------------------------------------------- */

interface PhoneScriptData {
  titel?: unknown;
  grundhaltung?: unknown;
  ziel?: unknown;
  opener?: unknown;
  hook?: unknown;
  wennKundeFragtWasGenau?: unknown;
  abschluss?: unknown;
  absagen?: {
    keinInteresse?: unknown;
    keineZeit?: unknown;
    gesperrt?: unknown;
  };
}

function PhoneScriptView({
  data,
  brandLabel,
}: {
  data: Record<string, unknown>;
  brandLabel?: string;
}) {
  const d = data as PhoneScriptData;
  const titel = str(d.titel) ?? "Telefonskript — Erstkontakt";
  const grundhaltung = arr<string>(d.grundhaltung);
  const ziel = str(d.ziel);

  const opener = str(d.opener);
  const hook = str(d.hook);
  const wennKundeFragt = str(d.wennKundeFragtWasGenau);
  const abschluss = str(d.abschluss);
  const keinInteresse = str(d.absagen?.keinInteresse);
  const keineZeit = str(d.absagen?.keineZeit);
  const gesperrt = str(d.absagen?.gesperrt);

  const substitute = (text: string | null) =>
    text && brandLabel ? text.replace(/NEXCEL AI/g, brandLabel) : text;

  return (
    <div className="space-y-4">
      <PlaybookHero title={titel} lead={ziel ?? undefined} />

      {grundhaltung.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] uppercase tracking-wider text-white/45">
            Grundhaltung
          </span>
          {grundhaltung.map((g) => (
            <span
              key={g}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2 py-0.5 text-[11px] text-white/70"
            >
              {g}
            </span>
          ))}
        </div>
      )}

      <ScriptBlock label="Einstieg" text={substitute(opener)} tone="calm" />
      <ScriptBlock label="Hook" text={substitute(hook)} tone="accent" hint="Nur echte, verifizierte Beobachtung nennen — nichts erfinden." />
      <ScriptBlock label="Kurze Einordnung — Was genau?" text={substitute(wennKundeFragt)} tone="calm" />
      <ScriptBlock label="Terminziel" text={substitute(abschluss)} tone="calm" />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ScriptBlock label="Kein Interesse" text={keinInteresse} tone="muted" compact />
        <ScriptBlock label="Keine Zeit" text={keineZeit} tone="muted" compact />
        <ScriptBlock label="Abschluss" text={gesperrt} tone="muted" compact />
      </div>
    </div>
  );
}

function ScriptBlock({
  label,
  text,
  hint,
  tone,
  compact,
}: {
  label: string;
  text: string | null;
  hint?: string;
  tone: "calm" | "accent" | "muted";
  compact?: boolean;
}) {
  const border =
    tone === "accent"
      ? "border-white/[0.14]"
      : tone === "muted"
        ? "border-white/[0.05]"
        : "border-white/[0.08]";
  const bg =
    tone === "accent"
      ? "bg-white/[0.04]"
      : tone === "muted"
        ? "bg-black/[0.15]"
        : "bg-white/[0.02]";
  const size = compact ? "text-[13px]" : "text-[15px] leading-relaxed";
  return (
    <div className={`rounded-xl border ${border} ${bg} px-4 py-3`}>
      <div className="text-[11px] uppercase tracking-wider text-white/45">{label}</div>
      <div className={`mt-1 ${size} whitespace-pre-wrap text-white/90`}>
        {text || <span className="text-white/35">Kein Text hinterlegt.</span>}
      </div>
      {hint && <div className="mt-1 text-[11px] text-white/40">{hint}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  DISCOVERY_GUIDE                                                            */
/* -------------------------------------------------------------------------- */

function DiscoveryGuideView({ data }: { data: Record<string, unknown> }) {
  const titel = str(data.titel) ?? "Bedarfsgesprächs-Leitfaden";
  const themen = arr<string>(data.themen);
  const logik = arr<string>(data.logik);
  const mechanik = arr<string>(data.mechanik);

  return (
    <div className="space-y-5">
      <PlaybookHero title={titel} />

      {logik.length > 0 && (
        <PlaybookSection title="Gesprächslogik">
          <div className="flex flex-wrap items-center gap-2">
            {logik.map((l, i) => (
              <span key={l} className="flex items-center gap-2">
                <span className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[12px] uppercase tracking-wider text-white/75">
                  {l}
                </span>
                {i < logik.length - 1 && <span className="text-white/25">→</span>}
              </span>
            ))}
          </div>
        </PlaybookSection>
      )}

      {mechanik.length > 0 && (
        <PlaybookSection title="Beratungsmechanik" hint="Beobachtung → Frage → Kundenrealität">
          <div className="flex flex-wrap items-center gap-2">
            {mechanik.map((m, i) => (
              <span key={m} className="flex items-center gap-2">
                <span className="rounded-md bg-white/[0.05] px-2 py-1 text-[11px] uppercase tracking-wider text-white/60">
                  {m}
                </span>
                {i < mechanik.length - 1 && <span className="text-white/25">·</span>}
              </span>
            ))}
          </div>
        </PlaybookSection>
      )}

      {themen.length > 0 && (
        <PlaybookSection title={`Themenblöcke (${themen.length})`}>
          <ol className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {themen.map((t, i) => (
              <li
                key={t}
                className="flex items-start gap-2 rounded-lg border border-white/[0.05] bg-black/[0.15] px-3 py-2 text-sm text-white/85"
              >
                <span className="mt-0.5 inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-white/[0.06] text-[11px] font-semibold text-white/70">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ol>
        </PlaybookSection>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CLIENT_PREVIEW_STORY                                                       */
/* -------------------------------------------------------------------------- */

function ClientPreviewStoryView({ data }: { data: Record<string, unknown> }) {
  const titel = str(data.titel) ?? "Kundenvorschau — Storyline";
  const dauer = str(data.dauer);
  const folien = arr<{ nr: number; ziel: string }>(data.folien);
  const regeln = arr<string>(data.regeln);

  return (
    <div className="space-y-5">
      <PlaybookHero title={titel} lead={dauer ? `Dauer: ${dauer}` : undefined} />

      {folien.length > 0 && (
        <PlaybookSection title="Storyline">
          <ol className="space-y-2">
            {folien.map((f) => (
              <li
                key={f.nr}
                className="flex items-start gap-3 rounded-xl border border-white/[0.05] bg-black/[0.15] px-4 py-3"
              >
                <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.05] text-[12px] font-semibold text-white/85">
                  {f.nr}
                </span>
                <div className="text-sm text-white/85">{f.ziel}</div>
              </li>
            ))}
          </ol>
        </PlaybookSection>
      )}

      {regeln.length > 0 && (
        <PlaybookSection title="Regeln">
          <ul className="space-y-1.5 text-sm text-white/80">
            {regeln.map((r) => (
              <li key={r} className="flex items-start gap-2">
                <span className="mt-[7px] h-1 w-1 flex-shrink-0 rounded-full bg-white/50" />
                {r}
              </li>
            ))}
          </ul>
        </PlaybookSection>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Fallback                                                                   */
/* -------------------------------------------------------------------------- */

function FallbackView({ data }: { data: Record<string, unknown> }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <div className="text-sm text-white/45">Kein Inhalt hinterlegt.</div>;
  }
  return (
    <div className="space-y-3">
      {entries.map(([k, v]) => (
        <div key={k} className="rounded-xl border border-white/[0.05] bg-black/[0.15] px-4 py-3">
          <div className="text-[11px] uppercase tracking-wider text-white/40">{k}</div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-white/85">
            {typeof v === "string" ? v : JSON.stringify(v, null, 2)}
          </div>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Building blocks                                                            */
/* -------------------------------------------------------------------------- */

function PlaybookHero({ title, lead }: { title: string; lead?: string }) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      {lead && <p className="mt-1 text-sm text-white/60">{lead}</p>}
    </div>
  );
}

function PlaybookSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between">
        <h4 className="text-sm font-medium text-white/85">{title}</h4>
        {hint && <span className="text-[11px] text-white/40">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function str(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v : null;
}

function arr<T>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
