#!/usr/bin/env node
/**
 * Diagnose: Cannot find module './1682.js'
 * Prüft .next-Struktur, Chunk-Pfade und next.config.
 */
const fs = require("fs");
const path = require("path");

const LOG = "/Users/cel/NEXCEL AI Webseite/.cursor/debug.log";
const ROOT = path.resolve(__dirname, "..");
const NEXT = path.join(ROOT, ".next");
const SERVER = path.join(NEXT, "server");
const CHUNKS = path.join(SERVER, "chunks");

function exists(p) {
  try { return fs.existsSync(p); } catch (e) { return false; }
}

function append(data) {
  const line = JSON.stringify({ ...data, timestamp: Date.now(), sessionId: "debug-session" }) + "\n";
  try { fs.appendFileSync(LOG, line); } catch (e) { /* ignore */ }
}

// #region agent log
append({ hypothesisId: "H1", location: "debug-1682.js", message: "1682 path check", data: {
  "server/1682.js": exists(path.join(SERVER, "1682.js")),
  "server/chunks/1682.js": exists(path.join(CHUNKS, "1682.js")),
  hasChunksDir: exists(CHUNKS),
  hasWebpackRuntime: exists(path.join(SERVER, "webpack-runtime.js")),
}});
// #endregion

// #region agent log
let requireSnippet = null;
const wr = path.join(SERVER, "webpack-runtime.js");
if (exists(wr)) {
  const c = fs.readFileSync(wr, "utf8");
  const i = c.indexOf('require("./" +');
  if (i >= 0) requireSnippet = c.slice(i, i + 80);
}
append({ hypothesisId: "H1", location: "debug-1682.js", message: "webpack-runtime require pattern", data: { requireSnippet } });
// #endregion

// #region agent log
let config = { outputStandalone: null, hasBundleAnalyzer: null, hasCustomWebpack: null };
try {
  const cfgPath = path.join(ROOT, "next.config.js");
  if (exists(cfgPath)) {
    const c = fs.readFileSync(cfgPath, "utf8");
    config.outputStandalone = /output\s*:\s*['"]standalone['"]/.test(c);
    config.hasBundleAnalyzer = /withBundleAnalyzer|@next\/bundle-analyzer/.test(c);
    config.hasCustomWebpack = /webpack\s*:\s*\(/.test(c);
  }
} catch (e) { config.err = String(e); }
append({ hypothesisId: "H3", location: "debug-1682.js", message: "next.config", data: config });
// #endregion

// #region agent log
const pathHasSpace = (ROOT.indexOf(" ") >= 0);
append({ hypothesisId: "H5", location: "debug-1682.js", message: "path has space", data: { pathHasSpace, root: ROOT } });
// #endregion

// #region agent log
let chunkFiles = [];
if (exists(CHUNKS)) {
  try { chunkFiles = fs.readdirSync(CHUNKS).filter(n => /^\d+\.js$/.test(n)).slice(0, 5); } catch (e) { chunkFiles = [String(e)]; }
}
append({ hypothesisId: "H2", location: "debug-1682.js", message: "chunks dir sample", data: { chunkFiles, has1682: chunkFiles.includes("1682.js") } });
// #endregion

console.log("Diagnose geschrieben nach", LOG);
