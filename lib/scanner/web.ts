// Web analyzer — runs against fetched HTML + headers.
// Pure rule-engine. ~80 heuristics across SEO, perf, trust, security, UX.

import type {
  DetectedTech,
  FetchedHtml,
  Finding,
  ScanResult,
  ScoreBreakdown,
} from "./types";

/* ─── Tech-stack heuristics (Wappalyzer-style, light) ───────────── */

interface TechRule {
  category: string;
  name: string;
  test: (ctx: {
    html: string;
    headers: Record<string, string>;
    url: string;
  }) => number; // 0..1 confidence
}

const TECH_RULES: TechRule[] = [
  // CMS
  { category: "CMS", name: "WordPress", test: ({ html, headers }) => {
    let c = 0;
    if (/wp-content|wp-includes|wp-json/.test(html)) c += 0.7;
    if (headers["x-powered-by"]?.toLowerCase().includes("wordpress")) c += 0.3;
    if (/<meta[^>]+content="WordPress/i.test(html)) c += 0.3;
    return Math.min(1, c);
  }},
  { category: "CMS", name: "Webflow", test: ({ html }) =>
    /webflow\.com|data-wf-page|w-nav-overlay/i.test(html) ? 0.95 : 0 },
  { category: "CMS", name: "Shopify", test: ({ html, headers }) =>
    /cdn\.shopify\.com|shopify\.theme|Shopify\.theme/i.test(html) ||
    (headers["x-shopify-stage"] !== undefined ? 1 : 0) ? 0.95 : 0 },
  { category: "CMS", name: "Squarespace", test: ({ html }) =>
    /static1\.squarespace\.com|squarespace-cdn/i.test(html) ? 0.95 : 0 },
  { category: "CMS", name: "Wix", test: ({ html }) =>
    /static\.parastorage\.com|wix\.com\/_partials|X-Wix-Request-Id/i.test(html)
      ? 0.95
      : 0 },
  { category: "CMS", name: "Drupal", test: ({ html, headers }) =>
    /drupal-settings-json|sites\/all\/themes/i.test(html) ||
    headers["x-generator"]?.toLowerCase().includes("drupal") ? 0.9 : 0 },

  // Frameworks
  { category: "Framework", name: "Next.js", test: ({ html, headers }) => {
    let c = 0;
    if (/_next\/static|__NEXT_DATA__|next\/script/.test(html)) c += 0.9;
    if (headers["x-powered-by"]?.toLowerCase().includes("next")) c += 0.2;
    return Math.min(1, c);
  }},
  { category: "Framework", name: "React", test: ({ html }) =>
    /__reactContainer|data-reactroot|react-dom/i.test(html) ? 0.7 : 0 },
  { category: "Framework", name: "Vue/Nuxt", test: ({ html }) =>
    /__NUXT__|nuxt\/components|data-v-app/i.test(html) ? 0.85 : 0 },
  { category: "Framework", name: "Svelte/SvelteKit", test: ({ html }) =>
    /svelte-kit|__sveltekit/i.test(html) ? 0.9 : 0 },
  { category: "Framework", name: "Astro", test: ({ html }) =>
    /astro-island|data-astro/i.test(html) ? 0.9 : 0 },

  // Hosting
  { category: "Hosting", name: "Vercel", test: ({ headers }) =>
    headers["server"]?.toLowerCase().includes("vercel") ||
    headers["x-vercel-id"] ? 1 : 0 },
  { category: "Hosting", name: "Netlify", test: ({ headers }) =>
    headers["server"]?.toLowerCase().includes("netlify") ||
    headers["x-nf-request-id"] ? 1 : 0 },
  { category: "Hosting", name: "Cloudflare", test: ({ headers }) =>
    headers["server"]?.toLowerCase().includes("cloudflare") ||
    headers["cf-ray"] ? 1 : 0 },
  { category: "Hosting", name: "AWS Amplify/CloudFront", test: ({ headers }) =>
    headers["x-amz-cf-id"] || headers["x-amz-cf-pop"] ? 1 : 0 },

  // Analytics
  { category: "Analytics", name: "Google Analytics", test: ({ html }) =>
    /googletagmanager\.com\/gtag|gtag\(|google-analytics\.com\/analytics/.test(
      html,
    ) ? 0.95 : 0 },
  { category: "Analytics", name: "Plausible", test: ({ html }) =>
    /plausible\.io\/js/.test(html) ? 1 : 0 },
  { category: "Analytics", name: "Matomo", test: ({ html }) =>
    /matomo\.js|piwik\.js/.test(html) ? 1 : 0 },
  { category: "Analytics", name: "Hotjar", test: ({ html }) =>
    /static\.hotjar\.com/.test(html) ? 1 : 0 },
  { category: "Analytics", name: "Segment", test: ({ html }) =>
    /cdn\.segment\.com\/analytics\.js/.test(html) ? 1 : 0 },

  // Marketing
  { category: "Marketing", name: "HubSpot", test: ({ html }) =>
    /js\.hs-scripts\.com|hsforms\.net/.test(html) ? 1 : 0 },
  { category: "Marketing", name: "Mailchimp", test: ({ html }) =>
    /chimpstatic\.com|mc\.us\d+\.list-manage\.com/.test(html) ? 1 : 0 },
  { category: "Marketing", name: "ActiveCampaign", test: ({ html }) =>
    /activecampaign\.com|trackcmp\.net/.test(html) ? 1 : 0 },

  // Payments / E-Com
  { category: "Payments", name: "Stripe", test: ({ html }) =>
    /js\.stripe\.com|stripe\.com\/v3/.test(html) ? 1 : 0 },
  { category: "Payments", name: "PayPal", test: ({ html }) =>
    /paypal\.com\/sdk\/js/.test(html) ? 1 : 0 },
  { category: "E-Commerce", name: "WooCommerce", test: ({ html }) =>
    /woocommerce|wc-block/i.test(html) ? 0.85 : 0 },

  // CRM
  { category: "CRM", name: "Salesforce Web2Lead", test: ({ html }) =>
    /web_to_lead|salesforce\.com\/forms/i.test(html) ? 0.9 : 0 },
  { category: "CRM", name: "Pipedrive", test: ({ html }) =>
    /pipedrive\.com/i.test(html) ? 0.9 : 0 },

  // CDN/Fonts
  { category: "Fonts", name: "Google Fonts", test: ({ html }) =>
    /fonts\.googleapis\.com|fonts\.gstatic\.com/.test(html) ? 1 : 0 },
  { category: "Fonts", name: "Adobe Fonts (Typekit)", test: ({ html }) =>
    /use\.typekit\.net/.test(html) ? 1 : 0 },

  // Tag managers
  { category: "Tag Manager", name: "GTM", test: ({ html }) =>
    /googletagmanager\.com\/gtm\.js/.test(html) ? 1 : 0 },

  // Cookie banners
  { category: "Compliance", name: "Cookiebot", test: ({ html }) =>
    /consent\.cookiebot\.com/.test(html) ? 1 : 0 },
  { category: "Compliance", name: "OneTrust", test: ({ html }) =>
    /cdn\.cookielaw\.org|onetrust/i.test(html) ? 1 : 0 },
  { category: "Compliance", name: "Usercentrics", test: ({ html }) =>
    /app\.usercentrics\.eu/.test(html) ? 1 : 0 },
];

function detectTech(input: {
  html: string;
  headers: Record<string, string>;
  url: string;
}): DetectedTech[] {
  const out: DetectedTech[] = [];
  for (const r of TECH_RULES) {
    const conf = r.test(input);
    if (conf > 0.4) {
      out.push({ category: r.category, name: r.name, confidence: conf });
    }
  }
  return out;
}

/* ─── DOM/text helpers (regex-based, runs in browser & node) ──── */

function pickAttr(html: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}=["']([^"']+)["']`, "i");
  const m = html.match(re);
  return m ? m[1] : null;
}

function countMatches(html: string, re: RegExp): number {
  return (html.match(re) || []).length;
}

function extractTitle(html: string): string | null {
  const m = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return m ? m[1].trim() : null;
}

function extractMeta(html: string, name: string): string | null {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  return m ? m[1].trim() : null;
}

/* ─── Signal extraction (per-page individuality) ─────────────── */

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;|&amp;|&quot;|&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SiteSignals {
  lang: string;
  textBytes: number;
  wordCount: number;
  h1: string[];
  h2: string[];
  h3Count: number;
  hasPhone: boolean;
  phones: string[];
  hasEmail: boolean;
  hasWhatsapp: boolean;
  hasOnlineBooking: boolean;
  hasContactForm: boolean;
  hasNewsletter: boolean;
  hasReviews: boolean;
  reviewMentions: number;
  hasMap: boolean;
  hasOpeningHours: boolean;
  hasMultipleLocations: boolean;
  hasJobs: boolean;
  hasFaq: boolean;
  hasTeamPage: boolean;
  hasPricing: boolean;
  hasBlog: boolean;
  hasCookieBanner: boolean;
  hasChat: boolean;
  imgCount: number;
  videoEmbed: boolean;
  socialLinks: string[];
  industryHints: string[]; // matched keywords with location
  topNouns: string[]; // top frequent meaningful words for individuality
  brandWord: string; // best-guess brand/company name
}

const STOPWORDS = new Set(
  "der die das und oder aber nicht ist sind war waren ein eine einen einer eines im in auf für mit von zu zum zur den dem des wir uns unser unsere ihr ihre ihres euch sich sie es ich du man mehr alle alles auch noch nur sehr schon dabei dass weil wenn als wie was wer wo aus bei nach über unter vor durch ohne gegen heute morgen jetzt hier dort bitte info kontakt home start mehr lesen impressum datenschutz agb cookies cookie".split(
    /\s+/,
  ),
);

function topNouns(text: string, n = 12): string[] {
  const counts = new Map<string, number>();
  const words = text.toLowerCase().match(/[a-zäöüß][a-zäöüß-]{4,}/g) || [];
  for (const w of words) {
    if (STOPWORDS.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function detectBrandWord(title: string, h1: string[], host: string): string {
  if (h1[0] && h1[0].length < 60) return h1[0].split(/[|·–\-—:]/)[0].trim();
  if (title) {
    const cleaned = title.split(/[|·–\-—:]/)[0].trim();
    if (cleaned.length < 60) return cleaned;
  }
  return host.replace(/^www\./, "").split(".")[0];
}

function extractSignals(html: string, finalUrl: string): SiteSignals {
  const text = stripTags(html);
  const lower = text.toLowerCase();
  const langMatch = html.match(/<html[^>]+lang=["']([a-zA-Z-]+)["']/i);
  const lang = langMatch ? langMatch[1].toLowerCase() : "de";

  const h1: string[] = [];
  const h1re = /<h1[^>]*>([\s\S]*?)<\/h1>/gi;
  let m: RegExpExecArray | null;
  while ((m = h1re.exec(html)) !== null) {
    const t = stripTags(m[1]);
    if (t) h1.push(t.slice(0, 140));
    if (h1.length > 5) break;
  }
  const h2: string[] = [];
  const h2re = /<h2[^>]*>([\s\S]*?)<\/h2>/gi;
  while ((m = h2re.exec(html)) !== null) {
    const t = stripTags(m[1]);
    if (t) h2.push(t.slice(0, 140));
    if (h2.length > 12) break;
  }
  const h3Count = countMatches(html, /<h3\b/gi);

  // Contact channels
  const phoneMatches =
    html.match(/(?:tel:[+\d\s/().-]{5,}|(?:\+49|0)[\s/().-]?\d[\d\s/().-]{6,}\d)/gi) ||
    [];
  const phones = phoneMatches.slice(0, 3).map((p) => p.replace(/^tel:/i, "").trim());
  const hasPhone = phones.length > 0;
  const hasEmail = /mailto:|[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(html);
  const hasWhatsapp = /wa\.me|api\.whatsapp\.com|whatsapp:\/\//i.test(html) ||
    /whatsapp/i.test(text);
  const hasContactForm =
    /<form[^>]*>[\s\S]{0,1500}?(name|nachricht|message|anfrage|kontakt|email)/i.test(html);
  const hasOnlineBooking =
    /\b(online[\s-]?termin|online[\s-]?buch|jetzt[\s-]?buch|termin[\s-]?reservier|appointment|booking|terminbuchung)\b/i.test(
      lower,
    ) ||
    /calendly|cal\.com|salonkee|treatwell|terminland|samedi|doctolib|jameda|booksy|fresha|treatify/i.test(
      html,
    );
  const hasNewsletter = /(newsletter|mailchimp|sendinblue|brevo|cleverreach|abonnier)/i.test(
    html,
  );
  const reviewMentions = (
    lower.match(/\b(bewertung|google[\s-]?bewertung|trustpilot|proven[\s-]?expert|kundenstimme|kundenmeinung|testimonial|sterne|reviews?)\b/g) ||
    []
  ).length;
  const hasReviews = reviewMentions > 0;
  const hasMap = /google\.com\/maps|maps\.google|leaflet|openstreetmap/i.test(html);
  const hasOpeningHours = /(öffnungszeit|opening[\s-]?hours|montag|mo[-–]fr|geöffnet)/i.test(
    lower,
  );
  const hasMultipleLocations =
    (lower.match(/\b(standort|filiale|niederlassung|standorte|filialen)\b/g) || [])
      .length >= 2;
  const hasJobs = /(karriere|jobs|stellenangebote|bewerbung|wir suchen|werde teil)/i.test(
    lower,
  );
  const hasFaq = /(faq|häufige fragen|häufig gestellte|fragen[\s&-]+antworten)/i.test(
    lower,
  );
  const hasTeamPage = /(unser team|das team|über uns|mitarbeiter|kollegen)/i.test(lower);
  const hasPricing = /(preis|preise|pricing|kosten|tarif|paket|ab\s*\d+\s*[€$])/i.test(
    lower,
  );
  const hasBlog = /(blog|magazin|aktuelles|news|beiträge)/i.test(lower);
  const hasCookieBanner =
    /(cookiebot|onetrust|usercentrics|cookie[-\s]?banner|cookie[-\s]?consent|borlabs|complianz)/i.test(
      html,
    );
  const hasChat = /(intercom|hubspot[-\s]?chat|tidio|crisp|userlike|tawk\.to|zendesk[-\s]?chat|livechat)/i.test(
    html,
  );
  const imgCount = countMatches(html, /<img\b/gi);
  const videoEmbed = /youtube\.com\/embed|player\.vimeo\.com|<video\b/i.test(html);

  const socialLinks: string[] = [];
  const socMap: { rx: RegExp; name: string }[] = [
    { rx: /facebook\.com\//i, name: "Facebook" },
    { rx: /instagram\.com\//i, name: "Instagram" },
    { rx: /linkedin\.com\//i, name: "LinkedIn" },
    { rx: /tiktok\.com\//i, name: "TikTok" },
    { rx: /youtube\.com\/(?:c|channel|@)/i, name: "YouTube" },
    { rx: /twitter\.com\/|x\.com\//i, name: "X / Twitter" },
    { rx: /pinterest\.com\//i, name: "Pinterest" },
  ];
  for (const s of socMap) if (s.rx.test(html)) socialLinks.push(s.name);

  // Industry hints — collect matching keywords for richer downstream logic
  const INDUSTRY_KEYWORDS = [
    "beauty","kosmetik","wellness","spa","nagelstudio","friseur","salon","barber","brow","lash","makeup","massage",
    "immobilien","makler","exposé","wohnung","grundstück","haus[-\\s]kauf",
    "beratung","consulting","coach","strategie","unternehmensberat",
    "pflege","pflegedienst","ambulant","seniorenheim","betreuung","tagespflege","intensivpflege","altenpflege",
    "patient","klinik","praxis","therapie","reha","arzt","ärzt","zahnarzt","physio",
    "shop","warenkorb","bestellen","versand","produkt-katalog",
    "saas","software","app","platform",
    "agentur","kreativ","webdesign",
    "restaurant","bistro","café","cafe","speisekarte","reservier",
    "fitness","studio","personal[-\\s]trainer","gym","yoga","pilates",
    "auto","kfz","werkstatt","fahrzeug","leasing",
    "anwalt","kanzlei","rechtsanwalt","steuerberat","notar",
  ];
  const industryHints: string[] = [];
  for (const kw of INDUSTRY_KEYWORDS) {
    if (new RegExp("\\b" + kw + "\\b", "i").test(lower)) industryHints.push(kw);
  }

  let host = finalUrl;
  try {
    host = new URL(finalUrl).host;
  } catch { /* keep */ }

  return {
    lang,
    textBytes: text.length,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    h1,
    h2,
    h3Count,
    hasPhone,
    phones,
    hasEmail,
    hasWhatsapp,
    hasOnlineBooking,
    hasContactForm,
    hasNewsletter,
    hasReviews,
    reviewMentions,
    hasMap,
    hasOpeningHours,
    hasMultipleLocations,
    hasJobs,
    hasFaq,
    hasTeamPage,
    hasPricing,
    hasBlog,
    hasCookieBanner,
    hasChat,
    imgCount,
    videoEmbed,
    socialLinks,
    industryHints,
    topNouns: topNouns(text),
    brandWord: detectBrandWord(extractTitle(html) ?? "", h1, host),
  };
}

/* ─── Main analyzer ─────────────────────────────────────────────── */

export function analyzeWeb(fetched: FetchedHtml): ScanResult {
  const t0 = Date.now();
  const { html, headers, finalUrl, bytes } = fetched;
  const detected = detectTech({ html, headers, url: finalUrl });
  const signals = extractSignals(html, finalUrl);

  const findings: Finding[] = [];

  // SEO ---------------------------------------------------------
  const title = extractTitle(html);
  if (!title) {
    findings.push({
      id: "seo-no-title",
      area: "SEO",
      title: "Kein Title-Tag",
      detail: "Suchmaschinen können die Seite nicht eindeutig benennen.",
      severity: "high",
      fix: "Aussagekräftiges <title>…</title> mit Brand + Hauptnutzen einbauen.",
    });
  } else if (title.length < 25 || title.length > 65) {
    findings.push({
      id: "seo-title-length",
      area: "SEO",
      title: `Title-Länge nicht optimal (${title.length} Zeichen)`,
      detail: "Empfohlen: 25–65 Zeichen für volle Anzeige in Google.",
      severity: "medium",
      fix: "Title auf 50–60 Zeichen optimieren.",
    });
  }

  const desc = extractMeta(html, "description");
  if (!desc) {
    findings.push({
      id: "seo-no-desc",
      area: "SEO",
      title: "Keine Meta-Description",
      detail: "Google generiert dann automatisch — Klickrate sinkt.",
      severity: "medium",
      fix: "Klare Description (140–160 Zeichen) einbauen.",
    });
  } else if (desc.length < 70 || desc.length > 175) {
    findings.push({
      id: "seo-desc-length",
      area: "SEO",
      title: `Meta-Description-Länge ungewöhnlich (${desc.length})`,
      detail: "Optimal: 70–175 Zeichen.",
      severity: "low",
      fix: "Description auf 140–160 Zeichen kürzen/erweitern.",
    });
  }

  const ogTitle = extractMeta(html, "og:title");
  const ogImage = extractMeta(html, "og:image");
  if (!ogTitle || !ogImage) {
    findings.push({
      id: "seo-og-missing",
      area: "Social",
      title: "Open-Graph unvollständig",
      detail: `${!ogTitle ? "og:title fehlt" : ""}${
        !ogTitle && !ogImage ? " · " : ""
      }${!ogImage ? "og:image fehlt" : ""}`,
      severity: "medium",
      fix: "og:title, og:description, og:image mind. 1200×630 px setzen.",
    });
  }

  const h1Count = countMatches(html, /<h1\b/gi);
  if (h1Count === 0) {
    findings.push({
      id: "seo-no-h1",
      area: "SEO",
      title: "Keine H1-Überschrift",
      detail: "Hauptaussage nicht maschinenlesbar.",
      severity: "high",
      fix: "Genau eine prominente H1 mit Hauptnutzen einfügen.",
    });
  } else if (h1Count > 1) {
    findings.push({
      id: "seo-multi-h1",
      area: "SEO",
      title: `${h1Count} H1-Überschriften gefunden`,
      detail: "Best Practice: nur eine H1 pro Seite.",
      severity: "low",
    });
  }

  const canonical = pickAttr(html, "link[^>]*rel=\"canonical\"", "href");
  if (!canonical) {
    findings.push({
      id: "seo-no-canonical",
      area: "SEO",
      title: "Kein canonical-Link",
      detail: "Duplicate-Content-Risiko bei mehreren URL-Varianten.",
      severity: "low",
      fix: "<link rel=\"canonical\" href=\"…\"> in <head> setzen.",
    });
  }

  // Images / a11y ----------------------------------------------
  const imgTotal = countMatches(html, /<img\b/gi);
  const imgWithAlt = countMatches(html, /<img\b[^>]*\balt=["'][^"']*["']/gi);
  const imgWithoutAlt = imgTotal - imgWithAlt;
  if (imgTotal > 0 && imgWithoutAlt / imgTotal > 0.2) {
    findings.push({
      id: "a11y-alt",
      area: "Accessibility",
      title: `${imgWithoutAlt}/${imgTotal} Bilder ohne alt-Text`,
      detail: "Schlecht für Screen-Reader und SEO.",
      severity: "medium",
      fix: "Allen content-Bildern alt=\"…\" geben (dekorative: alt=\"\").",
    });
  }

  // Performance signals ----------------------------------------
  const sizeKB = Math.round(bytes / 1024);
  if (sizeKB > 800) {
    findings.push({
      id: "perf-html-size",
      area: "Performance",
      title: `HTML-Dokument ${sizeKB} KB groß`,
      detail: "Sehr großes Initial-HTML verzögert Time-to-First-Byte.",
      severity: sizeKB > 1500 ? "high" : "medium",
      fix: "Inline-Scripts/CSS auslagern, SSR-Output schlanker halten.",
    });
  }
  const scriptCount = countMatches(html, /<script\b/gi);
  if (scriptCount > 25) {
    findings.push({
      id: "perf-scripts",
      area: "Performance",
      title: `${scriptCount} <script>-Tags`,
      detail: "Viele Scripts blockieren Render-Pfad und JS-Parser.",
      severity: scriptCount > 40 ? "high" : "medium",
      fix: "Scripts bündeln, defer/async setzen, Third-Parties reduzieren.",
    });
  }
  const inlineStyleBytes = (html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [])
    .reduce((a, s) => a + s.length, 0);
  if (inlineStyleBytes > 80_000) {
    findings.push({
      id: "perf-inline-css",
      area: "Performance",
      title: `Inline-CSS sehr groß (${Math.round(inlineStyleBytes / 1024)} KB)`,
      detail: "Bremst FCP — externe CSS bevorzugen + critical-CSS extrahieren.",
      severity: "medium",
    });
  }

  // Security headers --------------------------------------------
  const sec: { header: string; severity: "high" | "medium" | "low" }[] = [
    { header: "strict-transport-security", severity: "high" },
    { header: "content-security-policy", severity: "medium" },
    { header: "x-frame-options", severity: "medium" },
    { header: "referrer-policy", severity: "low" },
    { header: "permissions-policy", severity: "low" },
  ];
  const missingHeaders: string[] = [];
  for (const s of sec) {
    if (!headers[s.header]) missingHeaders.push(s.header);
  }
  if (missingHeaders.length > 0) {
    findings.push({
      id: "sec-headers",
      area: "Security",
      title: `${missingHeaders.length} Sicherheits-Header fehlen`,
      detail: missingHeaders.join(" · "),
      severity: missingHeaders.length > 3 ? "high" : "medium",
      fix: "HSTS, CSP, X-Frame-Options, Referrer-Policy setzen.",
    });
  }

  // HTTPS --------------------------------------------------------
  if (!finalUrl.startsWith("https://")) {
    findings.push({
      id: "sec-no-https",
      area: "Security",
      title: "Keine HTTPS-Verschlüsselung",
      detail: "Browser warnen, Trust-Signal fehlt.",
      severity: "critical",
      fix: "TLS-Zertifikat (z. B. Let’s Encrypt) einrichten + erzwingen.",
    });
  }

  // Compliance / Trust ------------------------------------------
  const hasImpressum = /impressum/i.test(html);
  const hasPrivacy = /datenschutz|privacy/i.test(html);
  if (!hasImpressum) {
    findings.push({
      id: "trust-impressum",
      area: "Trust",
      title: "Kein Impressum erkennbar",
      detail: "DE-Pflicht. Verlinkung im Footer prüfen.",
      severity: "high",
    });
  }
  if (!hasPrivacy) {
    findings.push({
      id: "trust-privacy",
      area: "Trust",
      title: "Keine Datenschutzerklärung erkennbar",
      detail: "DSGVO-Pflicht.",
      severity: "high",
    });
  }

  // Conversion signals ------------------------------------------
  const ctaWords = countMatches(
    html,
    /\b(kontakt|anfrage|jetzt buchen|termin|demo|gratis|kostenlos|starten|loslegen|book|contact)\b/gi,
  );
  if (ctaWords < 2) {
    findings.push({
      id: "cvr-weak-cta",
      area: "Conversion",
      title: "Wenige Call-to-Action-Signale",
      detail: "Hauptnutzen + nächster Schritt sollten direkt erkennbar sein.",
      severity: "medium",
      fix: "Primary-CTA in Hero + Footer wiederholen.",
    });
  }

  // Channel/conversion signals — these drive individual diagnoses ----
  if (signals.hasPhone && !signals.hasOnlineBooking && !signals.hasContactForm) {
    findings.push({
      id: "cvr-only-phone",
      area: "Conversion",
      title: "Anfragen laufen ausschließlich übers Telefon",
      detail: "Kein Online-Termin, kein Kontaktformular — Interessenten ohne Telefon-Reflex springen ab.",
      severity: "high",
    });
  }
  if (!signals.hasOnlineBooking && /termin|buch|reservier|appointment/i.test(
    [signals.h1.join(" "), signals.h2.join(" ")].join(" "),
  )) {
    findings.push({
      id: "cvr-no-online-booking",
      area: "Conversion",
      title: "Termine werden beworben, aber nicht online gebucht",
      detail: "Interessenten müssen anrufen oder mailen — viele tun es nicht.",
      severity: "high",
    });
  }
  if (!signals.hasReviews) {
    findings.push({
      id: "trust-no-reviews",
      area: "Trust",
      title: "Bewertungen werden nicht sichtbar genutzt",
      detail: "Soziale Beweise sind das stärkste Vertrauenssignal — sie fehlen im Auftritt.",
      severity: "medium",
    });
  }
  if (!signals.hasFaq) {
    findings.push({
      id: "ux-no-faq",
      area: "Accessibility",
      title: "Keine FAQ erkennbar",
      detail: "Standardfragen werden ans Telefon delegiert statt online beantwortet.",
      severity: "low",
    });
  }
  if (signals.wordCount < 350) {
    findings.push({
      id: "ux-thin-content",
      area: "Conversion",
      title: "Sehr wenig Inhalt auf der Startseite",
      detail: `Nur ${signals.wordCount} Wörter — Besucher bekommen kaum Antworten.`,
      severity: "medium",
    });
  }
  if (!signals.hasOpeningHours && /salon|praxis|klinik|restaurant|studio|kanzlei|werkstatt/i.test(
    signals.industryHints.join(" "),
  )) {
    findings.push({
      id: "trust-no-hours",
      area: "Trust",
      title: "Keine Öffnungszeiten erkennbar",
      detail: "Service-Geschäft ohne Zeiten — Erreichbarkeit unklar.",
      severity: "medium",
    });
  }
  if (!signals.hasMap && /salon|praxis|klinik|werkstatt|studio|restaurant|kanzlei/i.test(
    signals.industryHints.join(" "),
  )) {
    findings.push({
      id: "trust-no-map",
      area: "Trust",
      title: "Kein Standort/Karte sichtbar",
      detail: "Lokale Auffindbarkeit erschwert.",
      severity: "low",
    });
  }
  if (!signals.hasJobs && signals.industryHints.some((h) => /pflege|salon|klinik|praxis|gastro|werkstatt/i.test(h))) {
    findings.push({
      id: "ops-no-careers",
      area: "Conversion",
      title: "Keine Karriere-Seite — Personal-Pipeline fehlt",
      detail: "Branchen mit Personal-Engpass brauchen aktive Bewerber-Funnels.",
      severity: "medium",
    });
  }
  if (signals.imgCount < 4) {
    findings.push({
      id: "ux-low-imagery",
      area: "Conversion",
      title: "Sehr wenig Bildmaterial",
      detail: "Vertrauen entsteht über echte Fotos von Team, Räumen, Ergebnissen.",
      severity: "low",
    });
  }
  if (signals.socialLinks.length === 0) {
    findings.push({
      id: "trust-no-social",
      area: "Trust",
      title: "Keine Social-Media-Verlinkung",
      detail: "Keine Möglichkeit für Besucher, der Marke außerhalb der Seite zu folgen.",
      severity: "low",
    });
  }

  // Score --------------------------------------------------------
  const score = computeScore(findings, detected, headers);
  const summary = buildSummary(finalUrl, score, findings, detected);
  const recommendations = pickRecommendations(findings).slice(0, 5);

  return {
    mode: "web",
    source: finalUrl,
    durationMs: Date.now() - t0,
    score,
    findings,
    detected,
    summary,
    recommendations,
    meta: {
      title: title ?? "",
      description: desc ?? "",
      htmlBytes: bytes,
      scriptCount,
      imgTotal,
      imgWithoutAlt,
      h1Count,
      hasHttps: finalUrl.startsWith("https://"),
      signals,
    },
  };
}

function severityWeight(s: Finding["severity"]): number {
  switch (s) {
    case "critical": return 18;
    case "high": return 10;
    case "medium": return 5;
    case "low": return 2;
    default: return 1;
  }
}

function computeScore(
  findings: Finding[],
  detected: DetectedTech[],
  headers: Record<string, string>,
): ScoreBreakdown {
  // Start from 100 per axis, subtract weighted findings.
  const axes = {
    ux: 100,
    performance: 100,
    conversion: 100,
    trust: 100,
    security: 100,
  };
  for (const f of findings) {
    const w = severityWeight(f.severity);
    if (f.area === "SEO" || f.area === "Accessibility") axes.ux -= w;
    if (f.area === "Performance") axes.performance -= w;
    if (f.area === "Conversion" || f.area === "Social") axes.conversion -= w;
    if (f.area === "Trust") axes.trust -= w;
    if (f.area === "Security") axes.security -= w;
  }
  // Bonus: modern stack (+) / fragile stack (−)
  const techNames = detected.map((d) => d.name);
  if (techNames.includes("Next.js") || techNames.includes("Astro")) {
    axes.performance += 4;
  }
  if (headers["cache-control"]) axes.performance += 2;
  if (headers["content-encoding"]?.includes("br")) axes.performance += 2;

  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const ux = clamp(axes.ux);
  const performance = clamp(axes.performance);
  const conversion = clamp(axes.conversion);
  const trust = clamp(axes.trust);
  const security = clamp(axes.security);
  const overall = clamp(
    ux * 0.22 +
      performance * 0.22 +
      conversion * 0.22 +
      trust * 0.17 +
      security * 0.17,
  );
  return { ux, performance, conversion, trust, security, overall };
}

function buildSummary(
  url: string,
  score: ScoreBreakdown,
  findings: Finding[],
  detected: DetectedTech[],
): string {
  const host = (() => {
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  })();
  const stack =
    detected
      .filter((d) => d.confidence >= 0.7)
      .map((d) => d.name)
      .slice(0, 4)
      .join(" · ") || "Stack nicht eindeutig erkennbar";
  const critical = findings.filter(
    (f) => f.severity === "critical" || f.severity === "high",
  ).length;
  return `${host} erreicht ${score.overall}/100. ${stack}. ${
    critical > 0
      ? `${critical} kritische bzw. hohe Befunde — behoben heben sie den Score deutlich.`
      : "Solide Basis — Optimierungspotenzial vor allem in Detailpunkten."
  }`;
}

function pickRecommendations(findings: Finding[]): string[] {
  const order: Finding["severity"][] = ["critical", "high", "medium", "low", "info"];
  const sorted = [...findings].sort(
    (a, b) => order.indexOf(a.severity) - order.indexOf(b.severity),
  );
  return sorted
    .filter((f) => f.fix)
    .map((f) => `${f.title} — ${f.fix}`);
}
