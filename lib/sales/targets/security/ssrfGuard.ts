/**
 * SSRF-Guard für Zielkunden-Enrichment.
 *
 * Das Modul stellt sicher, dass externe HTTP-Fetches ausschließlich
 * öffentliche IP-Adressen adressieren. Private/Reserved-Ranges,
 * Loopback, Link-Local und `file://`-URLs werden hart abgewiesen.
 *
 * Wir prüfen einerseits statisch die URL (Scheme, Hostname-Form),
 * andererseits die aufgelöste IP-Adresse via `dns.lookup()`.
 * Beide Prüfungen sind für einen wirksamen SSRF-Schutz nötig, weil
 * ansonsten ein DNS-Rebinding auf `127.0.0.1` möglich wäre.
 */

import { lookup as dnsLookup } from "node:dns/promises";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

const BLOCKED_HOSTNAME_PATTERNS = [
  /^localhost$/i,
  /^ip6-localhost$/i,
  /\.local$/i,
  /\.internal$/i,
  /\.lan$/i,
  /\.corp$/i,
  /\.home$/i,
];

export interface SsrfInspection {
  ok: boolean;
  reason?: string;
  resolvedIp?: string;
  ipFamily?: 4 | 6;
}

export function inspectUrl(rawUrl: string): { ok: boolean; url?: URL; reason?: string } {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return { ok: false, reason: "URL ist nicht parsebar" };
  }

  if (!ALLOWED_PROTOCOLS.has(url.protocol)) {
    return { ok: false, reason: `Ungültiges Protokoll: ${url.protocol}` };
  }

  if (url.username || url.password) {
    return { ok: false, reason: "URL darf keine Credentials enthalten" };
  }

  const hostname = url.hostname.toLowerCase();
  if (!hostname) {
    return { ok: false, reason: "URL ohne Hostname" };
  }

  for (const pattern of BLOCKED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      return { ok: false, reason: `Hostname blockiert: ${hostname}` };
    }
  }

  // IPv4- und IPv6-Literal direkt prüfen (Bypass-Versuche via IPs)
  if (isIpLiteral(hostname)) {
    const status = classifyIpString(hostname);
    if (!status.public) {
      return { ok: false, reason: status.reason ?? "Private IP" };
    }
  }

  return { ok: true, url };
}

type LookupAll = (
  hostname: string,
  options: { all: true; verbatim: true },
) => Promise<Array<{ address: string; family: number }>>;

export async function inspectUrlDeep(
  rawUrl: string,
  lookup: LookupAll = dnsLookup as LookupAll,
): Promise<SsrfInspection> {
  const shallow = inspectUrl(rawUrl);
  if (!shallow.ok || !shallow.url) {
    return { ok: false, reason: shallow.reason ?? "URL ungültig" };
  }

  const hostname = shallow.url.hostname;
  if (isIpLiteral(hostname)) {
    return { ok: true, resolvedIp: hostname };
  }

  try {
    const results = await lookup(hostname, { all: true, verbatim: true });
    if (results.length === 0) {
      return { ok: false, reason: "DNS-Lookup lieferte keine Adresse" };
    }
    for (const result of results) {
      const status = classifyIpString(result.address);
      if (!status.public) {
        return {
          ok: false,
          reason: status.reason ?? "Private/Reserved IP",
          resolvedIp: result.address,
          ipFamily: result.family as 4 | 6,
        };
      }
    }
    return {
      ok: true,
      resolvedIp: results[0].address,
      ipFamily: results[0].family as 4 | 6,
    };
  } catch (err) {
    return { ok: false, reason: `DNS-Lookup fehlgeschlagen: ${(err as Error).message}` };
  }
}

function isIpLiteral(host: string): boolean {
  // IPv4
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host)) return true;
  // IPv6 (grobe Erkennung)
  if (host.includes(":")) return true;
  return false;
}

interface IpClassification {
  public: boolean;
  reason?: string;
}

export function classifyIpString(ip: string): IpClassification {
  // Normalisierung:
  //  - Brackets von IPv6-URL-Literalen entfernen ("[::1]" → "::1")
  //  - IPv4-mapped IPv6 auf IPv4-Klassifikation umleiten (::ffff:127.0.0.1)
  let normalized = ip.trim();
  if (normalized.startsWith("[") && normalized.endsWith("]")) {
    normalized = normalized.slice(1, -1);
  }
  const mapped = normalized.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/i);
  if (mapped) {
    return classifyIpv4(mapped[1]);
  }

  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(normalized)) {
    return classifyIpv4(normalized);
  }
  if (normalized.includes(":")) {
    return classifyIpv6(normalized);
  }
  return { public: false, reason: "Unbekannte IP-Form" };
}

function classifyIpv4(ip: string): IpClassification {
  const parts = ip.split(".").map((n) => parseInt(n, 10));
  if (parts.length !== 4 || parts.some((n) => !Number.isFinite(n) || n < 0 || n > 255)) {
    return { public: false, reason: `Ungültige IPv4: ${ip}` };
  }
  const [a, b] = parts;
  if (a === 10) return { public: false, reason: "10.0.0.0/8 privat" };
  if (a === 127) return { public: false, reason: "127.0.0.0/8 Loopback" };
  if (a === 0) return { public: false, reason: "0.0.0.0/8 reserviert" };
  if (a === 169 && b === 254) return { public: false, reason: "169.254.0.0/16 Link-Local" };
  if (a === 172 && b >= 16 && b <= 31) return { public: false, reason: "172.16.0.0/12 privat" };
  if (a === 192 && b === 168) return { public: false, reason: "192.168.0.0/16 privat" };
  if (a === 100 && b >= 64 && b <= 127) return { public: false, reason: "100.64.0.0/10 CGNAT" };
  if (a >= 224) return { public: false, reason: "Multicast / reserviert" };
  return { public: true };
}

function classifyIpv6(ip: string): IpClassification {
  const bytes = parseIpv6Bytes(ip);
  if (!bytes) return { public: false, reason: `Ungültige IPv6: ${ip}` };
  const firstFifteenZero = bytes.slice(0, 15).every((byte) => byte === 0);
  if (bytes.every((byte) => byte === 0) || (firstFifteenZero && bytes[15] === 1)) {
    return { public: false, reason: "IPv6 Loopback/Unspecified" };
  }
  const mappedIpv4 =
    bytes.slice(0, 10).every((byte) => byte === 0) &&
    bytes[10] === 0xff &&
    bytes[11] === 0xff;
  const compatibleIpv4 = bytes.slice(0, 12).every((byte) => byte === 0);
  if (mappedIpv4 || compatibleIpv4) {
    return classifyIpv4(bytes.slice(12).join("."));
  }
  if (bytes[0] === 0xfe && (bytes[1] & 0xc0) === 0x80) {
    return { public: false, reason: "IPv6 Link-Local" };
  }
  if ((bytes[0] & 0xfe) === 0xfc) {
    return { public: false, reason: "IPv6 Unique-Local" };
  }
  if (bytes[0] === 0xff) return { public: false, reason: "IPv6 Multicast" };
  return { public: true };
}

function parseIpv6Bytes(input: string): number[] | null {
  const value = input.toLowerCase();
  if (!value || value.includes("%") || value.split("::").length > 2) return null;
  const dottedTail = value.match(/(\d{1,3}(?:\.\d{1,3}){3})$/)?.[1];
  let normalized = value;
  if (dottedTail) {
    const octets = dottedTail.split(".").map((part) => Number.parseInt(part, 10));
    if (octets.some((octet) => octet < 0 || octet > 255)) return null;
    normalized = value.slice(0, -dottedTail.length) +
      `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
  }
  const [leftRaw, rightRaw] = normalized.split("::");
  const left = leftRaw ? leftRaw.split(":").filter(Boolean) : [];
  const right = rightRaw ? rightRaw.split(":").filter(Boolean) : [];
  const hasCompression = normalized.includes("::");
  const missing = 8 - left.length - right.length;
  if ((!hasCompression && missing !== 0) || (hasCompression && missing < 1)) return null;
  const groups = [...left, ...Array(hasCompression ? missing : 0).fill("0"), ...right];
  if (groups.length !== 8) return null;
  const words = groups.map((group) => Number.parseInt(group, 16));
  if (words.some((word, index) =>
    !/^[0-9a-f]{1,4}$/.test(groups[index]) || !Number.isFinite(word) || word > 0xffff
  )) return null;
  return words.flatMap((word) => [word >> 8, word & 0xff]);
}
