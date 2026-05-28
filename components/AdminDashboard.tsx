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

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "demo" | "analytics">("overview");
  const [brandFilter, setBrandFilter] = useState<BrandFilter>("all");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

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

  const totalUnread =
    filteredContacts.filter((c) => !c.read).length +
    filteredDemoRequests.filter((r) => !r.read).length;

  const tabs = [
    { id: "overview" as const, label: "Übersicht", badge: null as number | null },
    {
      id: "contacts" as const,
      label: "Kontakte",
      badge: filteredContacts.filter((c) => !c.read).length,
    },
    {
      id: "demo" as const,
      label: "Demo-Anfragen",
      badge: filteredDemoRequests.filter((r) => !r.read).length,
    },
    { id: "analytics" as const, label: "Analytics", badge: null as number | null },
  ];

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
          "radial-gradient(120% 60% at 50% -10%, rgba(164, 92, 255, 0.18) 0%, rgba(11, 13, 18, 0.0) 60%), #0B0D12",
      }}
    >
      {/* ─── STICKY TOP-BAR ───────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-50 backdrop-blur-xl"
        style={{
          background: "rgba(11, 13, 18, 0.72)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
        }}
      >
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-4">
          {/* Brand-Identity links */}
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${sessionBrand.accent}33, ${sessionBrand.accent}11)`,
                border: `1px solid ${sessionBrand.accent}55`,
                color: sessionBrand.accent,
              }}
            >
              {(user?.name ?? "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col leading-tight min-w-0">
              <span className="text-[10px] uppercase tracking-[0.18em] text-[#9CA3AF]">
                {sessionBrand.label} · CMS
              </span>
              <span className="text-sm font-semibold text-white truncate">
                {user?.name ?? "Admin"}
                <span className="text-[#6B7280] font-normal ml-2 text-xs">
                  {user?.email}
                </span>
              </span>
            </div>
          </div>

          {/* Tab-Navigation Mitte */}
          <nav className="flex-1 flex justify-center">
            <div
              className="flex items-center gap-1 p-1 rounded-full"
              style={{
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
              }}
            >
              {tabs.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative px-4 py-2 rounded-full text-sm font-medium transition-all"
                    style={{
                      background: active ? `${sessionBrand.accent}22` : "transparent",
                      color: active ? sessionBrand.accent : "#9CA3AF",
                    }}
                  >
                    {tab.label}
                    {tab.badge !== null && tab.badge > 0 && (
                      <span
                        className="ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          background: active ? sessionBrand.accent : "#A45CFF",
                          color: active ? "#0B0D12" : "white",
                        }}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Aktionen rechts */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {totalUnread > 0 && (
              <div
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
                style={{
                  background: "rgba(251, 191, 36, 0.1)",
                  border: "1px solid rgba(251, 191, 36, 0.25)",
                  color: "#FBBF24",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24] animate-pulse" />
                {totalUnread} ungelesen
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-lg text-xs font-medium transition-all hover:bg-red-500/15"
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "#FCA5A5",
              }}
            >
              Abmelden
            </button>
          </div>
        </div>

        {/* Brand-Filter Sub-Strip */}
        <div
          className="max-w-[1400px] mx-auto px-6 py-2 flex items-center gap-3 border-t"
          style={{ borderColor: "rgba(255, 255, 255, 0.04)" }}
        >
          <span className="text-[10px] uppercase tracking-[0.18em] text-[#6B7280]">
            Brand-Filter
          </span>
          <div className="flex items-center gap-1.5">
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
                    border: `1px solid ${active ? `${opt.accent}55` : "transparent"}`,
                    color: active ? opt.accent : "#9CA3AF",
                  }}
                >
                  {opt.label}
                  <span className="opacity-50 ml-1.5">{count}</span>
                </button>
              );
            })}
          </div>
          <div className="ml-auto text-[10px] text-[#6B7280]">
            Auto-Refresh · alle 1s
          </div>
        </div>
      </header>

      {/* ─── CONTENT ──────────────────────────────────────────────────── */}
      <div className="max-w-[1400px] mx-auto px-6 py-6">
        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <KPICard
                label="Seitenaufrufe · 24h"
                value={stats.analytics.last24h.pageViews}
                hint={`${stats.analytics.last7d.pageViews} in 7T · ${stats.analytics.last30d.pageViews} in 30T`}
                accent={sessionBrand.accent}
              />
              <KPICard
                label="Neue Kontakte · 24h"
                value={stats.analytics.last24h.contacts}
                hint={`${stats.contacts.unread} ungelesen · ${stats.contacts.total} gesamt`}
                accent="#22C55E"
              />
              <KPICard
                label="Demo-Anfragen · 24h"
                value={stats.analytics.last24h.demoRequests}
                hint={`${stats.demoRequests.pending} ausstehend · ${stats.demoRequests.total} gesamt`}
                accent="#FBBF24"
              />
              <KPICard
                label="Archiv"
                value={stats.contacts.archived + stats.demoRequests.archived}
                hint={`${stats.contacts.archived} Kontakte · ${stats.demoRequests.archived} Demo`}
                accent="#6B7280"
              />
            </div>

            {/* Two-column overview: contacts (left) + demos (right) */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
              <div className="xl:col-span-2">
                <GlassCard
                  title={`Neueste Kontakte${brandFilter !== "all" ? ` · ${BRAND_META[brandFilter].label}` : ""}`}
                  action={
                    filteredContacts.length > 5 ? (
                      <button
                        onClick={() => setActiveTab("contacts")}
                        className="text-xs text-[#9CA3AF] hover:text-white transition-colors"
                      >
                        Alle {filteredContacts.length} →
                      </button>
                    ) : null
                  }
                >
                  <div className="space-y-0">
                    {filteredContacts.slice(0, 4).length === 0 ? (
                      <EmptyState text="Noch keine Posts vorhanden" />
                    ) : (
                      filteredContacts
                        .slice(0, 4)
                        .map((contact) => (
                          <ContactRow
                            key={contact.id}
                            contact={contact}
                            onMarkRead={() => markAsRead("contact", contact.id)}
                          />
                        ))
                    )}
                  </div>
                </GlassCard>
              </div>

              <div className="xl:col-span-1">
                <GlassCard
                  title={`Demo-Anfragen${brandFilter !== "all" ? ` · ${BRAND_META[brandFilter].label}` : ""}`}
                  action={
                    filteredDemoRequests.length > 5 ? (
                      <button
                        onClick={() => setActiveTab("demo")}
                        className="text-xs text-[#9CA3AF] hover:text-white transition-colors"
                      >
                        Alle {filteredDemoRequests.length} →
                      </button>
                    ) : null
                  }
                >
                  <div className="space-y-2">
                    {filteredDemoRequests.slice(0, 5).map((request) => (
                      <DemoRequestRow
                        key={request.id}
                        request={request}
                        onMarkRead={() => markAsRead("demo", request.id)}
                      />
                    ))}
                    {filteredDemoRequests.length === 0 && (
                      <EmptyState text="Noch keine Demo-Anfragen" />
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          </div>
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
      </div>
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

