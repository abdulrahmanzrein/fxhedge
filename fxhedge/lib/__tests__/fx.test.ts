import { describe, expect, it } from "vitest";
import {
  parsePair,
  addDaysIso,
  toDailyRates,
  computeWorstMoves,
} from "../fx";

describe("parsePair", () => {
  it("parses a valid pair", () => {
    expect(parsePair("EUR-CAD")).toEqual({ from: "EUR", to: "CAD" });
  });
  it("is case-insensitive", () => {
    expect(parsePair("gbp-usd")).toEqual({ from: "GBP", to: "USD" });
  });
  it("rejects wrong shape", () => {
    expect(parsePair("EURCAD")).toBeNull();
    expect(parsePair("")).toBeNull();
    expect(parsePair("EUR-CAD-USD")).toBeNull();
  });
  it("rejects bad currency codes", () => {
    expect(parsePair("EU-CAD")).toBeNull();
    expect(parsePair("EUR-C4D")).toBeNull();
  });
});

describe("addDaysIso", () => {
  it("subtracts days correctly across month boundaries", () => {
    // 2026-03-05 minus 21 days = 2026-02-12
    expect(addDaysIso("2026-03-05", 21)).toBe("2026-02-12");
  });
  it("handles year boundaries", () => {
    expect(addDaysIso("2026-01-05", 10)).toBe("2025-12-26");
  });
  it("zero days is identity", () => {
    expect(addDaysIso("2026-09-05", 0)).toBe("2026-09-05");
  });
});

describe("toDailyRates", () => {
  it("flattens the Frankfurter nested shape and sorts ascending", () => {
    const raw = {
      "2026-01-03": { CAD: 1.61 },
      "2026-01-02": { CAD: 1.6 },
      "2026-01-04": { CAD: 1.62 },
    };
    expect(toDailyRates(raw, "CAD")).toEqual([
      { date: "2026-01-02", rate: 1.6 },
      { date: "2026-01-03", rate: 1.61 },
      { date: "2026-01-04", rate: 1.62 },
    ]);
  });
  it("drops entries missing the target currency", () => {
    const raw = { "2026-01-02": { CAD: 1.6 }, "2026-01-03": {} };
    expect(toDailyRates(raw, "CAD")).toHaveLength(1);
  });
});

describe("computeWorstMoves", () => {
  it("computes forward-looking move percentages over the window", () => {
    const series = [
      { date: "2026-01-01", rate: 1.0 },
      { date: "2026-01-02", rate: 1.1 }, // +10%
      { date: "2026-01-03", rate: 0.99 }, // -10%
      { date: "2026-01-04", rate: 1.05 }, // +5%
    ];
    const result = computeWorstMoves(series, 1);
    expect(result.windows).toBe(3);
    // moves sorted by magnitude descending: 10, -10, 5
    expect(result.moves[0]).toBeCloseTo(10, 5);
    expect(result.moves[1]).toBeCloseTo(-10, 5);
    expect(result.worst5pctMove).toBeCloseTo(10, 5); // 5th percentile of |moves|
    expect(result.worstOnRecord).toBeCloseTo(10, 5);
  });
  it("returns empty stats for insufficient data", () => {
    const result = computeWorstMoves([{ date: "2026-01-01", rate: 1.0 }], 21);
    expect(result.windows).toBe(0);
    expect(result.moves).toHaveLength(0);
    expect(Number.isNaN(result.worst5pctMove)).toBe(true);
  });
  it("skips non-positive rates", () => {
    const series = [
      { date: "2026-01-01", rate: 0 },
      { date: "2026-01-02", rate: 1.0 },
    ];
    expect(computeWorstMoves(series, 1).windows).toBe(0);
  });
});
