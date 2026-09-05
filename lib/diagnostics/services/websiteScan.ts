/**
 * NEXCEL AI · Diagnostik · websiteScanService
 *
 * Wrapper um lib/scanner/web.ts (vorhandene deterministische Web-Rule-Engine).
 * Holt das HTML server-seitig (mit SSRF-Schutz aus app/api/scanner/fetch/route.ts)
 * und gibt einen normalisierten `WebScanResult` zurück, der direkt in den
 * RuleContext der Diagnostik passt.
 *
 * Keine Heuristik wird hier neu erfunden — wir nutzen die bestehende, geprüfte
 * Engine. Das ist der einzige Service mit Outbound-Netzwerk-Zugriff.
 */

import { analyzeWeb } from "@/lib/scanner/web";
import type { FetchedHtml } from "@/lib/scanner/types";
import { normalizeUrl, safeFetch } from "@/lib/sales/targets/security/safeFetch";

export interface WebScanResult {
  ok: boolean;
  /** Roh-Eingabe (vom Nutzer eingegeben). */
  inputUrl: string;
  /** Tatsächlich erreichte URL nach Redirect. */
  finalUrl: string;
  statusCode: number;
  bytes: number;
  durationMs: number;
  headers: Record<string, string>;
  title: string | null;
  description: string | null;
  detectedStack: { category: string; name: string; confidence: number }[];
  /** Findings aus der Web-Rule-Engine. */
  webFindings: {
    id: string;
    area: string;
    title: string;
    detail: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
    fix?: string;
  }[];
  signals: {
    hasPhone: boolean;
    hasContactForm: boolean;
    hasOnlineBooking: boolean;
    hasNewsletter: boolean;
    hasReviews: boolean;
    hasChat: boolean;
    hasMap: boolean;
    hasOpeningHours: boolean;
    hasJobs: boolean;
    hasFaq: boolean;
    hasPricing: boolean;
    hasMultipleLocations: boolean;
    wordCount: number;
    socialLinks: string[];
    industryHints: string[];
    brandWord: string;
  };
  /** Nur gesetzt wenn nicht ok. */
  error?: string;
}

export async function scanWebsite(rawUrl: string): Promise<WebScanResult> {
  const t0 = Date.now();
  const urlStr = normalizeUrl(rawUrl);
  if (!urlStr) {
    return errorResult(rawUrl, "Leere URL");
  }

  try {
    const result = await safeFetch(urlStr, {
      timeoutMs: 12_000,
      maxBytes: 2_500_000,
      userAgent: "Mozilla/5.0 (compatible; NexcelDiagnostics/1.0; +https://nexcel.ai)",
    });
    if (!result.ok) return errorResult(rawUrl, result.error ?? `HTTP ${result.status}`);

    const fetched: FetchedHtml = {
      url: urlStr,
      finalUrl: result.finalUrl,
      status: result.status,
      headers: result.headers,
      html: result.bodyText,
      fetchedAt: Date.now(),
      bytes: result.bytesRead,
    };

    const scan = analyzeWeb(fetched);
    const meta = scan.meta as any;
    const signals = (meta?.signals ?? {}) as any;

    return {
      ok: result.ok,
      inputUrl: rawUrl,
      finalUrl: fetched.finalUrl,
      statusCode: result.status,
      bytes: result.bytesRead,
      durationMs: Date.now() - t0,
      headers: result.headers,
      title: meta?.title ?? null,
      description: meta?.description ?? null,
      detectedStack: scan.detected,
      webFindings: scan.findings,
      signals: {
        hasPhone: !!signals.hasPhone,
        hasContactForm: !!signals.hasContactForm,
        hasOnlineBooking: !!signals.hasOnlineBooking,
        hasNewsletter: !!signals.hasNewsletter,
        hasReviews: !!signals.hasReviews,
        hasChat: !!signals.hasChat,
        hasMap: !!signals.hasMap,
        hasOpeningHours: !!signals.hasOpeningHours,
        hasJobs: !!signals.hasJobs,
        hasFaq: !!signals.hasFaq,
        hasPricing: !!signals.hasPricing,
        hasMultipleLocations: !!signals.hasMultipleLocations,
        wordCount: Number(signals.wordCount ?? 0),
        socialLinks: Array.isArray(signals.socialLinks)
          ? signals.socialLinks
          : [],
        industryHints: Array.isArray(signals.industryHints)
          ? signals.industryHints
          : [],
        brandWord: String(signals.brandWord ?? ""),
      },
    };
  } catch (err) {
    return errorResult(
      rawUrl,
      err instanceof Error ? err.message : "Netzwerkfehler",
    );
  }
}

function errorResult(input: string, message: string): WebScanResult {
  return {
    ok: false,
    inputUrl: input,
    finalUrl: input,
    statusCode: 0,
    bytes: 0,
    durationMs: 0,
    headers: {},
    title: null,
    description: null,
    detectedStack: [],
    webFindings: [],
    signals: {
      hasPhone: false,
      hasContactForm: false,
      hasOnlineBooking: false,
      hasNewsletter: false,
      hasReviews: false,
      hasChat: false,
      hasMap: false,
      hasOpeningHours: false,
      hasJobs: false,
      hasFaq: false,
      hasPricing: false,
      hasMultipleLocations: false,
      wordCount: 0,
      socialLinks: [],
      industryHints: [],
      brandWord: "",
    },
    error: message,
  };
}
