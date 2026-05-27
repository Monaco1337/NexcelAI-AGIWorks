"use client";

// High-End Hexagon Icons für Branchen-Karten
// Futuristisch, edel, luxuriös

export const SpeditionHexIcon = ({ size = 48, theme = "dark" }: { size?: number; theme?: "dark" | "light" }) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  const uniqueId = `sped-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uniqueId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Truck */}
      <rect x="8" y="20" width="20" height="12" rx="2" fill={`url(#${uniqueId}-grad)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="10" y="22" width="16" height="6" rx="1" fill={color} opacity="0.3" />
      <circle cx="14" cy="36" r="4" fill={color} opacity="0.4" />
      <circle cx="14" cy="36" r="2.5" fill={color} />
      <circle cx="26" cy="36" r="4" fill={color} opacity="0.4" />
      <circle cx="26" cy="36" r="2.5" fill={color} />
      {/* Globe on truck */}
      <circle cx="28" cy="18" r="6" fill="none" stroke={color} strokeWidth="1.5" opacity="0.8" />
      <path d="M 28 12 Q 30 14 28 16 Q 26 14 28 12" fill={color} opacity="0.6" />
      <path d="M 28 18 Q 30 20 28 22 Q 26 20 28 18" fill={color} opacity="0.6" />
    </svg>
  );
};

export const DienstleisterHexIcon = ({ size = 48, theme = "dark" }: { size?: number; theme?: "dark" | "light" }) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="dienst-hex-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <filter id="dienst-hex-glow">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Handshake */}
      <path d="M 16 28 L 20 24 L 18 22 L 14 26 Z" fill={`url(#dienst-hex-grad)`} filter="url(#dienst-hex-glow)" />
      <path d="M 32 28 L 28 24 L 30 22 L 34 26 Z" fill={`url(#dienst-hex-grad)`} filter="url(#dienst-hex-glow)" />
      <path d="M 20 24 L 24 20 L 28 24 L 24 28 Z" fill={color} opacity="0.4" />
      <circle cx="18" cy="26" r="2" fill={color} />
      <circle cx="30" cy="26" r="2" fill={color} />
    </svg>
  );
};

export const ProduktionHexIcon = ({ size = 48, theme = "dark" }: { size?: number; theme?: "dark" | "light" }) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  const uniqueId = `prod-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uniqueId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Factory Building */}
      <rect x="12" y="20" width="24" height="20" rx="1" fill={`url(#${uniqueId}-grad)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="14" y="22" width="6" height="6" rx="0.5" fill={color} opacity="0.3" />
      <rect x="22" y="22" width="6" height="6" rx="0.5" fill={color} opacity="0.3" />
      <rect x="28" y="22" width="6" height="6" rx="0.5" fill={color} opacity="0.3" />
      {/* Chimney */}
      <rect x="30" y="14" width="4" height="8" rx="0.5" fill={color} opacity="0.6" />
      {/* Gears */}
      <circle cx="18" cy="32" r="3" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
      <circle cx="18" cy="32" r="1.5" fill={color} />
      <circle cx="30" cy="32" r="3" fill="none" stroke={color} strokeWidth="1" opacity="0.6" />
      <circle cx="30" cy="32" r="1.5" fill={color} />
    </svg>
  );
};

export const StudioHexIcon = ({ size = 48, theme = "dark" }: { size?: number; theme?: "dark" | "light" }) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  const uniqueId = `studio-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uniqueId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Camera */}
      <rect x="14" y="18" width="20" height="14" rx="2" fill={`url(#${uniqueId}-grad)`} filter={`url(#${uniqueId}-glow)`} />
      <circle cx="24" cy="25" r="5" fill={color} opacity="0.3" />
      <circle cx="24" cy="25" r="3" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="24" cy="25" r="1.5" fill={color} />
      {/* Microphone */}
      <rect x="22" y="10" width="4" height="8" rx="1" fill={color} opacity="0.8" />
      <path d="M 20 10 Q 24 8 28 10" stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
};

export const VerwaltungHexIcon = ({ size = 48, theme = "dark" }: { size?: number; theme?: "dark" | "light" }) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  const uniqueId = `verw-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uniqueId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Building with Columns */}
      <rect x="12" y="20" width="24" height="20" rx="1" fill={`url(#${uniqueId}-grad)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="14" y="22" width="4" height="6" rx="0.5" fill={color} opacity="0.4" />
      <rect x="20" y="22" width="4" height="6" rx="0.5" fill={color} opacity="0.4" />
      <rect x="26" y="22" width="4" height="6" rx="0.5" fill={color} opacity="0.4" />
      <rect x="32" y="22" width="4" height="6" rx="0.5" fill={color} opacity="0.4" />
      {/* Columns */}
      <rect x="16" y="16" width="2" height="6" rx="0.5" fill={color} opacity="0.6" />
      <rect x="30" y="16" width="2" height="6" rx="0.5" fill={color} opacity="0.6" />
      {/* Roof */}
      <path d="M 10 20 L 24 12 L 38 20" stroke={color} strokeWidth="2" fill="none" opacity="0.8" />
    </svg>
  );
};

export const WachstumHexIcon = ({ size = 48, theme = "dark" }: { size?: number; theme?: "dark" | "light" }) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  const uniqueId = `wachs-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={`${uniqueId}-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="1" />
          <stop offset="100%" stopColor={color} stopOpacity="0.6" />
        </linearGradient>
        <filter id={`${uniqueId}-glow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feOffset in="blur" dx="0" dy="0" result="offsetBlur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {/* Growth Chart */}
      <rect x="12" y="28" width="24" height="12" rx="1" fill="none" stroke={color} strokeWidth="1.5" opacity="0.4" />
      {/* Bars */}
      <rect x="14" y="36" width="4" height="4" rx="0.5" fill={`url(#${uniqueId}-grad)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="20" y="32" width="4" height="8" rx="0.5" fill={`url(#${uniqueId}-grad)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="26" y="28" width="4" height="12" rx="0.5" fill={`url(#${uniqueId}-grad)`} filter={`url(#${uniqueId}-glow)`} />
      <rect x="32" y="24" width="4" height="16" rx="0.5" fill={`url(#${uniqueId}-grad)`} filter={`url(#${uniqueId}-glow)`} />
      {/* Trend Arrow */}
      <path d="M 14 36 L 36 24" stroke={color} strokeWidth="2" fill="none" opacity="0.8" />
      <path d="M 32 22 L 36 24 L 34 26" fill={color} opacity="0.8" />
    </svg>
  );
};

