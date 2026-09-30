# Imbustai developer docs

Starlight guides and a runtime API reference generated from TypeScript.

From the repository root:

```sh
pnpm install
pnpm dev:developer       # http://localhost:4321
pnpm build:developer     # validation gate, then static site
pnpm preview:developer
```

Use Node 24+ and pnpm 10. Output: `apps/developer/dist/`.
No API keys or database connection are needed.

`pnpm --filter @imbustai/developer check:api` runs only the documentation gate.
The build runs `typedoc --emit none` before Astro because starlight-typedoc does
not validate documentation. Both read `typedoc.json`.

Edit `src/content/docs/guides/` and `src/data/engines.ts`; never edit the generated
`src/content/docs/reference/`. See the maintenance guide for validation rules,
theming and future hosting configuration.
