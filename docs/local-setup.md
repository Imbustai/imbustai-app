# Local development

Run commands from the repository root. Use Node 24.11.1 and pnpm 10.32.1.
`mise.toml` pins Node for this repository; with mise installed, run `mise trust`
and `mise install` first. Node 26 currently fails the DOM test involving
`localStorage`.

```bash
pnpm install --frozen-lockfile
```

Copy `apps/website/.env.example` to `apps/website/.env` only if the latter does
not already exist. This file is ignored by Git. Configure:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `SUPABASE_SERVICE_ROLE_KEY` for the website's Supabase project.
- `ANTHROPIC_API_KEY` for story reply generation.
- `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` for checkout and payment events.
- `NEXT_PUBLIC_SITE_URL=http://localhost:4200` for local redirects.

The website uses a hosted Supabase project; installing dependencies does not
apply migrations or seed stories. The expected schema is in
`supabase/migrations/`. Check the target project before applying migrations.

```bash
pnpm dev:website --port 4200
pnpm test
pnpm build:website
```

Open <http://localhost:4200>. The default `pnpm dev` starts the separate
tryout application, so use `dev:website` for this project.

For remote access through LocalTunnel, run:

```bash
pnpm dev:website:tunnel
```

This starts the website on port 4200, waits for its health check, then starts
LocalTunnel and prints the public HTTPS URL, the `/games` link, and the tunnel
password if available. Sign in with your existing account to access stories
and letters. Node, npm, and installed project dependencies are required;
npm downloads the pinned LocalTunnel CLI on first use. This launcher targets
Linux/macOS. Use `PORT=4300 pnpm dev:website:tunnel` to choose another port.
Keep the command running; Ctrl+C stops both processes. Each run may get a
different public URL. When starting this for remote access, return the printed
LocalTunnel URL and password to the requester.

If Nx's background worker cannot run in a restricted environment, prefix the
command with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`.

Tests use fixtures and mocks. They do not prove that Supabase, Stripe or the
live AI provider is configured. `pnpm sim:voss` makes paid AI calls;
`pnpm verify:rls` creates temporary records in the configured database.

Vite is an explicit development dependency because the React test plugin
requires Vite 8. An implicit resolution through Nx can select Vite 7 and fail
before tests start with `ERR_PACKAGE_PATH_NOT_EXPORTED` for `vite/internal`.
Nx 22's transitive Vite integrations still declare Vite 5–7 support; the website
uses Next.js and tests run directly through Vitest, not those integrations.
