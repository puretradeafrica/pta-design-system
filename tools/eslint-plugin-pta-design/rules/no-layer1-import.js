/**
 * pta-design/no-layer1-import
 *
 * Application code may read Layer 2 (semantic, scale) and Layer 3 (components).
 * It may not read Layer 1 (`brand`).
 *
 * A component that writes `identity.navy` has silently decided that page headers
 * are branded navy, which puts a brand decision inside a component and defeats the
 * point of the layering. `semantic.surface.chrome` says only "this is chrome" and
 * lets the brand move underneath it.
 *
 * Exempt by default: the CSS generator, and document generation, which legitimately
 * needs the raw brand values.
 */

"use strict";

const path = require("node:path");

const DEFAULT_ALLOW = [
  path.join("src", "tokens"),
  path.join("scripts", "build-css.mjs"),
];

module.exports = {
  meta: {
    type: "problem",
    docs: { description: "Disallow importing Layer 1 brand tokens from application code." },
    schema: [{
      type: "object",
      properties: { allow: { type: "array", items: { type: "string" } } },
      additionalProperties: false,
    }],
    messages: {
      layer1:
        'Do not import "{{name}}" (Layer 1) here. Use semantic.* or scale.* instead, so this file does not encode a brand decision.',
    },
  },

  create(context) {
    const opts = context.options[0] ?? {};
    const filename = (context.filename ?? context.getFilename()).split(path.sep).join("/");
    const allow = [...DEFAULT_ALLOW, ...(opts.allow ?? [])]
      .map((a) => a.split(path.sep).join("/"));
    if (allow.some((a) => filename.includes(a))) return {};

    const BANNED = new Set(["brand", "identity", "derived", "neutral"]);

    return {
      ImportDeclaration(node) {
        const src = String(node.source.value ?? "");
        const isDesign = src === "@pta/design" || /tokens\/brand(\.ts)?$/.test(src);
        if (!isDesign) return;
        for (const spec of node.specifiers) {
          const name = spec.imported?.name ?? spec.local?.name;
          if (name && BANNED.has(name)) {
            context.report({ node: spec, messageId: "layer1", data: { name } });
          }
        }
      },
    };
  },
};
