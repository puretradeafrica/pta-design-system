# Building PTA interfaces

Rules for anyone building a PTA application screen, human or Claude. If you are
about to write a colour, a font size, a padding value or a table, read this first.

---

## The one rule

**Never write a colour, size, spacing or radius value directly.** Import it.

```tsx
import { semantic, scale } from "@pta/design";

// Right
<div style={{
  background: semantic.surface.chrome,
  color: semantic.text.onChrome,
  padding: scale.space.md,
  borderRadius: scale.radius.card,
}} />

// Wrong. The lint rule fails the build and names the token you should have used.
<div style={{ background: "#043553", color: "#fff", padding: 12 }} />
```

This is enforced, not advised. `pta-design/no-raw-color` runs in CI. The previous
attempt at a token file was correct and optional, and one of thirty-five components
used it while eighty-six hardcoded hex values accumulated around it. Optional did
not work.

---

## The layers, and which you may touch

```
Layer 1  brand.ts      the palette and typefaces      DO NOT IMPORT
Layer 2  semantic.ts   colour by role                 import this
         scale.ts      type, space, radius, density   import this
Layer 3  components/   Button, DataTable, StatusPill  compose these
```

Applications read Layer 2 and Layer 3. **Importing Layer 1 from app code is a lint
error.** A component that writes `identity.navy` has decided that page headers are
branded navy, which puts a brand decision inside a component. `semantic.surface.chrome`
says only "this is chrome" and lets the brand move underneath it.

The two exceptions, both already allowlisted: the CSS generator, and the
`pta-branding` skill when generating documents.

---

## Picking the right token

Ask what the thing *is*, not what colour it should be.

| You are styling | Use |
|---|---|
| The page background behind cards | `semantic.surface.page` |
| A card, table or modal | `semantic.surface.card` |
| A header, sidebar, table head or footer | `semantic.surface.chrome` |
| Row hover or a selected row | `semantic.surface.hover` |
| Body copy, table data, field values | `semantic.text.primary` |
| A column label or timestamp | `semantic.text.muted` |
| Text sitting on chrome | `semantic.text.onChrome` |
| A section heading or deal number | `semantic.text.heading` |
| A card outline or input border | `semantic.border.default` |
| A row separator | `semantic.border.subtle` |
| The primary action | `semantic.interactive.primary` |
| A Won or Confirmed state | `semantic.status.success` |
| A Lost or Blocked state | `semantic.status.danger` |
| A Pending or Waiting state | `semantic.status.warning` |
| Nothing to do, Not required | `semantic.status.neutral` |
| A GP% above or below target | `semantic.dataSignal.positive` / `.negative` |

If nothing fits, you have probably found a real gap. Say so and propose a Layer 2
addition. Do not reach for a literal.

---

## Status is a state, never a string

The Sales Pipeline derives status colour by running five regular expressions over
free text. `Blocked` matches none of them, so it falls through to the neutral grey
also used for `Not required`, and a blocked deal renders as a deal with nothing to
do. That is the bug this design system was partly built to kill.

```tsx
// Right. An explicit state.
<StatusPill state="blocked" label="Transport Blocked" />

// Wrong. Colour inferred from words.
<span style={{ background: /confirmed/.test(t) ? "#dcfce7" : "#eef2f6" }}>{t}</span>
```

Valid states: `confirmed`, `pending`, `blocked`, `notRequired`, `unknown`.

---

## Typography

Two faces, and one hard boundary.

```tsx
scale.font.display  // Montserrat. 16px AND ABOVE ONLY.
scale.font.body     // Calibri, then Carlito. Everything except display.
scale.font.mono     // Numbers, deal codes, currency. Anything in a column.
```

All three cap heights, measured at 15px, since that is the base size:

| Face | x-height | cap height |
|---|---|---|
| Carlito | 0.467 | 0.600 |
| Geist Mono | 0.533 | 0.733 |
| Montserrat | 0.533 | 0.733 |

**Montserrat below 16px is a mistake.** Its cap height is 0.733 against Carlito's
0.600, and its letterforms are wide, so below 16px its capitals visibly outweigh
the text around them. A section heading uses `font.body` at `fontWeight.bold`, not
Montserrat.

**The base size is 12px, and it is anchored to the shipped app.** Not chosen,
measured. Resolving the current Sales Pipeline's real CSS chain (`html` at 15px,
Tailwind `text-sm` = 13.13px, then `transform: scale(0.92)`) gives 12.08px of
effective table text. `fontSize.body` is 12px so the board keeps the density
traders already work at.

Do not "correct" this upward on the reasoning that Carlito draws small. That
reasoning is about matching a normal-width face in the abstract, not about matching
this app, and applying it set the board 24% larger than the thing it replaced.

| Role | Shipped app, effective | Token |
|---|---|---|
| Table text | 12.08px | `fontSize.body` 12 |
| Group heading | 12.08px | `fontSize.body` 12 |
| Column label | 10.12px | `fontSize.meta` 10 |
| Sub-label | 10.12px | `fontSize.meta` 10 |
| Page title | 15.53px | `fontSize.heading` 16 |

**Control text matches body, but hit targets do not.** `control.fontSize` is 12px,
the same as a table cell, so a button does not outweigh the data beside it. The
target stays at `control.minTarget` (26px). The shipped app's problem was 9.66px
text inside a 22px target, which is two problems, and only one of them is size.

**Figures use the body face, not a mono.** Calibri's digits are tabular (all ten
share one advance width) and lining (digit height matches cap height), so a
currency column aligns without changing face.

```tsx
// Right. Same face, same size, digits line up.
<td style={{ fontVariantNumeric: "tabular-nums lining-nums", textAlign: "right" }}>$2,620,860</td>

// Wrong. A visible face change mid-row, a slashed zero, and a size mismatch to correct.
<td style={{ fontFamily: scale.font.mono }}>$2,620,860</td>
```

`<DataTable>` does this for any column marked `numeric`; `<Num>` does it for a
figure anywhere else. `scale.font.mono` is Consolas and exists for CODE ONLY: SQL,
JSON, log output. Never money.

Watch for the slashed zero specifically. Code fonts slash the zero to tell it from
a capital O, which is right in a terminal and reads as a defect on an invoice.

**Calibri comes before Carlito in the stack, and the order matters for digits.**
Measured ascent spread across the ten digits, at 100px:

| Face | Spread | |
|---|---|---|
| Calibri | 1 unit | uniform |
| Carlito | 5 units | the 6 and the 8 overshoot the cap line |

They are metrically identical, so which one resolves changes nothing about layout.
It changes the figures. Every PTA machine is Windows, so Calibri resolves and a
column of numbers sits flat. Do not reverse the order to "guarantee consistent
rendering": metric compatibility already guarantees consistent layout, and
reversing it costs the better digits for nothing.

**Always pin `lineHeight`.** Never leave it at `normal`. Left unpinned, faces vary
by 29% in line box height; pinned, they are identical. Pinning is what makes row
height a property of the design system rather than of the font.

**Carlito has no 500 or 600 weight.** Only 400 and 700 exist. Hierarchy comes from
size and colour. Do not reach for `fontWeight.medium` on body text; it silently
renders as 400.

---

## Things that are settled, so do not reintroduce them

- **No page zoom.** `transform: scale(0.92)` on a root element softens every edge
  in the interface. It was removed deliberately. `scale.layout.pageScale` is 1 and
  exists only to be explicit about it.
- **No `0.7rem` controls.** Control text is `scale.control.fontSize` (12px) with a
  minimum 26px target. The text matches the data; the target is what got bigger.
- **One shared column template per table.** A board that renders each group as its
  own `<table>` with auto layout drifts columns by up to 64px between groups, which
  breaks vertical scanning. Use one `<colgroup>` across all groups.
- **Colour is not the accent budget.** There is exactly one accent, brand blue.
  Anything wanting to be a second accent is either a status or is wrong.
- **Solid saturated fills are for emphasis, not for every row action.** Won and
  Lost buttons became the highest-contrast thing on the board and pulled the eye off
  the deal values. Quiet by default, saturated on hover.

---

## Adding a token

Layer 1 and Layer 2 additions need Gareth's approval. Layer 3 components do not.
This keeps the palette closed while leaving component work unblocked.

If you add or change a token:

```bash
node scripts/build-css.mjs
```

`tokens.css` is generated from the TypeScript, and CI runs
`npm run check:css` which fails if the committed CSS is stale. The lint rule reads
its suggestion list from that same generated CSS, so a new token becomes suggestable
automatically.

---

## Documents, not just screens

Screens and documents share Layer 1 deliberately. The whole reason Carlito was
chosen is that it is metrically identical to Calibri, so a quote on screen, the same
quote as a PDF and the same quote as a Word file all set identically.

That parity holds only if the deployment steps in `brand.fontDeployment` are done:
Carlito and Montserrat installed on workstations, both embedded in generated PDFs,
font embedding enabled for Office files sent outside PTA, and Geist removed from the
apps. If you are generating a document, use `scale.font.printHeading` and
`scale.font.printBody`, which resolve to the same faces as the screen stacks.

---

## Verifying your work

Before saying a screen is done:

```bash
npm run lint        # zero pta-design errors
npm run check:css   # tokens.css matches the TypeScript
npm test            # the lint rules still behave
```

Then look at it. Check the numbers line up in their columns, that row heights are
even, and that nothing in a table is below 28px if it is clickable.
