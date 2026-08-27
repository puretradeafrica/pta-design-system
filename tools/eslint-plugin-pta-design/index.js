"use strict";

const noRawColor = require("./rules/no-raw-color");
const noLayer1Import = require("./rules/no-layer1-import");

const plugin = {
  meta: { name: "eslint-plugin-pta-design", version: "1.0.0" },
  rules: {
    "no-raw-color": noRawColor,
    "no-layer1-import": noLayer1Import,
  },
};

/**
 * Flat-config presets.
 *
 *   recommended  both rules as errors. Use on new code.
 *   migrating    same rules, but a baseline path is expected so pre-existing
 *                violations stay quiet while anything new fails.
 */
plugin.configs = {
  recommended: {
    plugins: { "pta-design": plugin },
    rules: {
      "pta-design/no-raw-color": "error",
      "pta-design/no-layer1-import": "error",
    },
  },
};

module.exports = plugin;
