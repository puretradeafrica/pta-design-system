/**
 * Generates src/css/tokens.css from the TypeScript tokens.
 *
 * The TS files are the source of truth. This emits the same values as CSS custom
 * properties for consumers that would rather style in CSS than in objects, and for
 * the four Vite apps that have no Tailwind.
 *
 * Run:   node scripts/build-css.mjs
 * Check: node scripts/build-css.mjs --check
 *        Regenerates in memory and exits 1 if the committed file is stale, so a
 *        token change that forgets to regenerate the CSS fails CI. Works without
 *        git, unlike a `git diff` check.
 *
 * Node 22+ strips the TypeScript types on import, so there is no build step.
 */

import { writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { semantic } from "../src/tokens/semantic.ts";
import { scale } from "../src/tokens/scale.ts";

const here = dirname(fileURLToPath(import.meta.url));
const out = join(here, "..", "src", "css", "tokens.css");

const kebab = (s) => s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
const px = (v) => (typeof v === "number" && v !== 0 ? `${v}px` : String(v));

const lines = [];
const emit = (s) => lines.push(s);

emit("/* GENERATED FILE. Do not edit by hand.");
emit(" * Source: src/tokens/*.ts");
emit(" * Regenerate: node scripts/build-css.mjs");
emit(" */");
emit("");
emit(":root {");

function section(title, obj, prefix, fmt = String) {
  emit("");
  emit(`  /* ${title} */`);
  for (const [k, v] of Object.entries(obj)) {
    if (v && typeof v === "object") {
      for (const [k2, v2] of Object.entries(v)) {
        emit(`  --pta-${prefix}-${kebab(k)}-${kebab(k2)}: ${fmt(v2)};`);
      }
    } else {
      emit(`  --pta-${prefix}-${kebab(k)}: ${fmt(v)};`);
    }
  }
}

section("Surface", semantic.surface, "surface");
section("Text", semantic.text, "text");
section("Border colour", semantic.border, "border");
section("Interactive", semantic.interactive, "interactive");
section("Status", semantic.status, "status");
section("Data signal", semantic.dataSignal, "signal");
section("Elevation", semantic.elevation, "shadow");
section("Pipeline stage", semantic.stage, "stage");

section("Font family", scale.font, "font");
section("Font size", scale.fontSize, "text-size", px);
section("Line height", scale.lineHeight, "leading");
section("Font weight", scale.fontWeight, "weight");
section("Space", scale.space, "space", px);
section("Radius", scale.radius, "radius", px);
section("Border width", scale.border, "border-width", px);

section("Control", scale.control, "control", px);
section("Layout", scale.layout, "layout", px);
section("Density", scale.density, "density", px);

emit("}");
emit("");
emit("/* The apps pin a light theme: globals.css sets color-scheme: light because");
emit(" * these are dense data tools read in offices, and a naive dark inversion put");
emit(" * near-white text on white cards. A dark set can be added here later as a");
emit(" * deliberate design pass, not as an inversion. */");
emit("");

const next = lines.join("\n");
const count = lines.filter((l) => l.trim().startsWith("--pta-")).length;

if (process.argv.includes("--check")) {
  // CI guard: a token change that forgets to regenerate the CSS fails the build.
  // Done in memory rather than via `git diff`, so it works in a fresh checkout.
  let current = null;
  try {
    current = readFileSync(out, "utf8");
  } catch {
    /* a missing file counts as stale */
  }
  if (current !== next) {
    console.error("tokens.css is stale. Run: node scripts/build-css.mjs");
    process.exit(1);
  }
  console.log(`tokens.css is up to date (${count} custom properties)`);
} else {
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, next, "utf8");
  console.log(`wrote ${out}`);
  console.log(`${count} custom properties emitted`);
}
