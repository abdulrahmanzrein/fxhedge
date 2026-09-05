import { describe, expect, it } from "vitest";
import { normalizeProviders, rankProviders, pickBestAndWorst } from "../providers";

const wise = {
  name: "Wise",
  alias: "wise",
  quotes: [
    {
      rate: 1.6038,
      fee: 52.67,
      receivedAmount: 19195,
      isConsideredMidMarketRate: true,
      markup: 0,
    },
  ],
  logos: {},
};

describe("normalizeProviders", () => {
  it("maps Wise quotes to the ProviderQuote contract", () => {
    const out = normalizeProviders([wise]);
    expect(out).toEqual([
      { name: "Wise", received: 19195, mid_market: true, transfer_fee: 52.67 },
    ]);
  });

  it("dedups by name keeping the best received per provider", () => {
    const dup = {
      name: "Wise",
      alias: "wise",
      quotes: [
        { ...wise.quotes[0], receivedAmount: 19100, sourceCountry: "IE" },
        { ...wise.quotes[0], receivedAmount: 19195, sourceCountry: "SK" },
      ],
      logos: {},
    };
    const out = normalizeProviders([dup, wise]);
    expect(out).toHaveLength(1);
    expect(out[0].received).toBe(19195);
  });

  it("drops providers with no usable quote", () => {
    const broken = { name: "Broken", alias: "broken", quotes: [], logos: {} };
    expect(normalizeProviders([broken, wise])).toHaveLength(1);
  });

  it("handles empty input", () => {
    expect(normalizeProviders([])).toEqual([]);
  });
});

describe("rankProviders", () => {
  it("sorts by received descending", () => {
    const input = [
      { name: "Western Union", received: 19098, mid_market: false },
      { name: "Wise", received: 19195, mid_market: true },
      { name: "Instarem", received: 19158, mid_market: false },
    ];
    expect(rankProviders(input).map((p) => p.name)).toEqual([
      "Wise",
      "Instarem",
      "Western Union",
    ]);
  });
});

describe("pickBestAndWorst", () => {
  it("returns first and last of the ranked list", () => {
    const ranked = rankProviders([
      { name: "A", received: 100, mid_market: false },
      { name: "B", received: 300, mid_market: true },
      { name: "C", received: 200, mid_market: false },
    ]);
    const { best, worst, saving } = pickBestAndWorst(ranked);
    expect(best?.name).toBe("B");
    expect(worst?.name).toBe("A");
    expect(saving).toBe(200);
  });
  it("handles empty list", () => {
    expect(pickBestAndWorst([])).toEqual({ best: null, worst: null, saving: 0 });
  });
});
