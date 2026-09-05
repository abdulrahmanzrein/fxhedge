import { describe, expect, it } from "vitest";
import {
  fetchLatestRate,
  fetchRateOnDate,
  fetchLatestRateWithFallback,
  parsePair,
} from "../fx";
import { fetchProviderQuotes } from "../providers";

/**
 * Live smoke tests — hit the REAL Frankfurter / BoC / Wise APIs.
 * Gated: skipped unless LIVE=1. Run with:  LIVE=1 npm test -- fx-live
 */
const live = process.env.LIVE === "1";

describe.skipIf(!live)("live FX + provider APIs", () => {
  it("Frankfurter latest returns a plausible EUR-CAD rate", async () => {
    const { rate, source } = await fetchLatestRate("EUR", "CAD");
    expect(source).toBe("ECB / Frankfurter");
    expect(rate).toBeGreaterThan(1);
    expect(rate).toBeLessThan(3);
  });

  it("Frankfurter historical returns the invoice-day rate", async () => {
    const rate = await fetchRateOnDate("EUR", "CAD", "2026-08-15");
    expect(rate).toBeGreaterThan(1);
    expect(rate).toBeLessThan(3);
  });

  it("Bank of Canada fallback parses string-valued observations", async () => {
    // BoC returns v as a string ("1.6075") — regression guard.
    const res = await fetch(
      "https://www.bankofcanada.ca/valet/observations/FXEURCAD/json?recent=1",
    );
    const json = (await res.json()) as {
      observations?: { FXEURCAD?: { v?: string | number } }[];
    };
    const raw = json.observations?.at(-1)?.FXEURCAD?.v;
    const rate = typeof raw === "number" ? raw : Number(raw);
    expect(Number.isFinite(rate)).toBe(true);
    expect(rate).toBeGreaterThan(1);
  });

  it("fallback path returns a rate when asked for a BoC-native pair", async () => {
    // GBP-CAD is also a BoC series (FXGBPCAD) — exercises fetchBoCFallback.
    const { rate, source } = await fetchLatestRateWithFallback("GBP", "CAD");
    expect(rate).toBeGreaterThan(0.5);
    expect(rate).toBeLessThan(5);
    expect(["ECB / Frankfurter", "Bank of Canada Valet"]).toContain(source);
  });

  it("Wise returns ranked real providers for EUR-CAD 12000", async () => {
    const quotes = await fetchProviderQuotes("EUR", "CAD", 12000);
    expect(quotes.length).toBeGreaterThan(3);
    for (let i = 1; i < quotes.length; i++) {
      expect(quotes[i - 1].received).toBeGreaterThanOrEqual(quotes[i].received);
    }
    expect(quotes.some((q) => q.name === "Wise")).toBe(true);
  });

  it("parsePair contract sanity", () => {
    expect(parsePair("EUR-CAD")?.to).toBe("CAD");
    expect(parsePair("garbage")).toBeNull();
  });
});
