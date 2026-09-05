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
