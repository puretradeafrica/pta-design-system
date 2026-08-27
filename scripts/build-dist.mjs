/**
 * Compiles src/ to dist/ as JavaScript with type declarations.
 *
 * Why this exists: Node refuses to strip TypeScript types for files inside
 * node_modules (ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING). Bundlers are fine
 * with the raw source, but anything running under plain Node is not, and document
 * generation needs exactly that. Shipping compiled JS makes the package work in
 * both places.
 *
 * Runs automatically on install via the `prepare` script, so `dist/` stays out of
 * git and can never go stale relative to the source.
 *
 * The source imports siblings with a `.ts` extension, which tsc will not emit
 * from. This rewrites those to `.js` into a staging copy, compiles that, and
 * leaves the real source untouched.
 */

import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
// Staged inside the project, not in the OS temp dir, so `react` and its types
// still resolve from the local node_modules during the compile.
const stage = join(root, ".build-src");
rmSync(stage, { recursive: true, force: true });
mkdirSync(stage, { recursive: true });

try {
  cpSync(join(root, "src"), join(stage, "src"), { recursive: true });

  const walk = (dir) => {
    for (const e of readdirSync(dir)) {
      const full = join(dir, e);
      if (statSync(full).isDirectory()) walk(full);
      else if (/\.tsx?$/.test(e)) {
        const src = readFileSync(full, "utf8");
        writeFileSync(full, src.replace(/(from\s+["'])(\.{1,2}\/[^"']+)\.ts(x?)(["'])/g, "$1$2.js$4"), "utf8");
      }
    }
  };
  walk(join(stage, "src"));

  const cfg = JSON.parse(readFileSync(join(root, "tsconfig.build.json"), "utf8"));
  cfg.extends = undefined;
  cfg.compilerOptions = {
    ...JSON.parse(readFileSync(join(root, "tsconfig.json"), "utf8")).compilerOptions,
    ...cfg.compilerOptions,
    allowImportingTsExtensions: false,
    rootDir: join(stage, "src"),
    outDir: join(root, "dist"),
  };
  cfg.include = [join(stage, "src", "**", "*")];
  delete cfg.exclude;
  const cfgPath = join(stage, "tsconfig.json");
  writeFileSync(cfgPath, JSON.stringify(cfg, null, 2), "utf8");

  rmSync(join(root, "dist"), { recursive: true, force: true });
  execFileSync(process.execPath, [join(root, "node_modules", "typescript", "bin", "tsc"), "-p", cfgPath], {
    stdio: "inherit",
  });

  const count = (d) => readdirSync(d, { recursive: true }).filter((f) => /\.(js|d\.ts)$/.test(String(f))).length;
  console.log(`built dist/ (${count(join(root, "dist"))} files)`);
} finally {
  rmSync(stage, { recursive: true, force: true });
}
