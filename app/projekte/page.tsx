"use client";

import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/contexts/ThemeContext";

const ChronexDashboard = () => {
  const stats = [
    { label: "TOUREN HEUTE", value: "17", subtitle: "12 abgeschlossen" },
    { label: "AKTIVE TOUREN", value: "5", subtitle: "5 unterwegs" },
    { label: "FAHRER UNTERWEGS", value: "12", subtitle: "12 gesamt" },
    { label: "OFFENE AUFTRÄGE", value: "4", subtitle: "4 zu bearbeiten" },
  ];

  const aktiveTouren = [
    { fahrer: "Müller", ziel: "Essen", status: "unterwegs", uhrzeit: "14:30" },
    { fahrer: "Becker", ziel: "Köln", status: "wartet", uhrzeit: "15:15" },
    { fahrer: "Yilmaz", ziel: "Dortmund", status: "abgeschlossen", uhrzeit: "13:45" },
    { fahrer: "Schmidt", ziel: "Düsseldorf", status: "unterwegs", uhrzeit: "16:00" },
  ];

  const fahrer = [
    { name: "Müller", status: "unterwegs", touren: 3 },
    { name: "Becker", status: "verfügbar", touren: 2 },
    { name: "Yilmaz", status: "unterwegs", touren: 4 },
    { name: "Schmidt", status: "unterwegs", touren: 2 },
    { name: "Weber", status: "verfügbar", touren: 1 },
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "rgba(12, 15, 26, 0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(164, 92, 255, 0.2)", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)" }}>
      <div className="px-4 sm:px-6 py-4 border-b border-[#A45CFF]/10" style={{ background: "rgba(164, 92, 255, 0.05)" }}>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-base sm:text-lg font-bold text-[#FFFFFF] truncate">Chronex AI – Dashboard</h3>
          <button className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-[#FFFFFF] flex items-center gap-2 flex-shrink-0 whitespace-nowrap" style={{ background: "rgba(164, 92, 255, 0.2)", border: "1px solid rgba(164, 92, 255, 0.3)" }}>
            <span className="w-2 h-2 rounded-full bg-[#A45CFF] flex-shrink-0" style={{ boxShadow: "0 0 8px rgba(164, 92, 255, 0.8)" }}></span>
            <span className="hidden sm:inline">Chronex AI Chat starten</span>
            <span className="sm:hidden">Chat</span>
          </button>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-xl p-3 sm:p-4 min-w-0" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(164, 92, 255, 0.15)" }}>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#FFFFFF] mb-1 truncate">{stat.value}</div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#A45CFF] mb-1 break-words leading-tight">{stat.label}</div>
              <div className="text-[10px] sm:text-xs text-[#9CA3AF] break-words leading-tight">{stat.subtitle}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="rounded-xl p-4 sm:p-6 min-w-0" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
            <h5 className="text-sm sm:text-base md:text-lg font-semibold text-[#FFFFFF] mb-4 truncate">Aktive Touren</h5>
            <div className="space-y-3">
              {aktiveTouren.map((tour, i) => (
                <div key={i} className="flex justify-between items-start gap-2 pb-3 border-b border-[#A45CFF]/10 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <div className="text-xs sm:text-sm md:text-base font-medium text-[#FFFFFF] truncate">{tour.fahrer}</div>
                      <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded flex-shrink-0 whitespace-nowrap" style={{ 
                        background: tour.status === "unterwegs" ? "rgba(34, 197, 94, 0.2)" : tour.status === "wartet" ? "rgba(251, 191, 36, 0.2)" : "rgba(164, 92, 255, 0.2)",
                        color: tour.status === "unterwegs" ? "#22C55E" : tour.status === "wartet" ? "#FBBF24" : "#A45CFF"
                      }}>{tour.status}</span>
                    </div>
                    <div className="text-[10px] sm:text-xs text-[#9CA3AF] truncate">{tour.ziel} • {tour.uhrzeit}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4 sm:p-6 min-w-0" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
            <h5 className="text-sm sm:text-base md:text-lg font-semibold text-[#FFFFFF] mb-4 truncate">Fahrer heute</h5>
            <div className="space-y-3">
              {fahrer.map((f, i) => (
                <div key={i} className="flex justify-between items-center gap-2 pb-3 border-b border-[#A45CFF]/10 last:border-0 last:pb-0">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs sm:text-sm md:text-base font-medium text-[#FFFFFF] truncate mb-1">{f.name}</div>
                    <div className="text-[10px] sm:text-xs text-[#9CA3AF] truncate">{f.touren} Touren</div>
                  </div>
                  <span className="text-[10px] sm:text-xs px-2 py-1 rounded flex-shrink-0 whitespace-nowrap" style={{ 
                    background: f.status === "unterwegs" ? "rgba(34, 197, 94, 0.2)" : "rgba(164, 92, 255, 0.2)",
                    color: f.status === "unterwegs" ? "#22C55E" : "#A45CFF"
                  }}>{f.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PflegeCRMDashboard = () => {
  const stats = [
    { label: "EINSÄTZE HEUTE", value: "28", subtitle: "18 abgeschlossen" },
    { label: "AKTIVE TOUREN", value: "6", subtitle: "6 unterwegs" },
    { label: "PFLEGEKRÄFTE IM DIENST", value: "14", subtitle: "9 verfügbar" },
    { label: "OFFENE AUFGABEN", value: "9", subtitle: "9 zu erledigen" },
  ];

  const einsaetze = [
    { klient: "Maria Schmidt", uhrzeit: "08:00", pflegekraft: "Anna M.", status: "Abgeschlossen" },
    { klient: "Hans Weber", uhrzeit: "09:30", pflegekraft: "Tom K.", status: "Unterwegs" },
    { klient: "Elisabeth Müller", uhrzeit: "11:00", pflegekraft: "Lisa B.", status: "Unterwegs" },
    { klient: "Peter Klein", uhrzeit: "13:30", pflegekraft: "Max S.", status: "Geplant" },
    { klient: "Gertrud Fischer", uhrzeit: "15:00", pflegekraft: "Sarah L.", status: "Geplant" },
  ];

  const touren = [
    { name: "Frühtour Nord", einsaetze: 8, status: "Aktiv", pflegekraft: "Anna M." },
    { name: "Mittagstour Stadt", einsaetze: 6, status: "Aktiv", pflegekraft: "Tom K." },
    { name: "Nachmittagstour Süd", einsaetze: 10, status: "Geplant", pflegekraft: "Lisa B." },
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "rgba(12, 15, 26, 0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(164, 92, 255, 0.2)", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)" }}>
      <div className="px-4 sm:px-6 py-4 border-b border-[#A45CFF]/10" style={{ background: "rgba(164, 92, 255, 0.05)" }}>
        <h3 className="text-base sm:text-lg font-bold text-[#FFFFFF] truncate">Pflege-Zentrale</h3>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-xl p-3 sm:p-4 min-w-0" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(164, 92, 255, 0.15)" }}>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#FFFFFF] mb-1 truncate">{stat.value}</div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#A45CFF] mb-1 break-words leading-tight">{stat.label}</div>
              <div className="text-[10px] sm:text-xs text-[#9CA3AF] break-words leading-tight">{stat.subtitle}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4 sm:p-6 mb-4 min-w-0 overflow-hidden" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
          <h5 className="text-sm sm:text-base md:text-lg font-semibold text-[#FFFFFF] mb-4 truncate">Heutige Einsätze</h5>
          <div className="overflow-x-auto -mx-4 sm:-mx-6 px-4 sm:px-6">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b border-[#A45CFF]/10">
                  <th className="text-left py-2 px-2 text-[10px] sm:text-xs md:text-sm font-semibold text-[#A45CFF] whitespace-nowrap">Klient</th>
                  <th className="text-left py-2 px-2 text-[10px] sm:text-xs md:text-sm font-semibold text-[#A45CFF] whitespace-nowrap">Uhrzeit</th>
                  <th className="text-left py-2 px-2 text-[10px] sm:text-xs md:text-sm font-semibold text-[#A45CFF] whitespace-nowrap">Pflegekraft</th>
                  <th className="text-left py-2 px-2 text-[10px] sm:text-xs md:text-sm font-semibold text-[#A45CFF] whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody>
                {einsaetze.map((e, i) => (
                  <tr key={i} className="border-b border-[#A45CFF]/5 last:border-0">
                    <td className="py-2 px-2 text-[10px] sm:text-xs md:text-sm text-[#FFFFFF] truncate max-w-[120px]">{e.klient}</td>
                    <td className="py-2 px-2 text-[10px] sm:text-xs md:text-sm text-[#9CA3AF] whitespace-nowrap">{e.uhrzeit}</td>
                    <td className="py-2 px-2 text-[10px] sm:text-xs md:text-sm text-[#9CA3AF] truncate max-w-[100px]">{e.pflegekraft}</td>
                    <td className="py-2 px-2">
                      <span className="text-[10px] sm:text-xs px-2 py-1 rounded inline-block whitespace-nowrap" style={{ 
                        background: e.status === "Abgeschlossen" ? "rgba(164, 92, 255, 0.2)" : e.status === "Unterwegs" ? "rgba(34, 197, 94, 0.2)" : "rgba(251, 191, 36, 0.2)",
                        color: e.status === "Abgeschlossen" ? "#A45CFF" : e.status === "Unterwegs" ? "#22C55E" : "#FBBF24"
                      }}>{e.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {touren.map((tour, i) => (
            <div key={i} className="rounded-xl p-4 min-w-0" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
              <div className="flex justify-between items-start gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm md:text-base font-medium text-[#FFFFFF] truncate mb-1">{tour.name}</div>
                  <div className="text-[10px] sm:text-xs text-[#9CA3AF] truncate">{tour.einsaetze} Einsätze • {tour.pflegekraft}</div>
                </div>
                <span className="text-[10px] sm:text-xs px-2 py-1 rounded flex-shrink-0 whitespace-nowrap" style={{ 
                  background: tour.status === "Aktiv" ? "rgba(34, 197, 94, 0.2)" : "rgba(164, 92, 255, 0.2)",
                  color: tour.status === "Aktiv" ? "#22C55E" : "#A45CFF"
                }}>{tour.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProjektManagementDashboard = () => {
  const stats = [
    { label: "OFFENE TASKS", value: "42", subtitle: "12 diese Woche" },
    { label: "ÜBERFÄLLIGE TASKS", value: "7", subtitle: "Sofort bearbeiten" },
    { label: "DIESE WOCHE FÄLLIG", value: "13", subtitle: "Deadline naht" },
    { label: "BLOCKIERTE TASKS", value: "2", subtitle: "Warten auf Input" },
  ];

  const kanbanTasks = {
    "ToDo": [
      { title: "Dokumentation aktualisieren", project: "Allgemein", priority: "Niedrig" },
      { title: "Design-Review durchführen", project: "Website Redesign", priority: "Mittel" },
    ],
    "In Progress": [
      { title: "Design-System finalisieren", project: "Website Redesign", priority: "Hoch" },
      { title: "API-Integration testen", project: "Backend System", priority: "Mittel" },
    ],
    "Review": [
      { title: "Code-Review abschließen", project: "Frontend", priority: "Hoch" },
    ],
    "Done": [
      { title: "Performance-Optimierung", project: "Frontend", priority: "Hoch" },
      { title: "Tests implementieren", project: "Backend System", priority: "Mittel" },
    ],
  };

  const deadlines = [
    { project: "Website Redesign", task: "Design-System", datum: "15.12.2024", priority: "Hoch" },
    { project: "Backend System", task: "API-Integration", datum: "18.12.2024", priority: "Mittel" },
    { project: "Frontend", task: "Performance-Tests", datum: "20.12.2024", priority: "Hoch" },
  ];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "rgba(12, 15, 26, 0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(164, 92, 255, 0.2)", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)" }}>
      <div className="px-4 sm:px-6 py-4 border-b border-[#A45CFF]/10" style={{ background: "rgba(164, 92, 255, 0.05)" }}>
        <h3 className="text-base sm:text-lg font-bold text-[#FFFFFF] truncate">Projekt-Control Center</h3>
      </div>
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {stats.map((stat, i) => (
            <div key={i} className="rounded-xl p-3 sm:p-4 min-w-0" style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(164, 92, 255, 0.15)" }}>
              <div className="text-xl sm:text-2xl md:text-3xl font-bold text-[#FFFFFF] mb-1 truncate">{stat.value}</div>
              <div className="text-[10px] sm:text-xs font-semibold text-[#A45CFF] mb-1 break-words leading-tight">{stat.label}</div>
              <div className="text-[10px] sm:text-xs text-[#9CA3AF] break-words leading-tight">{stat.subtitle}</div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6">
          {Object.entries(kanbanTasks).map(([column, tasks], i) => (
            <div key={i} className="rounded-xl p-3 sm:p-4 md:p-5 min-w-0" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
              <h5 className="text-xs sm:text-sm md:text-base font-semibold text-[#FFFFFF] mb-3 truncate">{column}</h5>
              <div className="space-y-2">
                {tasks.map((task, j) => (
                  <div key={j} className="p-2 sm:p-3 rounded-lg min-w-0" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
                    <div className="text-[10px] sm:text-xs md:text-sm font-medium text-[#FFFFFF] mb-1 break-words leading-tight">{task.title}</div>
                    <div className="text-[10px] sm:text-xs text-[#9CA3AF] mb-1.5 truncate">{task.project}</div>
                    <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded inline-block whitespace-nowrap" style={{ 
                      background: task.priority === "Hoch" ? "rgba(239, 68, 68, 0.2)" : task.priority === "Mittel" ? "rgba(251, 191, 36, 0.2)" : "rgba(164, 92, 255, 0.2)",
                      color: task.priority === "Hoch" ? "#EF4444" : task.priority === "Mittel" ? "#FBBF24" : "#A45CFF"
                    }}>{task.priority}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4 sm:p-6 min-w-0" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
          <h5 className="text-sm sm:text-base md:text-lg font-semibold text-[#FFFFFF] mb-4 truncate">Nächste Deadlines</h5>
          <div className="space-y-3">
            {deadlines.map((dl, i) => (
              <div key={i} className="flex justify-between items-start gap-3 pb-3 border-b border-[#A45CFF]/10 last:border-0 last:pb-0">
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm md:text-base font-medium text-[#FFFFFF] truncate mb-1">{dl.task}</div>
                  <div className="text-[10px] sm:text-xs text-[#9CA3AF] truncate">{dl.project}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] sm:text-xs text-[#A45CFF] mb-1 whitespace-nowrap">{dl.datum}</div>
                  <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded inline-block whitespace-nowrap" style={{ 
                    background: dl.priority === "Hoch" ? "rgba(239, 68, 68, 0.2)" : "rgba(251, 191, 36, 0.2)",
                    color: dl.priority === "Hoch" ? "#EF4444" : "#FBBF24"
                  }}>{dl.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const WebsitePreview = () => {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "rgba(12, 15, 26, 0.95)", backdropFilter: "blur(20px)", border: "1px solid rgba(164, 92, 255, 0.2)", boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)" }}>
      <div className="px-4 sm:px-6 py-3 border-b border-[#A45CFF]/10" style={{ background: "rgba(164, 92, 255, 0.05)" }}>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#EF4444" }}></div>
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#F59E0B" }}></div>
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: "#10B981" }}></div>
          <div className="flex-1 min-w-0 mx-3 px-3 py-1.5 rounded text-xs truncate" style={{ background: "rgba(255, 255, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
            <span className="text-[#9CA3AF]">https://</span><span className="text-[#FFFFFF]">example.com</span>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-6">
        <div className="rounded-xl p-6 sm:p-8 md:p-12 text-center mb-6 min-w-0 overflow-hidden" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.15)" }}>
          <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#FFFFFF] mb-3 break-words">Zukunft beginnt hier</h3>
          <p className="text-sm sm:text-base md:text-lg text-[#E5E7EB] mb-6 break-words">Innovation trifft auf Präzision</p>
          <button className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium text-[#FFFFFF] whitespace-nowrap" style={{ background: "rgba(164, 92, 255, 0.2)", border: "1px solid rgba(164, 92, 255, 0.3)" }}>
            Jetzt starten
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {[
            { title: "Innovation", desc: "Moderne Lösungen" },
            { title: "Präzision", desc: "Perfekte Umsetzung" },
            { title: "Zukunft", desc: "Visionäre Technik" },
          ].map((card, i) => (
            <div key={i} className="rounded-xl p-4 sm:p-5 md:p-6 min-w-0" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg mb-3 flex items-center justify-center flex-shrink-0" style={{ background: "rgba(164, 92, 255, 0.2)" }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-[#A45CFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="text-sm sm:text-base md:text-lg font-semibold text-[#FFFFFF] mb-1 truncate">{card.title}</div>
              <div className="text-[10px] sm:text-xs md:text-sm text-[#9CA3AF] truncate">{card.desc}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4 sm:p-6 min-w-0" style={{ background: "rgba(255, 255, 255, 0.02)", border: "1px solid rgba(164, 92, 255, 0.1)" }}>
          <div className="h-2 w-full rounded mb-2" style={{ background: "rgba(164, 92, 255, 0.1)" }}></div>
          <div className="h-2 w-3/4 rounded mb-2" style={{ background: "rgba(164, 92, 255, 0.1)" }}></div>
          <div className="h-2 w-5/6 rounded" style={{ background: "rgba(164, 92, 255, 0.1)" }}></div>
        </div>
      </div>
    </div>
  );
};

const projects = [
  {
    id: 1,
    title: "Chronex AI – Speditionssystem",
    subtitle: "KI-gestützte Transportzentrale für Logistikunternehmen",
    description: "Chronex AI ist ein intelligentes System für Speditionen. Es verbindet Fahrer, Tourenplanung, Zeittracking und Disposition in einer zentralen Steuerzentrale. Statt Zettelwirtschaft und Telefonketten läuft die gesamte operative Planung über ein einziges, KI-gestütztes System.",
    highlights: [
      "Fahrerübersicht mit Verfügbarkeit & Arbeitszeiten",
      "Tourenplanung mit KI-Logik und Prioritäten",
      "Zeittracking für Fahrten, Pausen und Wartezeiten",
      "Status-Boards für aktive, geplante und abgeschlossene Touren",
      "Automatische Vorschläge für Tourenverteilung",
    ],
    quote: "Ein System, das Speditionen gibt, was die Branche nie wirklich bekommen hat: eine echte, zentrale KI-Transportzentrale.",
    dashboard: <ChronexDashboard />,
  },
  {
    id: 2,
    title: "Pflege-CRM – Einsatzplanung im Pflegedienst",
    subtitle: "Individuelles CRM-System für Touren, Pflegeeinsätze und Teams",
    description: "Dieses System ist als zentrales CRM für einen ambulanten Pflegedienst konzipiert. Es verbindet Klient:innen, Pflegekräfte, Touren, Aufgaben und Dokumentation in einer Oberfläche. Ziel: Weniger Chaos in der Einsatzplanung, mehr Transparenz im Alltag.",
    highlights: [
      "Klientenübersicht mit Stammdaten und Pflegeprofil",
      "Einsatzplanung mit Touren und Zeitfenstern",
      "Zuordnung von Pflegekräften zu Touren",
      "Aufgabenlisten pro Einsatz (Medikamente, Maßnahmen, Dokumentation)",
      "Übersicht über offene, laufende und abgeschlossene Einsätze",
    ],
    quote: "Kein Zettelplan an der Wand mehr – alle Einsätze, Teams und Touren in einem System.",
    dashboard: <PflegeCRMDashboard />,
  },
  {
    id: 3,
    title: "Projektmanagement-System – Control Center",
    subtitle: "Planung, Aufgaben und Ressourcen in einem System",
    description: "Dieses System ist als zentrales Control Center für Projekte gedacht. Aufgaben, Status, Deadlines und Verantwortlichkeiten laufen in einer Oberfläche zusammen – ergänzt durch KI-Insights, die Engpässe frühzeitig sichtbar machen.",
    highlights: [
      "Aufgabenbereiche nach Team / Projekt",
      "Status & Prioritäten auf einen Blick",
      "Kalenderansicht für Deadlines & Milestones",
      "Workload-Übersicht pro Person",
      "KI-Hinweise zu Risiken & Verzögerungen",
    ],
    quote: "Fühlt sich an wie ein eigenes Control Center für Projekte.",
    dashboard: <ProjektManagementDashboard />,
  },
  {
    id: 4,
    title: "Website-System – Ästhetische & technische Webauftritte",
    subtitle: "Webseiten, die Identität und Zukunft transportieren",
    description: "Neben komplexen Systemen entwickeln wir auch Webauftritte, die zur technischen Tiefe passen. Fokus: klares Design, Performance und eine Struktur, die später mit Systemen verknüpft werden kann – zum Beispiel mit CRM, Buchungsstrecken oder Dashboards.",
    highlights: [
      "Futuristisches, markenklares Design",
      "Optimierte Performance & Responsiveness",
      "SEO-Basisstruktur",
      "Anbindung an Backends & APIs möglich",
      "Vorbereitung auf spätere Automationen",
    ],
    quote: "Webseiten, die aussehen wie Zukunft – nicht wie ein Baukasten.",
    dashboard: <WebsitePreview />,
  },
];

const ProjectCard = ({ project, index, isFeatured = false }: { project: typeof projects[0]; index: number; isFeatured?: boolean }) => {
  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8, delay: index * 0.15, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="relative rounded-neuralLg p-8 md:p-12 overflow-hidden"
        style={{
          background: isFeatured ? "rgba(255, 255, 255, 0.03)" : "rgba(255, 255, 255, 0.02)",
          backdropFilter: "blur(30px)",
          WebkitBackdropFilter: "blur(30px)",
          border: isFeatured ? "1px solid rgba(164, 92, 255, 0.3)" : "1px solid rgba(164, 92, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        }}
      >
        <motion.div
          className="absolute inset-0 rounded-neuralLg opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background: "radial-gradient(circle at center, rgba(164, 92, 255, 0.1) 0%, transparent 70%)",
            boxShadow: "0 0 60px rgba(164, 92, 255, 0.2), inset 0 0 40px rgba(164, 92, 255, 0.05)",
          }}
        />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="space-y-6 min-w-0">
            {isFeatured && (
              <div className="inline-block px-4 py-2 rounded-lg mb-4" style={{ background: "rgba(164, 92, 255, 0.2)", border: "1px solid rgba(164, 92, 255, 0.3)" }}>
                <span className="text-sm font-semibold text-[#A45CFF] whitespace-nowrap">FEATURED PROJECT</span>
              </div>
            )}
            <div className="min-w-0">
              <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2 tracking-tight break-words typography-h2 typography-h2-gradient">{project.title}</h3>
              <p className="text-xl md:text-2xl typography-h2-gradient font-medium mb-4 break-words">
                {project.subtitle}
              </p>
            </div>
            <p className="text-lg md:text-xl typography-body leading-relaxed break-words">
              {project.description}
            </p>
            <div className="space-y-3">
              {project.highlights.map((highlight, idx) => (
                <div key={idx} className="flex items-start min-w-0">
                  <span className="text-[#A45CFF] mr-3 text-lg font-bold mt-0.5 flex-shrink-0">•</span>
                  <span className="text-[#E5E7EB] text-base font-light break-words">{highlight}</span>
                </div>
              ))}
            </div>
            <div className="mt-8 p-6 rounded-neural min-w-0" style={{ background: "rgba(164, 92, 255, 0.05)", border: "1px solid rgba(164, 92, 255, 0.2)" }}>
              <p className="text-lg md:text-xl typography-h2-gradient font-medium italic leading-relaxed break-words">
                „{project.quote}&quot;
              </p>
            </div>
            {project.id === 1 && (
              <div className="mt-6">
                <Link href="/demo-anfordern" prefetch={true}>
                  <motion.button
                    className="neural-button-primary px-8 py-4 rounded-neural font-semibold text-base w-full sm:w-auto"
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    style={{
                      background: "#0C0F1A",
                      border: "1px solid rgba(164, 92, 255, 0.3)",
                      boxShadow: "0 4px 16px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
                    }}
                  >
                    Chronex AI Demo anfordern
                  </motion.button>
                </Link>
              </div>
            )}
          </div>
          <div className="relative min-w-0 w-full">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="w-full"
            >
              {project.dashboard}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function ProjektePage() {
  const { theme } = useTheme();
  return (
    <main className="relative min-h-screen overflow-hidden">
      <Navigation />
      <section 
        className="relative min-h-[60vh] flex items-center justify-center pt-[144px] md:pt-[152px] lg:pt-[168px] pb-32 px-6"
      >
        <div className="relative z-10 max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <motion.h1 
              className="text-4xl md:text-5xl lg:text-6xl font-bold mb-3 tracking-tight break-words typography-h1 typography-h1-gradient"
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              <span className="typography-h1-gradient">Projekte & Systeme im Einsatz</span>
            </motion.h1>
            <p className="text-xl md:text-2xl lg:text-3xl typography-body max-w-4xl mx-auto leading-relaxed break-words">
              Hier sehen Sie eine Auswahl von Systemen, die wir für reale Unternehmensprozesse konzipiert und entwickelt haben – von KI-gestützter Logistik bis zu individuellen Operating-Systemen.
            </p>
            <p className="text-lg md:text-xl text-[#A45CFF] font-medium break-words">
              Jedes System ist maßgeschneidert, modular erweiterbar und auf Autonomie ausgelegt.
            </p>
          </motion.div>
        </div>
      </section>
      <section className="relative pt-[60px] md:pt-[52px] lg:pt-[40px] pb-20 md:pb-32 px-6">
        <div className="relative z-10 max-w-7xl mx-auto space-y-16 md:space-y-24">
          {projects.map((project, index) => (
            <ProjectCard key={project.id} project={project} index={index} isFeatured={index === 0} />
          ))}
        </div>
      </section>
      <section className="relative py-24 md:py-32 px-6">
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            className="neural-glass rounded-neuralLg p-12 md:p-16"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            style={{
              background: "rgba(255, 255, 255, 0.02)",
              backdropFilter: "blur(30px)",
              WebkitBackdropFilter: "blur(30px)",
              border: "1px solid rgba(164, 92, 255, 0.2)",
            }}
          >
            <motion.h2 
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 tracking-tight break-words typography-h1 typography-h1-gradient"
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              Bereit für Ihr <span className="typography-h1-gradient">eigenes System</span>?
            </motion.h2>
            <p className="text-lg md:text-xl text-[#E5E7EB] font-light leading-relaxed mb-8 max-w-2xl mx-auto break-words">
              Wenn Sie sich vorstellen können, ein ähnliches System für Ihr Unternehmen aufzubauen, lassen Sie uns über Ihre Prozesse sprechen. Wir zeigen Ihnen transparent, was möglich ist.
            </p>
            <Link href="/kontakt" prefetch={true} className="w-full sm:w-auto">
              <motion.button
                className="relative px-6 sm:px-8 md:px-10 lg:px-12 py-3 sm:py-4 md:py-5 rounded-[16px] sm:rounded-[18px] lg:rounded-[20px] font-semibold text-xs sm:text-sm md:text-base tracking-wide overflow-hidden group/cta-projekte whitespace-nowrap w-full sm:w-auto"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ scale: 1.06, y: -2 }}
                whileTap={{ scale: 0.96 }}
                style={{ willChange: "transform" }}
              >
                {/* Base Gradient Background - Apple Intelligence Style */}
                <div
                  className="absolute inset-0 rounded-[20px] transition-all duration-500"
                  style={{
                    background: theme === "dark"
                      ? "linear-gradient(135deg, rgba(168, 85, 247, 0.35) 0%, rgba(139, 92, 246, 0.45) 25%, rgba(99, 102, 241, 0.40) 50%, rgba(139, 92, 246, 0.45) 75%, rgba(168, 85, 247, 0.35) 100%)"
                      : "linear-gradient(135deg, rgba(124, 58, 237, 0.4) 0%, rgba(139, 92, 246, 0.5) 25%, rgba(99, 102, 241, 0.45) 50%, rgba(139, 92, 246, 0.5) 75%, rgba(124, 58, 237, 0.4) 100%)",
                    backdropFilter: "blur(40px) saturate(200%)",
                    WebkitBackdropFilter: "blur(40px) saturate(200%)",
                  }}
                />

                {/* Glassmorphic Overlay */}
                <div
                  className="absolute inset-0 rounded-[20px] transition-all duration-500"
                  style={{
                    background: theme === "dark"
                      ? "linear-gradient(180deg, rgba(255, 255, 255, 0.18) 0%, rgba(255, 255, 255, 0.12) 30%, rgba(255, 255, 255, 0.08) 60%, rgba(255, 255, 255, 0.04) 100%)"
                      : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.90) 30%, rgba(255, 255, 255, 0.85) 60%, rgba(255, 255, 255, 0.80) 100%)",
                    border: theme === "dark"
                      ? "1px solid rgba(255, 255, 255, 0.25)"
                      : "1px solid rgba(255, 255, 255, 0.4)",
                    boxShadow: theme === "dark"
                      ? "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset, 0 1px 3px rgba(255, 255, 255, 0.1) inset"
                      : "0 8px 32px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(255, 255, 255, 0.3) inset, 0 1px 3px rgba(255, 255, 255, 0.2) inset",
                  }}
                />

                {/* Pulsing Neon Outline - Ultra Subtle */}
                <motion.div
                  className="absolute -inset-[2px] rounded-[22px] pointer-events-none -z-10"
                  animate={{
                    opacity: [0.5, 0.8, 0.5],
                    boxShadow: [
                      "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(99, 102, 241, 0.2)",
                      "0 0 35px rgba(168, 85, 247, 0.6), 0 0 70px rgba(139, 92, 246, 0.5), 0 0 100px rgba(99, 102, 241, 0.4)",
                      "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(139, 92, 246, 0.3), 0 0 60px rgba(99, 102, 241, 0.2)",
                    ],
                  }}
                  transition={{
                    duration: 3.5,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  style={{
                    background: theme === "dark"
                      ? "linear-gradient(135deg, rgba(168, 85, 247, 0.3), rgba(139, 92, 246, 0.4), rgba(99, 102, 241, 0.3))"
                      : "linear-gradient(135deg, rgba(124, 58, 237, 0.35), rgba(139, 92, 246, 0.45), rgba(99, 102, 241, 0.35))",
                    filter: "blur(8px)",
                  }}
                />

                {/* Horizontal Highlight - Lying Effect - Ultra Refined */}
                <motion.div
                  className="absolute top-0 left-0 h-full rounded-[20px] pointer-events-none"
                  animate={{
                    opacity: [0.3, 0.5, 0.3],
                    x: ["-50%", "150%", "-50%"],
                  }}
                  transition={{
                    duration: 5,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  style={{
                    width: "40%",
                    background: theme === "dark"
                      ? "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.35), rgba(255, 255, 255, 0.25), transparent)"
                      : "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), rgba(255, 255, 255, 0.5), rgba(255, 255, 255, 0.4), transparent)",
                    filter: "blur(6px)",
                  }}
                />

                {/* Radial Glow from Center */}
                <motion.div
                  className="absolute inset-0 rounded-[20px] pointer-events-none opacity-0 group-hover/cta-projekte:opacity-100 transition-opacity duration-500"
                  style={{
                    background: theme === "dark"
                      ? "radial-gradient(ellipse at center, rgba(168, 85, 247, 0.25), transparent 70%)"
                      : "radial-gradient(ellipse at center, rgba(124, 58, 237, 0.2), transparent 70%)",
                    filter: "blur(20px)",
                  }}
                />

                {/* Content - Responsive Text */}
                <span className="relative z-10 flex items-center justify-center gap-1.5 lg:gap-2 xl:gap-2.5" style={{ color: "#FFFFFF" }}>
                  <span className="font-semibold tracking-wide">Kostenlose Systemanalyse anfragen</span>
                  <motion.svg
                    className="w-3.5 h-3.5 lg:w-4 lg:h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                    initial={{ x: 0 }}
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </motion.svg>
                </span>

                {/* Hover State Enhancement */}
                <motion.div
                  className="absolute inset-0 rounded-[20px] pointer-events-none opacity-0 group-hover/cta-projekte:opacity-100 transition-opacity duration-500"
                  style={{
                    boxShadow: theme === "dark"
                      ? "0 12px 48px rgba(0, 0, 0, 0.5), 0 0 0 0.5px rgba(255, 255, 255, 0.2) inset, 0 0 60px rgba(168, 85, 247, 0.3), 0 0 100px rgba(139, 92, 246, 0.2)"
                      : "0 12px 48px rgba(0, 0, 0, 0.2), 0 0 0 0.5px rgba(255, 255, 255, 0.4) inset, 0 0 50px rgba(124, 58, 237, 0.25), 0 0 80px rgba(139, 92, 246, 0.15)",
                  }}
                />
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  );
}
