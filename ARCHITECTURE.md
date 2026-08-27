# PTA Design System: Architecture

**Status:** tokens, primitives and enforcement built and verified, 27 Aug 2026
**Owner:** Gareth Loudon
**Decision record for:** how every PTA application gets a consistent interface

---

## 1. The problem this solves

The Sales Pipeline already had a design token file. It did not work.

An audit of `Sales Pipeline/src` on 25 Aug 2026 found:

| Measure | Count |
|---|---|
| `.tsx` files in the app | 35 |
| Files importing the shared tokens barrel | **1** |
| Distinct hardcoded hex values | **86** |
| Files redeclaring their own `const NAVY` / `const BLUE` | **19** |
| Distinct inline `borderRadius` values | 6 |
| Distinct Tailwind `rounded-*` scales in use | 5 |

The tokens file was not wrong. It was *optional*. Every builder who opened a new
component found it faster to type `#00ADEE` than to find the import, and nothing
in the toolchain objected.

**The governing principle of this design system is therefore:**

> A token that can be ignored will be ignored. The shared value must be both the
> easiest path and the only permitted one.

Everything below follows from that. Documentation alone has already been tried
here, and it drifted within one release cycle.

---

## 2. Constraint: the estate is not one stack

| Project | Framework | Tailwind |
|---|---|---|
| Sales Pipeline | Next.js 16 | Yes, 3.4 |
| puretrade-workflow-ui | Next.js 16 | Yes, 3.4 |
| Transport View | Vite + React 18 | No |
| Shipments View | Vite + React 18 | No |
| Active Deals View | Vite + React 18 | No |
| Tracking Report System (Pure Track) | Vite + React 19 | No |

Four of six apps have no Tailwind. A Tailwind-preset design system would exclude
most of the estate, so **the core must be framework-neutral**. Tailwind is an
optional adapter layered on top, never the source of truth.

---

## 3. The three-layer token model

Tokens are layered so that a rebrand touches one file and a redesign touches one
other, without either being able to disturb the components.

```
  Layer 1  BRAND      the CI palette, five colours, nothing else
             blue #00AAEF  white #FFFFFF  navy #001A34
             grayLight #A7A7A7  grayDark #33343D
                   |
  Layer 2  SEMANTIC  roles, the only layer components may read
             surface.page   text.muted   status.blocked   interactive.primary
                   |
  Layer 3  COMPONENT recipes built from semantic tokens only
             Button  Badge  StatusPill  Card  DataTable  PageHeader  Modal
```

**Rules of the model**

1. Layer 3 may only read Layer 2. A component never references a brand colour
   directly, so a component can never encode a brand decision.
2. Layer 2 may only read Layer 1. A semantic role never invents a colour.
3. Layer 1 is the only place a raw hex may appear anywhere in the system, and it
   may only hold what the CI publishes plus explicitly flagged extensions.
4. Applications may only read Layer 2 and Layer 3. Apps never read Layer 1.

This is what separates the two things being asked for: "make the brand
consistent" is a Layer 1 question, "make the board look better" is a Layer 2 and
3 question, and neither can silently become the other.

---

## 4. What ships in the package

```
pta-design-system/
  src/
    tokens/
      brand.ts        Layer 1. Raw brand constants. The only hex in the repo.
      semantic.ts     Layer 2. Roles: surface, text, border, status, interactive.
      scale.ts        Layer 2. Space, radius, type ramp, density, elevation.
      index.ts        Public token barrel.
    css/
      tokens.css      Generated. Every token as a CSS custom property.
    components/       Layer 3. React primitives, framework-neutral styling.
      Button  Badge  StatusPill  Card  DataTable  PageHeader  Sidebar
      Modal  Field  Toolbar  EmptyState  Toast  KpiStrip
    adapters/
      tailwind-preset.js   Optional, for the two Next apps.
  tools/
    eslint-plugin-pta-design/   The enforcement rule.
  docs/
    kitchen-sink/     A live page rendering every component in every state.
  CLAUDE.md           Build rules for Claude-driven sessions.
```

**Why a component library and not just tokens.** Tokens stop the wrong colour.
They do not stop two builders producing two different tables. The primitives are
what make the *results* identical, which is the actual requirement. A builder
composing `<DataTable>` and `<StatusPill>` cannot produce a divergent board.

---

## 5. Distribution

A private GitHub repository, `Gareth-Loudon/pta-design-system`, consumed as a
git-URL npm dependency. This mirrors how PTA-Automation-Fleet already works, so
it introduces no new operational pattern.

Each app declares:

```json
"dependencies": {
  "@pta/design": "github:Gareth-Loudon/pta-design-system#v1.2.0"
}
```

**Why pinned tags rather than a branch.** A branch reference means a push to the
design system can change six production apps without anyone deploying them. A
tag means each app upgrades deliberately, and a bad token change cannot escape
into Pure Track on its own.

**Rollout of a change:** commit to the design system, tag a release, then bump
the tag in each app as that app is next touched. Apps are never forced to move
together.

**Why not the alternatives.** A synced folder (the `collect.ps1` pattern) has no
versioning, so an app cannot stay on a known-good set while another moves ahead.
A monorepo is the better long-term answer, but it requires migrating six projects
before anyone sees a benefit.

---

## 6. Enforcement, which is the part that actually matters

Three gates, in increasing severity.

**Gate 1: the editor.** `eslint-plugin-pta-design` ships a `no-raw-color` rule
that flags any hex literal, `rgb(`, or `hsl(` in a `.tsx` or `.ts` file outside
`src/tokens/brand.ts`. It reports as an error naming the nearest matching token,
so the fix is an autofix rather than a lookup.

```
  error  Raw colour "#00ADEE". Use semantic.interactive.primary
         pta-design/no-raw-color
```

**Gate 2: the build.** `npm run lint` runs in each app's CI and fails the build
on any violation. This is the gate that made the previous tokens file fail: there
was not one.

**Gate 3: review.** A PR that adds a token to Layer 1 or Layer 2 requires
Gareth's approval. Layer 3 component additions do not. This keeps the palette
closed while leaving component work unblocked.

**Migration allowance.** The existing 86 violations cannot all be fixed the day
the rule lands. The rule ships with a checked-in baseline file listing current
violations, which report as warnings; anything new is an error. The baseline only
ever shrinks, and CI rejects a PR that grows it.

---

## 7. Documentation that cannot drift

`docs/kitchen-sink` is a real page importing the real components and rendering
every one in every state. It is not a written description of the components, so
it cannot describe them incorrectly. It is deployed alongside the apps and is the
thing a builder is pointed at on day one.

Written docs are limited to what a rendering cannot show: naming, when to reach
for which component, and the rules in section 3.

---

## 8. The brand source of truth, and what has drifted from it

The **Brand Profile and CI** (11pp PDF, palette p8, typography p10) is the source of
truth. It was found on 25 Aug 2026, after this document was first drafted, and it
overrides both the `pta-branding` skill and the apps wherever they disagree.

It matters more than expected, because **the CI already anticipated the print
versus web split** that this design system exists to manage. The branding skill
carried over only the print half.

### 8.1 Typography, CI page 10

| Medium | Role | CI specifies | Status in the skill |
|---|---|---|---|
| Print | Headings | Montserrat Bold | Carried over correctly |
| Print | Body | Calibri Light | Carried over correctly |
| Web | Headings | Trebuchet MS | Demoted to a Montserrat fallback |
| Web | Body | Verdana | Absent entirely |

The web pair was chosen for being installed everywhere, not for quality. Verdana was
drawn for low-resolution screens: measured on the deal board it needs 880px for seven
columns against 777px for the narrowest alternative, 13% more, which is roughly two
columns of lost width on a fourteen-column board.

**Resolved: Montserrat for display, Carlito for everything else.** The deciding
requirement is that a printed document match the web view. Carlito is metrically
identical to Calibri, so one stack serves screen, PDF and Office, and a recipient
without Carlito installed falls back to Calibri with the layout unchanged. Every
other candidate substitutes to something with different metrics and the document
reflows. Montserrat is restricted to 18px and up per the CI's own print rule.

Two measurements informed this and are worth recording, because they contradict
reasonable intuitions:

- **Height does not constrain the choice.** At `line-height: normal` the candidates
  span 14.0px to 18.0px at 13px, a 29% spread. With `line-height` pinned at 1.5 every
  one produces an identical 59px for three lines. Height is a token; width is not.
- **Montserrat is not the space hog it appears to be.** Its line box is mid-pack. What
  it has is a 0.77 cap height, tied with Barlow for the largest measured and against
  0.69 for most faces, plus wide letterforms. Its capitals outweigh surrounding text
  rather than its lines being tall. Capping it at display sizes removes the problem.
- **The type ramp is anchored to the shipped app, not chosen in the abstract.**
  Resolving the Sales Pipeline's real CSS chain (`html` 15px, Tailwind `text-sm`
  13.13px, `transform: scale(0.92)`) gives 12.08px of effective table text, so
  `fontSize.body` is 12px and the board keeps its existing density. An earlier draft
  set it to 15px reasoning that Carlito draws small; that is true in the abstract and
  wrong here, and it made every row 24% larger than the board being replaced.
- **Figures do not need a mono face.** Carlito's digits are tabular and lining, so
  currency and volumes align in a column set in the body face. An earlier version
  set them in Geist Mono, which changed face mid-row, introduced a slashed zero
  (a coding convention that reads as a defect on an invoice), and needed an optical
  size correction because Geist Mono's cap height is 0.733 against Carlito's 0.600.
  Dropping the face swap removed all three at once, along with the `opticalScale`
  and `fontSizeMono` tokens that existed only to paper over it.
- **Geist is gone entirely.** It was flagged at the outset as a non-brand face that
  had crept into the apps, then quietly retained for numerals. `scale.font.mono` is
  now Consolas, for code only.

### 8.2 Palette: the logo is the source, not the palette page

The CI palette page (p8) lists five colours. Sampling the logo artwork pixel by pixel
on 26 Aug 2026 showed the palette page is both incomplete and contains a typo, and
that the applications have been correct all along.

| Colour | Value | Where it comes from |
|---|---|---|
| Brand blue | `#00ADEE` | Logo artwork, 98.8% of all blue pixels |
| Brand navy (chrome) | `#043553` | Logo artwork, 100% of all dark pixels |
| Text Navy | `#001A34` | CI p8, "Pure Navy" |
| Pure White | `#FFFFFF` | CI p8 |
| Light Gray | `#A7A7A7` | CI p8 |
| Dark Gray | `#33343D` | CI p8 |

**The typo.** CI p8 prints the hex label `#00AAEF` for Pure Blue but gives its RGB as
000 | 174 | 239, which is `#00AEEF`, not `#00AAEF`. The logo is `#00ADEE`
(RGB 0 | 173 | 238), within one step of the document's own RGB. The printed hex label
is simply wrong.

**The omission.** `#043553` is absent from the palette page but is exactly the navy in
the logo. It is a brand colour, not an invention by a previous developer.

**Consequence: no colour sweep is needed.** An earlier draft of this document called
for changing `#00ADEE` to `#00AAEF` across 309 occurrences and for ratifying `#043553`
as an extension. Both were wrong and both are withdrawn. The estate already matches
the brand.

### 8.3 What is genuinely still open

**Two darks, deliberately.** `#043553` sits behind white text on chrome; `#001A34`
sits on white as body copy. Collapsing them to a single navy was tested on the board
and costs a level of hierarchy, because stage headings, deal numbers and table cells
stop being separable. They stay distinct.

**Both CI greys are unused.** `#A7A7A7` and `#33343D` appear nowhere in the apps,
which use Tailwind greys instead. Layer 1 now pins its neutral ramp through both.

**The CI defines no status colours.** No green, red or amber anywhere in it, so the
success and danger ramp is unspecified by the brand and choosing good screen values
breaks no rule. The skill's `#00B050` and `#FF0000` are Office-era primaries with no
brand backing.

**The phone number disagrees.** CI p2 says `+27 (31) 818 0845`; the skill says
`+27 (31) 818 0840`. Unresolved.

### 8.4 What follows

`tokens.ts` in the Sales Pipeline is a stale third palette (navy `#1e3a5f`, green
`#3ECF8E`, a Geist font assumption) matching neither the CI nor the shipped pages.
It should be deleted, not corrected.

Once the open decisions in section 10 are settled, the `pta-branding` skill should
be regenerated from `brand.ts` rather than maintaining its own table, so screens
and documents cannot drift apart again.

---

## 9. What this does not cover

- **Data visualisation.** Chart palettes are a separate concern with different
  contrast requirements. Deferred to a later addition.
- **Document generation.** Stays with the `pta-branding` skill, consuming Layer 1.
- **Content and tone.** Not addressed here.
- **Migrating the existing 86 violations.** Handled by the shrinking baseline in
  section 6, not by a single sweep.
- **Logo usage.** The CI PDF carries no logo-usage rules (clear space, minimum
  size, misuse). The four logo files in the branding skill remain the only guidance.

---

## 10. Open decisions before v1 is built

| # | Decision | Blocking | Owner |
|---|---|---|---|
| 1 | ~~Direction A or B~~ **DECIDED 26 Aug 2026: Direction A, tighten and keep the look** | Closed | Gareth |
| 2 | ~~Typeface pairing~~ **DECIDED 26 Aug 2026: Montserrat display + Carlito body** | Closed | Gareth |
| 3 | ~~Adopt CI blue `#00AAEF`~~ **WITHDRAWN 26 Aug 2026.** Logo is `#00ADEE`; the CI hex label is a typo | Closed | Verified |
| 4 | ~~Ratify `#043553`~~ **WITHDRAWN 26 Aug 2026.** It is the logo navy, already a brand colour | Closed | Verified |
| 5 | ~~Status ramp~~ **DECIDED 26 Aug 2026: `#16A34A` / `#DC2626` / `#F59E0B`**, evidenced as the centre of existing PTA output | Closed | Gareth |
| 6 | ~~Phone number~~ **DECIDED 26 Aug 2026: `+27 (31) 818 0840`.** The CI PDF's `0845` is out of date | Closed | Gareth |
| 7 | Confirm the GitHub repo name and that it is private | Distribution | Gareth |
| 8 | Install Carlito and Montserrat on all PTA workstations | Document parity | IT |
| 9 | Remove Geist from `layout.tsx` and the QuoteBuilder A4 preview | Client-facing quotes | Gareth |

---

## 11. Build status, 26 Aug 2026

**Done and verified**

| Piece | File | Verification |
|---|---|---|
| Layer 1 brand tokens | `src/tokens/brand.ts` | Palette sampled from the logo artwork |
| Layer 2 colour roles | `src/tokens/semantic.ts` | Zero colour literals in code |
| Layer 2 scale | `src/tokens/scale.ts` | Zero colour literals in code |
| Public barrel | `src/tokens/index.ts` | `tsc --noEmit` exits 0 |
| Generated CSS | `src/css/tokens.css` | 113 custom properties, emitted from the TS |
| CSS generator | `scripts/build-css.mjs` | Runs on Node 24 with no build step |
| `no-raw-color` rule | `tools/.../no-raw-color.js` | Catches 9 of 9 real violations, names the right token for each |
| `no-layer1-import` rule | `tools/.../no-layer1-import.js` | Catches Layer 1 imports, exempts the generator |
| Rule tests | `tools/.../test/rules.test.cjs` | `npm test`, 11 expected problems, 0 false positives |
| Build rules for Claude | `CLAUDE.md` | |

The rule suggestions were checked against verbatim Sales Pipeline code:
`#043553` resolves to `semantic.surface.chrome`, `#00ADEE` to
`semantic.interactive.primary`, `#dcfce7` to `semantic.status.successBg`, and a
colour with no close match is told to pick a role rather than being handed a bad
suggestion.

**Layer 3 primitives, built 27 Aug 2026**

| Component | File | Notes |
|---|---|---|
| Button | `Button.tsx` | 6 variants. `won` / `lost` are quiet at rest, saturated on hover |
| Badge, StatusPill, StagePill, Avatar | `Badge.tsx` | StatusPill takes a STATE, never a string |
| DataTable, CellStack, Empty | `DataTable.tsx` | One shared colgroup across groups: drift is structurally zero |
| PageHeader, Wordmark, Sidebar, Card, Toolbar, KpiStrip | `Shell.tsx` | |
| TextInput, Field, Modal, EmptyState, Toast | `Feedback.tsx` | |

Verified on the running demo at `localhost:5273`:

| Defect from the audit | Before | Now |
|---|---|---|
| Column drift between stage groups | up to 64px | **0px** across all 3 tables |
| Apparent text sizes in one row | 4 | **2** |
| Truncated cells | many | **0** |
| Row height within a group | 54px and 58px mixed | **49px, every row** |
| Page zoom hack | `scale(0.92)` | `none` |
| Smallest control | 22px target, 9.66px text | **26px** target, 12px text |
| Won / Lost at rest | solid `#16A34A` / `#DC2626` | transparent, colour on hover |
| Blocked vs Not Required | both neutral grey | red `#FEE2E2` vs grey `#F0F2F5` |

The design system lints itself: `npx eslint .` reports **0 errors** across tokens,
components and demo. Running it for the first time caught a real gap, three
hardcoded pipeline stage colours in the demo, which became the `sequence` palette
in Layer 1 and `semantic.stage` in Layer 2. That is the rule doing exactly the job
it exists for, on its own authors.

**Not yet built**


- `adapters/tailwind-preset.js` for the two Next apps.
- The violation baseline for the Sales Pipeline's existing 86 hits.
- Regenerating the `pta-branding` skill from `brand.ts`.
- Migrating the Sales Pipeline itself onto the package. The demo proves the board
  can be rebuilt from the primitives; porting the real app is a separate job.
