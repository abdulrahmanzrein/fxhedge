import { describe, expect, it } from "vitest";
import { buildVerdict } from "../verdict";

const base = {
  savingVsWorst: 1605,
  worstCaseExtra: 4384,
  bestProvider: "Wise",
  worstProvider: "Skrill",
};

describe("buildVerdict", () => {
  it("leads with the provider saving, which is the certain number", () => {
    const v = buildVerdict({ ...base, decision: "marginal" });
    expect(v.headline).toContain("Wise");
    expect(v.headline).toContain("Skrill");
  });

  it("tells a pay_now user to act now and why", () => {
    const v = buildVerdict({ ...base, decision: "pay_now" });
    expect(v.detail).toMatch(/pay now/i);
    expect(v.tone).toBe("warn");
  });

  it("tells a wait user they have room", () => {
    const v = buildVerdict({ ...base, decision: "wait" });
    expect(v.detail).toMatch(/wait/i);
    expect(v.tone).toBe("good");
  });

  it("calls a marginal decision close rather than recommending", () => {
    const v = buildVerdict({ ...base, decision: "marginal" });
    expect(v.detail).toMatch(/close/i);
    expect(v.tone).toBe("neutral");
  });

  it("never predicts a direction", () => {
    for (const decision of ["pay_now", "wait", "marginal"] as const) {
      const v = buildVerdict({ ...base, decision });
      expect(`${v.headline} ${v.detail}`).not.toMatch(
        /will (rise|fall|drop|climb|strengthen|weaken)/i
      );
    }
  });

  it("omits the saving clause when there is nothing to save", () => {
    const v = buildVerdict({ ...base, decision: "marginal", savingVsWorst: 0 });
    expect(v.headline).not.toContain("Skrill");
  });
});
