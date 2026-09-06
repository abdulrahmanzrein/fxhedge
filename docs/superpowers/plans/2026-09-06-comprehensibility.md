# Comprehensibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make HalalFlow understandable to a non-finance visitor in under a minute — every page states its conclusion before its data, and no page shows another user's numbers.

**Architecture:** No new subsystems. Four surgical changes to existing pages plus one new pure module (`lib/verdict.ts`) that turns the numbers already in `useAppData` into a plain-English conclusion. The `/risk` page rebuilt earlier in this project is the reference pattern: verdict first, then the range in money, then supporting stats with plain second lines.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, Recharts, Vitest.

**Spec:** No separate spec doc. This plan is grounded in (a) the MuslimHacks brief `~/Downloads/MuslimHacks-2026-Challenges.pdf` p.2 "International Trades", which asks to *"make options understandable: help a non-finance user compare payment timing, providers or risk-management options"*, (b) the judging rubric's Business Level criterion *"Is it easy to understand and to use?"* (40% weight), and (c) a live audit of the running app recorded in "Audit findings" below.

## Global Constraints

- **Never predict rates.** Show the effect of possible changes; never state where a currency will move. (Brief, "Important constraints".)
- **Never claim to move money.** Copy must not imply HalalFlow executes payments.
- **Cite only these AAOIFI standards**, verified against AAOIFI's index: No. 1 Trading in Currencies, No. 8 Murabahah, No. 35 Zakah, No. 49 Unilateral and Bilateral Promise, No. 57 Gold. Never introduce another number.
- **No page may read `MOCK_PROFILE` or `SAMPLE` for user-facing figures.** Those are fallbacks inside `hooks/use-app-data.ts` only.
- **Theme-dependent values come from CSS `[data-theme]`, never from `resolvedTheme` in a render** — that pattern caused two hydration mismatches already in this codebase.
- **Currency and pair always come from `useAppData()`** (`d.fromCurrency`, `d.toCurrency`), never hardcoded.
- Existing suite must stay green: `npm test` → 64 passed, 6 skipped.

## Audit findings (evidence for each task)

Recorded against the running app on 2026-09-06, signed in as a GBP→USD user (£45,000, 45 days):

1. **`/breakeven` shows a different user's invoice.** It imports `MOCK_PROFILE` and requests `pair=EUR-CAD`. The page displays "Today: 1.6038" (EUR/CAD) while the signed-in user's rate is 1.3530 (GBP/USD). It is the last page still on fixtures. → Task 1
2. **The landing page never explains how it works.** `#how` is a dead anchor — the nav links to it and no element has that id. Page structure is hero → "What HalalFlow does" (3 cards) → CTA → footer. → Task 3
3. **The dashboard opens with four dense cards and no conclusion.** The header states the invoice but never what the app found or what to do. → Task 2
4. **Jargon persists outside `/risk`.** `/breakeven` reads "Breakeven cushion", "5% of similar windows move 3.5%+", and hardcodes "EUR/CAD" in its explainer. → Task 4
5. **Not a bug:** the landing page's blank sections in a `fullPage` screenshot are a capture artifact. After real scrolling, 0 of 12 `.sr-fade` elements remain hidden. Do not "fix" this.

## File structure

| File | Responsibility | Task |
| --- | --- | --- |
| `lib/verdict.ts` | **Create.** Pure: numbers → one-sentence conclusion. No React. | 2 |
| `lib/__tests__/verdict.test.ts` | **Create.** Unit tests for every decision branch. | 2 |
| `components/dashboard/verdict-strip.tsx` | **Create.** Renders the verdict above the dashboard grid. | 2 |
| `app/(app)/breakeven/page.tsx` | **Modify.** Swap fixtures for `useAppData`; rewrite explainer copy. | 1, 4 |
| `app/(app)/dashboard/page.tsx` | **Modify.** Mount `VerdictStrip`. | 2 |
| `app/(marketing)/page.tsx` | **Modify.** Add the `#how` section the nav already links to. | 3 |
| `components/app-shell.tsx` | **Modify.** Group nav into a journey with section labels. | 5 |

`lib/verdict.ts` is pure so it can carry real unit tests — the codebase has no component-test harness, so UI tasks are verified by running the app and reading the DOM. Do not add a component-test framework as part of this plan.

---

### Task 1: Point `/breakeven` at the signed-in user's invoice

**Files:**
- Modify: `app/(app)/breakeven/page.tsx`

**Interfaces:**
- Consumes: `useAppData()` from `hooks/use-app-data.ts`, returning at least `{ loading, invoiceAmount, fromCurrency, toCurrency, toCurrency, daysUntilDue, ecbRateToday }`.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Confirm the bug before changing anything**

Start the dev server if it is not running (`npm run dev`), sign in, then run in the browser console on `http://localhost:3000/breakeven`:

```js
document.querySelector('main').innerText.match(/EUR\/CAD|GBP\/USD|1\.6038|1\.3530/g)
```

Expected before the fix: matches include `EUR/CAD` and `1.6038` even though the signed-in invoice is GBP→USD. Record what you see; this is the regression you are removing.

- [ ] **Step 2: Replace the fixture import with live data**

In `app/(app)/breakeven/page.tsx`, change the imports at the top:

```tsx
// remove:
import { MOCK_PROFILE, currencySymbol } from "@/lib/fixtures";
// add:
import { currencySymbol } from "@/lib/fixtures";
import { useAppData } from "@/hooks/use-app-data";
```

- [ ] **Step 3: Derive every figure from the hook**

Replace the component's data setup (around lines 39–50). The existing code reads:

```tsx
const sym = currencySymbol(MOCK_PROFILE.home_currency);
```

and later fetches with a hardcoded pair. Replace both with:

```tsx
const d = useAppData();
const sym = currencySymbol(d.toCurrency);
const pair = `${d.fromCurrency}-${d.toCurrency}`;
```

Then change the fetch so it uses the user's pair and amount. Find the `fetch("/api/breakeven?...")` call and replace its URL with:

```tsx
fetch(`/api/breakeven?invoice=${d.invoiceAmount}&revenue=${revenue}&pair=${pair}`)
```

Guard the effect so it does not fire before the invoice loads, and re-run when the pair or amount changes:

```tsx
useEffect(() => {
  if (d.loading) return;
  // ...existing fetch body, using `pair` and `d.invoiceAmount`...
}, [d.loading, pair, d.invoiceAmount]);
```

- [ ] **Step 4: Remove the hardcoded pair from the explainer copy**

Around line 123 the text reads `is the worst EUR/CAD rate at which you still cover your costs. If EUR weakens past this point`. Replace that sentence with:

```tsx
The <strong className="text-[var(--color-fg)]">breakeven rate</strong> is the worst{" "}
{d.fromCurrency}/{d.toCurrency} rate at which you still cover your costs. If{" "}
{d.fromCurrency} strengthens past this point, the invoice costs more than you earn on the sale.
```

- [ ] **Step 5: Verify no fixture references remain on this page**

Run:

```bash
grep -n "MOCK_PROFILE\|SAMPLE\|EUR-CAD\|EUR/CAD" "app/(app)/breakeven/page.tsx"
```

Expected: no output.

- [ ] **Step 6: Typecheck and run the suite**

```bash
npx tsc --noEmit && npm test
```

Expected: tsc silent; `Tests 64 passed | 6 skipped`.

- [ ] **Step 7: Verify in the browser**

Reload `http://localhost:3000/breakeven` signed in, then in the console:

```js
document.querySelector('main').innerText.match(/EUR\/CAD|GBP\/USD/g)
```

Expected: `["GBP/USD"]` (or whatever pair the signed-in profile uses) and **no** `EUR/CAD`. The displayed "Today's rate" must match the dashboard's rate for the same pair.

- [ ] **Step 8: Commit**

```bash
git add "app/(app)/breakeven/page.tsx"
git commit -m "fix(breakeven): use the signed-in invoice instead of the sample one

The page read MOCK_PROFILE and requested pair=EUR-CAD, so a GBP/USD user was
shown EUR/CAD figures throughout — the last page still rendering fixtures."
```

---

### Task 2: State the conclusion at the top of the dashboard

**Files:**
- Create: `lib/verdict.ts`
- Create: `lib/__tests__/verdict.test.ts`
- Create: `components/dashboard/verdict-strip.tsx`
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `AppData` from `hooks/use-app-data.ts`.
- Produces:
  - `buildVerdict(input: VerdictInput): Verdict` from `lib/verdict.ts`
  - `VerdictInput = { decision: "pay_now" | "wait" | "marginal"; savingVsWorst: number; worstCaseExtra: number; bestProvider: string; worstProvider: string }`
  - `Verdict = { headline: string; detail: string; tone: "good" | "warn" | "neutral" }`
  - `<VerdictStrip d={AppData} />` from `components/dashboard/verdict-strip.tsx`

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/verdict.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { buildVerdict } from "../verdict";

const base = {
  savingVsWorst: 1605,
  worstCaseExtra: 4384,
  bestProvider: "Wise",
  worstProvider: "Skrill",
};

describe("buildVerdict", () => {
  it("leads with the provider saving, which is the certain number", () => {
    const v = buildVerdict({ ...base, decision: "marginal" });
    expect(v.headline).toContain("Wise");
    expect(v.headline).toContain("Skrill");
  });

  it("tells a pay_now user to act now and why", () => {
    const v = buildVerdict({ ...base, decision: "pay_now" });
    expect(v.detail).toMatch(/pay now/i);
    expect(v.tone).toBe("warn");
  });

  it("tells a wait user they have room", () => {
    const v = buildVerdict({ ...base, decision: "wait" });
    expect(v.detail).toMatch(/wait/i);
    expect(v.tone).toBe("good");
  });

  it("calls a marginal decision close rather than recommending", () => {
    const v = buildVerdict({ ...base, decision: "marginal" });
    expect(v.detail).toMatch(/close/i);
    expect(v.tone).toBe("neutral");
  });

  it("never predicts a direction", () => {
    for (const decision of ["pay_now", "wait", "marginal"] as const) {
      const v = buildVerdict({ ...base, decision });
      expect(`${v.headline} ${v.detail}`).not.toMatch(/will (rise|fall|drop|climb|strengthen|weaken)/i);
    }
  });

  it("omits the saving clause when there is nothing to save", () => {
    const v = buildVerdict({ ...base, decision: "marginal", savingVsWorst: 0 });
    expect(v.headline).not.toContain("Skrill");
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
npx vitest run lib/__tests__/verdict.test.ts
```

Expected: FAIL — `Failed to resolve import "../verdict"`.

- [ ] **Step 3: Write the implementation**

Create `lib/verdict.ts`:

```ts
/**
 * lib/verdict.ts — turns the dashboard's numbers into one plain sentence.
 * Pure: no React imports (architecture.md invariant 5).
 *
 * The provider saving is stated first because it is the only certain number
 * on the page; timing is a judgement about a range, never a prediction.
 */

export interface VerdictInput {
  decision: "pay_now" | "wait" | "marginal";
  /** Money separating the best and worst provider, in home currency. */
  savingVsWorst: number;
  /** Extra cost in the historical worst case, in home currency. */
  worstCaseExtra: number;
  bestProvider: string;
  worstProvider: string;
}

export interface Verdict {
  headline: string;
  detail: string;
  tone: "good" | "warn" | "neutral";
}

const money = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;

const TIMING: Record<VerdictInput["decision"], { detail: string; tone: Verdict["tone"] }> = {
  pay_now: {
    detail: "On timing, paying now looks better than waiting: the rate has already moved against you and history says the downside from here is bigger than the upside.",
    tone: "warn",
  },
  wait: {
    detail: "On timing, you have room to wait: the rate is in your favour and this pair has been calm over windows like yours.",
    tone: "good",
  },
  marginal: {
    detail: "On timing it is too close to call. If a predictable bill matters more than a slightly cheaper one, pay now.",
    tone: "neutral",
  },
};

export function buildVerdict(input: VerdictInput): Verdict {
  const { decision, savingVsWorst, worstCaseExtra, bestProvider, worstProvider } = input;

  const headline =
    savingVsWorst > 0
      ? `Choosing ${bestProvider} over ${worstProvider} saves you ${money(savingVsWorst)} today.`
      : "Your providers are quoting the same value today.";

  const timing = TIMING[decision];
  const risk =
    worstCaseExtra > 0
      ? ` A rough stretch could add ${money(worstCaseExtra)} before this is due.`
      : "";

  return { headline, detail: timing.detail + risk, tone: timing.tone };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
npx vitest run lib/__tests__/verdict.test.ts
```

Expected: PASS, 6 tests.

- [ ] **Step 5: Build the strip component**

Create `components/dashboard/verdict-strip.tsx`:

```tsx
"use client";
import { buildVerdict } from "@/lib/verdict";
import type { AppData } from "@/hooks/use-app-data";

const TONE: Record<string, string> = {
  good: "var(--color-primary)",
  warn: "var(--color-warning)",
  neutral: "var(--color-muted-fg)",
};

export function VerdictStrip({ d }: { d: AppData }) {
  const worstCaseExtra = d.trueCostToday * (d.worst5pctMove / 100);
  const v = buildVerdict({
    decision: d.decision,
    savingVsWorst: d.savingVsWorst,
    worstCaseExtra,
    bestProvider: d.bestProvider.name,
    worstProvider: d.worstProvider.name,
  });

  return (
    <section
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] px-5 py-4"
      aria-label="Summary"
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className="mt-[7px] h-2 w-2 shrink-0 rounded-full"
          style={{ background: TONE[v.tone] }}
        />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-snug text-[var(--color-fg)]">
            {v.headline}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--color-muted-fg)]">
            {v.detail}
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 6: Mount it above the dashboard grid**

In `app/(app)/dashboard/page.tsx`, add the import beside the other dashboard-component imports:

```tsx
import { VerdictStrip } from "@/components/dashboard/verdict-strip";
```

Then place it between the `<header>` block and the `<div className="grid gap-4 flex-1 ...">` that holds the four cards:

```tsx
<div style={fade(1)}>
  <VerdictStrip d={d} />
</div>
```

The grid and the cards below it already use `fade(1)`…`fade(4)`; leaving them unchanged is fine — the strip sharing a stagger index with the first card is not visible.

- [ ] **Step 7: Verify the whole suite and the page**

```bash
npx tsc --noEmit && npm test
```

Expected: tsc silent; `Tests 70 passed | 6 skipped` (64 existing + 6 new).

Then reload `/dashboard` signed in and run in the console:

```js
document.querySelector('[aria-label="Summary"]').innerText.replace(/\s+/g,' ')
```

Expected: a sentence naming your best and worst provider and a money amount, followed by a timing sentence. It must not contain the words "will rise" or "will fall".

- [ ] **Step 8: Commit**

```bash
git add lib/verdict.ts lib/__tests__/verdict.test.ts components/dashboard/verdict-strip.tsx "app/(app)/dashboard/page.tsx"
git commit -m "feat(dashboard): lead with the conclusion, not the charts

The dashboard opened with four dense cards and never said what it found. A
verdict strip now states the certain number first — the provider saving — then
the timing judgement, with the worst historical case priced in money."
```

---

### Task 3: Give the landing page the "How it works" section its nav promises

**Files:**
- Modify: `app/(marketing)/page.tsx`

**Interfaces:**
- Consumes: the existing `.sr-fade` reveal class and the `IntersectionObserver` already wired in this file's `useEffect` (lines 39–58). New elements using `.sr-fade` are picked up automatically because the observer queries the DOM on mount.
- Produces: an element with `id="how"`, satisfying the existing nav link.

- [ ] **Step 1: Confirm the dead anchor**

With the landing page open at `http://localhost:3000/`, run in the console:

```js
[...document.querySelectorAll('a[href^="#"]')]
  .map(a => a.getAttribute('href'))
  .filter(h => !document.querySelector(h))
```

Expected before the fix: `["#how"]`.

- [ ] **Step 2: Add the section**

In `app/(marketing)/page.tsx`, insert this immediately **before** the existing `<section id="features" ...>` (around line 283), so the reading order is hero → how it works → features → pricing:

```tsx
<section id="how" className="py-[88px]">
  <div className="mx-auto max-w-[1100px] px-6">
    <h2
      className="sr-fade font-serif font-normal m-0 text-[var(--color-fg)]"
      style={{ fontSize: "clamp(1.8rem, 4vw, 2.4rem)" }}
    >
      How it works
    </h2>
    <p className="sr-fade mt-3.5 max-w-lg text-[15px] text-[var(--color-muted-fg)]">
      Three steps, about a minute. We never touch your money — you still pay
      through whichever provider you choose.
    </p>

    <ol className="mt-10 grid gap-6 sm:grid-cols-3">
      {[
        {
          n: "1",
          title: "Enter the invoice",
          body: "Amount, the currency your supplier bills in, and when it is due. Nothing else.",
        },
        {
          n: "2",
          title: "See the real cost",
          body: "We price it at the ECB reference rate, then show what each provider would actually deliver — including the markup they bury in the rate.",
        },
        {
          n: "3",
          title: "Decide with the range",
          body: "We show how far the rate has moved in stretches like yours, priced against your bill, plus the halal alternatives to a conventional forward.",
        },
      ].map((s) => (
        <li
          key={s.n}
          className="sr-fade rounded-[18px] border p-6"
          style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
        >
          <span
            className="grid h-9 w-9 place-items-center rounded-full text-[15px] font-bold"
            style={{ background: "var(--color-primary)", color: "#04120A" }}
          >
            {s.n}
          </span>
          <h3 className="mt-4 text-[16px] font-semibold text-[var(--color-fg)]">{s.title}</h3>
          <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-muted-fg)]">{s.body}</p>
        </li>
      ))}
    </ol>
  </div>
</section>
```

- [ ] **Step 3: Typecheck**

```bash
npx tsc --noEmit
```

Expected: silent.

- [ ] **Step 4: Verify the anchor resolves and the content reveals**

Reload `http://localhost:3000/` and run in the console:

```js
(async () => {
  const dead = [...document.querySelectorAll('a[href^="#"]')]
    .map(a => a.getAttribute('href')).filter(h => !document.querySelector(h));
  document.querySelector('#how').scrollIntoView();
  await new Promise(r => setTimeout(r, 600));
  const stuck = [...document.querySelectorAll('#how .sr-fade')]
    .filter(el => parseFloat(getComputedStyle(el).opacity) < 0.05).length;
  return { dead, stuck, steps: document.querySelectorAll('#how li').length };
})()
```

Expected: `{ dead: [], stuck: 0, steps: 3 }`.

Note: verify by **scrolling**, not by a `fullPage` screenshot — `fullPage` capture does not reliably fire `IntersectionObserver`, and will show these sections blank even when they work.

- [ ] **Step 5: Commit**

```bash
git add "app/(marketing)/page.tsx"
git commit -m "feat(marketing): add the How it works section the nav linked to

#how was a dead anchor — the nav offered 'How it works' and no such section
existed, so the page never explained the mechanism to a first-time visitor."
```

---

### Task 4: Remove the jargon from `/breakeven`

**Depends on Task 1** (which introduces `d` and the dynamic pair into this file).

**Files:**
- Modify: `app/(app)/breakeven/page.tsx`

**Interfaces:**
- Consumes: `d` (`AppData`) and `pair`, both introduced in Task 1.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Record the current jargon**

On `/breakeven`, run in the console:

```js
['cushion','percentile','windows','breakeven']
  .filter(w => document.querySelector('main').innerText.toLowerCase().includes(w))
```

Expected before the fix: all four.

- [ ] **Step 2: Rewrite the page title and subtitle**

Replace the heading block's subtitle. "How much rate movement can you absorb before this deal loses money?" becomes:

```tsx
<p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-fg)]">
  Every deal has a rate at which it stops making money. This page shows where
  that point is for your {currencySymbol(d.fromCurrency)}
  {d.invoiceAmount.toLocaleString()} invoice, and how much room you have before
  you reach it.
</p>
```

- [ ] **Step 3: Rename the headline metric**

Change the label `Breakeven cushion` to plain language:

```tsx
Room before this deal stops making money
```

- [ ] **Step 4: Rewrite the interpretation sentence**

The existing sentence reads like a statistician wrote it: *"Your cushion is 6.5% — history says 5% of similar windows move 3.5%+, so a bad week eats most of it."* Replace it with:

```tsx
<p className="mt-3 text-sm leading-relaxed text-[var(--color-fg)]">
  You have {cushionPct}% of room. In the roughest 1 in 20 stretches of this
  length, the rate swung {worstMovePct}% — so a bad run would use most of it.
  Worth checking weekly rather than once.
</p>
```

Use the variables already computed in this component for the cushion and the historical move; do not introduce new fetches. If they are currently named differently, rename at the point of use only.

- [ ] **Step 5: Rewrite the "How to read this" block**

Replace the `Historical windows` stat label with `Past stretches compared`, and the explainer body with:

```tsx
<p>
  The <strong className="text-[var(--color-fg)]">breakeven rate</strong> is the
  worst {d.fromCurrency}/{d.toCurrency} rate at which you still cover your costs.
  Past it, the invoice costs more than you earn on the sale.
</p>
<p className="mt-2">
  The <strong className="text-[var(--color-fg)]">room</strong> is how far
  today&apos;s rate can move before you reach that point. More room means more
  margin for a bad week.
</p>
```

- [ ] **Step 6: Verify the jargon is gone and the page still works**

```bash
npx tsc --noEmit && npm test
```

Expected: tsc silent; `Tests 70 passed | 6 skipped`.

Then on `/breakeven`:

```js
['cushion','percentile','EUR/CAD']
  .filter(w => document.querySelector('main').innerText.toLowerCase().includes(w.toLowerCase()))
```

Expected: `[]`. The word "breakeven" may remain — it is defined in place, which is the point.

- [ ] **Step 7: Commit**

```bash
git add "app/(app)/breakeven/page.tsx"
git commit -m "refactor(breakeven): say it in words a non-finance owner uses

'Cushion', 'similar windows' and percentile framing described the maths rather
than the decision. Every figure is now stated against the user's own invoice."
```

---

### Task 5: Group the sidebar into a journey

**Files:**
- Modify: `components/app-shell.tsx`

**Interfaces:**
- Consumes: the existing `NavItem` component and `usePathname()` already in this file.
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Replace the two flat nav arrays with three labelled groups**

`components/app-shell.tsx` currently declares `workspaceNav` and `faithNav`. Replace both declarations with a single grouped structure:

```tsx
const NAV_GROUPS = [
  {
    label: "Your payment",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/transfer", label: "New transfer", icon: ArrowLeftRight },
    ],
  },
  {
    label: "Before you pay",
    items: [
      { href: "/risk", label: "Risk explorer", icon: TrendingUp },
      { href: "/breakeven", label: "Breakeven & hedge", icon: Target },
    ],
  },
  {
    label: "Faith & finance",
    items: [
      { href: "/sharia", label: "Sharia options", icon: Shield },
      { href: "/zakat", label: "Zakat calculator", icon: Moon },
      { href: "/ask", label: "Ask HalalFlow", icon: MessageCircle },
      { href: "/reflect", label: "The weight of riba", icon: Scale },
    ],
  },
];
```

- [ ] **Step 2: Render the groups**

Replace the two `<nav>` blocks in `Sidebar` with one mapped block:

```tsx
{NAV_GROUPS.map((group, gi) => (
  <nav key={group.label} aria-label={group.label} className={gi > 0 ? "mt-5" : undefined}>
    <p
      aria-hidden="true"
      className="mb-1 px-3 text-xs uppercase tracking-widest text-[var(--color-muted-fg)]"
    >
      {group.label}
    </p>
    <div className="space-y-1">
      {group.items.map((item, i) => (
        <NavItem
          key={item.href}
          {...item}
          onClick={onNav}
          ref={gi === 0 && i === 0 ? firstItemRef : undefined}
        />
      ))}
    </div>
  </nav>
))}
```

`firstItemRef` must land on the very first item overall — the mobile drawer focuses it on open, so attaching it to the first item of every group would break focus management.

- [ ] **Step 3: Typecheck and check for unused imports**

```bash
npx tsc --noEmit && npx eslint components/app-shell.tsx
```

Expected: tsc silent. If eslint reports an unused icon import, remove that icon from the import list — do not leave it.

- [ ] **Step 4: Verify the nav and mobile focus**

Reload any signed-in page and run:

```js
[...document.querySelectorAll('aside nav')].map(n => ({
  group: n.getAttribute('aria-label'),
  items: [...n.querySelectorAll('a')].map(a => a.textContent.trim()),
}))
```

Expected: three groups — "Your payment" (2), "Before you pay" (2), "Faith & finance" (4).

Then narrow the window below 920px, open the mobile drawer, and confirm focus lands on "Dashboard".

- [ ] **Step 5: Commit**

```bash
git add components/app-shell.tsx
git commit -m "refactor(nav): group the sidebar into the order you use it

Seven flat links gave no sense of where to start or what depends on what."
```

---

## Self-review

**1. Spec coverage.** Each audit finding maps to a task: finding 1 → Task 1, finding 2 → Task 3, finding 3 → Task 2, finding 4 → Task 4. Finding 5 is explicitly a non-task and is called out so nobody "fixes" it. Task 5 addresses the brief's *"make options understandable"* at the navigation level. The rubric criterion *"Is it easy to understand and to use?"* is served by Tasks 2–5 together.

**2. Placeholder scan.** No TBDs. Every code step carries the literal code. Task 4 steps 4 and 5 reference variables already present in `breakeven/page.tsx` rather than reprinting the whole component — the step says to rename at point of use only, which is a concrete instruction, but an executor **must read the surrounding component first**; this is the one task where the exact variable names must be read from the file rather than copied from this plan.

**3. Type consistency.** `buildVerdict` / `VerdictInput` / `Verdict` are named identically in the test (Task 2 Step 1), the implementation (Step 3), and the consumer (Step 5). `VerdictStrip` takes `d: AppData` in both its definition and its mount site. `AppData` field names used — `decision`, `savingVsWorst`, `trueCostToday`, `worst5pctMove`, `bestProvider.name`, `worstProvider.name`, `fromCurrency`, `toCurrency`, `invoiceAmount`, `loading` — all exist on the interface in `hooks/use-app-data.ts`.

**4. Ordering.** Task 4 depends on Task 1 (both edit `breakeven/page.tsx`; Task 1 introduces `d` and `pair`). Stated at the top of Task 4. Tasks 2, 3 and 5 are independent and may run in any order.
