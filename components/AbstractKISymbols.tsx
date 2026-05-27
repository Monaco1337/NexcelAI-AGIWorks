"use client";

import { motion } from "framer-motion";

interface AbstractSymbolProps {
  size?: number;
  theme?: "dark" | "light";
}

export const SpeditionKICore = ({ size = 120, theme = "dark" }: AbstractSymbolProps) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="20" fill={color} opacity="0.3" />
      {[0, 1, 2, 3].map((i) => {
        const angle = (i * 90 - 45) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * 50;
        const y = 100 + Math.sin(angle) * 50;
        return (
          <g key={i}>
            <rect x={x - 6} y={y - 6} width="12" height="12" fill={color} opacity="0.5" />
            <line x1="100" y1="100" x2={x} y2={y} stroke={color} strokeWidth="1" opacity="0.2" />
          </g>
        );
      })}
    </svg>
  );
};

export const DienstleisterKICore = ({ size = 120, theme = "dark" }: AbstractSymbolProps) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="24" fill={color} opacity="0.3" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * 55;
        const y = 100 + Math.sin(angle) * 55;
        return (
          <g key={i}>
            <rect x={x - 5} y={y - 5} width="10" height="10" fill={color} opacity="0.5" />
            <line x1="100" y1="100" x2={x} y2={y} stroke={color} strokeWidth="1" opacity="0.2" />
          </g>
        );
      })}
    </svg>
  );
};

export const ProduktionKICore = ({ size = 120, theme = "dark" }: AbstractSymbolProps) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <rect x="80" y="80" width="40" height="40" fill={color} opacity="0.3" />
      {[0, 1, 2].map((i) => {
        const x = 50 + i * 50;
        return (
          <g key={i}>
            <rect x={x - 10} y="160" width="20" height="12" fill={color} opacity="0.5" />
            <line x1="100" y1="120" x2={x} y2="160" stroke={color} strokeWidth="1" opacity="0.2" />
          </g>
        );
      })}
    </svg>
  );
};

export const StudioKICore = ({ size = 120, theme = "dark" }: AbstractSymbolProps) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      {[0, 1, 2, 3].map((i) => {
        const x = 40 + i * 40;
        return (
          <g key={i}>
            <rect x={x - 18} y="85" width="36" height="36" fill={color} opacity="0.4" />
            {i < 3 && <line x1={x + 18} y1="103" x2={x + 58} y2="103" stroke={color} strokeWidth="1" opacity="0.2" />}
          </g>
        );
      })}
    </svg>
  );
};

export const VerwaltungKICore = ({ size = 120, theme = "dark" }: AbstractSymbolProps) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <rect x="80" y="80" width="40" height="40" fill={color} opacity="0.3" />
      {[
        { x: 50, y: 90 },
        { x: 50, y: 130 },
        { x: 150, y: 90 },
        { x: 150, y: 130 },
      ].map((node, i) => (
        <g key={i}>
          <rect x={node.x - 7} y={node.y - 7} width="14" height="14" fill={color} opacity="0.5" />
          <line x1="100" y1="100" x2={node.x} y2={node.y} stroke={color} strokeWidth="1" opacity="0.2" />
        </g>
      ))}
    </svg>
  );
};

export const WachstumKICore = ({ size = 120, theme = "dark" }: AbstractSymbolProps) => {
  const color = theme === "dark" ? "#00E1FF" : "#7C3AED";
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" fill="none">
      <circle cx="100" cy="100" r="28" fill={color} opacity="0.3" />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const angle = (i * 60 - 90) * (Math.PI / 180);
        const x = 100 + Math.cos(angle) * 55;
        const y = 100 + Math.sin(angle) * 55;
        return (
          <g key={i}>
            <rect x={x - 6} y={y - 6} width="12" height="12" fill={color} opacity="0.5" />
            <line x1="100" y1="100" x2={x} y2={y} stroke={color} strokeWidth="1" opacity="0.2" />
          </g>
        );
      })}
    </svg>
  );
};
