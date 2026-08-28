/**
 * AI-Guards: Halluzinations- und Prompt-Injection-Schutz.
 *
 *  - `sanitizeUntrustedInput`: erkennt und entschärft Kundeninhalte,
 *    die versuchen, System-Instructions zu überschreiben (Prompt Injection).
 *  - `parseJsonSafely`: robuste JSON-Extraktion, auch wenn das Modell
 *    Markdown-Code-Fences liefert.
 *  - `defaultReviewStatus`: entscheidet, ob ein Run ohne menschliche
 *    Prüfung freigegeben werden darf. Für alle Vertriebsflüsse V1:
 *    Nein — jeder Run muss `REVIEW_REQUIRED`.
 */

const INJECTION_MARKERS = [
  /ignore (all|previous|prior) (instructions|prompts)/i,
  /you are now/i,
  /pretend to be/i,
  /system prompt/i,
  /disregard (all|the) (rules|instructions)/i,
  /reveal (your|the) prompt/i,
];

const REDACTED_MARKER = "[[UNTRUSTED_INPUT]]";

export function sanitizeUntrustedInput(input: string, maxLen = 6000): string {
  let text = String(input ?? "");
  if (text.length > maxLen) text = text.slice(0, maxLen);
  for (const marker of INJECTION_MARKERS) {
    if (marker.test(text)) {
      text = text.replace(marker, `${REDACTED_MARKER}$&`);
    }
  }
  // Trennt harten Grenzmarker zum vorherigen System-Prompt.
  return `${REDACTED_MARKER}\n${text}\n${REDACTED_MARKER}`;
}

/** Rundes JSON aus möglichem Markdown-Fenced-Block extrahieren. */
export function parseJsonSafely<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  // Direktes JSON.
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    /* weiter */
  }
  // Fenced ```json … ```
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim()) as T;
    } catch {
      /* weiter */
    }
  }
  // Erstes {...} bis Ende extrahieren
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(trimmed.slice(first, last + 1)) as T;
    } catch {
      /* weiter */
    }
  }
  return null;
}

/** Standard: KEIN Run wird V1 automatisch freigegeben. */
export function defaultReviewStatus(): "REVIEW_REQUIRED" {
  return "REVIEW_REQUIRED";
}
