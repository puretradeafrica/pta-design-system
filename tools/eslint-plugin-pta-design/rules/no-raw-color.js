/**
 * pta-design/no-raw-color
 *
 * Flags any colour literal in application code and names the token to use instead.
 *
 * This rule is the reason the design system will hold where the previous
 * `tokens.ts` did not. That file was correct and optional; every builder found it
 * faster to type `#00ADEE` than to find the import, and nothing objected. The
 * audit that started this work found 86 distinct hex values across 35 components
 * and 19 files each redeclaring their own `const NAVY`.
 *
 * The suggestion list is read from the GENERATED `src/css/tokens.css`, which is
 * itself emitted from the TypeScript tokens. So the rule cannot drift from the
 * palette: add a token, regenerate, and the rule knows about it.
 *
 * Options:
 *   allow    string[]  extra file path fragments exempt from the rule
 *   tokensCss string   path to tokens.css (default: resolved from this package)
 *   baseline string    path to a JSON baseline of known violations, reported as
 *                      warnings instead of errors so a large codebase can adopt
 *                      the rule without a single flag-day sweep
 */

"use strict";

const fs = require("node:fs");
const path = require("node:path");

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/g;
const FUNC = /\b(?:rgba?|hsla?)\s*\(/g;

/** Layer 1 is the only place a raw colour may live. */
const DEFAULT_ALLOW = [
  path.join("src", "tokens", "brand.ts"),
];

let tokenCache = null;

function loadTokens(tokensCssPath) {
  if (tokenCache) return tokenCache;
  const out = [];
  try {
    const css = fs.readFileSync(tokensCssPath, "utf8");
    const re = /--(pta-[a-z0-9-]+)\s*:\s*([^;]+);/g;
    let m;
    while ((m = re.exec(css))) {
      const name = m[1];
      const value = m[2].trim();
      const hex = value.match(/^#([0-9a-fA-F]{6})$/);
      if (hex) out.push({ name, value, rgb: toRgb(value) });
      else if (/^rgba?\(/.test(value)) out.push({ name, value, rgb: null });
    }
  } catch {
    // No tokens.css yet. The rule still reports, just without a suggestion.
  }
  tokenCache = out;
  return out;
}

function toRgb(hex) {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6) return null;
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/**
 * Beyond this RGB distance the "nearest" token is not useful advice, so the rule
 * says so instead of naming a colour the author clearly did not mean.
 * #86EFAC matching text.faint at distance 79 is noise, not a suggestion.
 */
const NEAR_LIMIT = 32;

/**
 * When several tokens share a value (brand blue is both `interactive.primary` and
 * `border.focus`), name the one an author is most likely to want.
 */
const GROUP_PREFERENCE = [
  "pta-surface-", "pta-text-", "pta-status-",
  "pta-signal-", "pta-interactive-", "pta-border-", "pta-shadow-",
];

function preferenceRank(name) {
  const i = GROUP_PREFERENCE.findIndex((g) => name.startsWith(g));
  return i === -1 ? GROUP_PREFERENCE.length : i;
}

/** Nearest token by straight RGB distance, tie-broken by group preference. */
function nearest(hex, tokens) {
  const rgb = toRgb(hex);
  if (!rgb) return null;
  let best = null;
  let bestD = Infinity;
  for (const t of tokens) {
    if (!t.rgb) continue;
    const d = Math.hypot(rgb[0] - t.rgb[0], rgb[1] - t.rgb[1], rgb[2] - t.rgb[2]);
    if (d < bestD - 0.001) { bestD = d; best = t; continue; }
    if (Math.abs(d - bestD) < 0.001 && best &&
        preferenceRank(t.name) < preferenceRank(best.name)) { best = t; }
  }
  if (!best) return null;
  return {
    token: best,
    distance: Math.round(bestD),
    exact: bestD === 0,
    useful: bestD <= NEAR_LIMIT,
  };
}

/** camelCase accessor for the message, e.g. pta-surface-chrome -> surface.chrome */
function accessor(tokenName) {
  const parts = tokenName.replace(/^pta-/, "").split("-");
  const group = parts.shift();
  const rest = parts
    .map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1)))
    .join("");
  const groupMap = {
    surface: "semantic.surface", text: "semantic.text", border: "semantic.border",
    interactive: "semantic.interactive", status: "semantic.status",
    signal: "semantic.dataSignal", shadow: "semantic.elevation",
    font: "scale.font", space: "scale.space", radius: "scale.radius",
    leading: "scale.lineHeight", weight: "scale.fontWeight",
    control: "scale.control", layout: "scale.layout", density: "scale.density",
  };
  return `${groupMap[group] ?? group}.${rest || group}`;
}

function loadBaseline(baselinePath) {
  if (!baselinePath) return null;
  try {
    return new Set(JSON.parse(fs.readFileSync(baselinePath, "utf8")));
  } catch {
    return null;
  }
}

module.exports = {
  meta: {
    type: "problem",
    docs: {
      description:
        "Disallow raw colour literals. Colour must come from the shared design tokens.",
    },
    schema: [{
      type: "object",
      properties: {
        allow: { type: "array", items: { type: "string" } },
        tokensCss: { type: "string" },
        baseline: { type: "string" },
      },
      additionalProperties: false,
    }],
    messages: {
      rawColorWithToken:
        'Raw colour "{{color}}". Use {{accessor}} ({{tokenValue}}) from "@pta/design".',
      rawColorNear:
        'Raw colour "{{color}}". Nearest token is {{accessor}} ({{tokenValue}}), {{distance}} away. Use a token, or add one to brand.ts if this is genuinely a new brand colour.',
      rawColorUnknown:
        'Raw colour "{{color}}". No token is close to this. Pick the semantic role you mean (semantic.surface / text / border / interactive / status), or add it to brand.ts if it is genuinely a new brand colour.',
      colorFunction:
        'Raw {{fn}}() colour. Use a token from "@pta/design", or withAlpha() in brand.ts if you need transparency.',
    },
  },

  create(context) {
    const opts = context.options[0] ?? {};
    const filename = context.filename ?? context.getFilename();
    const norm = filename.split(path.sep).join("/");
    /**
     * The baseline key is cwd-relative, because that is the form
     * `scripts/make-baseline.mjs` writes ("src/PredictModal.jsx:100:#043553").
     * ESLint hands the rule an absolute path, so relativise it before looking a
     * violation up, or nothing in the baseline ever matches and every baselined
     * hit still fails the adopting app's build. A filename that is already
     * relative resolves against cwd first, so this holds either way.
     */
    const relNorm = path.relative(process.cwd(), filename).split(path.sep).join("/");

    const allow = [...DEFAULT_ALLOW, ...(opts.allow ?? [])]
      .map((a) => a.split(path.sep).join("/"));
    if (allow.some((a) => norm.endsWith(a) || norm.includes(a))) return {};

    const tokensCss = opts.tokensCss
      ? path.resolve(opts.tokensCss)
      : path.resolve(__dirname, "..", "..", "..", "src", "css", "tokens.css");
    const tokens = loadTokens(tokensCss);
    const baseline = loadBaseline(opts.baseline);

    function key(node, color) {
      const loc = node.loc.start;
      return `${relNorm}:${loc.line}:${color}`;
    }

    function reportColor(node, raw) {
      HEX.lastIndex = 0;
      let m;
      while ((m = HEX.exec(raw))) {
        const color = m[0];
        const near = nearest(color, tokens);
        // A baselined violation is pre-existing: warn so it is visible, but do
        // not fail the build. The baseline may only ever shrink.
        const inBaseline = baseline?.has(key(node, color));
        const messageId = !near || !near.useful
          ? "rawColorUnknown"
          : near.exact
            ? "rawColorWithToken"
            : "rawColorNear";
        const data = {
          color,
          accessor: near ? accessor(near.token.name) : "",
          tokenValue: near ? near.token.value : "",
          distance: near ? String(near.distance) : "",
        };
        if (inBaseline) {
          // ESLint has no per-report severity, so a baselined hit is surfaced
          // through the baseline report script rather than here.
          continue;
        }
        context.report({ node, messageId, data });
      }

      FUNC.lastIndex = 0;
      let f;
      while ((f = FUNC.exec(raw))) {
        const fn = f[0].replace(/\s*\($/, "");
        if (baseline?.has(key(node, fn))) continue;
        context.report({ node, messageId: "colorFunction", data: { fn } });
      }
    }

    return {
      Literal(node) {
        if (typeof node.value !== "string") return;
        reportColor(node, node.value);
      },
      TemplateElement(node) {
        const raw = node.value?.raw;
        if (typeof raw === "string") reportColor(node, raw);
      },
    };
  },
};
