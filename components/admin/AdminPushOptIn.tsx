"use client";

import { useEffect, useState } from "react";

function vapidToArrayBuffer(input: string): ArrayBuffer {
  const padding = "=".repeat((4 - input.length % 4) % 4);
  const raw = atob((input + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const buffer = new ArrayBuffer(raw.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return buffer;
}

export default function AdminPushOptIn() {
  const [state, setState] = useState<"hidden"|"idle"|"busy"|"on"|"error"|"unsupported">("hidden");
  const [message, setMessage] = useState("");
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      setState("unsupported"); return;
    }
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & {standalone?:boolean}).standalone === true;
    if (!standalone) { setState("hidden"); return; }
    setState("idle");
    void navigator.serviceWorker.getRegistration("/admin").then(reg => reg?.pushManager.getSubscription()).then(sub => {
      if (sub) setState("on");
    }).catch(() => {});
  }, []);
  if (dismissed || state === "hidden" || state === "unsupported") return null;
  const subscribe = async () => {
    setState("busy"); setMessage("");
    try {
      // Must be user-gesture initiated on iOS; prompt before doing asynchronous fetches.
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { setState("error"); setMessage("Bitte Mitteilungen in den iPhone-Einstellungen erlauben."); return; }
      const res = await fetch("/api/admin/push", { credentials: "include", cache: "no-store" });
      if (!res.ok) throw new Error("Admin-Zugriff nicht bestätigt");
      const info: {configured?:boolean;publicKey?:string} = await res.json();
      if (!info.configured || !info.publicKey) throw new Error("Web Push noch nicht serverseitig konfiguriert");
      const sw = await navigator.serviceWorker.register("/admin-sw.js", { scope: "/admin" });
      const active = await sw.pushManager.getSubscription();
      const subscription = active ?? await sw.pushManager.subscribe({
        userVisibleOnly: true, applicationServerKey: vapidToArrayBuffer(info.publicKey),
      });
      const saved = await fetch("/api/admin/push", {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!saved.ok) throw new Error("Geräteregistrierung fehlgeschlagen");
      setState("on"); setMessage("Benachrichtigungen für dieses iPhone aktiviert.");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Benachrichtigungen nicht verfügbar");
    }
  };
  return <aside className="fixed bottom-4 right-4 z-[150] w-[min(92vw,340px)] rounded-2xl border border-sky-400/25 bg-[#0c1523] p-4 text-white shadow-2xl" aria-label="Admin-Mitteilungen">
    <div className="flex justify-between gap-3"><strong className="text-sm">Admin-Benachrichtigungen</strong><button onClick={() => setDismissed(true)} className="text-xs text-slate-400" aria-label="Hinweis schließen">Schließen</button></div>
    <p className="mt-2 text-xs leading-5 text-slate-300">Neue Kontakt- und Terminanfragen direkt auf diesem Gerät erhalten. Kundendaten bleiben im Admin-Panel.</p>
    <button onClick={subscribe} disabled={state === "busy" || state === "on"}
      className="mt-3 rounded-xl border border-sky-300/50 bg-sky-500/15 px-4 py-2 text-sm disabled:opacity-50">
      {state === "busy" ? "Wird aktiviert…" : state === "on" ? "Aktiviert" : "Push aktivieren"}
    </button>
    {message && <p className="mt-2 text-xs text-slate-300" role="status">{message}</p>}
  </aside>;
}
