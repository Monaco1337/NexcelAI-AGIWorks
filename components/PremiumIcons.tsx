"use client";

// FUTURISTIC 2060 ICONS - High-End, Edel, Monochromatisch
// Semantisch korrekt, realistisch, Apple/Tesla Niveau

export const StatistikReduzierungIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stat1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.3" />
      </linearGradient>
      <filter id="stat1glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* 3D Bar Chart - Realistisch */}
    <rect x="50" y="220" width="40" height="60" rx="4" fill="url(#stat1)" filter="url(#stat1glow)" />
    <rect x="52" y="222" width="36" height="58" rx="3" fill="rgba(0,245,255,0.2)" />
    <rect x="54" y="224" width="32" height="56" rx="2" fill="rgba(255,255,255,0.1)" />
    
    <rect x="110" y="180" width="40" height="100" rx="4" fill="url(#stat1)" filter="url(#stat1glow)" />
    <rect x="112" y="182" width="36" height="98" rx="3" fill="rgba(0,245,255,0.2)" />
    <rect x="114" y="184" width="32" height="96" rx="2" fill="rgba(255,255,255,0.1)" />
    
    <rect x="170" y="100" width="40" height="180" rx="4" fill="url(#stat1)" filter="url(#stat1glow)" />
    <rect x="172" y="102" width="36" height="178" rx="3" fill="rgba(0,245,255,0.2)" />
    <rect x="174" y="104" width="32" height="176" rx="2" fill="rgba(255,255,255,0.1)" />
    
    <rect x="230" y="140" width="40" height="140" rx="4" fill="url(#stat1)" filter="url(#stat1glow)" />
    <rect x="232" y="142" width="36" height="138" rx="3" fill="rgba(0,245,255,0.2)" />
    <rect x="234" y="144" width="32" height="136" rx="2" fill="rgba(255,255,255,0.1)" />
    
    {/* Grid Lines */}
    <line x1="30" y1="280" x2="270" y2="280" stroke="rgba(0,245,255,0.2)" strokeWidth="1" />
    <line x1="30" y1="200" x2="270" y2="200" stroke="rgba(0,245,255,0.15)" strokeWidth="1" />
    <line x1="30" y1="120" x2="270" y2="120" stroke="rgba(0,245,255,0.15)" strokeWidth="1" />
  </svg>
);

export const StatistikAutomationIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="stat2" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.2" />
      </radialGradient>
      <filter id="stat2glow">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* 24/7 Clock - Realistisch */}
    <circle cx="150" cy="150" r="100" fill="none" stroke="rgba(0,245,255,0.3)" strokeWidth="2" />
    <circle cx="150" cy="150" r="80" fill="none" stroke="rgba(0,245,255,0.4)" strokeWidth="2" />
    <circle cx="150" cy="150" r="60" fill="none" stroke="rgba(0,245,255,0.5)" strokeWidth="2" />
    <circle cx="150" cy="150" r="50" fill="url(#stat2)" filter="url(#stat2glow)" />
    <circle cx="150" cy="150" r="35" fill="rgba(0,245,255,0.1)" />
    
    {/* Hour markers */}
    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => {
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x1 = 150 + Math.cos(angle) * 85;
      const y1 = 150 + Math.sin(angle) * 85;
      const x2 = 150 + Math.cos(angle) * 95;
      const y2 = 150 + Math.sin(angle) * 95;
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#00F5FF" strokeWidth="2" strokeLinecap="round" />;
    })}
    
    {/* Hands - showing continuous operation */}
    <line x1="150" y1="150" x2="150" y2="80" stroke="#00F5FF" strokeWidth="4" strokeLinecap="round" filter="url(#stat2glow)" />
    <line x1="150" y1="150" x2="190" y2="150" stroke="#00F5FF" strokeWidth="3" strokeLinecap="round" filter="url(#stat2glow)" />
    <circle cx="150" cy="150" r="6" fill="#00F5FF" />
  </svg>
);

// KI-Automationen & autonome Agenten – System-Architektur: Aufgaben → KI → Aktionen
export const KIAutomationIcon = ({ className = "w-72 h-72" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="ki-flow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.2)" />
          <stop offset="50%" stopColor="rgba(168, 85, 247, 0.4)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.2)" />
        </linearGradient>
      </defs>
      
      {/* Aufgaben (Links) */}
      <g opacity="0.8">
        <rect x="20" y="80" width="80" height="60" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <rect x="30" y="90" width="60" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
        <rect x="30" y="105" width="45" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
        <rect x="30" y="115" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      </g>
      
      <g opacity="0.8">
        <rect x="20" y="160" width="80" height="60" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <rect x="30" y="170" width="60" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
        <rect x="30" y="185" width="45" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
        <rect x="30" y="195" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      </g>
      
      {/* Pfeile: Aufgaben → KI */}
      <path d="M 110 110 L 160 150" stroke="url(#ki-flow)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 110 190 L 160 150" stroke="url(#ki-flow)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <polygon points="155,148 160,150 155,152" fill="rgba(168, 85, 247, 0.4)" />
      
      {/* KI-Zentrum (Mitte) */}
      <circle cx="200" cy="150" r="40" fill="rgba(168, 85, 247, 0.1)" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" />
      <circle cx="200" cy="150" r="25" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" />
      <circle cx="200" cy="150" r="12" fill="rgba(168, 85, 247, 0.3)" />
      
      {/* Pfeile: KI → Aktionen */}
      <path d="M 240 150 L 290 110" stroke="url(#ki-flow)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M 240 150 L 290 190" stroke="url(#ki-flow)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <polygon points="285,108 290,110 285,112" fill="rgba(168, 85, 247, 0.4)" />
      <polygon points="285,188 290,190 285,192" fill="rgba(168, 85, 247, 0.4)" />
      
      {/* Aktionen (Rechts) */}
      <g opacity="0.8">
        <rect x="300" y="80" width="80" height="60" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <circle cx="320" cy="100" r="6" fill="rgba(168, 85, 247, 0.4)" />
        <rect x="335" y="95" width="35" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
        <rect x="320" y="110" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      </g>
      
      <g opacity="0.8">
        <rect x="300" y="160" width="80" height="60" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
        <circle cx="320" cy="180" r="6" fill="rgba(168, 85, 247, 0.4)" />
        <rect x="335" y="175" width="35" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
        <rect x="320" y="190" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      </g>
    </svg>
  );
};

// Individuelle Softwaresysteme – Module/Blöcke, die exakt zusammenpassen
export const SoftwareSystemsIcon = ({ className = "w-72 h-72" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="module-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.15)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.05)" />
        </linearGradient>
      </defs>
      
      {/* Modul 1 (Links oben) */}
      <rect x="40" y="40" width="100" height="80" rx="8" fill="url(#module-gradient)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      <rect x="50" y="50" width="80" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="50" y="65" width="60" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      <rect x="50" y="75" width="70" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* Modul 2 (Rechts oben) - passt exakt an Modul 1 */}
      <rect x="150" y="40" width="100" height="80" rx="8" fill="url(#module-gradient)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      <rect x="160" y="50" width="80" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="160" y="65" width="60" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      <rect x="160" y="75" width="70" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* Modul 3 (Links unten) */}
      <rect x="40" y="140" width="100" height="80" rx="8" fill="url(#module-gradient)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      <rect x="50" y="150" width="80" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="50" y="165" width="60" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      <rect x="50" y="175" width="70" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* Modul 4 (Rechts unten) - passt exakt an Modul 3 */}
      <rect x="150" y="140" width="100" height="80" rx="8" fill="url(#module-gradient)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      <rect x="160" y="150" width="80" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="160" y="165" width="60" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      <rect x="160" y="175" width="70" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* Verbindungslinien zwischen Modulen */}
      <line x1="140" y1="80" x2="150" y2="80" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" strokeLinecap="round" />
      <line x1="90" y1="120" x2="90" y2="140" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" strokeLinecap="round" />
      <line x1="200" y1="120" x2="200" y2="140" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" strokeLinecap="round" />
      <line x1="140" y1="180" x2="150" y2="180" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" strokeLinecap="round" />
      
      {/* Zentrales Modul (Mitte) - verbindet alle */}
      <rect x="260" y="90" width="100" height="80" rx="8" fill="url(#module-gradient)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="2" />
      <rect x="270" y="100" width="80" height="8" rx="2" fill="rgba(255, 255, 255, 0.25)" />
      <rect x="270" y="115" width="60" height="6" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="270" y="125" width="70" height="6" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <circle cx="310" cy="130" r="8" fill="rgba(168, 85, 247, 0.3)" />
      
      {/* Verbindungen zum zentralen Modul */}
      <line x1="250" y1="110" x2="260" y2="110" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" strokeLinecap="round" />
      <line x1="250" y1="150" x2="260" y2="150" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

// Workflow-Systeme & Steuerungs-Dashboards – Prozesslinien + Status + Übersicht
export const WorkflowDashboardIcon = ({ className = "w-72 h-72" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="process-line" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.2)" />
          <stop offset="50%" stopColor="rgba(168, 85, 247, 0.4)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.2)" />
        </linearGradient>
      </defs>
      
      {/* Prozesslinien (horizontal) */}
      <line x1="40" y1="80" x2="360" y2="80" stroke="url(#process-line)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="150" x2="360" y2="150" stroke="url(#process-line)" strokeWidth="2" strokeLinecap="round" />
      <line x1="40" y1="220" x2="360" y2="220" stroke="url(#process-line)" strokeWidth="2" strokeLinecap="round" />
      
      {/* Status-Punkte auf Prozesslinien */}
      <circle cx="100" cy="80" r="6" fill="rgba(168, 85, 247, 0.4)" />
      <circle cx="200" cy="80" r="6" fill="rgba(168, 85, 247, 0.4)" />
      <circle cx="300" cy="80" r="6" fill="rgba(168, 85, 247, 0.4)" />
      
      <circle cx="100" cy="150" r="6" fill="rgba(168, 85, 247, 0.4)" />
      <circle cx="200" cy="150" r="6" fill="rgba(168, 85, 247, 0.4)" />
      <circle cx="300" cy="150" r="6" fill="rgba(168, 85, 247, 0.4)" />
      
      <circle cx="100" cy="220" r="6" fill="rgba(168, 85, 247, 0.4)" />
      <circle cx="200" cy="220" r="6" fill="rgba(168, 85, 247, 0.4)" />
      <circle cx="300" cy="220" r="6" fill="rgba(168, 85, 247, 0.4)" />
      
      {/* Dashboard-Übersicht (rechts) */}
      <rect x="280" y="40" width="100" height="200" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      
      {/* Dashboard-Inhalt */}
      <rect x="290" y="50" width="80" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="290" y="65" width="60" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* Status-Bars im Dashboard */}
      <rect x="290" y="85" width="70" height="4" rx="2" fill="rgba(168, 85, 247, 0.3)" />
      <rect x="290" y="95" width="50" height="4" rx="2" fill="rgba(168, 85, 247, 0.3)" />
      <rect x="290" y="105" width="65" height="4" rx="2" fill="rgba(168, 85, 247, 0.3)" />
      
      {/* Verbindungslinien: Prozesse → Dashboard */}
      <line x1="360" y1="80" x2="280" y2="100" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="360" y1="150" x2="280" y2="130" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="360" y1="220" x2="280" y2="200" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};

// System-Integrationen & APIs – verschiedene Systeme, die sauber verbunden werden
export const ApiIntegrationIcon = ({ className = "w-72 h-72" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="api-connection" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.2)" />
          <stop offset="50%" stopColor="rgba(168, 85, 247, 0.4)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.2)" />
        </linearGradient>
      </defs>
      
      {/* System 1 (Links oben) */}
      <rect x="30" y="30" width="90" height="70" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      <rect x="40" y="40" width="70" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="40" y="55" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* System 2 (Rechts oben) */}
      <rect x="280" y="30" width="90" height="70" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      <rect x="290" y="40" width="70" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="290" y="55" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* System 3 (Links unten) */}
      <rect x="30" y="200" width="90" height="70" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      <rect x="40" y="210" width="70" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="40" y="225" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* System 4 (Rechts unten) */}
      <rect x="280" y="200" width="90" height="70" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" />
      <rect x="290" y="210" width="70" height="8" rx="2" fill="rgba(255, 255, 255, 0.2)" />
      <rect x="290" y="225" width="50" height="6" rx="2" fill="rgba(255, 255, 255, 0.15)" />
      
      {/* Zentrales API-Gateway (Mitte) */}
      <circle cx="200" cy="150" r="35" fill="rgba(168, 85, 247, 0.1)" stroke="rgba(168, 85, 247, 0.3)" strokeWidth="2" />
      <circle cx="200" cy="150" r="20" fill="rgba(168, 85, 247, 0.15)" />
      <text x="200" y="155" textAnchor="middle" fontSize="12" fill="rgba(168, 85, 247, 0.6)" fontWeight="600">API</text>
      
      {/* Verbindungslinien: Systeme → API-Gateway */}
      <line x1="120" y1="65" x2="165" y2="135" stroke="url(#api-connection)" strokeWidth="2" strokeLinecap="round" />
      <line x1="280" y1="65" x2="235" y2="135" stroke="url(#api-connection)" strokeWidth="2" strokeLinecap="round" />
      <line x1="120" y1="235" x2="165" y2="165" stroke="url(#api-connection)" strokeWidth="2" strokeLinecap="round" />
      <line x1="280" y1="235" x2="235" y2="165" stroke="url(#api-connection)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
};

export const StatistikMitarbeiterIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stat3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.3" />
      </linearGradient>
      <filter id="stat3glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Zero symbol - Realistisch */}
    <circle cx="150" cy="150" r="90" fill="none" stroke="url(#stat3)" strokeWidth="8" filter="url(#stat3glow)" />
    <circle cx="150" cy="150" r="70" fill="none" stroke="rgba(0,245,255,0.3)" strokeWidth="4" />
    <path d="M 150 60 L 150 240" stroke="url(#stat3)" strokeWidth="6" strokeLinecap="round" filter="url(#stat3glow)" />
    <circle cx="150" cy="150" r="20" fill="rgba(0,245,255,0.2)" />
    <circle cx="150" cy="150" r="10" fill="#00F5FF" />
  </svg>
);

export const StatistikTransformationIcon = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 300 300" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stat4" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="1" />
      </linearGradient>
      <filter id="stat4glow">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Transformation Arrow - Realistisch */}
    <path d="M 40 250 L 80 210 L 120 170 L 160 130 L 200 90 L 240 50 L 260 30" stroke="url(#stat4)" strokeWidth="10" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#stat4glow)" />
    <circle cx="80" cy="210" r="6" fill="url(#stat4)" filter="url(#stat4glow)" />
    <circle cx="160" cy="130" r="8" fill="url(#stat4)" filter="url(#stat4glow)" />
    <circle cx="260" cy="30" r="12" fill="url(#stat4)" filter="url(#stat4glow)" />
    <circle cx="260" cy="30" r="8" fill="rgba(255,255,255,0.5)" />
    {/* Arrow head */}
    <path d="M 250 40 L 260 30 L 255 25" stroke="#00F5FF" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#stat4glow)" />
    <path d="M 260 30 L 270 20 L 265 15" stroke="#00F5FF" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#stat4glow)" />
  </svg>
);

// Zettelwirtschaft = Strukturierte, aber fragmentierte Informationsblöcke - Ordnung ohne Verbindung
export const ProblemZettelwirtschaftIcon = ({ className = "w-72 h-72" }: { className?: string }) => {
  const uniqueId = `zettel-3d-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg className={className} viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 30px rgba(0, 225, 255, 0.5)) drop-shadow(0 0 60px rgba(168, 85, 247, 0.4))" }}>
      <defs>
        {/* 3D Paper Gradient */}
        <linearGradient id={`${uniqueId}-paper-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#E5E7EB" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-paper-side`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#D1D5DB" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#9CA3AF" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-paper-shadow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uniqueId}-shadow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feOffset in="blur" dx="2" dy="4" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Additional Gradient Definitions for Desk */}
        <linearGradient id={`${uniqueId}-desk`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1F2937" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#111827" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-desk-shadow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-zettel-shadow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
        <filter id={`${uniqueId}-glow-red`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Desk Surface - 3D Perspective */}
      <rect x="50" y="350" width="400" height="120" rx="8" fill={`url(#${uniqueId}-desk)`} opacity="0.2" />
      <polygon points="50,350 450,350 420,380 80,380" fill={`url(#${uniqueId}-desk-shadow)`} opacity="0.3" />

      {/* Chaotic Stack of Papers - 3D Isometric View with Flying Animation */}
      {/* Paper Stack 1 - Center, Tilted */}
      <g transform="translate(200, 180)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 5,-5; -2,2; 2,-2; 0,0"
          dur="4s"
          repeatCount="indefinite"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-15;-18;-12;-16;-15"
          dur="5s"
          repeatCount="indefinite"
          additive="sum"
        />
        <g transform="rotate(-15)">
          {/* Shadow */}
          <ellipse cx="0" cy="80" rx="45" ry="8" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.4" filter={`url(#${uniqueId}-shadow)`} />
          {/* Paper Side (3D depth) */}
          <polygon points="-40,0 40,0 35,60 -35,60" fill={`url(#${uniqueId}-paper-side)`} opacity="0.6" />
          {/* Paper Top */}
          <rect x="-40" y="0" width="80" height="60" rx="2" fill={`url(#${uniqueId}-paper-top)`} filter={`url(#${uniqueId}-glow)`} />
          {/* Paper Lines */}
          <line x1="-35" y1="15" x2="35" y2="15" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="-35" y1="25" x2="30" y2="25" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="-35" y1="35" x2="25" y2="35" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>
      </g>

      {/* Paper Stack 2 - Left, More Tilted */}
      <g transform="translate(120, 200)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; -2,-5; 2,3; -1,-2; 0,0"
          dur="3.5s"
          repeatCount="indefinite"
          begin="0.5s"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="25;28;22;26;25"
          dur="4.5s"
          repeatCount="indefinite"
          begin="0.5s"
          additive="sum"
        />
        <g transform="rotate(25)">
          <ellipse cx="0" cy="70" rx="40" ry="6" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.3" filter={`url(#${uniqueId}-shadow)`} />
          <polygon points="-35,0 35,0 30,50 -30,50" fill={`url(#${uniqueId}-paper-side)`} opacity="0.5" />
          <rect x="-35" y="0" width="70" height="50" rx="2" fill={`url(#${uniqueId}-paper-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.9" />
          <line x1="-30" y1="12" x2="30" y2="12" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="-30" y1="22" x2="25" y2="22" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>
      </g>

      {/* Paper Stack 3 - Right, Slightly Tilted */}
      <g transform="translate(320, 210)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 3,-3; -2,3; 1,-1; 0,0"
          dur="4.2s"
          repeatCount="indefinite"
          begin="1s"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-8;-11;-5;-9;-8"
          dur="5.5s"
          repeatCount="indefinite"
          begin="1s"
          additive="sum"
        />
        <g transform="rotate(-8)">
          <ellipse cx="0" cy="75" rx="42" ry="7" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.35" filter={`url(#${uniqueId}-shadow)`} />
          <polygon points="-38,0 38,0 35,55 -35,55" fill={`url(#${uniqueId}-paper-side)`} opacity="0.55" />
          <rect x="-38" y="0" width="76" height="55" rx="2" fill={`url(#${uniqueId}-paper-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.85" />
          <line x1="-33" y1="14" x2="33" y2="14" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="-33" y1="24" x2="28" y2="24" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
          <line x1="-33" y1="34" x2="20" y2="34" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
        </g>
      </g>

      {/* Scattered Papers - Bottom Layer */}
      <g transform="translate(150, 280)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 2,-5; -2,3; 1,-2; 0,0"
          dur="3.8s"
          repeatCount="indefinite"
          begin="0.3s"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="12;15;9;13;12"
          dur="4.8s"
          repeatCount="indefinite"
          begin="0.3s"
          additive="sum"
        />
        <g transform="rotate(12)">
          <ellipse cx="0" cy="50" rx="35" ry="5" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.25" />
          <polygon points="-32,0 32,0 28,40 -28,40" fill={`url(#${uniqueId}-paper-side)`} opacity="0.4" />
          <rect x="-32" y="0" width="64" height="40" rx="2" fill={`url(#${uniqueId}-paper-top)`} opacity="0.7" />
        </g>
      </g>

      <g transform="translate(350, 290)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 3,-5; -3,3; 1,-2; 0,0"
          dur="4.5s"
          repeatCount="indefinite"
          begin="0.8s"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-18;-21;-15;-19;-18"
          dur="5.2s"
          repeatCount="indefinite"
          begin="0.8s"
          additive="sum"
        />
        <g transform="rotate(-18)">
          <ellipse cx="0" cy="45" rx="30" ry="4" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.2" />
          <polygon points="-28,0 28,0 25,35 -25,35" fill={`url(#${uniqueId}-paper-side)`} opacity="0.35" />
          <rect x="-28" y="0" width="56" height="35" rx="2" fill={`url(#${uniqueId}-paper-top)`} opacity="0.65" />
        </g>
      </g>

      {/* Printer - 3D Isometric, Jammed */}
      <g transform="translate(380, 250)">
        {/* Printer Shadow */}
        <ellipse cx="10" cy="80" rx="35" ry="8" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.4" filter={`url(#${uniqueId}-shadow)`} />
        {/* Printer Body - 3D */}
        <rect x="0" y="20" width="60" height="50" rx="4" fill="rgba(30, 30, 30, 0.9)" filter={`url(#${uniqueId}-glow)`} />
        {/* Printer Top - 3D */}
        <polygon points="0,20 60,20 55,10 5,10" fill="rgba(20, 20, 20, 0.95)" />
        {/* Paper Jam - Sticking Out */}
        <rect x="15" y="15" width="30" height="8" rx="1" fill={`url(#${uniqueId}-paper-top)`} filter={`url(#${uniqueId}-glow)`} />
        <polygon points="15,15 45,15 43,23 17,23" fill={`url(#${uniqueId}-paper-side)`} opacity="0.6" />
        {/* Warning Indicator */}
        <circle cx="50" cy="35" r="4" fill="#FF4444" filter={`url(#${uniqueId}-glow-red)`} opacity="0.9">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* More Scattered Papers - Top Layer */}
      <g transform="translate(80, 150)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; -2,-5; 2,3; -1,-2; 0,0"
          dur="3.2s"
          repeatCount="indefinite"
          begin="1.2s"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-22;-25;-19;-23;-22"
          dur="4.2s"
          repeatCount="indefinite"
          begin="1.2s"
          additive="sum"
        />
        <g transform="rotate(-22)">
          <ellipse cx="0" cy="60" rx="28" ry="4" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.2" />
          <polygon points="-26,0 26,0 24,45 -24,45" fill={`url(#${uniqueId}-paper-side)`} opacity="0.3" />
          <rect x="-26" y="0" width="52" height="45" rx="2" fill={`url(#${uniqueId}-paper-top)`} opacity="0.6" />
        </g>
      </g>

      {/* Additional Flying Papers - Extra Chaos */}
      {/* Flying Paper 1 */}
      <g transform="translate(250, 100)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 10,-5; -5,5; 5,-2; 0,0"
          dur="3.6s"
          repeatCount="indefinite"
          begin="0.2s"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="5;12;-2;8;5"
          dur="4.3s"
          repeatCount="indefinite"
          begin="0.2s"
          additive="sum"
        />
        <g transform="rotate(5)">
          <ellipse cx="0" cy="35" rx="20" ry="3" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.2" />
          <polygon points="-18,0 18,0 16,30 -16,30" fill={`url(#${uniqueId}-paper-side)`} opacity="0.3" />
          <rect x="-18" y="0" width="36" height="30" rx="2" fill={`url(#${uniqueId}-paper-top)`} opacity="0.5" />
          <line x1="-14" y1="10" x2="14" y2="10" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
          <line x1="-14" y1="18" x2="12" y2="18" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
        </g>
      </g>

      {/* Flying Paper 2 */}
      <g transform="translate(180, 250)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 5,-5; -5,5; 2,-2; 0,0"
          dur="4.1s"
          repeatCount="indefinite"
          begin="0.7s"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="-10;-15;-5;-12;-10"
          dur="5.1s"
          repeatCount="indefinite"
          begin="0.7s"
          additive="sum"
        />
        <g transform="rotate(-10)">
          <ellipse cx="0" cy="32" rx="22" ry="3" fill={`url(#${uniqueId}-zettel-shadow)`} opacity="0.22" />
          <polygon points="-20,0 20,0 18,28 -18,28" fill={`url(#${uniqueId}-paper-side)`} opacity="0.35" />
          <rect x="-20" y="0" width="40" height="28" rx="2" fill={`url(#${uniqueId}-paper-top)`} opacity="0.55" />
          <line x1="-16" y1="9" x2="16" y2="9" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
          <line x1="-16" y1="17" x2="14" y2="17" stroke="rgba(0,0,0,0.1)" strokeWidth="0.8" />
        </g>
      </g>

    </svg>
  );
};

// Personalbindung = Zentrale Abhängigkeit, Prozesse durch wenige Engpässe, Ordnung aber blockiert
export const ProblemPersonalbindungIcon = ({ className = "w-72 h-72" }: { className?: string }) => {
  const uniqueId = `personal-3d-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg className={className} viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 30px rgba(0, 225, 255, 0.5)) drop-shadow(0 0 60px rgba(168, 85, 247, 0.4))" }}>
      <defs>
        {/* 3D Person Gradients */}
        <linearGradient id={`${uniqueId}-person-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#E5E7EB" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#D1D5DB" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-person-side`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6B7280" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-person-bottleneck`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4444" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#FF6666" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#FF8888" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-person-shadow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uniqueId}-shadow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feOffset in="blur" dx="2" dy="4" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uniqueId}-glow-red`}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        {/* White Arrow Marker - Smaller */}
        <marker id={`${uniqueId}-arrowhead-white`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth">
          <polygon points="0 0, 6 3, 0 6" fill="#FFFFFF" opacity="0.8" />
        </marker>
      </defs>

      {/* Floor/Platform - 3D Perspective */}
      <rect x="50" y="380" width="400" height="100" rx="8" fill="rgba(30, 30, 30, 0.3)" opacity="0.2" />
      <polygon points="50,380 450,380 420,420 80,420" fill="rgba(20, 20, 20, 0.4)" opacity="0.3" />

      {/* Central Bottleneck Person - Overwhelmed with Animation - Centered */}
      <g transform="translate(130, 120)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="130,120; 132,118; 128,122; 131,119; 130,120"
          dur="3.5s"
          repeatCount="indefinite"
          additive="sum"
        />
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1;1.05;0.98;1.02;1"
          dur="4s"
          repeatCount="indefinite"
          additive="sum"
        />
        <g>
          {/* Shadow - Larger */}
          <ellipse cx="0" cy="55" rx="28" ry="10" fill={`url(#${uniqueId}-person-shadow)`} opacity="0.6" filter={`url(#${uniqueId}-shadow)`} />
          {/* Person Body - 3D Cylinder - Larger */}
          <ellipse cx="-12" cy="0" rx="10" ry="30" fill="rgba(200, 50, 50, 0.75)" opacity="0.75" />
          <ellipse cx="0" cy="0" rx="18" ry="30" fill={`url(#${uniqueId}-person-bottleneck)`} filter={`url(#${uniqueId}-glow)`} />
          {/* Person Head - Larger */}
          <ellipse cx="-10" cy="-35" rx="6" ry="12" fill="rgba(200, 50, 50, 0.65)" opacity="0.65" />
          <circle cx="0" cy="-35" r="12" fill={`url(#${uniqueId}-person-bottleneck)`} filter={`url(#${uniqueId}-glow)`} />
          {/* Arms - Raised (Overwhelmed) - Larger */}
          <ellipse cx="-24" cy="-18" rx="5" ry="18" fill="rgba(200, 50, 50, 0.65)" opacity="0.65" />
          <ellipse cx="-22" cy="-18" rx="6" ry="18" fill={`url(#${uniqueId}-person-bottleneck)`} opacity="0.85" />
          <ellipse cx="24" cy="-18" rx="5" ry="18" fill="rgba(200, 50, 50, 0.65)" opacity="0.65" />
          <ellipse cx="22" cy="-18" rx="6" ry="18" fill={`url(#${uniqueId}-person-bottleneck)`} opacity="0.85" />
          {/* Warning Indicator - Larger */}
          <circle cx="0" cy="-50" r="8" fill="#FF4444" filter={`url(#${uniqueId}-glow-red)`} opacity="0.95">
            <animate attributeName="opacity" values="0.95;0.5;0.95" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <text x="0" y="-45" textAnchor="middle" fontSize="12" fill="#FFFFFF" fontWeight="bold">!</text>
          {/* Overload Indicator - Multiple Tasks */}
          <circle cx="-14" cy="-30" r="4" fill="#FFAA00" opacity="0.85">
            <animate attributeName="opacity" values="0.85;0.35;0.85" dur="2s" repeatCount="indefinite" />
          </circle>
          <circle cx="14" cy="-30" r="4" fill="#FFAA00" opacity="0.85">
            <animate attributeName="opacity" values="0.85;0.35;0.85" dur="2s" repeatCount="indefinite" />
          </circle>
        </g>
      </g>

      {/* Waiting Queue - People in Line (Left Side) with Movement to Center - Centered */}
      <g transform="translate(60, 120)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="60,120; 100,120; 60,120"
          dur="4s"
          repeatCount="indefinite"
          begin="0s"
          additive="sum"
        />
        <g>
          {/* Person 1 - Larger, More Visible 3D */}
          <ellipse cx="0" cy="50" rx="18" ry="6" fill={`url(#${uniqueId}-person-shadow)`} opacity="0.4" />
          <ellipse cx="-8" cy="0" rx="6" ry="22" fill={`url(#${uniqueId}-person-side)`} opacity="0.6" />
          <ellipse cx="0" cy="0" rx="12" ry="22" fill={`url(#${uniqueId}-person-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.85" />
          <ellipse cx="-6" cy="-22" rx="4" ry="9" fill={`url(#${uniqueId}-person-side)`} opacity="0.5" />
          <circle cx="0" cy="-22" r="9" fill={`url(#${uniqueId}-person-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.9" />
        </g>
      </g>

      {/* Waiting Queue - People in Line (Right Side) with Movement to Center - Centered */}
      <g transform="translate(200, 120)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="200,120; 160,120; 200,120"
          dur="4.2s"
          repeatCount="indefinite"
          begin="0.5s"
          additive="sum"
        />
        <g>
          {/* Person 1 - Larger, More Visible 3D */}
          <ellipse cx="0" cy="50" rx="18" ry="6" fill={`url(#${uniqueId}-person-shadow)`} opacity="0.4" />
          <ellipse cx="-8" cy="0" rx="6" ry="22" fill={`url(#${uniqueId}-person-side)`} opacity="0.6" />
          <ellipse cx="0" cy="0" rx="12" ry="22" fill={`url(#${uniqueId}-person-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.85" />
          <ellipse cx="-6" cy="-22" rx="4" ry="9" fill={`url(#${uniqueId}-person-side)`} opacity="0.5" />
          <circle cx="0" cy="-22" r="9" fill={`url(#${uniqueId}-person-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.9" />
        </g>
      </g>

      {/* Waiting Queue - Top with Movement to Center - Centered */}
      <g transform="translate(130, 40)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="130,40; 130,120; 130,40"
          dur="3.8s"
          repeatCount="indefinite"
          begin="1s"
          additive="sum"
        />
        <g>
          {/* Person 1 - Larger, More Visible 3D */}
          <ellipse cx="0" cy="50" rx="18" ry="6" fill={`url(#${uniqueId}-person-shadow)`} opacity="0.4" />
          <ellipse cx="-8" cy="0" rx="6" ry="22" fill={`url(#${uniqueId}-person-side)`} opacity="0.6" />
          <ellipse cx="0" cy="0" rx="12" ry="22" fill={`url(#${uniqueId}-person-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.85" />
          <ellipse cx="-6" cy="-22" rx="4" ry="9" fill={`url(#${uniqueId}-person-side)`} opacity="0.5" />
          <circle cx="0" cy="-22" r="9" fill={`url(#${uniqueId}-person-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.9" />
        </g>
      </g>

      {/* Waiting Queue - Bottom with Movement to Center - Centered */}
      <g transform="translate(130, 200)">
        <animateTransform
          attributeName="transform"
          type="translate"
          values="130,200; 130,120; 130,200"
          dur="4s"
          repeatCount="indefinite"
          begin="1.5s"
          additive="sum"
        />
        <g>
          {/* Person 1 - Larger, More Visible 3D */}
          <ellipse cx="0" cy="50" rx="18" ry="6" fill={`url(#${uniqueId}-person-shadow)`} opacity="0.4" />
          <ellipse cx="-8" cy="0" rx="6" ry="22" fill={`url(#${uniqueId}-person-side)`} opacity="0.6" />
          <ellipse cx="0" cy="0" rx="12" ry="22" fill={`url(#${uniqueId}-person-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.85" />
          <ellipse cx="-6" cy="-22" rx="4" ry="9" fill={`url(#${uniqueId}-person-side)`} opacity="0.5" />
          <circle cx="0" cy="-22" r="9" fill={`url(#${uniqueId}-person-top)`} filter={`url(#${uniqueId}-glow)`} opacity="0.9" />
        </g>
      </g>

    </svg>
  );
};

// Fehler & Verluste = Prozesse sauber, aber "lecken" - Kontrollierte Abzweigungen, Verluste an definierten Stellen
export const ProblemFehlerIcon = ({ className = "w-72 h-72" }: { className?: string }) => {
  const uniqueId = `fehler-3d-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg className={className} viewBox="0 0 500 500" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ filter: "drop-shadow(0 0 30px rgba(255, 68, 68, 0.5)) drop-shadow(0 0 60px rgba(255, 140, 0, 0.4))" }}>
      <defs>
        {/* 3D Process Box Gradients */}
        <linearGradient id={`${uniqueId}-box-top`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#E5E7EB" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#D1D5DB" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-box-side`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9CA3AF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#6B7280" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-box-front`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3F4F6" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#E5E7EB" stopOpacity="0.6" />
        </linearGradient>
        {/* Error Symbol Gradients */}
        <linearGradient id={`${uniqueId}-error-red`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF4444" stopOpacity="0.95" />
          <stop offset="50%" stopColor="#FF6666" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FF8888" stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-error-orange`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF8800" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#FFAA44" stopOpacity="0.7" />
        </linearGradient>
        {/* Loss Drop Gradients */}
        <linearGradient id={`${uniqueId}-drop`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C6A8FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-shadow`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="2" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.3" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uniqueId}-shadow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="blur" />
          <feOffset in="blur" dx="2" dy="4" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.4" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id={`${uniqueId}-glow-red`}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <filter id={`${uniqueId}-glow-orange`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Floor/Platform - 3D Perspective */}
      <rect x="50" y="380" width="400" height="100" rx="8" fill="rgba(30, 30, 30, 0.3)" opacity="0.2" />
      <polygon points="50,380 450,380 420,420 80,420" fill="rgba(20, 20, 20, 0.4)" opacity="0.3" />

      {/* Central Process System - 3D Isometric Box */}
      <g transform="translate(250, 200)">
        {/* Shadow */}
        <ellipse cx="0" cy="80" rx="90" ry="12" fill={`url(#${uniqueId}-shadow)`} opacity="0.4" filter={`url(#${uniqueId}-shadow)`} />
        
        {/* Box Top - 3D */}
        <polygon points="-80,-40 80,-40 70,-20 -70,-20" fill={`url(#${uniqueId}-box-top)`} opacity="0.9" />
        
        {/* Box Right Side - 3D */}
        <polygon points="80,-40 80,40 70,20 70,-20" fill={`url(#${uniqueId}-box-side)`} opacity="0.7" />
        
        {/* Box Front - 3D */}
        <rect x="-70" y="-20" width="140" height="60" rx="4" fill={`url(#${uniqueId}-box-front)`} filter={`url(#${uniqueId}-glow)`} />
        
        {/* Process Lines Inside Box */}
        <line x1="-60" y1="-10" x2="60" y2="-10" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
        <line x1="-60" y1="0" x2="55" y2="0" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
        <line x1="-60" y1="10" x2="50" y2="10" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
        <line x1="-60" y1="20" x2="58" y2="20" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
        <line x1="-60" y1="30" x2="52" y2="30" stroke="rgba(0,0,0,0.15)" strokeWidth="1.5" />
      </g>

      {/* Error Symbols - 3D Warning Triangles */}
      {/* Error 1 - Top Left */}
      <g transform="translate(150, 140) rotate(-15)">
        {/* Shadow */}
        <ellipse cx="0" cy="25" rx="12" ry="3" fill={`url(#${uniqueId}-shadow)`} opacity="0.3" />
        {/* Triangle Side - 3D */}
        <polygon points="-10,0 10,0 8,-15 -8,-15" fill="rgba(200, 50, 50, 0.6)" opacity="0.6" />
        {/* Triangle Front - 3D */}
        <polygon points="-10,0 0,-20 10,0" fill={`url(#${uniqueId}-error-red)`} filter={`url(#${uniqueId}-glow-red)`} />
        {/* Exclamation Mark */}
        <line x1="0" y1="-12" x2="0" y2="-6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="-3" r="1.5" fill="#FFFFFF" />
      </g>

      {/* Error 2 - Top Right */}
      <g transform="translate(350, 150) rotate(10)">
        <ellipse cx="0" cy="25" rx="12" ry="3" fill={`url(#${uniqueId}-shadow)`} opacity="0.3" />
        <polygon points="-10,0 10,0 8,-15 -8,-15" fill="rgba(200, 50, 50, 0.6)" opacity="0.6" />
        <polygon points="-10,0 0,-20 10,0" fill={`url(#${uniqueId}-error-red)`} filter={`url(#${uniqueId}-glow-red)`} />
        <line x1="0" y1="-12" x2="0" y2="-6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="0" cy="-3" r="1.5" fill="#FFFFFF" />
      </g>

      {/* Error 3 - X Mark - Bottom Left */}
      <g transform="translate(120, 280)">
        {/* Shadow */}
        <ellipse cx="0" cy="20" rx="10" ry="2" fill={`url(#${uniqueId}-shadow)`} opacity="0.25" />
        {/* X Mark Circle - 3D */}
        <circle cx="0" cy="0" r="12" fill={`url(#${uniqueId}-error-orange)`} filter={`url(#${uniqueId}-glow-orange)`} opacity="0.9" />
        <ellipse cx="-3" cy="0" rx="3" ry="12" fill="rgba(255, 136, 0, 0.6)" opacity="0.5" />
        {/* X Lines */}
        <line x1="-6" y1="-6" x2="6" y2="6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="6" y1="-6" x2="-6" y2="6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Error 4 - X Mark - Bottom Right */}
      <g transform="translate(380, 290)">
        <ellipse cx="0" cy="20" rx="10" ry="2" fill={`url(#${uniqueId}-shadow)`} opacity="0.25" />
        <circle cx="0" cy="0" r="12" fill={`url(#${uniqueId}-error-orange)`} filter={`url(#${uniqueId}-glow-orange)`} opacity="0.9" />
        <ellipse cx="-3" cy="0" rx="3" ry="12" fill="rgba(255, 136, 0, 0.6)" opacity="0.5" />
        <line x1="-6" y1="-6" x2="6" y2="6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="6" y1="-6" x2="-6" y2="6" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      {/* Loss Drops - 3D Water Drops Falling */}
      {/* Drop 1 - Left Side */}
      <g>
        <ellipse cx="100" cy="250" rx="8" ry="2" fill={`url(#${uniqueId}-shadow)`} opacity="0.3">
          <animate attributeName="cy" values="250;300;250" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="97" cy="200" rx="3" ry="20" fill="rgba(0, 225, 255, 0.5)" opacity="0.5">
          <animate attributeName="cy" values="200;250;200" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="100" cy="200" rx="8" ry="20" fill={`url(#${uniqueId}-drop)`} filter={`url(#${uniqueId}-glow)`}>
          <animate attributeName="cy" values="200;250;200" dur="2s" repeatCount="indefinite" />
        </ellipse>
        <ellipse cx="98" cy="192" rx="3" ry="6" fill="rgba(255, 255, 255, 0.6)" opacity="0.8">
          <animate attributeName="cy" values="192;242;192" dur="2s" repeatCount="indefinite" />
        </ellipse>
      </g>

      {/* Drop 2 - Right Side */}
      <g>
        <ellipse cx="400" cy="270" rx="8" ry="2" fill={`url(#${uniqueId}-shadow)`} opacity="0.3">
          <animate attributeName="cy" values="270;320;270" dur="2.3s" repeatCount="indefinite" begin="0.5s" />
        </ellipse>
        <ellipse cx="397" cy="220" rx="3" ry="20" fill="rgba(0, 225, 255, 0.5)" opacity="0.5">
          <animate attributeName="cy" values="220;270;220" dur="2.3s" repeatCount="indefinite" begin="0.5s" />
        </ellipse>
        <ellipse cx="400" cy="220" rx="8" ry="20" fill={`url(#${uniqueId}-drop)`} filter={`url(#${uniqueId}-glow)`}>
          <animate attributeName="cy" values="220;270;220" dur="2.3s" repeatCount="indefinite" begin="0.5s" />
        </ellipse>
        <ellipse cx="398" cy="212" rx="3" ry="6" fill="rgba(255, 255, 255, 0.6)" opacity="0.8">
          <animate attributeName="cy" values="212;262;212" dur="2.3s" repeatCount="indefinite" begin="0.5s" />
        </ellipse>
      </g>

      {/* Drop 3 - Top */}
      <g>
        <ellipse cx="250" cy="170" rx="8" ry="2" fill={`url(#${uniqueId}-shadow)`} opacity="0.3">
          <animate attributeName="cy" values="170;220;170" dur="1.8s" repeatCount="indefinite" begin="1s" />
        </ellipse>
        <ellipse cx="247" cy="120" rx="3" ry="20" fill="rgba(0, 225, 255, 0.5)" opacity="0.5">
          <animate attributeName="cy" values="120;170;120" dur="1.8s" repeatCount="indefinite" begin="1s" />
        </ellipse>
        <ellipse cx="250" cy="120" rx="8" ry="20" fill={`url(#${uniqueId}-drop)`} filter={`url(#${uniqueId}-glow)`}>
          <animate attributeName="cy" values="120;170;120" dur="1.8s" repeatCount="indefinite" begin="1s" />
        </ellipse>
        <ellipse cx="248" cy="112" rx="3" ry="6" fill="rgba(255, 255, 255, 0.6)" opacity="0.8">
          <animate attributeName="cy" values="112;162;112" dur="1.8s" repeatCount="indefinite" begin="1s" />
        </ellipse>
      </g>

      {/* Loss Indicators - Leaking Lines from Box */}
      {/* Leak Line 1 - Left */}
      <g opacity="0.6">
        <line x1="180" y1="200" x2="100" y2="200" stroke={`url(#${uniqueId}-drop)`} strokeWidth="2" strokeDasharray="4 4" opacity="0.5">
          <animate attributeName="stroke-dashoffset" values="0;8" dur="1.5s" repeatCount="indefinite" />
        </line>
        <circle cx="100" cy="200" r="4" fill={`url(#${uniqueId}-drop)`} filter={`url(#${uniqueId}-glow)`} opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Leak Line 2 - Right */}
      <g opacity="0.6">
        <line x1="320" y1="220" x2="400" y2="220" stroke={`url(#${uniqueId}-drop)`} strokeWidth="2" strokeDasharray="4 4" opacity="0.5">
          <animate attributeName="stroke-dashoffset" values="0;8" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
        </line>
        <circle cx="400" cy="220" r="4" fill={`url(#${uniqueId}-drop)`} filter={`url(#${uniqueId}-glow)`} opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" begin="0.3s" />
        </circle>
      </g>

      {/* Leak Line 3 - Top */}
      <g opacity="0.6">
        <line x1="250" y1="160" x2="250" y2="120" stroke={`url(#${uniqueId}-drop)`} strokeWidth="2" strokeDasharray="4 4" opacity="0.5">
          <animate attributeName="stroke-dashoffset" values="0;8" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
        </line>
        <circle cx="250" cy="120" r="4" fill={`url(#${uniqueId}-drop)`} filter={`url(#${uniqueId}-glow)`} opacity="0.7">
          <animate attributeName="opacity" values="0.7;0.3;0.7" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
        </circle>
      </g>

      {/* Duplicate Work Indicators - 3D Documents */}
      {/* Document 1 - Left */}
      <g transform="translate(80, 300) rotate(15)">
        <ellipse cx="0" cy="30" rx="15" ry="3" fill={`url(#${uniqueId}-shadow)`} opacity="0.25" />
        <polygon points="-12,0 12,0 10,25 -10,25" fill={`url(#${uniqueId}-box-side)`} opacity="0.4" />
        <rect x="-12" y="0" width="24" height="25" rx="2" fill={`url(#${uniqueId}-box-front)`} opacity="0.6" />
        <line x1="-8" y1="8" x2="8" y2="8" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <line x1="-8" y1="12" x2="6" y2="12" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <line x1="-8" y1="16" x2="7" y2="16" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        {/* Duplicate Badge */}
        <circle cx="8" cy="-2" r="4" fill={`url(#${uniqueId}-error-orange)`} filter={`url(#${uniqueId}-glow-orange)`} opacity="0.9" />
        <text x="8" y="1" textAnchor="middle" fontSize="6" fill="#FFFFFF" fontWeight="bold">2</text>
      </g>

      {/* Document 2 - Right */}
      <g transform="translate(420, 320) rotate(-12)">
        <ellipse cx="0" cy="30" rx="15" ry="3" fill={`url(#${uniqueId}-shadow)`} opacity="0.25" />
        <polygon points="-12,0 12,0 10,25 -10,25" fill={`url(#${uniqueId}-box-side)`} opacity="0.4" />
        <rect x="-12" y="0" width="24" height="25" rx="2" fill={`url(#${uniqueId}-box-front)`} opacity="0.6" />
        <line x1="-8" y1="8" x2="8" y2="8" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <line x1="-8" y1="12" x2="6" y2="12" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        <line x1="-8" y1="16" x2="7" y2="16" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
        {/* Duplicate Badge */}
        <circle cx="8" cy="-2" r="4" fill={`url(#${uniqueId}-error-orange)`} filter={`url(#${uniqueId}-glow-orange)`} opacity="0.9" />
        <text x="8" y="1" textAnchor="middle" fontSize="6" fill="#FFFFFF" fontWeight="bold">2</text>
      </g>
    </svg>
  );
};

export const LoesungCoreIcon = ({ className = "w-56 h-56" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="loes1" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="70%" stopColor="#00F5FF" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.2" />
      </radialGradient>
      <filter id="loes1glow">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* AI Core/Engine - Realistisch */}
    <circle cx="300" cy="300" r="180" fill="none" stroke="rgba(0,245,255,0.2)" strokeWidth="3" />
    <circle cx="300" cy="300" r="150" fill="none" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <circle cx="300" cy="300" r="120" fill="none" stroke="rgba(0,245,255,0.4)" strokeWidth="3" />
    <circle cx="300" cy="300" r="100" fill="url(#loes1)" filter="url(#loes1glow)" />
    <circle cx="300" cy="300" r="70" fill="rgba(0,245,255,0.3)" />
    <circle cx="300" cy="300" r="50" fill="url(#loes1)" filter="url(#loes1glow)" />
    <circle cx="300" cy="300" r="30" fill="rgba(255,255,255,0.2)" />
    <circle cx="300" cy="300" r="15" fill="#00F5FF" />
    
    {/* Connecting nodes */}
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const angle = (i * 60 - 90) * (Math.PI / 180);
      const x = 300 + Math.cos(angle) * 125;
      const y = 300 + Math.sin(angle) * 125;
      return (
        <g key={i}>
          <line x1="300" y1="300" x2={x} y2={y} stroke="rgba(0,245,255,0.3)" strokeWidth="2" />
          <circle cx={x} cy={y} r="12" fill="url(#loes1)" filter="url(#loes1glow)" />
          <circle cx={x} cy={y} r="6" fill="rgba(255,255,255,0.3)" />
        </g>
      );
    })}
  </svg>
);

export const LoesungCRMIcon = ({ className = "w-56 h-56" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="loes2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.4" />
      </linearGradient>
      <filter id="loes2glow">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Database/CRM System - Realistisch */}
    <rect x="120" y="120" width="200" height="180" rx="12" fill="url(#loes2)" filter="url(#loes2glow)" />
    <rect x="130" y="130" width="180" height="160" rx="10" fill="rgba(0,245,255,0.1)" />
    
    <rect x="280" y="120" width="200" height="180" rx="12" fill="url(#loes2)" filter="url(#loes2glow)" />
    <rect x="290" y="130" width="180" height="160" rx="10" fill="rgba(0,245,255,0.1)" />
    
    <rect x="120" y="320" width="200" height="180" rx="12" fill="url(#loes2)" filter="url(#loes2glow)" />
    <rect x="130" y="330" width="180" height="160" rx="10" fill="rgba(0,245,255,0.1)" />
    
    <rect x="280" y="320" width="200" height="180" rx="12" fill="url(#loes2)" filter="url(#loes2glow)" />
    <rect x="290" y="330" width="180" height="160" rx="10" fill="rgba(0,245,255,0.1)" />
    
    {/* Data lines */}
    <line x1="150" y1="180" x2="290" y2="180" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="150" y1="220" x2="290" y2="220" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="310" y1="180" x2="450" y2="180" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="310" y1="220" x2="450" y2="220" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="150" y1="380" x2="290" y2="380" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="150" y1="420" x2="290" y2="420" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="310" y1="380" x2="450" y2="380" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="310" y1="420" x2="450" y2="420" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    
    {/* Connection lines between modules */}
    <line x1="220" y1="300" x2="280" y2="210" stroke="rgba(0,245,255,0.4)" strokeWidth="2" />
    <line x1="380" y1="300" x2="320" y2="210" stroke="rgba(0,245,255,0.4)" strokeWidth="2" />
  </svg>
);

export const LoesungAgentIcon = ({ className = "w-56 h-56" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 600 600" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="loes3" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="70%" stopColor="#00F5FF" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.2" />
      </radialGradient>
      <filter id="loes3glow">
        <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* AI Agent/Robot Head - Realistisch */}
    <circle cx="300" cy="300" r="140" fill="url(#loes3)" filter="url(#loes3glow)" />
    <circle cx="300" cy="300" r="120" fill="rgba(0,245,255,0.2)" />
    <circle cx="300" cy="300" r="100" fill="rgba(0,245,255,0.1)" />
    
    {/* Eyes */}
    <circle cx="260" cy="280" r="25" fill="rgba(0,245,255,0.4)" />
    <circle cx="260" cy="280" r="15" fill="#00F5FF" />
    <circle cx="260" cy="280" r="8" fill="rgba(255,255,255,0.6)" />
    
    <circle cx="340" cy="280" r="25" fill="rgba(0,245,255,0.4)" />
    <circle cx="340" cy="280" r="15" fill="#00F5FF" />
    <circle cx="340" cy="280" r="8" fill="rgba(255,255,255,0.6)" />
    
    {/* Connection lines - AI network */}
    <line x1="300" y1="200" x2="200" y2="150" stroke="rgba(0,245,255,0.4)" strokeWidth="3" />
    <line x1="300" y1="200" x2="400" y2="150" stroke="rgba(0,245,255,0.4)" strokeWidth="3" />
    <line x1="300" y1="400" x2="200" y2="450" stroke="rgba(0,245,255,0.4)" strokeWidth="3" />
    <line x1="300" y1="400" x2="400" y2="450" stroke="rgba(0,245,255,0.4)" strokeWidth="3" />
    
    {/* Nodes */}
    <circle cx="200" cy="150" r="12" fill="url(#loes3)" filter="url(#loes3glow)" />
    <circle cx="400" cy="150" r="12" fill="url(#loes3)" filter="url(#loes3glow)" />
    <circle cx="200" cy="450" r="12" fill="url(#loes3)" filter="url(#loes3glow)" />
    <circle cx="400" cy="450" r="12" fill="url(#loes3)" filter="url(#loes3glow)" />
  </svg>
);

export const ProjektChronexIcon = ({ className = "w-40 h-40" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="proj1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.4" />
      </linearGradient>
      <filter id="proj1glow">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Logistics/Truck - Realistisch */}
    <rect x="60" y="200" width="160" height="100" rx="8" fill="url(#proj1)" filter="url(#proj1glow)" />
    <rect x="70" y="160" width="100" height="60" rx="7" fill="url(#proj1)" filter="url(#proj1glow)" />
    
    {/* Wheels */}
    <circle cx="100" cy="320" r="28" fill="url(#proj1)" filter="url(#proj1glow)" />
    <circle cx="100" cy="320" r="18" fill="rgba(0,245,255,0.3)" />
    <circle cx="100" cy="320" r="10" fill="rgba(255,255,255,0.2)" />
    
    <circle cx="180" cy="320" r="28" fill="url(#proj1)" filter="url(#proj1glow)" />
    <circle cx="180" cy="320" r="18" fill="rgba(0,245,255,0.3)" />
    <circle cx="180" cy="320" r="10" fill="rgba(255,255,255,0.2)" />
    
    {/* Route line */}
    <path d="M 20 300 Q 60 280, 100 300 T 180 300 T 260 300 T 340 300 T 380 300" stroke="rgba(0,245,255,0.5)" strokeWidth="4" fill="none" strokeDasharray="8,8" />
    
    {/* GPS/Route markers */}
    <circle cx="100" cy="300" r="6" fill="#00F5FF" />
    <circle cx="180" cy="300" r="6" fill="#00F5FF" />
    <circle cx="260" cy="300" r="6" fill="#00F5FF" />
  </svg>
);

export const ProjektPflegeIcon = ({ className = "w-40 h-40" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="proj2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.4" />
      </linearGradient>
      <filter id="proj2glow">
        <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Medical/Healthcare Cross - Realistisch */}
    <rect x="150" y="100" width="100" height="280" rx="8" fill="url(#proj2)" filter="url(#proj2glow)" />
    <rect x="100" y="200" width="200" height="100" rx="8" fill="url(#proj2)" filter="url(#proj2glow)" />
    
    {/* Medical pulse/heartbeat */}
    <path d="M 60 240 Q 80 220, 100 240 T 140 240 T 180 240 T 220 240 T 260 240 T 300 240 T 340 240" stroke="#00F5FF" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#proj2glow)" />
    
    {/* Data/documentation lines */}
    <line x1="50" y1="320" x2="350" y2="320" stroke="rgba(0,245,255,0.4)" strokeWidth="3" />
    <line x1="50" y1="340" x2="350" y2="340" stroke="rgba(0,245,255,0.4)" strokeWidth="3" />
  </svg>
);

export const BrancheSpeditionIcon = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="br1" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.4" />
      </linearGradient>
      <filter id="br1glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Truck/Logistics - Realistisch */}
    <rect x="40" y="120" width="120" height="80" rx="6" fill="url(#br1)" filter="url(#br1glow)" />
    <rect x="50" y="90" width="70" height="50" rx="5" fill="url(#br1)" filter="url(#br1glow)" />
    <circle cx="70" cy="220" r="20" fill="url(#br1)" filter="url(#br1glow)" />
    <circle cx="70" cy="220" r="12" fill="rgba(0,245,255,0.3)" />
    <circle cx="130" cy="220" r="20" fill="url(#br1)" filter="url(#br1glow)" />
    <circle cx="130" cy="220" r="12" fill="rgba(0,245,255,0.3)" />
  </svg>
);

export const BrancheDienstleisterIcon = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="br2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.4" />
      </linearGradient>
      <filter id="br2glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Service/Handshake - Realistisch */}
    <circle cx="140" cy="140" r="60" fill="url(#br2)" filter="url(#br2glow)" />
    <circle cx="140" cy="140" r="45" fill="rgba(0,245,255,0.2)" />
    
    {/* Handshake/service symbol */}
    <path d="M 80 180 Q 100 160, 120 180 Q 140 160, 160 180 Q 180 160, 200 180" stroke="#00F5FF" strokeWidth="8" fill="none" strokeLinecap="round" filter="url(#br2glow)" />
    <circle cx="120" cy="180" r="8" fill="#00F5FF" />
    <circle cx="160" cy="180" r="8" fill="#00F5FF" />
  </svg>
);

export const BrancheProduktionIcon = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="br3" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.4" />
      </linearGradient>
      <filter id="br3glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Factory/Production - Realistisch */}
    <rect x="40" y="120" width="80" height="140" rx="6" fill="url(#br3)" filter="url(#br3glow)" />
    <rect x="120" y="100" width="80" height="160" rx="6" fill="url(#br3)" filter="url(#br3glow)" />
    <rect x="200" y="130" width="60" height="130" rx="6" fill="url(#br3)" filter="url(#br3glow)" />
    
    {/* Windows */}
    <rect x="50" y="160" width="16" height="20" rx="2" fill="rgba(0,245,255,0.4)" />
    <rect x="75" y="160" width="16" height="20" rx="2" fill="rgba(0,245,255,0.4)" />
    <rect x="130" y="140" width="16" height="20" rx="2" fill="rgba(0,245,255,0.4)" />
    <rect x="155" y="140" width="16" height="20" rx="2" fill="rgba(0,245,255,0.4)" />
    <rect x="210" y="170" width="12" height="16" rx="2" fill="rgba(0,245,255,0.4)" />
    <rect x="230" y="170" width="12" height="16" rx="2" fill="rgba(0,245,255,0.4)" />
    
    {/* Smoke/Steam */}
    <circle cx="80" cy="100" r="8" fill="rgba(0,245,255,0.3)" />
    <circle cx="160" cy="80" r="10" fill="rgba(0,245,255,0.3)" />
    <circle cx="230" cy="90" r="6" fill="rgba(0,245,255,0.3)" />
  </svg>
);

export const BrancheStudioIcon = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="br4" cx="50%" cy="50%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.4" />
      </radialGradient>
      <filter id="br4glow">
        <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Creative/Design Studio - Realistisch */}
    <rect x="60" y="80" width="160" height="120" rx="8" fill="url(#br4)" filter="url(#br4glow)" />
    <rect x="70" y="70" width="140" height="20" rx="4" fill="url(#br4)" filter="url(#br4glow)" />
    
    {/* Design elements */}
    <circle cx="100" cy="140" r="20" fill="rgba(0,245,255,0.3)" />
    <circle cx="140" cy="140" r="20" fill="rgba(0,245,255,0.3)" />
    <circle cx="180" cy="140" r="20" fill="rgba(0,245,255,0.3)" />
    
    {/* Pen/Tool */}
    <path d="M 200 200 L 240 160 L 250 170 L 210 210 Z" fill="url(#br4)" filter="url(#br4glow)" />
    <line x1="240" y1="160" x2="250" y2="170" stroke="#00F5FF" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const BrancheVerwaltungIcon = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="br5" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="1" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.4" />
      </linearGradient>
      <filter id="br5glow">
        <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Administration/Building - Realistisch */}
    <rect x="60" y="50" width="160" height="180" rx="8" fill="url(#br5)" filter="url(#br5glow)" />
    <rect x="60" y="50" width="160" height="36" rx="8" fill="url(#br5)" filter="url(#br5glow)" />
    
    {/* Windows */}
    <line x1="80" y1="120" x2="200" y2="120" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="80" y1="160" x2="200" y2="160" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    <line x1="80" y1="200" x2="192" y2="200" stroke="rgba(0,245,255,0.3)" strokeWidth="3" />
    
    {/* Door */}
    <rect x="110" y="220" width="60" height="60" rx="4" fill="rgba(0,245,255,0.2)" />
    <circle cx="150" cy="250" r="4" fill="#00F5FF" />
  </svg>
);

export const BrancheWachstumIcon = ({ className = "w-28 h-28" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="br6" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#00F5FF" stopOpacity="1" />
      </linearGradient>
      <filter id="br6glow">
        <feGaussianBlur stdDeviation="5" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    {/* Growth/Upward Trend - Realistisch */}
    <path d="M 35 250 L 60 210 L 85 170 L 110 130 L 135 90 L 160 60 L 185 45 L 210 38 L 235 34 L 245 30" stroke="url(#br6)" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#br6glow)" />
    <circle cx="60" cy="210" r="5" fill="url(#br6)" filter="url(#br6glow)" />
    <circle cx="110" cy="130" r="7" fill="url(#br6)" filter="url(#br6glow)" />
    <circle cx="245" cy="30" r="12" fill="url(#br6)" filter="url(#br6glow)" />
    <circle cx="245" cy="30" r="8" fill="rgba(255,255,255,0.5)" />
    <circle cx="245" cy="30" r="4" fill="#00F5FF" />
    
    {/* Arrow pointing up */}
    <path d="M 235 40 L 245 30 L 255 40 M 245 30 L 245 50" stroke="#00F5FF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" filter="url(#br6glow)" />
  </svg>
);

// Szenario-Visuals für "Keine Tools. Systeme." Section

// Card 1: Speditionen - Karte + Fahrer + Route
export const RouteMapDriverVisual = ({ className = "w-full h-full" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="route-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(6, 182, 212, 0.4)" />
          <stop offset="50%" stopColor="rgba(14, 165, 233, 0.5)" />
          <stop offset="100%" stopColor="rgba(6, 182, 212, 0.4)" />
        </linearGradient>
        <filter id="route-glow-filter">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Kleine Karte (Map) */}
      <rect x="20" y="20" width="360" height="180" rx="8" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1.5" />
      
      {/* Route-Linie auf Karte - Cyan/Blue */}
      <path
        d="M 40 100 Q 120 60, 200 80 T 360 100"
        fill="none"
        stroke="url(#route-glow)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 4"
        filter="url(#route-glow-filter)"
      />
      
      {/* Start-Punkt - Cyan */}
      <circle cx="40" cy="100" r="6" fill="rgba(6, 182, 212, 0.6)" stroke="rgba(14, 165, 233, 0.8)" strokeWidth="1.5" filter="url(#route-glow-filter)" />
      {/* Ziel-Punkt - Cyan */}
      <circle cx="360" cy="100" r="6" fill="rgba(6, 182, 212, 0.6)" stroke="rgba(14, 165, 233, 0.8)" strokeWidth="1.5" filter="url(#route-glow-filter)" />
      
      {/* Zwischenpunkte - Cyan */}
      <circle cx="200" cy="80" r="4" fill="rgba(6, 182, 212, 0.5)" filter="url(#route-glow-filter)" />
      
      {/* Fahrer (unten) - Cyan Accents */}
      <g transform="translate(180, 220)">
        {/* Fahrer-Avatar */}
        <circle cx="0" cy="0" r="20" fill="rgba(6, 182, 212, 0.1)" stroke="rgba(14, 165, 233, 0.4)" strokeWidth="1.5" />
        <circle cx="0" cy="-5" r="8" fill="rgba(6, 182, 212, 0.3)" />
        <rect x="-6" y="2" width="12" height="12" rx="2" fill="rgba(6, 182, 212, 0.2)" stroke="rgba(14, 165, 233, 0.3)" strokeWidth="0.5" />
        
        {/* Fahrer-Info - Cyan Tint */}
        <rect x="30" y="-8" width="80" height="6" rx="2" fill="rgba(6, 182, 212, 0.25)" />
        <rect x="30" y="2" width="60" height="5" rx="2" fill="rgba(6, 182, 212, 0.15)" />
      </g>
      
      {/* Verbindungslinie: Karte → Fahrer - Cyan */}
      <line x1="200" y1="200" x2="200" y2="200" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1" strokeDasharray="2 2" />
    </svg>
  );
};

// Card 2: Dienstleister - Ticket → Kalender → Haken
export const ProcessFlowVisual = ({ className = "w-full h-full" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="process-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
          <stop offset="50%" stopColor="rgba(139, 92, 246, 0.5)" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.4)" />
        </linearGradient>
        <filter id="process-glow-filter">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Ticket (Links) - Purple Accents */}
      <rect x="30" y="100" width="100" height="80" rx="6" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" />
      <rect x="40" y="110" width="80" height="8" rx="2" fill="rgba(168, 85, 247, 0.3)" />
      <rect x="40" y="125" width="60" height="6" rx="2" fill="rgba(139, 92, 246, 0.25)" />
      <rect x="40" y="135" width="70" height="6" rx="2" fill="rgba(139, 92, 246, 0.25)" />
      <rect x="40" y="145" width="50" height="6" rx="2" fill="rgba(168, 85, 247, 0.2)" />
      
      {/* Pfeil: Ticket → Kalender - Purple */}
      <path d="M 140 140 L 180 140" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" fill="none" strokeLinecap="round" filter="url(#process-glow-filter)" />
      <polygon points="175,138 180,140 175,142" fill="rgba(168, 85, 247, 0.5)" />
      
      {/* Kalender (Mitte) - Purple Accents */}
      <rect x="190" y="100" width="100" height="80" rx="6" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1.5" />
      {/* Kalender-Grid - Purple Tint */}
      <g opacity="0.4">
        {[0, 1, 2].map((row) => (
          <line key={`h-${row}`} x1="200" y1={115 + row * 15} x2="280" y2={115 + row * 15} stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4].map((col) => (
          <line key={`v-${col}`} x1={200 + col * 20} y1="110" x2={200 + col * 20} y2="170" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="1" />
        ))}
      </g>
      <rect x="200" y="110" width="80" height="8" rx="2" fill="rgba(168, 85, 247, 0.3)" />
      
      {/* Pfeil: Kalender → Haken - Purple */}
      <path d="M 300 140 L 340 140" stroke="rgba(168, 85, 247, 0.5)" strokeWidth="2" fill="none" strokeLinecap="round" filter="url(#process-glow-filter)" />
      <polygon points="335,138 340,140 335,142" fill="rgba(168, 85, 247, 0.5)" />
      
      {/* Haken (Rechts) - Purple/Green Mix */}
      <circle cx="370" cy="140" r="20" fill="rgba(168, 85, 247, 0.15)" stroke="rgba(139, 92, 246, 0.5)" strokeWidth="1.5" />
      <path d="M 360 140 L 365 145 L 380 130" stroke="rgba(34, 197, 94, 0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#process-glow-filter)" />
    </svg>
  );
};

// Card 3: Produktionsbetriebe - Maschine + Status + Qualitätscheck
export const MachineStatusVisual = ({ className = "w-full h-full" }: { className?: string }) => {
  return (
    <svg
      className={className}
      viewBox="0 0 400 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="machine-glow" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(34, 197, 94, 0.4)" />
          <stop offset="50%" stopColor="rgba(16, 185, 129, 0.5)" />
          <stop offset="100%" stopColor="rgba(34, 197, 94, 0.4)" />
        </linearGradient>
        <filter id="machine-glow-filter">
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Maschine (Links) - Green Accents */}
      <rect x="30" y="80" width="120" height="100" rx="8" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="1.5" />
      {/* Maschinen-Elemente - Green Tint */}
      <rect x="50" y="100" width="30" height="30" rx="4" fill="rgba(34, 197, 94, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
      <rect x="100" y="100" width="30" height="30" rx="4" fill="rgba(34, 197, 94, 0.15)" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="1" />
      <line x1="80" y1="140" x2="100" y2="140" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="2" strokeLinecap="round" filter="url(#machine-glow-filter)" />
      <circle cx="90" cy="140" r="4" fill="rgba(34, 197, 94, 0.5)" filter="url(#machine-glow-filter)" />
      
      {/* Status-Anzeige (Mitte) - Green Accents */}
      <g transform="translate(180, 100)">
        {/* Status-Box */}
        <rect x="0" y="0" width="80" height="60" rx="6" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="1.5" />
        {/* Status-Bars - Green Gradient */}
        <rect x="10" y="15" width="60" height="4" rx="2" fill="rgba(34, 197, 94, 0.4)" />
        <rect x="10" y="25" width="45" height="4" rx="2" fill="rgba(16, 185, 129, 0.35)" />
        <rect x="10" y="35" width="55" height="4" rx="2" fill="rgba(34, 197, 94, 0.35)" />
        {/* Status-Indikator - Enhanced Green */}
        <circle cx="70" cy="30" r="5" fill="rgba(34, 197, 94, 0.5)" stroke="rgba(16, 185, 129, 0.8)" strokeWidth="1" filter="url(#machine-glow-filter)" />
      </g>
      
      {/* Qualitätscheck (Rechts) - Enhanced Green */}
      <g transform="translate(290, 100)">
        {/* Check-Box */}
        <rect x="0" y="0" width="60" height="60" rx="6" fill="rgba(255, 255, 255, 0.05)" stroke="rgba(34, 197, 94, 0.4)" strokeWidth="1.5" />
        {/* Checkmark - Enhanced Green */}
        <circle cx="30" cy="30" r="15" fill="rgba(34, 197, 94, 0.2)" stroke="rgba(16, 185, 129, 0.6)" strokeWidth="1.5" filter="url(#machine-glow-filter)" />
        <path d="M 22 30 L 28 36 L 38 24" stroke="rgba(34, 197, 94, 0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" filter="url(#machine-glow-filter)" />
        {/* Qualitäts-Text - Green */}
        <text x="30" y="75" textAnchor="middle" fontSize="10" fill="rgba(34, 197, 94, 0.7)">OK</text>
      </g>
      
      {/* Verbindungslinien - Green */}
      <line x1="150" y1="130" x2="180" y2="130" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1.5" strokeDasharray="3 3" filter="url(#machine-glow-filter)" />
      <line x1="260" y1="130" x2="290" y2="130" stroke="rgba(34, 197, 94, 0.3)" strokeWidth="1.5" strokeDasharray="3 3" filter="url(#machine-glow-filter)" />
    </svg>
  );
};
