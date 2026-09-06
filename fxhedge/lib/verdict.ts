/**
 * lib/verdict.ts — turns the dashboard's numbers into one plain sentence.
 * Pure: no React imports (architecture.md invariant 5).
 *
 * The provider saving is stated first because it is the only certain number
 * on the page; timing is a judgement about a range, never a prediction.
 */

export interface VerdictInput {
  decision: "pay_now" | "wait" | "marginal";
  /** Money separating the best and worst provider, in home currency. */
  savingVsWorst: number;
  /** Extra cost in the historical worst case, in home currency. */
  worstCaseExtra: number;
  bestProvider: string;
  worstProvider: string;
}

export interface Verdict {
  headline: string;
  detail: string;
  tone: "good" | "warn" | "neutral";
}

const money = (n: number) => `$${Math.round(Math.abs(n)).toLocaleString()}`;

const TIMING: Record<VerdictInput["decision"], { detail: string; tone: Verdict["tone"] }> = {
  pay_now: {
    detail: "On timing, pay now looks better than waiting: the rate has already moved against you and history says the downside from here is bigger than the upward move.",
    tone: "warn",
  },
  wait: {
    detail: "On timing, you have room to wait: the rate is in your favour and this pair has been calm over windows like yours.",
    tone: "good",
  },
  marginal: {
    detail: "On timing it is too close to call. If a predictable bill matters more than a slightly cheaper one, pay now.",
    tone: "neutral",
  },
};

export function buildVerdict(input: VerdictInput): Verdict {
  const { decision, savingVsWorst, worstCaseExtra, bestProvider, worstProvider } = input;

  const headline =
    savingVsWorst > 0
      ? `Choosing ${bestProvider} over ${worstProvider} saves you ${money(savingVsWorst)} today.`
      : "Your providers are quoting the same value today.";

  const timing = TIMING[decision];
  const risk =
    worstCaseExtra > 0
      ? ` A rough stretch could add ${money(worstCaseExtra)} before this is due.`
      : "";

  return { headline, detail: timing.detail + risk, tone: timing.tone };
}
