# Coordinator prompt — handoff of 2026-11-09

Paste everything below the line into a Claude desktop Code session on the second computer.

---

You're the coordinator for the imbustai-app repo (github.com/Imbustai/imbustai-app) on this computer. It used to be my main machine, but it's out of date. Another computer did a lot of work and pushed all of it to GitHub on 2026-11-09. Both machines use the same Supabase dev DB (project qzturtjtcxlgfiumnfvq), and every migration is already applied to it.

## 0. Setup (do this yourself, before launching anything)
1. Get the repo up to date: `git fetch --all --prune`, then check out `main` and pull. If there are local changes, don't throw them away; show them to me first.
2. Use Node 24.11.1 and pnpm 10.32.1 (`mise trust && mise install` if mise is installed). Node 26 breaks one DOM test. Run `pnpm install --frozen-lockfile`.
3. I'll copy `apps/website/.env` over by hand (it's the dev DB, not production). Wait until I confirm it's there.
4. Read AGENTS.md, CONTEXT-MAP.md, packages/story-engine/CONTEXT.md and the map, issue #9 (`gh issue view 9`). The map is the source of truth for decisions already made. Don't reopen them.
5. Save these as memories (this machine doesn't have them):
   - Always work in a git worktree, never in the main checkout. I run several sessions in parallel.
   - Migrations: never ask me for supabase login/link/db push. Use the Supabase connector:
     1. `get_project`. If it's INACTIVE, `restore_project` and wait until it's ACTIVE_HEALTHY.
     2. `list_migrations` against `supabase/migrations/`. A new file's version must be later than every existing one.
     3. `execute_sql`: `begin; <file>; insert into supabase_migrations.schema_migrations (version,name,statements) values (...); commit;`
     Never use `apply_migration` (it breaks the history).
   - Every Italian Letter gets a native-editor pass for readability, not mechanical style rules. The teacher who approved the method will be a playtester, so she never reads generated Turns. I approve them.
   - When a ticket produces letters for me to judge, put them in the app as a playable Game I can open, not in a markdown file. Ask before writing anything new to the shared DB beyond what a ticket says.
   - Every ticket that spends on paid model calls states the spend in its resolution.
6. Run `pnpm test` on main and report the result.
7. PRs:
   - **#53** (local setup doc, Node pin, tunnel script, research notes, this handoff file): review it, mark it ready, merge it.
   - **#52** (engine-voss mechanics, ticket #40, still a draft): rebase it on main, run the tests and summarise it for me. Merge it after I say yes. #41 depends on it.

## 1. Then launch these sessions, one ticket each, each in its own worktree
- **A, #43 (HITL, start now):** how the fixed pieces look to the Player. A throwaway prototype is already on branch `wayfinder/fixed-pieces-ui`: route `/prototype/fixed-pieces`, 4 variants (today / A "Carta in linea" / B "La busta e il lettore" / C "Il fascicolo"). Start the website from that branch, give me the URL and let me pick per piece. Then build what I chose. Any new DS component or token needs my approval first (Regola #7).
- **B, #31 (AFK, start now):** Runs, an AI player under a cost cap. Prove it on engine-classic first. The first Run is capped at $12. Read docs/research/voss-simulation-costs-2026-09-28.md first.
- **C, #41 (HITL, start after #52 is merged):** the engine-voss writing pipeline. Done when I play Turn 1 in the app on dev and approve the batch in /admin.
- **Queued, don't start yet:** #42 (Epilogues and the closing batch) starts after #41 closes. #34 (the final title) waits for the playtest.

Each session uses the skills the map names (prototype, tdd, claude-api, grilling…), runs tests before closing, opens a PR and updates the ticket and map #9 when it closes. Tell me when a session needs me. Keep a short status table of all sessions and update it each time one reports.
