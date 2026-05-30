"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const IS_PRODUCTION = process.env.NEXT_PUBLIC_VERCEL === "1" || process.env.NODE_ENV === "production";

interface AnalyticsEventLite {
  id: string;
  type: string;
  ts: string;
  sessionId: string;
  visitorId: string;
  brand: "agiworks" | "nexcel";
  page: string;
  referrer?: string;
  device?: string;
  value?: number;
  meta?: Record<string, unknown>;
}

interface SessionLite {
  sessionId: string;
  visitorId: string;
  brand: "agiworks" | "nexcel";
  firstSeen: string;
  lastSeen: string;
  pageViews: number;
  events: number;
  device?: string;
  referrer?: string;
  durationSec: number;
  maxScroll: number;
  converted: boolean;
}

interface BucketAgg {
  pageViews: number;
  contacts: number;
  demoRequests: number;
  sessions?: number;
  pricingStarts?: number;
  uploads?: number;
}

interface Stats {
  analytics: {
    total: {
      pageViews: number;
      contacts: number;
      demoRequests: number;
      sessions?: number;
      visitors?: number;
      pricingStarts?: number;
      pricingQuotes?: number;
      pricingSubmits?: number;
      uploads?: number;
      events?: number;
    };
    last24h: BucketAgg;
    last7d: BucketAgg;
    last30d: BucketAgg;
    topPages: { page: string; count: number }[];
    live?: { visitors: number };
    funnel?: {
      pageView: number;
      pricingStart: number;
      pricingQuote: number;
      pricingSubmit: number;
      contactSubmit: number;
    };
    topReferrers?: { referrer: string; count: number }[];
    deviceMix?: { device: string; count: number }[];
    brandSplit?: { brand: "agiworks" | "nexcel"; count: number }[];
    scrollDepthHistogram?: { bucket: string; count: number }[];
    topPagesDetailed?: { page: string; views: number; avgScroll: number; avgDwellSec: number }[];
    recentSessions?: SessionLite[];
    recentEvents?: AnalyticsEventLite[];
  };
  contacts: { total: number; unread: number; archived: number };
  demoRequests: { total: number; unread: number; pending: number; archived: number };
}

type BrandFilter = "all" | "nexcel" | "agiworks";

interface Contact {
  id: string;
  name: string;
  email: string;
  telefon?: string;
  unternehmen?: string;
  betreff?: string;
  nachricht: string;
  createdAt: string;
  read: boolean;
  archived: boolean;
  status: "open" | "read" | "archived";
  brand?: "agiworks" | "nexcel";
  sourceHost?: string;
}

interface DemoRequest {
  id: string;
  name: string;
  email: string;
  unternehmen?: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected" | "expired";
  expiresAt?: string;
  read: boolean;
  archived: boolean;
  brand?: "agiworks" | "nexcel";
}

interface SessionUser {
  name: string;
  email: string;
  brand?: "agiworks" | "nexcel" | null;
}

const BRAND_META: Record<"nexcel" | "agiworks", { label: string; accent: string; glow: string }> = {
  nexcel: {
    label: "NEXCEL AI",
    accent: "#A45CFF",
    glow: "rgba(164, 92, 255, 0.25)",
  },
  agiworks: {
    label: "AGI Works",
    accent: "#5BB8FF",
    glow: "rgba(91, 184, 255, 0.25)",
  },
};

type TabId =
  | "overview"
  | "analysen"
  | "contacts"
  | "pipeline"
  | "unternehmen"
  | "demo"
  | "automationen"
  | "analytics"
  | "settings";

type TimeRange = "24h" | "7d" | "30d";

const TIME_RANGE_LABEL: Record<TimeRange, string> = {
  "24h": "Heute",
  "7d": "7 Tage",
  "30d": "30 Tage",
};

// Line-Icons (keine bunten Standard-Icons) — schlanke 1.6px Strokes.
function NavIcon({ name }: { name: TabId }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "overview":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="9" rx="1.5" />
          <rect x="14" y="3" width="7" height="5" rx="1.5" />
          <rect x="14" y="12" width="7" height="9" rx="1.5" />
          <rect x="3" y="16" width="7" height="5" rx="1.5" />
        </svg>
      );
    case "analysen":
      return (
        <svg {...common}>
          <path d="M4 19V5" />
          <path d="M4 19h16" />
          <path d="M8 16l3-4 3 2 4-6" />
        </svg>
      );
    case "contacts":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3.2" />
          <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
          <path d="M16 8.5a3 3 0 0 1 0 5" />
          <path d="M18 19a5 5 0 0 0-2.5-4.3" />
        </svg>
      );
    case "pipeline":
      return (
        <svg {...common}>
          <path d="M3 5h18l-7 8v6l-4-2v-4z" />
        </svg>
      );
    case "unternehmen":
      return (
        <svg {...common}>
          <rect x="4" y="3" width="9" height="18" rx="1.5" />
          <path d="M13 8h7v13h-7" />
          <path d="M7 7h2M7 11h2M7 15h2M16 12h1M16 16h1" />
        </svg>
      );
    case "demo":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="14" height="14" rx="2" />
          <path d="M17 9l4-2v10l-4-2" />
        </svg>
      );
    case "automationen":
      return (
        <svg {...common}>
          <path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.3 6.3l1.4 1.4M16.3 16.3l1.4 1.4M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );
    case "analytics":
      return (
        <svg {...common}>
          <path d="M5 20V10M12 20V4M19 20v-6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13a7.8 7.8 0 0 0 0-2l2-1.5-2-3.4-2.4 1a7.8 7.8 0 0 0-1.7-1l-.4-2.6H9.5l-.4 2.6a7.8 7.8 0 0 0-1.7 1l-2.4-1-2 3.4L5 11a7.8 7.8 0 0 0 0 2l-2 1.5 2 3.4 2.4-1a7.8 7.8 0 0 0 1.7 1l.4 2.6h4.6l.4-2.6a7.8 7.8 0 0 0 1.7-1l2.4 1 2-3.4z" />
        </svg>
      );
    default:
      return null;
  }
}

// Lead-Score wird transparent aus vorhandenen Feldern abgeleitet (kein Fake):
// frische, unbearbeitete B2B-Kontakte mit Telefon ranken höher.
function deriveLeadScore(c: Contact): number {
  let s = 42;
  if (!c.read) s += 24;
  if (c.unternehmen) s += 16;
  if (c.telefon) s += 10;
  const ageH = (Date.now() - new Date(c.createdAt).getTime()) / 3_600_000;
  if (ageH < 24) s += 8;
  else if (ageH < 72) s += 4;
  return Math.max(1, Math.min(99, s));
}

function priorityBucket(score: number): "A" | "B" | "C" {
  if (score >= 75) return "A";
  if (score >= 55) return "B";
  return "C";
}

function relTimeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return "gerade eben";
  if (sec < 3600) return `vor ${Math.floor(sec / 60)} Min`;
  if (sec < 86400) return `vor ${Math.floor(sec / 3600)} Std`;
  if (sec < 604800) return `vor ${Math.floor(sec / 86400)} T`;
  return new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  // Existing tabs (overview / contacts / demo / analytics) bleiben voll funktionsfähig.
  // Zusätzliche Command-Center-Views sind rein additiv und brechen nichts.
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  // Zeitraum-Filter: wählt nur, welcher bestehende Analytics-Bucket angezeigt wird.
  const [timeRange, setTimeRange] = useState<TimeRange>("24h");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  // Filtered views derived from brandFilter. Legacy entries without a
  // brand tag default to "nexcel" so they remain visible under the
  // NEXCEL filter and never disappear.
  const filteredContacts = contacts.filter((c) => {
    if (brandFilter === "all") return true;
    return (c.brand ?? "nexcel") === brandFilter;
  });
  const filteredDemoRequests = demoRequests.filter((r) => {
    if (brandFilter === "all") return true;
    return (r.brand ?? "nexcel") === brandFilter;
  });

  const sessionBrandKey: "nexcel" | "agiworks" =
    user?.brand === "agiworks" ? "agiworks" : "nexcel";
  const sessionBrand = BRAND_META[sessionBrandKey];

  useEffect(() => {
    loadData(true);
    // Refresh every 2 seconds — analytics data is quite chatty, keeps server cool.
    const interval = setInterval(() => loadData(false), 2000);
    return () => clearInterval(interval);
  }, [brandFilter]);

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
      }
      
      // DIREKT ÜBER SERVER ACTIONS - KEINE API-CALLS!
      const { getAdminContacts } = await import("@/app/actions/admin");
      const brandQuery = brandFilter === "all" ? "" : `?brand=${brandFilter}`;
      
      const [contactsData, statsRes, demoRes, userRes] = await Promise.all([
        getAdminContacts(), // Server Action für Posts
        fetch(`/api/admin/stats${brandQuery}`), // Stats inkl. Analytics
        fetch("/api/admin/demo-requests?archived=false"), // Demo bleibt API
        fetch("/api/admin/me"), // Auth bleibt API
      ]);
      
      console.log("🔵 [ADMIN DASHBOARD] Contacts data:", contactsData);
      console.log("🔵 [ADMIN DASHBOARD] Contacts count:", contactsData.contacts?.length || 0);
      
      if (statsRes.ok) setStats(await statsRes.json());
      
      // Kontakte aus Server Action - MIT DETAILLIERTER FEHLERANZEIGE!
      if (contactsData && contactsData.contacts && Array.isArray(contactsData.contacts)) {
        console.log("✅ [ADMIN DASHBOARD] Setting contacts:", contactsData.contacts.length);
        if (contactsData.contacts.length > 0) {
          console.log("✅ [ADMIN DASHBOARD] First contact:", {
            id: contactsData.contacts[0].id,
            name: contactsData.contacts[0].name,
            email: contactsData.contacts[0].email,
            betreff: contactsData.contacts[0].betreff,
          });
        }
        setContacts(contactsData.contacts);
        setError(null);
        setErrorDetails(null);
      } else if (contactsData && contactsData.error) {
        // FEHLER ANZEIGEN - DETAILLIERT!
        const errorDetailsObj = {
          type: "contacts_load_error",
          message: contactsData.error,
          data: contactsData,
          timestamp: new Date().toISOString(),
          storagePath: IS_PRODUCTION ? "/tmp/contact-posts.json" : "data/contact-posts.json",
          environment: IS_PRODUCTION ? "production" : "development",
        };
        setError(`Fehler beim Laden der Posts: ${contactsData.error}`);
        setErrorDetails(errorDetailsObj);
        setContacts([]);
      } else {
        // Keine Daten oder unerwartetes Format - aber kein Fehler setzen, nur leeres Array
        console.warn("⚠️ [ADMIN DASHBOARD] Unexpected data format:", contactsData);
        setContacts([]);
        setError(null);
        setErrorDetails(null);
      }
      
      if (demoRes.ok) setDemoRequests((await demoRes.json()).requests);
      if (userRes.ok) setUser(await userRes.json());
    } catch (error: any) {
      // DETAILLIERTE FEHLERANZEIGE!
      const errorMessage = error?.message || String(error) || "Unbekannter Fehler";
      setError(`Fehler beim Laden der Daten: ${errorMessage}`);
      setErrorDetails({
        type: "load_error",
        message: errorMessage,
        stack: error?.stack,
        error: error,
        timestamp: new Date().toISOString(),
      });
      console.error("❌ [ADMIN DASHBOARD] Error loading data:", error);
    } finally {
      if (isInitial) {
        setLoading(false);
      }
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/admin/login");
  };

  // Export der aktuell gefilterten Kontakte als CSV — rein clientseitig,
  // keine API-/Datenänderung. Greift nur auf bereits geladene Daten zu.
  const handleExport = () => {
    const rows = contacts.filter((c) => {
      if (brandFilter === "all") return true;
      return (c.brand ?? "nexcel") === brandFilter;
    });
    if (rows.length === 0) return;
    const headers = [
      "Name",
      "E-Mail",
      "Telefon",
      "Unternehmen",
      "Betreff",
      "Brand",
      "Status",
      "Erstellt",
    ];
    const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((c) =>
        [
          c.name,
          c.email,
          c.telefon ?? "",
          c.unternehmen ?? "",
          c.betreff ?? "",
          (c.brand ?? "nexcel") === "agiworks" ? "AGI Works" : "NEXCEL AI",
          c.status,
          c.createdAt,
        ]
          .map(escape)
          .join(","),
      ),
    ].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `command-center-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleNewAnalysis = () => {
    router.push("/");
  };

  const markAsRead = async (type: "contact" | "demo", id: string) => {
    try {
      if (type === "contact") {
        // DIREKT ÜBER SERVER ACTION - KEIN API-CALL!
        const { markContactAsRead } = await import("@/app/actions/admin");
        await markContactAsRead(id);
      } else {
        // Demo bleibt API (später umstellen)
        await fetch(`/api/admin/demo-requests`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, read: true }),
        });
      }
      loadData();
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Lädt...</div>
      </div>
    );
  }

  const unreadContacts = filteredContacts.filter((c) => !c.read).length;
  const unreadDemos = filteredDemoRequests.filter((r) => !r.read).length;

  const navItems: { id: TabId; label: string; badge?: number }[] = [
    { id: "overview", label: "Command Center" },
    { id: "analysen", label: "Analysen" },
    { id: "contacts", label: "Leads / Kontakte", badge: unreadContacts },
    { id: "pipeline", label: "Pipeline" },
    { id: "unternehmen", label: "Unternehmen" },
    { id: "demo", label: "Demo-Anfragen", badge: unreadDemos },
    { id: "automationen", label: "Automationen" },
    { id: "analytics", label: "Analytics" },
    { id: "settings", label: "Einstellungen" },
  ];

  const TAB_TITLE: Record<TabId, string> = {
    overview: "Command Center",
    analysen: "Analysen",
    contacts: "Leads / Kontakte",
    pipeline: "Pipeline",
    unternehmen: "Unternehmen",
    demo: "Demo-Anfragen",
    automationen: "Automationen",
    analytics: "Analytics",
    settings: "Einstellungen",
  };

  // ── Alle Kennzahlen werden aus bestehenden Daten abgeleitet ──
  const a = stats?.analytics;
  const bucket =
    timeRange === "24h" ? a?.last24h : timeRange === "7d" ? a?.last7d : a?.last30d;
  const trendPct = (val24h?: number, val7d?: number): number | null => {
    if (val24h == null || val7d == null) return null;
    const avg = val7d / 7;
    if (avg <= 0) return null;
    return Math.round(((val24h - avg) / avg) * 100);
  };

  const activeLeads = filteredContacts.filter((c) => !c.archived);
  const hotLeads = activeLeads
    .map((c) => ({ c, score: deriveLeadScore(c) }))
    .sort(
      (x, y) =>
        y.score - x.score ||
        new Date(y.c.createdAt).getTime() - new Date(x.c.createdAt).getTime(),
    )
    .slice(0, 5);

  const prio = { A: 0, B: 0, C: 0 };
  activeLeads.forEach((c) => {
    prio[priorityBucket(deriveLeadScore(c))] += 1;
  });

  // Konsolidierter Aktivitäts-Feed aus echten Quellen.
  type ActivityItem = {
    id: string;
    ts: string;
    kind: string;
    title: string;
    sub?: string;
    brand?: "agiworks" | "nexcel";
    color: string;
  };
  const recentEvents = a?.recentEvents ?? [];
  const activity: ActivityItem[] = [
    ...filteredContacts.map((c) => ({
      id: `c-${c.id}`,
      ts: c.createdAt,
      kind: "Neuer Lead",
      title: c.name,
      sub: c.unternehmen || c.betreff || c.email,
      brand: c.brand,
      color: "#22C55E",
    })),
    ...filteredDemoRequests.map((r) => ({
      id: `d-${r.id}`,
      ts: r.createdAt,
      kind: "Demo-Anfrage",
      title: r.name,
      sub: r.unternehmen || r.email,
      brand: r.brand,
      color: "#FBBF24",
    })),
    ...recentEvents
      .filter((e) =>
        ["contact_submit", "demo_request", "lead_submit", "pricing_submit", "upload_complete"].includes(
          e.type,
        ),
      )
      .filter((e) => brandFilter === "all" || e.brand === brandFilter)
      .map((e) => ({
        id: `e-${e.id}`,
        ts: e.ts,
        kind: EVENT_LABEL[e.type]?.label ?? e.type,
        title: e.page,
        sub: undefined,
        brand: e.brand,
        color: "#A45CFF",
      })),
  ]
    .sort((x, y) => new Date(y.ts).getTime() - new Date(x.ts).getTime())
    .slice(0, 7);

  // Pipeline-Funnel — echte Werte, fehlende Stufen = 0 (ehrlicher Empty-Zustand).
  const approvedDemos = filteredDemoRequests.filter((r) => r.status === "approved").length;
  const pipelineSteps = [
    {
      label: "Analyse gestartet",
      value: a?.total.pricingStarts ?? a?.funnel?.pricingStart ?? 0,
      color: "#A45CFF",
    },
    {
      label: "Analyse beendet",
      value: a?.total.pricingSubmits ?? a?.funnel?.pricingSubmit ?? 0,
      color: "#8B7CFF",
    },
    { label: "Demo angefragt", value: stats?.demoRequests.total ?? 0, color: "#5BB8FF" },
    { label: "Termin gebucht", value: approvedDemos, color: "#38BDF8" },
    {
      label: "Kunde geworden",
      value: filteredDemoRequests.filter((r) => r.status === "approved").length
        ? approvedDemos
        : 0,
      color: "#22C55E",
    },
  ];
  const funnelStart = pipelineSteps[0].value;
  const funnelEnd = pipelineSteps[pipelineSteps.length - 1].value;
  const conversionRate =
    funnelStart > 0 ? Math.round((funnelEnd / funnelStart) * 1000) / 10 : null;

  // Markenübersicht aus echten Daten.
  const brandStat = (key: "nexcel" | "agiworks") => ({
    leads: contacts.filter((c) => (c.brand ?? "nexcel") === key).length,
    demos: demoRequests.filter((r) => (r.brand ?? "nexcel") === key).length,
    events: a?.brandSplit?.find((b) => b.brand === key)?.count ?? 0,
  });

  // Lead-Herkunft — echte Referrer-Daten.
  const leadOrigins = (a?.topReferrers ?? []).slice(0, 6);

  // Häufige Themen aus Betreff-Feldern der Kontakte (echte Daten).
  const topicCounts = new Map<string, number>();
  activeLeads.forEach((c) => {
    const t = (c.betreff || "").trim();
    if (t) topicCounts.set(t, (topicCounts.get(t) ?? 0) + 1);
  });
  const topTopics = Array.from(topicCounts.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((x, y) => y.count - x.count)
    .slice(0, 6);

  const greetingName = (user?.name ?? "").split(" ")[0] || "Admin";

  const brandOptions = [
    { id: "all" as const, label: "Alle", accent: "#E5E7EB" },
    { id: "nexcel" as const, label: BRAND_META.nexcel.label, accent: BRAND_META.nexcel.accent },
    { id: "agiworks" as const, label: BRAND_META.agiworks.label, accent: BRAND_META.agiworks.accent },
  ];

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          "radial-gradient(120% 70% at 16% -10%, rgba(164, 92, 255, 0.16) 0%, rgba(7, 8, 12, 0) 55%), radial-gradient(90% 55% at 100% 0%, rgba(91, 184, 255, 0.10) 0%, rgba(7, 8, 12, 0) 50%), #07080C",
      }}
    >
      <div className="flex min-h-screen">
        {/* ─── SIDEBAR (Desktop) ─────────────────────────────────────── */}
        <aside
          className="hidden lg:flex flex-col w-[250px] flex-shrink-0 sticky top-0 h-screen"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
            borderRight: "1px solid rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div
            className="px-5 py-5 flex items-center gap-3"
            style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${sessionBrand.accent}33, ${sessionBrand.accent}10)`,
                border: `1px solid ${sessionBrand.accent}55`,
                color: sessionBrand.accent,
              }}
            >
              {sessionBrand.label.charAt(0)}
            </div>
            <div className="leading-tight min-w-0">
              <div className="text-sm font-semibold text-white truncate">{sessionBrand.label}</div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-[#6B7280]">
                Admin Dashboard
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className="group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: active ? `${sessionBrand.accent}1A` : "transparent",
                    color: active ? "#FFFFFF" : "#9CA3AF",
                    border: `1px solid ${active ? `${sessionBrand.accent}33` : "transparent"}`,
                  }}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-full"
                      style={{ background: sessionBrand.accent, boxShadow: `0 0 12px ${sessionBrand.accent}` }}
                    />
                  )}
                  <span
                    className="flex-shrink-0 transition-colors group-hover:text-white"
                    style={{ color: active ? sessionBrand.accent : "#6B7280" }}
                  >
                    <NavIcon name={item.id} />
                  </span>
                  <span className="flex-1 text-left truncate">{item.label}</span>
                  {item.badge != null && item.badge > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0"
                      style={{ background: `${sessionBrand.accent}26`, color: sessionBrand.accent }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="px-3 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-3 px-2 mb-3">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 text-white"
                style={{
                  background: `linear-gradient(135deg, ${sessionBrand.accent}55, ${sessionBrand.accent}22)`,
                  border: `1px solid ${sessionBrand.accent}44`,
                }}
              >
                {greetingName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 leading-tight">
                <div className="text-sm text-white font-medium truncate">{user?.name ?? "Admin"}</div>
                <div className="text-[11px] text-[#6B7280] truncate">{user?.email}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full px-3 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "#9CA3AF",
              }}
            >
              Abmelden
            </button>
          </div>
        </aside>

        {/* ─── MOBILE NAV DRAWER ─────────────────────────────────────── */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] flex">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setMobileNavOpen(false)}
            />
            <aside
              className="relative w-[262px] h-full flex flex-col"
              style={{ background: "#0B0D12", borderRight: "1px solid rgba(255,255,255,0.08)" }}
            >
              <div
                className="px-5 py-5 flex items-center justify-between"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <span className="text-sm font-semibold text-white">{sessionBrand.label}</span>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="text-[#9CA3AF] text-2xl leading-none"
                  aria-label="Schließen"
                >
                  ×
                </button>
              </div>
              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileNavOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium"
                      style={{
                        background: active ? `${sessionBrand.accent}1A` : "transparent",
                        color: active ? "#FFFFFF" : "#9CA3AF",
                      }}
                    >
                      <span style={{ color: active ? sessionBrand.accent : "#6B7280" }}>
                        <NavIcon name={item.id} />
                      </span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge != null && item.badge > 0 && (
                        <span
                          className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                          style={{ background: `${sessionBrand.accent}26`, color: sessionBrand.accent }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>
          </div>
        )}

        {/* ─── MAIN ──────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header
            className="sticky top-0 z-50 backdrop-blur-xl"
            style={{
              background: "rgba(7, 8, 12, 0.78)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div className="px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-4">
              <button
                onClick={() => setMobileNavOpen(true)}
                className="lg:hidden flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-white"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                aria-label="Navigation öffnen"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                  <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
                </svg>
              </button>

              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight truncate">
                  {TAB_TITLE[activeTab]}
                </h1>
                {activeTab === "overview" && (
                  <p className="text-xs sm:text-sm text-[#9CA3AF] truncate">
                    Willkommen zurück, {greetingName}.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div
                  className="hidden sm:flex items-center gap-1 p-1 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {(["24h", "7d", "30d"] as TimeRange[]).map((r) => {
                    const on = timeRange === r;
                    return (
                      <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium transition-all"
                        style={{
                          background: on ? `${sessionBrand.accent}22` : "transparent",
                          color: on ? sessionBrand.accent : "#9CA3AF",
                        }}
                      >
                        {TIME_RANGE_LABEL[r]}
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={handleExport}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#D1D5DB" }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3v12M8 11l4 4 4-4M5 21h14" />
                  </svg>
                  Exportieren
                </button>
                <button
                  onClick={handleNewAnalysis}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all"
                  style={{
                    background: `linear-gradient(135deg, ${sessionBrand.accent}, ${sessionBrand.accent}CC)`,
                    boxShadow: `0 6px 20px ${sessionBrand.accent}40`,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Neue Analyse
                </button>
              </div>
            </div>

            <div
              className="px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-3 border-t"
              style={{ borderColor: "rgba(255,255,255,0.04)" }}
            >
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#6B7280] hidden sm:inline">
                Brand
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {brandOptions.map((opt) => {
                  const active = brandFilter === opt.id;
                  const count =
                    opt.id === "all"
                      ? contacts.length
                      : contacts.filter((c) => (c.brand ?? "nexcel") === opt.id).length;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => setBrandFilter(opt.id)}
                      className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                      style={{
                        background: active ? `${opt.accent}1F` : "transparent",
                        border: `1px solid ${active ? `${opt.accent}55` : "rgba(255,255,255,0.06)"}`,
                        color: active ? opt.accent : "#9CA3AF",
                      }}
                    >
                      {opt.label}
                      <span className="opacity-50 ml-1.5">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="ml-auto hidden md:flex items-center gap-1.5 text-[10px] text-[#6B7280]">
                <span className="relative inline-flex w-1.5 h-1.5">
                  <span className="absolute inset-0 rounded-full bg-[#22C55E] animate-ping opacity-60" />
                  <span className="absolute inset-0 rounded-full bg-[#22C55E]" />
                </span>
                Live · Auto-Refresh
              </div>
            </div>
          </header>

      {/* ─── CONTENT ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ─── COMMAND CENTER ─────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
              <KpiTile
                label="Neue Analysen"
                sub={TIME_RANGE_LABEL[timeRange]}
                value={bucket?.pricingStarts ?? 0}
                accent="#A45CFF"
                trend={trendPct(a?.last24h.pricingStarts, a?.last7d.pricingStarts)}
                emptyHint="Noch keine Analysen"
              />
              <KpiTile
                label="Neue Leads"
                sub={`${stats?.contacts.unread ?? 0} ungelesen`}
                value={bucket?.contacts ?? 0}
                accent="#22C55E"
                trend={trendPct(a?.last24h.contacts, a?.last7d.contacts)}
                emptyHint="Noch keine Leads"
              />
              <KpiTile
                label="Demo-Anfragen"
                sub={`${stats?.demoRequests.pending ?? 0} offen`}
                value={bucket?.demoRequests ?? 0}
                accent="#FBBF24"
                trend={trendPct(a?.last24h.demoRequests, a?.last7d.demoRequests)}
                emptyHint="Keine Anfragen"
              />
              <KpiTile
                label="Pipeline aktiv"
                sub="offene Vorgänge"
                value={activeLeads.filter((c) => !c.read).length + (stats?.demoRequests.pending ?? 0)}
                accent="#5BB8FF"
                emptyHint="Pipeline leer"
              />
              <KpiTile
                label="Conversion Rate"
                sub={`${pipelineSteps[0].value} Analysen`}
                value={conversionRate}
                suffix="%"
                accent="#C6A8FF"
                emptyHint="Noch keine Daten"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <GlassCard
                title="Hot Leads"
                action={
                  activeLeads.length > 0 ? (
                    <button
                      onClick={() => setActiveTab("contacts")}
                      className="text-xs text-[#9CA3AF] hover:text-white transition-colors"
                    >
                      Alle anzeigen →
                    </button>
                  ) : null
                }
              >
                {hotLeads.length === 0 ? (
                  <EmptyState text="Sobald Kontakte eingehen, erscheinen die wichtigsten hier." />
                ) : (
                  <div className="space-y-2">
                    {hotLeads.map(({ c, score }) => (
                      <HotLeadRow
                        key={c.id}
                        contact={c}
                        score={score}
                        onOpen={() => setActiveTab("contacts")}
                      />
                    ))}
                  </div>
                )}
              </GlassCard>

              <GlassCard
                title="Analyse-Pipeline"
                action={<span className="text-[10px] text-[#6B7280]">{TIME_RANGE_LABEL[timeRange]}</span>}
              >
                <PipelineFunnel steps={pipelineSteps} conversionRate={conversionRate} accent={sessionBrand.accent} />
              </GlassCard>

              <GlassCard
                title="Live Aktivität"
                action={activity.length > 0 ? <span className="text-[10px] text-[#6B7280]">{activity.length} Ereignisse</span> : null}
              >
                {activity.length === 0 ? (
                  <EmptyState text="Noch keine Aktivität erfasst." />
                ) : (
                  <div className="space-y-0.5">
                    {activity.map((it) => (
                      <ActivityRow key={it.id} item={it} />
                    ))}
                  </div>
                )}
              </GlassCard>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <GlassCard title="Markenübersicht">
                <div className="grid grid-cols-2 gap-3">
                  <BrandStatCard brandKey="nexcel" stat={brandStat("nexcel")} />
                  <BrandStatCard brandKey="agiworks" stat={brandStat("agiworks")} />
                </div>
              </GlassCard>

              <GlassCard
                title="KI-Priorisierung"
                action={
                  activeLeads.length > 0 ? (
                    <button onClick={() => setActiveTab("contacts")} className="text-xs text-[#9CA3AF] hover:text-white transition-colors">
                      Leads →
                    </button>
                  ) : null
                }
              >
                {activeLeads.length === 0 ? (
                  <EmptyState text="Priorisierung erscheint, sobald Leads vorliegen." />
                ) : (
                  <div className="space-y-2.5">
                    <PriorityRow tier="A" label="Sofort kontaktieren" desc="Hohe Abschlusswahrscheinlichkeit" count={prio.A} color="#22C55E" />
                    <PriorityRow tier="B" label="Diese Woche" desc="Gute Abschlusswahrscheinlichkeit" count={prio.B} color="#FBBF24" />
                    <PriorityRow tier="C" label="Niedrige Priorität" desc="Langfristiges Potenzial" count={prio.C} color="#6B7280" />
                  </div>
                )}
              </GlassCard>

              <GlassCard title="Lead-Herkunft / Quellen">
                {leadOrigins.length === 0 ? (
                  <EmptyState text="Quellen erscheinen, sobald Traffic erfasst wird." />
                ) : (
                  <div className="space-y-2.5">
                    {leadOrigins.map((r) => {
                      const total = leadOrigins.reduce((s, x) => s + x.count, 0) || 1;
                      const pct = Math.round((r.count / total) * 100);
                      return (
                        <div key={r.referrer} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-white truncate max-w-[70%]">{r.referrer}</span>
                            <span className="text-[#9CA3AF] tabular-nums">{r.count}</span>
                          </div>
                          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sessionBrand.accent }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </GlassCard>
            </div>

            <GlassCard title="Analyse-Insights · häufige Themen">
              {topTopics.length === 0 ? (
                <EmptyState text="Sobald Anfragen mit Betreff eingehen, erscheinen hier die häufigsten Themen." />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  {topTopics.map((t) => {
                    const max = topTopics[0].count || 1;
                    const pct = Math.round((t.count / max) * 100);
                    return (
                      <div
                        key={t.label}
                        className="rounded-xl p-3"
                        style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                      >
                        <div className="text-xs text-white font-medium truncate mb-2">{t.label}</div>
                        <div className="text-2xl font-bold text-white tabular-nums leading-none mb-2">{t.count}</div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: sessionBrand.accent }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* ─── ANALYSEN ───────────────────────────────────────────────── */}
        {activeTab === "analysen" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KpiTile label="Analysen gestartet" sub="gesamt" value={a?.total.pricingStarts ?? 0} accent="#A45CFF" emptyHint="Keine Analysen" />
              <KpiTile label="Angebote berechnet" sub="gesamt" value={a?.total.pricingQuotes ?? 0} accent="#8B7CFF" emptyHint="Keine Angebote" />
              <KpiTile label="Analysen beendet" sub="gesamt" value={a?.total.pricingSubmits ?? 0} accent="#5BB8FF" emptyHint="Keine Abschlüsse" />
              <KpiTile label="Uploads" sub="gesamt" value={a?.total.uploads ?? 0} accent="#F472B6" emptyHint="Keine Uploads" />
            </div>
            <GlassCard
              title="Analyse-Funnel"
              action={<button onClick={() => setActiveTab("pipeline")} className="text-xs text-[#9CA3AF] hover:text-white transition-colors">Pipeline →</button>}
            >
              <PipelineFunnel steps={pipelineSteps} conversionRate={conversionRate} accent={sessionBrand.accent} large />
            </GlassCard>
          </div>
        )}

        {/* ─── PIPELINE ───────────────────────────────────────────────── */}
        {activeTab === "pipeline" && (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <GlassCard title="Conversion-Pipeline">
                <PipelineFunnel steps={pipelineSteps} conversionRate={conversionRate} accent={sessionBrand.accent} large />
              </GlassCard>
            </div>
            <GlassCard title="Priorisierung">
              {activeLeads.length === 0 ? (
                <EmptyState text="Sobald Leads vorliegen, erscheint die Priorisierung." />
              ) : (
                <div className="space-y-2.5">
                  <PriorityRow tier="A" label="Sofort kontaktieren" desc="Hohe Abschlusswahrscheinlichkeit" count={prio.A} color="#22C55E" />
                  <PriorityRow tier="B" label="Diese Woche" desc="Gute Abschlusswahrscheinlichkeit" count={prio.B} color="#FBBF24" />
                  <PriorityRow tier="C" label="Niedrige Priorität" desc="Langfristiges Potenzial" count={prio.C} color="#6B7280" />
                </div>
              )}
            </GlassCard>
          </div>
        )}

        {/* ─── UNTERNEHMEN ────────────────────────────────────────────── */}
        {activeTab === "unternehmen" && (
          <GlassCard title="Unternehmen">
            {(() => {
              const map = new Map<string, { count: number; brand?: "agiworks" | "nexcel"; last: string }>();
              activeLeads.forEach((c) => {
                const key = (c.unternehmen || "").trim();
                if (!key) return;
                const ex = map.get(key);
                if (ex) {
                  ex.count++;
                  if (new Date(c.createdAt) > new Date(ex.last)) ex.last = c.createdAt;
                } else {
                  map.set(key, { count: 1, brand: c.brand, last: c.createdAt });
                }
              });
              const rows = Array.from(map.entries())
                .map(([name, v]) => ({ name, ...v }))
                .sort((x, y) => y.count - x.count);
              if (rows.length === 0)
                return <EmptyState text="Sobald Leads mit Firmenangabe eingehen, erscheinen Unternehmen hier." />;
              return (
                <div className="space-y-2">
                  {rows.map((r) => (
                    <div
                      key={r.name}
                      className="flex items-center gap-3 p-3 rounded-xl"
                      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0"
                        style={{ background: `${sessionBrand.accent}22`, color: sessionBrand.accent }}
                      >
                        {r.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-white font-medium truncate">{r.name}</div>
                        <div className="text-[11px] text-[#6B7280]">Letzter Kontakt {relTimeShort(r.last)}</div>
                      </div>
                      <BrandChip brand={r.brand} />
                      <span className="text-xs text-[#9CA3AF] tabular-nums flex-shrink-0">
                        {r.count} Lead{r.count > 1 ? "s" : ""}
                      </span>
                    </div>
                  ))}
                </div>
              );
            })()}
          </GlassCard>
        )}

        {/* ─── AUTOMATIONEN ───────────────────────────────────────────── */}
        {activeTab === "automationen" && (
          <PlaceholderView
            accent={sessionBrand.accent}
            icon="automationen"
            title="Automationen"
            text="Workflows & Trigger werden hier verfügbar. Sobald Automationsregeln aktiv sind, erscheinen sie in diesem Bereich."
          />
        )}

        {/* ─── EINSTELLUNGEN ──────────────────────────────────────────── */}
        {activeTab === "settings" && (
          <PlaceholderView
            accent={sessionBrand.accent}
            icon="settings"
            title="Einstellungen"
            text="Konto- und Workspace-Einstellungen. Angemeldet als"
            email={user?.email}
            onLogout={handleLogout}
          />
        )}

        {/* Contacts Tab - POST-FEED wie Bewertungen */}
        {activeTab === "contacts" && (
          <GlassCard title={`Kontakt-Posts${brandFilter !== "all" ? ` · ${BRAND_META[brandFilter].label}` : ""}`}>
            {/* FEHLERANZEIGE - DETAILLIERT! */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-6 rounded-xl bg-red-500/10 border border-red-500/30"
              >
                <div className="flex items-start gap-3 mb-4">
                  <svg className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-red-400 mb-2">Fehler beim Laden der Posts</h3>
                    <p className="text-red-300 mb-4">{error}</p>
                    {errorDetails && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-red-300 hover:text-red-200 text-sm font-medium mb-2">
                          Detaillierte Fehlerinformationen anzeigen
                        </summary>
                        <pre className="mt-2 p-4 bg-black/30 rounded-lg text-xs text-red-200 overflow-auto max-h-96">
                          {JSON.stringify(errorDetails, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
            
            <div className="space-y-0">
              {filteredContacts.length === 0 && !error ? (
                <div className="text-center py-12 text-[#9CA3AF]">
                  Noch keine Posts vorhanden
                  {brandFilter !== "all" && (
                    <span className="block text-xs mt-2 opacity-70">
                      (Filter aktiv: {BRAND_META[brandFilter].label})
                    </span>
                  )}
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <ContactRow key={contact.id} contact={contact} onMarkRead={() => markAsRead("contact", contact.id)} />
                ))
              )}
            </div>
          </GlassCard>
        )}

        {/* Demo Requests Tab */}
        {activeTab === "demo" && (
          <GlassCard title={`Demo-Anfragen${brandFilter !== "all" ? ` · ${BRAND_META[brandFilter].label}` : ""}`}>
            <div className="space-y-3">
              {filteredDemoRequests.map((request) => (
                <DemoRequestRow key={request.id} request={request} onMarkRead={() => markAsRead("demo", request.id)} />
              ))}
              {filteredDemoRequests.length === 0 && (
                <div className="text-center py-12 text-[#9CA3AF]">
                  Noch keine Demo-Anfragen
                  {brandFilter !== "all" && (
                    <span className="block text-xs mt-2 opacity-70">
                      (Filter aktiv: {BRAND_META[brandFilter].label})
                    </span>
                  )}
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && stats && (
          <AnalyticsPanel
            stats={stats}
            brandAccent={sessionBrand.accent}
            brandFilter={brandFilter}
          />
        )}
        </main>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────── Command-Center-Komponenten ─────────────────── */

function KpiTile({
  label,
  value,
  sub,
  accent,
  trend,
  suffix,
  emptyHint,
}: {
  label: string;
  value: number | null;
  sub?: string;
  accent: string;
  trend?: number | null;
  suffix?: string;
  emptyHint?: string;
}) {
  const isEmpty = value == null || value === 0;
  const display = value == null ? "—" : `${value}${suffix ?? ""}`;
  return (
    <motion.div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.012) 100%)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
      whileHover={{ y: -2, borderColor: `${accent}3A` as any }}
      transition={{ duration: 0.18 }}
    >
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${accent}AA, transparent 78%)` }} />
      <div className="flex items-start justify-between mb-2 gap-2">
        <span className="text-[10px] uppercase tracking-[0.16em] text-[#6B7280]">{label}</span>
        {trend != null && !isEmpty && (
          <span
            className="text-[10px] font-semibold tabular-nums flex items-center gap-0.5"
            style={{ color: trend >= 0 ? "#22C55E" : "#EF4444" }}
          >
            {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="text-3xl font-bold tabular-nums leading-none mb-1.5" style={{ color: isEmpty ? "#4B5563" : "#FFFFFF" }}>
        {display}
      </div>
      <div className="text-[11px] text-[#6B7280] truncate">{isEmpty ? emptyHint ?? sub : sub}</div>
    </motion.div>
  );
}

function PipelineFunnel({
  steps,
  conversionRate,
  accent,
  large,
}: {
  steps: { label: string; value: number; color: string }[];
  conversionRate: number | null;
  accent: string;
  large?: boolean;
}) {
  const start = Math.max(1, steps[0]?.value ?? 0);
  const hasData = (steps[0]?.value ?? 0) > 0;
  return (
    <div className={large ? "space-y-4" : "space-y-2.5"}>
      {steps.map((s) => {
        const barPct = (s.value / start) * 100;
        const pctOfStart = Math.round((s.value / start) * 100);
        return (
          <div key={s.label}>
            <div className="flex justify-between items-baseline mb-1">
              <span className={`${large ? "text-sm" : "text-xs"} text-white`}>{s.label}</span>
              <span className="text-xs tabular-nums">
                <span className="text-white font-semibold">{s.value}</span>
                {hasData && <span className="text-[#6B7280] ml-2">{pctOfStart}%</span>}
              </span>
            </div>
            <div className={`${large ? "h-2.5" : "h-2"} rounded-full overflow-hidden`} style={{ background: "rgba(255,255,255,0.05)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.max(barPct, s.value > 0 ? 4 : 0)}%`, background: `linear-gradient(90deg, ${s.color}, ${s.color}AA)` }}
              />
            </div>
          </div>
        );
      })}
      <div className="flex items-center justify-between pt-3 mt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <span className="text-xs text-[#9CA3AF]">Conversion Rate</span>
        <span className="text-lg font-bold tabular-nums" style={{ color: conversionRate != null ? "#22C55E" : "#6B7280" }}>
          {conversionRate != null ? `${conversionRate}%` : "—"}
        </span>
      </div>
      {!hasData && <div className="text-[10px] text-[#6B7280]">Sobald Analysen starten, füllt sich die Pipeline. <span style={{ color: accent }}>·</span> Live</div>}
    </div>
  );
}

function ActivityRow({
  item,
}: {
  item: { id: string; ts: string; kind: string; title: string; sub?: string; brand?: "agiworks" | "nexcel"; color: string };
}) {
  return (
    <div className="flex items-start gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.02] transition-colors">
      <span className="mt-1 w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-white">{item.kind}</span>
          {item.brand && <BrandChip brand={item.brand} />}
        </div>
        <div className="text-[11px] text-[#9CA3AF] truncate">
          {item.title}
          {item.sub ? ` · ${item.sub}` : ""}
        </div>
      </div>
      <span className="text-[10px] text-[#6B7280] whitespace-nowrap flex-shrink-0">{relTimeShort(item.ts)}</span>
    </div>
  );
}

function HotLeadRow({
  contact,
  score,
  onOpen,
}: {
  contact: Contact;
  score: number;
  onOpen: () => void;
}) {
  const tier = priorityBucket(score);
  const tierColor = tier === "A" ? "#22C55E" : tier === "B" ? "#FBBF24" : "#6B7280";
  const tierLabel = tier === "A" ? "Heiß" : tier === "B" ? "Warm" : "Kalt";
  return (
    <button
      onClick={onOpen}
      className="w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all hover:bg-white/[0.03]"
      style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${tierColor}55, ${tierColor}22)`, border: `1px solid ${tierColor}44` }}
      >
        {contact.name.charAt(0).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white font-medium truncate">{contact.unternehmen || contact.name}</span>
          {!contact.read && <span className="w-1.5 h-1.5 rounded-full bg-[#A45CFF] flex-shrink-0" />}
        </div>
        <div className="text-[11px] text-[#6B7280] truncate">
          {contact.unternehmen ? contact.name : contact.email} · {relTimeShort(contact.createdAt)}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[9px] uppercase tracking-wider text-[#6B7280]">Score</div>
        <div className="text-sm font-bold tabular-nums" style={{ color: tierColor }}>{score}</div>
      </div>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0" style={{ background: `${tierColor}22`, color: tierColor }}>
        {tierLabel}
      </span>
    </button>
  );
}

function PriorityRow({
  tier,
  label,
  desc,
  count,
  color,
}: {
  tier: "A" | "B" | "C";
  label: string;
  desc: string;
  count: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: `${color}1F`, color, border: `1px solid ${color}44` }}
      >
        {tier}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm text-white font-medium truncate">Priorität {tier} · {label}</div>
        <div className="text-[11px] text-[#6B7280] truncate">{desc}</div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-lg font-bold tabular-nums text-white">{count}</div>
        <div className="text-[9px] uppercase tracking-wider text-[#6B7280]">Leads</div>
      </div>
    </div>
  );
}

function BrandStatCard({
  brandKey,
  stat,
}: {
  brandKey: "nexcel" | "agiworks";
  stat: { leads: number; demos: number; events: number };
}) {
  const meta = BRAND_META[brandKey];
  const empty = stat.leads === 0 && stat.demos === 0 && stat.events === 0;
  return (
    <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${meta.accent}22` }}>
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: `linear-gradient(90deg, ${meta.accent}, transparent 80%)` }} />
      <div className="flex items-center gap-2 mb-3">
        <span className="w-2 h-2 rounded-full" style={{ background: meta.accent }} />
        <span className="text-xs font-semibold" style={{ color: meta.accent }}>{meta.label}</span>
      </div>
      <div className="space-y-2">
        <div className="flex justify-between text-xs"><span className="text-[#9CA3AF]">Leads</span><span className="text-white font-semibold tabular-nums">{stat.leads}</span></div>
        <div className="flex justify-between text-xs"><span className="text-[#9CA3AF]">Demo-Anfragen</span><span className="text-white font-semibold tabular-nums">{stat.demos}</span></div>
        <div className="flex justify-between text-xs"><span className="text-[#9CA3AF]">Aktivität</span><span className="text-white font-semibold tabular-nums">{stat.events}</span></div>
      </div>
      {empty && <div className="text-[10px] text-[#6B7280] mt-3">Noch keine Daten</div>}
    </div>
  );
}

function PlaceholderView({
  accent,
  icon,
  title,
  text,
  email,
  onLogout,
}: {
  accent: string;
  icon: TabId;
  title: string;
  text: string;
  email?: string;
  onLogout?: () => void;
}) {
  return (
    <div
      className="rounded-2xl p-10 sm:p-14 text-center"
      style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))", border: "1px solid rgba(255,255,255,0.06)" }}
    >
      <div
        className="w-14 h-14 rounded-2xl mx-auto mb-5 flex items-center justify-center"
        style={{ background: `${accent}18`, border: `1px solid ${accent}33`, color: accent }}
      >
        <NavIcon name={icon} />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">{title}</h2>
      <p className="text-sm text-[#9CA3AF] max-w-md mx-auto leading-relaxed">
        {text}
        {email ? ` ${email}.` : ""}
      </p>
      {onLogout && (
        <button
          onClick={onLogout}
          className="mt-6 px-4 py-2 rounded-lg text-xs font-medium transition-all hover:bg-white/5"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#9CA3AF" }}
        >
          Abmelden
        </button>
      )}
    </div>
  );
}

function KPICard({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: number;
  hint: string;
  accent: string;
}) {
  return (
    <motion.div
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.015) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
        boxShadow: "0 1px 0 rgba(255, 255, 255, 0.03) inset",
      }}
      whileHover={{ y: -1, borderColor: `${accent}33` as any }}
      transition={{ duration: 0.18 }}
    >
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accent}AA, transparent 75%)` }}
      />
      <div className="text-[10px] uppercase tracking-[0.18em] text-[#6B7280] mb-2">
        {label}
      </div>
      <div className="flex items-baseline gap-2 mb-2">
        <span
          className="text-3xl font-bold tabular-nums leading-none"
          style={{ color: value > 0 ? "white" : "#6B7280" }}
        >
          {value}
        </span>
      </div>
      <div className="text-[11px] text-[#9CA3AF] leading-relaxed">{hint}</div>
    </motion.div>
  );
}

function GlassCard({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5 h-full"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-white tracking-wide">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 px-4">
      <div
        className="w-10 h-10 rounded-full mx-auto mb-3 flex items-center justify-center"
        style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span className="text-[#6B7280] text-lg">∅</span>
      </div>
      <p className="text-xs text-[#6B7280]">{text}</p>
    </div>
  );
}

function ContactRow({ contact, onMarkRead }: { contact: Contact; onMarkRead: () => void }) {
  // POST-ANSICHT wie Bewertung/Forum-Post
  const timeAgo = (date: string) => {
    const now = new Date();
    const postDate = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - postDate.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "gerade eben";
    if (diffInSeconds < 3600) return `vor ${Math.floor(diffInSeconds / 60)} Min`;
    if (diffInSeconds < 86400) return `vor ${Math.floor(diffInSeconds / 3600)} Std`;
    return postDate.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <motion.div
      className="p-5 rounded-2xl mb-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: contact.read 
          ? "rgba(255, 255, 255, 0.02)" 
          : "rgba(164, 92, 255, 0.08)",
        border: `1px solid ${contact.read ? "rgba(255, 255, 255, 0.05)" : "rgba(164, 92, 255, 0.2)"}`,
        boxShadow: contact.read ? "none" : "0 4px 20px rgba(164, 92, 255, 0.1)",
      }}
    >
      {/* POST-HEADER wie Bewertung */}
      <div className="flex items-start gap-4 mb-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, rgba(164, 92, 255, 0.4), rgba(198, 168, 255, 0.4))",
            border: "2px solid rgba(164, 92, 255, 0.3)",
          }}
        >
          {contact.name.charAt(0).toUpperCase()}
        </div>

        {/* Post-Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-white text-base">{contact.name}</span>
            {!contact.read && (
              <span className="w-2 h-2 rounded-full bg-[#A45CFF] animate-pulse" />
            )}
            <BrandChip brand={contact.brand} />
            <span className="text-xs text-[#9CA3AF]">•</span>
            <span className="text-xs text-[#9CA3AF]">{timeAgo(contact.createdAt)}</span>
          </div>
          
          {/* Kontaktdaten wie Post-Metadaten */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-[#9CA3AF] mb-3">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {contact.email}
            </span>
            {contact.telefon && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                {contact.telefon}
              </span>
            )}
            {contact.unternehmen && (
              <span className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {contact.unternehmen}
              </span>
            )}
          </div>
        </div>

        {/* Mark as Read Button */}
        {!contact.read && (
          <motion.button
            onClick={onMarkRead}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white flex-shrink-0"
            style={{
              background: "rgba(164, 92, 255, 0.2)",
              border: "1px solid rgba(164, 92, 255, 0.3)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Gelesen
          </motion.button>
        )}
      </div>

      {/* POST-CONTENT wie Bewertung */}
      {contact.betreff && (
        <div className="mb-3">
          <span className="text-sm font-semibold text-[#A45CFF]">📌 {contact.betreff}</span>
        </div>
      )}
      
      <div className="text-[#E5E7EB] text-base leading-relaxed whitespace-pre-wrap mb-4">
        {contact.nachricht}
      </div>

      {/* POST-FOOTER */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <span className="text-xs text-[#9CA3AF]">
          {new Date(contact.createdAt).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        <span className="text-xs px-2 py-1 rounded" style={{
          background: contact.status === "open" ? "rgba(164, 92, 255, 0.2)" : "rgba(107, 114, 128, 0.2)",
          color: contact.status === "open" ? "#A45CFF" : "#9CA3AF",
        }}>
          {contact.status === "open" ? "Offen" : contact.status === "read" ? "Gelesen" : "Archiviert"}
        </span>
      </div>
    </motion.div>
  );
}

function DemoRequestRow({ request, onMarkRead }: { request: DemoRequest; onMarkRead: () => void }) {
  const statusColors = {
    pending: "rgba(251, 191, 36, 0.2)",
    approved: "rgba(34, 197, 94, 0.2)",
    rejected: "rgba(239, 68, 68, 0.2)",
    expired: "rgba(107, 114, 128, 0.2)",
  };

  return (
    <div
      className="p-4 rounded-xl"
      style={{
        background: request.read ? "rgba(255, 255, 255, 0.03)" : "rgba(164, 92, 255, 0.1)",
        border: `1px solid ${request.read ? "rgba(255, 255, 255, 0.05)" : "rgba(164, 92, 255, 0.3)"}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="font-semibold text-white">{request.name}</span>
            {!request.read && (
              <span className="w-2 h-2 rounded-full bg-[#A45CFF]" />
            )}
            <BrandChip brand={request.brand} />
            <span
              className="px-2 py-0.5 rounded text-xs font-medium"
              style={{
                background: statusColors[request.status],
                color: request.status === "pending" ? "#FBBF24" : request.status === "approved" ? "#22C55E" : request.status === "rejected" ? "#EF4444" : "#6B7280",
              }}
            >
              {request.status === "pending" ? "Ausstehend" : request.status === "approved" ? "Genehmigt" : request.status === "rejected" ? "Abgelehnt" : "Abgelaufen"}
            </span>
          </div>
          <div className="text-sm text-[#9CA3AF] mb-2">{request.email}</div>
          {request.unternehmen && (
            <div className="text-xs text-[#9CA3AF] mb-2">Unternehmen: {request.unternehmen}</div>
          )}
          {request.expiresAt && (
            <div className="text-xs text-[#9CA3AF]">
              Läuft ab: {new Date(request.expiresAt).toLocaleDateString("de-DE")}
            </div>
          )}
          <div className="text-xs text-[#9CA3AF] mt-2">
            {new Date(request.createdAt).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        {!request.read && (
          <motion.button
            onClick={onMarkRead}
            className="ml-4 px-3 py-1 rounded-lg text-xs font-medium text-white"
            style={{
              background: "rgba(164, 92, 255, 0.2)",
              border: "1px solid rgba(164, 92, 255, 0.3)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Als gelesen
          </motion.button>
        )}
      </div>
    </div>
  );
}

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[#9CA3AF]">{label}</span>
      <span className="text-2xl font-bold text-white">{value}</span>
    </div>
  );
}

function BrandChip({ brand }: { brand?: "agiworks" | "nexcel" }) {
  const key = brand === "agiworks" ? "agiworks" : "nexcel";
  const meta = BRAND_META[key];
  return (
    <span
      className="px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase"
      style={{
        background: meta.glow,
        color: meta.accent,
        border: `1px solid ${meta.accent}55`,
      }}
    >
      {meta.label}
    </span>
  );
}

/* ───────────────────────── Analytics Panel ────────────────────────── */

const EVENT_LABEL: Record<string, { label: string; color: string }> = {
  page_view: { label: "Page View", color: "#9CA3AF" },
  scroll_depth: { label: "Scroll", color: "#5BB8FF" },
  dwell: { label: "Dwell", color: "#9CA3AF" },
  outbound_click: { label: "Outbound", color: "#F472B6" },
  visibility_change: { label: "Visibility", color: "#6B7280" },
  contact_submit: { label: "Contact ✓", color: "#22C55E" },
  demo_request: { label: "Demo ✓", color: "#22C55E" },
  lead_submit: { label: "Lead ✓", color: "#22C55E" },
  pricing_start: { label: "Pricing Start", color: "#FBBF24" },
  pricing_step: { label: "Pricing Step", color: "#FBBF24" },
  pricing_quote: { label: "Quote", color: "#FBBF24" },
  pricing_submit: { label: "Pricing ✓", color: "#22C55E" },
  pricing_abandon: { label: "Abandon", color: "#EF4444" },
  upload_start: { label: "Upload…", color: "#A45CFF" },
  upload_complete: { label: "Upload ✓", color: "#22C55E" },
  upload_fail: { label: "Upload ✗", color: "#EF4444" },
  click: { label: "Click", color: "#9CA3AF" },
  event: { label: "Event", color: "#9CA3AF" },
};

function relTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 5) return "gerade eben";
  if (sec < 60) return `vor ${sec} s`;
  if (sec < 3600) return `vor ${Math.floor(sec / 60)} min`;
  if (sec < 86400) return `vor ${Math.floor(sec / 3600)} h`;
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function AnalyticsPanel({
  stats,
  brandAccent,
  brandFilter,
}: {
  stats: Stats;
  brandAccent: string;
  brandFilter: BrandFilter;
}) {
  const a = stats.analytics;
  const live = a.live?.visitors ?? 0;
  const funnel = a.funnel ?? {
    pageView: 0,
    pricingStart: 0,
    pricingQuote: 0,
    pricingSubmit: 0,
    contactSubmit: 0,
  };
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const recentEvents = a.recentEvents ?? [];
  const recentSessions = a.recentSessions ?? [];
  const topPagesDetailed = a.topPagesDetailed ?? [];
  const topReferrers = a.topReferrers ?? [];
  const deviceMix = a.deviceMix ?? [];
  const brandSplit = a.brandSplit ?? [];
  const scrollHist = a.scrollDepthHistogram ?? [];

  const totalDevice = deviceMix.reduce((acc, d) => acc + d.count, 0);
  const totalBrand = brandSplit.reduce((acc, b) => acc + b.count, 0);
  const maxScrollBar = Math.max(1, ...scrollHist.map((s) => s.count));

  return (
    <div className="space-y-4">
      {/* Live-Header */}
      <div
        className="rounded-2xl px-5 py-4 flex items-center gap-4 flex-wrap"
        style={{
          background:
            "linear-gradient(180deg, rgba(34, 197, 94, 0.06) 0%, rgba(255,255,255,0.01) 100%)",
          border: "1px solid rgba(34, 197, 94, 0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <span className="relative inline-flex w-3 h-3">
            <span className="absolute inset-0 rounded-full bg-[#22C55E] animate-ping opacity-60" />
            <span className="absolute inset-0 rounded-full bg-[#22C55E]" />
          </span>
          <span className="text-xs uppercase tracking-[0.18em] text-[#22C55E]">
            Live · letzte 90 s
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white tabular-nums">{live}</span>
          <span className="text-xs text-[#9CA3AF]">aktive Besucher</span>
        </div>
        <div className="ml-auto text-[11px] text-[#6B7280]">
          {brandFilter === "all" ? "Alle Brands" : BRAND_META[brandFilter as "nexcel" | "agiworks"]?.label} · Auto-Refresh 2s
        </div>
      </div>

      {/* KPI-Reihe */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
        <MiniKPI label="Page Views · 24h" value={a.last24h.pageViews} accent={brandAccent} />
        <MiniKPI label="Sessions · 24h" value={a.last24h.sessions ?? 0} accent="#5BB8FF" />
        <MiniKPI label="Pricing-Starts · 24h" value={a.last24h.pricingStarts ?? 0} accent="#FBBF24" />
        <MiniKPI label="Uploads · 24h" value={a.last24h.uploads ?? 0} accent="#F472B6" />
        <MiniKPI label="Kontakte · 24h" value={a.last24h.contacts} accent="#22C55E" />
        <MiniKPI label="Demo · 24h" value={a.last24h.demoRequests} accent="#22C55E" />
      </div>

      {/* Funnel + Live Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-1">
          <GlassCard title="Conversion-Funnel · gesamt">
            <Funnel funnel={funnel} accent={brandAccent} />
          </GlassCard>
        </div>
        <div className="xl:col-span-2">
          <GlassCard
            title="Live-Event-Feed"
            action={
              <span className="text-[10px] text-[#6B7280]">
                {recentEvents.length} Events
              </span>
            }
          >
            <div className="max-h-[420px] overflow-y-auto pr-2 space-y-1.5">
              {recentEvents.length === 0 ? (
                <EmptyState text="Noch keine Events erfasst" />
              ) : (
                recentEvents.map((e) => (
                  <EventRow key={e.id} ev={e} onPickSession={setSelectedSession} />
                ))
              )}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Top Pages + Top Referrer */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlassCard title="Top Seiten · Views, Avg. Scroll & Dwell">
          {topPagesDetailed.length === 0 ? (
            <EmptyState text="Noch keine Page-Views" />
          ) : (
            <div className="space-y-2">
              {topPagesDetailed.map((p) => (
                <PageBar key={p.page} page={p} accent={brandAccent} />
              ))}
            </div>
          )}
        </GlassCard>
        <GlassCard title="Top Referrer">
          {topReferrers.length === 0 ? (
            <EmptyState text="Keine Referrer-Daten" />
          ) : (
            <div className="space-y-2">
              {topReferrers.map((r) => {
                const total = topReferrers.reduce((a, b) => a + b.count, 0);
                const pct = total > 0 ? (r.count / total) * 100 : 0;
                return (
                  <div key={r.referrer} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-white truncate max-w-[70%]">{r.referrer}</span>
                      <span className="text-[#9CA3AF] tabular-nums">{r.count}</span>
                    </div>
                    <div
                      className="h-1 rounded-full overflow-hidden"
                      style={{ background: "rgba(255,255,255,0.04)" }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: brandAccent }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Device, Brand, Scroll */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <GlassCard title="Device-Mix">
          {deviceMix.length === 0 ? (
            <EmptyState text="Keine Device-Daten" />
          ) : (
            <div className="space-y-3">
              {deviceMix.map((d) => {
                const pct = totalDevice > 0 ? (d.count / totalDevice) * 100 : 0;
                return (
                  <div key={d.device}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-white capitalize">{d.device}</span>
                      <span className="text-[#9CA3AF] tabular-nums">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="h-full" style={{ width: `${pct}%`, background: "#5BB8FF" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
        <GlassCard title="Brand-Split">
          {brandSplit.length === 0 ? (
            <EmptyState text="Keine Brand-Daten" />
          ) : (
            <div className="space-y-3">
              {brandSplit.map((b) => {
                const pct = totalBrand > 0 ? (b.count / totalBrand) * 100 : 0;
                const meta = BRAND_META[b.brand];
                return (
                  <div key={b.brand}>
                    <div className="flex justify-between text-xs mb-1">
                      <span style={{ color: meta.accent }}>{meta.label}</span>
                      <span className="text-[#9CA3AF] tabular-nums">{Math.round(pct)}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <div className="h-full" style={{ width: `${pct}%`, background: meta.accent }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </GlassCard>
        <GlassCard title="Scroll-Tiefe (alle Pages)">
          {scrollHist.every((s) => s.count === 0) ? (
            <EmptyState text="Noch keine Scrolls" />
          ) : (
            <div className="space-y-2">
              {scrollHist.map((s) => (
                <div key={s.bucket} className="flex items-center gap-3">
                  <span className="text-xs text-[#9CA3AF] w-14">{s.bucket}%</span>
                  <div
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ background: "rgba(255,255,255,0.04)" }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(s.count / maxScrollBar) * 100}%`,
                        background: brandAccent,
                      }}
                    />
                  </div>
                  <span className="text-xs text-white tabular-nums w-10 text-right">
                    {s.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>

      {/* Recent Sessions */}
      <GlassCard
        title="Sessions"
        action={<span className="text-[10px] text-[#6B7280]">{recentSessions.length} angezeigt</span>}
      >
        {recentSessions.length === 0 ? (
          <EmptyState text="Noch keine Sessions" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[#6B7280] uppercase tracking-wider text-[10px]">
                  <th className="text-left py-2 px-2 font-medium">Session</th>
                  <th className="text-left py-2 px-2 font-medium">Brand</th>
                  <th className="text-left py-2 px-2 font-medium">Device</th>
                  <th className="text-right py-2 px-2 font-medium">Views</th>
                  <th className="text-right py-2 px-2 font-medium">Events</th>
                  <th className="text-right py-2 px-2 font-medium">Dauer</th>
                  <th className="text-right py-2 px-2 font-medium">Scroll</th>
                  <th className="text-left py-2 px-2 font-medium">Status</th>
                  <th className="text-right py-2 px-2 font-medium">Letzte Aktivität</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((s) => (
                  <tr
                    key={s.sessionId}
                    onClick={() =>
                      setSelectedSession((cur) => (cur === s.sessionId ? null : s.sessionId))
                    }
                    className="cursor-pointer hover:bg-white/[0.02]"
                    style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
                  >
                    <td className="py-2 px-2 font-mono text-[10px] text-white">
                      {s.sessionId.slice(0, 16)}…
                    </td>
                    <td className="py-2 px-2">
                      <BrandChip brand={s.brand} />
                    </td>
                    <td className="py-2 px-2 text-[#9CA3AF] capitalize">{s.device ?? "—"}</td>
                    <td className="py-2 px-2 text-right text-white tabular-nums">{s.pageViews}</td>
                    <td className="py-2 px-2 text-right text-[#9CA3AF] tabular-nums">{s.events}</td>
                    <td className="py-2 px-2 text-right text-[#9CA3AF] tabular-nums">
                      {s.durationSec}s
                    </td>
                    <td className="py-2 px-2 text-right text-[#9CA3AF] tabular-nums">
                      {s.maxScroll}%
                    </td>
                    <td className="py-2 px-2">
                      {s.converted ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#22C55E]/15 text-[#22C55E]">
                          Konvertiert
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#6B7280]">offen</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-right text-[#9CA3AF]">{relTime(s.lastSeen)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      {/* Session-Drilldown */}
      {selectedSession && (
        <SessionDetail
          sessionId={selectedSession}
          events={recentEvents.filter((e) => e.sessionId === selectedSession)}
          onClose={() => setSelectedSession(null)}
        />
      )}
    </div>
  );
}

function MiniKPI({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div
      className="rounded-xl p-3 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)",
        border: "1px solid rgba(255, 255, 255, 0.06)",
      }}
    >
      <div
        className="absolute top-0 left-0 w-full h-[2px]"
        style={{ background: `linear-gradient(90deg, ${accent}AA, transparent 75%)` }}
      />
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#6B7280] mb-1.5">
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums text-white leading-none">{value}</div>
    </div>
  );
}

function Funnel({
  funnel,
  accent,
}: {
  funnel: {
    pageView: number;
    pricingStart: number;
    pricingQuote: number;
    pricingSubmit: number;
    contactSubmit: number;
  };
  accent: string;
}) {
  const steps = [
    { label: "Page Views", value: funnel.pageView, color: "#5BB8FF" },
    { label: "Preiskalkulator gestartet", value: funnel.pricingStart, color: "#FBBF24" },
    { label: "Angebot berechnet", value: funnel.pricingQuote, color: "#FBBF24" },
    { label: "Angebot abgeschickt", value: funnel.pricingSubmit, color: "#22C55E" },
    { label: "Kontaktanfrage", value: funnel.contactSubmit, color: "#22C55E" },
  ];
  const max = Math.max(1, ...steps.map((s) => s.value));
  return (
    <div className="space-y-2.5">
      {steps.map((s, idx) => {
        const pct = (s.value / max) * 100;
        const prev = idx > 0 ? steps[idx - 1].value : 0;
        const conv = idx > 0 && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={s.label}>
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-xs text-white">{s.label}</span>
              <span className="text-xs tabular-nums">
                <span className="text-white font-semibold">{s.value}</span>
                {conv !== null && (
                  <span className="text-[#6B7280] ml-2">{conv}% Conv.</span>
                )}
              </span>
            </div>
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ background: "rgba(255,255,255,0.04)" }}
            >
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, background: s.color }}
              />
            </div>
          </div>
        );
      })}
      <div
        className="text-[10px] text-[#6B7280] mt-2 pt-2 border-t"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        Conv. = relative Conversion-Rate gegenüber dem vorherigen Schritt
        <span style={{ color: accent }}> ·</span> sessions-übergreifend
      </div>
    </div>
  );
}

function EventRow({
  ev,
  onPickSession,
}: {
  ev: AnalyticsEventLite;
  onPickSession: (id: string) => void;
}) {
  const meta = EVENT_LABEL[ev.type] ?? { label: ev.type, color: "#9CA3AF" };
  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs hover:bg-white/[0.02] cursor-pointer"
      onClick={() => onPickSession(ev.sessionId)}
    >
      <span className="w-[10px] h-[10px] rounded-full flex-shrink-0" style={{ background: meta.color }} />
      <span
        className="px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0"
        style={{ background: `${meta.color}1A`, color: meta.color }}
      >
        {meta.label}
      </span>
      <span className="text-[#9CA3AF] truncate flex-1 font-mono text-[11px]">{ev.page}</span>
      <BrandChip brand={ev.brand} />
      {typeof ev.value === "number" && (
        <span className="text-[#6B7280] tabular-nums text-[10px]">{ev.value}</span>
      )}
      <span className="text-[#6B7280] text-[10px] whitespace-nowrap">{relTime(ev.ts)}</span>
    </div>
  );
}

function PageBar({
  page,
  accent,
}: {
  page: { page: string; views: number; avgScroll: number; avgDwellSec: number };
  accent: string;
}) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline text-xs">
        <span className="text-white font-mono text-[11px] truncate max-w-[60%]">{page.page}</span>
        <span className="text-[#9CA3AF] tabular-nums">
          {page.views} Views · {page.avgScroll}% Scroll · {page.avgDwellSec}s
        </span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.04)" }}>
        <div className="h-full" style={{ width: `${Math.min(100, page.avgScroll)}%`, background: accent }} />
      </div>
    </div>
  );
}

function SessionDetail({
  sessionId,
  events,
  onClose,
}: {
  sessionId: string;
  events: AnalyticsEventLite[];
  onClose: () => void;
}) {
  const sorted = events.slice().sort((a, b) => a.ts.localeCompare(b.ts));
  return (
    <GlassCard
      title={`Session-Journey · ${sessionId.slice(0, 18)}…`}
      action={
        <button
          onClick={onClose}
          className="text-xs text-[#9CA3AF] hover:text-white transition-colors"
        >
          Schließen ×
        </button>
      }
    >
      {sorted.length === 0 ? (
        <EmptyState text="Keine geladenen Events für diese Session — sie liegt evtl. außerhalb der letzten 80 Events." />
      ) : (
        <div className="relative pl-6">
          <div
            className="absolute left-2 top-1 bottom-1 w-px"
            style={{ background: "rgba(255,255,255,0.08)" }}
          />
          <div className="space-y-2">
            {sorted.map((e) => {
              const meta = EVENT_LABEL[e.type] ?? { label: e.type, color: "#9CA3AF" };
              return (
                <div key={e.id} className="relative">
                  <span
                    className="absolute -left-[18px] top-1.5 w-2.5 h-2.5 rounded-full"
                    style={{ background: meta.color, border: "2px solid #0B0D12" }}
                  />
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-medium"
                      style={{ background: `${meta.color}1A`, color: meta.color }}
                    >
                      {meta.label}
                    </span>
                    <span className="text-[#9CA3AF] font-mono text-[11px]">{e.page}</span>
                    {typeof e.value === "number" && (
                      <span className="text-[#6B7280] tabular-nums">{e.value}</span>
                    )}
                    <span className="text-[#6B7280] ml-auto">
                      {new Date(e.ts).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                    </span>
                  </div>
                  {e.meta && Object.keys(e.meta).length > 0 && (
                    <div className="ml-2 mt-1 text-[10px] text-[#6B7280] font-mono max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
                      {JSON.stringify(e.meta).slice(0, 160)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </GlassCard>
  );
}

