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
