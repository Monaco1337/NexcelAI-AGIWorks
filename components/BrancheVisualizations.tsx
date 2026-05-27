"use client";

// Enterprise System Visuals - Live KI-Systeme in Aktion
// Apple / Stripe / Tesla Dashboard-Qualität
// Monochrom + minimale Cyan/Violet-Akzente

import { motion } from "framer-motion";

// Speditionen = Aktive Flotten-Orchestrierung
export const SpeditionVisualization = () => {
  const uniqueId = `sped-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`${uniqueId}-core-gradient`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#00E1FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-node-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A45CFF" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-flow-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#A45CFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E1FF" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${uniqueId}-glow`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id={`${uniqueId}-pulse`}>
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.4" />
            </feComponentTransfer>
          </filter>
        </defs>

        {/* Stats Cards */}
        <g>
          <rect x="20" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="30" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Touren/Tag</text>
          <text x="30" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">247</text>
        </g>
        <g>
          <rect x="140" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="150" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Fahrzeuge</text>
          <text x="150" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">28</text>
        </g>
        <g>
          <rect x="260" y="20" width="120" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="270" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Optimierung</text>
          <text x="270" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">94%</text>
        </g>

        {/* Central Orchestration Core */}
        <motion.rect
          x="170"
          y="120"
          width="60"
          height="60"
          rx="4"
          fill={`url(#${uniqueId}-core-gradient)`}
          filter={`url(#${uniqueId}-glow)`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <rect x="175" y="125" width="50" height="3" rx="1" fill="#FFFFFF" opacity="0.4" />
        <rect x="175" y="135" width="40" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="175" y="145" width="45" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="175" y="155" width="35" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="175" y="165" width="42" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />

        {/* Fleet Nodes - Active Vehicles */}
        {[
          { x: 80, y: 140, delay: 0 },
          { x: 320, y: 140, delay: 0.5 },
          { x: 80, y: 200, delay: 1 },
          { x: 320, y: 200, delay: 1.5 },
        ].map((node, i) => (
          <g key={i}>
            <motion.rect
              x={node.x - 12}
              y={node.y - 12}
              width="24"
              height="24"
              rx="3"
              fill={`url(#${uniqueId}-node-gradient)`}
              filter={`url(#${uniqueId}-glow)`}
              initial={{ opacity: 0.7 }}
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
            />
            <rect x={node.x - 8} y={node.y - 8} width="16" height="16" rx="2" fill="#FFFFFF" opacity="0.2" />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="3"
              fill="#00E1FF"
              opacity="0.8"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Connection to Core */}
            <line
              x1={node.x}
              y1={node.y}
              x2="200"
              y2="150"
              stroke={`url(#${uniqueId}-flow-gradient)`}
              strokeWidth="1"
              opacity="0.3"
            />
          </g>
        ))}

        {/* Active Route Flows */}
        <motion.path
          d="M 80 140 Q 140 130 200 150 Q 260 130 320 140"
          fill="none"
          stroke={`url(#${uniqueId}-flow-gradient)`}
          strokeWidth="1.5"
          opacity="0.4"
          strokeDasharray="4 4"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: [0, 1, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
};

// Dienstleister = Parallele Service-Steuerung
export const DienstleisterVisualization = () => {
  const uniqueId = `dienst-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <radialGradient id={`${uniqueId}-hub-gradient`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#A45CFF" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id={`${uniqueId}-service-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#00E1FF" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-flow-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#A45CFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E1FF" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${uniqueId}-glow`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stats Cards */}
        <g>
          <rect x="20" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="30" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Kunden</text>
          <text x="30" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">1.2K</text>
        </g>
        <g>
          <rect x="140" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="150" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Projekte</text>
          <text x="150" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">342</text>
        </g>
        <g>
          <rect x="260" y="20" width="120" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="270" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Automatisierung</text>
          <text x="270" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">87%</text>
        </g>

        {/* Central Service Hub */}
        <motion.circle
          cx="200"
          cy="160"
          r="35"
          fill={`url(#${uniqueId}-hub-gradient)`}
          filter={`url(#${uniqueId}-glow)`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <rect x="185" y="150" width="30" height="3" rx="1" fill="#FFFFFF" opacity="0.4" />
        <rect x="185" y="158" width="25" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="185" y="166" width="28" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />

        {/* Parallel Service Nodes - 6 Services */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i * 60 - 90) * (Math.PI / 180);
          const x = 200 + Math.cos(angle) * 70;
          const y = 160 + Math.sin(angle) * 70;
          return (
            <g key={i}>
              <motion.rect
                x={x - 14}
                y={y - 14}
                width="28"
                height="28"
                rx="3"
                fill={`url(#${uniqueId}-service-gradient)`}
                filter={`url(#${uniqueId}-glow)`}
                initial={{ opacity: 0.75 }}
                animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 2.5, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              />
              <rect x={x - 10} y={y - 10} width="20" height="20" rx="2" fill="#FFFFFF" opacity="0.15" />
              <motion.circle
                cx={x}
                cy={y}
                r="2.5"
                fill="#00E1FF"
                opacity="0.9"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.4, 1] }}
                transition={{ duration: 2, delay: i * 0.3, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Connection to Hub */}
              <line
                x1={x}
                y1={y}
                x2="200"
                y2="160"
                stroke={`url(#${uniqueId}-flow-gradient)`}
                strokeWidth="1"
                opacity="0.3"
              />
            </g>
          );
        })}

        {/* Parallel Processing Rings */}
        <motion.circle
          cx="200"
          cy="160"
          r="50"
          fill="none"
          stroke={`url(#${uniqueId}-flow-gradient)`}
          strokeWidth="1"
          opacity="0.2"
          strokeDasharray="3 3"
          initial={{ rotate: 0 }}
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
      </svg>
    </div>
  );
};

// Produktionsbetriebe = Output- & Effizienz-System
export const ProduktionVisualization = () => {
  const uniqueId = `prod-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`${uniqueId}-core-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-output-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A45CFF" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-flow-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#A45CFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E1FF" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${uniqueId}-glow`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stats Cards */}
        <g>
          <rect x="20" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="30" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Output/Tag</text>
          <text x="30" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">2.4K</text>
        </g>
        <g>
          <rect x="140" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="150" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Effizienz</text>
          <text x="150" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">96%</text>
        </g>
        <g>
          <rect x="260" y="20" width="120" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="270" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Automatisierung</text>
          <text x="270" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">89%</text>
        </g>

        {/* Central Production Core */}
        <motion.rect
          x="170"
          y="120"
          width="60"
          height="60"
          rx="4"
          fill={`url(#${uniqueId}-core-gradient)`}
          filter={`url(#${uniqueId}-glow)`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <rect x="175" y="125" width="50" height="3" rx="1" fill="#FFFFFF" opacity="0.4" />
        <rect x="175" y="135" width="45" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="175" y="145" width="48" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="175" y="155" width="42" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />

        {/* Output Channels - 3 Parallel Streams */}
        {[
          { x: 100, y: 220, delay: 0 },
          { x: 200, y: 220, delay: 0.3 },
          { x: 300, y: 220, delay: 0.6 },
        ].map((channel, i) => (
          <g key={i}>
            <motion.rect
              x={channel.x - 20}
              y={channel.y - 15}
              width="40"
              height="30"
              rx="3"
              fill={`url(#${uniqueId}-output-gradient)`}
              filter={`url(#${uniqueId}-glow)`}
              initial={{ opacity: 0.75 }}
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.5, delay: channel.delay, repeat: Infinity, ease: "easeInOut" }}
            />
            <rect x={channel.x - 15} y={channel.y - 10} width="30" height="20" rx="2" fill="#FFFFFF" opacity="0.15" />
            <motion.circle
              cx={channel.x}
              cy={channel.y}
              r="3"
              fill="#00E1FF"
              opacity="0.9"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, delay: channel.delay, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Output Flow */}
            <motion.path
              d={`M 200 180 L ${channel.x} ${channel.y - 15}`}
              fill="none"
              stroke={`url(#${uniqueId}-flow-gradient)`}
              strokeWidth="1.5"
              opacity="0.4"
              strokeDasharray="3 3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: [0, 1, 0] }}
              transition={{ duration: 2, delay: channel.delay, repeat: Infinity, ease: "linear" }}
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

// Studios & Agenturen = Workflow-Pipeline
export const StudioVisualization = () => {
  const uniqueId = `studio-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`${uniqueId}-stage-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#00E1FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-flow-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#A45CFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E1FF" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${uniqueId}-glow`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stats Cards */}
        <g>
          <rect x="20" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="30" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Projekte</text>
          <text x="30" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">128</text>
        </g>
        <g>
          <rect x="140" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="150" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Kunden</text>
          <text x="150" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">47</text>
        </g>
        <g>
          <rect x="260" y="20" width="120" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="270" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Workflow</text>
          <text x="270" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">92%</text>
        </g>

        {/* Workflow Pipeline - 4 Stages */}
        {[
          { x: 80, label: "Input", delay: 0 },
          { x: 160, label: "Process", delay: 0.5 },
          { x: 240, label: "Review", delay: 1 },
          { x: 320, label: "Output", delay: 1.5 },
        ].map((stage, i) => (
          <g key={i}>
            <motion.rect
              x={stage.x - 30}
              y="130"
              width="60"
              height="60"
              rx="4"
              fill={`url(#${uniqueId}-stage-gradient)`}
              filter={`url(#${uniqueId}-glow)`}
              initial={{ opacity: 0.8 }}
              animate={{ opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 3, delay: stage.delay, repeat: Infinity, ease: "easeInOut" }}
            />
            <rect x={stage.x - 25} y="135" width="50" height="4" rx="1" fill="#FFFFFF" opacity="0.3" />
            <rect x={stage.x - 25} y="145" width="40" height="4" rx="1" fill="#FFFFFF" opacity="0.3" />
            <rect x={stage.x - 25} y="155" width="45" height="4" rx="1" fill="#FFFFFF" opacity="0.3" />
            <rect x={stage.x - 25} y="165" width="35" height="4" rx="1" fill="#FFFFFF" opacity="0.3" />
            <motion.circle
              cx={stage.x}
              cy="160"
              r="3"
              fill="#00E1FF"
              opacity="0.9"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, delay: stage.delay, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Flow Arrow */}
            {i < 3 && (
              <motion.path
                d={`M ${stage.x + 30} 160 L ${stage.x + 60} 160`}
                fill="none"
                stroke={`url(#${uniqueId}-flow-gradient)`}
                strokeWidth="1.5"
                opacity="0.4"
                strokeDasharray="3 3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: [0, 1, 0] }}
                transition={{ duration: 2, delay: stage.delay, repeat: Infinity, ease: "linear" }}
              />
            )}
          </g>
        ))}
      </svg>
    </div>
  );
};

// Verwaltungen = Kontroll- & Ordnungssystem
export const VerwaltungVisualization = () => {
  const uniqueId = `verw-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <linearGradient id={`${uniqueId}-control-gradient`} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="50%" stopColor="#00E1FF" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-node-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#A45CFF" stopOpacity="0.3" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-flow-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#A45CFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E1FF" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${uniqueId}-glow`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stats Cards */}
        <g>
          <rect x="20" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="30" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Dokumente</text>
          <text x="30" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">8.4K</text>
        </g>
        <g>
          <rect x="140" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="150" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Prozesse</text>
          <text x="150" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">342</text>
        </g>
        <g>
          <rect x="260" y="20" width="120" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="270" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Automatisierung</text>
          <text x="270" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">91%</text>
        </g>

        {/* Central Control System */}
        <motion.rect
          x="170"
          y="120"
          width="60"
          height="60"
          rx="4"
          fill={`url(#${uniqueId}-control-gradient)`}
          filter={`url(#${uniqueId}-glow)`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <rect x="175" y="125" width="50" height="3" rx="1" fill="#FFFFFF" opacity="0.4" />
        <rect x="175" y="135" width="45" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="175" y="145" width="48" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="175" y="155" width="42" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />

        {/* Control Nodes - Organized Structure */}
        {[
          { x: 100, y: 140, delay: 0 },
          { x: 100, y: 200, delay: 0.3 },
          { x: 300, y: 140, delay: 0.6 },
          { x: 300, y: 200, delay: 0.9 },
        ].map((node, i) => (
          <g key={i}>
            <motion.rect
              x={node.x - 18}
              y={node.y - 18}
              width="36"
              height="36"
              rx="3"
              fill={`url(#${uniqueId}-node-gradient)`}
              filter={`url(#${uniqueId}-glow)`}
              initial={{ opacity: 0.75 }}
              animate={{ opacity: [0.75, 1, 0.75] }}
              transition={{ duration: 2.5, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
            />
            <rect x={node.x - 12} y={node.y - 12} width="24" height="24" rx="2" fill="#FFFFFF" opacity="0.15" />
            <rect x={node.x - 8} y={node.y - 8} width="16" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
            <rect x={node.x - 8} y={node.y - 2} width="12" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="2.5"
              fill="#00E1FF"
              opacity="0.9"
              initial={{ scale: 1 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
            />
            {/* Connection to Control */}
            <line
              x1={node.x}
              y1={node.y}
              x2="200"
              y2="150"
              stroke={`url(#${uniqueId}-flow-gradient)`}
              strokeWidth="1"
              opacity="0.3"
            />
          </g>
        ))}
      </svg>
    </div>
  );
};

// Wachstumsunternehmen = Stabiles, intelligentes Wachstum
export const WachstumVisualization = () => {
  const uniqueId = `wachs-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <div className="w-full h-full relative overflow-hidden">
      <svg viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <radialGradient id={`${uniqueId}-core-gradient`} cx="50%" cy="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="50%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#A45CFF" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id={`${uniqueId}-expansion-gradient`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#00E1FF" stopOpacity="0.4" />
          </linearGradient>
          <linearGradient id={`${uniqueId}-flow-gradient`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00E1FF" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#A45CFF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00E1FF" stopOpacity="0.5" />
          </linearGradient>
          <filter id={`${uniqueId}-glow`}>
            <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" result="blur" />
            <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
            <feComponentTransfer>
              <feFuncA type="linear" slope="0.35" />
            </feComponentTransfer>
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Stats Cards */}
        <g>
          <rect x="20" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="30" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Wachstum</text>
          <text x="30" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">+247%</text>
        </g>
        <g>
          <rect x="140" y="20" width="100" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="150" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Umsatz</text>
          <text x="150" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">€2.4M</text>
        </g>
        <g>
          <rect x="260" y="20" width="120" height="50" rx="10" fill="rgba(0, 0, 0, 0.35)" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="0.5" />
          <text x="270" y="36" fill="rgba(255, 255, 255, 0.5)" fontSize="9" fontFamily="system-ui, -apple-system" fontWeight="400" letterSpacing="0.5">Skalierung</text>
          <text x="270" y="56" fill="rgba(255, 255, 255, 0.95)" fontSize="20" fontWeight="600" fontFamily="system-ui, -apple-system" letterSpacing="-0.5">94%</text>
        </g>

        {/* Central Growth Core */}
        <motion.circle
          cx="200"
          cy="160"
          r="40"
          fill={`url(#${uniqueId}-core-gradient)`}
          filter={`url(#${uniqueId}-glow)`}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
        <rect x="185" y="150" width="30" height="3" rx="1" fill="#FFFFFF" opacity="0.4" />
        <rect x="185" y="158" width="25" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />
        <rect x="185" y="166" width="28" height="3" rx="1" fill="#FFFFFF" opacity="0.3" />

        {/* Expansion Nodes - Stable Growth Pattern */}
        {[
          { angle: -90, distance: 65, delay: 0 },
          { angle: -30, distance: 65, delay: 0.4 },
          { angle: 30, distance: 65, delay: 0.8 },
          { angle: 90, distance: 65, delay: 1.2 },
          { angle: 150, distance: 65, delay: 1.6 },
          { angle: -150, distance: 65, delay: 2 },
        ].map((node, i) => {
          const angle = (node.angle * Math.PI) / 180;
          const x = 200 + node.distance * Math.cos(angle);
          const y = 160 + node.distance * Math.sin(angle);
          return (
            <g key={i}>
              <motion.rect
                x={x - 12}
                y={y - 12}
                width="24"
                height="24"
                rx="3"
                fill={`url(#${uniqueId}-expansion-gradient)`}
                filter={`url(#${uniqueId}-glow)`}
                initial={{ opacity: 0.75 }}
                animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 3, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
              />
              <rect x={x - 8} y={y - 8} width="16" height="16" rx="2" fill="#FFFFFF" opacity="0.15" />
              <motion.circle
                cx={x}
                cy={y}
                r="2.5"
                fill="#00E1FF"
                opacity="0.9"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2.5, delay: node.delay, repeat: Infinity, ease: "easeInOut" }}
              />
              {/* Connection to Core */}
              <line
                x1={x}
                y1={y}
                x2="200"
                y2="160"
                stroke={`url(#${uniqueId}-flow-gradient)`}
                strokeWidth="1"
                opacity="0.3"
              />
            </g>
          );
        })}

        {/* Expansion Rings - Stable Growth Visualization */}
        <motion.circle
          cx="200"
          cy="160"
          r="55"
          fill="none"
          stroke={`url(#${uniqueId}-flow-gradient)`}
          strokeWidth="1"
          opacity="0.2"
          strokeDasharray="2 2"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.circle
          cx="200"
          cy="160"
          r="70"
          fill="none"
          stroke={`url(#${uniqueId}-flow-gradient)`}
          strokeWidth="0.8"
          opacity="0.15"
          strokeDasharray="2 2"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>
    </div>
  );
};
