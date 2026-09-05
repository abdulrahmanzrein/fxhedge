# Dev 2 — Frontend / UI Track

You own everything the user sees: the design system, the app shell, all 8 screens, and the shared components. Read `../SYNC-PROTOCOL.md` and `../GIT-WORKFLOW.md` first.

**Your counterpart (Dev 1)** is building the data layer + API routes in parallel. You do **not** wait for them. You build every screen against the static fixtures below, then swap to `fetch('/api/...')` once Dev 1's routes are live. The component contracts stay identical — the swap is a one-line import change.

---

## Your task checklist (in order)

- [ ] **1. Design system** — branch `dev2/design-system`
  - [ ] `app/globals.css` — the exact CSS variables (build guide §3)
  - [ ] `tailwind.config.ts` — map tokens to utilities (`bg-surface`, `text-primary`, `border-border`, etc.)
  - [ ] `app/layout.tsx` — fonts (Instrument Serif + Satoshi from Fontshare), theme provider, `data-theme` on `<html>`
  - [ ] `components/theme-toggle.tsx` — light/dark toggle, respects `prefers-color-scheme`, `prefers-reduced-motion`
  - [ ] Open PR. This is the visual foundation — merge before other screens.
- [ ] **2. shadcn/ui primitives** — branch `dev2/shadcn-primitives`
  - [ ] `npx shadcn@latest init`
  - [ ] Add: `button`, `card`, `input`, `tabs`, `badge`, `skeleton`, `separator`, `avatar`
  - [ ] `components/kpi-card.tsx` — value (30px bold), label (12px uppercase muted), delta pill, optional sparkline
  - [ ] `components/markdown.tsx` — `react-markdown` + `remark-gfm` wrapper for chatbot answers
  - [ ] `components/auth-form.tsx` — tabbed signup/login form (reused on both screens)
- [ ] **3. App shell** — branch `dev2/app-shell`
  - [ ] `components/app-shell.tsx` — fixed left sidebar (248px) + main content (max-width 1180px)
  - [ ] Sidebar groups: "Workspace" (Dashboard, New transfer, Cost breakdown, Compare providers, Risk explorer) + "Faith & finance" (Sharia options, The weight of riba)
  - [ ] Topbar: breadcrumb left, theme toggle + logout + avatar (user initials) right
  - [ ] Sidebar collapses to a top row under 920px (mobile)
- [ ] **4. Landing + auth** — branch `dev2/landing-auth`
  - [ ] `app/(marketing)/page.tsx` — hero ("Stop losing margin to hidden FX costs") + 2 CTAs + live-data preview card + 3-up features
  - [ ] `app/(auth)/signup/page.tsx` — step 1: name, email, password
  - [ ] `app/(auth)/onboarding/page.tsx` — step 2: business profile (business name, type, supplier currency, home currency, invoice amount, target margin, days until due)
  - [ ] `app/(auth)/login/page.tsx` — tabbed login/signup
  - [ ] Wire to `lib/auth.ts` once Dev 1 ships it (until then, mock: redirect to `/dashboard` on submit)
- [ ] **5. Dashboard** — branch `dev2/dashboard` — **the hero screen**
  - [ ] Personalized from `getProfile()`: greeting "Assalamu alaikum, {firstName}", avatar (first 2 chars uppercased), narrative subtext, active-scenario label
  - [ ] 4 KPI cards (best rate, worst provider cost, saving vs worst, margin at risk −5%)
  - [ ] Active scenario card + top live providers list
  - [ ] Build against `SAMPLE` fixture first; swap to `/api/fx` + `/api/providers` when ready
- [ ] **6. Remaining screens** — branch `dev2/screens-rest`
  - [ ] `app/(app)/cost/page.tsx` — waterfall (FX markup + transfer + intermediary + receiving), every value labeled by source
  - [ ] `app/(app)/compare/page.tsx` — ranked providers, highlight mid-market
  - [ ] `app/(app)/risk/page.tsx` — 3 cards: drift gauge, historical distribution histogram (Recharts), pay-now-vs-wait decision
  - [ ] `app/(app)/transfer/page.tsx` — scenario inputs (pair, amount, revenue, days, margin) → save via `/api/scenarios`
- [ ] **7. Faith layer** — branch `dev2/faith-layer`
  - [ ] `app/(app)/sharia/page.tsx` — options panel (natural hedge, wa'd, murabaha, vs conventional forward) + chatbot UI
  - [ ] `app/(app)/reflect/page.tsx` — "The weight of riba": Quran verses (2:275, 2:276, 2:278–279, 3:130, 30:39), Hadith (Musnad Ahmad, Sahih Muslim, al-Tabarani), real Reddit stories (r/Daytrading, r/Forexstrategy, r/Forex) with links, closing CTA → `/sharia`, crisis-line note
  - [ ] Chatbot UI: input + suggested-question chips + markdown answer renderer + "grounded in cited sources, not a fatwa" note

---

## FIXTURES — build every screen against these (real numbers from the verified prototype)

Create `lib/fixtures.ts` with this. These mirror Dev 1's API contract exactly — when routes are live, swap `SAMPLE` for `fetch()`.

```ts
// lib/fixtures.ts
export const SAMPLE = {
  pair: "EUR-CAD",
  from: "EUR", to: "CAD",
  invoiceAmount: 12000, revenue: 18000, targetMargin: 10, daysAgo: 21,
  ecbRateToday: 1.6038, ecbRateInvoiceDay: 1.6049,   // drift -0.1% (slightly in Aisha's favor)
  trueCostToday: 19246,                               // invoiceAmount * ecbRateToday
  marginToday: -6.9,                                 // (revenue - trueCostToday) / revenue * 100
  bestProvider: { name: "Wise", received: 19195, midMarket: true },
  worstProvider: { name: "PayPal", received: 18428 },
  savingVsWorst: 767,                                // bestProvider.received - worstProvider.received
  marginAtRiskMinus5pct: -2208,                      // if EUR rises 5%
  providers: [
    { name: "Wise",          received: 19195, midMarket: true },
    { name: "Instarem",      received: 19158 },
    { name: "Deutsche Bank", received: 19156 },
    { name: "Western Union", received: 19098 },
  ],
  // risk explorer
  histWindows: 2796, worst5pctMove: 3.2, worstOnRecord: 9.8, driftTodayPct: -0.1,
  decision: "marginal" as const, decisionReason: "Drift is tiny and in your favor, but history shows 5% of 21-day windows moved 3.2%+ against you.",
};

// mock session until Dev 1 ships auth
export const MOCK_PROFILE = {
  user_id: "mock",
  business_name: "Aisha's Halal Imports",
  business_type: "Halal grocery importer",
  home_currency: "CAD",
  supplier_currency: "EUR",
  invoice_amount: 12000,
  target_margin: 10,
  days_until_due: 21,
  updated_at: new Date().toISOString(),
};
```

### Currency symbols (for personalization)
`USD`/`CAD`/`AUD`/`SGD` → `$`, `GBP` → `£`, `EUR` → `€`. Derive `fromCur` from the pair (`"EUR-CAD"` → `"EUR"`).

---

## The design tokens (paste into globals.css)

Full CSS in build guide §3. Summary: **light** = `--color-bg:#EEF2F8`, `--color-primary:#1D4ED8` (blue), `--color-text:#0A0E1A`. **dark** = `--color-bg:#1A1813` (beige-brown), `--color-primary:#4ADE80` (green), `--color-text:#F5F3EE`. All components use CSS variables — no hardcoded hex. Fonts: Instrument Serif (headings) + Satoshi (body + money, `font-feature-settings:"tnum" 1,"lnum" 1`).

---

## The reflect section content (use exactly — sourced, not invented)

**Quran verses** (Surah:Verse): 2:275, 2:276, 2:278–279, 3:130, 30:39 — full English text in build guide §5 screen 9.
**Hadith:** Musnad Ahmad (riba worse than 36 acts of zina, sahih by al-Albani), Sahih Muslim (Prophet ﷺ cursed consumer/giver/writer/witness of riba; forbade gharar), al-Tabarani (72 types of riba).
**Reddit stories** (real posts, keep links): r/Daytrading RavenBJ, r/Forexstrategy tradingthrowawayacc, r/Forex uncertainuser00 — direct quotes + "Read the full post" links to the original threads.
**Crisis note:** Canada/US 9-8-8, UK 116 123 (Samaritans), international findahelpline.com.
**Disclaimer:** "This is general education, not a fatwa or financial advice…"

---

## The swap pattern (fixtures → live API)

Before Dev 1's routes exist:
```tsx
import { SAMPLE } from "@/lib/fixtures";
const data = SAMPLE;  // or MOCK_PROFILE for auth
```

After Dev 1 ships `/api/fx` + `/api/providers`:
```tsx
const data = await fetch("/api/fx?pair=EUR-CAD&days_ago=21").then(r => r.json());
```
Same shape. No component changes. This is why the contract matters.

---

## What you do NOT touch

- `lib/supabase/*`, `lib/auth.ts`, `lib/fx.ts`, `lib/providers.ts`, `lib/cost.ts`, `lib/risk.ts`, `app/api/*`, `middleware.ts`, `types/index.ts`, `.env.local` — Dev 1's.
- If you need a contract change, ask Dev 1 to open a `contract:` PR (see GIT-WORKFLOW).

## When you're done with a task

1. `npm run build` passes (no TS errors).
2. Screen renders correctly against fixtures at desktop (1280px) and mobile (375px), in light AND dark mode.
3. Open a PR using the template in `../GIT-WORKFLOW.md`.
4. Update your checklist above.
5. If a screen depends on an API route, note it in the PR ("uses fixtures; swap pending Dev 1's `/api/fx`").
