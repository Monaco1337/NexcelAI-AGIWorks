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

const MAX_BYTES = 2_500_000;

function isPrivateAddress(host: string): boolean {
  return (
    host === "localhost" ||
    host.endsWith(".local") ||
    /^10\./.test(host) ||
    /^192\.168\./.test(host) ||
    /^127\./.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  );
}

export async function scanWebsite(rawUrl: string): Promise<WebScanResult> {
  const t0 = Date.now();
  let urlStr = rawUrl.trim();
  if (!urlStr) {
    return errorResult(rawUrl, "Leere URL");
  }
  if (!/^https?:\/\//i.test(urlStr)) urlStr = "https://" + urlStr;

  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    return errorResult(rawUrl, "Ungültige URL");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return errorResult(rawUrl, "Nur HTTP/HTTPS erlaubt");
  }
  if (isPrivateAddress(parsed.hostname)) {
    return errorResult(rawUrl, "Lokale Adressen sind blockiert");
  }

  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; NexcelDiagnostics/1.0; +https://nexcel.ai)",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timeout);

    // Body bytecount-cap
    const reader = res.body?.getReader();
    const chunks: Uint8Array[] = [];
    let received = 0;
    if (reader) {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (!value) continue;
        received += value.byteLength;
        if (received > MAX_BYTES) {
          await reader.cancel();
          break;
        }
        chunks.push(value);
      }
    }
    const totalLen = chunks.reduce((s, c) => s + c.byteLength, 0);
    const buf = new Uint8Array(totalLen);
    let off = 0;
    for (const c of chunks) {
      buf.set(c, off);
      off += c.byteLength;
    }
    const html = new TextDecoder("utf-8").decode(buf);

    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });

    const fetched: FetchedHtml = {
      url: urlStr,
      finalUrl: res.url || urlStr,
      status: res.status,
      headers,
      html,
      fetchedAt: Date.now(),
      bytes: totalLen,
    };

    const scan = analyzeWeb(fetched);
    const meta = scan.meta as any;
    const signals = (meta?.signals ?? {}) as any;

    return {
      ok: res.ok,
      inputUrl: rawUrl,
      finalUrl: fetched.finalUrl,
      statusCode: res.status,
      bytes: totalLen,
      durationMs: Date.now() - t0,
      headers,
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
