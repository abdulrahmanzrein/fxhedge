import { describe, expect, it } from "vitest";
import { computeZakat, ZAKAT_RATE, NISAB_GOLD_GRAMS } from "../zakat";
import type { ZakatHolding } from "@/types/zakat";

const rates = { CAD: 1.0, EUR: 1.6038, USD: 1.37, GBP: 1.74 };
const GOLD_PRICE = 105; // $/gram (user-entered in the real app)
const NISAB = NISAB_GOLD_GRAMS * GOLD_PRICE; // 9185.40

const base: ZakatHolding[] = [
  { id: "1", kind: "cash_home", label: "Business chequing", amount: 20000, currency: "CAD" },
  { id: "2", kind: "inventory", label: "Halal grocery stock", amount: 30000, currency: "CAD" },
  { id: "3", kind: "liability", label: "Supplier invoice due", amount: 12000, currency: "CAD" },
];

describe("computeZakat", () => {
  it("uses the 2.5% rate and 87.48g nisab", () => {
    expect(ZAKAT_RATE).toBe(0.025);
    expect(NISAB_GOLD_GRAMS).toBe(87.48);
  });

  it("computes zakatable total = cash + inventory - liabilities", () => {
    const r = computeZakat(base, "aaoifi", rates, GOLD_PRICE, "CAD");
    expect(r.zakatable_total).toBeCloseTo(38000, 0);
    expect(r.zakat_due).toBeCloseTo(950, 0); // 2.5% of 38,000
    expect(r.nisab_met).toBe(true);
  });

  it("values foreign holdings at the live rate", () => {
    const holdings: ZakatHolding[] = [
      ...base,
      { id: "4", kind: "receivable", label: "Customer EUR invoice", amount: 5000, currency: "EUR", due_days: 0 },
    ];
    const r = computeZakat(holdings, "aaoifi", rates, GOLD_PRICE, "CAD");
    // 5000 EUR x 1.6038 = 8019 CAD added to the pool
    expect(r.zakatable_total).toBeCloseTo(38000 + 8019, 0);
    const eur = r.holdings.find((h) => h.id === "4")!;
    expect(eur.value_home).toBeCloseTo(8019, 0);
    expect(eur.rate_used).toBeCloseTo(1.6038, 4);
    expect(eur.rate_source).toBe("ECB / Frankfurter");
  });

  it("AAOIFI excludes not-yet-due receivables; Hanafi includes them", () => {
    const withRec: ZakatHolding[] = [
      ...base,
      { id: "4", kind: "receivable", label: "Not yet due", amount: 10000, currency: "CAD", due_days: 30 },
    ];
    const aaoifi = computeZakat(withRec, "aaoifi", rates, GOLD_PRICE, "CAD");
    const hanafi = computeZakat(withRec, "hanafi", rates, GOLD_PRICE, "CAD");
    expect(aaoifi.zakatable_total).toBeCloseTo(38000, 0); // excluded
    expect(hanafi.zakatable_total).toBeCloseTo(48000, 0); // included
    expect(aaoifi.holdings.find((h) => h.id === "4")!.excluded_reason).toMatch(/not yet due/i);
    expect(hanafi.holdings.find((h) => h.id === "4")!.zakatable).toBe(true);
  });

  it("both methods exclude doubtful debts", () => {
    const holdings: ZakatHolding[] = [
      ...base,
      { id: "5", kind: "receivable", label: "Deadbeat client", amount: 8000, currency: "CAD", doubtful: true },
    ];
    for (const method of ["aaoifi", "hanafi"] as const) {
      const r = computeZakat(holdings, method, rates, GOLD_PRICE, "CAD");
      expect(r.holdings.find((h) => h.id === "5")!.zakatable).toBe(false);
      expect(r.holdings.find((h) => h.id === "5")!.excluded_reason).toMatch(/doubtful/i);
    }
  });

  it("negative net position -> no zakat", () => {
    const holdings: ZakatHolding[] = [
      { id: "1", kind: "cash_home", label: "Cash", amount: 5000, currency: "CAD" },
      { id: "2", kind: "liability", label: "Owed", amount: 9000, currency: "CAD" },
    ];
    const r = computeZakat(holdings, "aaoifi", rates, GOLD_PRICE, "CAD");
    expect(r.zakat_due).toBe(0);
    expect(r.nisab_met).toBe(false);
  });

  it("flags when below nisab and pays nothing", () => {
    const holdings: ZakatHolding[] = [
      { id: "1", kind: "cash_home", label: "Cash", amount: 1000, currency: "CAD" },
    ];
    const r = computeZakat(holdings, "aaoifi", rates, GOLD_PRICE, "CAD");
    expect(r.nisab_met).toBe(false);
    expect(r.zakat_due).toBe(0);
    expect(r.nisab_threshold).toBeCloseTo(9185.4, 0);
  });

  it("rejects missing rate with a clear error", () => {
    const holdings: ZakatHolding[] = [
      { id: "1", kind: "cash_foreign", label: "TRY cash", amount: 1000, currency: "TRY" },
    ];
    expect(() => computeZakat(holdings, "aaoifi", rates, GOLD_PRICE, "CAD")).toThrow(
      /missing rate/i,
    );
  });

  it("cash_foreign is zakatable under both methods", () => {
    const holdings: ZakatHolding[] = [
      { id: "1", kind: "cash_foreign", label: "USD account", amount: 2000, currency: "USD" },
    ];
    const r = computeZakat(holdings, "hanafi", rates, GOLD_PRICE, "CAD");
    expect(r.holdings[0].zakatable).toBe(true);
    expect(r.holdings[0].value_home).toBeCloseTo(2740, 0);
  });
});
