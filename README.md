# Hedged — Build Workspace (2-dev split)

Two devs, two AI agents, one Next.js app. This folder is the source of truth for who does what, how you sync, and how you ship.

## Start here (read in this order — both devs + both agents)

1. **`SYNC-PROTOCOL.md`** — how the two tracks stay in sync, the shared contract, file ownership, the fixtures bridge.
2. **`GIT-WORKFLOW.md`** — branches, commits, PRs, review, merge, deployment.
3. **Your own context:**
   - Dev 1 (backend/data): **`dev1-backend/CONTEXT.md`** — your tasks + the full API/type contract you must implement.
   - Dev 2 (frontend/UI): **`dev2-frontend/CONTEXT.md`** — your tasks + the fixtures you build against + design tokens.

## The split in one line

- **Dev 1** owns Supabase + auth + the pure `lib/` data layer + API routes + the chatbot. Returns the exact shapes in `dev1-backend/CONTEXT.md` → CONTRACT.
- **Dev 2** owns the design system + app shell + all 8 screens + shared components. Builds against `dev2-frontend/CONTEXT.md` → FIXTURES, swaps to `fetch()` when Dev 1's routes are live.

## The contract (the one thing that must be locked first)

`types/index.ts` — Dev 1 drafts it, Dev 2 reviews it, both commit to it. If it compiles on both sides, it integrates. Any change to it is a `contract:` PR that both must handle the same day.

## Reference docs (in the project repo / hedged-docs)

- **`BUILD-GUIDE.md`** — the full engineering spec: install commands, project structure, Supabase SQL, design tokens, every screen, the data layer, the chatbot prompt, the build phases.
- **`PRD.md`**, **`architecture.md`**, **`ui-context.md`** — product + architecture context.
- **Prototype source** (`hedged-live/index.html` + `server.py`) — the working reference implementation. Port from it.

## Golden constraints (both devs, always)

Never predict exchange rates. Never act like a bank (Hedged never moves money). The Islamic finance assistant never issues a fatwa. These are challenge rules.

## TL;DR workflow

```
git checkout main && git pull
git checkout -b dev1/supabase-auth      # or dev2/design-system
# build the task, commit often with conventional commits
npm run build                           # must pass
# open a PR using the template in GIT-WORKFLOW.md
# cross-review (the other dev or the agent)
# squash-merge to main, delete the branch
# both: git pull origin main before the next branch
```
