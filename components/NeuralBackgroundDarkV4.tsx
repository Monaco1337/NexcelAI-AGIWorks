"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface GlowPoint {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  pulsePhase: number;
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

export default function NeuralBackgroundDarkV4() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);

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

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Layer 2: Holographic AI Glow Points (3-5 points)
    const glowPoints: GlowPoint[] = [];
    const glowCount = isMobile ? 2 : 4;

    for (let i = 0; i < glowCount; i++) {
      glowPoints.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 30 + 10,
        opacity: Math.random() * 0.02 + 0.03,
        vx: (Math.random() - 0.5) * 0.03,
        vy: (Math.random() - 0.5) * 0.03,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Layer 3: Dynamic Particle Flow (20-30 particles)
    const particles: Particle[] = [];
    const particleCount = isMobile ? 10 : 25;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.03 + 0.03,
        life: Math.random(),
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005;

      // Low-Parallax Offset (1-2%)
      const parallaxX = (mousePos.x - canvas.width / 2) * 0.01;
      const parallaxY = (mousePos.y - canvas.height / 2) * 0.01;

      // Layer 1: Neural Motion Lines (soft, flowing waves)
      ctx.strokeStyle = "rgba(168, 239, 255, 0.1)";
      ctx.lineWidth = 0.3;
      ctx.shadowBlur = 2;
      ctx.shadowColor = "rgba(168, 239, 255, 0.1)";

      // Draw flowing neural waves
      for (let i = 0; i < 3; i++) {
        const waveY = (canvas.height / 4) * (i + 1) + Math.sin(time * 0.002 + i * Math.PI) * 40;
        const waveAmplitude = 30 + Math.sin(time * 0.003 + i) * 10;

        ctx.beginPath();
        ctx.moveTo(0, waveY);
        
        for (let x = 0; x < canvas.width; x += 2) {
          const y = waveY + Math.sin((x * 0.01) + (time * 0.003) + i) * waveAmplitude;
          ctx.lineTo(x + parallaxX * 0.3, y + parallaxY * 0.3);
        }
        
        ctx.stroke();
      }

      // Vertical flowing lines
      for (let i = 0; i < 2; i++) {
        const waveX = (canvas.width / 3) * (i + 1) + Math.cos(time * 0.002 + i * Math.PI) * 30;
        const waveAmplitude = 20 + Math.cos(time * 0.003 + i) * 8;

        ctx.beginPath();
        ctx.moveTo(waveX, 0);
        
        for (let y = 0; y < canvas.height; y += 2) {
          const x = waveX + Math.cos((y * 0.01) + (time * 0.003) + i) * waveAmplitude;
          ctx.lineTo(x + parallaxX * 0.3, y + parallaxY * 0.3);
        }
        
        ctx.stroke();
      }

      ctx.shadowBlur = 0;

      // Layer 2: Holographic AI Glow Points
      glowPoints.forEach((glow, index) => {
        // Slow, elegant movement
        glow.x += glow.vx;
        glow.y += glow.vy;

        // Wrap around edges
        if (glow.x < 0) glow.x = canvas.width;
        if (glow.x > canvas.width) glow.x = 0;
        if (glow.y < 0) glow.y = canvas.height;
        if (glow.y > canvas.height) glow.y = 0;

        // Very slow pulse (40-60s cycle)
        glow.pulsePhase += 0.01;
        const pulse = Math.sin(glow.pulsePhase * 0.05) * 0.1 + 1;
        const currentOpacity = glow.opacity * pulse;

        // Apply parallax
        const displayX = glow.x + parallaxX;
        const displayY = glow.y + parallaxY;

        // Cyan to white gradient
        const gradient = ctx.createRadialGradient(
          displayX,
          displayY,
          0,
          displayX,
          displayY,
          glow.size
        );
        gradient.addColorStop(0, `rgba(168, 239, 255, ${currentOpacity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${currentOpacity * 0.5})`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(displayX, displayY, glow.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Layer 3: Dynamic Particle Flow
      particles.forEach((particle) => {
        // Smooth, flowing movement
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Life cycle for gentle fade
        particle.life += 0.002;
        if (particle.life > 1) particle.life = 0;

        // Apply parallax
        const displayX = particle.x + parallaxX * 0.5;
        const displayY = particle.y + parallaxY * 0.5;

        // Draw particle with soft glow
        ctx.fillStyle = `rgba(78, 228, 255, ${particle.opacity * (0.7 + Math.sin(particle.life * Math.PI * 2) * 0.3)})`;
        ctx.beginPath();
        ctx.arc(displayX, displayY, particle.size, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", checkMobile);
      cancelAnimationFrame(animationFrame);
    };
  }, [mousePos, isMobile]);

  return (
    <div className="neural-background-dark">
      {/* Base Gradient Background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #0A0C0F 0%, #0B0E11 50%, #111418 100%)",
        }}
      />

      {/* Layer 1: Neural Motion (Canvas) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "auto" }}
      />

      {/* Layer 5: Edge Light Shadow (Top) */}
      <div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(168, 239, 255, 0.03) 0%, transparent 100%)",
        }}
      />

      {/* Subtle Gaussian Blur Overlay for Depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backdropFilter: "blur(1px)",
          WebkitBackdropFilter: "blur(1px)",
        }}
      />
    </div>
  );
}

