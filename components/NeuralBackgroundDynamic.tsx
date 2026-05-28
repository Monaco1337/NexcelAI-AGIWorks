"use client";

import { useEffect, useRef, useState } from "react";

interface GlowNode {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  opacity: number;
  pulsePhase: number;
  driftX: number;
  driftY: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  life: number;
}

// Simple noise function for organic movement
function noise(x: number, y: number, time: number): number {
  return (
    Math.sin(x * 0.01 + time * 0.02) * 0.5 +
    Math.cos(y * 0.01 + time * 0.03) * 0.3 +
    Math.sin((x + y) * 0.005 + time * 0.01) * 0.2
  );
}

export default function NeuralBackgroundDynamic() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const animationFrameRef = useRef<number>();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    // Enable GPU acceleration hints
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Layer 2: Holographic Glow Nodes (3-5 nodes)
    const glowNodes: GlowNode[] = [];
    const nodeCount = isMobile ? 3 : 5;

    for (let i = 0; i < nodeCount; i++) {
      glowNodes.push({
        x: (canvas.width / (nodeCount + 1)) * (i + 1),
        y: (canvas.height / (nodeCount + 1)) * (i + 1),
        baseX: (canvas.width / (nodeCount + 1)) * (i + 1),
        baseY: (canvas.height / (nodeCount + 1)) * (i + 1),
        size: Math.random() * 20 + 20,
        opacity: Math.random() * 0.03 + 0.07,
        pulsePhase: Math.random() * Math.PI * 2,
        driftX: (Math.random() - 0.5) * 0.02,
        driftY: (Math.random() - 0.5) * 0.02,
      });
    }

    // Layer 3: Particle Stream (20-30 particles)
    const particles: Particle[] = [];
    const particleCount = isMobile ? 15 : 25;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.08 + 0.03,
        vy: (Math.random() - 0.5) * 0.08 + 0.03,
        size: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.03 + 0.03,
        life: Math.random(),
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    let time = 0;

    const animate = () => {
      if (!ctx) return;
      
      // Clear with base gradient
      ctx.fillStyle = "#0B0E11";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle gradient overlay
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#0F1216");
      gradient.addColorStop(0.5, "#0B0E11");
      gradient.addColorStop(1, "#111418");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      time += 0.005;

      // Parallax offset (1-2%)
      const parallaxX = isMobile ? 0 : (mousePos.x - canvas.width / 2) * 0.01;
      const parallaxY = isMobile ? 0 : (mousePos.y - canvas.height / 2) * 0.01;

      // Layer 1: Neural Lines Animation (flowing like electrical currents)
      ctx.strokeStyle = "rgba(127, 232, 255, 0.08)";
      ctx.lineWidth = 0.4;
      ctx.shadowBlur = 3;
      ctx.shadowColor = "rgba(127, 232, 255, 0.1)";

      // Horizontal flowing lines (like thought patterns)
      for (let i = 0; i < 4; i++) {
        const baseY = (canvas.height / 5) * (i + 1);
        ctx.beginPath();
        
        let firstPoint = true;
        for (let x = 0; x < canvas.width; x += 3) {
          const noiseValue = noise(x, baseY, time);
          const y = baseY + noiseValue * 60 + Math.sin(x * 0.01 + time * 0.03 + i) * 30;
          
          if (firstPoint) {
            ctx.moveTo(x + parallaxX * 0.2, y + parallaxY * 0.2);
            firstPoint = false;
          } else {
            ctx.lineTo(x + parallaxX * 0.2, y + parallaxY * 0.2);
          }
        }
        
        ctx.stroke();
      }

      // Vertical flowing lines
      for (let i = 0; i < 3; i++) {
        const baseX = (canvas.width / 4) * (i + 1);
        ctx.beginPath();
        
        let firstPoint = true;
        for (let y = 0; y < canvas.height; y += 3) {
          const noiseValue = noise(baseX, y, time);
          const x = baseX + noiseValue * 50 + Math.cos(y * 0.01 + time * 0.02 + i) * 25;
          
          if (firstPoint) {
            ctx.moveTo(x + parallaxX * 0.2, y + parallaxY * 0.2);
            firstPoint = false;
          } else {
            ctx.lineTo(x + parallaxX * 0.2, y + parallaxY * 0.2);
          }
        }
        
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Layer 2: Holographic Glow Nodes
      glowNodes.forEach((node) => {
        // Very slow drift (0.01-0.03)
        node.pulsePhase += 0.008;
        node.x = node.baseX + Math.sin(time * 0.01 + node.pulsePhase) * 40;
        node.y = node.baseY + Math.cos(time * 0.012 + node.pulsePhase) * 40;

        // Very slow pulse (40-80s cycle)
        const pulse = Math.sin(node.pulsePhase * 0.02) * 0.15 + 1;
        const currentOpacity = node.opacity * pulse;
        const currentSize = node.size * pulse;

        // Apply parallax
        const displayX = node.x + parallaxX;
        const displayY = node.y + parallaxY;

        // Cyan to White gradient
        const gradient = ctx.createRadialGradient(
          displayX,
          displayY,
          0,
          displayX,
          displayY,
          currentSize
        );
        gradient.addColorStop(0, `rgba(127, 232, 255, ${currentOpacity})`);
        gradient.addColorStop(0.4, `rgba(255, 255, 255, ${currentOpacity * 0.6})`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(displayX, displayY, currentSize, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 3: Particle Stream (ultra-subtle)
      particles.forEach((particle) => {
        // Organic flow with slight diagonal direction
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges smoothly
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Life cycle for gentle fade
        particle.life += 0.001;
        if (particle.life > 1) particle.life = 0;

        // Apply parallax
        const displayX = particle.x + parallaxX * 0.3;
        const displayY = particle.y + parallaxY * 0.3;

        // Draw particle (no sparkle, just organic flow)
        const lifeOpacity = particle.opacity * (0.7 + Math.sin(particle.life * Math.PI * 2) * 0.3);
        ctx.fillStyle = `rgba(78, 228, 255, ${lifeOpacity})`;
        ctx.beginPath();
        ctx.arc(displayX, displayY, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", checkMobile);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePos, isMobile]);

  return (
    <div className="neural-background-dynamic">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{
          imageRendering: "auto",
          willChange: "transform",
          transform: "translateZ(0)",
        }}
      />
    </div>
  );
}

