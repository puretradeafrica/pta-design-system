/* Proves the two rules fire on real Sales Pipeline code and stay silent on good code. */
const path = require("node:path");
const fs = require("node:fs");
const os = require("node:os");
const assert = require("node:assert");

const SP = "C:/Users/Gareth Loudon/OneDrive - Hodari Group/Desktop/Claude Code/Sales Pipeline";
/* Resolved from this file, so the suite always exercises the checkout it lives in. */
const DS = path.resolve(__dirname, "..", "..", "..").split(path.sep).join("/");

console.log("eslint version:", JSON.parse(fs.readFileSync(SP + "/node_modules/eslint/package.json", "utf8")).version);

const { Linter } = require(SP + "/node_modules/eslint");
const plugin = require(DS + "/tools/eslint-plugin-pta-design/index.js");
const linter = new Linter();

const TOKENS_CSS = DS + "/src/css/tokens.css";

// Snippets taken verbatim from the audited Sales Pipeline source.
const CASES = {
  "app/deals/page.tsx": [
    'const NAVY = "#043553";',
    'const BLUE = "#00ADEE";',
    'let bg = "#eef2f6", fg = "#475569";',
    'if (ok) { bg = "#dcfce7"; fg = "#166534"; }',
    'const shade = "rgba(0,173,238,0.18)";',
    'const grad = `linear-gradient(90deg, #86EFAC, #3ECF8E)`;',
  ].join("\n"),

  // Layer 1 is allowed to hold literals.
  "src/tokens/brand.ts": 'export const identity = { blue: "#00ADEE", navy: "#043553" };',

  // Correct usage must produce zero problems.
  "app/good.tsx": [
    'import { semantic } from "@pta/design";',
    "const s = { background: semantic.surface.chrome, color: semantic.text.onChrome };",
  ].join("\n"),

  // Reaching past Layer 2 into Layer 1.
  "app/bad-import.tsx": 'import { brand, identity } from "@pta/design";',
};

let totalErrors = 0;
for (const [file, code] of Object.entries(CASES)) {
  const msgs = linter.verify(
    code,
    [{
      files: ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.mjs"],
      plugins: { "pta-design": plugin },
      languageOptions: { ecmaVersion: 2022, sourceType: "module" },
      rules: {
        "pta-design/no-raw-color": ["error", { tokensCss: TOKENS_CSS }],
        "pta-design/no-layer1-import": "error",
      },
    }],
    { filename: file }
  );
  totalErrors += msgs.length;
  console.log("\n=== " + file + "  ->  " + msgs.length + " problem(s)");
  for (const m of msgs) console.log("   line " + m.line + ": " + m.message);
}
console.log("\ntotal problems:", totalErrors);

/**
 * Regression: an ABSOLUTE filename must still match a cwd-RELATIVE baseline key.
 *
 * ESLint reports `context.filename` absolute, while `scripts/make-baseline.mjs`
 * writes keys relative to process.cwd(). The rule used to build its lookup key
 * from the absolute path, so no baseline entry ever matched and an adopting app
 * kept failing on violations it had explicitly baselined.
 */
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "pta-baseline-"));
const baselinePath = path.join(tmpDir, "pta-design-baseline.json");

const BASELINED_FILE = path.resolve("src", "Fake.jsx");
const BASELINED_REL = path
  .relative(process.cwd(), BASELINED_FILE)
  .split(path.sep).join("/");

const BASELINE_CODE = [
  'const NAVY = "#043553";',                    // line 1, baselined
  'const shade = "rgba(0,173,238,0.18)";',      // line 2, baselined
  'const BLUE = "#00ADEE";',                    // line 3, NOT baselined
].join("\n");

fs.writeFileSync(
  baselinePath,
  JSON.stringify([
    `${BASELINED_REL}:1:#043553`,
    `${BASELINED_REL}:2:rgba`,
  ], null, 2) + "\n",
  "utf8"
);

let baselineMsgs;
try {
  baselineMsgs = linter.verify(
    BASELINE_CODE,
    [{
      files: ["**/*.js", "**/*.ts", "**/*.tsx", "**/*.jsx", "**/*.mjs"],
      plugins: { "pta-design": plugin },
      languageOptions: { ecmaVersion: 2022, sourceType: "module" },
      rules: {
        "pta-design/no-raw-color": ["error", { tokensCss: TOKENS_CSS, baseline: baselinePath }],
      },
    }],
    { filename: BASELINED_FILE }
  );
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

console.log("\n=== " + BASELINED_FILE + " (absolute filename, relative baseline)");
console.log("   baseline keys under: " + BASELINED_REL);
console.log("   -> " + baselineMsgs.length + " problem(s)");
for (const m of baselineMsgs) console.log("   line " + m.line + ": " + m.message);

assert.strictEqual(
  baselineMsgs.length, 1,
  "expected only the non-baselined colour to report, got " + baselineMsgs.length
);
assert.strictEqual(baselineMsgs[0].line, 3, "the reported violation should be the line 3 literal");
assert.ok(
  baselineMsgs[0].message.includes("#00ADEE"),
  "the reported violation should name #00ADEE"
);

console.log("\nbaseline regression: OK");
