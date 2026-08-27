/**
 * Layer 2: SCALE
 *
 * Everything dimensional: type, space, radius, borders, density, layout.
 * No colour appears in this file. Elevation lives in `semantic.ts` because a
 * shadow carries a colour, and Layer 2 colour must resolve to Layer 1.
 *
 * DECIDED 26 Aug 2026 by Gareth: Direction A, "tighten, keep the look".
 * The board keeps its navy header, white stage cards and dense rows. These values
 * fix the defects rather than re-proportioning the interface.
 */

import { type as brandType } from "./brand.ts";

/**
 * Type ramp.
 *
 * Eight steps, replacing the eleven ad hoc sizes found in the Sales Pipeline audit.
 *
 * ANCHORED TO THE SHIPPED APP. Measured 27 Aug 2026 by resolving the current
 * Sales Pipeline's actual CSS chain, `html { font-size: 15px }` then Tailwind
 * `text-sm` (0.875rem = 13.13px) then `.app-root { transform: scale(0.92) }`:
 *
 *   role                shipped effective   token
 *   table text                12.08px       body      13
 *   group heading             12.08px       body      13
 *   column label              10.12px       meta      10
 *   sub-label under a value   10.12px       meta      10
 *   page title                15.53px       heading   17
 *
 * The ramp was matched to those values, then lifted one step on 27 Aug 2026 at
 * Gareth's request: `body` 12 -> 13 and `meta` 10.5 -> 11. So the board now sits
 * fractionally above the shipped density rather than exactly on it, which is a
 * deliberate readability choice, not drift.
 *
 * An earlier version set `body` to 15px on the reasoning that Carlito draws small.
 * That reasoning is about matching a normal-width face in the abstract, not about
 * matching this app, and it made every row 24% larger than the board it replaced.
 *
 * The 0.92 page transform is NOT reproduced. It softens every edge, so the sizes
 * above are the post-transform values written directly.
 *
 * `heading` and above are the only steps that may use `font.display` (Montserrat).
 * At 16px its cap height is 11.7px against body's 7.2px, which is the hierarchy a
 * page title wants. Below that its capitals start to outweigh the text around them.
 */
export const fontSize = {
  micro: 9,       // smallest metadata. Use sparingly
  meta: 11,       // column labels, badge text, sub-labels
  caption: 12,    // captions, footnotes
  body: 13,       // DEFAULT. Table data, form fields, paragraphs
  bodyLg: 14,     // emphasised body, drawer intro text
  heading: 17,    // page and section titles. Floor for `font.display`
  display: 22,    // KPI figures
  displayLg: 28,  // hero numbers
} as const;

/**
 * Line height.
 *
 * Pinned, never left to `normal`. Measured 26 Aug 2026: at `line-height: normal`
 * the candidate faces spanned 14.0px to 18.0px at 13px, a 29% spread, but pinned
 * at 1.5 every one produced an identical 59px for three lines. Pinning is what
 * makes row heights a property of the design system rather than of the font.
 */
export const lineHeight = {
  tight: 1.2,     // display, headings, single-line table cells
  snug: 1.35,     // multi-line cells, badges
  normal: 1.5,    // DEFAULT. Body copy, paragraphs
  relaxed: 1.65,  // long-form prose in drawers and documents
} as const;

/**
 * Font weight.
 *
 * Carlito ships 400 and 700 only, with no 500 or 600. That is a deliberate
 * accepted trade-off (see `brand.ts`), so hierarchy comes from SIZE and COLOUR,
 * never from a mid weight. `medium` is defined for Montserrat display text only.
 */
export const fontWeight = {
  regular: 400,
  medium: 500,  // Montserrat display only. Carlito will round this to 400.
  bold: 700,
} as const;

export const font = brandType;

/**
 * Spacing.
 *
 * A 4px base grid. Direction A keeps the current row rhythm, so table padding
 * stays at `sm` vertical and `md` horizontal rather than moving up a step.
 */
export const space = {
  none: 0,
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

/**
 * Radius.
 *
 * Replaces the six inline `borderRadius` values and five Tailwind `rounded-*`
 * scales found in the audit.
 */
export const radius = {
  none: 0,
  badge: 5,
  button: 8,
  card: 12,
  pill: 999,
} as const;

/**
 * Border width.
 *
 * `hair` renders crisply on retina and falls back to a slightly lighter 1px on
 * standard-density screens, which still reads correctly.
 */
export const border = {
  hair: 0.5,
  thin: 1,
  thick: 2,
  accent: 3,
} as const;

/**
 * Density.
 *
 * One switch for table and list rhythm, so Pure Track can run denser than the
 * Sales Pipeline without either app hand-rolling its padding. `default` is
 * Direction A as decided.
 */
/**
 * Row height, reserved for two lines of cell text.
 *
 * PTA client names are long ("Ruashi Mining SAS (Musonoi Project)") so some wrap
 * and some do not, which left rows at 54px and 58px in the same group. Reserving
 * the two-line height makes every row identical whether its content wraps or not,
 * which is what lets the eye track across a wide board.
 *
 * Derived rather than hand-set, so changing the type ramp cannot leave it stale.
 * The +1 accounts for the row separator.
 */
const rowHeightFor = (fs: number, padY: number) =>
  Math.round(fs * lineHeight.snug * 2 + padY * 2) + 1;

export const density = {
  compact: {
    rowPaddingY: space.xs, cellPaddingX: space.sm,
    fontSize: fontSize.caption,
    rowHeight: rowHeightFor(fontSize.caption, space.xs),
  },
  default: {
    rowPaddingY: space.sm, cellPaddingX: space.md,
    fontSize: fontSize.body,
    rowHeight: rowHeightFor(fontSize.body, space.sm),
  },
  relaxed: {
    rowPaddingY: space.md, cellPaddingX: space.lg,
    fontSize: fontSize.body,
    rowHeight: rowHeightFor(fontSize.body, space.md),
  },
} as const;

/**
 * Interactive sizing.
 *
 * `min` is the floor for anything clickable. The current app's row actions are
 * 22px, which is below comfortable, and its controls are 10.5px text. Both are
 * fixed here.
 */
export const control = {
  heightSm: 26,
  height: 30,
  heightLg: 38,
  minTarget: 26,
  fontSize: fontSize.body,
  paddingX: space.sm + 2,
} as const;

/**
 * Layout constants that more than one app needs to agree on.
 *
 * NOTE: `pageScale` is 1. The Sales Pipeline currently applies
 * `transform: scale(0.92)` to `.app-root`, which softens every edge in the
 * interface. Direction A removes it. There is no token for a page zoom because
 * there should never be one.
 */
export const layout = {
  sidebarWidth: 200,
  sidebarCollapsedWidth: 56,
  headerHeight: 52,
  contentMaxWidth: 1440,
  pageScale: 1,
} as const;

export const scale = {
  fontSize, lineHeight, fontWeight, font,
  space, radius, border, density, control, layout,
} as const;
export type Scale = typeof scale;
