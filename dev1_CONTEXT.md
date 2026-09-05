# Dev 1 — Backend / Data Track

You own everything behind the UI: Supabase + auth, the pure data layer, the API routes, and the chatbot. Read `../SYNC-PROTOCOL.md` and `../GIT-WORKFLOW.md` first.

**Your counterpart (Dev 2)** is building all the screens in parallel against static fixtures (`../dev2-frontend/FIXTURES.md`). Your job: ship API routes that return the **exact same shapes** as those fixtures, so Dev 2 swaps fixtures for `fetch()` with zero component changes.

---

## Your task checklist (in order)

- [ ] **1. Supabase + auth + contract** — branch `dev1/supabase-auth`
  - [ ] Create Supabase project; note URL + anon key + service role key in `.env.local`
  - [ ] Run the SQL schema + RLS + trigger (in the build guide §4b)
  - [ ] `lib/supabase/client.ts` (browser client via `createBrowserClient`)
  - [ ] `lib/supabase/server.ts` (server client via `@supabase/ssr`, cookie-based)
  - [ ] `middleware.ts` — protect `(app)` routes, refresh session cookie
  - [ ] `lib/auth.ts` — `signUp`, `signIn`, `signOut`, `getSession`, `getProfile`, `upsertProfile`
  - [ ] Draft `types/index.ts` — **send to Dev 2 for review before building further** (this is the shared contract)
  - [ ] Open PR `contract: types + auth`. Merge after Dev 2 confirms it compiles on their side.
- [ ] **2. FX data** — branch `dev1/fx-lib`
  - [ ] `lib/fx.ts` — ECB/Frankfurter latest + BoC Valet cross-check
  - [ ] `/api/fx` route (returns `FXRate` shape — see CONTRACT below)
  - [ ] `/api/history` route (returns historical series for the risk explorer)
  - [ ] Add caching (e.g. `revalidate` / in-memory) so you don't hammer the public APIs
- [ ] **3. Provider data** — branch `dev1/providers-lib`
  - [ ] `lib/providers.ts` — Wise Comparison API client
  - [ ] `/api/providers` route (returns `ProviderQuote[]` shape)
  - [ ] Dedup providers by name; rank by `receivedAmount` desc
- [ ] **4. Cost + risk engines** — branch `dev1/cost-risk`
  - [ ] `lib/cost.ts` — margin engine (waterfall + margin math). **Unit-test this.** It's the hero differentiator.
  - [ ] `lib/risk.ts` — historical move-distribution + decision engine (volatility, not prediction — compliant)
- [ ] **5. Chatbot** — branch `dev1/chatbot`
  - [ ] `/api/ask` route (server-side Anthropic call — key NEVER in client bundle)
  - [ ] Paste the verbatim system prompt (build guide §7)
  - [ ] `/api/suggested` route (starter questions)
- [ ] **6. Scenarios persistence** — branch `dev1/scenarios`
  - [ ] `GET /api/scenarios` + `POST /api/scenarios` (CRUD on the `scenarios` table, RLS-enforced)

---

## CONTRACT — the shapes your routes must return

These are the exact shapes Dev 2's components consume (and the fixtures mirror). If you return these, integration is automatic.

```ts
// types/index.ts — the shared contract. Lock this first.

export interface Profile {
  user_id: string;
  business_name: string | null;
  business_type: string | null;
  home_currency: string;        // "CAD"
  supplier_currency: string;    // "EUR"
  invoice_amount: number;       // 12000
  target_margin: number;         // 10
  days_until_due: number;        // 21
  updated_at: string;
}

export interface Scenario {
  id: string;
  user_id: string;
  label: string;
  amount: number;
  pair: string;                  // "EUR-CAD"
  revenue: number;
  days_ago: number;
  target_margin: number;
  saved_at: string;
}

export interface FXRate {
  pair: string;                   // "EUR-CAD"
  from: string;                   // "EUR"
  to: string;                     // "CAD"
  rate: number;                   // 1.6038
  rate_invoice_day: number;       // 1.6049  (the rate `days_ago` days back)
  source: string;                 // "ECB / Frankfurter"
  fetched_at: string;
}

export interface ProviderQuote {
  name: string;                   // "Wise"
  received: number;               // 19195 — amount the supplier gets
  mid_market: boolean;            // true for the mid-market provider
  transfer_fee?: number;
  logo?: string;
}

export interface CostBreakdown {
  invoice_amount: number;         // 12000
  revenue: number;                // 18000
  ecb_rate_today: number;        // 1.6038
  true_cost_today: number;        // 19246 = invoice_amount * ecb_rate_today
  margin_today: number;           // -6.9 (%)
  best_provider: ProviderQuote;
  worst_provider: ProviderQuote;
  saving_vs_worst: number;       // 767
  margin_at_risk_minus5pct: number; // -2208
  providers: ProviderQuote[];      // ranked list
}

export interface RiskResult {
  pair: string;
  hist_windows: number;          // 2796
  worst_5pct_move: number;       // 3.2 (%)
  worst_on_record: number;       // 9.8 (%)
  drift_today_pct: number;       // -0.1
  decision: "pay_now" | "wait" | "marginal";
  decision_reason: string;
}

export interface ChatAnswer {
  answer: string;                 // markdown
  model?: string;
  error?: boolean;
}
```

### Route → shape map

| Route | Returns | Notes |
|---|---|---|
| `GET /api/fx?pair=EUR-CAD&days_ago=21` | `FXRate` | latest + invoice-day rate |
| `GET /api/history?pair=EUR-CAD` | `{ rates: { [date]: number } }` | full historical series |
| `GET /api/providers?from=EUR&to=CAD&amount=12000` | `ProviderQuote[]` | ranked, deduped |
| `POST /api/ask` `{question, amount?, pair?, margin_at_risk?}` | `ChatAnswer` | server-side Anthropic |
| `GET /api/suggested` | `{ questions: string[] }` | starter prompts |

---

## The real APIs (keyless, CORS-enabled, verified working)

- **ECB / Frankfurter latest:** `https://api.frankfurter.dev/v1/latest?from=EUR&to=CAD` → `rates.CAD`
- **Frankfurter historical:** `https://api.frankfurter.dev/v1/{start}..{end}?from=EUR&to=CAD` → `rates` is `{ "YYYY-MM-DD": { CAD: rate } }`, ~2796 daily points since 2015
- **Bank of Canada Valet (cross-check):** `https://www.bankofcanada.ca/valet/observations/FXEURCAD/json`
- **Wise Comparison:** `https://api.wise.com/v4/comparisons?sourceCurrency=EUR&targetCurrency=CAD&sendAmount=12000` → `providers[]` with `receivedAmount`, `midMarketAmount`, `transferFee`

---

## The chatbot system prompt

Paste the full prompt from the build guide (§7). The guardrails are the point — never issue a fatwa, always cite sources, always surface scholarly disagreement (especially wa'd), always append the disclaimer, never predict rates, never recommend a specific product. Model: `claude-sonnet-4-5` (or `claude-haiku` for speed/cost). `max_tokens: 900`. Never expose the key to the client.

---

## What you do NOT touch

- Any file in `app/(app)/*`, `app/(auth)/*`, `app/(marketing)/*` — Dev 2's.
- `app/layout.tsx`, `globals.css`, `tailwind.config.ts`, `components/*` — Dev 2's.
- If you need a layout change, ask Dev 2 (open an issue / message in the shared channel).

## When you're done with a task

1. `npm run build` passes.
2. Your route returns the exact CONTRACT shape (write a quick test against the fixtures).
3. Open a PR using the template in `../GIT-WORKFLOW.md`.
4. Update your checklist above.
5. Tell Dev 2 the route is live so they can swap fixtures for `fetch()`.
