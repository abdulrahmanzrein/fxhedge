# HalalFlow

**See what a foreign payment really costs, before you pay it.**

HalalFlow is a dashboard for small Muslim-owned import businesses. Enter a supplier invoice and it shows the true cost at the ECB reference rate, ranks transfer providers by the money that actually arrives, sizes the risk from ten years of real rate history, and lays out the halal structures for handling the payment. It never moves money, never predicts exchange rates, and never issues a fatwa.

> Built as a 2-dev + 2-agent workspace. Product spec, data layer, design system, and screens live together in this repo. The shipped app is in [`fxhedge/`](fxhedge/).

---

## Why it exists

Aisha imports halal groceries from Europe. She sold a job for CA$18,000 and owes a supplier €12,000, due in 21 days. Between her dollars and their euros, a quiet cut gets taken: the gap between the honest mid-market rate and what her provider actually delivers. On her invoice that gap is CA$767, and nobody shows it to her.

Every ingredient to fix this exists somewhere:

| Who | What they do | What is missing for her |
|---|---|---|
| Wise, Xe, RemitFinder | Rank who is cheapest | Never ask what the payment does to her profit |
| Kyriba, Kantox, Hedgebook | Corporate treasury risk tools | An invoice this small is far below their floor |
| Islamic banks | Halal rate locking (wa'd, murabaha) | Closed deals inside institutions, nothing a small shop can sign up for |
| Wahed, Musaffa, zakat apps | Personal Islamic finance | None touch business payments or trade invoices |

HalalFlow sits in that empty space: the margin view, the honest risk framing, and the faith layer, wrapped around one invoice.

## The three golden rules

These are product invariants, enforced in code and copy:

1. **Never predict exchange rates.** We report reference rates and historical move magnitudes. The risk engine speaks in ranges from history ("the worst 1 month in 20 like yours moved 3.2%"), never in forecasts.
2. **Never act like a bank.** Nothing is executed, nothing is held, no money moves. Every provider link is educational.
3. **The assistant never issues a fatwa.** It cites only whitelisted AAOIFI standards (No. 1, 8, 35, 49, 57), always surfaces scholarly disagreement (especially around wa'd), always appends a disclaimer, and sends out-of-scope questions to a real scholar rather than guessing.

---

## What's inside

| Screen | What it shows |
|---|---|
| **Dashboard** | Verdict strip, provider ranking with stated fee vs hidden rate markup split apart, quote age, rate history chart, cost breakdown, AI advisor tile |
| **New transfer** | Invoice entry with drag-and-drop PDF parsing (pdf.js, extracted locally, nothing uploaded) |
| **Risk explorer** | "Pay now or wait" verdict from historical distributions, clickable 12-month chart that prices your invoice at any past day |
| **Breakeven and hedge** | The rate at which the deal stops making money, the cushion against the worst 1-in-20 historical stretch, natural hedge detector |
| **Sharia options** | Natural hedge, murabaha, wa'd, conventional forward, each with status and AAOIFI source, plus the grounded assistant |
| **Zakat calculator** | Business zakat at 2.5%, foreign holdings valued at live rates, AAOIFI vs Hanafi receivable rules shown side by side, gold-gram nisab |
| **Ask HalalFlow** | Full chat with conversation history, grounded in the guardrailed prompt |

### The engines (pure, tested math)

All decision logic lives in framework-free modules under [`fxhedge/lib/`](fxhedge/lib/), covered by unit tests:

- `cost.ts`: true cost, margin, margin at risk
- `risk.ts`: non-overlapping historical window distribution, pay-now-or-wait verdict
- `breakeven.ts`: break-even rate, cushion %, comfortable / watch / danger verdict
- `natural-hedge.ts`: nets opposite-direction same-currency flows so no conversion is needed
- `zakat.ts`: zakatable pool with method-specific receivable rules
- `verdict.ts`: turns the dashboard numbers into one plain sentence
- `assistant/`: server-only LLM call (Anthropic primary, Gemini fallback), the guardrail prompt is the product

Run the tests: **70 passing** (plus a live-API suite that is skipped by default).

```bash
cd fxhedge
npm test
```

## Data sources

| Source | Used for | Notes |
|---|---|---|
| [Frankfurter](https://frankfurter.dev) (ECB reference rates) | Latest rate, rate on invoice day, daily history, ticker | Primary. Keyless, cached 30 min to 12 h |
| [Bank of Canada Valet](https://www.bankofcanada.ca/valet/) | Fallback latest rate | Used when Frankfurter is unreachable, CAD-quote pairs |
| [Wise Comparison API](https://api.wise.com/v4/comparisons) | Provider quotes | receivedAmount, stated fee, hidden rate markup, quote age |
| Gold price per gram | Zakat nisab threshold | No keyless feed publishes one, so the user enters it and the UI says so |

Every figure on screen carries a source label. Rates are ECB reference rates, indicative, not bookable.

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + TypeScript
- **Tailwind CSS 4** with CSS-variable design tokens, light and dark themes
- **Supabase** (@supabase/ssr): auth, profiles, scenarios, row-level security
- **Recharts** for the rate history and risk visuals
- **Vitest** for the engine tests
- next-themes, lucide-react, react-markdown

## Getting started

Prerequisites: Node 20+ and a free Supabase project.

```bash
git clone https://github.com/abdulrahmanzrein/fxhedge.git
cd fxhedge/fxhedge
npm install
```

1. Create a project at [supabase.com](https://supabase.com), then run the SQL in [`fxhedge/supabase/schema.sql`](fxhedge/supabase/schema.sql) in the SQL editor. It creates `profiles` and `scenarios` with row-level security and a trigger that creates a profile row on signup.
2. Copy your keys into `fxhedge/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Islamic finance assistant (either one works; the app degrades honestly without both)
ANTHROPIC_API_KEY=sk-ant-...
# or
GEMINI_API_KEY=...

# optional model overrides
ANTHROPIC_MODEL=claude-sonnet-4-5
GEMINI_MODEL=gemini-3.8-flash
```

3. Run it:

```bash
npm run dev        # http://localhost:3000
npm test           # engine unit tests
npm run build      # production build
npm run lint
```

Without assistant keys the app still works: the chat surfaces an honest "assistant is unavailable" message instead of a fake answer.

## API surface

| Route | Returns |
|---|---|
| `GET /api/fx?pair=EUR-CAD&days_ago=21` | Latest rate + invoice-day rate with source label |
| `GET /api/history?pair=EUR-CAD&years=1` | Daily rate series |
| `GET /api/providers?from=EUR&to=CAD&amount=12000` | Ranked, deduped provider quotes |
| `GET /api/risk?pair=EUR-CAD&days_ago=21&window_days=21&years=10` | Drift, historical distribution, decision |
| `GET /api/breakeven?invoice=12000&revenue=18000&pair=EUR-CAD` | Break-even rate, cushion, verdict |
| `GET /api/natural-hedge` | Netting suggestions across your saved scenarios |
| `GET /api/zakat/rates?home=CAD&currencies=EUR,USD` | Foreign currency values in home currency |
| `GET /api/ticker` | Multi-pair rates with 30-day change and sparklines |
| `GET/PUT /api/profile`, `GET/POST /api/scenarios` | Supabase-backed, RLS-enforced |
| `POST /api/ask` | Guardrailed assistant answer |
| `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me` | Session contract |

## Project structure

```
fxhedge/
  app/
    (marketing)/        # landing page
    (auth)/             # signup, login, onboarding
    (app)/              # dashboard, transfer, risk, breakeven, sharia, zakat, ask
    api/                # route handlers (all input-validated, contract shapes)
  lib/
    fx.ts               # Frankfurter + BoC clients, pure helpers
    providers.ts        # Wise Comparison client
    cost.ts risk.ts breakeven.ts natural-hedge.ts zakat.ts verdict.ts
    assistant/          # server-only LLM call + guardrail prompt
    supabase/           # browser and server clients
    __tests__/          # vitest suites for every engine
  components/           # app shell, ticker, chat widget, KPI cards
  hooks/                # use-invoice, use-app-data, use-user, use-chats
  supabase/schema.sql   # tables, RLS policies, signup trigger
types/index.ts          # the shared contract (FXRate, ProviderQuote, RiskResult, ...)
```

The TypeScript contract in [`fxhedge/types/index.ts`](fxhedge/types/index.ts) is the single source of truth between data and UI. If it compiles on both sides, it integrates.

## Design system

Tokens live in [`fxhedge/app/globals.css`](fxhedge/app/globals.css): light theme is beige and white with a green accent, dark theme is near-black with the same green. Display type is Fraunces, body is Satoshi, data is IBM Plex Mono, scripture gets Noto Naskh Arabic. Every animated surface respects `prefers-reduced-motion`, and theme-dependent shadows live in CSS (not JS branches) to avoid hydration mismatches.

## Workspace docs

This repo doubles as a 2-dev, 2-agent workspace. The protocol docs are at the root:

- [`SYNC-PROTOCOL.md`](SYNC-PROTOCOL.md): how the two tracks stay in sync, file ownership
- [`GIT-WORKFLOW.md`](GIT-WORKFLOW.md): branches, conventional commits, PRs
- [`dev1_CONTEXT.md`](dev1_CONTEXT.md) / [`dev2_CONTEXT.md`](dev2_CONTEXT.md): per-track tasks and the contract
- [`docs/superpowers/plans/`](docs/superpowers/plans/): feature plans (zakat engine, break-even cushion, natural hedge, design system)

## Disclaimer

HalalFlow is general education, not financial advice and not a fatwa. Scholars legitimately disagree on some of the structures described. Before acting on any international payment, consult a qualified Sharia advisor and a regulated financial professional, and verify in writing the actual structure your bank uses. HalalFlow never moves money and never predicts exchange rates.
