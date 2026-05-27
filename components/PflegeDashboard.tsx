"use client";

// Pflege-CRM Dashboard Visualisierung
// Edel, luxuriös, realistisch

export default function PflegeDashboard() {
  return (
    <div className="w-full h-full p-4 sm:p-6" style={{ height: "100%", minHeight: "400px" }}>
      <svg viewBox="0 0 800 450" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="pflege-bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(0, 245, 255, 0.05)" stopOpacity="1" />
            <stop offset="100%" stopColor="rgba(0, 245, 255, 0.02)" stopOpacity="1" />
          </linearGradient>
          <linearGradient id="pflege-chart" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#00F5FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00F5FF" stopOpacity="0.8" />
          </linearGradient>
          <filter id="pflege-glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Dashboard Background */}
        <rect width="800" height="450" rx="12" fill="url(#pflege-bg)" />
        
        {/* Header */}
        <rect x="20" y="20" width="760" height="50" rx="8" fill="rgba(0, 245, 255, 0.08)" stroke="rgba(0, 245, 255, 0.2)" strokeWidth="1" />
        <text x="40" y="45" fill="#00F5FF" fontSize="18" fontWeight="600" fontFamily="system-ui, -apple-system">Pflege-CRM Dashboard</text>
        <text x="650" y="45" fill="rgba(0, 245, 255, 0.6)" fontSize="14" fontFamily="system-ui, -apple-system">Synchronisiert</text>
        <circle cx="680" cy="35" r="4" fill="#00F5FF" filter="url(#pflege-glow)">
          <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
        </circle>
        
        {/* Stats Cards */}
        <g>
          {/* Card 1 */}
          <rect x="20" y="90" width="180" height="100" rx="8" fill="rgba(0, 245, 255, 0.06)" stroke="rgba(0, 245, 255, 0.15)" strokeWidth="1" />
          <text x="30" y="115" fill="rgba(0, 245, 255, 0.5)" fontSize="12" fontFamily="system-ui, -apple-system">Aktive Patienten</text>
          <text x="30" y="145" fill="#00F5FF" fontSize="32" fontWeight="700" fontFamily="system-ui, -apple-system">142</text>
          <text x="30" y="165" fill="rgba(0, 245, 255, 0.4)" fontSize="11" fontFamily="system-ui, -apple-system">Heute versorgt</text>
          
          {/* Card 2 */}
          <rect x="220" y="90" width="180" height="100" rx="8" fill="rgba(0, 245, 255, 0.06)" stroke="rgba(0, 245, 255, 0.15)" strokeWidth="1" />
          <text x="230" y="115" fill="rgba(0, 245, 255, 0.5)" fontSize="12" fontFamily="system-ui, -apple-system">Pflegekräfte</text>
          <text x="230" y="145" fill="#00F5FF" fontSize="32" fontWeight="700" fontFamily="system-ui, -apple-system">28</text>
          <text x="230" y="165" fill="rgba(0, 245, 255, 0.4)" fontSize="11" fontFamily="system-ui, -apple-system">Im Einsatz</text>
          
          {/* Card 3 */}
          <rect x="420" y="90" width="180" height="100" rx="8" fill="rgba(0, 245, 255, 0.06)" stroke="rgba(0, 245, 255, 0.15)" strokeWidth="1" />
          <text x="430" y="115" fill="rgba(0, 245, 255, 0.5)" fontSize="12" fontFamily="system-ui, -apple-system">Dokumentation</text>
          <text x="430" y="145" fill="#00F5FF" fontSize="32" fontWeight="700" fontFamily="system-ui, -apple-system">98%</text>
          <text x="430" y="165" fill="rgba(0, 245, 255, 0.4)" fontSize="11" fontFamily="system-ui, -apple-system">Automatisiert</text>
          
          {/* Card 4 */}
          <rect x="620" y="90" width="160" height="100" rx="8" fill="rgba(0, 245, 255, 0.06)" stroke="rgba(0, 245, 255, 0.15)" strokeWidth="1" />
          <text x="630" y="115" fill="rgba(0, 245, 255, 0.5)" fontSize="12" fontFamily="system-ui, -apple-system">Termine</text>
          <text x="630" y="145" fill="#00F5FF" fontSize="32" fontWeight="700" fontFamily="system-ui, -apple-system">156</text>
          <text x="630" y="165" fill="rgba(0, 245, 255, 0.4)" fontSize="11" fontFamily="system-ui, -apple-system">Heute geplant</text>
        </g>
        
        {/* Chart Area */}
        <rect x="20" y="210" width="360" height="220" rx="8" fill="rgba(0, 245, 255, 0.04)" stroke="rgba(0, 245, 255, 0.15)" strokeWidth="1" />
        <text x="30" y="235" fill="#00F5FF" fontSize="16" fontWeight="600" fontFamily="system-ui, -apple-system">Versorgungsverlauf</text>
        
        {/* Chart Grid */}
        <line x1="40" y1="250" x2="360" y2="250" stroke="rgba(0, 245, 255, 0.1)" strokeWidth="1" />
        <line x1="40" y1="300" x2="360" y2="300" stroke="rgba(0, 245, 255, 0.1)" strokeWidth="1" />
        <line x1="40" y1="350" x2="360" y2="350" stroke="rgba(0, 245, 255, 0.1)" strokeWidth="1" />
        <line x1="40" y1="400" x2="360" y2="400" stroke="rgba(0, 245, 255, 0.1)" strokeWidth="1" />
        
        {/* Line Chart */}
        <path d="M 60 380 L 100 340 L 140 320 L 180 300 L 220 280 L 260 270 L 300 260" stroke="#00F5FF" strokeWidth="3" fill="none" strokeLinecap="round" filter="url(#pflege-glow)" />
        <path d="M 60 380 L 100 340 L 140 320 L 180 300 L 220 280 L 260 270 L 300 260 L 300 400 L 60 400 Z" fill="url(#pflege-chart)" opacity="0.3" />
        
        {/* Data Points */}
        <circle cx="60" cy="380" r="5" fill="#00F5FF" filter="url(#pflege-glow)" />
        <circle cx="100" cy="340" r="5" fill="#00F5FF" filter="url(#pflege-glow)" />
        <circle cx="140" cy="320" r="5" fill="#00F5FF" filter="url(#pflege-glow)" />
        <circle cx="180" cy="300" r="5" fill="#00F5FF" filter="url(#pflege-glow)" />
        <circle cx="220" cy="280" r="5" fill="#00F5FF" filter="url(#pflege-glow)" />
        <circle cx="260" cy="270" r="5" fill="#00F5FF" filter="url(#pflege-glow)" />
        <circle cx="300" cy="260" r="5" fill="#00F5FF" filter="url(#pflege-glow)" />
        
        {/* Schedule Calendar */}
        <rect x="400" y="210" width="380" height="220" rx="8" fill="rgba(0, 245, 255, 0.04)" stroke="rgba(0, 245, 255, 0.15)" strokeWidth="1" />
        <text x="410" y="235" fill="#00F5FF" fontSize="16" fontWeight="600" fontFamily="system-ui, -apple-system">Heutiger Dienstplan</text>
        
        {/* Calendar Grid */}
        <line x1="410" y1="250" x2="770" y2="250" stroke="rgba(0, 245, 255, 0.1)" strokeWidth="1" />
        <line x1="410" y1="290" x2="770" y2="290" stroke="rgba(0, 245, 255, 0.1)" strokeWidth="1" />
        <line x1="410" y1="330" x2="770" y2="330" stroke="rgba(0, 245, 255, 0.1)" strokeWidth="1" />
        <line x1="410" y1="370" x2="770" y2="370" stroke="rgba(0, 245, 255, 0.1)" strokeWidth="1" />
        
        {/* Time Slots */}
        <text x="420" y="270" fill="rgba(0, 245, 255, 0.6)" fontSize="11" fontFamily="system-ui, -apple-system">08:00 - 12:00</text>
        <text x="520" y="270" fill="rgba(255, 255, 255, 0.8)" fontSize="12" fontFamily="system-ui, -apple-system">M. Schmidt - 5 Patienten</text>
        <rect x="700" y="255" width="60" height="20" rx="4" fill="rgba(0, 245, 255, 0.15)" />
        <text x="710" y="268" fill="#00F5FF" fontSize="10" fontFamily="system-ui, -apple-system">Aktiv</text>
        
        <text x="420" y="310" fill="rgba(0, 245, 255, 0.6)" fontSize="11" fontFamily="system-ui, -apple-system">12:00 - 16:00</text>
        <text x="520" y="310" fill="rgba(255, 255, 255, 0.8)" fontSize="12" fontFamily="system-ui, -apple-system">A. Weber - 7 Patienten</text>
        <rect x="700" y="295" width="60" height="20" rx="4" fill="rgba(0, 245, 255, 0.15)" />
        <text x="710" y="308" fill="#00F5FF" fontSize="10" fontFamily="system-ui, -apple-system">Geplant</text>
        
        <text x="420" y="350" fill="rgba(0, 245, 255, 0.6)" fontSize="11" fontFamily="system-ui, -apple-system">16:00 - 20:00</text>
        <text x="520" y="350" fill="rgba(255, 255, 255, 0.8)" fontSize="12" fontFamily="system-ui, -apple-system">K. Müller - 4 Patienten</text>
        <rect x="700" y="335" width="60" height="20" rx="4" fill="rgba(0, 245, 255, 0.15)" />
        <text x="710" y="348" fill="#00F5FF" fontSize="10" fontFamily="system-ui, -apple-system">Geplant</text>
        
        <text x="420" y="390" fill="rgba(0, 245, 255, 0.6)" fontSize="11" fontFamily="system-ui, -apple-system">20:00 - 24:00</text>
        <text x="520" y="390" fill="rgba(255, 255, 255, 0.8)" fontSize="12" fontFamily="system-ui, -apple-system">J. Fischer - 3 Patienten</text>
        <rect x="700" y="375" width="60" height="20" rx="4" fill="rgba(0, 245, 255, 0.15)" />
        <text x="710" y="388" fill="#00F5FF" fontSize="10" fontFamily="system-ui, -apple-system">Geplant</text>
      </svg>
    </div>
  );
}

