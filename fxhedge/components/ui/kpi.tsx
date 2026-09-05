import { clsx } from "clsx";

const TONE_CLASS = {
  neutral: "text-primary",
  positive: "text-positive",
  negative: "text-negative",
  accent: "text-accent",
} as const;

/**
 * Kpi — the signature element: huge tabular numeral, small muted label.
 * Repeated everywhere; this repetition IS the visual identity.
 */
export function Kpi({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
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
