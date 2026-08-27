/**
 * Generates a violation baseline for an app adopting the design system.
 *
 * An app with hundreds of accumulated colour literals cannot turn the lint rule on
 * as an error on day one. The baseline records what is already there so those stay
 * quiet, while anything NEW fails the build immediately. The baseline may only ever
 * shrink: CI rejects a pull request that grows it.
 *
 * Usage:
 *   node scripts/make-baseline.mjs <app-src-dir> [output.json]
 *
 * Example:
 *   node scripts/make-baseline.mjs "../../Active Deals View/src" \
 *        "../../Active Deals View/pta-design-baseline.json"
 *
 * Then in the app's eslint config:
 *   "pta-design/no-raw-color": ["error", { baseline: "./pta-design-baseline.json" }]
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const FUNC = /\b(rgba?|hsla?)\s*\(/g;
const CODE = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
/**
 * Stylesheets are scanned too, because a class-based app keeps its colour there
 * rather than in JS. Note the ESLint rule itself only sees JS and TS, so a CSS
 * entry in the baseline is an inventory item, not something the rule will police.
 * The fix for those is to make the stylesheet consume var(--pta-*), at which point
 * the raw values disappear on their own. See docs/ADOPTING.md.
 */
const STYLE = new Set([".css", ".scss", ".less"]);
const SKIP = new Set(["node_modules", "dist", "build", ".git", "coverage"]);

const [, , targetArg, outArg] = process.argv;
if (!targetArg) {
  console.error("usage: node scripts/make-baseline.mjs <app-src-dir> [output.json]");
  process.exit(2);
}
const target = resolve(targetArg);
const out = resolve(outArg ?? join(target, "..", "pta-design-baseline.json"));

function walk(dir, acc = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else {
      const ext = entry.slice(entry.lastIndexOf("."));
      if (CODE.has(ext) || STYLE.has(ext)) acc.push(full);
    }
  }
  return acc;
}

/** Blanks a matched run while preserving its newlines, so line numbers hold. */
const blank = (m) => m.replace(/[^\n]/g, " ");

/**
 * Strips comments before scanning, so a hex quoted in a code comment does not
 * enter the baseline and then look like a violation that was fixed.
 * CSS has no line comments, so stylesheets only get the block pass.
 */
function stripComments(src, isStyle) {
  const noBlocks = src.replace(/\/\*[\s\S]*?\*\//g, blank);
  if (isStyle) return noBlocks;
  return noBlocks.replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + blank(m.slice(p.length)));
}

const files = walk(target);
const entries = [];
const byFile = {};

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const isStyle = STYLE.has(file.slice(file.lastIndexOf(".")));
  const src = stripComments(raw, isStyle);
  const rel = relative(process.cwd(), file).split(sep).join("/");
  src.split("\n").forEach((line, i) => {
    const lineNo = i + 1;
    for (const m of line.matchAll(HEX)) {
      entries.push(`${rel}:${lineNo}:${m[0]}`);
      byFile[rel] = (byFile[rel] ?? 0) + 1;
    }
    for (const m of line.matchAll(FUNC)) {
      entries.push(`${rel}:${lineNo}:${m[1]}`);
      byFile[rel] = (byFile[rel] ?? 0) + 1;
    }
  });
}

writeFileSync(out, JSON.stringify(entries.sort(), null, 2) + "\n", "utf8");

const styleHits = entries.filter((e) => /\.(css|scss|less):/.test(e)).length;
const worst = Object.entries(byFile).sort((a, b) => b[1] - a[1]).slice(0, 8);
console.log(`scanned ${files.length} files under ${target}`);
console.log(`baselined ${entries.length} existing violations -> ${out}`);
if (worst.length) {
  console.log("\nheaviest files, a reasonable migration order:");
  for (const [f, n] of worst) console.log(`  ${String(n).padStart(4)}  ${f}`);
}
if (styleHits) {
  console.log(`\n${styleHits} of these sit in stylesheets, which the ESLint rule does not see.`);
  console.log("Fix those by pointing the stylesheet at var(--pta-*), which makes the raw");
  console.log("values disappear rather than being suppressed. See docs/ADOPTING.md.");
}
console.log("\nThis file may only ever shrink. Add it to the repo and check it in CI.");
