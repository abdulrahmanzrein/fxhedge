# Natural Hedge Detector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`-` ) syntax for tracking.

**Goal:** Scan the user's saved scenarios for opposite-direction flows in the same currency (a EUR payable + a EUR receivable) and tell them: "you already own the currency you need — net them against each other, skip the conversion entirely." The cheapest, most Sharia-preferred hedge that no competitor surfaces for small businesses.

**Architecture:** One pure matching module (`lib/natural-hedge.ts`) that nets currency exposures across the user's scenarios and produces match suggestions; one API route (`GET /api/natural-hedge`) reading the user's scenarios via the existing RLS-enforced Supabase client; one dashboard panel (`components/natural-hedge-card.tsx`) that renders matches or an all-clear. No new data sources, no new dependencies.

**Tech Stack:** Existing stack only — Next.js App Router, TypeScript strict, vitest, existing `lib/supabase/server.ts` client, `scenarios` table (columns: `amount`, `pair`, `user_id`), design tokens.

**Spec:** `context/PRD.md` (FR-5 sharia options — natural hedging is one of the three compliant structures; golden constraints), `context/BUILD-GUIDE.md` §5 Screen 8 (natural hedge panel copy), `context/architecture.md` (pure-lib invariant 5, invariants 1–4), `context/progress-tracker.md` (locked contract in `fxhedge/types/index.ts` — `Scenario` shape).

## Global Constraints

- Hedged never moves money or executes anything — the detector only *suggests* netting; execution stays with the owner's bank (architecture.md invariant 1).
- Never predict rate direction (challenge rule).
- Natural-hedge guidance is educational, not a fatwa — include the "confirm with your scholar" line (architecture.md invariant 4).
- Computation pure, no React/Next imports in `lib/` (architecture.md invariant 5).
- Auth: reads only the signed-in user's scenarios; RLS + `supabase.auth.getUser()` gate (PRD FR-7).
- TypeScript strict; conventional commits; `npm run build` green before PR; feature branch → squash-merge.

---

### Task 1: Pure netting + match engine

**Files:**
- Create: `fxhedge/lib/natural-hedge.ts`
- Test: `fxhedge/lib/__tests__/natural-hedge.test.ts`

**Interfaces:**
- Consumes: nothing (pure module).
- Produces (used by Tasks 2–3):

```ts
export type FlowDirection = "outgoing" | "incoming";

export interface CurrencyFlow {
  id: string;              // scenario id (or any stable id)
  currency: string;        // foreign currency, e.g. "EUR"
  amount: number;          // positive, in the foreign currency
  direction: FlowDirection; // outgoing = you must pay; incoming = you will receive
  label: string;           // human description, e.g. "Turkish supplier invoice"
}

export interface HedgeMatch {
  currency: string;
  netted_amount: number;       // foreign units that no longer need conversion
  outgoing_ids: string[];
  incoming_ids: string[];
  suggestion: string;          // plain-English action
}

export interface NaturalHedgeResult {
  matches: HedgeMatch[];
  unmatched: CurrencyFlow[];   // exposures still needing conversion
  summary: string;             // one-line dashboard verdict
  disclaimer: string;          // scholar line (constant)
}

export function detectNaturalHedges(flows: CurrencyFlow[]): NaturalHedgeResult

export const NATURAL_HEDGE_DISCLAIMER: string;
```

- [ ] **Step 1: Write the failing tests**

```ts
// fxhedge/lib/__tests__/natural-hedge.test.ts
import { describe, expect, it } from "vitest";
import { detectNaturalHedges, NATURAL_HEDGE_DISCLAIMER } from "../natural-hedge";
import type { CurrencyFlow } from "../natural-hedge";

const flows: CurrencyFlow[] = [
  { id: "a", currency: "EUR", amount: 12000, direction: "outgoing", label: "Turkish supplier" },
  { id: "b", currency: "EUR", amount: 5000, direction: "incoming", label: "German customer" },
  { id: "c", currency: "USD", amount: 8000, direction: "outgoing", label: "US supplier" },
];

describe("detectNaturalHedges", () => {
  it("nets same-currency opposite flows", () => {
    const r = detectNaturalHedges(flows);
    expect(r.matches).toHaveLength(1);
    const m = r.matches[0];
    expect(m.currency).toBe("EUR");
    expect(m.netted_amount).toBe(5000); // min(12000, 5000) nets out
    expect(m.outgoing_ids).toEqual(["a"]);
    expect(m.incoming_ids).toEqual(["b"]);
    expect(m.suggestion).toMatch(/5,000 EUR/i);
  });

  it("leaves unmatched exposures listed", () => {
    const r = detectNaturalHedges(flows);
    expect(r.unmatched).toHaveLength(1); // the USD 8000 outgoing
    expect(r.unmatched[0].currency).toBe("USD");
  });

  it("summary mentions remaining exposure when unmatched exist", () => {
    const r = detectNaturalHedges(flows);
    expect(r.summary).toMatch(/8,000 USD/);
  });

  it("all-clear summary when everything nets", () => {
    const r = detectNaturalHedges([
      { id: "a", currency: "EUR", amount: 5000, direction: "outgoing", label: "pay" },
      { id: "b", currency: "EUR", amount: 5000, direction: "incoming", label: "receive" },
    ]);
    expect(r.matches).toHaveLength(1);
    expect(r.unmatched).toHaveLength(0);
    expect(r.summary).toMatch(/fully/i);
  });

  it("no matches when flows are one-directional", () => {
    const r = detectNaturalHedges([
      { id: "a", currency: "EUR", amount: 9000, direction: "outgoing", label: "pay" },
      { id: "b", currency: "USD", amount: 4000, direction: "outgoing", label: "pay2" },
    ]);
    expect(r.matches).toHaveLength(0);
    expect(r.unmatched).toHaveLength(2);
  });

  it("ignores zero-amount flows", () => {
    const r = detectNaturalHedges([
      { id: "a", currency: "EUR", amount: 0, direction: "outgoing", label: "empty" },
    ]);
    expect(r.matches).toHaveLength(0);
    expect(r.unmatched).toHaveLength(0);
  });

  it("always includes the scholar disclaimer", () => {
    const r = detectNaturalHedges([]);
    expect(r.disclaimer).toBe(NATURAL_HEDGE_DISCLAIMER);
    expect(NATURAL_HEDGE_DISCLAIMER).toMatch(/scholar/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd fxhedge && npx vitest run lib/__tests__/natural-hedge.test.ts`
Expected: FAIL — "Cannot find module '../natural-hedge'"

- [ ] **Step 3: Write minimal implementation**

```ts
// fxhedge/lib/natural-hedge.ts
/**
 * lib/natural-hedge.ts — finds opposite-direction flows in the same currency
 * and suggests netting them instead of converting twice.
 * "Natural hedging" is one of the three Sharia-compliant structures (PRD FR-5)
 * and the cheapest: no contract, no conversion, no fee.
 * Pure: no React/Next imports. Suggestions only — we never execute anything.
 */
export type FlowDirection = "outgoing" | "incoming";

export interface CurrencyFlow {
  id: string;
  currency: string;
  amount: number;
  direction: FlowDirection;
  label: string;
}

export interface HedgeMatch {
  currency: string;
  netted_amount: number;
  outgoing_ids: string[];
  incoming_ids: string[];
  suggestion: string;
}

export interface NaturalHedgeResult {
  matches: HedgeMatch[];
  unmatched: CurrencyFlow[];
  summary: string;
  disclaimer: string;
}

export const NATURAL_HEDGE_DISCLAIMER =
  "Netting flows avoids conversion but is still a settlement decision — confirm the arrangement with your scholar and keep both invoices documented.";

export function detectNaturalHedges(flows: CurrencyFlow[]): NaturalHedgeResult {
  const usable = flows.filter((f) => f.amount > 0);
  const matches: HedgeMatch[] = [];
  const used = new Set<string>();

  const byCurrency = new Map<string, CurrencyFlow[]>();
  for (const f of usable) {
    const list = byCurrency.get(f.currency) ?? [];
    list.push(f);
    byCurrency.set(f.currency, list);
  }

  for (const [currency, list] of byCurrency) {
    const outgoing = list.filter((f) => f.direction === "outgoing");
    const incoming = list.filter((f) => f.direction === "incoming");
    if (outgoing.length === 0 || incoming.length === 0) continue;

    const outTotal = outgoing.reduce((s, f) => s + f.amount, 0);
    const inTotal = incoming.reduce((s, f) => s + f.amount, 0);
    const netted = Math.min(outTotal, inTotal);

    for (const f of outgoing) used.add(f.id);
    for (const f of incoming) used.add(f.id);

    matches.push({
      currency,
      netted_amount: Math.round(netted * 100) / 100,
      outgoing_ids: outgoing.map((f) => f.id),
      incoming_ids: incoming.map((f) => f.id),
      suggestion:
        netted >= Math.max(outTotal, inTotal)
          ? `Your ${currency} flows fully cover each other (${netted.toLocaleString()} ${currency}) — settle them against each other and skip the FX conversion entirely.`
          : `Net ${netted.toLocaleString()} ${currency} of these flows against each other before converting the remainder — you avoid paying the spread and fees on that amount twice.`,
    });
  }

  const unmatched = usable.filter((f) => !used.has(f.id));
  const remaining = unmatched
    .filter((f) => f.direction === "outgoing")
    .reduce((s, f) => s + f.amount, 0);

  const summary =
    matches.length === 0
      ? remaining > 0
        ? `No natural hedge found — ${remaining.toLocaleString()} of foreign-currency payments still need a conversion decision.`
        : "No foreign-currency exposure to hedge right now."
      : unmatched.length === 0
        ? `Good news: your ${currencyList(matches)} flows net against each other — you may not need to convert anything.`
        : `You can naturally hedge ${matchesSummary(matches)} — but ${remaining.toLocaleString()} of other foreign payments still need attention.`;

  return { matches, unmatched, summary, disclaimer: NATURAL_HEDGE_DISCLAIMER };
}

function matchesSummary(matches: HedgeMatch[]): string {
  return matches.map((m) => `${m.netted_amount.toLocaleString()} ${m.currency}`).join(" + ");
}

function currencyList(matches: HedgeMatch[]): string {
  return matches.map((m) => m.currency).join(" and ");
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd fxhedge && npx vitest run lib/__tests__/natural-hedge.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add fxhedge/lib/natural-hedge.ts fxhedge/lib/__tests__/natural-hedge.test.ts
git commit -m "feat: natural hedge netting engine"
```

---

### Task 2: API route over the user's scenarios

**Files:**
- Create: `fxhedge/app/api/natural-hedge/route.ts`

**Interfaces:**
- Consumes: `createClient` from `fxhedge/lib/supabase/server.ts` (merged; returns Supabase server client); `detectNaturalHedges` from Task 1; `scenarios` table (`pair` column format `"EUR-CAD"` — the base currency is the foreign exposure, `to` is home).
- Produces: `GET /api/natural-hedge` → `{ matches, unmatched, summary, disclaimer }` (NaturalHedgeResult); 401 when signed out.

- [ ] **Step 1: Write the route**

```ts
// fxhedge/app/api/natural-hedge/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { detectNaturalHedges, type CurrencyFlow } from "@/lib/natural-hedge";

/**
 * GET /api/natural-hedge
 * Reads the signed-in user's saved scenarios and looks for same-currency
 * opposite flows (a EUR payable + a EUR receivable = net them, skip FX).
 * Read-only, RLS-enforced, suggestion-only — we never execute anything.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data: scenarios, error } = await supabase
    .from("scenarios")
    .select("id, amount, pair, label")
    .eq("user_id", user.id);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  // A scenario "EUR-CAD" with an invoice due = outgoing EUR.
  // A scenario marked as incoming (label convention "[in]") = incoming EUR.
  // (Keep it honest and simple: direction comes from a label prefix until
  // a dedicated column exists. Documented for Dev 2 + the demo.)
  const flows: CurrencyFlow[] = (scenarios ?? []).map((s) => ({
    id: s.id,
    currency: s.pair.slice(0, 3),
    amount: Number(s.amount),
    direction: s.label?.startsWith("[in]") ? "incoming" : "outgoing",
    label: s.label ?? "Scenario",
  }));

  return NextResponse.json(detectNaturalHedges(flows));
}
```

- [ ] **Step 2: Verify with tsc + build**

Run: `cd fxhedge && npx tsc --noEmit && npm run build`
Expected: both pass; `/api/natural-hedge` in build output.

- [ ] **Step 3: Commit**

```bash
git add fxhedge/app/api/natural-hedge/route.ts
git commit -m "feat: /api/natural-hedge scans scenarios for same-currency netting"
```

---

### Task 3: Dashboard panel component

**Files:**
- Create: `fxhedge/components/natural-hedge-card.tsx`

**Interfaces:**
- Consumes: `GET /api/natural-hedge` payload (`matches`, `unmatched`, `summary`, `disclaimer`).
- Produces: `NaturalHedgeCard` — self-contained client component, no props, drop-in for the dashboard.

- [ ] **Step 1: Write the component**

```tsx
// fxhedge/components/natural-hedge-card.tsx
"use client";

import { useEffect, useState } from "react";

interface HedgeMatch {
  currency: string;
  netted_amount: number;
  suggestion: string;
}
interface HedgePayload {
  matches: HedgeMatch[];
  unmatched: { currency: string; amount: number; label: string }[];
  summary: string;
  disclaimer: string;
}

export function NaturalHedgeCard() {
  const [data, setData] = useState<HedgePayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch("/api/natural-hedge")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  if (error)
    return (
      <div className="rounded-lg border border-border bg-surface p-6 text-sm text-error">
        Could not scan for natural hedges: {error}
      </div>
    );
  if (!data) return null; // stays invisible until scenarios exist

  return (
    <section
      aria-label="Natural hedge detector"
      className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-6"
    >
      <div>
        <p className="text-xs uppercase tracking-wide text-text-muted">
          Natural hedge detector
        </p>
        <p className="text-sm font-medium">{data.summary}</p>
      </div>
      {data.matches.map((m) => (
        <div
          key={m.currency}
          className="rounded-md border border-border bg-surface-2 p-3 text-sm"
        >
          <span className="font-semibold">
            {m.netted_amount.toLocaleString()} {m.currency}
          </span>{" "}
          nets against opposite flows — {m.suggestion}
        </div>
      ))}
      {data.unmatched.length > 0 && (
        <ul className="list-inside list-disc text-xs text-text-muted">
          {data.unmatched.map((u) => (
            <li key={u.label}>
              {u.label}: {u.amount.toLocaleString()} {u.currency} — no offsetting flow
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-text-faint">{data.disclaimer}</p>
    </section>
  );
}
```

- [ ] **Step 2: Verify tsc + build**

Run: `cd fxhedge && npx tsc --noEmit && npm run build`
Expected: both pass.

- [ ] **Step 3: Commit**

```bash
git add fxhedge/components/natural-hedge-card.tsx
git commit -m "feat: natural hedge dashboard card"
```

---

### Task 4: Suite green + PR

**Files:**
- Test: full suite. Optionally wire `NaturalHedgeCard` into the dashboard if it exists (same pattern as the breakeven plan Task 4 — skip and note in PR if not).

- [ ] **Step 1: Run everything**

Run: `cd fxhedge && npx tsc --noEmit && npm test && npm run build`
Expected: all green.

- [ ] **Step 2: PR**

```bash
git push -u origin feat/natural-hedge-detector
gh pr create --base main --head feat/natural-hedge-detector \
  --title "feat: natural hedge detector — net same-currency flows, skip FX" \
  --body-file - <<'EOF'
**What:** Scans saved scenarios for opposite same-currency flows and suggests netting them (the cheapest, most Sharia-preferred hedge). Contract impact: none.
**Builds:** tsc clean, build green, full suite green (+7 tests).
**Checked against:** unit fixtures; route is RLS-enforced (401 unauth), read-only, suggestion-only (never executes — invariant 1).
Direction convention: scenarios labeled "[in]" are incoming flows (documented in route).

🤖 Generated with Codebuff
EOF
```

- [ ] **Step 3: Update progress-tracker.md**

Append one line to today's changelog: "**Natural Hedge Detector shipped** (`feat/natural-hedge-detector`): `lib/natural-hedge.ts` + `/api/natural-hedge` + dashboard card — finds same-currency netting the owner would otherwise miss."
