import { clsx } from "clsx";
import type { ReactNode } from "react";

const TONE_CLASS = {
  neutral: "text-primary",
  positive: "text-positive",
  negative: "text-negative",
  accent: "text-accent",
} as const;

/**
 * Kpi — the signature element: huge tabular numeral, small muted label.
 * Repeated everywhere; this repetition IS the visual identity.
 * `value` accepts a ReactNode so animated numerals (AnimatedNumber)
 * can live inside a Kpi.
 */
export function Kpi({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "neutral" | "positive" | "negative" | "accent";
}) {
  return (
    <div>
      <div className="text-sm text-muted">{label}</div>
      <div
        className={clsx(
          "tnum mt-1 text-3xl font-semibold tracking-tight",
          TONE_CLASS[tone],
        )}
      >
        {value}
      </div>
      {sub ? <div className="tnum mt-1 text-sm text-muted">{sub}</div> : null}
    </div>
  );
}
