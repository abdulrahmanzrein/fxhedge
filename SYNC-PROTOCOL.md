# Sync Protocol — read this first (both devs + both agents)

This is the single source of truth for how Dev 1 (backend/data) and Dev 2 (frontend/UI) stay in sync while building the Hedged Next.js app in parallel. **Both human devs AND the AI agent helping each dev must read this file before starting.**

---

## The one rule that prevents 90% of integration pain

**The shared TypeScript contract (`types/index.ts`) is locked before anyone builds.** Dev 1 drafts it, Dev 2 reviews it, both commit to it. Dev 1's API routes return exactly these shapes; Dev 2's components consume exactly these shapes. If it compiles on both sides, it integrates. No silent shape drift.

---

## How the two tracks decouple

Dev 2 must not wait on Dev 1 to start building screens. The bridge is a fixtures file:

- Dev 2 builds every screen against **static fixtures** (`dev2-frontend/FIXTURES.md`) — the exact real numbers from the verified prototype.
- Dev 1 builds API routes that return **the same shapes** as those fixtures.
- When a route is ready, Dev 2 swaps `import { SAMPLE } from 'lib/fixtures'` for `fetch('/api/fx')`. **Zero component changes** if the contract held.

This means Dev 2 can build and visually verify the entire dashboard before a single live API exists.

---

## The integration handoffs (only four — these are the only times you must coordinate)

1. **`types/index.ts`** — locked first. See `CONTRACT.md` / Dev 1's file. Shapes: `Profile`, `Scenario`, `FXRate`, `ProviderQuote`, `CostBreakdown`, `RiskResult`, `ChatAnswer`.
2. **Auth → screens** — Dev 1 ships `lib/auth.ts` (`getSession`, `getProfile`, `signUp`, `signIn`, `signOut`, `upsertProfile`) + `middleware.ts` before Dev 2 wires the dashboard. Until then Dev 2 uses a mock session against fixtures.
3. **API routes → screens** — each route returns the fixture shape. Dev 2 does the swap.
4. **App shell + layout** — Dev 2 owns this exclusively. Dev 1 never edits `app/layout.tsx`, `components/app-shell.tsx`, or `globals.css`. If Dev 1 needs a layout change, they ask Dev 2.

---

## File ownership (merge-conflict prevention)

| Owner | Files only they touch |
|---|---|
| Dev 1 | `lib/supabase/*`, `lib/auth.ts`, `lib/fx.ts`, `lib/providers.ts`, `lib/cost.ts`, `lib/risk.ts`, `types/index.ts` (drafts), `middleware.ts`, `app/api/*`, `.env.local` |
| Dev 2 | `app/layout.tsx`, `globals.css`, `tailwind.config.ts`, `components/app-shell.tsx`, `components/theme-toggle.tsx`, `components/ui/*`, `components/kpi-card.tsx`, `components/markdown.tsx`, `components/auth-form.tsx`, `app/(marketing)/*`, `app/(auth)/*`, `app/(app)/*` |

**Shared (both edit, but via PR only):** `types/index.ts`, `lib/fixtures.ts`, `package.json`, `README.md`.

---

## Daily sync ritual (5 minutes, twice a day)

- **Morning standup:** each dev states (a) what they finished yesterday, (b) what they're doing today, (c) any contract they need from the other. The agent helping each dev should surface blockers from the contract.
- **End-of-day check-in:** confirm the shared contract still holds, merge any ready PRs to `main`, update the task checklist in your own `CONTEXT.md`.

---

## When an agent should flag a sync problem

The AI agent helping each dev should speak up immediately if:
- The dev is about to change a shape in `types/index.ts` without telling the other dev.
- A component is being built that depends on an API route that doesn't exist yet (and isn't using fixtures).
- Someone is editing a file they don't own.
- A commit is going to `main` without a PR.

---

## The golden constraint (both devs)

Never predict exchange rates. Never act like a bank (Hedged never moves money). The Islamic finance assistant never issues a fatwa. These are challenge rules, not preferences.
