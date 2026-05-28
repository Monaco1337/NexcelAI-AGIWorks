// NEXCEL AI - Neural Background Animation
// GPU-optimized, 60 FPS, meditative AI field

(function() {
  'use strict';

  const canvas = document.getElementById('nexcel-bg');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  // Setup canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Configuration
  const isMobile = window.innerWidth < 768;
  const particleCount = isMobile ? 20 : 35;
  const nodeCount = isMobile ? 8 : 15;
  const connectionDistance = isMobile ? 180 : 220;

  // Particle class
  class Particle {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.vx = (Math.random() - 0.5) * 0.15;
      this.vy = (Math.random() - 0.5) * 0.15;
      this.size = Math.random() * 3 + 1;
      this.opacity = Math.random() * 0.02 + 0.03;
      this.pulsePhase = Math.random() * Math.PI * 2;
      this.color = Math.random() > 0.5 ? '#6B2DB8' : '#8B6DB8';
    }

    update(time) {
      // Extremely slow movement (0.01-0.02) - visible but meditative
      this.x += this.vx * 0.8;
      this.y += this.vy * 0.8;
      
      // Add subtle drift based on time
      this.x += Math.sin(time * 0.01 + this.pulsePhase) * 0.2;
      this.y += Math.cos(time * 0.012 + this.pulsePhase) * 0.2;

      // Wrap around edges
      if (this.x < 0) this.x = canvas.width;
      if (this.x > canvas.width) this.x = 0;
      if (this.y < 0) this.y = canvas.height;
      if (this.y > canvas.height) this.y = 0;

      // Gentle pulse
      this.pulsePhase += 0.01;
      const pulse = Math.sin(this.pulsePhase) * 0.1 + 1.0;
      this.currentOpacity = this.opacity * pulse;
    }

    draw(ctx, mouseX, mouseY) {
      // Parallax offset (subtle)
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const parallaxX = (dx / dist) * Math.min(dist, 300) * 0.002;
      const parallaxY = (dy / dist) * Math.min(dist, 300) * 0.002;

      const x = this.x + parallaxX;
      const y = this.y + parallaxY;

      // Soft glow around particle
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.size * 4);
      gradient.addColorStop(0, this.color + Math.floor(this.currentOpacity * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(0.5, this.color + Math.floor(this.currentOpacity * 0.5 * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, this.size * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core particle
      ctx.fillStyle = this.color + Math.floor(this.currentOpacity * 255).toString(16).padStart(2, '0');
      ctx.beginPath();
      ctx.arc(x, y, this.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Node class (connection points)
  class Node {
    constructor() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.baseX = this.x;
      this.baseY = this.y;
      this.vx = (Math.random() - 0.5) * 0.08;
      this.vy = (Math.random() - 0.5) * 0.08;
      this.radius = Math.random() * 1.5 + 0.5;
      this.opacity = Math.random() * 0.03 + 0.05;
      this.pulsePhase = Math.random() * Math.PI * 2;
    }

    update(time) {
      // Very slow drift - visible movement
      this.x = this.baseX + Math.sin(time * 0.015 + this.pulsePhase) * 40;
      this.y = this.baseY + Math.cos(time * 0.018 + this.pulsePhase) * 40;

      // Gentle breathing (scale 0.98-1.02)
      this.pulsePhase += 0.008;
      const pulse = Math.sin(this.pulsePhase * 0.5) * 0.02 + 1.0;
      this.currentRadius = this.radius * pulse;
      this.currentOpacity = this.opacity * pulse;
    }

    draw(ctx, mouseX, mouseY) {
      // Parallax offset
      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const parallaxX = (dx / dist) * Math.min(dist, 400) * 0.001;
      const parallaxY = (dy / dist) * Math.min(dist, 400) * 0.001;

      const x = this.x + parallaxX;
      const y = this.y + parallaxY;

      // Soft glow - Purple
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, this.currentRadius * 6);
      gradient.addColorStop(0, `rgba(107, 45, 184, ${this.currentOpacity})`);
      gradient.addColorStop(0.5, `rgba(139, 109, 184, ${this.currentOpacity * 0.5})`);
      gradient.addColorStop(1, 'transparent');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, this.currentRadius * 6, 0, Math.PI * 2);
      ctx.fill();

      // Core node - Purple
      ctx.fillStyle = `rgba(107, 45, 184, ${this.currentOpacity * 2})`;
      ctx.beginPath();
      ctx.arc(x, y, this.currentRadius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Initialize particles and nodes
  const particles = [];
  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push(new Node());
  }

  // Mouse tracking
  let mouseX = canvas.width / 2;
  let mouseY = canvas.height / 2;

  const handleMouseMove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  };
  window.addEventListener('mousemove', handleMouseMove);

  // Animation loop
  let time = 0;
  let animationFrame;
  let lastTime = performance.now();

  function animate(currentTime) {
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Smooth time progression (0.01-0.02 speed)
    time += deltaTime * 0.01;

    // Clear with gradient background
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#050A0F');
    gradient.addColorStop(1, '#0A121A');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Soft glow in center (Purple, opacity 0.05)
    const centerGradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) * 0.6
    );
    centerGradient.addColorStop(0, 'rgba(107, 45, 184, 0.05)');
    centerGradient.addColorStop(0.5, 'rgba(107, 45, 184, 0.02)');
    centerGradient.addColorStop(1, 'transparent');
    ctx.fillStyle = centerGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Update and draw nodes
    nodes.forEach(node => {
      node.update(time);
      node.draw(ctx, mouseX, mouseY);
    });

    // Draw neural connections (thin lines, 5-8% opacity) - Purple
    ctx.strokeStyle = 'rgba(139, 109, 184, 0.08)';
    ctx.lineWidth = 0.5;
    ctx.shadowBlur = 2;
    ctx.shadowColor = 'rgba(107, 45, 184, 0.1)';

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < connectionDistance) {
          // Parallax for connections
          const midX = (nodes[i].x + nodes[j].x) / 2;
          const midY = (nodes[i].y + nodes[j].y) / 2;
          const dxMouse = mouseX - midX;
          const dyMouse = mouseY - midY;
          const distMouse = Math.sqrt(dxMouse * dxMouse + dyMouse * dyMouse);
          const parallaxX = (dxMouse / distMouse) * Math.min(distMouse, 500) * 0.001;
          const parallaxY = (dyMouse / distMouse) * Math.min(distMouse, 500) * 0.001;

          // Breathing effect (scale 0.98-1.02)
          const breath = Math.sin(time * 0.02) * 0.02 + 1.0;
          const opacity = (1 - distance / connectionDistance) * 0.08 * breath;
          ctx.strokeStyle = `rgba(139, 109, 184, ${opacity})`;
          
          // Apply breathing to line width
          ctx.lineWidth = 0.5 * breath;
          
          ctx.beginPath();
          ctx.moveTo(nodes[i].x + parallaxX, nodes[i].y + parallaxY);
          ctx.lineTo(nodes[j].x + parallaxX, nodes[j].y + parallaxY);
          ctx.stroke();
        }
      }
    }

    ctx.shadowBlur = 0;

    // Update and draw particles
    particles.forEach(particle => {
      particle.update(time);
      particle.draw(ctx, mouseX, mouseY);
    });

    animationFrame = requestAnimationFrame(animate);
  }

  // Start animation with performance.now()
  lastTime = performance.now();
  animate(performance.now());

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (animationFrame) {
      cancelAnimationFrame(animationFrame);
    }
    window.removeEventListener('resize', resizeCanvas);
    window.removeEventListener('mousemove', handleMouseMove);
  });
})();

