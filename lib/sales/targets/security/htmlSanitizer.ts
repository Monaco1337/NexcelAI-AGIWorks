/**
 * HTML → Text-Extraktion + Metadaten-Sanitizer für Website-Audit.
 *
 * Wir ziehen NUR das raus, was für die Analyse relevant ist:
 *  - Title, Meta-Description, Meta-Robots, Canonical
 *  - H1/H2/H3-Text
 *  - Link-Text und Href
 *  - Plain-Text-Body ohne <script>, <style>, <template>
 *
 * HTML wird nicht in einer echten DOM-Runtime geparst (kein jsdom-
 * Dependency), sondern durch defensive Regex + State-Machine. Für die
 * hier benötigten Signale reicht das und schafft kleines Bundle und
 * schnelle Analyse.
 */

interface StripResult {
  text: string;
  links: Array<{ href: string; text: string }>;
  metas: Record<string, string>;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  title: string | null;
  htmlAttrs: Record<string, string>;
  headHtml: string;
  bodyHtml: string;
  scriptSrcs: string[];
  linkTags: Array<{ rel: string; href: string; type?: string }>;
  images: Array<{ src: string; alt: string | null; loading?: string; width?: string; height?: string }>;
  forms: Array<{ action: string | null; method: string | null; inputs: number }>;
}

const NON_CONTENT_TAGS = ["script", "style", "template", "noscript"];

export function stripHtml(rawHtml: string): StripResult {
  const html = rawHtml || "";

  const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
  const bodyMatch = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i);
  const headHtml = headMatch ? headMatch[1] : html.slice(0, 8000);
  const bodyHtml = bodyMatch ? bodyMatch[1] : html;

  const htmlTag = html.match(/<html\b([^>]*)>/i);
  const htmlAttrs = htmlTag ? parseAttrs(htmlTag[1]) : {};

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? decodeEntities(titleMatch[1]).trim() : null;

  const metas: Record<string, string> = {};
  const metaRegex = /<meta\b([^>]+)>/gi;
  let mMatch: RegExpExecArray | null;
  while ((mMatch = metaRegex.exec(headHtml)) !== null) {
    const attrs = parseAttrs(mMatch[1]);
    const key = (attrs.name || attrs.property || attrs["http-equiv"] || "").toLowerCase();
    if (key && attrs.content) {
      metas[key] = decodeEntities(attrs.content).trim();
    }
  }

  const linkTags: Array<{ rel: string; href: string; type?: string }> = [];
  const linkRegex = /<link\b([^>]+)>/gi;
  let lMatch: RegExpExecArray | null;
  while ((lMatch = linkRegex.exec(headHtml)) !== null) {
    const attrs = parseAttrs(lMatch[1]);
    if (attrs.href) {
      linkTags.push({ rel: (attrs.rel || "").toLowerCase(), href: attrs.href, type: attrs.type });
    }
  }

  const scriptSrcs: string[] = [];
  const scriptRegex = /<script\b([^>]*)>/gi;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = scriptRegex.exec(html)) !== null) {
    const attrs = parseAttrs(sMatch[1]);
    if (attrs.src) scriptSrcs.push(attrs.src);
  }

  const headings = { h1: [] as string[], h2: [] as string[], h3: [] as string[] };
  for (const level of [1, 2, 3] as const) {
    const regex = new RegExp(`<h${level}\\b[^>]*>([\\s\\S]*?)</h${level}>`, "gi");
    let hMatch: RegExpExecArray | null;
    while ((hMatch = regex.exec(bodyHtml)) !== null) {
      const text = decodeEntities(stripTags(hMatch[1])).trim();
      if (text) headings[`h${level}` as "h1" | "h2" | "h3"].push(text);
    }
  }

  const links: Array<{ href: string; text: string }> = [];
  const linkAnchorRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let aMatch: RegExpExecArray | null;
  while ((aMatch = linkAnchorRegex.exec(bodyHtml)) !== null) {
    const attrs = parseAttrs(aMatch[1]);
    const href = attrs.href;
    if (!href) continue;
    const text = decodeEntities(stripTags(aMatch[2])).trim();
    links.push({ href, text });
    if (links.length > 400) break;
  }

  const images: Array<{ src: string; alt: string | null; loading?: string; width?: string; height?: string }> = [];
  const imgRegex = /<img\b([^>]+)>/gi;
  let imMatch: RegExpExecArray | null;
  while ((imMatch = imgRegex.exec(bodyHtml)) !== null) {
    const attrs = parseAttrs(imMatch[1]);
    if (attrs.src) {
      images.push({
        src: attrs.src,
        alt: attrs.alt ?? null,
        loading: attrs.loading,
        width: attrs.width,
        height: attrs.height,
      });
    }
    if (images.length > 200) break;
  }

  const forms: Array<{ action: string | null; method: string | null; inputs: number }> = [];
  const formRegex = /<form\b([^>]*)>([\s\S]*?)<\/form>/gi;
  let fMatch: RegExpExecArray | null;
  while ((fMatch = formRegex.exec(bodyHtml)) !== null) {
    const attrs = parseAttrs(fMatch[1]);
    const inputs = (fMatch[2].match(/<input\b/gi) || []).length +
      (fMatch[2].match(/<textarea\b/gi) || []).length +
      (fMatch[2].match(/<select\b/gi) || []).length;
    forms.push({ action: attrs.action ?? null, method: attrs.method ?? null, inputs });
  }

  let text = bodyHtml;
  for (const tag of NON_CONTENT_TAGS) {
    text = text.replace(new RegExp(`<${tag}\\b[\\s\\S]*?</${tag}>`, "gi"), " ");
  }
  text = decodeEntities(stripTags(text));
  text = text.replace(/\s+/g, " ").trim();

  return {
    text,
    links,
    metas,
    headings,
    title,
    htmlAttrs,
    headHtml,
    bodyHtml,
    scriptSrcs,
    linkTags,
    images,
    forms,
  };
}

export function parseAttrs(input: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const regex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s"'>=`]+)))?/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(input)) !== null) {
    const key = match[1].toLowerCase();
    const value = match[3] ?? match[4] ?? match[5] ?? "";
    attrs[key] = value;
  }
  return attrs;
}

export function stripTags(input: string): string {
  return input.replace(/<[^>]+>/g, " ");
}

export function decodeEntities(input: string): string {
  if (!input) return "";
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(parseInt(code, 16)));
}
