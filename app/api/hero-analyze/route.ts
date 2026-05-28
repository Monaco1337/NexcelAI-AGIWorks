import { NextRequest, NextResponse } from "next/server";
import { ollamaGenerate, ollamaInfo, parseJsonLoose } from "@/lib/ollama";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * Hero High-End-Analyzer — komplett lokal über Ollama.
 *
 * POST { url?: string, screenshot?: string (data URL), notes?: string }
 *
 * Antwort:
 *   - companySnapshot      kurzer Profil-Summary
 *   - websiteFindings[]    konkrete Schwächen mit severity + fix
 *   - quickWins[]          priorisierte Sofort-Optimierungen
 *   - currentStack         erkannte Tools/CRM/ERP/Frameworks
 *   - missingSystems[]     was fehlt für Skalierung
 *   - blueprint            empfohlenes "besseres" System (modular)
 *   - score                {ux, performance, conversion, trust, overall}
 */

interface AnalyzeRequest {
  url?: string;
  screenshot?: string;
  notes?: string;
}

interface SiteFetchResult {
  ok: boolean;
  status: number;
  finalUrl: string;
  htmlSnippet: string;
  textSnippet: string;
  title: string;
  metaDescription: string;
  detected: {
    cms: string[];
    frameworks: string[];
    analytics: string[];
    crm: string[];
    erp: string[];
    ecommerce: string[];
    marketing: string[];
    payments: string[];
  };
  headers: Record<string, string>;
  fetchedInMs: number;
  bytes: number;
  error?: string;
}

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_0) AppleWebKit/605.1.15 (KHTML, like Gecko) NEXCEL-AI-Analyzer/1.0 Safari/605.1.15";

function safeUrl(input?: string): URL | null {
  if (!input) return null;
  try {
    const trimmed = input.trim();
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const u = new URL(withProto);
    if (!/^https?:$/.test(u.protocol)) return null;
    return u;
  } catch {
    return null;
  }
}

async function fetchSite(url: URL): Promise<SiteFetchResult> {
  const t0 = Date.now();
  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": UA, Accept: "text/html,*/*" },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v;
    });

    const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || "")
      .trim()
      .slice(0, 220);
    const metaDescription = (
      html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i)?.[1] ||
      ""
    ).trim();

    const lower = html.toLowerCase();
    const has = (...needles: string[]) => needles.some((n) => lower.includes(n));

    const detected = {
      cms: [
        has("wp-content", "wp-includes", "/wp-json/") && "WordPress",
        has("cdn.shopify.com", "shopify.com/cdn") && "Shopify",
        has("wix.com", "static.wixstatic.com") && "Wix",
        has("squarespace.com") && "Squarespace",
        has("typo3") && "TYPO3",
        has("drupal-settings-json", "/sites/all/themes/") && "Drupal",
        has("joomla") && "Joomla",
        has("webflow.com") && "Webflow",
        has("ghost-version", "ghost.io") && "Ghost",
        has("contentful.com") && "Contentful",
        has("storyblok.com") && "Storyblok",
        has("sanity.io") && "Sanity",
      ].filter(Boolean) as string[],
      frameworks: [
        has("__next_data__", "/_next/static/") && "Next.js",
        has("__nuxt__", "/_nuxt/") && "Nuxt",
        has("data-reactroot", "react-dom") && "React",
        has("ng-version", "ng-app") && "Angular",
        has("data-server-rendered=\"true\"", "vue.runtime") && "Vue",
        has("svelte-") && "Svelte",
        has("astro-island", "astro:scripts") && "Astro",
        has("turbo-frame", "data-turbo") && "Hotwire/Turbo",
        has("livewire:") && "Laravel Livewire",
      ].filter(Boolean) as string[],
      analytics: [
        has("googletagmanager.com/gtm.js", "gtag/js") && "Google Tag Manager / GA4",
        has("analytics.tiktok.com") && "TikTok Pixel",
        has("connect.facebook.net") && "Meta Pixel",
        has("static.hotjar.com", "hotjar.com/c/hotjar") && "Hotjar",
        has("cdn.matomo.cloud", "matomo.js") && "Matomo",
        has("plausible.io/js") && "Plausible",
        has("cdn.amplitude.com") && "Amplitude",
        has("cdn.mxpnl.com") && "Mixpanel",
        has("cdn.segment.com") && "Segment",
      ].filter(Boolean) as string[],
      crm: [
        has("hs-scripts.com", "hubspot.com/forms") && "HubSpot",
        has("salesforce.com", "force.com") && "Salesforce",
        has("pipedriveassets.com") && "Pipedrive",
        has("zoho.com/crm") && "Zoho CRM",
        has("intercom.io", "widget.intercom.io") && "Intercom",
        has("zopim.com", "zdassets.com") && "Zendesk",
        has("freshchat.com", "freshworks.com") && "Freshworks",
        has("crisp.chat") && "Crisp",
      ].filter(Boolean) as string[],
      erp: [
        has("sap.com", "/sap/") && "SAP",
        has("odoo.com") && "Odoo",
        has("netsuite.com") && "Oracle NetSuite",
        has("sage.com") && "Sage",
        has("microsoft.com/dynamics", "dynamics.com") && "Microsoft Dynamics 365",
        has("weclapp.com") && "Weclapp",
        has("xentral") && "Xentral",
      ].filter(Boolean) as string[],
      ecommerce: [
        has("cdn.shopify.com") && "Shopify",
        has("woocommerce") && "WooCommerce",
        has("magento") && "Magento",
        has("shopware") && "Shopware",
        has("bigcommerce.com") && "BigCommerce",
        has("commercetools") && "commercetools",
      ].filter(Boolean) as string[],
      marketing: [
        has("klaviyo.com") && "Klaviyo",
        has("mailchimp.com", "list-manage.com") && "Mailchimp",
        has("activecampaign.com") && "ActiveCampaign",
        has("brevo.com", "sendinblue.com") && "Brevo",
        has("getresponse.com") && "GetResponse",
        has("brevo.com") && "Brevo",
      ].filter(Boolean) as string[],
      payments: [
        has("js.stripe.com", "stripe.network") && "Stripe",
        has("paypalobjects.com", "paypal.com/sdk") && "PayPal",
        has("klarna.com") && "Klarna",
        has("adyen.com") && "Adyen",
      ].filter(Boolean) as string[],
    };

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4500);

    return {
      ok: res.ok,
      status: res.status,
      finalUrl: res.url || url.toString(),
      htmlSnippet: html.slice(0, 6000),
      textSnippet: text,
      title,
      metaDescription,
      detected,
      headers,
      fetchedInMs: Date.now() - t0,
      bytes: html.length,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      finalUrl: url.toString(),
      htmlSnippet: "",
      textSnippet: "",
      title: "",
      metaDescription: "",
      detected: {
        cms: [],
        frameworks: [],
        analytics: [],
        crm: [],
        erp: [],
        ecommerce: [],
        marketing: [],
        payments: [],
      },
      headers: {},
      fetchedInMs: Date.now() - t0,
      bytes: 0,
      error: err instanceof Error ? err.message : "fetch failed",
    };
  }
}

/** Schneidet ggf. data:image/...;base64,XYZ → XYZ raus. */
function stripDataUrlPrefix(s?: string): string | null {
  if (!s) return null;
  const m = s.match(/^data:image\/(?:png|jpeg|jpg|webp);base64,(.+)$/i);
  if (!m) return null;
  if (m[1].length > 6_000_000) return null; // ~4.5 MB Bild
  return m[1];
}

const SYSTEM_PROMPT = `Du bist NEXCEL AI — ein Senior-Solution-Architect für mittelständische und Enterprise-Kunden im DACH-Raum.
Deine Aufgabe: aus minimalem Input (URL + ggf. Screenshot + ggf. Stichworten) das Unternehmen einschätzen,
die Webseite/Software diagnostizieren und ein konkretes BESSERES System-Blueprint vorschlagen.

Stil: präzise, sachlich, brand-passend (NEXCEL AI = High-End-OS, Enterprise-Niveau, Deutsch).
Niemals erfinden, woher Kennzahlen stammen. Wenn etwas nicht ableitbar ist: ehrlich sagen.

Antworte AUSSCHLIESSLICH mit gültigem JSON nach folgendem Schema (keine Kommentare, keine Markdown-Fences):

{
  "companySnapshot": {
    "industryGuess": string,
    "sizeGuess": "Solo" | "Klein" | "KMU" | "Mid-Market" | "Enterprise" | "Unbekannt",
    "valueProposition": string,
    "targetAudience": string
  },
  "websiteFindings": [
    { "area": "UX" | "Performance" | "SEO" | "Conversion" | "Vertrauen" | "Barrierefreiheit" | "Architektur",
      "issue": string, "severity": "low" | "medium" | "high" | "critical", "fix": string }
  ],
  "quickWins": [
    { "title": string, "impact": "low" | "medium" | "high", "effort": "low" | "medium" | "high", "why": string }
  ],
  "currentStack": {
    "cms": string[], "frameworks": string[], "crm": string[], "erp": string[],
    "analytics": string[], "marketing": string[], "payments": string[], "ecommerce": string[]
  },
  "missingSystems": [
    { "name": string, "category": "CRM" | "ERP" | "Analytics" | "Marketing-Automation" | "Datenplattform" | "Workflow-Automatisierung" | "KI-Layer" | "Sonstiges",
      "why": string }
  ],
  "blueprint": {
    "summary": string,
    "modules": [
      { "name": string, "purpose": string, "tech": string[], "integrations": string[] }
    ],
    "phases": [
      { "phase": string, "weeks": number, "deliverables": string[] }
    ]
  },
  "score": {
    "ux": number, "performance": number, "conversion": number, "trust": number, "overall": number
  }
}

Score-Werte sind Ganzzahlen 0-100. Halte Listen knapp (max 6 Einträge) und priorisiere Wirkung.`;

interface AnalysisJson {
  companySnapshot?: unknown;
  websiteFindings?: unknown;
  quickWins?: unknown;
  currentStack?: unknown;
  missingSystems?: unknown;
  blueprint?: unknown;
  score?: unknown;
}

export async function GET() {
  const info = await ollamaInfo();
  return NextResponse.json(info);
}

export async function POST(req: NextRequest) {
  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return NextResponse.json({ error: "Ungültiger Request-Body." }, { status: 400 });
  }

  const url = safeUrl(body.url);
  const screenshotB64 = stripDataUrlPrefix(body.screenshot);

  if (!url && !screenshotB64) {
    return NextResponse.json(
      { error: "Bitte URL oder Screenshot übermitteln." },
      { status: 400 },
    );
  }

  const info = await ollamaInfo();
  if (!info.reachable) {
    return NextResponse.json(
      {
        error:
          "Lokales KI-System (Ollama) nicht erreichbar. Bitte `ollama serve` starten und ein Modell ziehen (z. B. `ollama pull llama3.1:8b`).",
        ollama: info,
      },
      { status: 503 },
    );
  }

  const site = url ? await fetchSite(url) : null;

  // Modell-Auswahl: bei Screenshot bevorzugt Vision-Modell, wenn vorhanden.
  const wantsVision = !!screenshotB64;
  const candidates = info.models;
  const visionPreferred = info.visionModel;
  const textPreferred = info.defaultModel;

  const pick = (preferred: string, fallbackContains: string[]): string => {
    if (candidates.includes(preferred)) return preferred;
    const partial = candidates.find((m) =>
      fallbackContains.some((s) => m.toLowerCase().includes(s)),
    );
    return partial || candidates[0] || preferred;
  };

  const chosenModel = wantsVision
    ? pick(visionPreferred, ["llava", "vision", "qwen2-vl", "minicpm-v"])
    : pick(textPreferred, ["llama3.1", "llama3", "qwen", "mistral", "phi3"]);

  const briefing = {
    inputUrl: url?.toString() || null,
    notes: body.notes?.slice(0, 800) || null,
    site: site
      ? {
          ok: site.ok,
          status: site.status,
          finalUrl: site.finalUrl,
          title: site.title,
          metaDescription: site.metaDescription,
          fetchedInMs: site.fetchedInMs,
          bytes: site.bytes,
          headers: {
            server: site.headers["server"],
            "x-powered-by": site.headers["x-powered-by"],
            "content-type": site.headers["content-type"],
            "cache-control": site.headers["cache-control"],
            "strict-transport-security": site.headers["strict-transport-security"],
          },
          detected: site.detected,
          textSnippet: site.textSnippet,
        }
      : null,
    hasScreenshot: !!screenshotB64,
  };

  const prompt = `Hier ist das Briefing eines Interessenten. Erstelle eine ehrliche, hochwertige Diagnose
und einen konkreten Blueprint für ein besseres System.

BRIEFING (JSON):
${JSON.stringify(briefing, null, 2)}

Wichtig:
- Wenn "site.ok" false oder "detected"-Listen leer sind: ehrlich sagen, was nicht ableitbar war,
  und Annahmen klar als "Annahme" markieren.
- "currentStack" füllst du primär aus "site.detected" + plausibler Ergänzung.
- "blueprint.modules" muss konkret sein (z.B. CRM-Schicht mit HubSpot-Alternative, n8n-/Temporal-Workflow,
  Data-Layer mit Postgres + dbt, KI-Layer mit Ollama/Llama 3.1).
- Antworte ausschließlich als JSON gemäß Schema.`;

  let raw = "";
  let model = chosenModel;
  let durationMs = 0;
  try {
    const out = await ollamaGenerate({
      model: chosenModel,
      prompt,
      system: SYSTEM_PROMPT,
      images: screenshotB64 ? [screenshotB64] : undefined,
      format: "json",
      temperature: 0.35,
      numPredict: 1800,
    });
    raw = out.response;
    model = out.model;
    durationMs = out.totalDurationMs;
  } catch (err) {
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Lokale KI-Antwort fehlgeschlagen: ${err.message}`
            : "Lokale KI-Antwort fehlgeschlagen.",
      },
      { status: 500 },
    );
  }

  const parsed = parseJsonLoose<AnalysisJson>(raw);
  if (!parsed) {
    return NextResponse.json(
      {
        error: "Antwort der lokalen KI war nicht parsebar.",
        raw: raw.slice(0, 1200),
        model,
      },
      { status: 502 },
    );
  }

  return NextResponse.json({
    ok: true,
    model,
    durationMs,
    site: site
      ? {
          ok: site.ok,
          status: site.status,
          finalUrl: site.finalUrl,
          title: site.title,
          fetchedInMs: site.fetchedInMs,
          detected: site.detected,
        }
      : null,
    analysis: parsed,
  });
}
