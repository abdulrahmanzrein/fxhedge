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
