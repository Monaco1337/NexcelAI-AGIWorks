/**
 * Pixel-Diff-Tool: Vergleicht /tmp/nr16/original.png und
 * /tmp/nr16/candidate.png und schreibt eine Difference-Map nach
 * /tmp/nr16/diff.png. Gibt die Anzahl abweichender Pixel + Prozent aus.
 */

import { readFileSync, writeFileSync } from "node:fs";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

const orig = PNG.sync.read(readFileSync("/tmp/nr16/original.png"));
const cand = PNG.sync.read(readFileSync("/tmp/nr16/candidate.png"));

if (orig.width !== cand.width || orig.height !== cand.height) {
  console.error(
    `Größen unterschiedlich: original=${orig.width}x${orig.height} vs. candidate=${cand.width}x${cand.height}`
  );
  process.exit(2);
}

const diff = new PNG({ width: orig.width, height: orig.height });
const differing = pixelmatch(
  orig.data,
  cand.data,
  diff.data,
  orig.width,
  orig.height,
  { threshold: 0.1, includeAA: true, alpha: 0.4 }
);
writeFileSync("/tmp/nr16/diff.png", PNG.sync.write(diff));

const total = orig.width * orig.height;
const pct = ((differing / total) * 100).toFixed(2);
console.log(`Differing pixels: ${differing.toLocaleString("de-DE")} / ${total.toLocaleString("de-DE")} (${pct}%)`);
