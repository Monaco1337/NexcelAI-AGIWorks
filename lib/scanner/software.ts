// Software analyzer — accepts a code/config snippet (package.json, Dockerfile,
// requirements.txt, pom.xml, …) or a free-form description and returns
// rule-based architecture + dependency findings.

import type {
  DetectedTech,
  Finding,
  ScanResult,
  ScoreBreakdown,
} from "./types";

interface DepRule {
  match: RegExp;
  category: string;
  name: string;
  hint?: string;
  severity?: Finding["severity"];
}

const DEPS: DepRule[] = [
  // Frameworks
  { match: /"next"\s*:/i, category: "Framework", name: "Next.js" },
  { match: /"react"\s*:/i, category: "Framework", name: "React" },
  { match: /"vue"\s*:/i, category: "Framework", name: "Vue" },
  { match: /"@angular\/core"\s*:/i, category: "Framework", name: "Angular" },
  { match: /"@nestjs\/core"\s*:/i, category: "Framework", name: "NestJS" },
  { match: /"express"\s*:/i, category: "Framework", name: "Express" },
  { match: /"fastify"\s*:/i, category: "Framework", name: "Fastify" },
  { match: /"django|flask|fastapi"/i, category: "Framework", name: "Python web" },
  { match: /spring-boot|spring-framework/i, category: "Framework", name: "Spring" },

  // Datenbanken
  { match: /"mongoose"\s*:/i, category: "DB", name: "MongoDB (Mongoose)" },
  { match: /"prisma"\s*:/i, category: "DB", name: "Prisma" },
  { match: /"pg"\s*:|postgresql/i, category: "DB", name: "PostgreSQL" },
  { match: /"mysql2?"\s*:/i, category: "DB", name: "MySQL" },
  { match: /"redis"\s*:/i, category: "DB", name: "Redis" },

  // Auth
  { match: /"next-auth"\s*:|"@auth\/core"/i, category: "Auth", name: "NextAuth/Auth.js" },
  { match: /"passport"\s*:/i, category: "Auth", name: "Passport" },
  { match: /"jsonwebtoken"\s*:/i, category: "Auth", name: "JWT" },

  // Payments
  { match: /"stripe"\s*:/i, category: "Payments", name: "Stripe" },
  { match: /"@paypal"/i, category: "Payments", name: "PayPal" },

  // Build tools
  { match: /"vite"\s*:/i, category: "Build", name: "Vite" },
  { match: /"webpack"\s*:/i, category: "Build", name: "Webpack" },
  { match: /"turbo"\s*:|"turborepo"/i, category: "Build", name: "Turborepo" },

  // Testing
  { match: /"vitest"\s*:/i, category: "Test", name: "Vitest" },
  { match: /"jest"\s*:/i, category: "Test", name: "Jest" },
  { match: /"playwright"\s*:/i, category: "Test", name: "Playwright" },

  // Docker / infra
  { match: /^FROM\s+/im, category: "Container", name: "Dockerfile" },
];

const RISK_RULES: { match: RegExp; finding: Omit<Finding, "id"> }[] = [
  {
    match: /"node"\s*:\s*"(?:[<^~]?\s*)?(?:14|16)/i,
    finding: {
      area: "Runtime",
      title: "Veraltete Node.js-Version",
      detail: "Node 14/16 sind End-of-Life. Sicherheits-Patches fehlen.",
      severity: "high",
      fix: "Auf Node 20 LTS oder neuer migrieren.",
    },
  },
  {
    match: /"react"\s*:\s*"(?:[<^~]?\s*)?(?:16|17)/i,
    finding: {
      area: "Frontend",
      title: "Sehr alte React-Version",
      detail: "React 16/17 unterstützt keine modernen Patterns (Suspense, RSC).",
      severity: "medium",
      fix: "Auf React 18+ migrieren.",
    },
  },
  {
    match: /password\s*=|secret\s*=\s*["'][a-zA-Z0-9]+["']/i,
    finding: {
      area: "Security",
      title: "Hardcoded Secrets erkannt",
      detail: "Passwörter/Secrets im Klartext im Code sind kritisch.",
      severity: "critical",
      fix: "Secrets in .env / Secret-Manager auslagern + History purgen.",
    },
  },
  {
    match: /privileged:\s*true/i,
    finding: {
      area: "Container",
      title: "privileged: true im Container",
      detail: "Kompromittiert Host-Isolation.",
      severity: "high",
      fix: "Capabilities einzeln vergeben statt --privileged.",
    },
  },
  {
    match: /FROM\s+\S+:latest/i,
    finding: {
      area: "Container",
      title: "Docker-Image :latest",
      detail: "Reproduzierbare Builds nicht garantiert.",
      severity: "medium",
      fix: "Pinning auf konkrete Image-Digests/Versionen.",
    },
  },
  {
    match: /eslint-disable|@ts-ignore|noqa/i,
    finding: {
      area: "Code-Qualität",
      title: "Linter-Suppressions im Code",
      detail: "Unterdrückte Warnungen verbergen Tech-Debt.",
      severity: "low",
      fix: "Suppressions durch echte Fixes ersetzen.",
    },
  },
];

export function analyzeSoftware(input: {
  source: string; // filename or 'inline'
  content: string;
}): ScanResult {
  const t0 = Date.now();
  const { source, content } = input;
  const detected: DetectedTech[] = [];
  for (const r of DEPS) {
    if (r.match.test(content)) {
      detected.push({ category: r.category, name: r.name, confidence: 0.95 });
    }
  }

  const findings: Finding[] = [];
  let idx = 0;
  for (const r of RISK_RULES) {
    if (r.match.test(content)) {
      findings.push({ id: `sw-${idx++}`, ...r.finding });
    }
  }

  // Architectural heuristics
  const hasTests = /vitest|jest|playwright|"test"\s*:/i.test(content);
  if (!hasTests) {
    findings.push({
      id: "sw-no-tests",
      area: "Tests",
      title: "Keine Test-Frameworks erkennbar",
      detail: "Erhöht Regressionsrisiko bei Refactorings.",
      severity: "medium",
      fix: "Vitest/Jest + Playwright einführen, mind. Smoke-Suite.",
    });
  }
  const hasCI = /github\.com\/workflows|\.gitlab-ci|circleci|jenkinsfile/i.test(
    content,
  );
  if (!hasCI && /package\.json/i.test(source)) {
    findings.push({
      id: "sw-no-ci",
      area: "DevOps",
      title: "Keine CI-Pipeline erkennbar",
      detail: "Manuelle Deploys = Risiko.",
      severity: "medium",
      fix: "GitHub Actions / GitLab CI für Build, Test, Deploy etablieren.",
    });
  }

  const score = computeSwScore(findings, detected);
  const summary = `${detected.length} Technologien erkannt, ${
    findings.length
  } Befunde. Wartbarkeit & Sicherheit ${
    score.overall >= 75 ? "stark" : score.overall >= 55 ? "okay" : "schwach"
  }.`;
  const recommendations = findings
    .filter((f) => f.fix)
    .sort((a, b) =>
      ["critical", "high", "medium", "low", "info"].indexOf(a.severity) -
      ["critical", "high", "medium", "low", "info"].indexOf(b.severity),
    )
    .slice(0, 5)
    .map((f) => `${f.title} — ${f.fix}`);

  return {
    mode: "software",
    source,
    durationMs: Date.now() - t0,
    score,
    findings,
    detected,
    summary,
    recommendations,
    meta: {
      lines: content.split("\n").length,
      bytes: content.length,
      depsDetected: detected.length,
    },
  };
}

function computeSwScore(
  findings: Finding[],
  detected: DetectedTech[],
): ScoreBreakdown {
  const axes = { ux: 80, performance: 80, conversion: 70, trust: 80, security: 95 };
  for (const f of findings) {
    const w =
      f.severity === "critical"
        ? 22
        : f.severity === "high"
          ? 12
          : f.severity === "medium"
            ? 6
            : f.severity === "low"
              ? 2
              : 1;
    if (f.area === "Security") axes.security -= w;
    else if (f.area === "Tests" || f.area === "Code-Qualität") axes.ux -= w;
    else if (f.area === "DevOps") axes.performance -= w;
    else if (f.area === "Container" || f.area === "Runtime") axes.security -= w;
  }
  if (detected.find((d) => d.name === "TypeScript")) axes.ux += 4;
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const ux = clamp(axes.ux);
  const performance = clamp(axes.performance);
  const conversion = clamp(axes.conversion);
  const trust = clamp(axes.trust);
  const security = clamp(axes.security);
  const overall = clamp(
    ux * 0.2 +
      performance * 0.2 +
      conversion * 0.1 +
      trust * 0.2 +
      security * 0.3,
  );
  return { ux, performance, conversion, trust, security, overall };
}
