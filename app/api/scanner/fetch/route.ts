// Server-side HTML fetcher for the on-device scanner.
// IMPORTANT: this is the ONLY server hop — we just resolve CORS by
// fetching the page on the server. No external AI APIs are called.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BYTES = 2_500_000; // 2.5 MB cap

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

export async function POST(req: NextRequest) {
  let url: string;
  try {
    const body = await req.json();
    url = String(body?.url || "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!url) return NextResponse.json({ error: "Missing url" }, { status: 400 });

  // Auto-prepend protocol
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return NextResponse.json({ error: "Ungültige URL" }, { status: 400 });
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return NextResponse.json({ error: "Nur http(s) erlaubt" }, { status: 400 });
  }
  if (isPrivateAddress(parsed.hostname)) {
    return NextResponse.json(
      { error: "Private/loopback Adressen sind blockiert" },
      { status: 400 },
    );
  }

  const t0 = Date.now();
  try {
    const ctrl = new AbortController();
    const timeout = setTimeout(() => ctrl.abort(), 12_000);
    const res = await fetch(parsed.toString(), {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; NexcelScanner/1.0; +https://nexcel.ai)",
        accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "de-DE,de;q=0.9,en;q=0.8",
      },
    });
    clearTimeout(timeout);

    // Limit body size
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
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

    return NextResponse.json({
      url,
      finalUrl: res.url,
      status: res.status,
      headers,
      html,
      bytes: totalLen,
      fetchedAt: Date.now(),
      durationMs: Date.now() - t0,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
