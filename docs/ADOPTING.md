# Adopting the design system in an existing app

For anyone pointing a PTA application at `@pta/design` for the first time.

---

## 1. Install

```bash
npm install "github:Gareth-Loudon/pta-design-system#v1.2.2"
```

Pin the tag, never a branch. A branch reference means a push to the design system
silently changes six production apps; a tag means each app upgrades deliberately.

While actively developing the design system alongside an app, a local path is
easier and avoids a push per iteration:

```bash
npm install "file:../PTA System Design/pta-design-system"
```

Switch to the tag before merging.

---

## 2. Pick your consumption mode

The estate has two styling patterns and the package serves both. Use whichever
matches the app you are in. Do not convert an app's styling approach as part of
adopting the design system; that is a separate, larger change.

### Mode A: TypeScript tokens, for apps that style inline

Sales Pipeline and puretrade-workflow-ui.

```tsx
import { semantic, scale, DataTable, StatusPill, Button } from "@pta/design";

<div style={{
  background: semantic.surface.chrome,
  color: semantic.text.onChrome,
  padding: scale.space.md,
}} />
```

### Mode B: CSS custom properties, for class-based apps

Transport View, Shipments View, Active Deals View, Pure Track. These keep colour
in a stylesheet, so import the generated variables once and reference them.

```ts
// main.jsx / main.tsx, before your own stylesheet
import "@pta/design/css";
import "./styles.css";
```

```css
/* styles.css, before */
.page-head    { background: #043553; color: #fff; }
.deal-no      { color: #001A34; font-size: 13px; }
.badge-ok     { background: #dcfce7; color: #166534; }

/* styles.css, after */
.page-head    { background: var(--pta-surface-chrome); color: var(--pta-text-on-chrome); }
.deal-no      { color: var(--pta-text-primary); font-size: var(--pta-text-size-body); }
.badge-ok     { background: var(--pta-status-success-bg); color: var(--pta-status-success-fg); }
```

Run `node scripts/build-css.mjs` in the design system and read `src/css/tokens.css`
for the full list. Every token is exposed, colour and dimension alike.

The two modes mix freely. A class-based app can still import `<DataTable>` and get
the table for free, because the components carry their own inline styles.

### Mode C: JSON, for anything that cannot import TypeScript

Document generation. The `pta-branding` skill builds docx, xlsx, pptx and PDF from
Python, and must use the same values the screens use or print and screen drift
apart again.

```python
import json
tokens = json.load(open("node_modules/@pta/design/src/css/tokens.json"))
navy  = tokens["brand"]["identity"]["navy"]        # 043553
green = tokens["brand"]["status"]["success"]       # 16A34A
body  = tokens["brand"]["type"]["printBody"]       # Calibri, Carlito, sans-serif
```

Generated alongside `tokens.css` from the same source, so it cannot drift.

### Framework notes

The package ships both compiled JavaScript (`dist/`) and the TypeScript source.
`import ... from "@pta/design"` resolves to the build, which works everywhere
including plain Node. Import `@pta/design/source` if you specifically want the TS.

The build runs automatically on install via the `prepare` script, so `dist/` is
never committed and can never go stale.

Next.js needs nothing extra now that a build is shipped. If you switch to the
source entry point, add:

```ts
// next.config.ts
export default { transpilePackages: ["@pta/design"] };
```

Vite handles either without configuration.

---

## 3. Turn the enforcement on

This is the step that makes adoption stick rather than decay. Without it you have
a token file that everyone is free to ignore, which is exactly what failed before.

Generate a baseline of what the app already has:

```bash
node scripts/make-baseline.mjs "../../Active Deals View/src" \
     "../../Active Deals View/pta-design-baseline.json"
```

Then wire the rule in the app:

```js
// eslint.config.js
import pta from "@pta/design/eslint-plugin";

export default [
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    plugins: { "pta-design": pta },
    rules: {
      "pta-design/no-raw-color": ["error", { baseline: "./pta-design-baseline.json" }],
      "pta-design/no-layer1-import": "error",
    },
  },
];
```

Existing violations stay quiet. Anything new fails the build and names the token to
use instead:

```
error  Raw colour "#043553". Use semantic.surface.chrome (#043553) from "@pta/design".
```

Commit the baseline. **It may only ever shrink.** Add a CI step that regenerates it
and fails if the count has grown.

### The gap you need to know about

**The ESLint rule only sees JavaScript and TypeScript.** A class-based app keeps its
colour in CSS, where the rule cannot reach. For Active Deals View that is 103 of 105
violations.

There is no suppression for those and there should not be. The fix is to point the
stylesheet at `var(--pta-*)`, which makes the raw values genuinely disappear rather
than be excused. The baseline still lists them so you have the inventory and can
watch it go down.

If you want CSS policed automatically, stylelint with `declaration-property-value-allowed-list`
is the tool, and it is not set up yet.

---

## 4. A migration order that works

Do not attempt a whole app in one pass. Take it in this order, verifying at each
step, because each one is independently shippable.

1. **Install and import the CSS variables.** Nothing changes visually. This alone
   proves the plumbing works.
2. **Replace the chrome.** Page header, sidebar, footer. Highest visual return,
   lowest risk, and it makes the app immediately look like the rest of the estate.
3. **Replace status and badge colours.** These carry meaning, so getting them onto
   the shared ramp is worth more than the count suggests.
4. **Replace the table.** Either point its CSS at the tokens, or swap it for
   `<DataTable>` if the shape fits. The component gives you the shared column
   template, so columns stop drifting between groups for free.
5. **Replace typography.** Sizes last, since they cascade and are the most likely
   to need a second look on screen.
6. **Turn the rule to error with the baseline**, and start shrinking it.

---

## 5. Before you call it done

```bash
npm run lint        # zero NEW pta-design errors
npx tsc --noEmit    # if the app is TypeScript
```

Then look at it, and check the things a linter cannot:

- Numbers line up in their columns, and the digits do not change height
- Every row in a group is the same height
- Column positions hold between groups
- Nothing clickable is under 26px
- No text is smaller than `--pta-text-size-meta` (11px)
- The board is set in Calibri, not a mono and not Geist
