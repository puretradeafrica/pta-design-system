/**
 * Layer 2: SEMANTIC
 *
 * Colour by ROLE, not by name. This is the only colour layer components and
 * applications are permitted to read.
 *
 * Every value here resolves to a Layer 1 constant. Nothing in this file invents a
 * colour, and the lint rule enforces that: a raw hex in this file is an error.
 *
 * Why the indirection matters in practice. A component that writes
 * `identity.navy` has silently decided that page headers are branded navy. A
 * component that writes `surface.chrome` has decided only that it is chrome, and
 * the brand can move underneath it. That is the difference between a rebrand
 * touching one file and touching thirty-five.
 */

import {
  identity, derived, status as brandStatus, sequence, neutral,
  surface as brandSurface, withAlpha,
} from "./brand.ts";

/** Backgrounds, ordered from furthest back to furthest forward. */
export const surface = {
  /** The page itself, behind all cards. */
  page: neutral.n50,
  /** Cards, tables, modals, anything sitting on the page. */
  card: identity.white,
  /** Inset areas inside a card: code blocks, empty states, read-only fields. */
  inset: neutral.n100,
  /** Headers, sidebars, table head rows, footers. White text goes on this. */
  chrome: identity.navy,
  /** Secondary dark surface, for contrast against chrome without going to black. */
  chromeAlt: neutral.n700,
  /** Row hover and selected state. */
  hover: brandSurface.tint,
  /** Selected or active row, same tint used more assertively. */
  selected: brandSurface.tint,
  /** Modal scrim. */
  scrim: withAlpha(identity.navy, 0.45),
} as const;

/**
 * Text, in four levels of emphasis.
 *
 * `primary` is Text Navy (#001A34), deliberately darker than `surface.chrome`
 * (#043553). Keeping them apart is what lets a stage heading, a deal number and a
 * table cell read as three different things. See the note in `brand.ts`.
 */
export const text = {
  /** Body copy, table data, form values. */
  primary: identity.textNavy,
  /** Supporting text, secondary metadata. */
  secondary: neutral.n600,
  /** Column labels, timestamps, placeholder-adjacent text. */
  muted: neutral.n500,
  /** Disabled text, and the emptiness marker in a data cell. */
  faint: neutral.n400,
  /** Text on `surface.chrome` and on any saturated status fill. */
  onChrome: identity.white,
  /** Reduced-emphasis text on chrome, for subtitles under a header title. */
  onChromeMuted: withAlpha(identity.white, 0.72),
  /** Headings and deal identifiers, which sit a step above body text. */
  heading: identity.navy,
} as const;

/** Lines. Three weights of separation, and no more. */
export const border = {
  /** Card outlines, input outlines, table outer edges. */
  default: neutral.n200,
  /** Row separators and other within-card divisions. */
  subtle: neutral.n100,
  /** Strong division, or an input that needs to assert itself. */
  strong: neutral.n300,
  /** Focus ring and active input. */
  focus: identity.blue,
  /** Border on chrome surfaces. */
  onChrome: withAlpha(identity.white, 0.18),
} as const;

/**
 * Elevation.
 *
 * Deliberately shallow: this is a data tool, not a card gallery. Tinted with the
 * brand navy rather than neutral black, so a lifted card reads as part of the
 * palette instead of a grey haze over it.
 */
export const elevation = {
  none: "none",
  raised: `0 1px 2px ${withAlpha(identity.navy, 0.06)}`,
  overlay: `0 4px 16px -4px ${withAlpha(identity.navy, 0.16)}`,
  modal: `0 12px 40px -12px ${withAlpha(identity.navy, 0.32)}`,
} as const;

/**
 * Interactive.
 *
 * There is exactly one accent in this system, the brand blue. Anything that wants
 * to be a second accent is either a status or is wrong.
 */
export const interactive = {
  primary: identity.blue,
  primaryText: identity.white,
  primaryHover: derived.blueHover,
  secondary: identity.navy,
  secondaryText: identity.white,
  /** Quiet buttons: transparent until hovered. */
  ghostText: identity.navy,
  ghostHover: brandSurface.tint,
  /** Links in body copy. */
  link: identity.blue,
  disabledBg: neutral.n100,
  disabledText: neutral.n400,
  focusRing: identity.blue,
} as const;

/**
 * Status.
 *
 * Each state carries three values: `fg` for text and icons on a light ground,
 * `bg` for the badge fill, and `solid` for the rare case that needs a saturated
 * block with white text on it.
 *
 * These are EXPLICIT STATES. The Sales Pipeline currently derives status colour by
 * running five regexes over free text, which is why "Blocked" matches nothing and
 * renders in the same neutral grey as "Not required", making a blocked deal look
 * like a deal with nothing to do. Components take a state, never a string.
 */
export const statusRole = {
  success: { fg: brandStatus.successInk, bg: brandStatus.successBg, solid: brandStatus.success },
  danger:  { fg: brandStatus.dangerInk,  bg: brandStatus.dangerBg,  solid: brandStatus.danger },
  warning: { fg: brandStatus.warningInk, bg: brandStatus.warningBg, solid: brandStatus.warning },
  info:    { fg: brandStatus.infoInk,    bg: brandStatus.infoBg,    solid: brandStatus.info },
  /** Genuinely nothing to do. Visually recessive by design. */
  neutral: { fg: neutral.n400, bg: neutral.n100, solid: neutral.n400 },
} as const;

/** The status states the deal domain actually uses, mapped to roles. */
export type DealState =
  | "confirmed" | "pending" | "blocked" | "notRequired" | "unknown";

export const dealState: Record<DealState, typeof statusRole[keyof typeof statusRole]> = {
  confirmed: statusRole.success,
  pending: statusRole.warning,
  blocked: statusRole.danger,
  notRequired: statusRole.neutral,
  unknown: statusRole.neutral,
};

/**
 * Pipeline stages.
 *
 * The deal lifecycle in order, each mapped to a position in the sequence palette.
 * A stage marks where a deal is, not whether it is in trouble, which is why these
 * do not come from `statusRole`.
 */
export const stage = {
  "New Sales Enquiry": sequence.s1,
  "Waiting for Approval": sequence.s2,
  "Ready to Quote": sequence.s3,
  "Quote Submitted": sequence.s4,
  "Deal Staging": sequence.s5,
  "Active Deal": sequence.s6,
  "Deal Lost / Not Approved": sequence.s7,
  "Deal on Hold": sequence.s8,
} as const;

export type StageName = keyof typeof stage;

/** Stages not in the map fall back to a neutral marker rather than throwing. */
export function stageColor(name: string): string {
  return (stage as Record<string, string>)[name] ?? neutral.n400;
}

/**
 * Data signal, for numbers that carry a judgement.
 *
 * Kept separate from `statusRole` because a below-target GP is not an error. It
 * is a number that needs attention, and it should not shout as loudly as a failed
 * validation.
 */
export const dataSignal = {
  positive: brandStatus.successInk,
  negative: brandStatus.warningInk,
  critical: brandStatus.dangerInk,
  neutral: text.primary,
} as const;

export const semantic = {
  surface, text, border, elevation, interactive,
  status: statusRole, dealState, dataSignal, stage, stageColor,
} as const;
export type Semantic = typeof semantic;
