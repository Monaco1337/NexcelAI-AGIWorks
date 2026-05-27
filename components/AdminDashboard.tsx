"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const IS_PRODUCTION = process.env.NEXT_PUBLIC_VERCEL === "1" || process.env.NODE_ENV === "production";

interface Stats {
  analytics: {
    total: { pageViews: number; contacts: number; demoRequests: number };
    last24h: { pageViews: number; contacts: number; demoRequests: number };
    last7d: { pageViews: number; contacts: number; demoRequests: number };
    last30d: { pageViews: number; contacts: number; demoRequests: number };
    topPages: { page: string; count: number }[];
  };
  contacts: { total: number; unread: number; archived: number };
  demoRequests: { total: number; unread: number; pending: number; archived: number };
}

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
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [demoRequests, setDemoRequests] = useState<DemoRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "contacts" | "demo" | "analytics">("overview");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);

  useEffect(() => {
    loadData(true);
    // Refresh every 1 second for INSTANT updates - optimiert für bessere Performance
    const interval = setInterval(() => loadData(false), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setLoading(true);
        setError(null);
        setErrorDetails(null);
      }
      
      // DIREKT ÜBER SERVER ACTIONS - KEINE API-CALLS!
      const { getAdminContacts } = await import("@/app/actions/admin");
      
      const [contactsData, statsRes, demoRes, userRes] = await Promise.all([
        getAdminContacts(), // Server Action für Posts
        fetch("/api/admin/stats"), // Stats bleibt API (komplex)
        fetch("/api/admin/demo-requests?archived=false"), // Demo bleibt API
        fetch("/api/admin/me"), // Auth bleibt API
      ]);
      
      console.log("🔵 [ADMIN DASHBOARD] Contacts data:", contactsData);
      console.log("🔵 [ADMIN DASHBOARD] Contacts count:", contactsData.contacts?.length || 0);
      
      if (statsRes.ok) setStats(await statsRes.json());
      
      // Kontakte aus Server Action - MIT DETAILLIERTER FEHLERANZEIGE!
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/AdminDashboard.tsx:87',message:'Processing contactsData',data:{hasData:!!contactsData,hasContacts:!!contactsData?.contacts,isArray:Array.isArray(contactsData?.contacts),hasError:!!contactsData?.error,error:contactsData?.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'L'})}).catch(()=>{});
      // #endregion
      
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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/AdminDashboard.tsx:100',message:'Setting error state',data:{error:contactsData.error,fullData:contactsData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'M'})}).catch(()=>{});
        // #endregion
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

  return (
    <div className="min-h-screen p-6" style={{
      background: "radial-gradient(circle at center, rgba(164, 92, 255, 0.1) 0%, rgba(0, 0, 0, 0.95) 100%)",
    }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">NEXCEL AI CMS</h1>
            <p className="text-[#E5E7EB]/80">
              Willkommen zurück{user?.name ? `, ${user.name}` : ""}
            </p>
          </div>
          <motion.button
            onClick={handleLogout}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.3)",
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Abmelden
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { id: "overview", label: "Übersicht" },
            { id: "contacts", label: `Kontakte (${contacts.filter((c) => !c.read).length})` },
            { id: "demo", label: `Demo-Anfragen (${demoRequests.filter((r) => !r.read).length})` },
            { id: "analytics", label: "Analytics" },
          ].map((tab) => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="px-6 py-3 rounded-xl font-semibold text-sm transition-all"
              style={{
                background: activeTab === tab.id
                  ? "linear-gradient(135deg, #A45CFF 0%, #C084FC 100%)"
                  : "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "white",
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Overview Tab */}
        {activeTab === "overview" && stats && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard
                title="Seitenaufrufe (24h)"
                value={stats.analytics.last24h.pageViews}
                change={`+${stats.analytics.last7d.pageViews - stats.analytics.last24h.pageViews} (7d)`}
                icon="👁️"
              />
              <KPICard
                title="Kontakte (24h)"
                value={stats.analytics.last24h.contacts}
                change={`${stats.contacts.unread} ungelesen`}
                icon="✉️"
              />
              <KPICard
                title="Demo-Anfragen (24h)"
                value={stats.analytics.last24h.demoRequests}
                change={`${stats.demoRequests.pending} ausstehend`}
                icon="🚀"
              />
              <KPICard
                title="Gesamt Kontakte"
                value={stats.contacts.total}
                change={`${stats.contacts.archived} archiviert`}
                icon="📊"
              />
            </div>

            {/* Recent Contacts - POST-FEED */}
            <GlassCard title="Neueste Posts">
              <div className="space-y-0">
                {contacts.slice(0, 5).length === 0 ? (
                  <div className="text-center py-8 text-[#9CA3AF] text-sm">
                    Noch keine Posts vorhanden
                  </div>
                ) : (
                  contacts.slice(0, 5).map((contact) => (
                    <ContactRow key={contact.id} contact={contact} onMarkRead={() => markAsRead("contact", contact.id)} />
                  ))
                )}
              </div>
            </GlassCard>

            {/* Recent Demo Requests */}
            <GlassCard title="Neueste Demo-Anfragen">
              <div className="space-y-3">
                {demoRequests.slice(0, 5).map((request) => (
                  <DemoRequestRow key={request.id} request={request} onMarkRead={() => markAsRead("demo", request.id)} />
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {/* Contacts Tab - POST-FEED wie Bewertungen */}
        {activeTab === "contacts" && (
          <GlassCard title="Kontakt-Posts">
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
              {contacts.length === 0 && !error ? (
                <div className="text-center py-12 text-[#9CA3AF]">
                  Noch keine Posts vorhanden
                </div>
              ) : (
                contacts.map((contact) => (
                  <ContactRow key={contact.id} contact={contact} onMarkRead={() => markAsRead("contact", contact.id)} />
                ))
              )}
            </div>
          </GlassCard>
        )}

        {/* Demo Requests Tab */}
        {activeTab === "demo" && (
          <GlassCard title="Alle Demo-Anfragen">
            <div className="space-y-3">
              {demoRequests.map((request) => (
                <DemoRequestRow key={request.id} request={request} onMarkRead={() => markAsRead("demo", request.id)} />
              ))}
            </div>
          </GlassCard>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && stats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard title="Letzte 24 Stunden">
                <div className="space-y-4">
                  <StatItem label="Seitenaufrufe" value={stats.analytics.last24h.pageViews} />
                  <StatItem label="Kontakte" value={stats.analytics.last24h.contacts} />
                  <StatItem label="Demo-Anfragen" value={stats.analytics.last24h.demoRequests} />
                </div>
              </GlassCard>
              <GlassCard title="Letzte 7 Tage">
                <div className="space-y-4">
                  <StatItem label="Seitenaufrufe" value={stats.analytics.last7d.pageViews} />
                  <StatItem label="Kontakte" value={stats.analytics.last7d.contacts} />
                  <StatItem label="Demo-Anfragen" value={stats.analytics.last7d.demoRequests} />
                </div>
              </GlassCard>
              <GlassCard title="Letzte 30 Tage">
                <div className="space-y-4">
                  <StatItem label="Seitenaufrufe" value={stats.analytics.last30d.pageViews} />
                  <StatItem label="Kontakte" value={stats.analytics.last30d.contacts} />
                  <StatItem label="Demo-Anfragen" value={stats.analytics.last30d.demoRequests} />
                </div>
              </GlassCard>
            </div>
            <GlassCard title="Top Seiten">
              <div className="space-y-2">
                {stats.analytics.topPages.map((page, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-white/5">
                    <span className="text-[#E5E7EB]">{page.page}</span>
                    <span className="text-[#A45CFF] font-semibold">{page.count}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
}

function KPICard({ title, value, change, icon }: { title: string; value: number; change: string; icon: string }) {
  return (
    <motion.div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(164, 92, 255, 0.15)",
      }}
      whileHover={{ scale: 1.02, y: -2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        {value > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-[#A45CFF]/20 text-[#A45CFF]">
            Neu
          </span>
        )}
      </div>
      <div className="text-3xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-[#9CA3AF]">{title}</div>
      <div className="text-xs text-[#9CA3AF] mt-2">{change}</div>
    </motion.div>
  );
}

function GlassCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl p-6"
      style={{
        background: "rgba(255, 255, 255, 0.08)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid rgba(255, 255, 255, 0.18)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 60px rgba(164, 92, 255, 0.15)",
      }}
    >
      <h2 className="text-xl font-bold text-white mb-4">{title}</h2>
      {children}
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
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white text-base">{contact.name}</span>
            {!contact.read && (
              <span className="w-2 h-2 rounded-full bg-[#A45CFF] animate-pulse" />
            )}
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
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-white">{request.name}</span>
            {!request.read && (
              <span className="w-2 h-2 rounded-full bg-[#A45CFF]" />
            )}
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

