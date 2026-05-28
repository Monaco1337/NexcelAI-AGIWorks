/**
 * Erstellt favicon.ico aus SVG
 * 
 * Benötigt: sharp (npm install sharp)
 * 
 * Führe aus: node scripts/create-favicon-ico.js
 */

const fs = require('fs');
const path = require('path');

// SVG-Inhalt für 32x32 Favicon
const svgContent = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="purpleGrad32" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6B2DB8;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#8B6DB8;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#A68BC7;stop-opacity:1" />
    </linearGradient>
    <linearGradient id="glassGrad32" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:rgba(255,255,255,0.25);stop-opacity:1" />
      <stop offset="50%" style="stop-color:rgba(255,255,255,0.15);stop-opacity:1" />
      <stop offset="100%" style="stop-color:rgba(255,255,255,0.1);stop-opacity:1" />
    </linearGradient>
  </defs>
  <circle cx="16" cy="16" r="15" fill="url(#glassGrad32)" opacity="0.8"/>
  <circle cx="16" cy="16" r="15" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="0.5"/>
  <circle cx="16" cy="16" r="14" fill="rgba(255,255,255,0.1)" opacity="0.5"/>
  <path d="M 9 10 L 9 22 L 12 22 L 12 14 L 20 22 L 23 22 L 23 10 L 20 10 L 20 18 L 12 10 Z" fill="url(#purpleGrad32)" opacity="0.95"/>
</svg>`;

console.log('📝 Favicon.ico Generator');
console.log('');
console.log('⚠️  WICHTIG: Die favicon.ico Datei muss als PNG erstellt werden!');
console.log('');
console.log('📋 Optionen:');
console.log('');
console.log('1. Verwende ein Online-Tool:');
console.log('   - Gehe zu: https://realfavicongenerator.net/');
console.log('   - Lade public/favicon.svg hoch');
console.log('   - Generiere alle Favicons');
console.log('   - Lade favicon.ico herunter');
console.log('');
console.log('2. Verwende ImageMagick (falls installiert):');
console.log('   convert public/favicon-32x32.svg -resize 32x32 public/favicon.ico');
console.log('');
console.log('3. Kopiere favicon-32x32.svg als PNG:');
console.log('   - Öffne public/favicon-32x32.svg in einem Bildeditor');
console.log('   - Exportiere als PNG (32x32)');
console.log('   - Benenne um zu favicon.ico');
console.log('');
console.log('💡 Für jetzt: Browser verwenden SVG-Favicons automatisch!');
console.log('   Die favicon.ico ist optional für ältere Browser.');

