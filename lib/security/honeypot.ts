/**
 * Honeypot + optional timing bot-detection for public forms.
 *
 * The honeypot is a hidden field that real users never see or fill. Bots that
 * auto-fill every input will populate it → we can silently drop the submission.
 *
 * The (optional) timing check flags submissions that arrive impossibly fast
 * after the form rendered. It is OFF unless `renderedAt` + `minFillMs` are
 * supplied, to avoid false positives on legitimate fast users.
 *
 * Isomorphic (pure). The field NAME is shared with the client helper.
 */

/** Name of the hidden honeypot field. Looks plausible so bots fill it. */
export const HONEYPOT_FIELD = "company_website";
/** Name of the client-set render-timestamp field. */
export const HONEYPOT_TIME_FIELD = "form_rendered_at";
/** Default minimum plausible fill time. */
export const DEFAULT_MIN_FILL_MS = 1200;

export interface HoneypotInput {
  /** Value submitted in the honeypot field (must be empty for humans). */
  value?: unknown;
  /** Epoch ms when the form was rendered (client). */
  renderedAt?: number | null;
  /** Epoch ms when the form was submitted (defaults to now). */
  submittedAt?: number | null;
  /** Minimum plausible fill time; when > 0 enables the timing check. */
  minFillMs?: number;
}

export interface HoneypotResult {
  bot: boolean;
  reason?: "honeypot_filled" | "too_fast";
}

export function checkHoneypot(input: HoneypotInput): HoneypotResult {
  const { value, renderedAt, submittedAt, minFillMs = 0 } = input;

  if (typeof value === "string" && value.trim() !== "") {
    return { bot: true, reason: "honeypot_filled" };
  }
  if (value != null && typeof value !== "string") {
    // Any non-string, non-null value is unexpected from a real hidden input.
    return { bot: true, reason: "honeypot_filled" };
  }

  if (minFillMs > 0 && typeof renderedAt === "number" && renderedAt > 0) {
    const end = typeof submittedAt === "number" && submittedAt > 0 ? submittedAt : Date.now();
    if (end - renderedAt < minFillMs) {
      return { bot: true, reason: "too_fast" };
    }
  }

  return { bot: false };
}
