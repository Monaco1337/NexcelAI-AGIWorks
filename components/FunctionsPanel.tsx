"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";

// System Domains Data - Enterprise Grade
const systemDomains = [
  {
    id: "unternehmenssteuerung",
    title: "Unternehmenssteuerung",
    capabilities: [
      "Strategische Planungszyklen automatisieren",
      "Ressourcenallokation nach Regeln",
      "Performance-Metriken aggregieren",
      "Budgetplanung und -kontrolle",
      "Risikomanagement nach Modellen",
      "Compliance-Monitoring",
      "Reporting-Generierung",
      "Entscheidungsunterstützung"
    ],
    independence: [
      "Keine manuellen Planungszyklen",
      "Keine Excel-basierte Steuerung",
      "Keine Intuitionsentscheidungen",
      "Vollständige Nachvollziehbarkeit"
    ]
  },
  {
    id: "prozesse-workflows",
    title: "Prozesse & Workflows",
    capabilities: [
      "End-to-End Prozessautomatisierung",
      "Ereignisbasierte Abläufe",
      "Eskalations- & Priorisierungslogiken",
      "Abhängigkeitsketten",
      "SLA-gesteuerte Prozesse",
      "Fehler- & Ausnahmebehandlung",
      "Systemübergreifende Integration",
      "Prozessdokumentation automatisch"
    ],
    independence: [
      "Keine manuelle Koordination",
      "Keine Tool-Wechsel",
      "Kein Wissensverlust",
      "Kein Stillstand bei Ausfällen",
      "Volle Kontrolle über Abläufe"
    ]
  },
  {
    id: "kommunikation-crm",
    title: "Kommunikation & CRM",
    capabilities: [
      "Kundenkommunikation automatisieren",
      "Lead-Management und -Qualifizierung",
      "Kundenbeziehungen nach Regeln pflegen",
      "Support-Tickets routen",
      "Kundenfeedback aggregieren",
      "Personalisiertes Marketing",
      "CRM-Daten synchronisieren",
      "Kommunikationskanäle bündeln"
    ],
    independence: [
      "Keine Zettelwirtschaft",
      "Keine Medienbrüche",
      "Keine manuelle Übertragung",
      "Zentrale Nachvollziehbarkeit"
    ]
  },
  {
    id: "daten-entscheidungen",
    title: "Daten & Entscheidungen",
    capabilities: [
      "Datenaggregation aus Quellen",
      "Echtzeit-Analytics",
      "Predictive Analytics",
      "Entscheidungsmodelle",
      "Datenqualität sicherstellen",
      "Reporting automatisieren",
      "Datenvisualisierung",
      "Insights generieren"
    ],
    independence: [
      "Keine Dateninseln",
      "Keine manuelle Auswertung",
      "Keine unvollständigen Informationen",
      "Einheitliche Datenarchitektur"
    ]
  },
  {
    id: "infrastruktur-sicherheit",
    title: "Infrastruktur & Sicherheit",
    capabilities: [
      "Systemüberwachung 24/7",
      "Automatische Skalierung",
      "Sicherheitsmonitoring",
      "Backup und Recovery",
      "Compliance-Audits",
      "Zugriffskontrolle",
      "Vulnerability-Management",
      "Incident-Response"
    ],
    independence: [
      "Keine reaktive Wartung",
      "Keine manuelle Überwachung",
      "Keine unentdeckten Ausfälle",
      "Proaktive Systeme"
    ]
  },
  {
    id: "autonome-ki-agenten",
    title: "Autonome KI-Agenten",
    capabilities: [
      "Autonome Aufgabenausführung",
      "Kontextverständnis und -adaption",
      "Multi-Agent-Koordination",
      "Lernfähige Systeme",
      "Autonome Entscheidungsfindung",
      "Proaktive Problemlösung",
      "Selbstoptimierung",
      "Autonome Kommunikation"
    ],
    independence: [
      "Kein Mikromanagement",
      "Keine wiederholenden Entscheidungen",
      "Keine manuelle Intervention",
      "Autonome Handlungsfähigkeit"
    ]
  }
];

export default function FunctionsPanel({ 
  isOpen, 
  onClose, 
  isMobile = false 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  isMobile?: boolean;
}) {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/FunctionsPanel.tsx:132',message:'FunctionsPanel function executing',data:{isOpen,isMobile,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  
  const { theme } = useTheme();
  const [selectedDomain, setSelectedDomain] = useState<string | null>(systemDomains[0]?.id || null);
  const [openAccordionKey, setOpenAccordionKey] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const domainRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const accordionRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  // Check if mobile viewport (< 768px)
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Use isMobile prop or internal mobile view check
  const isMobileMode = isMobile || isMobileView;
  
  // Auto-select first domain on open (Desktop)
  useEffect(() => {
    if (isOpen && !selectedDomain && !isMobileMode) {
      setSelectedDomain(systemDomains[0]?.id || null);
    }
  }, [isOpen, selectedDomain, isMobileMode]);

  // Reset accordion state when panel closes
  useEffect(() => {
    if (!isOpen && isMobileMode) {
      setOpenAccordionKey(null);
    }
  }, [isOpen, isMobileMode]);

  // Toggle accordion
  const toggleAccordion = useCallback((key: string) => {
    setOpenAccordionKey(prev => {
      const newKey = prev === key ? null : key;
      // Smooth scroll to opened item
      if (newKey && accordionRefs.current[newKey]) {
        setTimeout(() => {
          accordionRefs.current[newKey]?.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'nearest' 
          });
        }, 100);
      }
      return newKey;
    });
  }, []);

  // Escape key handler for closing panel
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = (index + 1) % systemDomains.length;
      domainRefs.current[nextIndex]?.focus();
      setSelectedDomain(systemDomains[nextIndex].id);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = (index - 1 + systemDomains.length) % systemDomains.length;
      domainRefs.current[prevIndex]?.focus();
      setSelectedDomain(systemDomains[prevIndex].id);
    } else if (e.key === 'Home') {
      e.preventDefault();
      domainRefs.current[0]?.focus();
      setSelectedDomain(systemDomains[0].id);
    } else if (e.key === 'End') {
      e.preventDefault();
      const lastIndex = systemDomains.length - 1;
      domainRefs.current[lastIndex]?.focus();
      setSelectedDomain(systemDomains[lastIndex].id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // Focus trap for keyboard navigation (Desktop only)
  useEffect(() => {
    if (isOpen && !isMobileMode && panelRef.current) {
      const firstButton = panelRef.current.querySelector('button') as HTMLButtonElement;
      firstButton?.focus();
    }
  }, [isOpen, isMobileMode]);

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/FunctionsPanel.tsx:244',message:'FunctionsPanel before render check',data:{isOpen,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  if (!isOpen) return null;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/42fed8ac-c59f-4f44-bda3-7be9ba8d0144',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'components/FunctionsPanel.tsx:248',message:'FunctionsPanel rendering JSX',data:{isOpen,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion

  const selectedDomainData = selectedDomain 
    ? systemDomains.find(d => d.id === selectedDomain)
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - Only for Mobile */}
          {isMobileMode && (
            <motion.div
              className="fixed inset-0 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // Strongest stop to prevent any parent handler from firing
                if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
                onClose();
              }}
              onMouseDown={(e) => {
                // Prevent clicks from passing through backdrop
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
              }}
              style={{
                background: theme === "dark" 
                  ? "rgba(0, 0, 0, 0.7)" 
                  : "rgba(0, 0, 0, 0.5)",
                backdropFilter: "blur(8px)",
                WebkitBackdropFilter: "blur(8px)",
                pointerEvents: 'auto',
              }}
            />
          )}

          {/* Panel */}
          <motion.div
            ref={panelRef}
            className={`functions-panel ${theme === "light" ? "light" : ""} ${
              isMobileMode 
                ? "fixed inset-0 z-50" 
                : "absolute left-0 top-full w-full mt-4 z-50"
            }`}
            initial={{ opacity: 0, y: isMobileMode ? "100%" : -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMobileMode ? "100%" : -20 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => {
              e.stopPropagation();
              // Prevent any parent handlers
              if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                (e.nativeEvent as any).stopImmediatePropagation();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                  (e.nativeEvent as any).stopImmediatePropagation();
                }
                onClose();
              }
            }}
            onMouseDown={(e) => {
              // Prevent any parent click handlers
              e.stopPropagation();
              if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                (e.nativeEvent as any).stopImmediatePropagation();
              }
            }}
            style={!isMobileMode ? { maxHeight: "calc(100vh - 200px)" } : {}}
          >
            <div
              className={`relative w-full h-full rounded-2xl ${
                isMobileMode ? "overflow-y-auto" : "overflow-hidden"
              }`}
              style={{
                background: theme === "dark"
                  ? "rgba(15, 18, 24, 0.90)"
                  : "rgba(255, 255, 255, 0.96)",
                backdropFilter: "blur(10px) saturate(130%)",
                WebkitBackdropFilter: "blur(10px) saturate(130%)",
                border: theme === "dark"
                  ? "1px solid rgba(255, 255, 255, 0.06)"
                  : "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: theme === "dark"
                  ? "0 24px 48px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.04)"
                  : "0 24px 48px rgba(0, 0, 0, 0.20), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
              }}
            >
              {/* Mobile Header - Premium Close Button */}
              {isMobileMode && (
                <div className="relative flex items-center justify-between px-6 py-5 border-b" style={{
                  borderColor: theme === "dark" 
                    ? "rgba(255, 255, 255, 0.08)" 
                    : "rgba(0, 0, 0, 0.08)"
                }}>
                  <h2 className="text-xl font-semibold tracking-tight" style={{
                    color: theme === "dark" ? "#FFFFFF" : "#0C0F1A",
                    fontFamily: "var(--font-headline), -apple-system, BlinkMacSystemFont, 'SF Pro Display', system-ui, sans-serif",
                  }}>
                    Funktionen
                  </h2>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      // Strongest stop to prevent any parent handler from firing
                      if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                        (e.nativeEvent as any).stopImmediatePropagation();
                      }
                      onClose();
                    }}
                    className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200 group/close"
                    style={{
                      background: theme === "dark"
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.06) 100%)"
                        : "linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.04) 100%)",
                      backdropFilter: "blur(20px) saturate(180%)",
                      WebkitBackdropFilter: "blur(20px) saturate(180%)",
                      border: theme === "dark"
                        ? "1px solid rgba(255, 255, 255, 0.12)"
                        : "1px solid rgba(0, 0, 0, 0.10)",
                      boxShadow: theme === "dark"
                        ? "0 2px 8px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)"
                        : "0 2px 8px rgba(0, 0, 0, 0.10), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = theme === "dark"
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0.12) 100%)"
                        : "linear-gradient(180deg, rgba(0, 0, 0, 0.12) 0%, rgba(0, 0, 0, 0.08) 100%)";
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = theme === "dark"
                        ? "linear-gradient(180deg, rgba(255, 255, 255, 0.10) 0%, rgba(255, 255, 255, 0.06) 100%)"
                        : "linear-gradient(180deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.04) 100%)";
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                    onMouseDown={(e) => {
                      // Prevent any default browser behavior and stop all propagation
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                        (e.nativeEvent as any).stopImmediatePropagation();
                      }
                      e.currentTarget.style.transform = "scale(0.95)";
                    }}
                    onMouseUp={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                    }}
                    aria-label="Funktionen schließen"
                  >
                    {/* Subtle glow on hover */}
                    <div
                      className="absolute inset-0 rounded-xl opacity-0 group-hover/close:opacity-100 transition-opacity duration-300 pointer-events-none -z-10"
                      style={{
                        background: theme === "dark"
                          ? "radial-gradient(circle, rgba(183, 140, 255, 0.2), transparent 70%)"
                          : "radial-gradient(circle, rgba(124, 58, 237, 0.15), transparent 70%)",
                        filter: "blur(12px)",
                      }}
                    />
                    <svg 
                      className="w-5 h-5 relative z-10" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor" 
                      strokeWidth={3}
                      style={{
                        color: theme === "dark" ? "rgba(255, 255, 255, 0.95)" : "rgba(0, 0, 0, 0.85)",
                      }}
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        d="M6 18L18 6M6 6l12 12" 
                        vectorEffect="non-scaling-stroke"
                      />
                    </svg>
                  </button>
                </div>
              )}

              {/* Content */}
              {isMobileMode ? (
                /* Mobile: Accordion Layout */
                <div className="p-5 space-y-3" style={{ maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}>
                  {systemDomains.map((domain) => {
                    const isOpen = openAccordionKey === domain.id;
                    return (
                      <div 
                        key={domain.id} 
                        ref={(el) => { accordionRefs.current[domain.id] = el; }}
                        onClick={(e) => {
                          // Prevent any parent click handlers from firing
                          e.stopPropagation();
                          if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                            (e.nativeEvent as any).stopImmediatePropagation();
                          }
                        }}
                        onMouseDown={(e) => {
                          // Prevent any parent handlers
                          e.stopPropagation();
                          if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                            (e.nativeEvent as any).stopImmediatePropagation();
                          }
                        }}
                      >
                        <button
                          type="button"
                          id={`accordion-${domain.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            // Strongest stop to prevent any parent handler (Link, row, overlay) from firing
                            if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                              (e.nativeEvent as any).stopImmediatePropagation();
                            }
                            toggleAccordion(domain.id);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                                (e.nativeEvent as any).stopImmediatePropagation();
                              }
                              toggleAccordion(domain.id);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              e.stopPropagation();
                              if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                                (e.nativeEvent as any).stopImmediatePropagation();
                              }
                              onClose();
                            }
                          }}
                          onMouseDown={(e) => {
                            // Prevent any default browser behavior and stop all propagation
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.nativeEvent && typeof (e.nativeEvent as any).stopImmediatePropagation === 'function') {
                              (e.nativeEvent as any).stopImmediatePropagation();
                            }
                          }}
                          className={`accordion-row ${isOpen ? "accordion-row--active" : ""} ${theme === "light" ? "light" : ""}`}
                          aria-expanded={isOpen}
                          aria-controls={`domain-panel-${domain.id}`}
                          aria-label={`${domain.title} ${isOpen ? 'schließen' : 'öffnen'}`}
                        >
                          <span className="flex-1 text-left">{domain.title}</span>
                          <span className="accordion-icon flex-shrink-0" aria-hidden="true">
                            {isOpen ? (
                              <svg 
                                className="w-5 h-5" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor" 
                                strokeWidth={3}
                                style={{
                                  color: theme === "dark" ? "rgba(183, 140, 255, 0.9)" : "rgba(124, 58, 237, 0.9)",
                                }}
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M6 18L18 6M6 6l12 12" 
                                  vectorEffect="non-scaling-stroke"
                                />
                              </svg>
                            ) : (
                              <svg 
                                className="w-5 h-5" 
                                fill="none" 
                                viewBox="0 0 24 24" 
                                stroke="currentColor" 
                                strokeWidth={3}
                                style={{
                                  color: theme === "dark" ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.7)",
                                }}
                              >
                                <path 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round" 
                                  d="M12 4.5v15m7.5-7.5h-15" 
                                  vectorEffect="non-scaling-stroke"
                                />
                              </svg>
                            )}
                          </span>
                        </button>
                        
                        <div
                          id={`domain-panel-${domain.id}`}
                          role="region"
                          aria-labelledby={`accordion-${domain.id}`}
                          className="accordion-panel"
                          style={{
                            maxHeight: isOpen ? '2000px' : '0',
                            opacity: isOpen ? 1 : 0,
                          }}
                        >
                          {isOpen && (
                            <div className="accordion-panel-content">
                              {/* Capabilities Section */}
                              <div className="accordion-section">
                                <h4 className="accordion-section-title">Capabilities</h4>
                                <div className="space-y-2">
                                  {domain.capabilities.map((capability, idx) => (
                                    <div key={idx} className="accordion-item">
                                      {capability}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Independence Section */}
                              <div className="accordion-section">
                                <h4 className="accordion-section-title">Unabhängigkeit</h4>
                                <div className="space-y-2">
                                  {domain.independence.map((statement, idx) => (
                                    <div key={idx} className="accordion-item accordion-item--independence">
                                      {statement}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* Desktop/Tablet: 3-column Layout */
                <div className="mega-panel p-6 lg:p-7 grid gap-6 lg:gap-7">
                  {/* LEFT: System Domains */}
                  <div className="mega-divider" style={{ paddingRight: "1.5rem" }}>
                    <h3 className="mega-heading">System Domains</h3>
                    <div className="space-y-1">
                      {systemDomains.map((domain, index) => {
                        const isActive = selectedDomain === domain.id;
                        return (
                          <button
                            key={domain.id}
                            ref={(el) => { domainRefs.current[index] = el; }}
                            onClick={() => setSelectedDomain(domain.id)}
                            onMouseEnter={() => setSelectedDomain(domain.id)}
                            onKeyDown={(e) => handleKeyDown(e, index)}
                            className={`mega-item ${isActive ? "mega-item--active" : ""}`}
                            aria-pressed={isActive}
                            aria-label={`${domain.title} auswählen`}
                          >
                            {domain.title}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* MIDDLE: Capabilities */}
                  <div className="mega-divider" style={{ paddingLeft: "1.5rem", paddingRight: "1.5rem" }}>
                    <h3 className="mega-heading">Capabilities</h3>
                    {selectedDomainData ? (
                      <div className="space-y-2">
                        {selectedDomainData.capabilities.map((capability, idx) => (
                          <div key={idx} className="mega-chip">
                            {capability}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm" style={{
                        color: theme === "dark" 
                          ? "rgba(255, 255, 255, 0.4)" 
                          : "rgba(0, 0, 0, 0.4)"
                      }}>
                        Wählen Sie eine System Domain
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Independence Effect */}
                  <div className="mega-panel-independence" style={{ paddingLeft: "1.5rem" }}>
                    <h3 className="mega-heading">Unabhängigkeit</h3>
                    {selectedDomainData ? (
                      <div className="space-y-2.5">
                        {selectedDomainData.independence.map((statement, idx) => (
                          <div key={idx} className="mega-chip mega-chip--independence">
                            {statement}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-sm" style={{
                        color: theme === "dark" 
                          ? "rgba(255, 255, 255, 0.4)" 
                          : "rgba(0, 0, 0, 0.4)"
                      }}>
                        Wählen Sie eine System Domain
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
