# Correspondent Fee Estimate Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Warn the user that bank-wire quotes omit correspondent-bank deductions, and show the sourced range those deductions typically fall in.

**Architecture:** Three layers, each independently testable. The Wise comparison API already returns `type: "bank" | "moneyTransferProvider"` per provider — that is the discriminator, so no hardcoded bank list is needed. `lib/providers.ts` captures it, a new pure module `lib/correspondent-fees.ts` turns it into a labelled range, and the dashboard's provider rows render the warning on bank rows only.

**Tech Stack:** Next.js 16 (App Router), React 19, TypeScript, Vitest.

**Spec:** No separate spec doc. This plan argues from the MuslimHacks brief, Challenge 02 "International Trades" (`~/Downloads/Screenshot 2026-09-06 at 6.33.12 AM.png`), whose opening paragraph is the requirement being implemented:

> "The total can include the exchange-rate spread, transfer fees, **intermediary bank fees and receiving-bank charges**. Some of these costs may only become visible after the payment is completed."

The app currently shows the spread and the transfer fee. It shows nothing for the last two. Focus area 1 is *"Show the real cost: Estimate the exchange-rate, transfer fees and other charges before the business sends money."*

## Sourced figures — do not substitute your own

Every number below was verified against a named source. Use these exact values; do not round, re-derive, or replace them.

| Figure | Value | Source |
| --- | --- | --- |
| Fee deducted per intermediary bank | **US$15–50** | Airwallex, "How to avoid wire transfer fees" — quoted verbatim: *"fees ranging from $15 to $50 per bank"* |
| Incoming/beneficiary bank fee at traditional banks | **US$15–25** | Airwallex, same article |
| Intermediary banks a SWIFT wire passes through | **1–3** | Paystand / Dots, "How long does a wire transfer take" |
| Which providers route through correspondents | `type === "bank"` | Wise Comparison API `providers[].type` |

Derived total, computed in code rather than hardcoded: minimum `1 × 15 + 15 = 30`, maximum `3 × 50 + 25 = 175`.

## Global Constraints

- **Never predict exchange rates.** This feature is about fees, not rates; no copy may imply a rate forecast.
- **Never claim to move money.** Copy must not imply HalalFlow executes payments.
- **State the estimate as an estimate.** The brief accepts incomplete data — *"intermediary-bank fees may not be known until after the transfer"* — so a labelled range with its source is correct. Never present it as a quote or add it into a total as though it were known.
- **Figures are US-dollar denominated** and must be rendered with an explicit `US$` prefix, because SWIFT correspondent fees are typically levied in USD and the user's home currency may not be USD. Never convert them into the home currency — that manufactures precision the source does not have.
- **Only `type === "bank"` providers get the warning.** Money-transfer providers use their own rails and do not route through correspondents; showing it on them would be false.
- **No page may read `MOCK_PROFILE` or `SAMPLE` for user-facing figures.**
- Existing suite must stay green. Current baseline: `npm test` → **70 passed, 6 skipped (76)**.

## File structure

| File | Responsibility | Task |
| --- | --- | --- |
| `types/index.ts` | **Modify.** Add `provider_type` to the `ProviderQuote` contract. | 1 |
| `lib/providers.ts` | **Modify.** Capture `type` from the raw Wise provider. | 1 |
| `lib/__tests__/providers.test.ts` | **Modify.** Cover the new field; fix the exact-shape assertion it will break. | 1 |
| `lib/correspondent-fees.ts` | **Create.** Pure: provider type → labelled range, or null. No React. | 2 |
| `lib/__tests__/correspondent-fees.test.ts` | **Create.** Unit tests for every branch. | 2 |
| `app/(app)/dashboard/page.tsx` | **Modify.** Render the warning on bank rows in the Compare banks card. | 3 |

Tasks 1 and 2 are pure and carry real unit tests. Task 3 is UI with no component-test harness in this codebase — it is verified by reading the DOM in a browser. Do not add a component-test framework as part of this plan.

---

### Task 1: Capture the provider type

**Files:**
- Modify: `types/index.ts`
- Modify: `lib/providers.ts`
- Modify: `lib/__tests__/providers.test.ts`

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `ProviderQuote.provider_type?: "bank" | "moneyTransferProvider"`, populated by `normalizeProviders`. Task 2 and Task 3 both depend on this field existing.

- [ ] **Step 1: Write the failing test**

Add these two cases to `lib/__tests__/providers.test.ts`, inside the existing `describe("normalizeProviders", ...)` block:

```ts
  it("captures the provider type, which decides who routes through correspondents", () => {
    const bank = {
      name: "Barclays",
      alias: "barclays",
      type: "bank",
      quotes: [
        {
          rate: 1.3379905096,
          fee: 0,
          receivedAmount: 60209.57,
          isConsideredMidMarketRate: false,
          markup: 1.05450105,
          dateCollected: "2026-09-04T18:07:51Z",
        },
      ],
      logos: {},
    };
    const [out] = normalizeProviders([bank]);
    expect(out.provider_type).toBe("bank");
  });

  it("leaves provider type undefined when the API does not report one", () => {
    const unknown = {
      name: "Unknown",
      alias: "unknown",
      quotes: [{ rate: 1.6, fee: 0, receivedAmount: 19000 }],
      logos: {},
    };
    const [out] = normalizeProviders([unknown]);
    expect(out.provider_type).toBeUndefined();
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd fxhedge && npx vitest run lib/__tests__/providers.test.ts
```

Expected: the two new tests FAIL — `provider_type` is `undefined` where `"bank"` was expected. **One pre-existing test will also fail**: `"maps Wise quotes to the ProviderQuote contract"` uses `toEqual`, which asserts exact object shape, so it breaks the moment a field is added. That is expected and you fix it in Step 4.

- [ ] **Step 3: Add the field to the contract and the normaliser**

In `types/index.ts`, add to the `ProviderQuote` interface, after `quoted_at`:

```ts
  /** "bank" routes through correspondent banks; "moneyTransferProvider" does not. */
  provider_type?: "bank" | "moneyTransferProvider";
```

In `lib/providers.ts`, add `type` to the raw provider interface:

```ts
interface WiseProvider {
  name?: string;
  alias?: string;
  type?: string;
  quotes?: WiseQuote[];
  logos?: { png?: string[]; svg?: string[] };
}
```

Add the same field to the `NormalizedQuote` interface, after `quoted_at`:

```ts
  provider_type?: "bank" | "moneyTransferProvider";
```

Then inside `normalizeProviders`, in the `candidate` object literal, add after `quoted_at`:

```ts
        // The API tells us who is a bank; a hardcoded list would rot.
        provider_type:
          p.type === "bank" || p.type === "moneyTransferProvider" ? p.type : undefined,
```

- [ ] **Step 4: Fix the exact-shape assertion the new field broke**

In `lib/__tests__/providers.test.ts`, the test `"maps Wise quotes to the ProviderQuote contract"` asserts the full object with `toEqual`. Add the new key to its expected object so the shape matches:

```ts
    expect(out).toEqual([
      {
        name: "Wise",
        received: 19195,
        mid_market: true,
        transfer_fee: 52.67,
        markup_pct: 0,
        quoted_at: undefined,
        provider_type: undefined,
        logo: undefined,
      },
    ]);
```

Keep `toEqual` rather than switching to `toMatchObject` — the strict assertion is what catches contract drift, which is exactly what it just did.

- [ ] **Step 5: Run the tests to verify they pass**

```bash
cd fxhedge && npx vitest run lib/__tests__/providers.test.ts && npx tsc --noEmit
```

Expected: all tests in the file pass; tsc silent.

- [ ] **Step 6: Verify against the live API**

```bash
cd fxhedge && curl -s "http://localhost:3000/api/providers?from=GBP&to=USD&amount=45000" \
 | python3 -c "
import json,sys
for p in json.load(sys.stdin)[:6]:
    print(f\"{p['name'][:16]:16} {p.get('provider_type')}\")"
```

Expected: a mix of `bank` and `moneyTransferProvider` — e.g. HSBC and Barclays as `bank`, Wise and Instarem as `moneyTransferProvider`. If every row prints `None`, the dev server is serving a cached response: restart it (`pkill -f "next dev"; rm -rf .next; npm run dev`) and re-run.

- [ ] **Step 7: Commit**

```bash
cd fxhedge
git add types/index.ts lib/providers.ts lib/__tests__/providers.test.ts
git commit -m "feat(providers): capture whether a provider is a bank

The comparison API reports type per provider. Banks route through correspondent
banks and money-transfer providers do not, which decides who carries fees the
quote cannot see."
```

---

### Task 2: The correspondent fee estimate

**Files:**
- Create: `lib/correspondent-fees.ts`
- Create: `lib/__tests__/correspondent-fees.test.ts`

**Interfaces:**
- Consumes: `ProviderQuote["provider_type"]` from Task 1 — the string union `"bank" | "moneyTransferProvider" | undefined`.
- Produces:
  - `estimateCorrespondentFees(providerType: string | undefined): CorrespondentEstimate | null` from `lib/correspondent-fees.ts`
  - `CorrespondentEstimate = { minUsd: number; maxUsd: number; hopsMin: number; hopsMax: number; source: string }`
  - Constants `PER_HOP_USD`, `BENEFICIARY_USD`, `HOPS`
  - Task 3 imports `estimateCorrespondentFees` and renders `minUsd` / `maxUsd`.

- [ ] **Step 1: Write the failing tests**

Create `lib/__tests__/correspondent-fees.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { estimateCorrespondentFees } from "../correspondent-fees";

describe("estimateCorrespondentFees", () => {
  it("estimates a range for bank wires", () => {
    const e = estimateCorrespondentFees("bank");
    expect(e).not.toBeNull();
    // 1 hop x $15 + $15 beneficiary … 3 hops x $50 + $25 beneficiary
    expect(e!.minUsd).toBe(30);
    expect(e!.maxUsd).toBe(175);
  });

  it("returns null for money transfer providers, which do not use correspondents", () => {
    expect(estimateCorrespondentFees("moneyTransferProvider")).toBeNull();
  });

  it("returns null when the provider type is unknown rather than guessing", () => {
    expect(estimateCorrespondentFees(undefined)).toBeNull();
    expect(estimateCorrespondentFees("somethingElse")).toBeNull();
  });

  it("reports the hop range it assumed", () => {
    const e = estimateCorrespondentFees("bank")!;
    expect(e.hopsMin).toBe(1);
    expect(e.hopsMax).toBe(3);
  });

  it("carries a named source so the figure can be attributed in the UI", () => {
    const e = estimateCorrespondentFees("bank")!;
    expect(e.source).toMatch(/Airwallex/);
  });

  it("never returns an inverted or zero range", () => {
    const e = estimateCorrespondentFees("bank")!;
    expect(e.minUsd).toBeGreaterThan(0);
    expect(e.maxUsd).toBeGreaterThan(e.minUsd);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

```bash
cd fxhedge && npx vitest run lib/__tests__/correspondent-fees.test.ts
```

Expected: FAIL — `Failed to resolve import "../correspondent-fees"`.

- [ ] **Step 3: Write the implementation**

Create `lib/correspondent-fees.ts`:

```ts
/**
 * lib/correspondent-fees.ts — the cost a bank wire carries that its quote
 * cannot show. Pure: no React imports (architecture.md invariant 5).
 *
 * A SWIFT wire is handed between correspondent banks, and each one may deduct
 * a "lifting fee" in flight. Nobody publishes these per-route, so this is a
 * sourced RANGE and is labelled as such in the UI — never added into a total
 * as though it were quoted.
 *
 * Figures are US dollars because correspondent fees are typically levied in
 * USD. They are deliberately not converted to the user's home currency: that
 * would manufacture precision the source does not have.
 */

/** Deducted by each intermediary bank. Source: Airwallex. */
export const PER_HOP_USD = { min: 15, max: 50 } as const;

/** Charged by the receiving bank on arrival. Source: Airwallex. */
export const BENEFICIARY_USD = { min: 15, max: 25 } as const;

/** Intermediary banks a SWIFT wire typically passes through. Source: Paystand. */
export const HOPS = { min: 1, max: 3 } as const;

const SOURCE = "Airwallex; hop count per Paystand";

export interface CorrespondentEstimate {
  minUsd: number;
  maxUsd: number;
  hopsMin: number;
  hopsMax: number;
  source: string;
}

/**
 * Returns null for anything that is not a bank — money-transfer providers run
 * their own rails, so claiming correspondent fees for them would be false.
 */
export function estimateCorrespondentFees(
  providerType: string | undefined,
): CorrespondentEstimate | null {
  if (providerType !== "bank") return null;

  return {
    minUsd: HOPS.min * PER_HOP_USD.min + BENEFICIARY_USD.min,
    maxUsd: HOPS.max * PER_HOP_USD.max + BENEFICIARY_USD.max,
    hopsMin: HOPS.min,
    hopsMax: HOPS.max,
    source: SOURCE,
  };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

```bash
cd fxhedge && npx vitest run lib/__tests__/correspondent-fees.test.ts && npx tsc --noEmit
```

Expected: PASS, 6 tests; tsc silent.

- [ ] **Step 5: Run the whole suite**

```bash
cd fxhedge && npm test
```

Expected: `Tests 77 passed | 6 skipped (83)` — 70 baseline + 1 from Task 1 + 6 here. If Task 1 has not run yet, you will see 76; stop and run Task 1 first.

- [ ] **Step 6: Commit**

```bash
cd fxhedge
git add lib/correspondent-fees.ts lib/__tests__/correspondent-fees.test.ts
git commit -m "feat: estimate the correspondent fees a bank quote cannot show

A SWIFT wire is handed between correspondent banks and each may deduct a
lifting fee in flight. Sourced range rather than a quote, US-denominated,
null for anyone who is not a bank."
```

---

### Task 3: Warn on bank rows in the Compare banks card

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

**Interfaces:**
- Consumes: `estimateCorrespondentFees` from `lib/correspondent-fees.ts` (Task 2) and `p.provider_type` on each provider (Task 1).
- Produces: nothing other tasks depend on.

- [ ] **Step 1: Import the estimator**

In `app/(app)/dashboard/page.tsx`, add beside the other `@/lib` imports at the top:

```tsx
import { estimateCorrespondentFees } from "@/lib/correspondent-fees";
```

- [ ] **Step 2: Render the warning inside the provider row**

In the Compare banks card, each provider renders a `<li>` whose last child is a `<div className="text-[11px] leading-relaxed text-[var(--color-muted-fg)]">` containing the "Costs you … vs mid market" copy and the quote-age note. Immediately **after** that closing `</div>` — still inside the `<li>` — add:

```tsx
                  {(() => {
                    const est = estimateCorrespondentFees(p.provider_type);
                    if (!est) return null;
                    return (
                      <p
                        className="text-[11px] leading-relaxed"
                        style={{ color: "var(--color-warning)" }}
                      >
                        Bank wire — your supplier may receive US${est.minUsd}–{est.maxUsd} less
                        than shown. It passes through {est.hopsMin}–{est.hopsMax} correspondent
                        banks, each deducting a fee the quote cannot see.
                      </p>
                    );
                  })()}
```

- [ ] **Step 3: Add the sourcing footnote under the list**

The Compare banks card ends with the provider `<ul>`. Immediately after that `</ul>`, still inside the card `<section>`, add:

```tsx
          <p className="mt-3 shrink-0 border-t border-[var(--color-border)] pt-3 text-[10.5px] leading-relaxed text-[var(--color-dim)]">
            Correspondent estimates are a published range, not a quote —
            US${PER_HOP_USD.min}–{PER_HOP_USD.max} per intermediary bank plus a
            US${BENEFICIARY_USD.min}–{BENEFICIARY_USD.max} receiving fee. These are
            not knowable before the transfer completes. Source: Airwallex.
          </p>
```

Extend the import from Step 1 so those constants are available:

```tsx
import {
  estimateCorrespondentFees,
  PER_HOP_USD,
  BENEFICIARY_USD,
} from "@/lib/correspondent-fees";
```

- [ ] **Step 4: Typecheck and run the suite**

```bash
cd fxhedge && npx tsc --noEmit && npm test
```

Expected: tsc silent; `Tests 77 passed | 6 skipped (83)`.

- [ ] **Step 5: Verify in the browser**

Ensure the dev server is running and you are signed in, then load `/dashboard` and run in the console:

```js
[...document.querySelectorAll('li')]
  .map(li => li.innerText.replace(/\s+/g, ' ').trim())
  .filter(t => t.includes('mid market'))
  .slice(0, 6)
```

Expected: rows for banks (HSBC, Barclays, and similar) include "Bank wire — your supplier may receive US$30–175 less than shown". Rows for Wise, Instarem and other money-transfer providers **must not** contain that sentence. If it appears on Wise, the `provider_type` guard is wrong — fix before committing.

Then confirm the footnote renders exactly once:

```js
document.body.innerText.split('Correspondent estimates are a published range').length - 1
```

Expected: `1`.

- [ ] **Step 6: Check the card did not overflow**

The Compare banks card is inside a fixed-height grid (`lg:h-[calc(100dvh-4.75rem)]`), and this adds a line to roughly half the rows. Confirm the list still scrolls rather than clipping:

```js
const ul = [...document.querySelectorAll('ul')].find(u => u.scrollHeight > u.clientHeight + 2);
({ scrollable: !!ul, hidden: ul ? ul.scrollHeight - ul.clientHeight : 0 })
```

Expected: `scrollable: true` with a positive `hidden` value — the list scrolls, as it did before. If `scrollable` is false and rows are visually cut off, the fix is to confirm the `<ul>` still carries `flex-1 min-h-0 overflow-y-auto`; do not remove the card's height constraint.

- [ ] **Step 7: Commit**

```bash
cd fxhedge
git add "app/(app)/dashboard/page.tsx"
git commit -m "feat(dashboard): flag the correspondent fees bank quotes omit

The brief's opening claim is that intermediary and receiving-bank charges only
become visible after a payment completes. Bank rows now say so, with a sourced
range, while money-transfer providers correctly show nothing."
```

---

## Self-review

**1. Spec coverage.** The brief's focus area 1 asks for exchange-rate, transfer fees *and other charges* before sending. Spread and transfer fee already ship; this plan adds intermediary and receiving-bank charges — Task 3 renders them, Task 2 computes them, Task 1 supplies the discriminator. The constraint *"some data will be incomplete… intermediary-bank fees may not be known until after the transfer"* is honoured by presenting a labelled range with its source and never folding it into a total. The constraint *"do not predict exchange rates"* is untouched: nothing here concerns rates.

**2. Placeholder scan.** No TBDs. Every code step carries literal code. Every figure traces to the sourced-figures table. Task 3 Step 2 describes an insertion point by its surrounding markup rather than a line number, because Tasks 1–2 do not change this file but earlier work in the repo may have shifted line numbers — the anchor text is unique within the file.

**3. Type consistency.** `estimateCorrespondentFees` and `CorrespondentEstimate` are named identically in the test (Task 2 Step 1), the implementation (Step 3), and the consumer (Task 3 Step 2). Field names `minUsd`, `maxUsd`, `hopsMin`, `hopsMax`, `source` match across all three. `provider_type` is spelled the same in `types/index.ts`, `lib/providers.ts`, its tests, and Task 3's guard. `PER_HOP_USD` and `BENEFICIARY_USD` are exported in Task 2 and imported in Task 3 Step 3.

**4. Ordering.** Task 2 depends on Task 1 only for the runtime value of `provider_type`; its unit tests pass a string directly, so it compiles and tests independently. Task 3 depends on both. Run 1 → 2 → 3. Task 2 Step 5's expected count of 77 assumes Task 1 has run, and says so.

**5. Known trap.** Task 1 will break the pre-existing `toEqual` shape assertion in `providers.test.ts` the moment the field is added. This happened once already in this repo for the same reason. Step 2 predicts it and Step 4 fixes it, so an implementer does not mistake it for a regression.
