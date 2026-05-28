/**
 * NEXCEL AI · Diagnostik · analysisRules
 *
 * Deterministische Rule Engine. Keine KI darf hier Werte erfinden.
 * Jede Regel hat eine konkrete Bedingung, die gegen den `RuleContext` evaluiert,
 * und einen festen Score-Impact pro betroffener Achse.
 *
 * Der Output:  AnalysisFinding[] (ohne id/analysisId/createdAt — die werden später gesetzt).
 *
 * Regeln werden bewusst klein und einzeln gehalten, damit man sie A/B-vergleichen,
 * abschalten und auditieren kann. Jede Regel verweist auf die Quelle, von der ihre
 * Entscheidung abgeleitet wurde — dadurch wird die Diagnostik nachvollziehbar.
 */

import type {
  AnalysisFinding,
  FindingCategory,
  ScoreImpact,
  Severity,
} from "./types";

export interface RuleContext {
  /** Wenn keine Website gescannt wurde, ist `web` null. */
  web: {
    url: string;
    finalUrl: string;
    statusCode: number;
    bytes: number;
    headers: Record<string, string>;
    title: string | null;
    description: string | null;
    /** Erkannter Stack aus lib/scanner/web.ts */
    detectedStack: { category: string; name: string; confidence: number }[];
    /** Bereits berechnete Web-Findings (lib/scanner/web.ts Rule-Engine). */
    webFindings: {
      id: string;
      area: string;
      title: string;
      detail: string;
      severity: "info" | "low" | "medium" | "high" | "critical";
      fix?: string;
    }[];
    /** Aus lib/scanner/web SiteSignals — relevante Boolean-Signale. */
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
  } | null;
  /** Aggregierte Information über Uploads. */
  uploads: {
    count: number;
    totalBytes: number;
    /** Zusammengefasste Textinhalte aus PDFs/Excel/Text-Files — leerer String wenn nichts extrahierbar. */
    extractedText: string;
    /** Erkannte Tool-Namen im Upload-Text (Excel, Notion, WhatsApp, etc.) */
    toolMentions: string[];
    mimeTypes: string[];
  };
}

/** Eine Regel — return value `null` heißt „triggert nicht". */
export interface AnalysisRule {
  id: string;
  category: FindingCategory;
  /** Severity wenn die Regel triggert. */
  defaultSeverity: Severity;
  evaluate: (
    ctx: RuleContext,
  ) =>
    | { matched: false }
    | {
        matched: true;
        title: string;
        detail: string;
        source: string;
        scoreImpact: ScoreImpact;
        recommendation?: string;
        severity?: Severity;
      };
}

/* ────────────────────────────────────────────────────────────────────────
 *  TOOL-/STACK-MENTIONS — basis für Fragmentation & Automation-Erkennung
 *  ──────────────────────────────────────────────────────────────────── */

function stackNames(ctx: RuleContext): string[] {
  return ctx.web?.detectedStack.map((d) => d.name.toLowerCase()) ?? [];
}
function hasCategory(ctx: RuleContext, category: string): boolean {
  return (
    ctx.web?.detectedStack.some(
      (d) => d.category.toLowerCase() === category.toLowerCase(),
    ) ?? false
  );
}
function uploadHas(ctx: RuleContext, ...needles: string[]): boolean {
  const haystack = (ctx.uploads.extractedText + " " + ctx.uploads.toolMentions.join(" "))
    .toLowerCase();
  return needles.some((n) => haystack.includes(n.toLowerCase()));
}

/* ────────────────────────────────────────────────────────────────────────
 *  RULES
 *  ──────────────────────────────────────────────────────────────────── */

export const ANALYSIS_RULES: AnalysisRule[] = [
  /* ── SYSTEM FRAGMENTATION ────────────────────────────────────────── */
  {
    id: "frag.no-crm-detected",
    category: "system-fragmentation",
    defaultSeverity: "high",
    evaluate: (ctx) => {
      const hasCRM =
        hasCategory(ctx, "CRM") ||
        hasCategory(ctx, "Marketing") ||
        uploadHas(ctx, "hubspot", "salesforce", "pipedrive", "zoho", "monday crm");
      if (hasCRM) return { matched: false };
      // Nur triggern, wenn wir überhaupt etwas geprüft haben.
      if (!ctx.web && ctx.uploads.count === 0) return { matched: false };
      return {
        matched: true,
        title: "Kein CRM-System erkennbar",
        detail:
          "Es gibt im öffentlichen Auftritt keine Spuren eines CRM-Systems. Kontaktdaten, Lead-Quellen und Verläufe werden vermutlich verstreut in Mail, Tabellen und Notizen geführt.",
        source: ctx.web ? "web.stack-detection" : "upload.text",
        scoreImpact: {
          systemFragmentation: +25,
          automationPotential: +20,
          operations: -10,
        },
        recommendation:
          "CRM-System einführen, das Leads aus Web, Telefon und Empfehlungen zentral aufnimmt und mit klaren Stati versieht.",
      };
    },
  },
  {
    id: "frag.excel-as-operational-system",
    category: "system-fragmentation",
    defaultSeverity: "high",
    evaluate: (ctx) => {
      const usesExcel = uploadHas(ctx, "excel", ".xls", ".xlsx", "google sheets", "spreadsheet");
      if (!usesExcel) return { matched: false };
      return {
        matched: true,
        title: "Excel/Sheets als operatives Hauptsystem",
        detail:
          "Aus den hochgeladenen Inhalten geht hervor, dass Excel oder Google Sheets Kernprozesse trägt. Das skaliert nicht, ist fehleranfällig und verhindert Automation.",
        source: "upload.text",
        scoreImpact: {
          systemFragmentation: +20,
          automationPotential: +25,
          scalabilityRisk: +20,
        },
        recommendation:
          "Operative Datenstrukturen in ein konsistentes Backend mit Validierung und API überführen.",
      };
    },
  },
  {
    id: "frag.whatsapp-as-channel",
    category: "system-fragmentation",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      const usesWA =
        uploadHas(ctx, "whatsapp", "wa.me") ||
        stackNames(ctx).some((n) => n.includes("whatsapp"));
      if (!usesWA) return { matched: false };
      return {
        matched: true,
        title: "WhatsApp ist Teil der Kundenkommunikation",
        detail:
          "WhatsApp ist als Kanal nachweisbar. Ohne strukturierte Anbindung an ein CRM gehen Nachrichten, Anfragen und Verläufe verloren — sie sind weder durchsuchbar noch zuweisbar.",
        source: ctx.web ? "web.signals" : "upload.text",
        scoreImpact: {
          systemFragmentation: +15,
          automationPotential: +15,
          operations: -8,
        },
        recommendation:
          "WhatsApp Business API an das CRM koppeln (z. B. über 360dialog/Twilio), Templates und Routing definieren.",
      };
    },
  },
  {
    id: "frag.multi-channel-no-aggregation",
    category: "system-fragmentation",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const sig = ctx.web.signals;
      const channels =
        Number(sig.hasPhone) +
        Number(sig.hasContactForm) +
        Number(sig.hasChat) +
        Number(sig.socialLinks.length > 0);
      if (channels < 3) return { matched: false };
      return {
        matched: true,
        title: `${channels} Kontaktkanäle ohne erkennbare Aggregation`,
        detail:
          "Es gibt mehrere Kontaktwege (Telefon, Formular, Chat, Social) — aber keinen sichtbaren zentralen Einlauf. Anfragen landen verstreut.",
        source: "web.signals",
        scoreImpact: {
          systemFragmentation: +12,
          conversionRisk: +10,
          operations: -6,
        },
        recommendation:
          "Inbound-Hub als Single-Point-of-Entry — alle Kanäle in das CRM mit Routing und SLA-Status.",
      };
    },
  },

  /* ── AUTOMATION POTENTIAL ────────────────────────────────────────── */
  {
    id: "auto.no-automation-layer",
    category: "automation",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      const hasAutomation = stackNames(ctx).some((n) =>
        ["zapier", "make", "n8n", "workato"].some((k) => n.includes(k)),
      );
      if (hasAutomation) return { matched: false };
      if (!ctx.web && ctx.uploads.count === 0) return { matched: false };
      return {
        matched: true,
        title: "Keine Automatisierungs-Schicht sichtbar",
        detail:
          "Zwischen den Tools fehlt eine Automation-Engine. Routinen (Lead → CRM, Bestellung → Buchhaltung, Anfrage → Antwort) laufen vermutlich manuell.",
        source: "web.stack-detection",
        scoreImpact: { automationPotential: +20, operations: -10 },
        recommendation:
          "Workflow-Layer (n8n/Temporal) einführen, der idempotent zwischen Systemen vermittelt.",
      };
    },
  },
  {
    id: "auto.manual-form-only",
    category: "automation",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const sig = ctx.web.signals;
      if (!sig.hasContactForm) return { matched: false };
      if (sig.hasOnlineBooking) return { matched: false };
      return {
        matched: true,
        title: "Formular vorhanden — Online-Buchung fehlt",
        detail:
          "Interessenten füllen ein Formular aus und warten dann auf Antwort. Termine oder Beratungen müssen manuell koordiniert werden — viele Anfragen springen ab.",
        source: "web.signals",
        scoreImpact: {
          automationPotential: +15,
          conversionRisk: +12,
        },
        recommendation:
          "Online-Booking mit Kalender-Sync (z. B. Cal.com/Calendly + CRM-Hook) statt manuellem Hin-und-Her.",
      };
    },
  },

  /* ── SCALABILITY RISK ────────────────────────────────────────────── */
  {
    id: "scale.cms-on-shared-host",
    category: "scalability",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      const stack = stackNames(ctx);
      const onModernPlatform = stack.some((n) =>
        ["next.js", "vercel", "netlify", "cloudflare", "astro"].some((k) =>
          n.includes(k),
        ),
      );
      const onCMS = stack.some((n) =>
        ["wordpress", "wix", "squarespace"].some((k) => n.includes(k)),
      );
      if (!onCMS || onModernPlatform) return { matched: false };
      return {
        matched: true,
        title: "Klassisches CMS ohne moderne Edge-Auslieferung",
        detail:
          "Der Auftritt basiert auf einem klassischen CMS-Stack. Lastspitzen und SEO/Performance-Erwartungen lassen sich darauf nur begrenzt erfüllen.",
        source: "web.stack-detection",
        scoreImpact: { scalabilityRisk: +12, technicalRisk: +8 },
        recommendation:
          "Headless-Architektur prüfen (CMS als Source, Auslieferung über Edge — Vercel/Cloudflare).",
      };
    },
  },
  {
    id: "scale.multi-locations-no-system",
    category: "scalability",
    defaultSeverity: "high",
    evaluate: (ctx) => {
      if (!ctx.web?.signals.hasMultipleLocations) return { matched: false };
      const hasERP = hasCategory(ctx, "ERP");
      if (hasERP) return { matched: false };
      return {
        matched: true,
        title: "Mehrere Standorte ohne erkennbares operatives System",
        detail:
          "Es werden mehrere Standorte erwähnt, aber kein zentrales operatives System (ERP/Operations-Plattform) ist sichtbar.",
        source: "web.signals",
        scoreImpact: {
          scalabilityRisk: +20,
          systemFragmentation: +15,
          operations: -12,
        },
        recommendation:
          "Operations-Plattform mit Standort-/Rollen-Modell und einheitlichen KPIs einführen.",
      };
    },
  },

  /* ── TECHNICAL RISK ──────────────────────────────────────────────── */
  {
    id: "tech.missing-https",
    category: "technical",
    defaultSeverity: "critical",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      if (ctx.web.finalUrl.startsWith("https://")) return { matched: false };
      return {
        matched: true,
        title: "Keine HTTPS-Verschlüsselung",
        detail:
          "Der Auftritt läuft ohne TLS. Browser zeigen Warnungen, Vertrauenssignal fehlt komplett.",
        source: "web.url",
        scoreImpact: { technicalRisk: +30, conversionRisk: +20 },
        recommendation: "TLS-Zertifikat aktivieren und HTTPS erzwingen.",
      };
    },
  },
  {
    id: "tech.security-headers-missing",
    category: "technical",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const required = [
        "strict-transport-security",
        "content-security-policy",
        "x-frame-options",
        "referrer-policy",
      ];
      const missing = required.filter((h) => !ctx.web!.headers[h]);
      if (missing.length < 2) return { matched: false };
      return {
        matched: true,
        title: `${missing.length} Sicherheits-Header fehlen`,
        detail: `Fehlend: ${missing.join(", ")}. Erhöht das Risiko von Clickjacking, Mixed Content und Datenleck.`,
        source: "web.headers",
        scoreImpact: {
          technicalRisk: 5 * missing.length,
        },
        recommendation:
          "HSTS, CSP, X-Frame-Options und Referrer-Policy in der Edge/Origin setzen.",
        severity: missing.length >= 3 ? "high" : "medium",
      };
    },
  },
  {
    id: "tech.heavy-html",
    category: "technical",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const sizeKB = Math.round(ctx.web.bytes / 1024);
      if (sizeKB < 800) return { matched: false };
      return {
        matched: true,
        title: `HTML-Dokument ${sizeKB} KB groß`,
        detail:
          "Schwergewichtiges Initial-HTML verzögert First-Paint und Interaktivität — Conversion-Killer auf mobil.",
        source: "web.bytes",
        scoreImpact: { technicalRisk: 10, conversionRisk: 8 },
        recommendation:
          "Initial-HTML reduzieren (SSR-Output kürzen, kritisches CSS extrahieren, Inline-Scripts auslagern).",
        severity: sizeKB > 1500 ? "high" : "medium",
      };
    },
  },

  /* ── CONVERSION RISK ─────────────────────────────────────────────── */
  {
    id: "cvr.phone-only",
    category: "conversion",
    defaultSeverity: "high",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const s = ctx.web.signals;
      if (!s.hasPhone) return { matched: false };
      if (s.hasContactForm || s.hasOnlineBooking) return { matched: false };
      return {
        matched: true,
        title: "Anfragen laufen nur über Telefon",
        detail:
          "Kein Formular, keine Online-Buchung. Interessenten ohne Telefon-Reflex springen ab — das sind je nach Branche 40–70 %.",
        source: "web.signals",
        scoreImpact: { conversionRisk: 18, automationPotential: 10 },
        recommendation:
          "Asynchroner Inbound-Kanal (Formular + Booking) mit CRM-Anbindung.",
      };
    },
  },
  {
    id: "cvr.no-reviews-on-service-business",
    category: "trust",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const s = ctx.web.signals;
      if (s.hasReviews) return { matched: false };
      const looksLikeService =
        s.industryHints.some((h) =>
          /salon|praxis|klinik|kanzlei|werkstatt|restaurant|studio|coach|berat/i.test(
            h,
          ),
        );
      if (!looksLikeService) return { matched: false };
      return {
        matched: true,
        title: "Keine sichtbaren Kundenbewertungen",
        detail:
          "In einem dienstleistungsgetriebenen Geschäft sind soziale Beweise das stärkste Conversion-Signal. Sie fehlen sichtbar im Auftritt.",
        source: "web.signals",
        scoreImpact: { conversionRisk: 10, operations: -5 },
        recommendation:
          "Bewertungen automatisiert einsammeln (Post-Service-Trigger) und prominent platzieren.",
      };
    },
  },
  {
    id: "cvr.thin-content",
    category: "conversion",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const wc = ctx.web.signals.wordCount;
      if (wc >= 350) return { matched: false };
      return {
        matched: true,
        title: `Startseite mit nur ${wc} Wörtern`,
        detail:
          "Besucher bekommen kaum Antworten und das Suchmaschinen-Ranking bleibt schwach. Vertrauensaufbau scheitert an Substanz.",
        source: "web.signals",
        scoreImpact: { conversionRisk: 10 },
        recommendation:
          "Inhaltsstrategie: Hauptnutzen, Beweise, häufige Fragen, klarer nächster Schritt — pro Zielgruppe.",
      };
    },
  },

  /* ── OPERATIONS ──────────────────────────────────────────────────── */
  {
    id: "ops.no-jobs-on-talent-business",
    category: "operations",
    defaultSeverity: "medium",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const s = ctx.web.signals;
      if (s.hasJobs) return { matched: false };
      const personnelHeavy = s.industryHints.some((h) =>
        /pflege|salon|klinik|praxis|gastro|werkstatt|hotel/i.test(h),
      );
      if (!personnelHeavy) return { matched: false };
      return {
        matched: true,
        title: "Personalintensives Geschäft ohne Karriere-Funnel",
        detail:
          "Branchen mit Personal-Engpass brauchen aktive Bewerber-Pipelines. Aktuell ist kein strukturierter Funnel sichtbar.",
        source: "web.signals",
        scoreImpact: { operations: -10, scalabilityRisk: 15 },
        recommendation:
          "Recruiting-OS mit Stellenfeed, automatisierten Erstinterviews und CRM-Anbindung.",
      };
    },
  },
  {
    id: "ops.real-estate-without-system",
    category: "operations",
    defaultSeverity: "high",
    evaluate: (ctx) => {
      if (!ctx.web) return { matched: false };
      const isRealEstate = ctx.web.signals.industryHints.some((h) =>
        /immobilien|makler|exposé/i.test(h),
      );
      if (!isRealEstate) return { matched: false };
      const hasRealEstateTool = uploadHas(
        ctx,
        "onoffice",
        "flowfact",
        "immobilienscout",
        "immoware",
        "propstack",
      );
      if (hasRealEstateTool) return { matched: false };
      return {
        matched: true,
        title: "Immobilien-Geschäft ohne erkennbares Maklersystem",
        detail:
          "Es gibt Hinweise auf Immobilien-Vertrieb, aber kein etabliertes Makler-OS (Exposé-Engine, Lead-Routing, Vertragsworkflow) erkennbar.",
        source: "web.signals",
        scoreImpact: {
          operations: -15,
          automationPotential: 25,
          systemFragmentation: 15,
        },
        recommendation:
          "Immobilien-Operating-System mit Exposé-Engine, Käufer-Matching, Vertragsworkflow.",
      };
    },
  },
];

/**
 * Lässt alle Regeln über den Kontext laufen und gibt die ausgelösten Findings zurück.
 * Die `id`, `analysisId`, `createdAt` werden später im Service ergänzt.
 */
export function evaluateRules(
  ctx: RuleContext,
): Array<Omit<AnalysisFinding, "id" | "analysisId" | "createdAt">> {
  const triggered: Array<Omit<AnalysisFinding, "id" | "analysisId" | "createdAt">> =
    [];
  for (const rule of ANALYSIS_RULES) {
    const result = rule.evaluate(ctx);
    if (!result.matched) continue;
    triggered.push({
      ruleId: rule.id,
      category: rule.category,
      severity: result.severity ?? rule.defaultSeverity,
      title: result.title,
      detail: result.detail,
      source: result.source,
      scoreImpact: result.scoreImpact,
      recommendation: result.recommendation ?? null,
    });
  }
  return triggered;
}
