"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { useBrand } from "@/contexts/BrandContext";
import type { BrandId } from "@/types/brand";

const BRAND: Record<BrandId, { fog: number; lineOpacity: number; particleOpacity: number; traceOpacity: number }> = {
  nexcel: { fog: 0.0125, lineOpacity: 0.1, particleOpacity: 0.16, traceOpacity: 0.07 },
  blaze: { fog: 0.0135, lineOpacity: 0.11, particleOpacity: 0.18, traceOpacity: 0.08 },
};

function hexToColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

function randomInShell(minR: number, maxR: number): THREE.Vector3 {
  const u = Math.random();
  const v = Math.random();
  const t = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  const r = minR + (maxR - minR) * t;
  const s = Math.sin(phi);
  return new THREE.Vector3(r * s * Math.cos(theta), r * s * Math.sin(theta), r * Math.cos(phi));
}

function buildTraceCurve(radiusMin: number, radiusMax: number): THREE.CatmullRomCurve3 {
  const a = randomInShell(radiusMin, radiusMax);
  const b = randomInShell(radiusMin, radiusMax);
  const mid = a.clone().lerp(b, 0.5);
  const bend = randomInShell(0.4, 1.4);
  const ctrlA = a.clone().lerp(mid, 0.42).add(bend.clone().multiplyScalar(0.35));
  const ctrlB = b.clone().lerp(mid, 0.42).sub(bend.multiplyScalar(0.28));
  return new THREE.CatmullRomCurve3([a, ctrlA, mid, ctrlB, b], false, "catmullrom", 0.25);
}

/** Kleines Punkt-Sprite: harter Kern, kein weicher Bubble-Bokeh-Kreis */
function makePointSpriteTexture(): THREE.CanvasTexture {
  const size = 12;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    const t = new THREE.CanvasTexture(canvas);
    return t;
  }
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "rgba(255,255,255,0.95)";
  ctx.fillRect(size / 2 - 1, size / 2 - 1, 2, 2);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(size / 2 - 2, size / 2 - 2, 4, 4);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

export default function HeroCinematicEnvironment() {
  const containerRef = useRef<HTMLDivElement>(null);
  const brand = useBrand();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const cfg = BRAND[brand.id];
    const primary = hexToColor(brand.theme.accentPrimary);
    const accent = hexToColor(brand.theme.accentSecondary);

    let width = container.clientWidth;
    let height = container.clientHeight;
    if (width < 2 || height < 2) {
      width = Math.max(window.innerWidth, 2);
      height = Math.max(window.innerHeight, 2);
    }

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, width < 1024 ? 1.5 : 2);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
      stencil: false,
      depth: true,
    });
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x070710, reduced ? cfg.fog * 0.8 : cfg.fog);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 90);
    camera.position.set(0, 0, 5.8);
    camera.lookAt(0, 0, 0);

    const camBaseZ = 5.8;

    // Root: langsame Gesamt-Rotation (Tiefenbewegung)
    const world = new THREE.Group();
    scene.add(world);

    // Parallax: entfernte Nebel-Schicht (sehr langsam)
    const parallaxFar = new THREE.Group();
    world.add(parallaxFar);

    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(46, 40, 40),
      new THREE.MeshBasicMaterial({ color: 0x090914, side: THREE.BackSide })
    );
    scene.add(sky);

    const mistFar = new THREE.Mesh(
      new THREE.SphereGeometry(38, 24, 24),
      new THREE.MeshBasicMaterial({
        color: primary,
        transparent: true,
        opacity: 0.02,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    parallaxFar.add(mistFar);

    const mistFarAccent = new THREE.Mesh(
      new THREE.SphereGeometry(42, 22, 22),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.014,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    mistFarAccent.position.set(-2.2, 1.4, -2.8);
    parallaxFar.add(mistFarAccent);

    // Große weiche Brand-Lichtzonen für mehr hochwertige Atmosphaere
    const auroraA = new THREE.Mesh(
      new THREE.SphereGeometry(26, 24, 24),
      new THREE.MeshBasicMaterial({
        color: primary,
        transparent: true,
        opacity: 0.04,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    auroraA.position.set(6.8, 2.8, -8.8);
    parallaxFar.add(auroraA);

    const auroraB = new THREE.Mesh(
      new THREE.SphereGeometry(24, 22, 22),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.03,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    auroraB.position.set(-6.2, -2.4, -9.6);
    parallaxFar.add(auroraB);

    // Parallax: Brand-Schleier (mittlere Tiefe)
    const parallaxMid = new THREE.Group();
    world.add(parallaxMid);

    const veilA = new THREE.Mesh(
      new THREE.SphereGeometry(18, 28, 28),
      new THREE.MeshBasicMaterial({
        color: primary,
        transparent: true,
        opacity: 0.048,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    veilA.position.set(4, 1, -3);
    parallaxMid.add(veilA);

    const veilB = new THREE.Mesh(
      new THREE.SphereGeometry(14, 24, 24),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.032,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    veilB.position.set(-3.5, -1.5, -2.5);
    parallaxMid.add(veilB);

    const veilC = new THREE.Mesh(
      new THREE.SphereGeometry(24, 24, 24),
      new THREE.MeshBasicMaterial({
        color: primary,
        transparent: true,
        opacity: 0.024,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    veilC.position.set(0.5, 2.5, -5);
    parallaxMid.add(veilC);

    // Parallax: feine Linien (leicht entkoppelt)
    const parallaxLines = new THREE.Group();
    world.add(parallaxLines);

    const lineCount = reduced ? 14 : 24;
    const linePos: number[] = [];
    for (let i = 0; i < lineCount; i++) {
      const a = randomInShell(7, 17);
      const b = a.clone().add(randomInShell(0.6, 2.4));
      linePos.push(a.x, a.y, a.z, b.x, b.y, b.z);
    }
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute("position", new THREE.Float32BufferAttribute(linePos, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: primary,
      transparent: true,
      opacity: cfg.lineOpacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    parallaxLines.add(lines);

    // Sehr dezente Infrastruktur-Spuren (futuristische Lichtbahnen, nicht als Netz lesbar)
    const parallaxTraces = new THREE.Group();
    world.add(parallaxTraces);

    const traceCount = reduced ? 3 : 5;
    const traceCurves: THREE.CatmullRomCurve3[] = [];
    for (let i = 0; i < traceCount; i++) {
      const curve = buildTraceCurve(8.5, 18.5);
      traceCurves.push(curve);

      const traceGeo = new THREE.BufferGeometry().setFromPoints(curve.getPoints(40));
      const traceMat = new THREE.LineBasicMaterial({
        color: i % 2 === 0 ? primary : accent,
        transparent: true,
        opacity: cfg.traceOpacity * (0.7 + Math.random() * 0.25),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const trace = new THREE.Line(traceGeo, traceMat);
      parallaxTraces.add(trace);
    }

    // Signalpunkte laufen langsam entlang der Spuren
    const tracePulsePos = new Float32Array(traceCount * 3);
    const tracePulseGeo = new THREE.BufferGeometry();
    tracePulseGeo.setAttribute("position", new THREE.BufferAttribute(tracePulsePos, 3));
    const tracePulseMat = new THREE.PointsMaterial({
      map: makePointSpriteTexture(),
      color: primary.clone().lerp(accent, 0.35),
      size: reduced ? 0.018 : 0.022,
      transparent: true,
      opacity: reduced ? 0.12 : 0.16,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.01,
    });
    const tracePulses = new THREE.Points(tracePulseGeo, tracePulseMat);
    parallaxTraces.add(tracePulses);
    const traceOffsets = Array.from({ length: traceCount }, (_, i) => (i / traceCount + Math.random() * 0.25) % 1);

    // Subtiler volumetrischer Glow als tiefe Schichten (ohne zentrales Objekt)
    const volumeLayerA = new THREE.Mesh(
      new THREE.SphereGeometry(30, 20, 20),
      new THREE.MeshBasicMaterial({
        color: primary,
        transparent: true,
        opacity: 0.013,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    volumeLayerA.position.set(0, 1.8, -7.5);
    parallaxMid.add(volumeLayerA);

    const volumeLayerB = new THREE.Mesh(
      new THREE.SphereGeometry(34, 18, 18),
      new THREE.MeshBasicMaterial({
        color: accent,
        transparent: true,
        opacity: 0.01,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      })
    );
    volumeLayerB.position.set(0.8, -1.2, -10.2);
    parallaxFar.add(volumeLayerB);

    // Parallax: wenige Lichtpunkte (Sprite-Map, kein Bubble)
    const parallaxPoints = new THREE.Group();
    world.add(parallaxPoints);

    const particleCount = reduced ? 18 : 32;
    const pPos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const p = randomInShell(9, 21);
      pPos[i * 3] = p.x;
      pPos[i * 3 + 1] = p.y;
      pPos[i * 3 + 2] = p.z;
    }
    const pGeo = new THREE.BufferGeometry();
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pointMap = makePointSpriteTexture();
    const pMat = new THREE.PointsMaterial({
      map: pointMap,
      color: accent,
      size: reduced ? 0.028 : 0.034,
      transparent: true,
      opacity: cfg.particleOpacity,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      alphaTest: 0.01,
    });
    const points = new THREE.Points(pGeo, pMat);
    parallaxPoints.add(points);

    scene.add(new THREE.AmbientLight(0x1a1a22, 0.22));
    const hemi = new THREE.HemisphereLight(primary, 0x050508, 0.28);
    scene.add(hemi);

    let intersecting = true;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]) intersecting = entries[0].isIntersecting;
      },
      { threshold: [0, 0.05, 0.1] }
    );
    io.observe(container);

    const resize = () => {
      const w = Math.max(container.clientWidth, 2);
      const h = Math.max(container.clientHeight, 2);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, w < 1024 ? 1.5 : 2));
      renderer.setSize(w, h, false);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const clock = new THREE.Clock();
    let raf = 0;
    let t = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);

      if (!document.hidden && intersecting && !reduced) {
        t += dt;

        // Sehr langsame atmosphärische Tiefenbewegung
        world.rotation.y = Math.sin(t * 0.055) * 0.0055;
        world.rotation.x = Math.sin(t * 0.038) * 0.0022;

        parallaxFar.rotation.y = t * 0.012;
        parallaxFar.rotation.z = Math.sin(t * 0.022) * 0.003;
        mistFarAccent.position.x = -2.2 + Math.sin(t * 0.034) * 0.18;
        mistFarAccent.position.y = 1.4 + Math.cos(t * 0.026) * 0.12;
        auroraA.position.x = 6.8 + Math.sin(t * 0.022) * 0.28;
        auroraA.position.y = 2.8 + Math.cos(t * 0.018) * 0.18;
        auroraB.position.x = -6.2 + Math.cos(t * 0.02) * 0.24;
        auroraB.position.y = -2.4 + Math.sin(t * 0.017) * 0.16;

        parallaxMid.rotation.y = Math.sin(t * 0.048) * 0.004;
        parallaxMid.rotation.x = Math.cos(t * 0.035) * 0.0028;
        volumeLayerA.position.z = -7.5 + Math.sin(t * 0.03) * 0.2;
        volumeLayerB.position.z = -10.2 + Math.cos(t * 0.024) * 0.24;

        parallaxLines.rotation.y = Math.sin(t * 0.062) * 0.0035;
        parallaxLines.rotation.z = -Math.sin(t * 0.028) * 0.002;
        parallaxTraces.rotation.y = -Math.sin(t * 0.042) * 0.0032;
        parallaxTraces.rotation.x = Math.cos(t * 0.03) * 0.0018;

        parallaxPoints.rotation.y = -t * 0.018;

        for (let i = 0; i < traceCount; i++) {
          const speed = 0.018 + i * 0.0025;
          const u = (traceOffsets[i] + t * speed) % 1;
          const p = traceCurves[i].getPointAt(u);
          tracePulsePos[i * 3] = p.x;
          tracePulsePos[i * 3 + 1] = p.y;
          tracePulsePos[i * 3 + 2] = p.z;
        }
        tracePulseGeo.attributes.position.needsUpdate = true;

        veilA.position.x = 4 + Math.sin(t * 0.11) * 0.1;
        veilA.position.y = 1 + Math.cos(t * 0.09) * 0.06;
        veilB.position.x = -3.5 + Math.sin(t * 0.085) * 0.08;
        veilB.position.y = -1.5 + Math.cos(t * 0.07) * 0.07;
        veilC.position.z = -5 + Math.sin(t * 0.065) * 0.09;

        camera.position.x = Math.sin(t * 0.045) * 0.024;
        camera.position.y = Math.cos(t * 0.036) * 0.016;
        camera.position.z = camBaseZ + Math.sin(t * 0.03) * 0.012;
        camera.lookAt(0, Math.sin(t * 0.025) * 0.008, 0);
      }

      renderer.render(scene, camera);
    };

    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      pointMap.dispose();
      const pulseMap = tracePulseMat.map;
      if (pulseMap) pulseMap.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh || obj instanceof THREE.Points || obj instanceof THREE.LineSegments) {
          obj.geometry?.dispose();
          const mat = obj.material;
          if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
          else mat?.dispose();
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === container) container.removeChild(renderer.domElement);
    };
  }, [brand.id, brand.theme.accentPrimary, brand.theme.accentSecondary]);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0 h-full min-h-[100svh] w-full overflow-hidden [&_canvas]:align-top"
      aria-hidden
    />
  );
}
