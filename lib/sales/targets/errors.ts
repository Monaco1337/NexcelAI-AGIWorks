/**
 * Sales-Target Error-Taxonomy.
 *
 * Strukturierte Fehler statt „Something went wrong"-Strings. Jeder Fehler
 * hat einen stabilen Code, damit UI/Metrik/Support gezielt reagieren
 * können. Die Codes sind bewusst grob (nicht ein Code pro Zeile) — sie
 * müssen sich in der Praxis auf Tickets/Alerts übertragen lassen.
 *
 * Konvention: `TargetError` erhält immer `code` + optional `detail`
 * (menschenlesbar). Sensible Payloads (URLs mit Query, Provider-Bodies)
 * gehören NIE in `detail`.
 */

export type TargetErrorCode =
  /* Provider */
  | "PROVIDER_NOT_CONFIGURED"
  | "PROVIDER_RATE_LIMITED"
  | "PROVIDER_AUTH_FAILED"
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_INVALID_RESPONSE"
  /* Netzwerk / Ressourcen */
  | "DOMAIN_UNREACHABLE"
  | "SSRF_BLOCKED"
  | "REDIRECT_LOOP"
  | "CONTENT_TOO_LARGE"
  | "CONTENT_INVALID"
  | "PARSE_FAILED"
  /* Business / Data-Layer */
  | "ENTITY_CONFLICT"
  | "POSSIBLE_DUPLICATE"
  | "INSUFFICIENT_EVIDENCE"
  | "ENRICHMENT_TIMEOUT"
  | "ENRICHMENT_LOCKED"
  | "STALE_DATA_ONLY"
  | "SCORING_FAILED"
  | "PROMPT_INJECTION_DETECTED"
  | "VALIDATION_FAILED"
  /* Auth / Infrastruktur */
  | "AUTH_REQUIRED"
  | "AUTH_FORBIDDEN"
  | "DB_UNAVAILABLE"
  | "NOT_FOUND"
  | "VERSION_CONFLICT"
  | "INTERNAL";

export const TARGET_ERROR_MESSAGES: Record<TargetErrorCode, string> = {
  PROVIDER_NOT_CONFIGURED: "Provider ist nicht konfiguriert",
  PROVIDER_RATE_LIMITED: "Provider hat das Rate-Limit erreicht",
  PROVIDER_AUTH_FAILED: "Provider-Authentifizierung fehlgeschlagen",
  PROVIDER_TIMEOUT: "Provider-Timeout überschritten",
  PROVIDER_UNAVAILABLE: "Provider ist derzeit nicht erreichbar",
  PROVIDER_INVALID_RESPONSE: "Provider hat eine ungültige Antwort geliefert",
  DOMAIN_UNREACHABLE: "Domain ist nicht erreichbar",
  SSRF_BLOCKED: "Externer Aufruf durch SSRF-Guard blockiert",
  REDIRECT_LOOP: "Weiterleitungs-Schleife oder zu viele Weiterleitungen",
  CONTENT_TOO_LARGE: "Antwort überschreitet erlaubte Größe",
  CONTENT_INVALID: "Antwortinhalt ist ungültig",
  PARSE_FAILED: "Parsing der Antwort fehlgeschlagen",
  ENTITY_CONFLICT: "Konflikt bei Entity-Auflösung",
  POSSIBLE_DUPLICATE: "Möglicher Duplikat-Datensatz erkannt",
  INSUFFICIENT_EVIDENCE: "Nicht genug Belege für belastbare Aussage",
  ENRICHMENT_TIMEOUT: "Enrichment-Timeout überschritten",
  ENRICHMENT_LOCKED: "Enrichment läuft bereits für diesen Zielkunden",
  STALE_DATA_ONLY: "Nur stale Daten verfügbar (Aktualisierung noch im Cooldown)",
  SCORING_FAILED: "Score-Berechnung fehlgeschlagen",
  PROMPT_INJECTION_DETECTED: "Prompt-Injection im externen Inhalt erkannt",
  VALIDATION_FAILED: "Eingabe-Validierung fehlgeschlagen",
  AUTH_REQUIRED: "Authentifizierung erforderlich",
  AUTH_FORBIDDEN: "Kein ausreichender Zugriff",
  DB_UNAVAILABLE: "Datenbank ist nicht verfügbar",
  NOT_FOUND: "Datensatz nicht gefunden",
  VERSION_CONFLICT: "Version des Datensatzes wurde zwischenzeitlich geändert",
  INTERNAL: "Interner Fehler",
};

const RETRYABLE: Set<TargetErrorCode> = new Set([
  "PROVIDER_RATE_LIMITED",
  "PROVIDER_TIMEOUT",
  "PROVIDER_UNAVAILABLE",
  "DOMAIN_UNREACHABLE",
  "ENRICHMENT_TIMEOUT",
  "DB_UNAVAILABLE",
]);

export class TargetError extends Error {
  readonly code: TargetErrorCode;
  readonly httpStatus: number;
  readonly detail?: string;
  readonly correlationId?: string;

  constructor(
    code: TargetErrorCode,
    detail?: string,
    options?: { httpStatus?: number; correlationId?: string; cause?: unknown }
  ) {
    super(detail ?? TARGET_ERROR_MESSAGES[code]);
    this.name = "TargetError";
    this.code = code;
    this.detail = detail;
    this.correlationId = options?.correlationId;
    this.httpStatus = options?.httpStatus ?? defaultHttpStatus(code);
    if (options?.cause) {
      (this as { cause?: unknown }).cause = options.cause;
    }
  }

  toJson() {
    return {
      code: this.code,
      message: TARGET_ERROR_MESSAGES[this.code],
      detail: this.detail,
      correlationId: this.correlationId,
    };
  }

  isRetryable(): boolean {
    return RETRYABLE.has(this.code);
  }
}

export function isTargetError(err: unknown): err is TargetError {
  return err instanceof TargetError;
}

export function toTargetError(err: unknown, fallback: TargetErrorCode = "INTERNAL"): TargetError {
  if (isTargetError(err)) return err;
  if (err instanceof Error) return new TargetError(fallback, err.message, { cause: err });
  return new TargetError(fallback, String(err));
}

function defaultHttpStatus(code: TargetErrorCode): number {
  switch (code) {
    case "AUTH_REQUIRED":
      return 401;
    case "AUTH_FORBIDDEN":
      return 403;
    case "NOT_FOUND":
      return 404;
    case "VERSION_CONFLICT":
    case "ENTITY_CONFLICT":
    case "POSSIBLE_DUPLICATE":
    case "ENRICHMENT_LOCKED":
      return 409;
    case "VALIDATION_FAILED":
    case "CONTENT_INVALID":
      return 400;
    case "PROVIDER_RATE_LIMITED":
      return 429;
    case "SSRF_BLOCKED":
    case "PROMPT_INJECTION_DETECTED":
      return 422;
    case "DB_UNAVAILABLE":
    case "PROVIDER_UNAVAILABLE":
      return 503;
    case "PROVIDER_TIMEOUT":
    case "ENRICHMENT_TIMEOUT":
      return 504;
    default:
      return 500;
  }
}

/**
 * Trace/Correlation-ID pro Enrichment-Lauf. Deterministisch aus Zeit+Random,
 * aber ohne Krypto-Overhead. Der Zweck ist ausschließlich das Zusammenführen
 * von Log-Zeilen — kein Security-Token.
 */
export function newCorrelationId(prefix: string = "trc"): string {
  const time = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 36 ** 5).toString(36).padStart(5, "0");
  return `${prefix}_${time}_${rand}`;
}
