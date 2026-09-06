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
