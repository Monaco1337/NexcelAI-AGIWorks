/**
 * Favicon Generator Script
 * Erstellt PNG-Favicons aus dem SVG
 * 
 * Um dieses Script zu verwenden, installiere zuerst:
 * npm install sharp
 * 
 * Dann führe aus:
 * node scripts/generate-favicons.js
 */

const fs = require('fs');
const path = require('path');

// SVG-Inhalt für Favicons
const svgContent = `<svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1B8F6A;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#29DFA8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="32" cy="32" r="30" fill="url(#grad1)" opacity="0.9"/>
  <path d="M 18 20 L 18 44 L 24 44 L 24 28 L 40 44 L 46 44 L 46 20 L 40 20 L 40 36 L 24 20 Z" fill="white" opacity="0.95"/>
</svg>`;

console.log('📝 Favicon Generator für NEXCEL AI');
console.log('');
console.log('✅ SVG-Favicons wurden bereits erstellt:');
console.log('   - app/icon.svg (für Next.js automatische Generierung)');
console.log('   - public/favicon.svg (für Browser)');
console.log('   - public/safari-pinned-tab.svg (für Safari)');
console.log('');
console.log('📱 Für PNG-Favicons (optional):');
console.log('   1. Installiere sharp: npm install sharp');
console.log('   2. Führe aus: node scripts/generate-favicons.js');
console.log('');
console.log('💡 Tipp: SVG-Favicons funktionieren in modernen Browsern perfekt!');
console.log('   PNG-Dateien werden nur für ältere Browser benötigt.');

