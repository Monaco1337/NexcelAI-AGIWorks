"use client";

import { motion } from "framer-motion";

// NEXCEL CORE - Orchestrator: Input-Blöcke → Orchestrator → Output-Blöcke mit fließenden Linien
export function CoreVisual() {
  const uniqueId = `core-flow-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Clean Line Gradient */}
        <linearGradient id={`${uniqueId}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0, 225, 255, 0.8)" stopOpacity="0.8" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.6)" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Input Blocks (Left Side) - 5 Blocks */}
      {[
        { x: 90, y: 110 },
        { x: 90, y: 160 },
        { x: 90, y: 210 },
        { x: 90, y: 260 },
        { x: 90, y: 310 },
      ].map((block, i) => (
        <g key={`input-${i}`}>
          {/* Input Block */}
          <rect
            x={block.x - 22}
            y={block.y - 18}
            width="44"
            height="36"
            rx="4"
            fill="rgba(0, 225, 255, 0.1)"
            stroke="rgba(0, 225, 255, 0.6)"
            strokeWidth="1.5"
          />
          {/* Block Content Lines */}
          <line x1={block.x - 14} y1={block.y - 8} x2={block.x + 10} y2={block.y - 8} stroke="rgba(0, 225, 255, 0.5)" strokeWidth="1" />
          <line x1={block.x - 14} y1={block.y} x2={block.x + 8} y2={block.y} stroke="rgba(0, 225, 255, 0.4)" strokeWidth="1" />
          <line x1={block.x - 14} y1={block.y + 8} x2={block.x + 6} y2={block.y + 8} stroke="rgba(0, 225, 255, 0.4)" strokeWidth="1" />
          
          {/* Flowing Line to Orchestrator */}
          <line
            x1={block.x + 22}
            y1={block.y}
            x2={200}
            y2={210}
            stroke={`url(#${uniqueId}-line)`}
            strokeWidth="1.5"
            opacity="0.6"
            strokeDasharray="4 3"
          >
            <animate
              attributeName="stroke-dashoffset"
              values={`${8 + i * 2};0;${8 + i * 2}`}
              dur={`${3 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </line>
          
          {/* Flow Dot */}
          <circle r="2" fill="rgba(0, 225, 255, 0.8)" opacity="0.8">
            <animateMotion dur={`${3 + i * 0.3}s`} repeatCount="indefinite">
              <mpath href={`#${uniqueId}-input-path-${i}`} xmlnsXlink="http://www.w3.org/1999/xlink" />
            </animateMotion>
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur={`${3 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
          <path
            id={`${uniqueId}-input-path-${i}`}
            d={`M ${block.x + 22} ${block.y} L 200 210`}
            fill="none"
            stroke="none"
          />
        </g>
      ))}

      {/* Central Orchestrator Node */}
      <g transform="translate(250, 210)">
        {/* Outer Ring - Subtle Pulse */}
        <circle
          cx="0"
          cy="0"
          r="45"
          fill="none"
          stroke="rgba(168, 85, 247, 0.3)"
          strokeWidth="1.5"
        >
          <animate attributeName="r" values="45;47;45" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        
        {/* Main Node */}
        <circle
          cx="0"
          cy="0"
          r="35"
          fill="rgba(168, 85, 247, 0.15)"
          stroke="rgba(168, 85, 247, 0.8)"
          strokeWidth="2"
        />
        
        {/* Inner Pattern */}
        <circle cx="0" cy="0" r="20" fill="none" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="1" />
        <circle cx="0" cy="0" r="12" fill="rgba(168, 85, 247, 0.4)" />
        <circle cx="0" cy="0" r="6" fill="rgba(255, 255, 255, 0.8)" />
      </g>

      {/* Output Blocks (Right Side) - 5 Blocks */}
      {[
        { x: 410, y: 110 },
        { x: 410, y: 160 },
        { x: 410, y: 210 },
        { x: 410, y: 260 },
        { x: 410, y: 310 },
      ].map((block, i) => (
        <g key={`output-${i}`}>
          {/* Flowing Line from Orchestrator */}
          <line
            x1={300}
            y1={210}
            x2={block.x - 22}
            y2={block.y}
            stroke={`url(#${uniqueId}-line)`}
            strokeWidth="1.5"
            opacity="0.6"
            strokeDasharray="4 3"
          >
            <animate
              attributeName="stroke-dashoffset"
              values={`${8 + i * 2};0;${8 + i * 2}`}
              dur={`${3.2 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </line>
          
          {/* Flow Dot */}
          <circle r="2" fill="rgba(168, 85, 247, 0.8)" opacity="0.8">
            <animateMotion dur={`${3.2 + i * 0.3}s`} repeatCount="indefinite">
              <mpath href={`#${uniqueId}-output-path-${i}`} xmlnsXlink="http://www.w3.org/1999/xlink" />
            </animateMotion>
            <animate attributeName="opacity" values="0.8;0.2;0.8" dur={`${3.2 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
          <path
            id={`${uniqueId}-output-path-${i}`}
            d={`M 300 210 L ${block.x - 22} ${block.y}`}
            fill="none"
            stroke="none"
          />
          
          {/* Output Block */}
          <rect
            x={block.x - 22}
            y={block.y - 18}
            width="44"
            height="36"
            rx="4"
            fill="rgba(168, 85, 247, 0.1)"
            stroke="rgba(168, 85, 247, 0.6)"
            strokeWidth="1.5"
          />
          {/* Block Content Lines */}
          <line x1={block.x - 14} y1={block.y - 8} x2={block.x + 10} y2={block.y - 8} stroke="rgba(168, 85, 247, 0.5)" strokeWidth="1" />
          <line x1={block.x - 14} y1={block.y} x2={block.x + 8} y2={block.y} stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1" />
          <line x1={block.x - 14} y1={block.y + 8} x2={block.x + 6} y2={block.y + 8} stroke="rgba(168, 85, 247, 0.4)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

// NEXCEL CRM - Daten-Hub: Hexagon Hub mit 6 Modulen und pulsierendem Hub + Daten-Punkte
export function CrmVisual() {
  const uniqueId = `crm-pulse-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Clean Line Gradient */}
        <linearGradient id={`${uniqueId}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0, 225, 255, 0.7)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.5)" stopOpacity="0.5" />
        </linearGradient>
      </defs>

      {/* Central Data Hub - Hexagon */}
      <g transform="translate(250, 200)">
        {/* Outer Pulse Ring - Very Slow */}
        <circle
          cx="0"
          cy="0"
          r="55"
          fill="none"
          stroke="rgba(0, 225, 255, 0.2)"
          strokeWidth="1.5"
        >
          <animate attributeName="r" values="55;60;55" dur="6s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.2;0.4;0.2" dur="6s" repeatCount="indefinite" />
        </circle>
        
        {/* Main Hub - Hexagon */}
        <polygon
          points="-40,-35 40,-35 55,0 40,35 -40,35 -55,0"
          fill="rgba(0, 225, 255, 0.12)"
          stroke="rgba(0, 225, 255, 0.8)"
          strokeWidth="2"
        >
          <animate attributeName="opacity" values="1;0.95;1" dur="5s" repeatCount="indefinite" />
        </polygon>
        
        {/* Hub Inner Pattern */}
        <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
        <circle cx="0" cy="0" r="18" fill="rgba(0, 225, 255, 0.3)" />
        <circle cx="0" cy="0" r="10" fill="rgba(255, 255, 255, 0.6)" />
      </g>

      {/* Module Blocks (6 Modules) */}
      {[
        { x: 120, y: 100, label: "Kunden" },
        { x: 380, y: 100, label: "Aufträge" },
        { x: 380, y: 200, label: "Fahrer" },
        { x: 380, y: 300, label: "Termine" },
        { x: 120, y: 300, label: "Rechnungen" },
        { x: 120, y: 200, label: "Support" },
      ].map((module, i) => (
        <g key={`module-${i}`}>
          {/* Connection Line to Hub */}
          <line
            x1={module.x}
            y1={module.y}
            x2={250}
            y2={200}
            stroke={`url(#${uniqueId}-line)`}
            strokeWidth="1.5"
            opacity="0.5"
            strokeDasharray="3 2"
          />
          
          {/* Data Point Moving to Hub */}
          <circle r="2.5" fill="rgba(0, 225, 255, 0.7)" opacity="0.7">
            <animateMotion dur={`${4 + i * 0.5}s`} repeatCount="indefinite">
              <mpath href={`#${uniqueId}-module-path-${i}`} xmlnsXlink="http://www.w3.org/1999/xlink" />
            </animateMotion>
            <animate attributeName="opacity" values="0.7;0.2;0.7" dur={`${4 + i * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="r" values="2.5;3.5;2.5" dur={`${4 + i * 0.5}s`} repeatCount="indefinite" />
          </circle>
          <path
            id={`${uniqueId}-module-path-${i}`}
            d={`M ${module.x} ${module.y} L 250 200`}
            fill="none"
            stroke="none"
          />
          
          {/* Module Block */}
          <rect
            x={module.x - 30}
            y={module.y - 22}
            width="60"
            height="44"
            rx="6"
            fill="rgba(0, 225, 255, 0.08)"
            stroke="rgba(0, 225, 255, 0.6)"
            strokeWidth="1.5"
          />
          
          {/* Module Content Lines */}
          <line x1={module.x - 18} y1={module.y - 10} x2={module.x + 15} y2={module.y - 10} stroke="rgba(0, 225, 255, 0.5)" strokeWidth="1" />
          <line x1={module.x - 18} y1={module.y} x2={module.x + 12} y2={module.y} stroke="rgba(0, 225, 255, 0.4)" strokeWidth="1" />
          <line x1={module.x - 18} y1={module.y + 10} x2={module.x + 10} y2={module.y + 10} stroke="rgba(0, 225, 255, 0.4)" strokeWidth="1" />
        </g>
      ))}
    </svg>
  );
}

// NEXCEL AGENT - Autonomer Assistent: Symbole links, Agent-Node Mitte, Ergebnisse rechts mit dynamischen Pfeilen
export function AgentVisual() {
  const uniqueId = `agent-dynamic-${Math.random().toString(36).substr(2, 9)}`;
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 500 500"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Clean Line Gradients */}
        <linearGradient id={`${uniqueId}-input-line`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(0, 225, 255, 0.7)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="rgba(0, 225, 255, 0.4)" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient id={`${uniqueId}-output-line`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(168, 85, 247, 0.7)" stopOpacity="0.7" />
          <stop offset="100%" stopColor="rgba(168, 85, 247, 0.4)" stopOpacity="0.4" />
        </linearGradient>
      </defs>

      {/* Central Agent Node */}
      <g transform="translate(250, 200)">
        {/* Outer Ring - Subtle Pulse */}
        <circle
          cx="0"
          cy="0"
          r="50"
          fill="none"
          stroke="rgba(168, 85, 247, 0.3)"
          strokeWidth="1.5"
        >
          <animate attributeName="r" values="50;52;50" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0.5;0.3" dur="4s" repeatCount="indefinite" />
        </circle>
        
        {/* Main Agent Node */}
        <rect
          x="-35"
          y="-35"
          width="70"
          height="70"
          rx="10"
          fill="rgba(168, 85, 247, 0.12)"
          stroke="rgba(168, 85, 247, 0.8)"
          strokeWidth="2"
        />
        
        {/* Agent Inner Pattern */}
        <circle cx="0" cy="0" r="22" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="1" />
        <circle cx="0" cy="0" r="14" fill="rgba(168, 85, 247, 0.3)" />
        <circle cx="0" cy="0" r="7" fill="rgba(255, 255, 255, 0.6)" />
      </g>

      {/* Incoming Tasks (Left Side) */}
      {[
        { x: 100, y: 120, type: "message" },
        { x: 100, y: 200, type: "ticket" },
        { x: 100, y: 280, type: "call" },
      ].map((task, i) => (
        <g key={`input-${i}`}>
          {/* Dynamic Arrow Line to Agent */}
          <line
            x1={task.x + 25}
            y1={task.y}
            x2={215}
            y2={200}
            stroke={`url(#${uniqueId}-input-line)`}
            strokeWidth="1.5"
            opacity="0.6"
            strokeDasharray="4 3"
          >
            <animate
              attributeName="stroke-dashoffset"
              values={`${8 + i * 2};0;${8 + i * 2}`}
              dur={`${2.5 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </line>
          
          {/* Moving Arrow Head */}
          <polygon
            points="210,197 215,200 210,203"
            fill={`url(#${uniqueId}-input-line)`}
            opacity="0.6"
          >
            <animateMotion dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite">
              <mpath href={`#${uniqueId}-input-path-${i}`} xmlnsXlink="http://www.w3.org/1999/xlink" />
            </animateMotion>
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur={`${2.5 + i * 0.3}s`} repeatCount="indefinite" />
          </polygon>
          <path
            id={`${uniqueId}-input-path-${i}`}
            d={`M ${task.x + 25} ${task.y} L 215 200`}
            fill="none"
            stroke="none"
          />
          
          {/* Task Icon Container */}
          <rect
            x={task.x - 20}
            y={task.y - 18}
            width="40"
            height="36"
            rx="5"
            fill="rgba(0, 225, 255, 0.1)"
            stroke="rgba(0, 225, 255, 0.6)"
            strokeWidth="1.5"
          />
          
          {/* Task Icon Symbol */}
          {task.type === "message" && (
            <g>
              <rect x={task.x - 10} y={task.y - 8} width="20" height="16" rx="2" fill="none" stroke="rgba(0, 225, 255, 0.7)" strokeWidth="1.5" />
              <line x1={task.x - 6} y1={task.y - 2} x2={task.x + 6} y2={task.y - 2} stroke="rgba(0, 225, 255, 0.7)" strokeWidth="1" />
            </g>
          )}
          {task.type === "ticket" && (
            <g>
              <rect x={task.x - 8} y={task.y - 6} width="16" height="12" rx="2" fill="none" stroke="rgba(0, 225, 255, 0.7)" strokeWidth="1.5" />
              <line x1={task.x - 6} y1={task.y - 1} x2={task.x + 4} y2={task.y - 1} stroke="rgba(0, 225, 255, 0.7)" strokeWidth="1" />
              <line x1={task.x - 6} y1={task.y + 2} x2={task.x + 3} y2={task.y + 2} stroke="rgba(0, 225, 255, 0.7)" strokeWidth="1" />
            </g>
          )}
          {task.type === "call" && (
            <g>
              <path
                d={`M ${task.x - 8} ${task.y - 4} L ${task.x} ${task.y - 8} L ${task.x + 8} ${task.y - 4} L ${task.x} ${task.y + 4} Z`}
                fill="none"
                stroke="rgba(0, 225, 255, 0.7)"
                strokeWidth="1.5"
              />
            </g>
          )}
        </g>
      ))}

      {/* Outgoing Results (Right Side) */}
      {[
        { x: 400, y: 120, type: "check" },
        { x: 400, y: 200, type: "calendar" },
        { x: 400, y: 280, type: "status" },
      ].map((result, i) => (
        <g key={`output-${i}`}>
          {/* Dynamic Arrow Line from Agent */}
          <line
            x1={285}
            y1={200}
            x2={result.x - 25}
            y2={result.y}
            stroke={`url(#${uniqueId}-output-line)`}
            strokeWidth="1.5"
            opacity="0.6"
            strokeDasharray="4 3"
          >
            <animate
              attributeName="stroke-dashoffset"
              values={`${8 + i * 2};0;${8 + i * 2}`}
              dur={`${2.7 + i * 0.3}s`}
              repeatCount="indefinite"
            />
          </line>
          
          {/* Moving Arrow Head */}
          <polygon
            points="380,197 375,200 380,203"
            fill={`url(#${uniqueId}-output-line)`}
            opacity="0.6"
          >
            <animateMotion dur={`${2.7 + i * 0.3}s`} repeatCount="indefinite">
              <mpath href={`#${uniqueId}-output-path-${i}`} xmlnsXlink="http://www.w3.org/1999/xlink" />
            </animateMotion>
            <animate attributeName="opacity" values="0.6;0.9;0.6" dur={`${2.7 + i * 0.3}s`} repeatCount="indefinite" />
          </polygon>
          <path
            id={`${uniqueId}-output-path-${i}`}
            d={`M 285 200 L ${result.x - 25} ${result.y}`}
            fill="none"
            stroke="none"
          />
          
          {/* Result Icon Container */}
          <rect
            x={result.x - 20}
            y={result.y - 18}
            width="40"
            height="36"
            rx="5"
            fill="rgba(168, 85, 247, 0.1)"
            stroke="rgba(168, 85, 247, 0.6)"
            strokeWidth="1.5"
          />
          
          {/* Result Icon Symbol */}
          {result.type === "check" && (
            <g>
              <circle cx={result.x} cy={result.y} r="10" fill="none" stroke="rgba(168, 85, 247, 0.7)" strokeWidth="1.5" />
              <path d={`M ${result.x - 5} ${result.y} L ${result.x - 1} ${result.y + 4} L ${result.x + 5} ${result.y - 2}`} stroke="rgba(168, 85, 247, 0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </g>
          )}
          {result.type === "calendar" && (
            <g>
              <rect x={result.x - 10} y={result.y - 6} width="20" height="18" rx="2" fill="none" stroke="rgba(168, 85, 247, 0.7)" strokeWidth="1.5" />
              <line x1={result.x - 10} y1={result.y - 2} x2={result.x + 10} y2={result.y - 2} stroke="rgba(168, 85, 247, 0.7)" strokeWidth="1.5" />
              <line x1={result.x} y1={result.y - 6} x2={result.x} y2={result.y + 12} stroke="rgba(168, 85, 247, 0.7)" strokeWidth="1" />
            </g>
          )}
          {result.type === "status" && (
            <g>
              <circle cx={result.x} cy={result.y} r="10" fill="rgba(168, 85, 247, 0.3)" stroke="rgba(168, 85, 247, 0.7)" strokeWidth="1.5" />
              <circle cx={result.x} cy={result.y} r="5" fill="rgba(168, 85, 247, 0.7)" />
            </g>
          )}
        </g>
      ))}
    </svg>
  );
}
