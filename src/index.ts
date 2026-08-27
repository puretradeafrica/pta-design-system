/**
 * Package entry point. Applications import from here:
 *
 *     import { semantic, scale, DataTable, StatusPill } from "@pta/design";
 *
 * Layer 2 tokens and Layer 3 components in one place. Layer 1 (`brand`) is
 * re-exported for the CSS generator and document generation only; importing it
 * from application code is a lint error.
 */

export * from "./tokens/index.ts";
export * from "./components/index.ts";
