/**
 * Layer 1: BRAND
 *
 * The only file in this repository permitted to contain a raw colour value.
 * `eslint-plugin-pta-design/no-raw-color` allowlists this path and nothing else.
 *
 * Nothing in an application may import from this file. Applications read Layer 2
 * (`semantic.ts`) and Layer 3 (components). That indirection is what lets the
 * brand change without touching a single component.
 *
 * SOURCE OF TRUTH: "Brand Profile and CI", 11pp PDF, palette on p8, typography
 * on p10. Where the `pta-branding` skill disagrees with the CI, the CI wins and
 * the skill is the thing that needs correcting.
 */

/**
 * The PTA palette.
 *
 * Sourced from the logo artwork itself, cross-checked against the Brand Profile
 * and CI document (p8). Where the two disagree, the logo wins: it is the artefact
 * that actually appears on every document, screen and letterhead.
 *
 * VERIFIED 26 Aug 2026 by sampling `logo_color_horizontal.png` pixel by pixel:
 *   blue #00ADEE  = 98.8% of all blue pixels
 *   navy #043553  = 100%   of all dark pixels
 *
 * The CI document's palette page has a typo that nearly caused a pointless
 * estate-wide sweep. It prints the hex label `#00AAEF` but gives the RGB as
 * 000 | 174 | 239, which is `#00AEEF`, not `#00AAEF`. The logo is `#00ADEE`
 * (RGB 0 | 173 | 238), within one step of the document's own RGB. So `#00ADEE`
 * is correct, the printed hex label is wrong, and the applications have been
 * right all along.
 *
 * Likewise `#043553` does not appear on the CI palette page but is exactly the
 * navy in the logo artwork. It is a brand colour, not an invention.
 */
export const identity = {
  /** Brand blue, from the logo. The single accent: active state, links, emphasis. */
  blue: "#00ADEE",
  /** Brand navy, from the logo. Chrome: headers, sidebars, table heads, footers. */
  navy: "#043553",
  /** Text Navy, CI p8 "Pure Navy". Body copy on light surfaces. Darker than chrome. */
  textNavy: "#001A34",
  /** Pure White, CI p8. Surfaces on light grounds, text on dark. */
  white: "#FFFFFF",
  /** Light Gray, CI p8. Muted text, rules, disabled states. */
  grayLight: "#A7A7A7",
  /** Dark Gray, CI p8. Secondary dark surface, distinct from both navies. */
  grayDark: "#33343D",
} as const;

/**
 * Derived brand steps.
 *
 * Not separate identity colours: these are computed shades of `identity.blue`
 * needed for interaction states. They live here rather than in `semantic.ts` so
 * that Layer 2 can stay free of literals and the lint rule can police it without
 * exceptions.
 */
export const derived = {
  /** `identity.blue` darkened ~10% for hover and active. */
  blueHover: "#0098D1",
  /** `identity.blue` darkened ~20% for pressed. */
  bluePressed: "#0086BA",
} as const;

/**
 * Alpha helper.
 *
 * Overlays (scrims, hairlines on chrome, muted text on navy) must be translucent
 * so they composite over whatever is behind them. Deriving them from a brand hex
 * keeps them tied to the palette instead of being hand-written rgba values.
 */
export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Why there are two darks, and when to use which.
 *
 * `navy` (#043553) is lighter and sits behind white text on chrome. `textNavy`
 * (#001A34) is darker and sits on white as body copy. Keeping them distinct is
 * what lets a stage-group heading, a deal number and a table cell read as three
 * different things. Collapsing both to #001A34 was tested and costs a level of
 * hierarchy, so it is deliberately not done.
 */

/**
 * Status ramp. The single official set, for screens AND documents.
 *
 * DECIDED 26 Aug 2026 by Gareth: "make them as per our branding."
 *
 * There was no existing brand answer to inherit. The Brand Profile and CI defines
 * no green, red or amber at all, and an audit of real PTA output on 26 Aug 2026
 * found every document had invented its own:
 *
 *   Client Logistics mockups (x6)     green #1F9D57  red #C0392B
 *   Q1 Settled Deals variance         green #0A8A3F  red #C62828
 *   Redwood book reviews (x2)         green #0B7A43  red #B3261E
 *   Data Platform architecture        green #00B050
 *   Sales Pipeline app                green #16A34A  red #DC2626
 *   pta-branding skill                green #00B050  red #FF0000
 *
 * Six greens, six reds, no standard. Measuring each against the two candidate
 * ramps by RGB distance settled which family PTA output actually belongs to:
 *
 *   reds   mean distance to #DC2626 = 50.0   to #FF0000 = 104.6
 *   greens mean distance to #16A34A = 37.7   to #00B050 =  45.6
 *
 * Every single document red is closer to #DC2626 than to #FF0000, and nothing
 * outside the skill has ever used #FF0000. So these values are not a new
 * invention: they are the centre of what PTA documents already look like.
 *
 * The pta-branding skill must be updated to these, replacing #00B050 and
 * #FF0000, so an Excel status cell matches the pill in the app.
 */
export const status = {
  success: "#16A34A",
  successInk: "#166534",
  successBg: "#DCFCE7",

  danger: "#DC2626",
  dangerInk: "#991B1B",
  dangerBg: "#FEE2E2",

  warning: "#F59E0B",
  warningInk: "#92400E",
  warningBg: "#FEF3C7",

  info: "#0EA5E9",
  infoInk: "#075985",
  infoBg: "#E0F2FE",
} as const;

/**
 * A note on optical size, kept because the measurement cost real time.
 *
 * Two faces set at the same pixel size do not look the same size: what the eye
 * reads as size is cap height. Measured 27 Aug 2026 at 15px, Carlito's cap height
 * is 0.600 and Geist Mono's 0.733, so a mono figure set at the body step read 22%
 * taller and 32% wider than the text beside it.
 *
 * An earlier version carried an `opticalScale` factor and a derived `fontSizeMono`
 * ramp to correct for that. Both are gone, because the correction was solving a
 * problem that did not need to exist: Carlito's own digits are tabular and lining,
 * so figures never needed a different face. Removing the face swap removed the
 * mismatch, the slashed zero and the correction in one go.
 *
 * The rule that survives: if you ever DO set two faces at the same size in the
 * same line, compare their cap heights first.
 */

/**
 * Sequence palette.
 *
 * Distinguishable hues for ORDERED CATEGORIES, where the colour marks position in
 * a sequence rather than a judgement. Pipeline stages are the first consumer;
 * categorical chart series will be the second.
 *
 * Deliberately not part of `status`. Colouring an early-stage deal as "warning"
 * would say something untrue about a deal that is simply early. A stage is a
 * position, not a problem.
 *
 * These are the values the Sales Pipeline already ships, kept so that adopting
 * the design system changes no stage colour on the board.
 */
export const sequence = {
  s1: "#EAB308", // amber, earliest
  s2: "#F59E0B", // deeper amber
  s3: "#0EA5E9", // sky
  s4: "#7C3AED", // violet
  s5: "#00ADEE", // brand blue
  s6: "#16A34A", // green, complete
  s7: "#DC2626", // red, terminated
  s8: "#9F1239", // deep rose, held
} as const;

/**
 * Neutral ramp.
 *
 * The CI gives two greys and no ramp, which is not enough for an interface that
 * needs borders, rules, hovers and four levels of text. These are derived by
 * interpolating between `identity.white` and `identity.grayDark`, biased cool so
 * they sit correctly beside the navy rather than reading as a separate grey.
 *
 * `n400` and `n700` are pinned to the two CI greys so the ramp passes through the
 * brand rather than merely near it.
 */
export const neutral = {
  n0: "#FFFFFF",
  n50: "#F7F8FA",
  n100: "#F0F2F5",
  n200: "#E1E5EA",
  n300: "#C7CCD3",
  n400: "#A7A7A7", // CI Light Gray
  n500: "#7C8590",
  n600: "#5A626C",
  n700: "#33343D", // CI Dark Gray
  n900: "#001A34", // CI Pure Navy
} as const;

/**
 * Surface tint.
 *
 * `#E8F6FD` is used across the apps and the skill for row hover, selected state
 * and alternating table rows. A light tint of `identity.blue`, derived rather than
 * part of the identity, so it lives here rather than in `identity`.
 */
export const surface = {
  tint: "#E8F6FD",
} as const;

/**
 * Typeface stacks.
 *
 * The CI (p10) specifies print and web separately, which the branding skill did
 * not carry over:
 *
 *   Print headings  Montserrat Bold      Print body  Calibri Light
 *   Web headings    Trebuchet MS         Web body    Verdana
 *
 * DECIDED 26 Aug 2026 by Gareth: Montserrat display + Carlito body.
 *
 * Driven by the requirement that a printed document match the web view.
 * Carlito is metrically identical to Calibri: same glyph widths, same line
 * breaks. So one stack serves screen, PDF and Office, and a recipient without
 * Carlito installed falls back to Calibri with the layout unchanged. No other
 * candidate can promise that, because any other face substitutes to something
 * with different metrics and the document reflows.
 *
 * Montserrat is restricted to display, 18px and up, per the CI's own print rule.
 * It has a 0.77 cap height against 0.69 for most faces plus wide letterforms, so
 * below 18px its capitals visibly outweigh the text around them. Section headings
 * use `body` at weight 700 instead.
 *
 * Measured trade-offs accepted here:
 *   - Carlito ships 400 and 700 only. Hierarchy comes from size and colour, not
 *     from a 500 weight. See `scale.ts`.
 *   - Carlito runs small: cap height 0.62, x-height 0.46, against roughly 0.69
 *     and 0.54 elsewhere. The base size token starts at 15px, not 13px, to
 *     compensate. This also fixes the 0.7rem controls in the current app.
 *
 * Vertical space is NOT a factor in this choice. Left at `line-height: normal`
 * the candidates span 14.0px to 18.0px at 13px, a 29% spread, but with
 * line-height pinned at 1.5 every one produces an identical 59px for three lines.
 * Height is a token. Width is not, which is why width drove the shortlist.
 */
export const type = {
  /** Display and page titles only, 18px and up. Never below. */
  display: "'Montserrat', 'Trebuchet MS', sans-serif",
  /**
   * Section headings, body, labels and table data. Same face as documents.
   *
   * CALIBRI FIRST, Carlito second. Both, in that order, deliberately.
   *
   * Carlito is metrically identical to Calibri, so which one resolves changes
   * nothing about layout: same advance widths, same line breaks, same column
   * widths. What it does change is the digits. Measured 27 Aug 2026, ascent spread
   * across the ten digits at 100px:
   *
   *   Calibri   1 unit   uniform
   *   Carlito   5 units  the 6 and the 8 overshoot the cap line
   *
   * At body size that is about 0.6px of jitter on two digits, which is visible in
   * a column of figures and is not there in real Calibri. Every PTA machine is
   * Windows, so Calibri resolves and the numbers sit flat. Anything else gets
   * Carlito as the webfont fallback and loses nothing but that 0.6px.
   *
   * An earlier version had Carlito first, to guarantee byte-identical rendering
   * everywhere. Metric compatibility already guarantees identical LAYOUT, which is
   * the thing that actually matters, so that ordering bought nothing and cost the
   * better digits.
   */
  body: "Calibri, 'Carlito', 'Segoe UI', sans-serif",
  /**
   * CODE ONLY: SQL, JSON, log output, raw identifiers in a debug view.
   *
   * NOT for figures. Carlito's own digits are tabular (all ten are the same
   * advance width) and lining (digit height matches cap height), measured
   * 27 Aug 2026, so currency, volumes and deal codes set in `body` with
   * `font-variant-numeric: tabular-nums` already align in a column and match the
   * text beside them.
   *
   * Using a mono for money cost three things: a visible change of face mid-row, a
   * slashed zero (a coding convention that reads as an error on an invoice), and
   * an optical size mismatch that had to be corrected for. None of it bought
   * anything Carlito was not already doing.
   *
   * Consolas rather than Geist Mono: Geist is not a PTA brand face, it ships with
   * Windows and Office alongside Calibri, and it needs no webfont.
   */
  mono: "Consolas, 'Cascadia Mono', ui-monospace, monospace",
  /**
   * Document generation. Deliberately the same faces as the screen stacks above:
   * that identity is the whole point. Kept as separate keys so the pta-branding
   * skill can consume them without importing screen concerns.
   */
  printHeading: "Montserrat, 'Trebuchet MS', sans-serif",
  printBody: "Calibri, Carlito, sans-serif",
} as const;

/**
 * Deployment requirements that follow from the choice above. These are not
 * optional: skip them and the print-versus-web parity this was chosen for is lost.
 *
 *  1. Install Carlito and Montserrat on every PTA machine. Both are SIL OFL, so
 *     redistribution is permitted. Carlito also ships with LibreOffice.
 *  2. Embed both in generated PDFs. ReportLab embeds by default once the TTF is
 *     registered; OFL permits embedding.
 *  3. For .docx and .xlsx leaving PTA, enable "Embed fonts in the file" so
 *     Montserrat headings survive. Carlito body text is safe either way, because
 *     Calibri substitutes with identical metrics.
 *  4. Remove Geist and Geist Sans from the apps. `layout.tsx` loads Geist, and
 *     `QuoteBuilder.tsx` line 861 sets the customer-facing A4 quote preview to
 *     `var(--font-geist-sans)`, so every quote sent to a client is currently
 *     typeset in a face that appears in neither the CI nor the branding skill.
 *     Geist Mono may stay for numerals, or move to a Carlito-compatible mono.
 */
export const fontDeployment = {
  installOnWorkstations: ["Carlito", "Montserrat"],
  embedInPdf: true,
  embedInOfficeFilesSentExternally: true,
  removeFromApps: ["Geist", "Geist Sans"],
} as const;

/** Company constants. Address and phone taken from the CI, p2. */
export const company = {
  name: "Pure Trade Africa",
  legalName: "Pure Trade Africa (Pty) Ltd",
  address: "1st Floor, 29 Richefond Circle, Ridgeside Office Park",
  city: "Umhlanga Rocks, South Africa",
  postal: "PO Box 4089, La Lucia, South Africa, 4019",
  /** DECIDED 26 Aug 2026 by Gareth. The CI PDF (p2) says 0845 and is out of date. */
  phone: "+27 (31) 818 0840",
  website: "https://puretradeafrica.com",
  email: "info@puretradeafrica.com",
} as const;

export const brand = { identity, derived, status, sequence, neutral, surface, type, company, fontDeployment } as const;
export type Brand = typeof brand;
