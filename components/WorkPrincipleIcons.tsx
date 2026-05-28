"use client";

// Premium Work Principle Icons - Highest Level Design
// Purple/Lila only, no blue

export const ClearSystemsIcon = ({ className = "w-24 h-24" }: { className?: string }) => {
  const uniqueId = `clear-systems-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 32px rgba(164, 92, 255, 0.4))" }}
    >
      <defs>
        <radialGradient id={`${uniqueId}-target`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#F1E9FF" stopOpacity="1" />
          <stop offset="50%" stopColor="#C6A8FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.4" />
        </radialGradient>
        <radialGradient id={`${uniqueId}-ring1`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#C6A8FF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.2" />
        </radialGradient>
        <radialGradient id={`${uniqueId}-ring2`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#C6A8FF" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.1" />
        </radialGradient>
        <radialGradient id={`${uniqueId}-ring3`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#C6A8FF" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.05" />
        </radialGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Outer Ring */}
      <circle cx="100" cy="100" r="85" fill="none" stroke={`url(#${uniqueId}-ring3)`} strokeWidth="2" opacity="0.6" />
      <circle cx="100" cy="100" r="70" fill="none" stroke={`url(#${uniqueId}-ring2)`} strokeWidth="2" opacity="0.7" />
      <circle cx="100" cy="100" r="55" fill="none" stroke={`url(#${uniqueId}-ring1)`} strokeWidth="2" opacity="0.8" />
      
      {/* Target Circles */}
      <circle cx="100" cy="100" r="45" fill="none" stroke="#C6A8FF" strokeWidth="2" opacity="0.5" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="100" cy="100" r="30" fill="none" stroke="#C6A8FF" strokeWidth="2" opacity="0.6" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="100" cy="100" r="15" fill="none" stroke="#C6A8FF" strokeWidth="2" opacity="0.7" filter={`url(#${uniqueId}-glow)`} />
      
      {/* Center Bullseye */}
      <circle cx="100" cy="100" r="8" fill={`url(#${uniqueId}-target)`} filter={`url(#${uniqueId}-glow)`} />
      <circle cx="100" cy="100" r="5" fill="#F1E9FF" opacity="0.9" />
      
      {/* Crosshairs */}
      <line x1="100" y1="20" x2="100" y2="40" stroke="#C6A8FF" strokeWidth="2" strokeLinecap="round" opacity="0.7" filter={`url(#${uniqueId}-glow)`} />
      <line x1="100" y1="160" x2="100" y2="180" stroke="#C6A8FF" strokeWidth="2" strokeLinecap="round" opacity="0.7" filter={`url(#${uniqueId}-glow)`} />
      <line x1="20" y1="100" x2="40" y2="100" stroke="#C6A8FF" strokeWidth="2" strokeLinecap="round" opacity="0.7" filter={`url(#${uniqueId}-glow)`} />
      <line x1="160" y1="100" x2="180" y2="100" stroke="#C6A8FF" strokeWidth="2" strokeLinecap="round" opacity="0.7" filter={`url(#${uniqueId}-glow)`} />
    </svg>
  );
};

export const FastImplementationIcon = ({ className = "w-24 h-24" }: { className?: string }) => {
  const uniqueId = `fast-impl-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 32px rgba(164, 92, 255, 0.4))" }}
    >
      <defs>
        <linearGradient id={`${uniqueId}-bolt`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F1E9FF" stopOpacity="1" />
          <stop offset="50%" stopColor="#C6A8FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.8" />
        </linearGradient>
        <radialGradient id={`${uniqueId}-glow`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#C6A8FF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0" />
        </radialGradient>
        <filter id={`${uniqueId}-glow-filter`}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Background Glow */}
      <circle cx="100" cy="100" r="80" fill={`url(#${uniqueId}-glow)`} opacity="0.4" />
      
      {/* Lightning Bolt - Main Shape */}
      <path
        d="M 100 30 L 70 90 L 90 90 L 80 170 L 130 110 L 110 110 L 120 30 Z"
        fill={`url(#${uniqueId}-bolt)`}
        filter={`url(#${uniqueId}-glow-filter)`}
        opacity="0.95"
      />
      
      {/* Lightning Bolt - Inner Highlight */}
      <path
        d="M 100 50 L 80 90 L 95 90 L 88 150 L 120 110 L 105 110 L 112 50 Z"
        fill="#F1E9FF"
        opacity="0.6"
      />
      
      {/* Energy Particles */}
      <circle cx="60" cy="70" r="3" fill="#C6A8FF" opacity="0.8" filter={`url(#${uniqueId}-glow-filter)`} />
      <circle cx="140" cy="80" r="2.5" fill="#C6A8FF" opacity="0.7" filter={`url(#${uniqueId}-glow-filter)`} />
      <circle cx="75" cy="120" r="2" fill="#C6A8FF" opacity="0.6" filter={`url(#${uniqueId}-glow-filter)`} />
      <circle cx="125" cy="130" r="2.5" fill="#C6A8FF" opacity="0.7" filter={`url(#${uniqueId}-glow-filter)`} />
      
      {/* Speed Lines */}
      <line x1="50" y1="50" x2="45" y2="55" stroke="#C6A8FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="150" y1="50" x2="155" y2="55" stroke="#C6A8FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="45" y1="150" x2="50" y2="155" stroke="#C6A8FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="155" y1="150" x2="150" y2="155" stroke="#C6A8FF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
    </svg>
  );
};

export const ScalableArchitectureIcon = ({ className = "w-24 h-24" }: { className?: string }) => {
  const uniqueId = `scalable-arch-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 32px rgba(164, 92, 255, 0.4))" }}
    >
      <defs>
        <linearGradient id={`${uniqueId}-bar1`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#F1E9FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#C6A8FF" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-bar2`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C6A8FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.8" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-bar3`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#C6A8FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.9" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-bar4`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8A5CFF" stopOpacity="1" />
          <stop offset="100%" stopColor="#A45CFF" stopOpacity="0.9" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Base Platform */}
      <rect x="30" y="170" width="140" height="8" rx="4" fill="#8A5CFF" opacity="0.3" />
      
      {/* Growth Bars - Ascending */}
      <rect x="40" y="120" width="25" height="50" rx="4" fill={`url(#${uniqueId}-bar1)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="42" y="122" width="21" height="48" rx="3" fill="#F1E9FF" opacity="0.2" />
      
      <rect x="75" y="100" width="25" height="70" rx="4" fill={`url(#${uniqueId}-bar2)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="77" y="102" width="21" height="68" rx="3" fill="#C6A8FF" opacity="0.2" />
      
      <rect x="110" y="70" width="25" height="100" rx="4" fill={`url(#${uniqueId}-bar3)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="112" y="72" width="21" height="98" rx="3" fill="#C6A8FF" opacity="0.2" />
      
      <rect x="145" y="50" width="25" height="120" rx="4" fill={`url(#${uniqueId}-bar4)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="147" y="52" width="21" height="118" rx="3" fill="#8A5CFF" opacity="0.2" />
      
      {/* Growth Arrow */}
      <path
        d="M 50 140 L 150 40"
        stroke="#C6A8FF"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="5,5"
        opacity="0.6"
        filter={`url(#${uniqueId}-glow)`}
      />
      <polygon
        points="145,45 155,40 150,50"
        fill="#C6A8FF"
        opacity="0.8"
        filter={`url(#${uniqueId}-glow)`}
      />
      
      {/* Data Points */}
      <circle cx="52.5" cy="145" r="3" fill="#F1E9FF" opacity="0.9" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="87.5" cy="135" r="3" fill="#C6A8FF" opacity="0.9" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="122.5" cy="95" r="3" fill="#C6A8FF" opacity="0.9" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="157.5" cy="75" r="3" fill="#8A5CFF" opacity="0.9" filter={`url(#${uniqueId}-glow)`} />
    </svg>
  );
};

export const DirectCollaborationIcon = ({ className = "w-24 h-24" }: { className?: string }) => {
  const uniqueId = `direct-collab-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg
      className={className}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: "drop-shadow(0 8px 32px rgba(164, 92, 255, 0.4))" }}
    >
      <defs>
        <radialGradient id={`${uniqueId}-hand1`} cx="30%" cy="30%">
          <stop offset="0%" stopColor="#F1E9FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#C6A8FF" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id={`${uniqueId}-hand2`} cx="70%" cy="30%">
          <stop offset="0%" stopColor="#F1E9FF" stopOpacity="1" />
          <stop offset="100%" stopColor="#C6A8FF" stopOpacity="0.6" />
        </radialGradient>
        <radialGradient id={`${uniqueId}-connection`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#C6A8FF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#8A5CFF" stopOpacity="0.2" />
        </radialGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Connection Energy */}
      <ellipse cx="100" cy="100" rx="90" ry="40" fill={`url(#${uniqueId}-connection)`} opacity="0.3" />
      
      {/* Left Hand */}
      <g transform="translate(40, 80) rotate(-15)">
        <ellipse cx="0" cy="0" rx="25" ry="35" fill={`url(#${uniqueId}-hand1)`} filter={`url(#${uniqueId}-glow)`} />
        <ellipse cx="0" cy="0" rx="20" ry="30" fill="#F1E9FF" opacity="0.3" />
        {/* Fingers */}
        <ellipse cx="-15" cy="-20" rx="8" ry="18" fill={`url(#${uniqueId}-hand1)`} opacity="0.8" />
        <ellipse cx="0" cy="-25" rx="8" ry="20" fill={`url(#${uniqueId}-hand1)`} opacity="0.8" />
        <ellipse cx="15" cy="-20" rx="8" ry="18" fill={`url(#${uniqueId}-hand1)`} opacity="0.8" />
      </g>
      
      {/* Right Hand */}
      <g transform="translate(160, 80) rotate(15)">
        <ellipse cx="0" cy="0" rx="25" ry="35" fill={`url(#${uniqueId}-hand2)`} filter={`url(#${uniqueId}-glow)`} />
        <ellipse cx="0" cy="0" rx="20" ry="30" fill="#F1E9FF" opacity="0.3" />
        {/* Fingers */}
        <ellipse cx="-15" cy="-20" rx="8" ry="18" fill={`url(#${uniqueId}-hand2)`} opacity="0.8" />
        <ellipse cx="0" cy="-25" rx="8" ry="20" fill={`url(#${uniqueId}-hand2)`} opacity="0.8" />
        <ellipse cx="15" cy="-20" rx="8" ry="18" fill={`url(#${uniqueId}-hand2)`} opacity="0.8" />
      </g>
      
      {/* Connection Beam */}
      <path
        d="M 65 100 Q 100 80 135 100"
        stroke="#C6A8FF"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
        filter={`url(#${uniqueId}-glow)`}
      />
      <path
        d="M 65 100 Q 100 120 135 100"
        stroke="#C6A8FF"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
        filter={`url(#${uniqueId}-glow)`}
      />
      
      {/* Energy Particles */}
      <circle cx="80" cy="90" r="3" fill="#C6A8FF" opacity="0.8" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="100" cy="85" r="2.5" fill="#F1E9FF" opacity="0.7" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="120" cy="90" r="3" fill="#C6A8FF" opacity="0.8" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="80" cy="110" r="3" fill="#C6A8FF" opacity="0.8" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="100" cy="115" r="2.5" fill="#F1E9FF" opacity="0.7" filter={`url(#${uniqueId}-glow)`} />
      <circle cx="120" cy="110" r="3" fill="#C6A8FF" opacity="0.8" filter={`url(#${uniqueId}-glow)`} />
    </svg>
  );
};

