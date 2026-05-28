"use client";

import { useEffect, useRef, useState } from "react";
// Lazy load Three.js - only import when component mounts
let THREE: typeof import("three") | null = null;

const loadThree = async () => {
  if (!THREE) {
    THREE = await import("three");
  }
  return THREE;
};

// Simplex Noise function for shader
const simplexNoise = `
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }

  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }

  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy,h.x);
    vec3 p1 = vec3(a0.zw,h.y);
    vec3 p2 = vec3(a1.xy,h.z);
    vec3 p3 = vec3(a1.zw,h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
`;

const vertexShader = `
  void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uBrightness;
  uniform bool uIsMobile;

  ${simplexNoise}

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = uv * 2.0 - 1.0;
    p.x *= uResolution.x / uResolution.y;

    // Parallax offset for depth (very subtle)
    vec2 parallaxOffset = (uMouse / uResolution.xy - 0.5) * 0.01;
    vec3 worldPos = vec3(p + parallaxOffset, uTime * 0.02);

    // Base gradient background (#05090F to #0A0F14)
    vec3 baseColor = mix(
      vec3(0.02, 0.04, 0.06), // #05090F
      vec3(0.04, 0.06, 0.08), // #0A0F14
      uv.y
    );

    // Layer 1: Deep Gradient Layer (multilayered radial glows)
    vec2 center = vec2(0.5, 0.5);
    float distToCenter = distance(uv, center);
    
    // Cyan Glow (0.05 opacity)
    float cyanGlow = smoothstep(0.8, 0.0, distToCenter) * 0.05;
    vec3 cyanColor = vec3(0.12, 0.78, 0.95); // #1EA7D7
    
    // Teal Glow (0.03 opacity)
    float tealGlow = smoothstep(0.7, 0.0, distToCenter) * 0.03;
    vec3 tealColor = vec3(0.0, 0.5, 0.6);
    
    // Dark Blue Glow (0.08 opacity)
    float blueGlow = smoothstep(0.9, 0.0, distToCenter) * 0.08;
    vec3 blueColor = vec3(0.0, 0.2, 0.4);
    
    vec3 gradientLayer = cyanColor * cyanGlow + tealColor * tealGlow + blueColor * blueGlow;

    // Layer 2: Neural Network Lines (fine abstract line network, like AI grid)
    vec3 linePos = worldPos * vec3(4.0, 3.5, 1.0) + vec3(0.0, 0.0, uTime * 0.015);
    
    // Create organic neural network pattern using noise
    float lineNoise1 = snoise(linePos);
    float lineNoise2 = snoise(linePos * 1.3 + vec3(10.0));
    float lineNoise3 = snoise(linePos * 0.7 + vec3(20.0));
    
    // Create thin lines from noise patterns
    float hLine = abs(lineNoise1);
    hLine = smoothstep(0.88, 0.92, hLine) * (1.0 - smoothstep(0.92, 0.96, hLine));
    
    float vLine = abs(lineNoise2);
    vLine = smoothstep(0.85, 0.90, vLine) * (1.0 - smoothstep(0.90, 0.95, vLine));
    
    // Subtle diagonal connections
    float dLine = abs(lineNoise3);
    dLine = smoothstep(0.90, 0.94, dLine) * (1.0 - smoothstep(0.94, 0.98, dLine)) * 0.6;
    
    // Add subtle breathing effect (not wobbly, just gentle pulse)
    float breath = sin(uTime * 0.02) * 0.05 + 1.0;
    float neuralLines = (hLine + vLine + dLine) * breath;
    
    // Neural line color (#1EA7D7 / #38C7F2) with 0.06-0.10 opacity
    vec3 neuralColor = vec3(0.12, 0.65, 0.84); // #1EA7D7
    vec3 neuralLinesColor = neuralColor * neuralLines * 0.08;

    // Layer 3: Soft Particles (20-40 holographic dots)
    int particleCount = uIsMobile ? 15 : 30;
    float particles = 0.0;
    
    // Generate particle positions using noise
    for(int i = 0; i < 30; i++) {
      if(i >= particleCount) break;
      
      vec2 particlePos = vec2(
        mod(float(i) * 0.618, 1.0), // Golden ratio distribution
        mod(float(i) * 0.381, 1.0)
      );
      
      // Slow movement (0.01-0.02)
      particlePos.x += sin(uTime * 0.015 + float(i) * 0.5) * 0.1;
      particlePos.y += cos(uTime * 0.018 + float(i) * 0.7) * 0.1;
      
      float dist = distance(uv, particlePos);
      float size = 0.08 + sin(uTime * 0.02 + float(i)) * 0.02;
      
      // Very soft, blurred particles
      float particle = smoothstep(size, size * 0.3, dist);
      particle = pow(particle, 2.0); // Softer falloff
      
      // Vary opacity per particle
      float particleOpacity = 0.03 + sin(float(i) * 1.3) * 0.02;
      particles += particle * particleOpacity;
    }
    particles = min(particles, 0.07);
    
    // Particle colors (Cyan tones + white)
    vec3 particleColor = mix(
      vec3(0.22, 0.78, 0.95), // Cyan
      vec3(1.0, 1.0, 1.0),    // White
      0.3
    );
    vec3 particlesColor = particleColor * particles;

    // Combine all layers
    vec3 color = baseColor;
    color += gradientLayer;
    color += neuralLinesColor;
    color += particlesColor;

    // Apply brightness control
    color *= uBrightness;

    // Central focus darkening (5-8% darker in center for text readability)
    float centerDist = distance(uv, vec2(0.5, 0.5));
    float centerDarken = smoothstep(0.25, 0.5, centerDist);
    color *= (0.92 + centerDarken * 0.08); // 8% darker in center

    // Final color
    gl_FragColor = vec4(color, 1.0);
  }
`;

export default function NeuralBackgroundV6() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [threeLoaded, setThreeLoaded] = useState(false);

  // Lazy load Three.js
  useEffect(() => {
    loadThree().then(() => {
      setThreeLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!mountRef.current || !threeLoaded || !THREE) return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Performance optimization
    renderer.setClearColor(0x05070a, 1);
    mountRef.current.appendChild(renderer.domElement);

    // Fullscreen quad
    const geometry = new THREE.PlaneGeometry(2, 2);
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uBrightness: { value: 0.8 }, // Reduced default brightness
        uIsMobile: { value: isMobile },
      },
    });

    const quad = new THREE.Mesh(geometry, material);
    scene.add(quad);

    // Mouse tracking
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      material.uniforms.uMouse.value.set(e.clientX, window.innerHeight - e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    // Resize handler
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      material.uniforms.uResolution.value.set(width, height);
      checkMobile();
      material.uniforms.uIsMobile.value = window.innerWidth < 768;
    };

    window.addEventListener("resize", handleResize);

    // Animation loop - extremely slow, meditative (0.015-0.03)
    let animationFrameId: number;
    let time = 0;

    const animate = () => {
      time += 0.008; // Very slow, meditative speed
      material.uniforms.uTime.value = time;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("resize", checkMobile);
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      renderer.dispose();
      material.dispose();
      geometry.dispose();
      if (mountRef.current && renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [isMobile, threeLoaded]);

  return (
    <div
      ref={mountRef}
      className="neural-background-v6"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}

