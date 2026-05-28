"use client";

import type { Dispatch } from "react";
import { useEffect, useRef } from "react";
import { CONTEXT_CONVERSATION } from "@/lib/systemanalyse/conversation-context";
import type { SystemanalyseAction, SystemanalyseState } from "@/lib/systemanalyse/types";
import { ConversationShell } from "./conversation/ConversationShell";
import { SelectableTile } from "./ui/SelectableTile";
import { LuxuryTextarea } from "./ui/LuxuryField";

type Props = {
  state: SystemanalyseState;
  dispatch: Dispatch<SystemanalyseAction>;
  accentRgb: string;
};

export function ContextConversation({ state, dispatch, accentRgb }: Props) {
  const anchorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    requestAnimationFrame(() => {
      anchorRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });
  }, [state.contextConvoIndex]);

  const idx = state.contextConvoIndex;
  const q = idx < 4 ? CONTEXT_CONVERSATION[idx] : null;
  const motionKey = idx >= 4 ? "review" : `ctx-${idx}-${q?.id ?? ""}`;

  return (
    <div ref={anchorRef} className="space-y-6">
      <ConversationShell motionKey={motionKey}>
        {q ? (
          <div className="space-y-5">
            <div>
              <h3
                className="text-lg font-medium tracking-tight text-white sm:text-xl"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
              >
                {q.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/52">{q.subtitle}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {q.options.map((opt) => (
                <SelectableTile
                  key={opt.id}
                  selected={false}
                  onClick={() =>
                    dispatch({ type: "CONTEXT_CONVO_SELECT", questionIndex: idx, optionId: opt.id })
                  }
                  hint={opt.hint}
                  accentRgb={accentRgb}
                  className="rounded-2xl py-4 sm:py-5"
                >
                  {opt.label}
                </SelectableTile>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h3
                className="text-lg font-medium tracking-tight text-white sm:text-xl"
                style={{ fontFamily: "var(--font-headline), system-ui, sans-serif" }}
              >
                Ihre Ausgangslage in eigenen Worten
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/52">
                Unten steht ein Vorschlag aus Ihren Antworten — bitte ergänzen oder anpassen, damit wir Sie
                richtig einordnen.
              </p>
            </div>
            <LuxuryTextarea
              id="situationNarrative"
              label="Kontext & Situation"
              value={state.situationNarrative}
              onChange={(v) => dispatch({ type: "PATCH", patch: { situationNarrative: v } })}
              placeholder="Ergänzen Sie Details, Zahlen oder Beispiele …"
              rows={8}
              required
              accentRgb={accentRgb}
              hint="Mindestens ein paar Sätze — je konkreter, desto präziser unsere Einordnung."
            />
          </div>
        )}
      </ConversationShell>

      {idx > 0 ? (
        <div className="flex justify-start pt-1">
          <button
            type="button"
            onClick={() => dispatch({ type: "CONTEXT_CONVO_BACK" })}
            className="rounded-xl px-4 py-2.5 text-sm font-medium text-white/45 transition-colors hover:text-white/80"
          >
            Zurück zur vorherigen Frage
          </button>
        </div>
      ) : null}
    </div>
  );
}
