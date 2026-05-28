"use client";

import { motion, AnimatePresence } from "framer-motion";
import { memo, useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import Link from "next/link";
import dynamic from "next/dynamic";

// Lazy load dashboard components
const ChronexDashboard = dynamic(() => import("@/components/ChronexDashboard"), {
  ssr: false,
  loading: () => <div className="h-64 bg-white/[0.02] rounded-xl animate-pulse" />
});

const PflegeDashboard = dynamic(() => import("@/components/PflegeDashboard"), {
  ssr: false,
  loading: () => <div className="h-64 bg-white/[0.02] rounded-xl animate-pulse" />
});

// Placeholder dashboards for new projects
const ContentOSDashboard = () => (
  <div className="w-full h-full rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-400/20 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
        <svg className="w-8 h-8 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <p className="text-sm text-purple-300/70">Content-OS Dashboard</p>
    </div>
  </div>
);

const NEXCELCoreDashboard = () => (
  <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-400/20 flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center">
        <svg className="w-8 h-8 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <p className="text-sm text-blue-300/70">NEXCEL Core Dashboard</p>
    </div>
  </div>
);

type Project = {
  title: string;
  subtitle: string;
  description: string;
  dashboard: React.ComponentType;
  features: string[];
  link: string;
};

const projects: Project[] = [
  {
    title: "Chronex AI",
    subtitle: "KI-Logistiksystem",
    description: "Autonome Tourenoptimierung für Speditionen. Reduziert Verwaltungsaufwand um 70%.",
    dashboard: ChronexDashboard,
    features: ["Automatische Disposition", "Echtzeit-Tracking", "Routenoptimierung", "24/7 Automation"],
    link: "/projekte",
  },
  {
    title: "Pflege-CRM",
    subtitle: "Automatisierte Verwaltung",
    description: "KI-gestütztes CRM für Pflegedienste. Automatisierte Dokumentation, intelligente Planung.",
    dashboard: PflegeDashboard,
    features: ["Automatische Dokumentation", "Intelligente Planung", "DSGVO-konform", "Mobile App"],
    link: "/projekte",
  },
  {
    title: "Content-OS",
    subtitle: "Social Media Planning",
    description: "Zentrale Plattform zum Planen, Schreiben und Veröffentlichen von Social-Media-Content – mit KI-Unterstützung, Vorlagen und Freigabe-Prozessen.",
    dashboard: ContentOSDashboard,
    features: ["Content-Kalender", "KI-Textgenerierung", "Freigabe-Workflows", "Multi-Channel Publishing"],
    link: "/projekte",
  },
  {
    title: "NEXCEL Core",
    subtitle: "Operations Dashboard",
    description: "Ein Dashboard, das Kennzahlen, Automationen und Systemzustände bündelt – für schnelle Entscheidungen und klare Übersicht.",
    dashboard: NEXCELCoreDashboard,
    features: ["Echtzeit-Monitoring", "KI-Systemsteuerung", "Performance-Analytics", "Alert-Management"],
    link: "/projekte",
  },
];

const ProjectCard = memo(({ project, index }: { project: Project; index: number }) => {
  const { theme } = useTheme();
  
  return (
    <motion.div
      className="group relative h-full flex flex-col"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1], delay: index * 0.1 }}
      whileHover={{ scale: 1.0 }}
      style={{ willChange: "transform, opacity" }}
    >
      {/* Main Card Container - Ultra High-End Apple Design */}
      <div
        className="relative rounded-[28px] overflow-hidden isolation-isolate h-full flex flex-col"
        style={{
          background: theme === "dark"
            ? "linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.10) 30%, rgba(255, 255, 255, 0.06) 60%, rgba(255, 255, 255, 0.03) 100%)"
            : "linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
          backdropFilter: "blur(40px) saturate(200%)",
          WebkitBackdropFilter: "blur(40px) saturate(200%)",
          border: theme === "dark"
            ? "1px solid rgba(255, 255, 255, 0.25)"
            : "1px solid rgba(0, 0, 0, 0.12)",
          boxShadow: theme === "dark"
            ? "0 20px 60px rgba(0, 0, 0, 0.6), 0 0 0 0.5px rgba(255, 255, 255, 0.15) inset, 0 2px 4px rgba(0, 0, 0, 0.4) inset, 0 -2px 2px rgba(255, 255, 255, 0.08) inset"
            : "0 20px 60px rgba(0, 0, 0, 0.15), 0 0 0 0.5px rgba(0, 0, 0, 0.08) inset",
        }}
      >
        {/* Glowing Edge Accents */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-70 transition-opacity duration-300 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), rgba(168, 85, 247, 0.6), rgba(139, 92, 246, 0.6), rgba(255, 255, 255, 0.8), transparent)",
            boxShadow: "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(139, 92, 246, 0.3)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-[2px] opacity-60 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), rgba(168, 85, 247, 0.6), rgba(139, 92, 246, 0.6), rgba(255, 255, 255, 0.8), transparent)",
            boxShadow: "0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(139, 92, 246, 0.3)",
          }}
        />

        {/* Base Color Layer */}
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: theme === "dark"
              ? "linear-gradient(135deg, rgba(168, 85, 247, 0.12) 0%, rgba(139, 92, 246, 0.08) 25%, transparent 50%, rgba(99, 102, 241, 0.08) 75%, rgba(168, 85, 247, 0.12) 100%)"
              : "linear-gradient(135deg, rgba(124, 58, 237, 0.08) 0%, rgba(139, 92, 246, 0.06) 100%)",
          }}
        />

        {/* Radial Glow Layer */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-[200%] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: theme === "dark"
              ? "radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(139, 92, 246, 0.10) 30%, transparent 70%)"
              : "radial-gradient(circle, rgba(124, 58, 237, 0.12) 0%, transparent 70%)",
          }}
        />

        {/* Gloss Shine Effect */}
        <motion.div
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
          initial={{ x: "-100%", opacity: 0 }}
          whileHover={{ x: "100%", opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          style={{
            background: "linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 p-6 md:p-10 lg:p-12 flex flex-col flex-1">
          <div className="mb-4 md:mb-6">
            <h3
              className="text-xl md:text-2xl lg:text-3xl font-bold mb-2 tracking-tight"
              style={{
                color: theme === "dark" ? "#FFFFFF" : "#000000",
                textShadow: theme === "dark" ? "0 0 30px rgba(168, 85, 247, 0.3)" : "none",
              }}
            >
              {project.title}
            </h3>
            <p
              className="text-sm md:text-base font-semibold"
              style={{
                color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
              }}
            >
              {project.subtitle}
            </p>
          </div>

          <p
            className="text-xs md:text-sm lg:text-base font-light leading-relaxed mb-4 md:mb-6"
            style={{
              color: theme === "dark" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.7)",
            }}
          >
            {project.description}
          </p>

          <div className="mb-4 md:mb-6" style={{ minHeight: "700px" }}>
            <project.dashboard />
          </div>

          <div className="flex flex-wrap gap-2 mb-4 md:mb-6">
            {project.features.map((feature, i) => (
              <span
                key={i}
                className={`px-2 md:px-3 py-1 md:py-1.5 rounded-lg text-xs font-medium transition-colors duration-500 ${
                  theme === "dark"
                    ? "bg-white/[0.05] text-white/70 border border-white/[0.1]"
                    : "bg-[#0C0F1A]/5 text-[#1B2030]/70 border border-[#0C0F1A]/10"
                }`}
              >
                {feature}
              </span>
            ))}
          </div>

          <div className="mt-auto">
            <Link href={project.link}>
              <motion.button
                className={`w-full py-2 md:py-3 rounded-xl font-medium text-xs md:text-sm transition-colors duration-500 ${
                  theme === "dark"
                    ? "bg-white/[0.05] text-white border border-white/[0.1] hover:bg-white/[0.1]"
                    : "bg-[#0C0F1A]/5 text-[#0C0F1A] border border-[#0C0F1A]/10 hover:bg-[#0C0F1A]/10"
                }`}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                Mehr erfahren →
              </motion.button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hover Glow Enhancement - Outer */}
      <div
        className="absolute inset-0 rounded-[28px] opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none -z-10"
        style={{
          background: theme === "dark"
            ? "radial-gradient(circle, rgba(168, 85, 247, 0.25), transparent 70%)"
            : "radial-gradient(circle, rgba(124, 58, 237, 0.18), transparent 70%)",
          filter: "blur(50px)",
          transform: "scale(1.15)",
        }}
      />
    </motion.div>
  );
});
ProjectCard.displayName = "ProjectCard";

export default function ProjectsSlider() {
  const { theme } = useTheme();
  const [currentIndex, setCurrentIndex] = useState(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileCardIndex, setMobileCardIndex] = useState(0);
  
  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Desktop: 1-2 cards per slide, Mobile: 1 card per slide
  const cardsPerSlide = isMobile ? 1 : 1; // Desktop: 1 card per slide (can be adjusted to 1.2 for partial view)
  const maxSlides = Math.ceil(projects.length / cardsPerSlide);
  
  // Clamp currentIndex to valid range
  const clampedIndex = Math.max(0, Math.min(maxSlides - 1, currentIndex));

  // Mobile navigation functions
  const nextMobileCard = () => {
    setMobileCardIndex((prev) => Math.min(projects.length - 1, prev + 1));
  };

  const prevMobileCard = () => {
    setMobileCardIndex((prev) => Math.max(0, prev - 1));
  };

  const goToMobileCard = (index: number) => {
    setMobileCardIndex(Math.max(0, Math.min(projects.length - 1, index)));
  };

  // Desktop navigation functions
  const nextSlide = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev + 1;
      return Math.min(maxSlides - 1, Math.max(0, newIndex));
    });
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => {
      const newIndex = prev - 1;
      return Math.max(0, Math.min(maxSlides - 1, newIndex));
    });
  };
  
  const goToSlide = (index: number) => {
    setCurrentIndex(Math.max(0, Math.min(maxSlides - 1, index)));
  };

  // Sync mobile scroll position with card index
  useEffect(() => {
    if (isMobile && mobileScrollRef.current) {
      const container = mobileScrollRef.current;
      const cardElement = container.querySelector(`[data-card-index="${mobileCardIndex}"]`) as HTMLElement;
      if (cardElement) {
        const containerRect = container.getBoundingClientRect();
        const cardRect = cardElement.getBoundingClientRect();
        const scrollLeft = cardRect.left - containerRect.left + container.scrollLeft;
        container.scrollTo({
          left: scrollLeft - (containerRect.width - cardRect.width) / 2,
          behavior: 'smooth'
        });
      }
    }
  }, [mobileCardIndex, isMobile]);
  
  // Update mobile card index based on scroll position
  useEffect(() => {
    if (!isMobile || !mobileScrollRef.current) return;
    
    const handleScroll = () => {
      if (mobileScrollRef.current) {
        const container = mobileScrollRef.current;
        const containerRect = container.getBoundingClientRect();
        const containerCenter = containerRect.left + containerRect.width / 2;
        
        // Find which card is closest to center
        let closestIndex = 0;
        let closestDistance = Infinity;
        
        projects.forEach((_, index) => {
          const cardElement = container.querySelector(`[data-card-index="${index}"]`) as HTMLElement;
          if (cardElement) {
            const cardRect = cardElement.getBoundingClientRect();
            const cardCenter = cardRect.left + cardRect.width / 2;
            const distance = Math.abs(cardCenter - containerCenter);
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIndex = index;
            }
          }
        });
        
        if (closestIndex !== mobileCardIndex) {
          setMobileCardIndex(closestIndex);
        }
      }
    };
    
    const scrollContainer = mobileScrollRef.current;
    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [isMobile, mobileCardIndex]);

  return (
    <section 
      className="relative px-4 sm:px-6 overflow-hidden" 
      style={{ 
        paddingTop: "clamp(60px, 12vw, 120px)",
        paddingBottom: "clamp(60px, 12vw, 120px)",
        background: theme === "dark" 
          ? "linear-gradient(180deg, #0C0F1A 0%, #111622 100%)"
          : "linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)",
      }}
    >
      <div className="relative z-10 max-w-7xl mx-auto">
        <motion.div
          className="text-center mb-8 md:mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          <motion.h2 
            className="font-bold tracking-tight typography-h1 typography-h1-gradient"
            style={{ fontSize: "clamp(28px, 4.5vw, 56px)", lineHeight: "1.05", marginBottom: "clamp(12px, 2.5vw, 24px)" }}
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <span className="typography-h1-gradient">Projekte</span> im Einsatz
          </motion.h2>
        </motion.div>

        {/* High-End Slider */}
        <div className="relative" style={{ pointerEvents: "auto" }}>
          <div className="flex items-center gap-2 sm:gap-4 md:gap-6" style={{ position: "relative", zIndex: 10 }}>
            {/* Left Navigation Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isMobile) {
                  prevMobileCard();
                } else {
                  prevSlide();
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isMobile) {
                  prevMobileCard();
                } else {
                  prevSlide();
                }
              }}
              disabled={isMobile ? mobileCardIndex === 0 : clampedIndex === 0}
              className={`flex flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full items-center justify-center transition-all duration-300 group ${
                (isMobile ? mobileCardIndex === 0 : clampedIndex === 0)
                  ? "opacity-30 cursor-not-allowed" 
                  : "cursor-pointer hover:scale-105 active:scale-95"
              }`}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(194, 107, 255, 0.3)",
                boxShadow: (isMobile ? mobileCardIndex === 0 : clampedIndex === 0)
                  ? "none"
                  : "0 0 20px rgba(194, 107, 255, 0.2), 0 0 40px rgba(194, 107, 255, 0.1)",
                pointerEvents: "auto",
                zIndex: 50,
                position: "relative",
              }}
            >
              <svg 
                className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform pointer-events-none" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ pointerEvents: "none" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Slider Container */}
            <div 
              ref={sliderRef}
              className="flex-1 overflow-hidden rounded-3xl"
            >
              {/* Mobile: Horizontal Scroll with Snap */}
              <div 
                ref={mobileScrollRef}
                className="md:hidden overflow-x-auto scrollbar-hide"
                style={{
                  scrollSnapType: 'x mandatory',
                  WebkitOverflowScrolling: 'touch',
                  scrollBehavior: 'smooth',
                  paddingLeft: '4%',
                  paddingRight: '4%',
                  pointerEvents: "auto",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <div className="flex gap-4">
                  {projects.map((project, index) => (
                    <div
                      key={index}
                      data-card-index={index}
                      className="flex-shrink-0"
                      style={{ 
                        scrollSnapAlign: 'center',
                        width: '92%',
                        maxWidth: '400px',
                      }}
                    >
                      <ProjectCard 
                        project={project} 
                        index={index}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Desktop: Motion-based Slider */}
              <motion.div
                className="hidden md:flex"
                animate={{ x: `-${clampedIndex * 100}%` }}
                transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
              >
                {Array.from({ length: maxSlides }).map((_, slideIndex) => {
                  const startIndex = slideIndex * cardsPerSlide;
                  const endIndex = Math.min(startIndex + cardsPerSlide, projects.length);
                  const slideProjects = projects.slice(startIndex, endIndex);
                  
                  return (
                    <div key={slideIndex} className="min-w-full px-2 flex justify-center">
                      <div className="w-full max-w-2xl">
                        {slideProjects.map((project, cardIndex) => (
                          <ProjectCard 
                            key={startIndex + cardIndex} 
                            project={project} 
                            index={startIndex + cardIndex}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </div>

            {/* Right Navigation Button */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isMobile) {
                  nextMobileCard();
                } else {
                  nextSlide();
                }
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (isMobile) {
                  nextMobileCard();
                } else {
                  nextSlide();
                }
              }}
              disabled={isMobile ? mobileCardIndex === projects.length - 1 : clampedIndex === maxSlides - 1}
              className={`flex flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full items-center justify-center transition-all duration-300 group ${
                (isMobile ? mobileCardIndex === projects.length - 1 : clampedIndex === maxSlides - 1)
                  ? "opacity-30 cursor-not-allowed" 
                  : "cursor-pointer hover:scale-105 active:scale-95"
              }`}
              style={{
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(194, 107, 255, 0.3)",
                boxShadow: (isMobile ? mobileCardIndex === projects.length - 1 : clampedIndex === maxSlides - 1)
                  ? "none"
                  : "0 0 20px rgba(194, 107, 255, 0.2), 0 0 40px rgba(194, 107, 255, 0.1)",
                pointerEvents: "auto",
                zIndex: 50,
                position: "relative",
              }}
            >
              <svg 
                className="w-5 h-5 md:w-6 md:h-6 text-white group-hover:scale-110 transition-transform pointer-events-none" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                style={{ pointerEvents: "none" }}
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Mobile: Dots Pager - NEXCEL Style */}
          <div className="flex md:hidden justify-center gap-2 mt-6 px-4">
            {projects.map((_, index) => {
              const isActive = index === mobileCardIndex;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToMobileCard(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 shadow-lg shadow-purple-500/50" 
                      : "w-2 bg-white/20 active:bg-white/40"
                  }`}
                  aria-label={`Go to project ${index + 1}`}
                  style={{
                    boxShadow: isActive ? "0 0 12px rgba(168, 85, 247, 0.4)" : "none",
                  }}
                />
              );
            })}
          </div>

          {/* Desktop: Slider Indicators - One dot per project */}
          <div className="hidden md:flex justify-center gap-2 mt-8">
            {projects.map((_, index) => {
              const projectSlideIndex = Math.floor(index / cardsPerSlide);
              const isActive = projectSlideIndex === clampedIndex;
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => goToSlide(projectSlideIndex)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isActive
                      ? "w-6 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 shadow-lg shadow-purple-500/50" 
                      : "w-2 bg-white/30 hover:bg-white/50"
                  }`}
                  aria-label={`Go to project ${index + 1}`}
                  style={{
                    boxShadow: isActive ? "0 0 12px rgba(168, 85, 247, 0.4)" : "none",
                  }}
                />
              );
            })}
          </div>
        </div>

        {/* CTA Button */}
        <motion.div
          className="text-center mt-12 md:mt-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ willChange: "transform, opacity" }}
        >
          <Link href="/projekte" prefetch={true}>
            <motion.button
              className="relative px-6 md:px-8 lg:px-10 xl:px-12 py-3 md:py-4 lg:py-5 rounded-[16px] md:rounded-[18px] lg:rounded-[20px] font-semibold text-sm md:text-base tracking-wide overflow-hidden group/projekte whitespace-nowrap w-full sm:w-auto"
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.06, y: -2 }}
              whileTap={{ scale: 0.96 }}
              style={{ willChange: "transform" }}
            >
              {/* Base Gradient Background */}
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

              <span className="relative z-10 flex items-center justify-center gap-1.5 lg:gap-2 xl:gap-2.5" style={{ color: "#FFFFFF" }}>
                <span className="font-semibold tracking-wide">Alle Projekte ansehen</span>
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
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

