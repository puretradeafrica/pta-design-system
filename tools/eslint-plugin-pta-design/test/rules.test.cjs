/* Proves the two rules fire on real Sales Pipeline code and stay silent on good code. */
const path = require("node:path");
const fs = require("node:fs");

const SP = "C:/Users/Gareth Loudon/OneDrive - Hodari Group/Desktop/Claude Code/Sales Pipeline";
const DS = "C:/Users/Gareth Loudon/OneDrive - Hodari Group/Desktop/Claude Code/PTA System Design/pta-design-system";

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
