# Git Workflow — branches, commits, PRs (both devs follow this)

A lightweight flow tuned for two devs vibecoding a hackathon app. Goal: never block each other, never break `main`, never lose work.

---

## Branch strategy

```
main              ← protected, always deployable, auto-deploys to Vercel
├── dev1/<area>   ← Dev 1's feature branches
└── dev2/<area>   ← Dev 2's feature branches
```

- **`main` is protected.** Never commit directly to it. Everything lands via PR.
- **One branch per logical task.** Branch off `main`, build the task, open a PR, merge, delete the branch.
- **Branch naming:** `dev1/<area>` or `dev2/<area>`. Examples: `dev1/auth-setup`, `dev1/fx-lib`, `dev2/design-system`, `dev2/dashboard-screen`.

### Suggested branch sequence

**Dev 1:**
1. `dev1/supabase-auth` — Supabase project + SQL schema + `lib/supabase/*` + `lib/auth.ts` + `middleware.ts` + `types/index.ts` (draft).
2. `dev1/fx-lib` — `lib/fx.ts` + `/api/fx` + `/api/history`.
3. `dev1/providers-lib` — `lib/providers.ts` + `/api/providers`.
4. `dev1/cost-risk` — `lib/cost.ts` + `lib/risk.ts` (unit tests).
5. `dev1/chatbot` — `/api/ask` + the system prompt.

**Dev 2:**
1. `dev2/design-system` — `globals.css`, `tailwind.config.ts`, `layout.tsx`, theme toggle, fonts.
2. `dev2/shadcn-primitives` — `components/ui/*`.
3. `dev2/app-shell` — sidebar + topbar.
4. `dev2/landing-auth` — landing + signup + onboarding + login.
5. `dev2/dashboard` — KPIs + scenario card + providers (fixtures first).
6. `dev2/screens-rest` — cost, compare, risk, transfer.
7. `dev2/faith-layer` — sharia + chatbot UI + reflect.

---

## Commit conventions

Use **conventional commits** — one change per commit, clear message. This makes the history readable and lets you cherry-pick if something breaks.

```
feat: add Supabase auth and middleware
fix: correct EUR/CAD rate parsing in lib/fx
chore: add recharts dependency
refactor: extract margin calc into lib/cost
docs: update CONTEXT checklist
```

Prefixes: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`.

**Commit often.** Small commits are easy to review and easy to revert. A 6-hour uncommitted chunk is a liability.

---

## PR rules — when to open one

Open a PR when **all** of these are true:
1. The task compiles (`npm run build` passes, no TS errors).
2. It works against the shared contract — your changes match `types/index.ts`.
3. It doesn't touch files you don't own (see SYNC-PROTOCOL ownership table).
4. You've updated the checklist in your `CONTEXT.md`.

### PR template (copy into every PR description)
```
**What:** <one-line summary>
**Area:** dev1-backend | dev2-frontend
**Files I own (changed):** <list>
**Contract impact:** none | yes — <what changed in types/index.ts>
**Builds:** ✅ `npm run build` passes
**Checked against:** fixtures | live API | both
```

---

## Review + merge

- **Cross-review:** the other dev reviews your PR (they know the contract). For a hackathon, the AI agent can do a first-pass review (check contract compliance, ownership, build status) and a human gives final approval.
- **Merge rule:** squash-and-merge to `main`, delete the branch.
- **After every merge to `main`:** both devs `git pull origin main` before starting a new branch. Never branch off a stale `main`.

---

## Handling contract changes (the one thing that can block the other dev)

If you need to change a type in `types/index.ts`:
1. **Do not** push it silently. Open a PR titled `contract: <change>`.
2. Notify the other dev immediately (in the shared channel / standup).
3. The other dev updates their side within the same day.
4. Merge only after both sides compile.

---

## Vercel / deployment

- Connect the GitHub repo to Vercel. Every push to `main` auto-deploys.
- PRs get preview deployments — share the preview URL in the PR for review.
- `main` = the demo URL judges see. Keep it green.
