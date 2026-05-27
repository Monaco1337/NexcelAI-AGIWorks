"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

interface Point {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  opacity: number;
  connections: number[];
}

interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  color: string;
  pulsePhase: number;
}

export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile
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

    // Layer 2: Neural Mesh Points
    const points: Point[] = [];
    const pointCount = isMobile ? 30 : 50;
    const connectionDistance = isMobile ? 120 : 150;

    for (let i = 0; i < pointCount; i++) {
      points.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.08,
        vy: (Math.random() - 0.5) * 0.08,
        radius: Math.random() * 1 + 0.5,
        opacity: Math.random() * 0.15 + 0.08,
        connections: [],
      });
    }

    // Layer 3: Energy Sparks
    const sparks: Spark[] = [];
    const sparkCount = isMobile ? 8 : 15;
    const colors = ["#00E1FF", "#A9B8FF"];

    for (let i = 0; i < sparkCount; i++) {
      sparks.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        size: Math.random() * 1.2 + 0.5,
        opacity: Math.random() * 0.3 + 0.15,
        color: colors[Math.floor(Math.random() * colors.length)],
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    let animationFrame: number;
    let time = 0;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.005; // Slower time progression for more elegant movement

      // Update Neural Mesh Points (Layer 2) - Elegant continuous flow
      points.forEach((point, index) => {
        // Smooth, organic movement using sine/cosine waves
        const baseX = (index * 137.5) % canvas.width; // Golden angle distribution
        const baseY = (index * 97.3) % canvas.height;
        
        // Very slow, elegant drift (120-180s loop)
        point.x = baseX + Math.sin(time * 0.003 + index * 0.1) * (canvas.width * 0.15);
        point.y = baseY + Math.cos(time * 0.004 + index * 0.1) * (canvas.height * 0.15);
        
        // Wrap around edges smoothly
        if (point.x < 0) point.x += canvas.width;
        if (point.x > canvas.width) point.x -= canvas.width;
        if (point.y < 0) point.y += canvas.height;
        if (point.y > canvas.height) point.y -= canvas.height;
      });

      // Draw Neural Connections (Layer 2) - Elegant curved lines
      ctx.lineWidth = 0.4;
      for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
          const dx = points[i].x - points[j].x;
          const dy = points[i].y - points[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionDistance) {
            const opacity = (1 - distance / connectionDistance) * 0.12;
            const gradient = ctx.createLinearGradient(
              points[i].x,
              points[i].y,
              points[j].x,
              points[j].y
            );
            gradient.addColorStop(0, `rgba(0, 225, 255, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(169, 184, 255, ${opacity * 0.7})`);
            gradient.addColorStop(1, `rgba(0, 225, 255, ${opacity})`);
            
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(points[i].x, points[i].y);
            ctx.lineTo(points[j].x, points[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw Neural Nodes (Layer 2) - Ultra subtle, elegant glow
      points.forEach((point, index) => {
        // Very slow, gentle pulse (30-40s cycle)
        const pulse = Math.sin(time * 0.05 + index * 0.2) * 0.05 + 1;
        const nodeOpacity = point.opacity * pulse;

        // Outer glow - more refined
        const gradient = ctx.createRadialGradient(
          point.x,
          point.y,
          0,
          point.x,
          point.y,
          point.radius * 5
        );
        gradient.addColorStop(0, `rgba(0, 225, 255, ${nodeOpacity * 0.25})`);
        gradient.addColorStop(0.3, `rgba(169, 184, 255, ${nodeOpacity * 0.12})`);
        gradient.addColorStop(0.6, `rgba(0, 225, 255, ${nodeOpacity * 0.05})`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius * 5, 0, Math.PI * 2);
        ctx.fill();

        // Core dot - subtle
        ctx.fillStyle = `rgba(0, 225, 255, ${nodeOpacity * 0.5})`;
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.radius * 0.8, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update and Draw Energy Sparks (Layer 3) - Elegant floating
      sparks.forEach((spark, index) => {
        // Smooth, organic movement using sine waves
        const baseX = (index * 73.7) % canvas.width;
        const baseY = (index * 113.1) % canvas.height;
        
        // Very slow, elegant drift
        spark.x = baseX + Math.sin(time * 0.002 + index * 0.15) * (canvas.width * 0.2);
        spark.y = baseY + Math.cos(time * 0.003 + index * 0.15) * (canvas.height * 0.2);
        
        // Wrap around edges smoothly
        if (spark.x < 0) spark.x += canvas.width;
        if (spark.x > canvas.width) spark.x -= canvas.width;
        if (spark.y < 0) spark.y += canvas.height;
        if (spark.y > canvas.height) spark.y -= canvas.height;

        // Slow, gentle pulse (8-10s cycle)
        spark.pulsePhase += 0.02;
        const pulseOpacity = spark.opacity * (0.8 + Math.sin(spark.pulsePhase) * 0.2);

        // Draw spark with glow
        const sparkGradient = ctx.createRadialGradient(
          spark.x,
          spark.y,
          0,
          spark.x,
          spark.y,
          spark.size * 3
        );
        sparkGradient.addColorStop(0, `${spark.color}${Math.floor(pulseOpacity * 255).toString(16).padStart(2, '0')}`);
        sparkGradient.addColorStop(0.5, `${spark.color}${Math.floor(pulseOpacity * 0.5 * 255).toString(16).padStart(2, '0')}`);
        sparkGradient.addColorStop(1, "transparent");

        ctx.fillStyle = sparkGradient;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core spark
        ctx.fillStyle = spark.color;
        ctx.globalAlpha = pulseOpacity;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("resize", checkMobile);
      cancelAnimationFrame(animationFrame);
    };
  }, [isMobile]);

  return (
    <div className="neural-background">
      {/* Layer 1: Base Glow (CSS) - Ultra subtle, elegant */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(169, 184, 255, 0.5), transparent 70%)",
            opacity: 0.03,
          }}
          animate={{
            opacity: [0.025, 0.035, 0.025],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{
            background: "radial-gradient(circle, rgba(0, 225, 255, 0.5), transparent 70%)",
            opacity: 0.025,
          }}
          animate={{
            opacity: [0.02, 0.03, 0.02],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[700px] h-[700px] rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"
          style={{
            background: "radial-gradient(circle, rgba(169, 184, 255, 0.3), transparent 70%)",
            opacity: 0.015,
          }}
          animate={{
            opacity: [0.01, 0.02, 0.01],
            scale: [1, 1.08, 1],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Layer 2 & 3: Neural Mesh + Energy Sparks (Canvas) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ imageRendering: "auto" }}
      />
    </div>
  );
}
