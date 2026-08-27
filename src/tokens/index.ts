/**
 * Public token barrel.
 *
 * Applications import from here and nowhere else:
 *
 *     import { semantic, scale } from "@pta/design";
 *
 * `brand` is exported for two consumers only: the CSS generator in
 * `scripts/build-css.mjs`, and the pta-branding skill when it generates documents.
 * Application code must not import it. The lint rule flags
 * `import { brand }` outside those paths, because reading Layer 1 from a component
 * is how a component ends up encoding a brand decision.
 */

export { semantic } from "./semantic.ts";
export {
  surface, text, border, elevation, interactive, statusRole, dealState, dataSignal,
  stage, stageColor,
} from "./semantic.ts";
export type { Semantic, DealState, StageName } from "./semantic.ts";

export { scale } from "./scale.ts";
export {
  fontSize, lineHeight, fontWeight, font,
  space, radius, density, control, layout,
} from "./scale.ts";
export { border as borderWidth } from "./scale.ts";
export type { Scale } from "./scale.ts";

/** Layer 1. Generator and document-generation use only. Not for components. */
export { brand, withAlpha } from "./brand.ts";
export type { Brand } from "./brand.ts";
