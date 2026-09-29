# Starlight and TypeDoc for the developer docs app

Research date: 2026-09-29. Ticket [#18][issue-18] on map [#9][issue-9]. It follows the decision in [#15][issue-15]. Status: findings, plus a config sketch verified in a throwaway workspace. Nothing was installed in this repository.

## Answer

**Starlight fits.** Astro 7.3, Starlight 0.42, starlight-typedoc 0.23 and TypeDoc 0.28.20 can do the whole job:

- generate the Hooks and utilities reference from the runtime's TypeScript source on every build;
- host hand-written MDX guides and a hardcoded list of engines;
- run as Nx targets, install with pnpm, and deploy to Vercel as a static site.

One requirement needs an extra step. **starlight-typedoc never runs TypeDoc's validation**, so `treatValidationWarningsAsErrors` has no effect inside `astro build`. The gate is a second TypeDoc run, `typedoc --emit none`, placed in the app's `build` script before `astro build`. Both runs read the same `typedoc.json`. A 15-line local TypeDoc plugin can do the same in one pass; it was verified and is optional.

Zod-inferred types need one convention. Wherever a hook signature uses a `z.infer` alias, TypeDoc prints the whole inferred shape instead of a link, with or without `typedoc-plugin-zod`. Declaring hook-facing types as named interfaces fixes it: `interface TurnPlan extends z.infer<typeof turnPlanSchema> {}`.

No alternative is better for this brief (see [Alternatives](#alternatives)).

## Versions

Checked against the npm registry on 2026-09-29 ([astro][npm-astro], [@astrojs/starlight][npm-starlight], [starlight-typedoc][npm-st], [typedoc][npm-typedoc], [typedoc-plugin-markdown][npm-tpm], [typedoc-plugin-zod][npm-tpz]).

| Package | Version | Constraints that matter |
|---|---|---|
| `astro` | 7.3.5 | `engines.node >=22.12.0`; optional dependency `sharp ^0.35.4` |
| `@astrojs/starlight` | 0.42.4 | peer `astro ^7.2.10` |
| `starlight-typedoc` | 0.23.1 | peers `@astrojs/starlight >=0.39.0`, `astro >=6.0.0`, `typedoc >=0.28.0`, `typedoc-plugin-markdown >=4.6.0`; `engines.node >=22.12.0` |
| `typedoc` | 0.28.20 | peer `typescript` 5.0.x to 5.9.x or 6.0.x; `engines.pnpm >=10` |
| `typedoc-plugin-markdown` | 4.13.1 | peer `typedoc 0.28.x` |
| `typedoc-plugin-zod` | 1.4.3 | peer `typedoc` 0.23.x to 0.28.x; supports schemas imported from `zod/v4` since 1.4.2 ([changelog][tpz-changelog]) |
| `typescript` (repo catalog) | `~5.9.2`, resolves to 5.9.3 | inside TypeDoc's range. npm `latest` is 7.0.2, which TypeDoc does not support yet ([#3098][td-3098]) |

The whole set installed together with pnpm 10.32.1 on Node 24.11.1 and built without errors. The repository uses Nx 22.6.0 ([`pnpm-workspace.yaml`][repo-workspace]).

## How this was verified

The test workspace lived in a scratch directory outside the repository and mirrored its layout:

- a pnpm workspace with the same `typescript` catalog entry and `autoInstallPeers: true`;
- a copy of [`tsconfig.base.json`][repo-tsbase];
- a copy of [`packages/story-engine`][repo-engine] renamed `@imbustai/story-runtime`;
- an `apps/developer` Starlight app, and Nx 22.6.0.

The real `Engine` interface doesn't exist yet. The copy got a hypothetical `Engine` interface with one documented hook and one undocumented hook. A second, untouched copy of the package measured today's documentation debt. The results quoted below come from those runs.

## Config sketch

Paths assume the runtime lives at `packages/story-runtime` after the rename. Adjust them if the directory keeps its current name.

`apps/developer/package.json`:

```json
{
  "name": "@imbustai/developer",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "check:api": "typedoc --emit none",
    "build": "typedoc --emit none && astro build",
    "preview": "astro preview"
  },
  "dependencies": {
    "@astrojs/starlight": "^0.42.4",
    "@imbustai/story-runtime": "workspace:*",
    "astro": "^7.3.5",
    "starlight-typedoc": "^0.23.1",
    "typedoc": "^0.28.20",
    "typedoc-plugin-markdown": "^4.13.1",
    "typedoc-plugin-zod": "^1.4.3"
  },
  "devDependencies": {
    "typescript": "catalog:"
  }
}
```

Nothing imports `@imbustai/story-runtime`. The dependency exists so that Nx's project graph and Vercel's skip logic both know the docs depend on the runtime.

`apps/developer/typedoc.json`. The gate (TypeDoc CLI) and starlight-typedoc both read it, because starlight-typedoc bootstraps TypeDoc with its `TypeDocReader` ([source][st-typedoc-bootstrap]):

```json
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": ["../../packages/story-runtime/src/index.ts"],
  "tsconfig": "../../packages/story-runtime/tsconfig.docs.json",
  "plugin": ["typedoc-plugin-zod"],
  "excludeInternal": true,
  "excludePrivate": true,
  "excludeProtected": true,
  "categoryOrder": ["Hooks", "Utilities", "*"],
  "validation": {
    "notExported": true,
    "invalidLink": true,
    "notDocumented": true
  },
  "requiredToBeDocumented": ["Function", "Class", "Interface", "Method", "TypeAlias", "Variable", "Enum"],
  "packagesRequiringDocumentation": ["@imbustai/story-runtime"],
  "treatValidationWarningsAsErrors": true
}
```

`apps/developer/astro.config.mjs`:

```js
// @ts-check
import starlight from '@astrojs/starlight';
import { defineConfig } from 'astro/config';
import starlightTypeDoc, { typeDocSidebarGroup } from 'starlight-typedoc';

export default defineConfig({
  integrations: [
    starlight({
      title: 'Imbustai developer',
      plugins: [
        // entryPoints, tsconfig and plugins come from ./typedoc.json,
        // which the `typedoc --emit none` gate reads too.
        starlightTypeDoc({
          output: 'reference',
          sidebar: { label: 'Runtime reference' },
        }),
      ],
      sidebar: [
        { label: 'Guides', items: [{ autogenerate: { directory: 'guides' } }] },
        { label: 'Engines', link: '/engines/' },
        { label: 'Hooks', link: '/reference/interfaces/engine/' },
        typeDocSidebarGroup,
      ],
    }),
  ],
});
```

You can also keep the paths in `astro.config.mjs`: pass `entryPoints: ['../../packages/story-runtime/src/index.ts']` and `tsconfig: '../../packages/story-runtime/tsconfig.docs.json'` to `starlightTypeDoc()`. Both forms were verified. Options passed in code resolve from the Astro project root, and they override `typedoc.json` because TypeDoc re-applies them after reading option files ([source][td-bootstrap]). Keep them in one place so the site and the gate never diverge.

`apps/developer/src/content.config.ts` uses Starlight's standard loader ([manual setup][starlight-manual]):

```ts
import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

export const collections = {
  docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }),
};
```

`packages/story-runtime/tsconfig.docs.json` keeps tests and the seed out of the documented program:

```json
{
  "extends": "./tsconfig.json",
  "include": ["src/**/*.ts"],
  "exclude": ["src/**/__tests__/**", "src/**/*.test.ts"]
}
```

The guides are `.mdx` files under `src/content/docs/guides/`. The hardcoded engine list is a typed module (`src/data/engines.ts`) rendered by `src/content/docs/engines.mdx` with Starlight's `<CardGrid>` and `<Card>`. Both built in the scratch run. The app also gets the usual Astro `tsconfig.json` (`"extends": "astro/tsconfigs/strict"`) for editor support.

Root `.gitignore` additions. The generated reference is rewritten on every `astro dev` and `astro build`, and `dist` is already ignored:

```gitignore
apps/developer/.astro
apps/developer/src/content/docs/reference/
```

## Failing the build on undocumented Hooks and utilities

### Why a separate run

- starlight-typedoc 0.23.1 calls `app.convert()` and then `app.generateOutputs()`, and never `app.validate()` ([source][st-typedoc-run]).
- In TypeDoc 0.28.20, `convert()` does not validate ([source][td-app-convert]). Validation happens only when a caller invokes `Application.validate()` ([source][td-app-validate]). The CLI calls it and exits with code 4 when validation warned and `treatValidationWarningsAsErrors` or `treatWarningsAsErrors` is set. With `--emit none`, it then skips output generation ([source][td-cli]). The official option docs describe the same options ([Options.Validation][td-validation-docs]).
- Verified: with 454 validation warnings, `astro build` exited 0 and built 84 pages. `typedoc --emit none` exited 4. With the sketch above, `pnpm run build` exited 4 before Astro started and wrote no `dist/`.
- Cost: on this machine the extra TypeScript program took about 3.5 s, against about 9.5 s for the whole Astro build.

docusaurus-plugin-typedoc 1.4.3 works the same way (convert plus generateOutputs, no validate; [source][dpt-source]), so switching generators would not remove this step.

### What is enforced

TypeDoc's default `requiredToBeDocumented` list is Enum, EnumMember, Variable, Function, Class, Interface, Property, Method, Accessor and TypeAlias ([source][td-defaults], [docs][td-validation-docs]). Measured against an untouched copy of `packages/story-engine` at `7faf45e`:

| `requiredToBeDocumented` | Undocumented | Breakdown | `notExported` | Total warnings |
|---|---:|---|---:|---:|
| TypeDoc default | 428 | 373 properties, 19 functions or methods, 17 interfaces, 11 type aliases, 7 variables, 1 class | 5 | 433 |
| Sketch above (no Property, EnumMember, Accessor) | 55 | 19 functions or methods, 17 interfaces, 11 type aliases, 7 variables, 1 class | 5 | 60 |

With the sketch's list:

- **Hooks are enforced in either syntax.** An undocumented method hook (`onTurnPlanned(ctx, plan): Promise<TurnPlan>`) fails as a `CallSignature`. An undocumented function-typed property (`onGameEnd: (ctx) => Promise<void>`) fails as a `Property`, because TypeDoc follows the call signature back to its owner. A plain data member (`readonly version: string`) is not enforced. Add `"Property"` if the data members of `Engine` must be documented too, at the price of the 373 property comments above; nested zod-shape fields count among them.
- **Only `/** */` doc comments count.** The `//` comments above `addDays` and similar functions do not.
- **Today's undocumented functions and methods (19):** `buildNpcContext`, `buildOrchestratorContext`, `orchestratorSystemPrompt`, `npcWriterSystemPrompt`, `addDays`, `daysBetween`, `resolveStoryDate`, `computeVisibleFrom`, `validateDraft`, `hasErrors`, `normalizeCharacterSlug`, `openingLetters`, `generateTurnBatch`, `AiProvider.generateStructured`, `MockProvider.generateStructured`, `ClaudeProvider.generateStructured`, `ZERO_USAGE`, `createProvider`, `resolveProviderKind`.
- **`notExported` warnings also fail the gate.** `PromptContext`, `ResolvedStoryDate`, `ResolveStoryDateInput`, `ClaudeProviderOptions` and `MockHandler` appear in exported signatures but are not exported from [`src/index.ts`][repo-engine-index]. Export them (preferred) or list them in `intentionallyNotExported`.
- **The gate can be switched on only after a documentation pass** of about 60 items with this list.

### Two settings that silently weaken the gate

- **`packagesRequiringDocumentation`.** The `notDocumented` check skips every reflection whose package is not in this list ([source][td-doc-validation]). When the option is unset, it defaults to `project.packageName` ([source][td-app-validate]). TypeDoc reads that name from the `package.json` nearest to the entry points' common directory ([source][td-package-plugin-root], [source][td-package-plugin-name]). With one entry point inside the runtime, the name is `@imbustai/story-runtime` and the check works. Add an entry point from a second package and the common directory becomes `packages/`, the name becomes the root `@imbustai/source`, and the check reports nothing. Verified: 0 warnings and exit 0 by default, against 54 warnings and exit 4 with the list set explicitly. Set it explicitly from the start.
- **`excludeInternal` and `excludeProtected`.** starlight-typedoc forces `excludeInternal`, `excludePrivate` and `excludeProtected` to `true` ([source][st-typedoc-defaults]). The TypeDoc CLI defaults only `excludePrivate` to `true` ([source][td-options-exclude]). Without those three lines in `typedoc.json`, the gate would demand comments on members the site hides.

### Optional: validate inside `astro build` (one TypeDoc run)

```js
// apps/developer/typedoc-validate.mjs
// Load it only through starlight-typedoc:
//   starlightTypeDoc({ typeDoc: { plugin: ['./typedoc-validate.mjs'] } })
import { Application } from 'typedoc';

export function load(app) {
  app.on(Application.EVENT_GENERATE_OUTPUTS_BEGIN, (project) => {
    const before = app.logger.validationWarningCount;
    app.validate(project);
    const found = app.logger.validationWarningCount - before;
    if (found > 0 && app.options.getValue('treatValidationWarningsAsErrors')) {
      throw new Error(`TypeDoc validation failed with ${found} warning(s).`);
    }
  });
}
```

Verified: `astro build` failed in `astro:config:setup` with "TypeDoc validation failed with 59 warning(s)." and wrote no `dist/`. The trade-offs:

- it is custom code on TypeDoc's public API;
- it also fires on `astro dev`, because the plugin hook runs for dev and build ([source][st-index-hook]);
- it must not be listed in `typedoc.json`, or the CLI validates twice.

The `typedoc --emit none` gate is simpler. Keep this plugin as an optimisation.

## Grouping Hooks and utilities

Verified behaviour:

- **Categories group the index page.** `@category Hooks` and `@category Utilities` on exports produce "Hooks", "Utilities" and then "Other" headings on the generated reference index, in `categoryOrder` order.
- **The sidebar stays grouped by kind** (Classes, Interfaces, Type Aliases, Variables, Functions). starlight-typedoc builds it from Starlight's directory autogeneration. It keeps a TypeDoc group only when that group's pages live under `<output>/<slug of the group title>` ([source][st-sidebar]). The maintainer confirms that `@group` groups do not reach the sidebar ([#89][st-89]).
- **`@group Hooks`** moves `Engine` into a "Hooks" section of the index page but leaves the sidebar unchanged.
- **Keep TypeDoc's default `router`; don't set it to `group` or `category`.** Those routers name folders after the title as written (`Hooks/`, `Type_Aliases/`; [source][td-router]). The folders never match the lowercase slug above, so the build passes while the API sidebar group comes out empty (verified).
- **The `Engine` page is the Hooks reference.** Hooks are the members of the one `Engine` interface, so each hook renders under "Methods" with its parameters and return type. The manual `{ label: 'Hooks', link: '/reference/interfaces/engine/' }` entry in the sketch puts that page in the sidebar.

Suggested convention:

- `@category Hooks` on `Engine` and on the types its hooks take and return;
- `@category Utilities` on helper functions;
- data types stay in the default "Other" group, or set TypeDoc's `defaultCategory`.

## How TypeDoc reads the TS-source workspace package

- **No build step is needed.** TypeDoc builds a TypeScript program from the `tsconfig` it is given, then documents what the entry-point file exports. The package's `main`, `types` and `exports` fields (all `./src/index.ts`) don't matter, because the entry point is a file path.
- **Relative paths.** Paths in `typedoc.json` resolve against that file's directory. The same options passed in code (for example in `astro.config.mjs`) resolve against `process.cwd()`. That is `apps/developer` both under Nx (the target's `cwd`) and on Vercel (the Root Directory). Plugin entries that start with `.` also resolve against the config file ([source][td-module-path]).
- **Imports and path aliases.** Module resolution is TypeScript's own, driven by that tsconfig: the package's `moduleResolution: "bundler"`, its `exports` map and pnpm's symlinks. TypeScript follows the symlinks to real paths, so symbols are attributed to `@imbustai/story-runtime/src/…`, as the warnings show. `paths` aliases resolve the same way. [`tsconfig.base.json`][repo-tsbase] defines none (`"paths": {}`), and the runtime needs none.
- **It type-checks first.** Any TypeScript error aborts the run ([source][td-app-typecheck]). The CLI exits with code 3; starlight-typedoc throws `Failed to generate TypeDoc documentation.` ([source][st-typedoc-run]). Two consequences for this repo:
  - `tsconfig.base.json` sets `importHelpers: true` with `target: es2015`, so async functions need `tslib` resolvable from the runtime's sources. It is a root devDependency today. Without it the check fails with TS2354 (reproduced).
  - Point TypeDoc at a tsconfig that contains only the library, such as `tsconfig.docs.json` above. The package's own `tsconfig.json` also works today (tests and seed type-check; verified), but it ties the docs to test typings. Never point TypeDoc at the Astro app's tsconfig ([#90][st-90]).
- **Plugins are imported by bare name from TypeDoc's own location** ([source][td-plugins]). Under pnpm that works only through the hidden hoisted folder `node_modules/.pnpm/node_modules`, which the default `hoistPattern: ['*']` creates ([pnpm settings][pnpm-settings]). Verified: with `hoist: false`, TypeDoc fails with `ERR_MODULE_NOT_FOUND` for `typedoc-plugin-zod`. A relative path (`"./node_modules/typedoc-plugin-zod/dist/plugin.js"`) works either way. starlight-typedoc also loads `typedoc-plugin-markdown` by bare name.

## How zod-inferred types render

The runtime pairs each schema with an alias today: `export type TurnPlan = z.infer<typeof turnPlanSchema>` next to `export const turnPlanSchema = z.object({…})` ([source][repo-turnplan]).

| Where | Without typedoc-plugin-zod | With typedoc-plugin-zod 1.4.3 |
|---|---|---|
| The `TurnPlan` alias page | `TurnPlan = z.infer<typeof turnPlanSchema>`: opaque, links only to the schema | the resolved object; each field with its type, but arrays of objects only as `object[]` |
| The `turnPlanSchema` page | the full `ZodObject<{…}, "strip", ZodTypeAny, {…}, {…}>` generic, several screens long | `ZodObject<TurnPlan>`, linked to the alias |
| A hook that takes or returns the alias | the full shape inlined in the signature and the parameter list; no link | the same: inlined, no link |
| The alias's doc comment | must be written separately | copied from the schema's doc comment when the alias has none ([source][tpz-comment]) |

Usage sites lose the name for two reasons:

- TypeDoc converts parameter and return types from the checker's type rather than from the source text ([source][td-signature], [source][td-types]).
- TypeScript keeps no alias name on the result of `z.infer`, so the name cannot be recovered.

The plugin rewrites only alias declarations whose type is zod's `TypeOf`, `input` or `output` ([source][tpz-check]).

The fix for any type that appears in a Hook signature is a named interface:

```ts
/** The Game Master plan for one turn. */
export const turnPlanSchema = z.object({ /* … */ });

/** The Game Master plan for one turn, validated by {@link turnPlanSchema}. */
export interface TurnPlan extends z.infer<typeof turnPlanSchema> {}
```

Verified: the hook then renders as `onTurnPlanned(ctx, plan): Promise<TurnPlan>` with links. The `TurnPlan` page lists every field (each marked "Inherited from z.infer…") and shows "Extends TypeOf<typeof turnPlanSchema>". The schema page falls back to the long `ZodObject<…>` form. Nested fields get doc comments only if you write them on the schema's properties.

Recommendation:

- use named interfaces for hook-facing types;
- keep `typedoc-plugin-zod` for the aliases that remain;
- document every exported schema constant, since the gate requires Variables to be documented. Alternatively, mark schemas that plug-in authors don't need `@internal`, which `excludeInternal: true` hides.

## Nx targets

Nx has no official Astro plugin: `@nx/astro` does not exist on npm, and the community `@nxtensions/astro` stops at Nx 19 and Astro 3–4. Plain package.json scripts plus project.json metadata work; this was verified with Nx 22.6.0.

`apps/developer/project.json`:

```json
{
  "name": "developer",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "apps/developer/src",
  "projectType": "application",
  "tags": [],
  "targets": {
    "build": {
      "cache": true,
      "inputs": ["default", "^default", "{workspaceRoot}/tsconfig.base.json"],
      "outputs": ["{projectRoot}/dist"]
    },
    "check:api": {
      "cache": true,
      "inputs": ["{projectRoot}/typedoc.json", "^default", "{workspaceRoot}/tsconfig.base.json"]
    },
    "dev": { "continuous": true }
  }
}
```

- **Targets merge.** Nx layers these entries onto the targets it infers from the package.json scripts ([project configuration][nx-project-config]). `nx show project developer` listed `build`, `check:api`, `dev` and `preview` as `nx:run-script` targets carrying the settings above.
- **Caching follows the runtime.** The `workspace:*` dependency creates a static graph edge from `developer` to `@imbustai/story-runtime`, so `^default` puts the runtime's files into the cache key. Editing a doc comment in the runtime re-ran both tasks, and the warning count dropped from 60 to 59. A second unchanged run was a full cache hit.
- **`dev` is continuous.** `continuous: true` (Nx 21 and later) marks `astro dev` as a task that never exits.
- **Colons in target names work.** `nx run developer:check:api` ran as `developer:"check:api"`.
- **A failing gate fails the target.** `nx run developer:build` exited 1 and wrote no `dist/`.
- **Root scripts.** Following the existing convention: `"dev:developer": "nx dev developer"` and `"build:developer": "nx build developer"`.

Alternative wiring: put `check:api` in `dependsOn` of `build` instead of chaining it with `&&` in the script. That was verified too (the failing run exited 130). But Vercel runs the package's `build` script directly (see [Vercel](#vercel)), so it would then need a custom Build Command.

## pnpm notes

- **Adding the app.** `apps/*` is already in [`pnpm-workspace.yaml`][repo-workspace], so creating `apps/developer/package.json` and running `pnpm install` is enough. `typescript: catalog:` keeps TypeDoc's peer on the repo's TypeScript 5.9.
- **Build scripts.** pnpm 10 skips dependency lifecycle scripts unless they are allowed. The scratch install skipped esbuild's script and Astro still built. sharp 0.35, Astro's optional dependency, ships prebuilt binaries and needed nothing. The repo's lockfile already contains esbuild and nx with no allowance, so the docs app adds no new decision. To silence the notice, pnpm 10.26 and later accept `allowBuilds` in `pnpm-workspace.yaml` ([pnpm 10.x settings][pnpm-settings]). Verified on 10.32.1: `allowBuilds: { esbuild: true, nx: false }` left no ignored builds.
- **Hoisting.** Keep pnpm's default hoisting, because TypeDoc's plugin loading depends on it (see the previous section).
- **TypeScript 7.** TypeDoc 0.28's peer range stops at 6.0.x, and the maintainer's TypeScript 7 port is unreleased ([#3098][td-3098], [#3128][td-3128]). If the catalog moves to TypeScript 7, pin the docs app to `typescript ~6.0` or 5.9 until TypeDoc supports it. The maintainer plans a first cut of that port without watch mode, without options read from tsconfig files and without JSON or JSONC option files. A later move from `typedoc.json` to `typedoc.config.mjs` may therefore be needed. This is his stated plan, not a release.
- **Filtered installs.** `pnpm install --filter "@imbustai/developer..."` worked in the scratch workspace. It still installed the root package's dependencies (tslib, typescript), so TypeDoc's type-check passed. In this repo the root package holds the website's dependencies, so a filtered install saves little.

## Vercel

A static Astro site needs no adapter on Vercel ([Astro on Vercel][vercel-astro]). #15 says local first, Vercel later, and nothing below blocks a local-only start.

| Setting | Value | Why |
|---|---|---|
| Project | a new Vercel project on the same repository | one project per deployed directory ([monorepos][vercel-monorepos]) |
| Root Directory | `apps/developer` | |
| Include source files outside the Root Directory | on; the default for projects created after 2020-08-27 | TypeDoc reads `../../packages/story-runtime` and the root `tsconfig.base.json` ([monorepo FAQ][vercel-monorepo-faq]) |
| Framework Preset | Astro, auto-detected from the `astro` dependency | the preset's build command is `astro build` and its output is `dist` ([source][vercel-frameworks]) |
| Build Command | leave the default | with no override, Vercel runs the package's `vercel-build`, `now-build` or `build` script before falling back to the preset command ([source][vercel-static-build-getcommand], [source][vercel-static-build-script]). The gate in `build` therefore runs on every deploy |
| Output Directory | `dist` (from the preset) | |
| Install Command | leave the default | Vercel detects pnpm from the root `pnpm-lock.yaml`. Lockfile 9.0 means pnpm 9 or 10, and "newer projects will prefer 10" ([package managers][vercel-package-managers]). To pin 10.32.1 exactly, add `"packageManager": "pnpm@10.32.1"` to the root package.json and set `ENABLE_EXPERIMENTAL_COREPACK=1` ([configure a build][vercel-configure-build]) |
| Node.js version | 24.x (Vercel's default) or 22.x | Astro 7 needs 22.12 or later. 20.x would fail, and Vercel deprecates it on 2026-10-01 ([Node versions][vercel-node]) |
| Skip unaffected projects | on | works for pnpm workspaces when dependencies between packages are declared in package.json, hence the `workspace:*` dependency ([monorepos][vercel-monorepos]) |
| Deployment Protection | "All Deployments" with Vercel Authentication | it is an internal tool; Vercel says Vercel Authentication for All Deployments needs no paid add-on ([deployment protection][vercel-protection]) |

Nx remote caching on Vercel: `@vercel/remote-nx` doesn't work with Nx 20 or later, and Vercel points to Nx's self-hosted cache API or to Turborepo instead ([Nx on Vercel][vercel-nx]). A build of about 10 seconds doesn't need it.

## Known gotchas

1. **No validation in the build.** starlight-typedoc never validates. Without the `typedoc --emit none` step, undocumented exports ship silently ([details](#failing-the-build-on-undocumented-hooks-and-utilities)).
2. **Package-name filter.** A missing `packagesRequiringDocumentation` combined with entry points from two packages turns the gate into a no-op, with exit 0.
3. **Default kinds are noisy.** The default `requiredToBeDocumented` would demand 433 comments today, including every zod-shape field. Choose the kinds on purpose.
4. **Current code fails `notExported`.** It already raises five `notExported` warnings, and those fail the gate too.
5. **Mismatched exclusions.** starlight-typedoc's hidden defaults (`excludeInternal`, `excludeProtected`, `readme: "none"`, its own theme) override `typedoc.json` for the site, but not for the CLI. Mirror the exclusions in `typedoc.json`. Settings such as `readme` must go through the plugin's `typeDoc` option ([source][st-typedoc-defaults], [source][td-bootstrap]).
6. **Type errors block the docs.** TypeScript errors in the runtime abort the build (CLI exit 3). `tslib` must stay resolvable while `tsconfig.base.json` has `importHelpers: true` and `target: es2015`.
7. **Zod aliases inline at usage sites.** Use named interfaces for hook-facing types ([details](#how-zod-inferred-types-render)).
8. **The sidebar is kind-based.** Categories and groups only shape the index page, and `router: "group"` or `"category"` empties the API sidebar without an error.
9. **Starlight 0.39 sidebar syntax.** `{ label, autogenerate }` is gone and must become `{ label, items: [{ autogenerate }] }`. Older examples fail with an `AstroUserError` ([changelog][starlight-changelog-039]).
10. **Version floors.** Starlight 0.41 dropped Astro 6, and 0.42 needs Astro 7.2.10 or later ([changelog][starlight-changelog-041], [changelog][starlight-changelog-042]). Follow Starlight's advice to upgrade Starlight and Astro together.
11. **Plugin loading depends on hoisting.** Under pnpm, bare-name TypeDoc plugins depend on the default hoisting.
12. **TypeScript 7 is not supported.** TypeDoc doesn't support it yet, so keep the docs app on TypeScript 6.0 or earlier.
13. **Generated files.** `src/content/docs/reference/` and `.astro/` are regenerated at `astro:config:setup` on dev and build (not preview). Gitignore them and never edit them by hand. A second plugin instance needs its own non-overlapping `output` (0.23.1; [changelog][st-changelog]).
14. **Harmless build noise.** Astro 7 logs rolldown `MODULE_LEVEL_DIRECTIVE` warnings for MDX pages, and `@astrojs/sitemap` warns until `site` is set.
15. **The rename touches more than the docs.** Renaming `@imbustai/story-engine` to `@imbustai/story-runtime` also touches the root `package.json` dependency and `transpilePackages` in [`apps/website/next.config.js`][repo-next-config].

## Alternatives

| Option | Fail on undocumented exports | MDX guides | Generated reference | Verdict |
|---|---|---|---|---|
| Docusaurus 3.10.2 with docusaurus-plugin-typedoc 1.4.3 | same gap: convert plus generateOutputs without validate, and it returns silently when conversion fails ([source][dpt-source]) | yes | yes | no gain; a heavier React build |
| VitePress 1.6.4 with typedoc-vitepress-theme 1.1.4 | the TypeDoc CLI generates the Markdown, so validation and the exit code come built in | no: VitePress compiles each Markdown file into a Vue component ([docs][vitepress-vue]) | yes | fails the MDX requirement |
| Fumadocs 16.15.15 (Next.js 16) with fumadocs-typescript 5.4.1 | no validation; `AutoTypeTable` renders tables for single types ([docs][fumadocs-ts]) | yes | one table per type, not a full reference | would still need the TypeDoc CLI for the reference and the gate; `fumadocs-core` peers `zod 4.x` while the repo is on zod 3.25 |

If Starlight had to be dropped, Fumadocs would be the fallback, and only for keeping every app on Next.js. For this brief, no alternative beats Starlight.

## Could not verify

- **No real Vercel deployment.** The Vercel connector wasn't authenticated, and nothing was deployed. The existing Vercel projects' settings are unknown; the repo has no `vercel.json`.
- **The Hooks behaviour was tested on a hypothetical interface.** The repo has no `Engine` interface yet, so the tests used one written into a scratch copy of the package.
- **Vercel's skip logic for devDependencies.** Vercel's docs say dependencies must be "explicitly stated" in package.json; whether a `devDependencies` entry counts wasn't tested. The sketch uses `dependencies` to be safe. Nx builds the graph edge either way (verified with a devDependency).
- **pnpm filtered installs.** Installing the root package's dependencies was observed, not found in pnpm's docs.
- **TypeDoc's TypeScript 7 support.** Its timeline and limits come from the maintainer's comments on [#3098][td-3098], not from a release.
- **Nx exit codes.** The 130 (the failing `dependsOn` wiring) and 1 (the `&&` build script) were observed; the table of exit codes wasn't found in Nx's docs.

## Sources

Repository files (on `main` at `7faf45e`): [`pnpm-workspace.yaml`][repo-workspace], [`tsconfig.base.json`][repo-tsbase], [`packages/story-engine`][repo-engine], [`src/index.ts`][repo-engine-index], [`schema/turnPlan.ts`][repo-turnplan], [`apps/website/next.config.js`][repo-next-config]. Map context: [#9][issue-9], [#15][issue-15].

[issue-9]: https://github.com/Imbustai/imbustai-app/issues/9
[issue-15]: https://github.com/Imbustai/imbustai-app/issues/15
[issue-18]: https://github.com/Imbustai/imbustai-app/issues/18
[repo-workspace]: ../../pnpm-workspace.yaml
[repo-tsbase]: ../../tsconfig.base.json
[repo-engine]: ../../packages/story-engine
[repo-engine-index]: ../../packages/story-engine/src/index.ts
[repo-turnplan]: ../../packages/story-engine/src/schema/turnPlan.ts
[repo-next-config]: ../../apps/website/next.config.js
[npm-astro]: https://www.npmjs.com/package/astro
[npm-starlight]: https://www.npmjs.com/package/@astrojs/starlight
[npm-st]: https://www.npmjs.com/package/starlight-typedoc
[npm-typedoc]: https://www.npmjs.com/package/typedoc
[npm-tpm]: https://www.npmjs.com/package/typedoc-plugin-markdown
[npm-tpz]: https://www.npmjs.com/package/typedoc-plugin-zod
[st-typedoc-run]: https://github.com/HiDeoo/starlight-typedoc/blob/starlight-typedoc%400.23.1/packages/starlight-typedoc/libs/typedoc.ts#L102-L122
[st-typedoc-bootstrap]: https://github.com/HiDeoo/starlight-typedoc/blob/starlight-typedoc%400.23.1/packages/starlight-typedoc/libs/typedoc.ts#L139-L153
[st-typedoc-defaults]: https://github.com/HiDeoo/starlight-typedoc/blob/starlight-typedoc%400.23.1/packages/starlight-typedoc/libs/typedoc.ts#L34-L47
[st-sidebar]: https://github.com/HiDeoo/starlight-typedoc/blob/starlight-typedoc%400.23.1/packages/starlight-typedoc/libs/starlight.ts#L194-L212
[st-index-hook]: https://github.com/HiDeoo/starlight-typedoc/blob/starlight-typedoc%400.23.1/packages/starlight-typedoc/index.ts#L36-L37
[st-changelog]: https://github.com/HiDeoo/starlight-typedoc/blob/starlight-typedoc%400.23.1/packages/starlight-typedoc/CHANGELOG.md
[st-89]: https://github.com/HiDeoo/starlight-typedoc/issues/89
[st-90]: https://github.com/HiDeoo/starlight-typedoc/issues/90
[td-cli]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/cli.ts#L94-L117
[td-app-convert]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/application.ts#L410
[td-app-typecheck]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/application.ts#L450
[td-app-validate]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/application.ts#L712-L763
[td-bootstrap]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/application.ts#L299-L305
[td-doc-validation]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/validation/documentation.ts#L109
[td-package-plugin-root]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/converter/plugins/PackagePlugin.ts#L82
[td-package-plugin-name]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/converter/plugins/PackagePlugin.ts#L157
[td-plugins]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/utils/plugins.ts#L31
[td-module-path]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/utils/options/declaration.ts#L1016-L1021
[td-router]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/output/router.ts#L564-L640
[td-signature]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/converter/factories/signature.ts#L293-L318
[td-types]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/converter/types.ts#L125-L165
[td-defaults]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/utils/options/defaults.ts#L115
[td-options-exclude]: https://github.com/TypeStrong/typedoc/blob/v0.28.20/src/lib/utils/options/sources/typedoc.ts#L176-L205
[td-validation-docs]: https://typedoc.org/documents/Options.Validation.html
[td-3098]: https://github.com/TypeStrong/typedoc/issues/3098
[td-3128]: https://github.com/TypeStrong/typedoc/issues/3128
[tpz-check]: https://github.com/Gerrit0/typedoc-plugin-zod/blob/v1.4.3/src/plugin.ts#L78
[tpz-comment]: https://github.com/Gerrit0/typedoc-plugin-zod/blob/v1.4.3/src/plugin.ts#L42
[tpz-changelog]: https://github.com/Gerrit0/typedoc-plugin-zod/blob/v1.4.3/CHANGELOG.md
[dpt-source]: https://github.com/typedoc2md/typedoc-plugin-markdown/blob/82cd1dfd94edab06873771771eeb3fdcc2b822b2/packages/docusaurus-plugin-typedoc/src/typedoc.cjs#L21-L34
[starlight-manual]: https://starlight.astro.build/manual-setup/
[starlight-changelog-039]: https://github.com/withastro/starlight/blob/3ec633b8c50d3e1a6d67cae7dc4c50f80101ea41/packages/starlight/CHANGELOG.md#L259-L278
[starlight-changelog-041]: https://github.com/withastro/starlight/blob/3ec633b8c50d3e1a6d67cae7dc4c50f80101ea41/packages/starlight/CHANGELOG.md#L176-L192
[starlight-changelog-042]: https://github.com/withastro/starlight/blob/3ec633b8c50d3e1a6d67cae7dc4c50f80101ea41/packages/starlight/CHANGELOG.md#L59-L73
[nx-project-config]: https://nx.dev/docs/reference/project-configuration
[pnpm-settings]: https://pnpm.io/10.x/settings
[vercel-astro]: https://vercel.com/docs/frameworks/frontend/astro
[vercel-monorepos]: https://vercel.com/docs/monorepos
[vercel-monorepo-faq]: https://vercel.com/docs/monorepos/monorepo-faq
[vercel-nx]: https://vercel.com/docs/monorepos/nx
[vercel-configure-build]: https://vercel.com/docs/builds/configure-a-build
[vercel-package-managers]: https://vercel.com/docs/package-managers
[vercel-node]: https://vercel.com/docs/functions/runtimes/node-js/node-js-versions
[vercel-protection]: https://vercel.com/docs/deployment-protection
[vercel-frameworks]: https://github.com/vercel/vercel/blob/c628be7835e03a965b93e9cf9e2bd5ac2acbf5eb/packages/frameworks/src/frameworks.ts#L341-L386
[vercel-static-build-getcommand]: https://github.com/vercel/vercel/blob/c628be7835e03a965b93e9cf9e2bd5ac2acbf5eb/packages/static-build/src/index.ts#L161-L195
[vercel-static-build-script]: https://github.com/vercel/vercel/blob/c628be7835e03a965b93e9cf9e2bd5ac2acbf5eb/packages/static-build/src/index.ts#L790-L805
[vitepress-vue]: https://vitepress.dev/guide/using-vue
[fumadocs-ts]: https://fumadocs.dev/docs/integrations/typescript
