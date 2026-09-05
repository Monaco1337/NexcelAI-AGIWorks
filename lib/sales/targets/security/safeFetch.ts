/**
 * safeFetch — SSRF-, Size- und Timeout-abgesicherter Fetch für externe
 * Websites im Zielkunden-Audit.
 *
 * Kernrestriktionen:
 *  - nur http:/https:
 *  - Hostname wird via DNS aufgelöst und darf keine private IP haben
 *  - Redirects werden manuell verfolgt (jede Sprung-URL erneut geprüft)
 *  - Content-Length + tatsächlich gelesene Bytes werden gecapt
 *  - Timeout via AbortController
 *  - Response-Body wird streaming gelesen, damit ein bösartiger Server
 *    keine unbegrenzten Mengen an Speicher belegen kann
 *
 * Vorsicht: `fetch()` selbst würde bei einem 301/302 automatisch folgen.
 * Für SSRF ist das gefährlich, weil ein initial „öffentlicher" Host auf
 * einen internen Host weiterleiten könnte. Wir setzen deshalb
 * `redirect: 'manual'` und implementieren den Redirect-Loop selbst.
 */

import { inspectUrlDeep } from "./ssrfGuard";
import { Agent, buildConnector, fetch as undiciFetch } from "undici";

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_MAX_BYTES = 2_500_000;
const DEFAULT_MAX_REDIRECTS = 4;
const DEFAULT_MAX_HEADER_BYTES = 32_768;
const DEFAULT_CONTENT_TYPES = ["text/html", "application/xhtml+xml"];
const DEFAULT_UA =
  "Mozilla/5.0 (compatible; NEXCEL-SalesIntel/1.0; +https://nexcel.ai/bot)";

export interface SafeFetchOptions {
  method?: "GET" | "HEAD" | "POST";
  body?: string;
  contentType?: string;
  accept?: string;
  timeoutMs?: number;
  maxBytes?: number;
  maxRedirects?: number;
  userAgent?: string;
  acceptLanguage?: string;
  allowedContentTypes?: string[];
  maxHeaderBytes?: number;
}

export interface SafeFetchResult {
  ok: boolean;
  url: string;
  finalUrl: string;
  redirectChain: string[];
  status: number;
  headers: Record<string, string>;
  bodyText: string;
  bytesRead: number;
  latencyMs: number;
  error?: string;
}

export async function safeFetch(rawUrl: string, options: SafeFetchOptions = {}): Promise<SafeFetchResult> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const userAgent = options.userAgent ?? DEFAULT_UA;
  const acceptLanguage = options.acceptLanguage ?? "de-DE,de;q=0.9,en;q=0.6";
  const method = options.method ?? "GET";
  const allowedContentTypes = options.allowedContentTypes ?? DEFAULT_CONTENT_TYPES;
  const maxHeaderBytes = options.maxHeaderBytes ?? DEFAULT_MAX_HEADER_BYTES;

  const started = Date.now();
  const redirectChain: string[] = [];
  let currentUrl = rawUrl;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    const inspection = await inspectUrlDeep(currentUrl);
    if (!inspection.ok) {
      return {
        ok: false,
        url: rawUrl,
        finalUrl: currentUrl,
        redirectChain,
        status: 0,
        headers: {},
        bodyText: "",
        bytesRead: 0,
        latencyMs: Date.now() - started,
        error: `SSRF-blockiert: ${inspection.reason}`,
      };
    }

    const remainingMs = timeoutMs - (Date.now() - started);
    if (remainingMs <= 0) {
      return finishError(rawUrl, currentUrl, redirectChain, 0, `Timeout nach ${timeoutMs}ms`, started);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), remainingMs);
    const dispatcher = pinnedDispatcher(currentUrl, inspection.resolvedIp!);
    let response: Awaited<ReturnType<typeof undiciFetch>>;
    try {
      response = await undiciFetch(currentUrl, {
        method,
        redirect: "manual",
        signal: controller.signal,
        dispatcher,
        headers: {
          "User-Agent": userAgent,
          Accept: options.accept ?? "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.7",
          "Accept-Language": acceptLanguage,
          "Accept-Encoding": "identity",
          ...(options.contentType ? { "Content-Type": options.contentType } : {}),
        },
        body: method === "POST" ? options.body : undefined,
      });
    } catch (err) {
      clearTimeout(timer);
      await dispatcher.close();
      const isAbort = (err as Error).name === "AbortError";
      return {
        ok: false,
        url: rawUrl,
        finalUrl: currentUrl,
        redirectChain,
        status: 0,
        headers: {},
        bodyText: "",
        bytesRead: 0,
        latencyMs: Date.now() - started,
        error: isAbort ? `Timeout nach ${timeoutMs}ms` : `Fetch-Fehler: ${(err as Error).message}`,
      };
    }
    clearTimeout(timer);

    // Redirect selbst verfolgen (max. maxRedirects Sprünge).
    if ([301, 302, 303, 307, 308].includes(response.status)) {
      const location = response.headers.get("location");
      if (!location) {
        await dispatcher.close();
        return finishError(rawUrl, currentUrl, redirectChain, response.status, "Redirect ohne Location", started);
      }
      let nextUrl: string;
      try {
        nextUrl = new URL(location, currentUrl).toString();
      } catch {
        await dispatcher.close();
        return finishError(rawUrl, currentUrl, redirectChain, response.status, "Ungültige Redirect-URL", started);
      }
      await response.body?.cancel().catch(() => undefined);
      await dispatcher.close();
      redirectChain.push(nextUrl);
      currentUrl = nextUrl;
      if (hop === maxRedirects) {
        return finishError(rawUrl, currentUrl, redirectChain, response.status, "Zu viele Redirects", started);
      }
      continue;
    }

    const contentLengthRaw = response.headers.get("content-length");
    const contentLength = contentLengthRaw ? parseInt(contentLengthRaw, 10) : NaN;
    if (Number.isFinite(contentLength) && contentLength > maxBytes) {
      response.body?.cancel().catch(() => undefined);
      await dispatcher.close();
      return finishError(rawUrl, currentUrl, redirectChain, response.status, `Content zu groß (${contentLength} B)`, started);
    }
    const headerBytes = Array.from(response.headers.entries()).reduce(
      (total, [key, value]) => total + Buffer.byteLength(key) + Buffer.byteLength(value) + 4,
      0,
    );
    if (headerBytes > maxHeaderBytes) {
      response.body?.cancel().catch(() => undefined);
      await dispatcher.close();
      return finishError(rawUrl, currentUrl, redirectChain, response.status, "Response-Header zu groß", started);
    }
    const contentType = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase() ?? "";
    if (method !== "HEAD" && !allowedContentTypes.includes(contentType)) {
      response.body?.cancel().catch(() => undefined);
      await dispatcher.close();
      return finishError(
        rawUrl,
        currentUrl,
        redirectChain,
        response.status,
        `Nicht erlaubter Content-Type: ${contentType || "fehlend"}`,
        started,
      );
    }
    const contentEncoding = response.headers.get("content-encoding")?.trim().toLowerCase();
    if (contentEncoding && contentEncoding !== "identity") {
      response.body?.cancel().catch(() => undefined);
      await dispatcher.close();
      return finishError(rawUrl, currentUrl, redirectChain, response.status, "Komprimierte Antwort abgelehnt", started);
    }

    // Body streaming lesen mit hartem Cap
    let bytesRead = 0;
    let bodyText = "";
    if (method !== "HEAD" && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8", { fatal: false });
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (!value) continue;
          bytesRead += value.byteLength;
          if (bytesRead > maxBytes) {
            reader.cancel().catch(() => undefined);
            await dispatcher.close();
            return finishError(rawUrl, currentUrl, redirectChain, response.status, "Content zu groß", started);
          }
          bodyText += decoder.decode(value, { stream: true });
        }
      } catch (err) {
        reader.releaseLock();
        await dispatcher.close();
        return finishError(rawUrl, currentUrl, redirectChain, response.status, `Body-Fehler: ${(err as Error).message}`, started);
      }
      try {
        bodyText += decoder.decode();
      } catch {
        /* ignore */
      }
    }

    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key.toLowerCase()] = value;
    });
    await dispatcher.close();

    return {
      ok: response.status >= 200 && response.status < 400,
      url: rawUrl,
      finalUrl: currentUrl,
      redirectChain,
      status: response.status,
      headers,
      bodyText,
      bytesRead,
      latencyMs: Date.now() - started,
    };
  }

  return finishError(rawUrl, currentUrl, redirectChain, 0, "Redirect-Limit überschritten", started);
}

function pinnedDispatcher(rawUrl: string, resolvedIp: string): Agent {
  const target = pinnedConnectionTarget(rawUrl, resolvedIp);
  const connect = buildConnector({});
  return new Agent({
    connect(options, callback) {
      connect(
        {
          ...options,
          ...target,
        },
        callback,
      );
    },
  });
}

export function pinnedConnectionTarget(
  rawUrl: string,
  resolvedIp: string,
): { hostname: string; host: string; servername: string } {
  return {
    hostname: resolvedIp,
    host: resolvedIp,
    servername: new URL(rawUrl).hostname,
  };
}

function finishError(
  url: string,
  finalUrl: string,
  redirectChain: string[],
  status: number,
  error: string,
  startedAt = Date.now(),
): SafeFetchResult {
  return {
    ok: false,
    url,
    finalUrl,
    redirectChain,
    status,
    headers: {},
    bodyText: "",
    bytesRead: 0,
    latencyMs: Date.now() - startedAt,
    error,
  };
}

export function normalizeUrl(raw: string, base?: string): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withScheme, base);
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function extractDomain(url: string | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}
