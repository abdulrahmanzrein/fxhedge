# Zakat Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

*=*Goal:** Compute the user's business zakat (2.5% of zakatable assets) with foreign-currency holdings and receivables valued at **live ECB reference rates**, surfacing scholarly differences (Hanafi vs AAOIFI treatment), producing a scholar-ready printable summary — the first tool ever to connect live FX data to a Muslim owner's religious obligation.

**Architecture:** One pure computation module (`lib/zakat.ts`), one data-entry + results screen (`app/(app)/zakat/page.tsx`), one API route (`GET /api/zakat/rates`) that reuses the existing FX layer to value every foreign-currency balance at today's reference rate. The zakat computation is 100% pure and unit-tested; the screen is a form + results card; the print view is CSS `@media print`. No new external APIs.

**Tech Stack:** Existing stack only — Next.js App Router, TypeScript strict, Tailwind + existing design tokens, vitest, existing `lib/fx.ts` rate clients. No new dependencies.

**Spec:** `context/PRD.md` (persona, constraints), `context/BUILD-GUIDE.md` §3 (design tokens), `context/architecture.md` (pure-lib invariant), `context/progress-tracker.md` (contract locked in `fxhedge/types/index.ts`).

## Global Constraints

- Never predict exchange rates; only live reference rates and historical magnitudes (challenge rule).
- Zakat output is educational, never a fatwa — every result carries the disclaimer + "confirm with a qualified scholar" line (architecture.md invariant 4, PRD FR-5 posture).
- Computation in `lib/` is pure, no React/Next imports (architecture.md invariant 5).
- All values displayed in the user's home currency (default CAD) with tabular figures; source-labeled rates ("live / ECB reference").
- Design tokens from BUILD-GUIDE §3 CSS variables — no hardcoded hex.
- TypeScript strict, no `any`; validate external input at boundaries.
- Conventional commits; `npm run build` must pass before every PR; squash-merge via PR only.

---

### Task 1: Zakat types + pure computation core

**Files:**
- Create: `fxhedge/types/zakat.ts`
- Create: `fxhedge/lib/zakat.ts`
- Test: `fxhedge/lib/__tests__/zakat.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces (used by Tasks 2–4):

```ts
// types/zakat.ts
export type MadhhabMethod = "hanafi" | "aaoifi";

export interface ZakatHolding {
  id: string;
  kind: "cash_home" | "cash_foreign" | "receivable" | "inventory" | "liability";
  label: string;
  amount: number;        // in the asset's own currency
  currency: string;      // "CAD", "EUR", "USD", "GBP"...
  due_days?: number;     // receivables only: days until due
  doubtful?: boolean;    // receivables only: seriously doubtful collection
}

export interface ValuedHolding extends ZakatHolding {
  value_home: number;        // converted at today's reference rate
  rate_used: number | null;  // 1.0 for home currency
  rate_source: string | null;
  zakatable: boolean;        // after method rules
  excluded_reason?: string;  // shown in UI when false
}

export interface ZakatResult {
  method: MadhhabMethod;
  zakatable_total: number;   // home currency
  nisab_threshold: number;   // home currency
  nisab_met: boolean;
  zakat_due: number;         // 2.5% of zakatable_total when nisab_met, else 0
  holdings: ValuedHolding[];
  computed_at: string;
  rate_date: string;         // "as of" date for the FX rates used
}

export function computeZakat(
  holdings: ZakatHolding[],
  method: MadhhabMethod,
  rates: Record<string, number>,   // currency -> home-currency rate ("CAD" -> 1.0)
  nisabGoldGrams: number,          // 87.48g
  goldPricePerGramHome: number,    // user-entered, labeled "user-entered"
  homeCurrency: string,
): ZakatResult
```

- [ ] **Step 1: Write the failing tests**

```ts
// fxhedge/lib/__tests__/zakat.test.ts
import { describe, expect, it } from "vitest";
import { computeZakat, ZAKAT_RATE } from "../zakat";
import type { ZakatHolding } from "@/types/zakat";

const rates = { CAD: 1.0, EUR: 1.6038, USD: 1.37, GBP: 1.74 };
const nisab = 87.48 * 105; // 87.48g x $105/g sample gold price = $9,185.40

const base: ZakatHolding[] = [
  { id: "1", kind: "cash_home", label: "Business chequing", amount: 20000, currency: "CAD" },
  { id: "2", kind: "inventory", label: "Halal grocery stock", amount: 30000, currency: "CAD" },
  { id: "3", kind: "liability", label: "Supplier invoice due", amount: 12000, currency: "CAD" },
];

describe("computeZakat", () => {
  it("uses the 2.5% rate", () => expect(ZAKAT_RATE).toBe(0.025));

  it("computes zakatable total = cash + inventory - liabilities", () => {
    const r = computeZakat(base, "aaoifi", rates, 87.48, 105, "CAD");
    expect(r.zakatable_total).toBeCloseTo(38000, 0);
    expect(r.zakat_due).toBeCloseTo(950, 0); // 2.5% of 38,000
    expect(r.nisab_met).toBe(true);
  });

  it("values foreign receivables at the live rate", () => {
    const holdings: ZakatHolding[] = [
      ...base,
      { id: "4", kind: "receivable", label: "Customer EUR invoice", amount: 5000, currency: "EUR", due_days: 10 },
    ];
    const r = computeZakat(holdings, "aaoifi", rates, 87.48, 105, "CAD");
    // 5000 EUR x 1.6038 = 8019 CAD added to the pool
    expect(r.zakatable_total).toBeCloseTo(38000 + 8019, 0);
    const eur = r.holdings.find((h) => h.id === "4")!;
    expect(eur.value_home).toBeCloseTo(8019, 0);
    expect(eur.rate_used).toBeCloseTo(1.6038, 4);
    expect(eur.rate_source).toBe("ECB / Frankfurter");
  });

  it("AAOIFI excludes receivables before due date; Hanafi includes", () => {
    const withRec: ZakatHolding[] = [
      ...base,
      { id: "4", kind: "receivable", label: "Not yet due", amount: 10000, currency: "CAD", due_days: 30 },
    ];
    const aaoifi = computeZakat(withRec, "aaoifi", rates, 87.48, 105, "CAD");
    const hanafi = computeZakat(withRec, "hanafi", rates, 87.48, 105, "CAD");
    expect(aaoifi.zakatable_total).toBeCloseTo(38000, 0); // excluded
    expect(hanafi.zakatable_total).toBeCloseTo(48000, 0); // included
    expect(aaoifi.holdings.find((h) => h.id === "4")!.excluded_reason).toMatch(/not yet due/i);
  });

  it("both methods exclude doubtful debts", () => {
    const holdings: ZakatHolding[] = [
      ...base,
      { id: "5", kind: "receivable", label: "Deadbeat client", amount: 8000, currency: "CAD", doubtful: true },
    ];
    for (const method of ["aaoifi", "hanafi"] as const) {
      const r = computeZakat(holdings, method, rates, 87.48, 105, "CAD");
      expect(r.holdings.find((h) => h.id === "5")!.zakatable).toBe(false);
      expect(r.holdings.find((h) => h.id === "5")!.excluded_reason).toMatch(/doubtful/i);
    }
  });

  it("zero or negative net position -> no zakat", () => {
    const holdings: ZakatHolding[] = [
      { id: "1", kind: "cash_home", label: "Cash", amount: 5000, currency: "CAD" },
      { id: "2", kind: "liability", label: "Owed", amount: 9000, currency: "CAD" },
    ];
    const r = computeZakat(holdings, "aaoifi", rates, 87.48, 105, "CAD");
    expect(r.zakat_due).toBe(0);
  });

  it("flags when below nisab and pays nothing", () => {
    const holdings: ZakatHolding[] = [
      { id: "1", kind: "cash_home", label: "Cash", amount: 1000, currency: "CAD" },
    ];
    const r = computeZakat(holdings, "aaoifi", rates, 87.48, 105, "CAD");
    expect(r.nisab_met).toBe(false);
    expect(r.zakat_due).toBe(0);
    expect(r.nisab_threshold).toBeCloseTo(9185.4, 0);
  });

  it("rejects unknown currency (rate missing) with a clear error", () => {
    const holdings: ZakatHolding[] = [
      { id: "1", kind: "cash_foreign", label: "TRY cash", amount: 1000, currency: "TRY" },
    ];
    expect(() => computeZakat(holdings, "aaoifi", rates, 87.48, 105, "CAD"))
      .toThrow(/missing rate/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd fxhedge && npx vitest run lib/__tests__/zakat.test.ts`
Expected: FAIL — "Cannot find module '../zakat'"

- [ ] **Step 3: Write `types/zakat.ts` and minimal `lib/zakat.ts`**

```ts
// fxhedge/types/zakat.ts
export type MadhhabMethod = "hanafi" | "aaoifi";

export interface ZakatHolding {
  id: string;
  kind: "cash_home" | "cash_foreign" | "receivable" | "inventory" | "liability";
  label: string;
  amount: number;
  currency: string;
  due_days?: number;
  doubtful?: boolean;
}

export interface ValuedHolding extends ZakatHolding {
  value_home: number;
  rate_used: number | null;
  rate_source: string | null;
  zakatable: boolean;
  excluded_reason?: string;
}

export interface ZakatResult {
  method: MadhhabMethod;
  zakatable_total: number;
  nisab_threshold: number;
  nisab_met: boolean;
  zakat_due: number;
  holdings: ValuedHolding[];
  computed_at: string;
  rate_date: string;
}
```

```ts
// fxhedge/lib/zakat.ts
/**
 * lib/zakat.ts — pure business-zakat computation (2.5% of zakatable assets).
 * Educational only — never a fatwa; output always surfaces method differences
 * and directs the user to a qualified scholar.
 * Pure: no React/Next imports (architecture.md invariant 5).
 */
import type {
  MadhhabMethod,
  ValuedHolding,
  ZakatHolding,
  ZakatResult,
} from "@/types/zakat";

export const ZAKAT_RATE = 0.025;
/** Nisab = 87.48g of gold (85g gold / 595g silver schools use gold here). */
export const NISAB_GOLD_GRAMS = 87.48;

const HOME_RATE_SOURCE = "home currency";

/**
 * Rules per method (sourced: AAOIFI Sharia Standard No. 9; Hanafi fiqh —
 * e.g. islamqa/IslamicFinanceGuru summaries — surfaced as a difference, not a verdict):
 * - Both: zakatable pool = cash + receivables(collectible) + inventory(resale value) - current liabilities.
 * - AAOIFI: trade receivables are deducted-net-of-doubtful and EXCLUDED until due
 *   (deferred-sale receivables treated per Standard No. 9 view).
 * - Hanafi: receivables owed to the business are included regardless of due date.
 */
function methodRules(
  h: ZakatHolding,
  method: MadhhabMethod,
): { zakatable: boolean; reason?: string } {
  if (h.kind === "liability") return { zakatable: true }; // subtracted, not added
  if (h.kind === "receivable") {
    if (h.doubtful) return { zakatable: false, reason: "Doubtful debt — excluded under both methods; recover it and add it back when received." };
    if (method === "aaoifi" && (h.due_days ?? 0) > 0) {
      return { zakatable: false, reason: "Not yet due — AAOIFI view excludes receivables before their due date (Hanafi includes them). Confirm with your scholar." };
    }
    return { zakatable: true };
  }
  return { zakatable: true };
}

export function computeZakat(
  holdings: ZakatHolding[],
  method: MadhhabMethod,
  rates: Record<string, number>,
  nisabGoldGrams: number,
  goldPricePerGramHome: number,
  homeCurrency: string,
): ZakatResult {
  const valued: ValuedHolding[] = holdings.map((h) => {
    if (h.currency === homeCurrency) {
      const rules = methodRules(h, method);
      return {
        ...h,
        value_home: h.amount,
        rate_used: 1,
        rate_source: HOME_RATE_SOURCE,
        zakatable: rules.zakatable,
        excluded_reason: rules.reason,
      };
    }
    const rate = rates[h.currency];
    if (typeof rate !== "number" || rate <= 0) {
      throw new Error(`Missing rate for ${h.currency} — fetch it via /api/zakat/rates first`);
    }
    const rules = methodRules(h, method);
    return {
      ...h,
      value_home: h.amount * rate,
      rate_used: rate,
      rate_source: "ECB / Frankfurter",
      zakatable: rules.zakatable,
      excluded_reason: rules.reason,
    };
  });

  const zakatable_total = valued.reduce((sum, h) => {
    if (!h.zakatable) return sum;
    return h.kind === "liability" ? sum - Math.abs(h.value_home) : sum + h.value_home;
  }, 0);

  const nisab_threshold = nisabGoldGrams * goldPricePerGramHome;
  const netPositive = zakatable_total > 0;
  const nisab_met = netPositive && zakatable_total >= nisab_threshold;

  return {
    method,
    zakatable_total: Math.round(zakatable_total * 100) / 100,
    nisab_threshold: Math.round(nisab_threshold * 100) / 100,
    nisab_met,
    zakat_due: nisab_met ? Math.round(zakatable_total * ZAKAT_RATE * 100) / 100 : 0,
    holdings: valued,
    computed_at: new Date().toISOString(),
    rate_date: new Date().toISOString().slice(0, 10),
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd fxhedge && npx vitest run lib/__tests__/zakat.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add fxhedge/types/zakat.ts fxhedge/lib/zakat.ts fxhedge/lib/__tests__/zakat.test.ts
git commit -m "feat: pure zakat computation core with method differences"
```

---

### Task 2: Rates API route (reuses existing FX layer)

**Files:**
- Create: `fxhedge/app/api/zakat/rates/route.ts`

**Interfaces:**
- Consumes: `fetchLatestRateWithFallback(from, to)` from `fxhedge/lib/fx.ts` (already merged, returns `{ rate, source, date }`); `parsePair` not needed here — currencies come as codes.
- Produces: `GET /api/zakat/rates?currencies=EUR,USD,GBP&home=CAD` → `{ rates: { EUR: 1.6038, ... }, home: "CAD", rate_date: "2026-09-05", sources: { EUR: "ECB / Frankfurter" } }`

- [ ] **Step 1: Write the route**

```ts
// fxhedge/app/api/zakat/rates/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { fetchLatestRateWithFallback } from "@/lib/fx";

/**
 * GET /api/zakat/rates?currencies=EUR,USD,GBP&home=CAD
 * Values each foreign currency in the user's zakat pool at today's
 * reference rate. Reuses the existing FX layer (live + fallback).
 * Zakat must be paid on the VALUE of holdings — which moves daily with FX.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const home = (searchParams.get("home") ?? "CAD").toUpperCase();
  const currencies = (searchParams.get("currencies") ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter((c) => /^[A-Z]{3}$/.test(c) && c !== home)
    .slice(0, 10); // cap: free APIs + sanity

  if (!/^[A-Z]{3}$/.test(home)) {
    return NextResponse.json({ ok: false, error: "Invalid home currency" }, { status: 400 });
  }

  const rates: Record<string, number> = { [home]: 1 };
  const sources: Record<string, string> = { [home]: "home currency" };
  let rateDate = new Date().toISOString().slice(0, 10);

  const results = await Promise.allSettled(
    currencies.map((cur) => fetchLatestRateWithFallback(home, cur).then((r) => ({ cur, r }))),
  );
  for (const res of results) {
    if (res.status === "fulfilled") {
      rates[res.value.cur] = res.value.r.rate;
      sources[res.value.cur] = res.value.r.source;
      rateDate = res.value.r.date;
    }
    // failed currency is simply absent -> computeZakat throws "missing rate"
    // -> the screen shows which currency failed and why. Honest degradation.
  }

  return NextResponse.json(
    { rates, home, sources, rate_date: rateDate },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
  );
}
```

- [ ] **Step 2: Verify with tsc + build**

Run: `cd fxhedge && npx tsc --noEmit && npm run build`
Expected: both pass, `/api/zakat/rates` appears in build output.

- [ ] **Step 3: Live-verify with the dev server**

Run: `cd fxhedge && (npx next dev -p 3116 > /tmp/z.log 2>&1 &) && sleep 6 && curl -s "http://localhost:3116/api/zakat/rates?currencies=EUR,USD&home=CAD" && pkill -f "next dev -p 3116"`
Expected: JSON with `rates.EUR ≈ 1.60` and `rates.USD > 1`, `sources.EUR = "ECB / Frankfurter"`.

- [ ] **Step 4: Commit**

```bash
git add fxhedge/app/api/zakat/rates/route.ts
git commit -m "feat: /api/zakat/rates values holdings at live reference rates"
```

---

### Task 3: Zakat screen — data entry + results + method toggle

**Files:**
- Create: `fxhedge/app/(app)/zakat/page.tsx`
- Create: `fxhedge/components/zakat-holding-list.tsx`
- Create: `fxhedge/components/zakat-result-card.tsx`

**Interfaces:**
- Consumes: `computeZakat` from Task 1; `GET /api/zakat/rates` from Task 2; design tokens from `app/globals.css`.
- Produces: rendered `/zakat` screen (client component; sidebar already links it via Task 4).

- [ ] **Step 1: Build the screen components**

`app/(app)/zakat/page.tsx` — client component with:
- Holdings table (label, kind select, amount, currency select, due_days/doubtful for receivables). Rows are local React state; "Add holding" button; delete per row.
- Method toggle: two tabs — "AAOIFI view" / "Hanafi view" — re-running `computeZakat` on switch. Under the toggle, one line: *"Scholars legitimately differ on receivables timing (AAOIFI Standard No. 9 vs Hanafi practice). This tool shows both — not a fatwa."*
- Nisab inputs: gold price per gram (number input, labeled `user-entered`) with helper text "nisab = 87.48g of gold"; prefill from a sensible default (105.00).
- "Compute" button: fetches `/api/zakat/rates?currencies=<distinct foreign currencies>&home=<home>`, then calls `computeZakat`.
- Results card: **zakat_due** as the hero number (30px bold, KPI-card style per ui-context.md), zakatable pool, nisab status line, per-holding table with `value_home`, rate used + source tag, and excluded rows greyed with their `excluded_reason`.
- "Print scholar summary" button → `window.print()` (Task 4 styles the print view).

`components/zakat-holding-list.tsx` and `components/zakat-result-card.tsx` hold the table + card markup respectively so the page file stays focused. All styling via CSS variables (`bg-surface`, `text-primary`, `border-border`, radius tokens). Every money value uses tabular figures. Loss/excluded states get text labels, never color alone.

- [ ] **Step 2: Verify tsc + build + manual render**

Run: `cd fxhedge && npx tsc --noEmit && npm run build`
Then: `npx next dev -p 3116`, open `http://localhost:3116/zakat`, add the Aisha sample rows (20k CAD cash, 30k CAD inventory, 12k CAD liability, 5000 EUR receivable), toggle both methods, verify: AAOIFI excludes the receivable, Hanafi includes it, hero number changes accordingly, rate source tags show "ECB / Frankfurter". Kill the dev server after.

- [ ] **Step 3: Commit**

```bash
git add fxhedge/app/\(app\)/zakat/page.tsx fxhedge/components/zakat-holding-list.tsx fxhedge/components/zakat-result-card.tsx
git commit -m "feat: zakat screen with live-FX valuation and method toggle"
```

---

### Task 4: Sidebar entry + print stylesheet

**Files:**
- Modify: `fxhedge/components/app-shell.tsx` (sidebar nav groups — add "Zakat" item to "Workspace" group, `h-4 w-4` lucide `Calculator` icon)
- Modify: `fxhedge/app/globals.css` (append `@media print` block)
- Modify: `context/progress-tracker.md` (log the feature)

**Interfaces:**
- Consumes: existing app-shell nav structure.
- Produces: `/zakat` reachable from the sidebar; print view for the scholar summary.

- [ ] **Step 1: Add the sidebar item**

In `app-shell.tsx`, inside the "Workspace" nav array, add `{ href: "/zakat", label: "Zakat calculator", icon: Calculator }` (import from lucide-react). Match the existing item shape exactly.

- [ ] **Step 2: Append print CSS to globals.css**

```css
@media print {
  aside, .no-print { display: none !important; }
  main { max-width: none !important; margin: 0 !important; }
  body { background: white !important; color: black !important; }
  .zakat-summary { border: 1px solid #333 !important; }
}
```

- [ ] **Step 3: Verify + commit**

Run: `cd fxhedge && npx tsc --noEmit && npm run build && npm test`
Expected: all green (38 existing + 8 new tests = 46).

Full clean-up run: `git checkout -b feat/zakat-engine` was created at Task 1 — push and open PR `feat: zakat engine — live-FX business zakat with scholarly method views`, body noting: contract impact none (new types file), live routes verified, 46 tests green. Merge after build passes.

- [ ] **Step 4: Update progress-tracker.md**

Add one line to today's changelog group: "**Zakat Engine shipped** (`feat/zakat-engine`): pure computation + live-FX valuation route + /zakat screen with AAOIFI/Hanafi toggle + print summary — first tool connecting live FX to business zakat."

Then commit: `git commit -am "docs: log zakat engine in progress tracker" && git push`
