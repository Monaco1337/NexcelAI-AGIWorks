// Cloud analyzer — accepts Terraform, k8s YAML, IAM JSON or free-form
// architecture description and returns rule-based findings.

import type {
  DetectedTech,
  Finding,
  ScanResult,
  ScoreBreakdown,
} from "./types";

interface ProviderRule {
  match: RegExp;
  category: string;
  name: string;
}

const PROVIDERS: ProviderRule[] = [
  { match: /aws_|amazonaws\.com|@aws-sdk/i, category: "Cloud", name: "AWS" },
  { match: /google_|googleapis\.com|@google-cloud/i, category: "Cloud", name: "Google Cloud" },
  { match: /azurerm_|microsoft\.com\/azure/i, category: "Cloud", name: "Azure" },
  { match: /digitalocean_|do_droplet/i, category: "Cloud", name: "DigitalOcean" },
  { match: /hetzner_|hcloud_/i, category: "Cloud", name: "Hetzner" },
  { match: /apiVersion:\s*v\d|kubectl|kind:\s*(Deployment|Service|Ingress)/i, category: "Orchestration", name: "Kubernetes" },
  { match: /resource\s+"|provider\s+"/i, category: "IaC", name: "Terraform" },
  { match: /version:\s*['"]?3/i, category: "IaC", name: "Docker Compose" },
];

const RISK_RULES: { match: RegExp; finding: Omit<Finding, "id"> }[] = [
  {
    match: /"Effect":\s*"Allow"[\s\S]+?"Action":\s*"\*"/i,
    finding: {
      area: "IAM",
      title: "IAM-Statement mit Action: *",
      detail: "Vollzugriff in einer Policy ist Standard für Lateral-Movement.",
      severity: "critical",
      fix: "Least-Privilege: konkrete Actions auflisten.",
    },
  },
  {
    match: /"Resource":\s*"\*"/i,
    finding: {
      area: "IAM",
      title: "Policy auf Resource: *",
      detail: "Pauschaler Zugriff auf alle Ressourcen ist riskant.",
      severity: "high",
      fix: "Resource-ARN(s) explizit binden.",
    },
  },
  {
    match: /publicly_accessible\s*=\s*true|public_access:\s*true/i,
    finding: {
      area: "Network",
      title: "Public-Access aktiv",
      detail: "DB/Storage öffentlich erreichbar — potenzieller Daten-Leak.",
      severity: "critical",
      fix: "Private Subnet + VPC-Endpoint statt public ingress.",
    },
  },
  {
    match: /0\.0\.0\.0\/0/i,
    finding: {
      area: "Network",
      title: "Security-Group offen für 0.0.0.0/0",
      detail: "Erlaubt eingehenden Traffic aus dem ganzen Internet.",
      severity: "high",
      fix: "Source-CIDR auf bekannte IPs/VPCs einschränken.",
    },
  },
  {
    match: /encryption\s*=\s*false|encrypted\s*:\s*false/i,
    finding: {
      area: "Encryption",
      title: "Verschlüsselung deaktiviert",
      detail: "At-Rest oder In-Transit nicht verschlüsselt.",
      severity: "high",
      fix: "KMS/CMK aktivieren, TLS erzwingen.",
    },
  },
  {
    match: /containers?:\s*[\s\S]*?image:[^"\n]*latest/i,
    finding: {
      area: "Container",
      title: "K8s-Container mit :latest",
      detail: "Nicht reproduzierbar, Drift-Risiko.",
      severity: "medium",
      fix: "Image-Tags pinnen oder digests nutzen.",
    },
  },
  {
    match: /securityContext:\s*[\s\S]*?privileged:\s*true/i,
    finding: {
      area: "Container",
      title: "K8s-Pod im privileged-Mode",
      detail: "Bricht Container-Isolation.",
      severity: "high",
      fix: "Capabilities einzeln vergeben, securityContext minimieren.",
    },
  },
  {
    match: /backup\s*=\s*false|backup_retention_period\s*=\s*0/i,
    finding: {
      area: "Resilience",
      title: "Backups deaktiviert",
      detail: "Keine Recovery bei Daten-Verlust.",
      severity: "high",
      fix: "Automated Backups + PITR aktivieren.",
    },
  },
  {
    match: /multi_az\s*=\s*false/i,
    finding: {
      area: "Resilience",
      title: "Single-AZ-Deployment",
      detail: "Hardware-Ausfall = Downtime.",
      severity: "medium",
      fix: "Multi-AZ aktivieren (kosten linear, Risiko deutlich kleiner).",
    },
  },
  {
    match: /cloudwatch_logs\s*=\s*false|enable_logging\s*=\s*false/i,
    finding: {
      area: "Observability",
      title: "Logging deaktiviert",
      detail: "Forensik bei Incidents nicht möglich.",
      severity: "medium",
      fix: "Audit + Application-Logs nach CloudWatch / GCP-Logging streamen.",
    },
  },
  {
    match: /sa_key|service_account_key\.json/i,
    finding: {
      area: "Secrets",
      title: "Long-lived Service-Account-Keys",
      detail: "Schlüssel-Leaks sind häufigste GCP/AWS-Compromises.",
      severity: "high",
      fix: "Workload-Identity (GCP) bzw. IAM-Roles for Service Accounts (EKS).",
    },
  },
];

export function analyzeCloud(input: {
  source: string;
  content: string;
}): ScanResult {
  const t0 = Date.now();
  const { source, content } = input;
  const detected: DetectedTech[] = [];
  for (const r of PROVIDERS) {
    if (r.match.test(content)) {
      detected.push({ category: r.category, name: r.name, confidence: 0.95 });
    }
  }
  const findings: Finding[] = [];
  let idx = 0;
  for (const r of RISK_RULES) {
    if (r.match.test(content)) {
      findings.push({ id: `cloud-${idx++}`, ...r.finding });
    }
  }
  // Best practice positives = bonus only (no inverse findings).

  const score = computeCloudScore(findings, detected);
  const summary = `${detected.map((d) => d.name).join(" · ") || "Stack unklar"}. ${
    findings.length
  } Sicherheits-/Resilienz-Befunde.`;
  const recommendations = findings
    .filter((f) => f.fix)
    .sort(
      (a, b) =>
        ["critical", "high", "medium", "low", "info"].indexOf(a.severity) -
        ["critical", "high", "medium", "low", "info"].indexOf(b.severity),
    )
    .slice(0, 5)
    .map((f) => `${f.title} — ${f.fix}`);

  return {
    mode: "cloud",
    source,
    durationMs: Date.now() - t0,
    score,
    findings,
    detected,
    summary,
    recommendations,
    meta: { providers: detected.length, lines: content.split("\n").length },
  };
}

function computeCloudScore(
  findings: Finding[],
  _detected: DetectedTech[],
): ScoreBreakdown {
  const axes = { ux: 70, performance: 80, conversion: 60, trust: 80, security: 95 };
  for (const f of findings) {
    const w =
      f.severity === "critical"
        ? 25
        : f.severity === "high"
          ? 14
          : f.severity === "medium"
            ? 7
            : 3;
    if (f.area === "IAM" || f.area === "Network" || f.area === "Encryption" || f.area === "Secrets") {
      axes.security -= w;
    } else if (f.area === "Resilience") axes.performance -= w;
    else if (f.area === "Observability") axes.trust -= w;
    else if (f.area === "Container") axes.security -= w * 0.6;
  }
  const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));
  const ux = clamp(axes.ux);
  const performance = clamp(axes.performance);
  const conversion = clamp(axes.conversion);
  const trust = clamp(axes.trust);
  const security = clamp(axes.security);
  const overall = clamp(
    ux * 0.1 + performance * 0.2 + conversion * 0.05 + trust * 0.25 + security * 0.4,
  );
  return { ux, performance, conversion, trust, security, overall };
}
