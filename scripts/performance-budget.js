#!/usr/bin/env node

/**
 * Performance Budget Checker
 * Fails build if route JS exceeds budget thresholds
 */

const fs = require('fs');
const path = require('path');
const { gzipSync } = require('zlib');

const BUDGETS = {
  // Per-route JS budget (gzipped)
  routes: {
    '/': 120 * 1024, // 120KB
    '/projekte': 120 * 1024,
    '/ueber-mich': 120 * 1024,
    '/kontakt': 120 * 1024,
  },
  // Total assets budget
  total: {
    js: 500 * 1024, // 500KB total JS
    css: 50 * 1024, // 50KB CSS
  },
};

function getGzipSize(content) {
  return gzipSync(Buffer.from(content)).length;
}

function parseBuildOutput(buildDir = '.next') {
  const manifestPath = path.join(buildDir, 'build-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    console.error('❌ Build manifest not found. Run "npm run build" first.');
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const routeSizes = {};

  // Parse pages
  Object.keys(manifest.pages).forEach((route) => {
    const files = manifest.pages[route] || [];
    const jsFiles = files.filter((f) => f.endsWith('.js'));
    
    let totalSize = 0;
    jsFiles.forEach((file) => {
      const filePath = path.join(buildDir, 'static', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        totalSize += getGzipSize(content);
      }
    });

    // Add shared chunks
    if (manifest.pages['/_app']) {
      manifest.pages['/_app'].forEach((file) => {
        if (file.endsWith('.js')) {
          const filePath = path.join(buildDir, 'static', file);
          if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath);
            totalSize += getGzipSize(content);
          }
        }
      });
    }

    routeSizes[route] = totalSize;
  });

  return routeSizes;
}

function checkBudgets(routeSizes) {
  const errors = [];
  const warnings = [];

  // Check per-route budgets
  Object.keys(BUDGETS.routes).forEach((route) => {
    const size = routeSizes[route] || routeSizes[`${route}/page`] || 0;
    const budget = BUDGETS.routes[route];
    
    if (size > budget) {
      errors.push(
        `❌ ${route}: ${(size / 1024).toFixed(2)}KB exceeds budget of ${(budget / 1024).toFixed(2)}KB`
      );
    } else if (size > budget * 0.9) {
      warnings.push(
        `⚠️  ${route}: ${(size / 1024).toFixed(2)}KB is close to budget (${(budget / 1024).toFixed(2)}KB)`
      );
    } else {
      console.log(`✅ ${route}: ${(size / 1024).toFixed(2)}KB (budget: ${(budget / 1024).toFixed(2)}KB)`);
    }
  });

  // Check total JS budget
  const totalJS = Object.values(routeSizes).reduce((sum, size) => sum + size, 0);
  if (totalJS > BUDGETS.total.js) {
    errors.push(
      `❌ Total JS: ${(totalJS / 1024).toFixed(2)}KB exceeds budget of ${(BUDGETS.total.js / 1024).toFixed(2)}KB`
    );
  }

  return { errors, warnings };
}

// Main execution
const buildDir = process.argv[2] || '.next';
const routeSizes = parseBuildOutput(buildDir);
const { errors, warnings } = checkBudgets(routeSizes);

console.log('\n📊 Performance Budget Report\n');
console.log('Route Sizes (gzipped):');
Object.keys(routeSizes).forEach((route) => {
  console.log(`  ${route}: ${(routeSizes[route] / 1024).toFixed(2)}KB`);
});

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings:');
  warnings.forEach((w) => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.log('\n❌ Budget Violations:');
  errors.forEach((e) => console.log(`  ${e}`));
  console.log('\n🚫 Build failed: Performance budget exceeded');
  process.exit(1);
}

console.log('\n✅ All routes within performance budget!');
process.exit(0);
