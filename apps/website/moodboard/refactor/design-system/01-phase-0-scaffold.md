# Phase 0 — Scaffold `@imbustai/ds` + vanilla-extract

> Prereq: read [`README.md`](README.md). This phase creates the empty package and
> wires vanilla-extract so a styled component from `@imbustai/ds` renders in the
> website. **No tokens or real components yet** — that's Phase 1+.

## Goal

A new source-only workspace package `@imbustai/ds`, with vanilla-extract compiling its `.css.ts` files through the Next build, proven by a throwaway smoke component visible in the running website.

## Files to create / modify

**Create `packages/ds/`** (mirror `packages/i18n/`):

- `packages/ds/package.json`
  ```json
  {
    "name": "@imbustai/ds",
    "version": "0.0.1",
    "private": true,
    "main": "./src/index.ts",
    "types": "./src/index.ts",
    "exports": { ".": "./src/index.ts" },
    "peerDependencies": { "react": "^19.0.0", "react-dom": "^19.0.0" },
    "dependencies": {
      "@vanilla-extract/css": "^1.15.0",
      "@vanilla-extract/recipes": "^0.5.5",
      "@radix-ui/react-slot": "^1.2.4",
      "clsx": "^2.1.1"
    }
  }
  ```
  > Pin to the latest stable on install; the versions above are a floor. `@radix-ui/react-slot` + `clsx` are already used in the website, so versions should align.

- `packages/ds/tsconfig.json` (copy `packages/i18n/tsconfig.json`):
  ```json
  {
    "extends": "../../tsconfig.base.json",
    "compilerOptions": {
      "jsx": "react-jsx",
      "module": "ESNext",
      "moduleResolution": "bundler",
      "strict": true,
      "noEmit": true,
      "isolatedModules": true,
      "lib": ["ES2020", "DOM"]
    },
    "include": ["src/**/*.ts", "src/**/*.tsx"]
  }
  ```

- `packages/ds/src/index.ts` — the public surface. For this phase, export only the smoke component.

- `packages/ds/src/utils/cx.ts`:
  ```ts
  export { clsx as cx } from 'clsx';
  ```

- Smoke component `packages/ds/src/_smoke/DsSmoke.tsx` + `DsSmoke.css.ts`:
  ```ts
  // DsSmoke.css.ts
  import { style } from '@vanilla-extract/css';
  export const smoke = style({
    padding: 16,
    background: '#0057B8',
    color: '#FAF7F0',
    fontFamily: 'sans-serif',
  });
  ```
  ```tsx
  // DsSmoke.tsx
  import { smoke } from './DsSmoke.css';
  export function DsSmoke({ label = '@imbustai/ds OK' }: { label?: string }) {
    return <div className={smoke}>{label}</div>;
  }
  ```
  Export from `src/index.ts`: `export { DsSmoke } from './_smoke/DsSmoke';`

**Add the website devDep:** `@vanilla-extract/next-plugin` (latest stable) to `apps/website/package.json` devDependencies. Add `@imbustai/ds: "workspace:*"` to its dependencies.

**Modify `apps/website/next.config.js`:**
```js
//@ts-check
const { composePlugins, withNx } = require('@nx/next');
const { createVanillaExtractPlugin } = require('@vanilla-extract/next-plugin');

const withVanillaExtract = createVanillaExtractPlugin();

const nextConfig = {
  nx: {},
  transpilePackages: ['@imbustai/i18n', '@imbustai/story-engine', '@imbustai/ds'],
};

const plugins = [withNx, withVanillaExtract];

module.exports = composePlugins(...plugins)(nextConfig);
```
> `createVanillaExtractPlugin()` returns a `(config) => config` function — compatible with `composePlugins`. Verify the call signature against the installed plugin's README; if it returns a wrapper expecting to be called as `withVanillaExtract(nextConfig)`, adapt accordingly (composePlugins accepts both higher-order plugin forms — test the build).

**Smoke-test render:** temporarily drop `<DsSmoke />` into `app/layout.tsx` (or the landing) to confirm it renders styled, then remove it before finishing.

## Step-by-step

1. `pnpm install` after creating `packages/ds/package.json` so the workspace symlink is created.
2. Create tsconfig, `src/index.ts`, `cx.ts`, smoke component.
3. Add website deps (`@imbustai/ds`, `@vanilla-extract/next-plugin`); `pnpm install`.
4. Edit `next.config.js` as above.
5. Render `<DsSmoke />` somewhere visible.
6. `pnpm build:website`, then `pnpm dev:website` and verify the blue smoke box appears.
7. Remove the temporary `<DsSmoke />` usage (keep the export).

## Acceptance criteria

- [ ] `@imbustai/ds` resolves as a workspace package (symlink in `node_modules/@imbustai/ds`).
- [ ] `import { DsSmoke } from '@imbustai/ds'` works in the website.
- [ ] The smoke component renders **with its vanilla-extract styles applied** (blue background) — proving `.css.ts` compiles via the plugin.
- [ ] `pnpm build:website` passes.
- [ ] Temporary smoke usage removed; the export stays for Phase 1's first render check.

## Verification

```bash
pnpm install
pnpm build:website
pnpm dev:website
```
Use `preview_start` + `preview_screenshot` to confirm the styled smoke box; check `preview_console_logs` is clean.

## Gotchas

- If the smoke box renders **unstyled**, the VE plugin isn't processing the package → re-check both `transpilePackages` includes `@imbustai/ds` **and** `withVanillaExtract` is in `plugins`.
- Do **not** add a build step to `packages/ds` — it stays source-only like `i18n`.
- Do **not** touch `tsconfig.base.json` paths.
