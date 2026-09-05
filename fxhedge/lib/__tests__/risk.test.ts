import { describe, expect, it } from "vitest";
import { computeDrift, decidePayNowOrWait } from "../risk";

describe("computeDrift", () => {
  it("computes % drift from invoice-day to today", () => {
    // invoice day 1.6049, today 1.6038 -> -0.0685%
    expect(computeDrift(1.6049, 1.6038)).toBeCloseTo(-0.0685, 3);
  });
  it("positive when today's rate is higher", () => {
    expect(computeDrift(1.5, 1.65)).toBeCloseTo(10, 3);
  });
  it("handles zero invoice rate", () => {
    expect(computeDrift(0, 1.6)).toBe(0);
  });
});

describe("decidePayNowOrWait", () => {
  it("pay_now when drift strongly against and history volatile", () => {
    const r = decidePayNowOrWait({
      driftTodayPct: 4.0, // rate rose 4% since invoice -> waiting cost you
      worst5pctMove: 3.2,
      worstOnRecord: 9.8,
      histWindows: 2796,
    });
    expect(r.decision).toBe("pay_now");
    expect(r.decision_reason).toMatch(/locked in|waiting|against/i);
  });

  it("wait when drift in your favor and history calm", () => {
    const r = decidePayNowOrWait({
      driftTodayPct: -2.0, // in your favor
      worst5pctMove: 1.0,
      worstOnRecord: 3.0,
      histWindows: 2796,
    });
    expect(r.decision).toBe("wait");
  });

  it("marginal when mixed signals (the Aisha case)", () => {
    const r = decidePayNowOrWait({
      driftTodayPct: -0.1, // tiny, in favor
      worst5pctMove: 3.2, // but 5% of windows moved 3.2%+ against
      worstOnRecord: 9.8,
      histWindows: 2796,
    });
    expect(r.decision).toBe("marginal");
    expect(r.decision_reason).toMatch(/3\.2/); // cites the number
  });

  it("never predicts direction - reason cites history only", () => {
    const r = decidePayNowOrWait({
      driftTodayPct: 0,
      worst5pctMove: 2.0,
      worstOnRecord: 5.0,
      histWindows: 1000,
    });
    expect(r.decision_reason).not.toMatch(/will (rise|fall|go up|go down)/i);
  });
});
