// Hero Data - Single source of truth for SystemMap nodes/projects

export interface ProjectNode {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  href: string;
  icon: "platform" | "ai" | "analytics" | "automation" | "crm" | "flow";
  status: "live" | "beta" | "coming";
  accent: string;
}

export const projectNodes: ProjectNode[] = [
  {
    id: "core-platform",
    title: "Core Platform",
    subtitle: "Enterprise Foundation",
    description: "Modulare Basis-Architektur für skalierbare digitale Systeme.",
    bullets: [
      "Next.js + React + TypeScript",
      "Edge-optimierte Performance",
      "Enterprise Security Standards",
    ],
    href: "/systeme",
    icon: "platform",
    status: "live",
    accent: "#A855F7",
  },
  {
    id: "chronex-ai",
    title: "Chronex AI",
    subtitle: "Intelligent Scheduling",
    description: "KI-gestützte Termin- und Ressourcenplanung in Echtzeit.",
    bullets: [
      "Predictive Scheduling",
      "Multi-Agent Coordination",
      "Calendar Integration",
    ],
    href: "/projekte#chronex",
    icon: "ai",
    status: "beta",
    accent: "#3B82F6",
  },
  {
    id: "immostripe-ai",
    title: "ImmoStripe AI",
    subtitle: "Real Estate Intelligence",
    description: "Automatisierte Immobilienbewertung und Marktanalyse.",
    bullets: [
      "Market Price Prediction",
      "Document Processing",
      "Lead Qualification",
    ],
    href: "/projekte#immostripe",
    icon: "analytics",
    status: "live",
    accent: "#10B981",
  },
  {
    id: "cannaflow-ai",
    title: "CannaFlow AI",
    subtitle: "Compliance Automation",
    description: "Regulatory Compliance und Supply Chain Management.",
    bullets: [
      "Track & Trace System",
      "Compliance Monitoring",
      "Inventory Automation",
    ],
    href: "/projekte#cannaflow",
    icon: "flow",
    status: "beta",
    accent: "#22C55E",
  },
  {
    id: "nextseller-crm",
    title: "NextSeller CRM",
    subtitle: "Sales Intelligence",
    description: "KI-optimiertes CRM für moderne Vertriebsteams.",
    bullets: [
      "Pipeline Automation",
      "AI Lead Scoring",
      "Conversation Intelligence",
    ],
    href: "/projekte#nextseller",
    icon: "crm",
    status: "coming",
    accent: "#F59E0B",
  },
  {
    id: "automation-hub",
    title: "Automation Hub",
    subtitle: "Workflow Engine",
    description: "Zentrale Orchestrierung aller automatisierten Prozesse.",
    bullets: [
      "Visual Workflow Builder",
      "API Integrations",
      "Real-time Monitoring",
    ],
    href: "/projekte#automation",
    icon: "automation",
    status: "live",
    accent: "#EC4899",
  },
];

export const proofChips = [
  { label: "Security-first", icon: "shield" },
  { label: "Local-/Hybrid-first", icon: "server" },
  { label: "Observability", icon: "eye" },
  { label: "Automations", icon: "bolt" },
  { label: "Enterprise UX", icon: "sparkles" },
] as const;

export type ProofChip = (typeof proofChips)[number];
