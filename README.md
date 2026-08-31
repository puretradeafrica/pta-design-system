# PTA Design System

Tokens, primitives and enforcement, shared across every Pure Trade Africa
application.

Read [CLAUDE.md](./CLAUDE.md) before building a screen.
Read [docs/ADOPTING.md](./docs/ADOPTING.md) before wiring it into an existing app.
Read [ARCHITECTURE.md](./ARCHITECTURE.md) for why it is built this way and what has
been decided.

---

## See it running

```bash
npm install
npm run dev
```

Then open **http://localhost:5273**. Two pages, switched from the sidebar:

- **Sales Pipeline**: the deal board, rebuilt entirely from the primitives.
  `demo/App.tsx` is what a builder actually writes. It styles nothing.
- **All components**: every primitive in every state.

---

## Use it in an app

```json
"dependencies": {
  "@pta/design": "github:Gareth-Loudon/pta-design-system#v1.2.2"
}
```

```tsx
import { semantic, scale, DataTable, StatusPill, Button } from "@pta/design";
```

Next.js apps need `transpilePackages: ["@pta/design"]` in `next.config.ts`, since
the package ships TypeScript source rather than a build.

Apps that prefer CSS custom properties over token objects can import the generated
stylesheet instead:

```ts
import "@pta/design/css";   // 121 --pta-* custom properties
```

### Turn the enforcement on

```js
// eslint.config.js
import pta from "@pta/design/eslint-plugin";

export default [
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { "pta-design": pta },
    rules: {
      "pta-design/no-raw-color": "error",
      "pta-design/no-layer1-import": "error",
    },
  },
];
```

For an existing app with accumulated violations, point the rule at a baseline so
only new code fails:

```js
"pta-design/no-raw-color": ["error", { baseline: "./pta-design-baseline.json" }]
```

The baseline may only ever shrink.

---

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Demo app on port 5273 |
| `npm run build:css` | Regenerate `src/css/tokens.css` from the TypeScript |
| `npm run check:css` | Fail if the committed CSS is stale. Run this in CI |
| `npm run typecheck` | `tsc --noEmit` over tokens, components and demo |
| `npm test` | The lint rules behave as specified |
| `npx eslint .` | The design system lints itself with its own rule |
| `npm run baseline <src-dir> [out.json]` | Inventory an app's existing violations before turning the rule on |
| `npm run verify` | All of the above in one go |

---

## Layout

```
src/tokens/brand.ts       Layer 1. The palette and typefaces. The only hex in the repo.
src/tokens/semantic.ts    Layer 2. Colour by role.
src/tokens/scale.ts       Layer 2. Type, space, radius, density, layout.
src/css/tokens.css        Generated from the above.
src/components/           Layer 3. The primitives.
tools/eslint-plugin-pta-design/   The rules that make it bind.
demo/                     The Sales Pipeline board and a kitchen sink.
scripts/build-css.mjs     The generator.
```

Applications read Layer 2 and Layer 3. Importing Layer 1 from app code is a lint
error, because a component that names a brand colour has put a brand decision
inside a component.

---

## Deployment requirements

The chosen typefaces only deliver print and web parity if these are done. They are
listed in code as `brand.fontDeployment`.

1. Install **Carlito** and **Montserrat** on every PTA workstation. Both are SIL
   OFL, so redistribution is permitted.
2. Embed both in generated PDFs.
3. Enable "Embed fonts in the file" for Word and Excel files sent outside PTA.
4. Remove **Geist** from the apps. `layout.tsx` loads it, and `QuoteBuilder.tsx`
   line 861 sets the customer-facing A4 quote preview to `var(--font-geist-sans)`,
   so every quote sent to a client is currently typeset in a face that appears in
   neither the brand document nor the branding skill.
